// ── Enumerations ─────────────────────────────────────────────────────────────

export type RiskLevel = 'low' | 'medium' | 'high'
export type Urgency   = 'low' | 'moderate' | 'high' | 'critical'
export type PhaseType = 'diagnosis' | 'treatment' | 'monitoring' | 'follow-up' | 'specialist'
export type PhaseStatus = 'pending' | 'active' | 'completed'
export type DocumentCategory = 'prescription' | 'imaging' | 'invoice' | 'insurance' | 'other'

// ── Persona ───────────────────────────────────────────────────────────────────

export interface Persona {
  id: string
  name: string
  title: string
  tone_style: string
  response_style: string
  focus_area: string
  color: string
  gradient: string
  textColor: string
  emoji: string
  avatarBg: string
}

// ── Medical Report ────────────────────────────────────────────────────────────

export interface ReportFindings {
  primary: string
  secondary: string[]
  incidental: string[]
}

export interface MedicalReport {
  report_id: string
  patient_id: string
  generated_at: string
  modality: string
  technologist?: string
  radiologist?: string
  clinical_history?: string
  findings: ReportFindings
  impression: string
  recommendations: string[]
  risk_indicators: string[]
  urgency: Urgency
}

export interface ReportSection {
  heading: string
  content: string
}

export interface PhysicianVersion {
  title: string
  sections: ReportSection[]
  disclaimer: string
}

export interface PatientVersion {
  title: string
  summary: string
  what_this_means: string
  what_happens_next: string
  reassurance: string
  disclaimer: string
}

export interface ActionItem {
  priority: number
  action: string
  timeframe: string
  category: 'appointment' | 'medication' | 'test' | 'lifestyle'
}

export interface ActionVersion {
  title: string
  intro: string
  next_steps: ActionItem[]
  disclaimer: string
}

export interface TransformedReport {
  report_id: string
  patient_id: string
  physician_version: PhysicianVersion
  patient_version: PatientVersion
  action_version: ActionVersion
}

// ── Treatment Roadmap ─────────────────────────────────────────────────────────

export interface RoadmapTask {
  task: string
  owner: string
  due_in?: string
}

export interface TreatmentPhase {
  id: string
  phase: string
  description: string
  type: PhaseType
  tasks: RoadmapTask[]
  expected_timeframe: string
  status: PhaseStatus
}

export interface TreatmentRoadmap {
  patient_id: string
  report_id: string
  generated_at: string
  summary: string
  phases: TreatmentPhase[]
}

// ── Chat ──────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  persona_id?: string
  emergency?: boolean
  risk_level?: RiskLevel
}

export interface ChatRequest {
  patient_id: string
  persona_id: string
  message: string
  history: { role: string; content: string }[]
  report_context?: Partial<MedicalReport>
}

export interface ChatResponse {
  message: string
  persona_id: string
  emergency: boolean
  risk_assessment?: { risk_level: RiskLevel; notify_physician: boolean }
  disclaimer: string
}

// ── Medications ───────────────────────────────────────────────────────────────

export interface Medication {
  id: string
  patient_id: string
  name: string
  dosage: string
  frequency: string
  times: string[]
  taken_today: boolean[]
  start_date: string
  end_date?: string
  instructions: string
  side_effects: string[]
}

export interface MedicationAdherence {
  medication_id: string
  medication_name: string
  adherence_percentage: number
  doses_taken: number
  doses_total: number
}

// ── Check-In ──────────────────────────────────────────────────────────────────

export interface DailyCheckin {
  patient_id: string
  pain_level: number
  temperature: number
  fatigue_level: number
  custom_symptoms: string
  medications_taken: boolean
}

export interface CheckinResult {
  risk_level: RiskLevel
  suggested_action: string
  notify_physician: boolean
  emergency: boolean
  message: string
  flags: string[]
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export interface PatientRiskAlert {
  patient_id: string
  patient_name: string
  risk_level: RiskLevel
  alert_type: string
  description: string
  timestamp: string
}

export interface AdminStats {
  total_patients: number
  high_risk_count: number
  medium_risk_count: number
  low_risk_count: number
  missed_checkins_today: number
  pending_appointments: number
  overdue_exams: number
  adherence_rate: number
}

export interface AdminDashboardData {
  stats: AdminStats
  alerts: PatientRiskAlert[]
  patients: PatientRow[]
  generated_at: string
}

export interface PatientRow {
  patient_id: string
  name: string
  age: number
  last_checkin: string
  risk: RiskLevel
  pending_exams: string[]
}

// ── Documents ─────────────────────────────────────────────────────────────────

export interface MedicalDocument {
  document_id: string
  patient_id: string
  filename: string
  category: DocumentCategory
  uploaded_at: string
  tags: string[]
  summary?: string
}

// ── Health Calendar ───────────────────────────────────────────────────────────

export type HealthEventType = 'appointment' | 'medication' | 'exam' | 'urgent'

export interface HealthEvent {
  id: string
  user_id: string
  type: HealthEventType
  title: string
  description?: string
  start_datetime: string
  end_datetime?: string
  recurring: boolean
  recurrence_rule?: string
}

export interface ParsedEventsPreview {
  events: HealthEvent[]
  summary: string
}

// ── Appointments ──────────────────────────────────────────────────────────────

export interface AppointmentSlot {
  date: string
  time: string
  specialist_type: string
  provider_name: string
  location: string
  available: boolean
}

export interface ScheduledAppointment {
  appointment_id: string
  patient_id: string
  specialist_type: string
  provider_name: string
  date: string
  time: string
  location: string
  status: string
}
