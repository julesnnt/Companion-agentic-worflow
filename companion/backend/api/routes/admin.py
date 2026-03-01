"""
Admin / Hospital Operational Intelligence routes.
Provides the dashboard data for clinical staff.
"""

from __future__ import annotations
from typing import Optional
from datetime import datetime
from fastapi import APIRouter
from models.schemas import PatientRiskAlert, RiskLevel, AlertType

router = APIRouter()


# ── Mock hospital dataset ─────────────────────────────────────────────────────

MOCK_ALERTS: list[PatientRiskAlert] = [
    PatientRiskAlert(
        patient_id="PAT-001",
        patient_name="Sarah Mitchell",
        risk_level=RiskLevel.HIGH,
        alert_type=AlertType.HIGH_RISK,
        description="Pain level 9/10 reported. Fever 39.2°C. Physician notification triggered.",
        timestamp="2024-01-15T08:30:00Z",
    ),
    PatientRiskAlert(
        patient_id="PAT-002",
        patient_name="James Okonkwo",
        risk_level=RiskLevel.MEDIUM,
        alert_type=AlertType.MISSED_MEDICATION,
        description="Patient missed morning Metformin dose. Second missed dose this week.",
        timestamp="2024-01-15T09:15:00Z",
    ),
    PatientRiskAlert(
        patient_id="PAT-003",
        patient_name="Amelia Patel",
        risk_level=RiskLevel.MEDIUM,
        alert_type=AlertType.MISSED_CHECKIN,
        description="No daily check-in submitted for 3 consecutive days.",
        timestamp="2024-01-15T10:00:00Z",
    ),
    PatientRiskAlert(
        patient_id="PAT-004",
        patient_name="Robert Chen",
        risk_level=RiskLevel.LOW,
        alert_type=AlertType.MISSED_APPOINTMENT,
        description="Follow-up CT scan overdue by 2 weeks.",
        timestamp="2024-01-15T07:45:00Z",
    ),
    PatientRiskAlert(
        patient_id="PAT-005",
        patient_name="Maria Santos",
        risk_level=RiskLevel.HIGH,
        alert_type=AlertType.HIGH_RISK,
        description="Shortness of breath reported. Oxygen saturation concern flagged.",
        timestamp="2024-01-15T11:00:00Z",
    ),
]

MOCK_PATIENTS = [
    {"patient_id": "PAT-001", "name": "Sarah Mitchell",  "age": 54, "last_checkin": "2024-01-15", "risk": "high",   "pending_exams": ["Pulmonology consultation", "Follow-up CT (3 months)"]},
    {"patient_id": "PAT-002", "name": "James Okonkwo",   "age": 62, "last_checkin": "2024-01-14", "risk": "medium", "pending_exams": ["HbA1c blood test", "Ophthalmology screening"]},
    {"patient_id": "PAT-003", "name": "Amelia Patel",    "age": 38, "last_checkin": "2024-01-12", "risk": "medium", "pending_exams": ["Physiotherapy evaluation"]},
    {"patient_id": "PAT-004", "name": "Robert Chen",     "age": 71, "last_checkin": "2024-01-15", "risk": "low",    "pending_exams": ["Follow-up CT scan (overdue)"]},
    {"patient_id": "PAT-005", "name": "Maria Santos",    "age": 47, "last_checkin": "2024-01-15", "risk": "high",   "pending_exams": ["Respiratory function test", "Cardiology referral"]},
    {"patient_id": "PAT-006", "name": "Thomas Dupont",   "age": 58, "last_checkin": "2024-01-15", "risk": "low",    "pending_exams": []},
]

MOCK_STATS = {
    "total_patients": 6,
    "high_risk_count": 2,
    "medium_risk_count": 2,
    "low_risk_count": 2,
    "missed_checkins_today": 1,
    "pending_appointments": 8,
    "overdue_exams": 3,
    "adherence_rate": 78.4,
}


@router.get("/dashboard")
async def get_dashboard():
    """Return full admin dashboard data."""
    return {
        "stats": MOCK_STATS,
        "alerts": [a.model_dump() for a in MOCK_ALERTS],
        "patients": MOCK_PATIENTS,
        "generated_at": datetime.utcnow().isoformat(),
    }


@router.get("/alerts")
async def get_alerts(risk_level: Optional[str] = None):
    """Return patient risk alerts, optionally filtered by risk level."""
    alerts = MOCK_ALERTS
    if risk_level:
        alerts = [a for a in alerts if a.risk_level.value == risk_level]
    return [a.model_dump() for a in alerts]


@router.get("/patients")
async def get_patients():
    """Return the hospital patient roster with risk status."""
    return MOCK_PATIENTS


@router.get("/stats")
async def get_stats():
    return MOCK_STATS
