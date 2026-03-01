"""
COMPANION Ethical & Safety Guardrails Engine
============================================
Implements keyword-based emergency detection, escalation logic,
and mandatory disclaimers.  All AI responses are routed through
this layer before being returned to the client.
"""

import re
from typing import Optional
from models.schemas import RiskLevel

# ── Standard Disclaimer ──────────────────────────────────────────────────────

STANDARD_DISCLAIMER = (
    "⚠️  This AI assistant is for informational support only and does not "
    "replace professional medical advice, diagnosis, or treatment. "
    "Always consult a qualified healthcare provider for medical decisions."
)

EMERGENCY_DISCLAIMER = (
    "🚨 If you are experiencing a medical emergency, call 911 (or your local "
    "emergency number) immediately or go to your nearest Emergency Room."
)

# ── Emergency keyword sets ────────────────────────────────────────────────────

EMERGENCY_PATTERNS = [
    # Cardiac
    r"\bchest\s+pain\b",
    r"\bheart\s+attack\b",
    r"\bcardiac\s+arrest\b",
    r"\bpalpitations?\b.{0,30}\bsever\b",
    # Respiratory
    r"\bcan'?t\s+breathe\b",
    r"\bcannot\s+breathe\b",
    r"\bshortness\s+of\s+breath\b.{0,20}\bsever\b",
    r"\bstopped?\s+breathing\b",
    # Neurological
    r"\bstroke\b",
    r"\bseizure\b",
    r"\bloss\s+of\s+consciousness\b",
    r"\bpassed?\s+out\b",
    r"\bunresponsive\b",
    r"\bparalys[ie]s\b",
    # Bleeding / trauma
    r"\bsever\w*\s+bleeding\b",
    r"\bbleeding\s+out\b",
    r"\btrauma\b",
    # Mental health crisis
    r"\bsuicid\w+\b",
    r"\bkill\s+(my)?self\b",
    r"\bend\s+my\s+life\b",
    r"\bself.harm\b",
    r"\boverdos\w+\b",
    # Anaphylaxis
    r"\bthroat\s+clos\w+\b",
    r"\banaphylax\w+\b",
    r"\bsever\w*\s+allerg\w+\b",
]

HIGH_RISK_PATTERNS = [
    r"\bsever\w*\s+pain\b",
    r"\bvomiting\s+blood\b",
    r"\bblood\s+in\s+(stool|urine)\b",
    r"\bextreme\s+fatigue\b",
    r"\bhigh\s+fever\b",
    r"\btemperature.{0,10}(39|40|41|42)\b",
    r"\bsudden\s+(weakness|numbness|confusion)\b",
    r"\bcan'?t\s+(walk|move|stand)\b",
    r"\bcollaps\w+\b",
]

# Phrases that indicate the AI is being asked to give a definitive diagnosis
FORBIDDEN_PATTERNS = [
    r"you\s+(have|are\s+suffering\s+from|are\s+diagnosed\s+with)\b",
    r"this\s+is\s+definitely\b",
    r"you\s+definitely\s+(have|need)\b",
    r"100%\s+(certain|sure)\b",
]

# ── Core API ─────────────────────────────────────────────────────────────────

_emergency_re = re.compile(
    "|".join(EMERGENCY_PATTERNS), re.IGNORECASE
)
_high_risk_re = re.compile(
    "|".join(HIGH_RISK_PATTERNS), re.IGNORECASE
)
_forbidden_re = re.compile(
    "|".join(FORBIDDEN_PATTERNS), re.IGNORECASE
)


def check_emergency(text: str) -> bool:
    """Return True if the text contains emergency keywords."""
    return bool(_emergency_re.search(text))


def check_high_risk(text: str) -> bool:
    """Return True if the text signals high-risk (but not necessarily emergency)."""
    return bool(_high_risk_re.search(text))


def assess_risk_level(text: str) -> RiskLevel:
    if check_emergency(text):
        return RiskLevel.HIGH
    if check_high_risk(text):
        return RiskLevel.MEDIUM
    return RiskLevel.LOW


def sanitize_llm_output(text: str) -> str:
    """
    Remove any language that implies medical certainty or diagnosis.
    Replace with appropriately hedged phrasing.
    """
    replacements = {
        r"you have (\w+)": r"it is possible you may be experiencing \1",
        r"this is (\w+)": r"this could be consistent with \1",
        r"you are diagnosed with": "your report mentions",
        r"I diagnose": "based on the report, it appears",
        r"definitely": "possibly",
        r"certainly": "it seems",
    }
    for pattern, repl in replacements.items():
        text = re.sub(pattern, repl, text, flags=re.IGNORECASE)
    return text


def build_emergency_response() -> str:
    return (
        "🚨 **I noticed you mentioned something that could be a medical emergency.**\n\n"
        "Please take the following steps **immediately**:\n"
        "1. **Call 911** (or your local emergency number)\n"
        "2. **Go to the nearest Emergency Room** if you can do so safely\n"
        "3. **Do not drive yourself** — ask someone to drive you or call an ambulance\n\n"
        f"{EMERGENCY_DISCLAIMER}\n\n"
        "If this was not an emergency, please describe your symptoms and I will do my best to help you."
    )


def apply_guardrails(
    user_input: str,
    llm_output: str,
) -> dict:
    """
    Master guardrails check.
    Returns a dict with the (possibly modified) response and metadata.
    """
    is_emergency = check_emergency(user_input)
    is_high_risk = check_high_risk(user_input)

    if is_emergency:
        return {
            "response": build_emergency_response(),
            "emergency": True,
            "risk_level": RiskLevel.HIGH,
            "notify_physician": True,
            "disclaimer": EMERGENCY_DISCLAIMER,
        }

    # Sanitize LLM output for forbidden certainty language
    safe_output = sanitize_llm_output(llm_output)

    return {
        "response": safe_output,
        "emergency": False,
        "risk_level": RiskLevel.MEDIUM if is_high_risk else RiskLevel.LOW,
        "notify_physician": is_high_risk,
        "disclaimer": STANDARD_DISCLAIMER,
    }
