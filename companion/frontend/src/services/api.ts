/**
 * COMPANION API client — centralised Axios instance + typed request helpers.
 */

import axios from 'axios'
import type {
  MedicalReport, TransformedReport, TreatmentRoadmap,
  ChatRequest, ChatResponse,
  Medication, MedicationAdherence,
  DailyCheckin, CheckinResult,
  AdminDashboardData, PatientRiskAlert,
  MedicalDocument,
  AppointmentSlot, ScheduledAppointment,
  HealthEvent, ParsedEventsPreview,
} from '../types'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

// ── Reports ───────────────────────────────────────────────────────────────────

export const transformReport = (report: MedicalReport, patientName = 'Patient') =>
  api.post<TransformedReport>('/reports/transform', { report, patient_name: patientName })
     .then(r => r.data)

export const generateRoadmap = (report: MedicalReport) =>
  api.post<TreatmentRoadmap>('/reports/roadmap', { report })
     .then(r => r.data)

// ── Chat ──────────────────────────────────────────────────────────────────────

export const sendChatMessage = (req: ChatRequest) =>
  api.post<ChatResponse>('/chat/', req).then(r => r.data)

// ── Medications ───────────────────────────────────────────────────────────────

export const getMedications = (patientId: string) =>
  api.get<Medication[]>(`/medications/${patientId}`).then(r => r.data)

export const logDose = (medicationId: string, doseIndex: number, taken: boolean) =>
  api.patch(`/medications/${medicationId}/log`, {
    medication_id: medicationId, dose_index: doseIndex, taken,
    timestamp: new Date().toISOString(),
  }).then(r => r.data)

export const getAdherence = (patientId: string) =>
  api.get<MedicationAdherence[]>(`/medications/${patientId}/adherence`).then(r => r.data)

// ── Check-In ──────────────────────────────────────────────────────────────────

export const submitCheckin = (data: DailyCheckin) =>
  api.post<CheckinResult>('/checkin/', data).then(r => r.data)

export const getCheckinHistory = (patientId: string) =>
  api.get<{ checkin: DailyCheckin; result: CheckinResult }[]>(`/checkin/history/${patientId}`)
     .then(r => r.data)

// ── Admin ─────────────────────────────────────────────────────────────────────

export const getAdminDashboard = () =>
  api.get<AdminDashboardData>('/admin/dashboard').then(r => r.data)

export const getAlerts = (riskLevel?: string) =>
  api.get<PatientRiskAlert[]>('/admin/alerts', { params: { risk_level: riskLevel } })
     .then(r => r.data)

// ── Documents ─────────────────────────────────────────────────────────────────

export const getDocuments = (patientId: string, category?: string) =>
  api.get<MedicalDocument[]>(`/documents/${patientId}`, { params: { category } })
     .then(r => r.data)

export const uploadDocument = (patientId: string, file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.post<MedicalDocument>(`/documents/upload/${patientId}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)
}

// ── Appointments ──────────────────────────────────────────────────────────────

export const suggestSlots = (patientId: string, specialistType: string, urgency: string) =>
  api.post<{ slots: AppointmentSlot[] }>('/appointments/suggest', {
    patient_id: patientId, specialist_type: specialistType, urgency,
  }).then(r => r.data)

export const bookAppointment = (data: Record<string, string>) =>
  api.post<ScheduledAppointment>('/appointments/book', data).then(r => r.data)

export const getAppointments = (patientId: string) =>
  api.get<ScheduledAppointment[]>(`/appointments/${patientId}`).then(r => r.data)

// ── Calendar ──────────────────────────────────────────────────────────────────

export const getCalendarEvents = (userId = 'PAT-001') =>
  api.get<HealthEvent[]>('/calendar/events', { params: { user_id: userId } }).then(r => r.data)

export const createCalendarEvent = (event: Omit<HealthEvent, 'id'>) =>
  api.post<HealthEvent>('/calendar/events', event).then(r => r.data)

export const bulkCreateCalendarEvents = (events: Omit<HealthEvent, 'id'>[]) =>
  api.post<HealthEvent[]>('/calendar/events/bulk', { events }).then(r => r.data)

export const updateCalendarEvent = (id: string, event: Omit<HealthEvent, 'id'>) =>
  api.put<HealthEvent>(`/calendar/events/${id}`, event).then(r => r.data)

export const deleteCalendarEvent = (id: string, userId = 'PAT-001') =>
  api.delete(`/calendar/events/${id}`, { params: { user_id: userId } }).then(r => r.data)

export const parseReportForCalendar = (userId = 'PAT-001') =>
  api.post<ParsedEventsPreview>('/calendar/parse', null, { params: { user_id: userId } }).then(r => r.data)
