"""Report transformation and roadmap generation routes."""

from fastapi import APIRouter, HTTPException
from models.schemas import TransformRequest, TransformedReport, TreatmentRoadmap
from agents.reportTransformer import transform_report
from agents.treatmentRoadmap import generate_roadmap

router = APIRouter()


@router.post("/transform", response_model=TransformedReport)
async def transform(req: TransformRequest):
    """Transform a medical report into physician, patient, and action versions."""
    try:
        return await transform_report(req.report, req.patient_name or "Patient")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/roadmap", response_model=TreatmentRoadmap)
async def roadmap(req: TransformRequest):
    """Generate a treatment roadmap from a medical report."""
    try:
        return await generate_roadmap(req.report)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
