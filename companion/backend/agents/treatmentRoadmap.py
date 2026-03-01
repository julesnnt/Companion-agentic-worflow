"""
Treatment Roadmap Agent
=======================
Generates a structured, phased treatment timeline from a medical report.
Output is designed to be rendered as an interactive timeline component.
"""

import json
import uuid
from datetime import datetime
from models.schemas import (
    MedicalReport, TreatmentRoadmap, TreatmentPhase, RoadmapTask,
    PhaseType, PhaseStatus, Urgency,
)
from services.llm_service import call_llm_json, is_demo_mode


# ── Demo fallback ─────────────────────────────────────────────────────────────

def _demo_roadmap(report: MedicalReport) -> TreatmentRoadmap:
    phases = [
        TreatmentPhase(
            id=str(uuid.uuid4()),
            phase="Initial Assessment",
            description="Review imaging results and establish baseline health metrics.",
            type=PhaseType.DIAGNOSIS,
            status=PhaseStatus.ACTIVE,
            tasks=[
                RoadmapTask(task="Discuss scan results with primary physician", owner="patient", due_in="Within 1 week"),
                RoadmapTask(task="Complete blood panel if not recently done", owner="doctor", due_in="Within 1 week"),
            ],
            expected_timeframe="Week 1–2",
        ),
        TreatmentPhase(
            id=str(uuid.uuid4()),
            phase="Specialist Consultation",
            description="Meet with the recommended specialist for expert evaluation.",
            type=PhaseType.SPECIALIST,
            status=PhaseStatus.PENDING,
            tasks=[
                RoadmapTask(task="Book pulmonology / relevant specialist appointment", owner="patient", due_in="Within 2 weeks"),
                RoadmapTask(task="Bring imaging disc and report to appointment", owner="patient"),
            ],
            expected_timeframe="Week 2–4",
        ),
        TreatmentPhase(
            id=str(uuid.uuid4()),
            phase="Treatment Planning",
            description="Establish a personalised treatment or monitoring plan with your care team.",
            type=PhaseType.TREATMENT,
            status=PhaseStatus.PENDING,
            tasks=[
                RoadmapTask(task="Receive treatment / monitoring plan from specialist", owner="doctor"),
                RoadmapTask(task="Begin prescribed medications if applicable", owner="patient"),
                RoadmapTask(task="Set up medication reminders in COMPANION", owner="patient"),
            ],
            expected_timeframe="Week 4–6",
        ),
        TreatmentPhase(
            id=str(uuid.uuid4()),
            phase="Monitoring & Follow-Up",
            description="Regular check-ins and follow-up imaging to track progress.",
            type=PhaseType.MONITORING,
            status=PhaseStatus.PENDING,
            tasks=[
                RoadmapTask(task="Daily symptom check-in via COMPANION", owner="patient", due_in="Ongoing"),
                RoadmapTask(task="Follow-up imaging (CT / MRI as directed)", owner="doctor", due_in="3 months"),
                RoadmapTask(task="Review adherence with care team", owner="doctor", due_in="Monthly"),
            ],
            expected_timeframe="Month 2–6",
        ),
    ]
    return TreatmentRoadmap(
        patient_id=report.patient_id,
        report_id=report.report_id,
        generated_at=datetime.utcnow().isoformat(),
        summary=(
            "A personalised care roadmap has been generated based on your imaging report. "
            "Your care team will guide you through each phase."
        ),
        phases=phases,
    )


# ── LLM-powered generation ────────────────────────────────────────────────────

async def _llm_roadmap(report: MedicalReport) -> TreatmentRoadmap:
    system = (
        "You are a clinical care coordinator. Generate a realistic, phased treatment roadmap "
        "from the provided medical report. "
        "Include 3–5 phases. Each phase must have: id (uuid), phase (str), description (str), "
        'type (one of: diagnosis|treatment|monitoring|follow-up|specialist), '
        'status (pending|active|completed, first phase = active), '
        "tasks (list of {task, owner, due_in}), expected_timeframe (str). "
        "ONLY infer actions explicitly supported by the report. "
        "Return JSON:\n"
        '{"summary": str, "phases": [...]}'
    )
    result = await call_llm_json(system, json.dumps(report.model_dump()), max_tokens=3000)

    phases = []
    for p in result.get("phases", []):
        tasks = [RoadmapTask(**t) for t in p.get("tasks", [])]
        phases.append(TreatmentPhase(
            id=p.get("id", str(uuid.uuid4())),
            phase=p["phase"],
            description=p.get("description", ""),
            type=PhaseType(p.get("type", "monitoring")),
            status=PhaseStatus(p.get("status", "pending")),
            tasks=tasks,
            expected_timeframe=p.get("expected_timeframe", "TBD"),
        ))

    return TreatmentRoadmap(
        patient_id=report.patient_id,
        report_id=report.report_id,
        generated_at=datetime.utcnow().isoformat(),
        summary=result.get("summary", ""),
        phases=phases,
    )


# ── Public API ────────────────────────────────────────────────────────────────

async def generate_roadmap(report: MedicalReport) -> TreatmentRoadmap:
    """Generate a treatment roadmap for the given medical report."""
    if is_demo_mode():
        return _demo_roadmap(report)
    return await _llm_roadmap(report)
