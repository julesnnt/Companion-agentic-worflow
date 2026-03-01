"""Medication management routes."""

import uuid
from datetime import datetime, date
from fastapi import APIRouter, HTTPException
from models.schemas import Medication, MedicationLog, MedicationAdherence

router = APIRouter()

# In-memory store (replace with DB in production)
_store: dict[str, Medication] = {}


def _seed():
    """Pre-load demo medications."""
    meds = [
        Medication(
            id="med-001",
            patient_id="PAT-001",
            name="Omeprazole",
            dosage="20 mg",
            frequency="Once daily",
            times=["08:00"],
            taken_today=[False],
            start_date="2024-01-10",
            end_date="2024-04-10",
            instructions="Take 30 minutes before breakfast.",
            side_effects=["Headache", "Nausea (uncommon)"],
        ),
        Medication(
            id="med-002",
            patient_id="PAT-001",
            name="Atorvastatin",
            dosage="40 mg",
            frequency="Once daily at night",
            times=["21:00"],
            taken_today=[False],
            start_date="2024-01-10",
            instructions="Take with or without food.",
            side_effects=["Muscle aches (rare)", "Liver enzyme changes"],
        ),
        Medication(
            id="med-003",
            patient_id="PAT-001",
            name="Vitamin D3",
            dosage="1000 IU",
            frequency="Twice daily",
            times=["08:00", "13:00"],
            taken_today=[False, False],
            start_date="2024-01-10",
            instructions="Take with a meal.",
            side_effects=[],
        ),
    ]
    for m in meds:
        _store[m.id] = m


_seed()


@router.get("/{patient_id}")
async def get_medications(patient_id: str) -> list[Medication]:
    """Return all medications for a patient."""
    return [m for m in _store.values() if m.patient_id == patient_id]


@router.post("/")
async def create_medication(med: Medication) -> Medication:
    med.id = med.id or str(uuid.uuid4())
    med.taken_today = [False] * len(med.times)
    _store[med.id] = med
    return med


@router.patch("/{medication_id}/log")
async def log_dose(medication_id: str, log: MedicationLog) -> dict:
    """Mark a specific dose as taken or untaken."""
    med = _store.get(medication_id)
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
    if log.dose_index >= len(med.taken_today):
        raise HTTPException(status_code=400, detail="Invalid dose index")
    med.taken_today[log.dose_index] = log.taken
    return {"success": True, "medication_id": medication_id, "dose_index": log.dose_index, "taken": log.taken}


@router.get("/{patient_id}/adherence")
async def get_adherence(patient_id: str) -> list[MedicationAdherence]:
    """Return adherence stats for each medication."""
    results = []
    for med in _store.values():
        if med.patient_id != patient_id:
            continue
        total = len(med.taken_today)
        taken = sum(med.taken_today)
        results.append(MedicationAdherence(
            medication_id=med.id,
            medication_name=med.name,
            adherence_percentage=round((taken / total) * 100, 1) if total else 0.0,
            doses_taken=taken,
            doses_total=total,
        ))
    return results
