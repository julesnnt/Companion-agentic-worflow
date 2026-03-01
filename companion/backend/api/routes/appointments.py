"""Smart appointment scheduling routes."""

from __future__ import annotations
import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException
from models.schemas import AppointmentRequest, ScheduledAppointment, AppointmentSlot, Urgency

router = APIRouter()

_appointments: dict[str, ScheduledAppointment] = {}

SPECIALIST_MAP = {
    "pulmonology":  ["Dr. Elena Vasquez", "Dr. Michael Torres"],
    "cardiology":   ["Dr. Priya Mehta", "Dr. Samuel Wright"],
    "oncology":     ["Dr. Laura Kim", "Dr. James Osei"],
    "neurology":    ["Dr. Sophie Lambert", "Dr. Ahmed Hassan"],
    "general":      ["Dr. Maria Santos", "Dr. David Park"],
    "radiology":    ["Dr. Yuki Tanaka", "Dr. Clara Hughes"],
    "physiotherapy": ["James Lawson, PT", "Nina Petrov, PT"],
}

LOCATIONS = {
    "pulmonology":   "Respiratory Centre, Building B, Floor 3",
    "cardiology":    "Heart & Vascular Unit, Building A, Floor 2",
    "oncology":      "Cancer Care Centre, Building C",
    "neurology":     "Neuroscience Wing, Building D, Floor 4",
    "general":       "Outpatient Clinic, Building A, Floor 1",
    "radiology":     "Imaging Department, Building A, Basement",
    "physiotherapy": "Rehabilitation Centre, Building E",
}


def _generate_slots(specialist_type: str, urgency: Urgency) -> list[AppointmentSlot]:
    """Simulate available appointment slots based on urgency."""
    base = datetime.now()
    offset_days = {"critical": 1, "high": 3, "moderate": 7, "low": 14}
    start_offset = offset_days.get(urgency.value, 7)

    providers = SPECIALIST_MAP.get(specialist_type.lower(), SPECIALIST_MAP["general"])
    location = LOCATIONS.get(specialist_type.lower(), "Outpatient Clinic")

    slots = []
    for i in range(4):
        day = base + timedelta(days=start_offset + i * 2)
        for time in ["09:00", "11:30", "14:00"]:
            slots.append(AppointmentSlot(
                date=day.strftime("%Y-%m-%d"),
                time=time,
                specialist_type=specialist_type.capitalize(),
                provider_name=providers[i % len(providers)],
                location=location,
                available=True,
            ))
    return slots


@router.post("/suggest")
async def suggest_slots(req: AppointmentRequest) -> dict:
    """Return suggested appointment slots for a specialist type."""
    slots = _generate_slots(req.specialist_type, req.urgency)
    return {
        "patient_id": req.patient_id,
        "specialist_type": req.specialist_type,
        "urgency": req.urgency.value,
        "slots": [s.model_dump() for s in slots[:6]],
    }


@router.post("/book")
async def book_appointment(req: dict) -> ScheduledAppointment:
    """Book a specific appointment slot."""
    appt = ScheduledAppointment(
        appointment_id=str(uuid.uuid4()),
        patient_id=req.get("patient_id", "PAT-001"),
        specialist_type=req.get("specialist_type", "General"),
        provider_name=req.get("provider_name", "Dr. TBD"),
        date=req.get("date"),
        time=req.get("time"),
        location=req.get("location", "Outpatient Clinic"),
        status="scheduled",
    )
    _appointments[appt.appointment_id] = appt
    return appt


@router.get("/{patient_id}")
async def get_appointments(patient_id: str) -> list[ScheduledAppointment]:
    return [a for a in _appointments.values() if a.patient_id == patient_id]
