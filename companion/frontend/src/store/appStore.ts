/**
 * Global application state — Zustand store.
 */

import { create } from 'zustand'
import type { Persona, MedicalReport, TreatmentRoadmap, ChatMessage, TransformedReport } from '../types'

// ── Persona definitions (no emoji, uses gradient initials) ────────────────────

export const PERSONAS: Persona[] = [
  {
    id: 'atlas',
    name: 'Atlas',
    title: 'Clinical Analyst',
    tone_style: 'Precise, analytical, evidence-based',
    response_style: 'Detailed, factual, clinical',
    focus_area: 'medical information, treatment plans, symptoms',
    color: '#0D9488',
    gradient: 'from-teal-500 to-emerald-600',
    textColor: 'text-teal-600',
    emoji: 'AT',
    avatarBg: 'bg-gradient-to-br from-teal-500 to-emerald-600',
  },
  {
    id: 'luna',
    name: 'Luna',
    title: 'Support Companion',
    tone_style: 'Warm, reassuring, empathetic',
    response_style: 'Gentle, validating, supportive',
    focus_area: 'mental health, wellbeing, encouragement',
    color: '#7C3AED',
    gradient: 'from-violet-500 to-purple-600',
    textColor: 'text-violet-600',
    emoji: 'LU',
    avatarBg: 'bg-gradient-to-br from-violet-500 to-purple-600',
  },
  {
    id: 'robert',
    name: 'Robert',
    title: 'Administrative Expert',
    tone_style: 'Calm, structured, professional',
    response_style: 'Organised, methodical, paperwork-focused',
    focus_area: 'appointments, documents, insurance',
    color: '#2563EB',
    gradient: 'from-blue-500 to-blue-700',
    textColor: 'text-blue-600',
    emoji: 'RO',
    avatarBg: 'bg-gradient-to-br from-blue-500 to-blue-700',
  },
  {
    id: 'nova',
    name: 'Nova',
    title: 'Recovery Coach',
    tone_style: 'Motivational, energetic, positive',
    response_style: 'Encouraging, goal-oriented, action-focused',
    focus_area: 'recovery goals, lifestyle, wellness',
    color: '#D97706',
    gradient: 'from-amber-400 to-orange-500',
    textColor: 'text-amber-600',
    emoji: 'NV',
    avatarBg: 'bg-gradient-to-br from-amber-400 to-orange-500',
  },
]

// ── Store ─────────────────────────────────────────────────────────────────────

interface AppState {
  currentPersona: Persona
  setPersona: (persona: Persona) => void

  patientId: string
  patientName: string

  report: MedicalReport | null
  setReport: (report: MedicalReport) => void
  transformedReport: TransformedReport | null
  setTransformedReport: (r: TransformedReport | null) => void
  roadmap: TreatmentRoadmap | null
  setRoadmap: (r: TreatmentRoadmap) => void
  clearReport: () => void

  messages: ChatMessage[]
  addMessage: (msg: ChatMessage) => void
  clearMessages: () => void

  emergencyModalOpen: boolean
  setEmergencyModal: (open: boolean) => void

  activeView: 'chat' | 'report' | 'timeline' | 'medications' | 'checkin' | 'documents' | 'calendar'
  setActiveView: (view: AppState['activeView']) => void

  rightPanelTab: 'timeline' | 'medications' | 'alerts'
  setRightPanelTab: (tab: AppState['rightPanelTab']) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentPersona: PERSONAS[0],
  setPersona: (persona) => set({ currentPersona: persona, messages: [] }),

  patientId: 'PAT-001',
  patientName: 'Sarah Mitchell',

  report: null,
  setReport: (report) => set({ report }),
  transformedReport: null,
  setTransformedReport: (transformedReport) => set({ transformedReport }),
  roadmap: null,
  setRoadmap: (roadmap) => set({ roadmap }),
  clearReport: () => set({ report: null, transformedReport: null, roadmap: null }),

  messages: [],
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  clearMessages: () => set({ messages: [] }),

  emergencyModalOpen: false,
  setEmergencyModal: (emergencyModalOpen) => set({ emergencyModalOpen }),

  activeView: 'chat',
  setActiveView: (activeView) => set({ activeView }),

  rightPanelTab: 'timeline',
  setRightPanelTab: (rightPanelTab) => set({ rightPanelTab }),
}))
