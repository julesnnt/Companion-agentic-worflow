"""
Chat route — persona-aware conversational AI with guardrails.
"""

from __future__ import annotations
from typing import Optional
from fastapi import APIRouter, HTTPException
from models.schemas import ChatRequest, ChatResponse
from ethics.guardrails import apply_guardrails, check_emergency, build_emergency_response
from agents.emotionalSupport import get_emotional_context
from services.llm_service import call_llm_with_history, is_demo_mode

router = APIRouter()

# Persona definitions — injected into system prompts
PERSONAS = {
    "robert": {
        "name": "Robert",
        "title": "Administrative Expert",
        "system": (
            "You are Robert, an administrative healthcare assistant with expertise in "
            "medical paperwork, appointments, insurance, and hospital processes. "
            "You are calm, structured, and highly organised. "
            "You help patients navigate the administrative side of healthcare clearly and efficiently. "
            "You do NOT give clinical advice — always direct clinical questions to the physician."
        ),
    },
    "luna": {
        "name": "Luna",
        "title": "Emotional Support Companion",
        "system": (
            "You are Luna, a warm and empathetic emotional support companion. "
            "You listen deeply, validate feelings, and offer gentle reassurance to patients "
            "navigating their health journey. "
            "You never minimise concerns, but always keep a calm, hopeful tone. "
            "If someone appears in crisis, you provide crisis resources and urge them to seek help. "
            "You do NOT diagnose or give clinical recommendations."
        ),
    },
    "atlas": {
        "name": "Atlas",
        "title": "Clinical Information Analyst",
        "system": (
            "You are Atlas, a precise and knowledgeable clinical information analyst. "
            "You explain medical terms, findings, and procedures in accurate, evidence-based language. "
            "You present information clearly and factually, always hedged appropriately — "
            "never making definitive diagnoses or contradicting the treating physician. "
            "You are the 'smart, trustworthy explainer' persona."
        ),
    },
    "nova": {
        "name": "Nova",
        "title": "Recovery & Wellness Coach",
        "system": (
            "You are Nova, an energetic and motivational recovery coach. "
            "You help patients stay positive, set recovery goals, celebrate small wins, "
            "and maintain healthy habits during their healing journey. "
            "You are enthusiastic, action-oriented, and encouraging. "
            "You focus on lifestyle, exercise, nutrition, and mindset — never clinical decisions."
        ),
    },
}

SHARED_CONSTRAINTS = (
    "\n\nCRITICAL CONSTRAINTS (non-negotiable):\n"
    "- NEVER state a definitive diagnosis.\n"
    "- NEVER contradict the treating physician or official medical report.\n"
    "- NEVER claim medical certainty (avoid 'definitely', 'certainly', 'you have X').\n"
    "- ALWAYS recommend consulting the physician for clinical decisions.\n"
    "- If the patient describes emergency symptoms, immediately provide emergency resources.\n"
    "- Keep responses concise (under 250 words) and focused.\n"
    "- End every response with a brief reminder to consult their care team when relevant.\n"
)


def _build_system_prompt(persona_id: str, report_context: Optional[dict]) -> str:
    persona = PERSONAS.get(persona_id, PERSONAS["atlas"])
    prompt = persona["system"] + SHARED_CONSTRAINTS
    if report_context:
        prompt += (
            f"\n\nPATIENT CONTEXT (from medical report):\n"
            f"Modality: {report_context.get('modality', 'Not provided')}\n"
            f"Impression: {report_context.get('impression', 'Not provided')}\n"
            f"Urgency: {report_context.get('urgency', 'Not provided')}\n"
            f"Recommendations: {', '.join(report_context.get('recommendations', []))}\n"
            "Use this context to give relevant, grounded responses — but do not add to it."
        )
    return prompt


@router.post("/", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """Send a message to the COMPANION chat system."""
    try:
        # Emotional context check (async, non-blocking for guardrails)
        emotional = await get_emotional_context(req.message)

        # Emergency short-circuit
        if check_emergency(req.message) or emotional.get("is_crisis"):
            crisis_resp = emotional.get("crisis_response", "")
            return ChatResponse(
                message=crisis_resp or build_emergency_response(),
                persona_id=req.persona_id,
                emergency=True,
                risk_assessment={"risk_level": "high", "notify_physician": True},
            )

        # Build message history
        history = list(req.history)  # copy
        # Prepend emotional prefix to user message if available
        user_msg = req.message
        prefix = emotional.get("suggested_prefix", "")

        history.append({"role": "user", "content": user_msg})

        system_prompt = _build_system_prompt(req.persona_id, req.report_context)

        if is_demo_mode():
            persona_name = PERSONAS.get(req.persona_id, {}).get("name", "COMPANION")
            raw_response = (
                f"[DEMO] Hi, I'm {persona_name}! In live mode I would respond intelligently "
                f"to: '{req.message[:60]}...'. Set ANTHROPIC_API_KEY to enable real AI responses."
            )
        else:
            raw_response = await call_llm_with_history(system_prompt, history)

        # Apply guardrails to the output
        guarded = apply_guardrails(user_msg, raw_response)

        # Add emotional prefix to final response
        final_response = prefix + guarded["response"] if prefix else guarded["response"]

        return ChatResponse(
            message=final_response,
            persona_id=req.persona_id,
            emergency=guarded["emergency"],
            risk_assessment={
                "risk_level": guarded["risk_level"].value,
                "notify_physician": guarded["notify_physician"],
            },
            disclaimer=guarded["disclaimer"],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
