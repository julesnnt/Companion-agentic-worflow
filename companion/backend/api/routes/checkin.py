"""Daily patient check-in route."""

from fastapi import APIRouter, HTTPException
from models.schemas import DailyCheckin, CheckinResult
from agents.riskMonitor import assess_checkin

router = APIRouter()

# Simple log store for demo
_log: list[dict] = []


@router.post("/", response_model=CheckinResult)
async def submit_checkin(checkin: DailyCheckin):
    """Process a daily check-in and return a risk assessment."""
    try:
        result = await assess_checkin(checkin)
        _log.append({"checkin": checkin.model_dump(), "result": result.model_dump()})
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{patient_id}")
async def get_history(patient_id: str) -> list[dict]:
    """Return recent check-in history for a patient."""
    return [entry for entry in _log if entry["checkin"]["patient_id"] == patient_id][-10:]
