/**
 * AdminDashboard — Hospital Operational Intelligence.
 * Design: Premium data dashboard with stat cards, alert feed, and appointment scheduler.
 */

import { useQuery } from '@tanstack/react-query'
import { getAdminDashboard, suggestSlots, bookAppointment } from '../../services/api'
import {
  Users, AlertOctagon, Calendar, Activity, TrendingUp, Clock,
  RefreshCw, CheckCircle, ChevronRight, ArrowUpRight,
} from 'lucide-react'
import clsx from 'clsx'
import type { AdminStats, PatientRiskAlert, PatientRow, RiskLevel } from '../../types'
import { useState } from 'react'
import { format, parseISO } from 'date-fns'

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, color, bg, alert = false,
}: {
  label: string; value: string | number; icon: React.ElementType;
  color: string; bg: string; alert?: boolean;
}) {
  return (
    <div className={clsx('card p-5 relative overflow-hidden', alert && 'ring-1 ring-red-300')}>
      {alert && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-ping" />}
      <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center mb-3', bg)}>
        <Icon className={clsx('h-4.5 w-4.5', color)} />
      </div>
      <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}

// ── Stats grid ────────────────────────────────────────────────────────────────

function StatsGrid({ stats }: { stats: AdminStats }) {
  const cards = [
    { label: 'Total Patients',    value: stats.total_patients,      icon: Users,         color: 'text-brand-600',   bg: 'bg-brand-50'   },
    { label: 'High Risk',         value: stats.high_risk_count,     icon: AlertOctagon,  color: 'text-red-600',     bg: 'bg-red-50',    alert: stats.high_risk_count > 0 },
    { label: 'Missed Check-Ins',  value: stats.missed_checkins_today,icon: Clock,         color: 'text-amber-600',   bg: 'bg-amber-50'   },
    { label: 'Adherence Rate',    value: `${stats.adherence_rate}%`,  icon: TrendingUp,    color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pending Appts',     value: stats.pending_appointments,  icon: Calendar,      color: 'text-blue-600',    bg: 'bg-blue-50'    },
    { label: 'Overdue Exams',     value: stats.overdue_exams,         icon: Activity,      color: 'text-violet-600',  bg: 'bg-violet-50'  },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {cards.map(c => <StatCard key={c.label} {...c} />)}
    </div>
  )
}

// ── Alert feed ────────────────────────────────────────────────────────────────

function AlertFeed({ alerts }: { alerts: PatientRiskAlert[] }) {
  const dotColor: Record<RiskLevel, string> = {
    high: 'bg-red-500', medium: 'bg-amber-400', low: 'bg-emerald-500',
  }
  const headerColor: Record<RiskLevel, string> = {
    high: 'text-red-700', medium: 'text-amber-700', low: 'text-emerald-700',
  }
  const wrapColor: Record<RiskLevel, string> = {
    high:   'border-red-100 hover:border-red-200',
    medium: 'border-amber-100 hover:border-amber-200',
    low:    'border-slate-100 hover:border-slate-200',
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <AlertOctagon className="h-4 w-4 text-red-500" />
          Active Alerts
        </h2>
        <span className="badge badge-high">{alerts.filter(a => a.risk_level === 'high').length} critical</span>
      </div>
      <div className="divide-y divide-slate-50">
        {alerts.map((alert, i) => (
          <div key={i} className={clsx('px-5 py-3.5 border-l-2 hover:bg-slate-50 transition-colors cursor-default', wrapColor[alert.risk_level])}>
            <div className="flex items-center gap-2.5 mb-1">
              <span className={clsx('w-2 h-2 rounded-full flex-shrink-0', dotColor[alert.risk_level])} />
              <p className={clsx('text-xs font-semibold flex-1', headerColor[alert.risk_level])}>
                {alert.patient_name}
              </p>
              <p className="text-2xs text-slate-400">
                {format(parseISO(alert.timestamp), 'HH:mm')}
              </p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pl-4.5 line-clamp-2">{alert.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Patient roster ────────────────────────────────────────────────────────────

function PatientRoster({ patients }: { patients: PatientRow[] }) {
  const dot: Record<string, string> = { high: 'bg-red-500', medium: 'bg-amber-400', low: 'bg-emerald-500' }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <Users className="h-4 w-4 text-brand-600" />
          Patient Roster
        </h2>
        <span className="badge badge-neutral">{patients.length} patients</span>
      </div>
      <div className="divide-y divide-slate-50">
        {patients.map(p => (
          <div key={p.patient_id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-2xs font-bold flex-shrink-0">
              {p.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
              <p className="text-2xs text-slate-400">Age {p.age} · Last: {p.last_checkin}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {p.pending_exams.length > 0 && (
                <span className="badge badge-neutral">{p.pending_exams.length} pending</span>
              )}
              <span className={clsx('w-2.5 h-2.5 rounded-full', dot[p.risk])} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Smart Appointment Scheduler ───────────────────────────────────────────────

function AppointmentScheduler() {
  const [patientId, setPId]    = useState('PAT-001')
  const [specialist, setSpec]  = useState('pulmonology')
  const [urgency, setUrg]      = useState('moderate')
  const [slots, setSlots]      = useState<any[]>([])
  const [booked, setBooked]    = useState<string | null>(null)
  const [loading, setLoading]  = useState(false)

  const suggest = async () => {
    setLoading(true); setBooked(null)
    try { setSlots((await suggestSlots(patientId, specialist, urgency)).slots) }
    finally { setLoading(false) }
  }

  const book = async (slot: any) => {
    await bookAppointment({
      patient_id: patientId, specialist_type: slot.specialist_type,
      provider_name: slot.provider_name, date: slot.date,
      time: slot.time, location: slot.location,
    })
    setBooked(`${slot.date} at ${slot.time} with ${slot.provider_name}`)
    setSlots([])
  }

  return (
    <div className="card mt-5 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-500" />
          Smart Appointment Scheduler
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">AI-optimised scheduling based on clinical urgency</p>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Patient', val: patientId, set: setPId,
              options: [['PAT-001','Sarah Mitchell'],['PAT-002','James Okonkwo'],['PAT-003','Amelia Patel']] },
            { label: 'Specialist', val: specialist, set: setSpec,
              options: [['pulmonology','Pulmonology'],['cardiology','Cardiology'],['oncology','Oncology'],['neurology','Neurology'],['general','General'],['physiotherapy','Physiotherapy']] },
            { label: 'Urgency', val: urgency, set: setUrg,
              options: [['low','Low'],['moderate','Moderate'],['high','High'],['critical','Critical']] },
          ].map(({ label, val, set, options }) => (
            <div key={label}>
              <label className="label-field">{label}</label>
              <select value={val} onChange={e => set(e.target.value)} className="input">
                {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          ))}
        </div>

        <button onClick={suggest} disabled={loading} className="btn-primary">
          {loading ? <><RefreshCw className="h-4 w-4 animate-spin" />Finding slots…</> : <><Calendar className="h-4 w-4" />Find Available Slots</>}
        </button>

        {booked && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 animate-slideUp">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            Booked: {booked}
          </div>
        )}

        {slots.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
            {slots.map((slot, i) => (
              <button
                key={i}
                onClick={() => book(slot)}
                className="group p-3.5 bg-white border border-slate-200 hover:border-brand-300 hover:bg-brand-50 rounded-xl text-left transition-all shadow-xs"
              >
                <p className="text-xs font-semibold text-slate-800">{slot.date}</p>
                <p className="text-2xs text-brand-600 font-medium mt-0.5">{slot.time}</p>
                <p className="text-2xs text-slate-500 mt-1 truncate">{slot.provider_name}</p>
                <div className="flex items-center gap-1 mt-2 text-2xs text-slate-400 group-hover:text-brand-600 transition-colors">
                  Book appointment <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 skeleton w-48 rounded" />
      <div className="grid grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => <div key={i} className="h-28 skeleton rounded-xl" />)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-72 skeleton rounded-xl" />
        <div className="h-72 skeleton rounded-xl" />
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn:  getAdminDashboard,
    refetchInterval: 30_000,
  })

  if (isLoading) return <Loading />

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hospital Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Operational overview · Updated {data?.generated_at ? format(parseISO(data.generated_at), 'HH:mm') : '—'}
          </p>
        </div>
        <button onClick={() => refetch()} className="btn-secondary btn-sm">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      {data?.stats && <StatsGrid stats={data.stats} />}

      {/* Two-column content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {data?.alerts && <AlertFeed alerts={data.alerts} />}
        {data?.patients && <PatientRoster patients={data.patients} />}
      </div>

      {/* Scheduler */}
      <AppointmentScheduler />
    </div>
  )
}
