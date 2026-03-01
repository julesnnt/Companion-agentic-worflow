"""
Clinical Risk Pattern Monitor
==============================
Hybrid rule-based + LLM detection of patient risk from daily check-ins,
symptom logs, and free-text input.  Feeds the admin alert system.
"""

import re
from models.schemas import DailyCheckin, CheckinResult, RiskLevel
from ethics.guardrails import check_emergency, check_high_risk
from services.llm_service import call_llm_json, is_demo_mode


# ── Rule-based thresholds ─────────────────────────────────────────────────────

PAIN_HIGH      = 8    # /10
PAIN_MEDIUM    = 5
TEMP_FEVER     = 38.5 # °C
TEMP_HIGH_FEVER = 39.5
FATIGUE_HIGH   = 8

EMERGENCY_SYMPTOMS_RE = re.compile(
    r"chest\s+pain|can'?t\s+breathe|shortness.{0,10}breath|heart|stroke|seizure|"
    r"blood|collapse|unconscious|overdose|suicid",
    re.IGNORECASE,
)


def _rule_based_risk(checkin: DailyCheckin) -> tuple[RiskLevel, list[str]]:
    """
    Evaluate check-in data with deterministic rules.
    Returns (risk_level, list_of_flags).
    """
    flags: list[str] = []

    # Emergency text check
    if check_emergency(checkin.custom_symptoms):
        return RiskLevel.HIGH, ["Emergency keyword detected in symptom description"]

    # Pain thresholds
    if checkin.pain_level >= PAIN_HIGH:
        flags.append(f"High pain level reported ({checkin.pain_level}/10)")
    elif checkin.pain_level >= PAIN_MEDIUM:
        flags.append(f"Moderate pain reported ({checkin.pain_level}/10)")

    # Temperature
    if checkin.temperature >= TEMP_HIGH_FEVER:
        flags.append(f"High fever detected ({checkin.temperature}°C)")
    elif checkin.temperature >= TEMP_FEVER:
        flags.append(f"Elevated temperature ({checkin.temperature}°C)")

    # Fatigue
    if checkin.fatigue_level >= FATIGUE_HIGH:
        flags.append(f"Severe fatigue reported ({checkin.fatigue_level}/10)")

    # Medication non-adherence
    if not checkin.medications_taken:
        flags.append("Patient did not take prescribed medications")

    # High-risk symptom keywords
    if check_high_risk(checkin.custom_symptoms):
        flags.append("High-risk symptoms detected in description")

    # Aggregate risk level
    high_flags = sum([
        checkin.pain_level >= PAIN_HIGH,
        checkin.temperature >= TEMP_HIGH_FEVER,
        checkin.fatigue_level >= FATIGUE_HIGH,
        not checkin.medications_taken,
    ])
    if high_flags >= 2 or check_high_risk(checkin.custom_symptoms):
        return RiskLevel.HIGH, flags
    if high_flags >= 1 or len(flags) >= 2:
        return RiskLevel.MEDIUM, flags
    return RiskLevel.LOW, flags


def _demo_result(checkin: DailyCheckin, risk: RiskLevel, flags: list[str]) -> CheckinResult:
    if risk == RiskLevel.HIGH:
        return CheckinResult(
            risk_level=risk,
            suggested_action="Please contact your physician or care team today.",
            notify_physician=True,
            emergency=check_emergency(checkin.custom_symptoms),
            message=(
                "Your check-in indicates concerning symptoms. "
                "We have flagged this for your care team."
            ),
            flags=flags,
        )
    if risk == RiskLevel.MEDIUM:
        return CheckinResult(
            risk_level=risk,
            suggested_action="Monitor symptoms closely and contact your doctor if they worsen.",
            notify_physician=False,
            emergency=False,
            message="Some symptoms noted. Please keep monitoring and stay hydrated.",
            flags=flags,
        )
    return CheckinResult(
        risk_level=risk,
        suggested_action="Continue your normal routine and medication schedule.",
        notify_physician=False,
        emergency=False,
        message="Great — your check-in looks good today. Keep it up!",
        flags=flags,
    )


async def _llm_enrich(checkin: DailyCheckin, initial_risk: RiskLevel, flags: list[str]) -> CheckinResult:
    """Use LLM to generate a nuanced, empathetic response message."""
    system = (
        "You are a clinical risk assistant. Given a patient's daily check-in data and "
        "an initial risk assessment, generate a compassionate, clear response. "
        "NEVER diagnose. NEVER use certainty language. "
        "Return JSON: {\"suggested_action\": str, \"message\": str, \"notify_physician\": bool}"
    )
    import json
    payload = {
        "checkin": checkin.model_dump(),
        "initial_risk": initial_risk.value,
        "flags": flags,
    }
    result = await call_llm_json(system, json.dumps(payload))
    return CheckinResult(
        risk_level=initial_risk,
        suggested_action=result.get("suggested_action", "Contact your care team."),
        notify_physician=result.get("notify_physician", initial_risk == RiskLevel.HIGH),
        emergency=check_emergency(checkin.custom_symptoms),
        message=result.get("message", ""),
        flags=flags,
    )


# ── Public API ────────────────────────────────────────────────────────────────

async def assess_checkin(checkin: DailyCheckin) -> CheckinResult:
    """
    Main entry point.  Run rules first; enrich with LLM if not in demo mode.
    """
    risk, flags = _rule_based_risk(checkin)

    # Always do emergency check first
    if check_emergency(checkin.custom_symptoms):
        return CheckinResult(
            risk_level=RiskLevel.HIGH,
            suggested_action="Call emergency services (911) or go to the ER immediately.",
            notify_physician=True,
            emergency=True,
            message="🚨 Emergency keywords detected. Please seek immediate medical attention.",
            flags=["Emergency keyword detected"],
        )

    if is_demo_mode():
        return _demo_result(checkin, risk, flags)
    return await _llm_enrich(checkin, risk, flags)
