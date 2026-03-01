"""
Emotional Support Agent
========================
Detects emotional tone in patient messages and provides empathetic,
appropriately bounded responses.  Suggests professional help when warranted.
"""

import re
from services.llm_service import call_llm_json, is_demo_mode

# Emotional signal patterns
ANXIETY_SIGNALS   = re.compile(r"\bworreid\b|\bscared\b|\banxious\b|\bafraid\b|\bnervous\b|\bpanic\b", re.I)
FEAR_SIGNALS      = re.compile(r"\bterrified\b|\bpetrified\b|\bfear\b|\bdread\b", re.I)
FRUSTRATION       = re.compile(r"\bfrustrat\w+\b|\bangry\b|\banger\b|\bfurious\b|\bfed up\b", re.I)
SADNESS           = re.compile(r"\bdepressed\b|\bsad\b|\bdown\b|\bhopeless\b|\bunhappy\b|\bgrieving\b", re.I)
CRISIS_SIGNALS    = re.compile(r"\bsuicid\w*\b|\bkill\s+myself\b|\bself.harm\b|\bend\s+my\s+life\b", re.I)


def detect_tone(text: str) -> dict:
    """Lightweight regex-based tone classification."""
    return {
        "anxiety":     bool(ANXIETY_SIGNALS.search(text)),
        "fear":        bool(FEAR_SIGNALS.search(text)),
        "frustration": bool(FRUSTRATION.search(text)),
        "sadness":     bool(SADNESS.search(text)),
        "crisis":      bool(CRISIS_SIGNALS.search(text)),
    }


CRISIS_RESPONSE = (
    "I can hear that you're going through something very difficult right now, "
    "and I want you to know that your feelings matter deeply.\n\n"
    "**Please reach out for support right away:**\n"
    "- **Crisis Helpline:** 988 (Suicide & Crisis Lifeline — call or text)\n"
    "- **Crisis Text Line:** Text HOME to 741741\n"
    "- **Emergency:** Call 911 if you are in immediate danger\n\n"
    "You don't have to go through this alone. A trained counselor can help right now."
)


async def get_emotional_context(text: str) -> dict:
    """
    Analyse emotional tone with LLM (or demo fallback) and return
    a dict with tone, is_crisis, and suggested_prefix for persona responses.
    """
    tone = detect_tone(text)

    if tone["crisis"]:
        return {
            "tone": "crisis",
            "is_crisis": True,
            "crisis_response": CRISIS_RESPONSE,
            "suggested_prefix": "",
        }

    if is_demo_mode():
        dominant = next((k for k, v in tone.items() if v), "neutral")
        return {
            "tone": dominant,
            "is_crisis": False,
            "suggested_prefix": _tone_prefix(dominant),
        }

    # LLM-enhanced tone analysis
    import json
    system = (
        "You are an empathetic clinical psychologist assistant. "
        "Analyse the emotional content of the patient message. "
        "Return JSON: {\"tone\": str, \"intensity\": low|medium|high, "
        "\"suggested_prefix\": str (1–2 sentences acknowledging their feelings)}"
    )
    result = await call_llm_json(system, text, max_tokens=256)
    return {
        "tone":             result.get("tone", "neutral"),
        "intensity":        result.get("intensity", "low"),
        "is_crisis":        False,
        "suggested_prefix": result.get("suggested_prefix", ""),
    }


def _tone_prefix(tone: str) -> str:
    prefixes = {
        "anxiety":     "I can understand why you might be feeling anxious about this. It's completely natural. ",
        "fear":        "It's okay to feel scared — many patients do. I'm here to help you navigate this. ",
        "frustration": "I hear your frustration, and it's valid. Let's work through this together. ",
        "sadness":     "I'm sorry you're feeling this way. Your feelings are completely valid. ",
        "neutral":     "",
    }
    return prefixes.get(tone, "")
