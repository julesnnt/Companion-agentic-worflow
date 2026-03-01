"""
Pydantic schemas for COMPANION API — shared data contracts.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum


# ── Enumerations ────────────────────────────────────────────────────────────

class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class Urgency(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"

class PhaseType(str, Enum):
    DIAGNOSIS = "diagnosis"
    TREATMENT = "treatment"
    MONITORING = "monitoring"
    FOLLOW_UP = "follow-up"
    SPECIALIST = "specialist"

class PhaseStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"

class AlertType(str, Enum):
    MISSED_CHECKIN = "missed_checkin"
    HIGH_RISK = "high_risk"
    MISSED_MEDICATION = "missed_medication"
    MISSED_APPOINTMENT = "missed_appointment"

class DocumentCategory(str, Enum):
    PRESCRIPTION = "prescription"
    IMAGING = "imaging"
    INVOICE = "invoice"
    INSURANCE = "insurance"
    OTHER = "other"

class HealthEventType(str, Enum):
    APPOINTMENT = "appointment"
    MEDICATION  = "medication"
    EXAM        = "exam"
    URGENT      = "urgent"


# ── Medical Report ──────────────────────────────────────────────────────────

class ReportFindings(BaseModel):
    primary: str
    secondary: List[str] = []
    incidental: List[str] = []

class MedicalReport(BaseModel):
    report_id: str
    patient_id: str
    generated_at: str
    modality: str
    technologist: Optional[str] = None
    radiologist: Optional[str] = None
    clinical_history: Optional[str] = None
    findings: ReportFindings
    impression: str
    recommendations: List[str] = []
    risk_indicators: List[str] = []
    urgency: Urgency = Urgency.MODERATE

class ReportSection(BaseModel):
    heading: str
    content: str

class PhysicianVersion(BaseModel):
    title: str
    sections: List[ReportSection]
    disclaimer: str

class PatientVersion(BaseModel):
    title: str
    summary: str
    what_this_means: str
    what_happens_next: str
    reassurance: str
    disclaimer: str

class ActionItem(BaseModel):
    priority: int
    action: str
    timeframe: str
    category: str  # appointment / medication / test / lifestyle

class ActionVersion(BaseModel):
    title: str
    intro: str
    next_steps: List[ActionItem]
    disclaimer: str

class TransformedReport(BaseModel):
    report_id: str
    patient_id: str
    physician_version: PhysicianVersion
    patient_version: PatientVersion
    action_version: ActionVersion


# ── Treatment Roadmap ───────────────────────────────────────────────────────

class RoadmapTask(BaseModel):
    task: str
    owner: str  # patient / doctor / specialist
    due_in: Optional[str] = None

class TreatmentPhase(BaseModel):
    id: str
    phase: str
    description: str
    type: PhaseType
    tasks: List[RoadmapTask]
    expected_timeframe: str
    status: PhaseStatus = PhaseStatus.PENDING

class TreatmentRoadmap(BaseModel):
    patient_id: str
    report_id: str
    generated_at: str
    summary: str
    phases: List[TreatmentPhase]


# ── Chat ────────────────────────────────────────────────────────────────────

class ChatMessageMeta(BaseModel):
    risk_level: Optional[RiskLevel] = None
    emergency: bool = False
    disclaimer: Optional[str] = None

class ChatMessage(BaseModel):
    id: str
    role: str  # user | assistant | system
    content: str
    timestamp: str
    persona_id: Optional[str] = None
    metadata: Optional[ChatMessageMeta] = None

class ChatRequest(BaseModel):
    patient_id: str
    persona_id: str
    message: str
    history: List[Dict[str, str]] = []
    report_context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    message: str
    persona_id: str
    risk_assessment: Optional[Dict[str, Any]] = None
    emergency: bool = False
    disclaimer: str = (
        "This AI assistant does not replace professional medical advice. "
        "Always consult your physician for medical decisions."
    )


# ── Medications ─────────────────────────────────────────────────────────────

class Medication(BaseModel):
    id: str
    patient_id: str
    name: str
    dosage: str
    frequency: str
    times: List[str]  # ["08:00", "20:00"]
    taken_today: List[bool] = []
    start_date: str
    end_date: Optional[str] = None
    instructions: str
    side_effects: List[str] = []

class MedicationLog(BaseModel):
    medication_id: str
    dose_index: int
    taken: bool
    timestamp: str

class MedicationAdherence(BaseModel):
    medication_id: str
    medication_name: str
    adherence_percentage: float
    doses_taken: int
    doses_total: int


# ── Daily Check-In ──────────────────────────────────────────────────────────

class DailyCheckin(BaseModel):
    patient_id: str
    pain_level: int = Field(..., ge=0, le=10)
    temperature: float = Field(..., ge=35.0, le=42.0)
    fatigue_level: int = Field(..., ge=0, le=10)
    custom_symptoms: str = ""
    medications_taken: bool = True

class CheckinResult(BaseModel):
    risk_level: RiskLevel
    suggested_action: str
    notify_physician: bool
    emergency: bool
    message: str
    flags: List[str] = []


# ── Admin / Hospital ────────────────────────────────────────────────────────

class PatientRiskAlert(BaseModel):
    patient_id: str
    patient_name: str
    risk_level: RiskLevel
    alert_type: AlertType
    description: str
    timestamp: str

class AppointmentSlot(BaseModel):
    date: str
    time: str
    specialist_type: str
    provider_name: str
    location: str
    available: bool

class AppointmentRequest(BaseModel):
    patient_id: str
    specialist_type: str
    urgency: Urgency = Urgency.MODERATE
    preferred_dates: List[str] = []

class ScheduledAppointment(BaseModel):
    appointment_id: str
    patient_id: str
    specialist_type: str
    provider_name: str
    date: str
    time: str
    location: str
    status: str  # scheduled / confirmed / cancelled


# ── Documents ───────────────────────────────────────────────────────────────

class MedicalDocument(BaseModel):
    document_id: str
    patient_id: str
    filename: str
    category: DocumentCategory
    uploaded_at: str
    tags: List[str] = []
    summary: Optional[str] = None


# ── Report Transform Request ────────────────────────────────────────────────

class TransformRequest(BaseModel):
    report: MedicalReport
    patient_name: Optional[str] = "Patient"


# ── Health Calendar ──────────────────────────────────────────────────────────

class HealthEvent(BaseModel):
    id: str
    user_id: str
    type: HealthEventType
    title: str
    description: Optional[str] = None
    start_datetime: str
    end_datetime: Optional[str] = None
    recurring: bool = False
    recurrence_rule: Optional[str] = None

class HealthEventCreate(BaseModel):
    user_id: str
    type: HealthEventType
    title: str
    description: Optional[str] = None
    start_datetime: str
    end_datetime: Optional[str] = None
    recurring: bool = False
    recurrence_rule: Optional[str] = None

class BulkEventsCreate(BaseModel):
    events: List[HealthEventCreate]

class ParsedEventsPreview(BaseModel):
    events: List[HealthEvent]
    summary: str
