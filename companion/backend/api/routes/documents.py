"""
Document management routes — mock upload, categorisation, and tagging.
"""

from __future__ import annotations
from typing import Optional
import uuid
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException
from models.schemas import MedicalDocument, DocumentCategory

router = APIRouter()

_documents: dict[str, MedicalDocument] = {}

# Pre-loaded demo documents
_demo_docs = [
    MedicalDocument(
        document_id="doc-001",
        patient_id="PAT-001",
        filename="CT_Scan_Report_2024.pdf",
        category=DocumentCategory.IMAGING,
        uploaded_at="2024-01-10T14:30:00Z",
        tags=["CT scan", "chest", "radiology"],
        summary="Chest CT scan showing 8mm pulmonary nodule in right upper lobe.",
    ),
    MedicalDocument(
        document_id="doc-002",
        patient_id="PAT-001",
        filename="Prescription_Omeprazole.pdf",
        category=DocumentCategory.PRESCRIPTION,
        uploaded_at="2024-01-10T15:00:00Z",
        tags=["omeprazole", "GI", "prescription"],
        summary="Prescription for Omeprazole 20mg once daily for 3 months.",
    ),
    MedicalDocument(
        document_id="doc-003",
        patient_id="PAT-001",
        filename="Insurance_Claim_Jan2024.pdf",
        category=DocumentCategory.INSURANCE,
        uploaded_at="2024-01-12T10:00:00Z",
        tags=["insurance", "claim", "January"],
        summary="Insurance claim for outpatient CT scan procedure.",
    ),
]
for d in _demo_docs:
    _documents[d.document_id] = d


def _categorize(filename: str) -> tuple[DocumentCategory, list[str]]:
    """Simple rule-based document categorisation."""
    fname = filename.lower()
    if any(k in fname for k in ["scan", "mri", "ct", "xray", "x-ray", "imaging", "radiology"]):
        return DocumentCategory.IMAGING, ["imaging"]
    if any(k in fname for k in ["prescription", "rx", "medication", "drug"]):
        return DocumentCategory.PRESCRIPTION, ["prescription"]
    if any(k in fname for k in ["invoice", "bill", "receipt", "payment"]):
        return DocumentCategory.INVOICE, ["billing"]
    if any(k in fname for k in ["insurance", "claim", "coverage", "policy"]):
        return DocumentCategory.INSURANCE, ["insurance"]
    return DocumentCategory.OTHER, ["document"]


@router.post("/upload/{patient_id}")
async def upload_document(patient_id: str, file: UploadFile = File(...)) -> MedicalDocument:
    """Upload and auto-categorise a medical document."""
    category, tags = _categorize(file.filename or "document.pdf")
    doc = MedicalDocument(
        document_id=str(uuid.uuid4()),
        patient_id=patient_id,
        filename=file.filename or "document.pdf",
        category=category,
        uploaded_at=datetime.utcnow().isoformat(),
        tags=tags,
        summary=f"Uploaded document: {file.filename}. Auto-categorised as {category.value}.",
    )
    _documents[doc.document_id] = doc
    return doc


@router.get("/{patient_id}")
async def get_documents(patient_id: str, category: Optional[str] = None) -> list[MedicalDocument]:
    docs = [d for d in _documents.values() if d.patient_id == patient_id]
    if category:
        docs = [d for d in docs if d.category.value == category]
    return docs
