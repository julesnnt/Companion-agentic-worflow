"""
Report Transformer Agent
========================
Takes a structured MedicalReport JSON and produces three audience-specific
versions via LLM transformation. Never generates new diagnoses or contradicts
the source report.
"""

import json
from datetime import datetime
from models.schemas import (
    MedicalReport, TransformedReport,
    PhysicianVersion, PatientVersion, ActionVersion,
    ReportSection, ActionItem,
)
from services.llm_service import call_llm_json, is_demo_mode

DISCLAIMER = (
    "This document is AI-generated from a structured medical report. "
    "It does not constitute a new medical opinion. Always consult your "
    "treating physician for clinical decisions."
)

# ── Demo fallbacks ────────────────────────────────────────────────────────────

def _demo_physician(report: MedicalReport) -> PhysicianVersion:
    return PhysicianVersion(
        title=f"Radiology Report — {report.modality}",
        sections=[
            ReportSection(heading="Clinical History", content=report.clinical_history or "Not provided"),
            ReportSection(heading="Findings", content=report.findings.primary),
            ReportSection(heading="Secondary Findings",
                          content="; ".join(report.findings.secondary) or "None"),
            ReportSection(heading="Impression", content=report.impression),
            ReportSection(heading="Recommendations",
                          content="\n".join(f"• {r}" for r in report.recommendations)),
        ],
        disclaimer=DISCLAIMER,
    )

def _demo_patient(report: MedicalReport) -> PatientVersion:
    return PatientVersion(
        title="Your Scan Results — Plain Language Summary",
        summary=(
            f"Your {report.modality} has been reviewed. "
            "The results have been shared with your medical team."
        ),
        what_this_means=(
            "Your imaging study showed some findings that your doctor wants to "
            "monitor. This is a common step in modern healthcare, and means your "
            "care team is being thorough."
        ),
        what_happens_next=(
            "Your doctor will discuss these results with you and outline any "
            "recommended next steps, which may include a follow-up appointment "
            "or additional tests."
        ),
        reassurance=(
            "Please remember: having a follow-up recommended does not mean "
            "something is seriously wrong. It is your care team looking after you carefully."
        ),
        disclaimer=DISCLAIMER,
    )

def _demo_action(report: MedicalReport) -> ActionVersion:
    steps = [
        ActionItem(priority=1, action="Schedule follow-up appointment with your doctor",
                   timeframe="Within 1 week", category="appointment"),
        ActionItem(priority=2, action="Review all current medications with your physician",
                   timeframe="At next appointment", category="medication"),
    ]
    for i, rec in enumerate(report.recommendations[:4], start=3):
        steps.append(ActionItem(
            priority=i, action=rec,
            timeframe="As directed by physician", category="appointment",
        ))
    return ActionVersion(
        title="Your Action Checklist",
        intro="Here is a clear list of steps to take based on your recent scan results:",
        next_steps=steps,
        disclaimer=DISCLAIMER,
    )


# ── LLM-powered transforms ────────────────────────────────────────────────────

async def _llm_physician(report: MedicalReport) -> PhysicianVersion:
    system = (
        "You are a medical report formatter. Reformat the provided structured "
        "report JSON into a well-organized physician-facing document. "
        "Use precise clinical terminology. Do NOT add diagnoses not present in the source. "
        "Return JSON matching this schema:\n"
        '{"title": str, "sections": [{"heading": str, "content": str}], "disclaimer": str}'
    )
    result = await call_llm_json(system, json.dumps(report.model_dump()))
    sections = [ReportSection(**s) for s in result.get("sections", [])]
    return PhysicianVersion(
        title=result.get("title", f"Report — {report.modality}"),
        sections=sections,
        disclaimer=result.get("disclaimer", DISCLAIMER),
    )

async def _llm_patient(report: MedicalReport, patient_name: str) -> PatientVersion:
    system = (
        "You are a compassionate medical communicator. Translate the clinical report "
        "into plain, calm, non-alarming language for a non-medical patient. "
        f"Address the patient as {patient_name}. "
        "NEVER diagnose. NEVER use scary language. NEVER contradict the source report. "
        "Tone: warm, clear, reassuring. "
        "Return JSON:\n"
        '{"title": str, "summary": str, "what_this_means": str, '
        '"what_happens_next": str, "reassurance": str, "disclaimer": str}'
    )
    result = await call_llm_json(system, json.dumps(report.model_dump()))
    return PatientVersion(
        title=result.get("title", "Your Scan Results"),
        summary=result.get("summary", ""),
        what_this_means=result.get("what_this_means", ""),
        what_happens_next=result.get("what_happens_next", ""),
        reassurance=result.get("reassurance", ""),
        disclaimer=result.get("disclaimer", DISCLAIMER),
    )

async def _llm_action(report: MedicalReport) -> ActionVersion:
    system = (
        "You are a healthcare action planner. Extract clear, prioritized action items "
        "from the medical report for the patient to follow. "
        "Each action must have: priority (int), action (str), timeframe (str), "
        "category (appointment|medication|test|lifestyle). "
        "Maximum 6 items. NEVER invent actions not supported by the report. "
        "Return JSON:\n"
        '{"title": str, "intro": str, "next_steps": [...], "disclaimer": str}'
    )
    result = await call_llm_json(system, json.dumps(report.model_dump()))
    steps = [ActionItem(**s) for s in result.get("next_steps", [])]
    return ActionVersion(
        title=result.get("title", "Your Action Checklist"),
        intro=result.get("intro", ""),
        next_steps=steps,
        disclaimer=result.get("disclaimer", DISCLAIMER),
    )


# ── Public API ────────────────────────────────────────────────────────────────

async def transform_report(
    report: MedicalReport,
    patient_name: str = "Patient",
) -> TransformedReport:
    """
    Master transformation function.
    Returns all three report versions for a given MedicalReport.
    """
    if is_demo_mode():
        physician = _demo_physician(report)
        patient   = _demo_patient(report)
        action    = _demo_action(report)
    else:
        physician, patient, action = (
            await _llm_physician(report),
            await _llm_patient(report, patient_name),
            await _llm_action(report),
        )

    return TransformedReport(
        report_id=report.report_id,
        patient_id=report.patient_id,
        physician_version=physician,
        patient_version=patient,
        action_version=action,
    )
