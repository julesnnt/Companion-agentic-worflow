/**
 * MedicationManager — Premium medication tracker.
 * Design: Clean cards with adherence ring and dose toggles.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMedications, logDose, getAdherence } from '../../services/api'
import { useAppStore } from '../../store/appStore'
import { CheckCircle, Circle, Pill, TrendingUp, AlertTriangle, Info } from 'lucide-react'
import clsx from 'clsx'
import type { Medication } from '../../types'

// ── Adherence ring ────────────────────────────────────────────────────────────

function AdherenceRing({ pct, size = 56 }: { pct: number; size?: number }) {
  const r      = (size / 2) - 5
  const circ   = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)
  const color  = pct >= 80 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#EF4444'

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F1F5F9" strokeWidth="4" />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${circ}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  )
}

// ── Medication card ───────────────────────────────────────────────────────────

function MedCard({
  med,
  adherencePct,
  onToggle,
}: {
  med: Medication
  adherencePct: number
  onToggle: (idx: number, taken: boolean) => void
}) {
  const allTaken = med.taken_today.every(Boolean)

  return (
    <div className={clsx(
      'card p-5 transition-all',
      allTaken && 'border-emerald-200',
    )}>
      <div className="flex items-start gap-4">
        {/* Adherence ring */}
        <div className="relative flex-shrink-0">
          <AdherenceRing pct={adherencePct} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xs font-bold text-slate-700">{Math.round(adherencePct)}%</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">{med.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{med.frequency}</p>
            </div>
            <span className="badge badge-brand flex-shrink-0">{med.dosage}</span>
          </div>

          <p className="text-xs text-slate-400 mt-1.5">{med.instructions}</p>

          {/* Dose toggles */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {med.times.map((time, idx) => {
              const taken = med.taken_today[idx]
              return (
                <button
                  key={idx}
                  onClick={() => onToggle(idx, !taken)}
                  className={clsx(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150',
                    taken
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300',
                  )}
                >
                  {taken
                    ? <CheckCircle className="h-3.5 w-3.5" />
                    : <Circle className="h-3.5 w-3.5" />
                  }
                  {time}
                </button>
              )
            })}
          </div>

          {/* Side effects */}
          {med.side_effects.length > 0 && (
            <div className="flex items-start gap-1.5 mt-3 text-2xs text-amber-600">
              <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
              <span>Side effects: {med.side_effects.join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Overall adherence card ────────────────────────────────────────────────────

function AdherenceSummary({ avg }: { avg: number }) {
  const color  = avg >= 80 ? 'text-emerald-600' : avg >= 60 ? 'text-amber-600' : 'text-red-600'
  const msg    = avg >= 80 ? 'Excellent — keep it up!'
               : avg >= 60 ? 'Good, try to improve consistency.'
               : 'Low adherence. Please speak to your care team.'

  return (
    <div className="card p-5 flex items-center gap-5 mb-5">
      <div className="relative flex-shrink-0">
        <AdherenceRing pct={avg} size={64} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={clsx('text-sm font-bold', color)}>{Math.round(avg)}%</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800">Overall Adherence</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{msg}</p>
      </div>
      <TrendingUp className={clsx('h-5 w-5 ml-auto flex-shrink-0', color)} />
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-32 skeleton rounded-xl" />
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MedicationManager() {
  const { patientId } = useAppStore()
  const qc = useQueryClient()

  const { data: medications, isLoading } = useQuery({
    queryKey: ['medications', patientId],
    queryFn:  () => getMedications(patientId),
  })
  const { data: adherence } = useQuery({
    queryKey: ['adherence', patientId],
    queryFn:  () => getAdherence(patientId),
  })

  const logMutation = useMutation({
    mutationFn: ({ medId, idx, taken }: { medId: string; idx: number; taken: boolean }) =>
      logDose(medId, idx, taken),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medications', patientId] })
      qc.invalidateQueries({ queryKey: ['adherence',   patientId] })
    },
  })

  if (isLoading) return <Skeleton />

  const avg = adherence?.length
    ? adherence.reduce((s, a) => s + a.adherence_percentage, 0) / adherence.length
    : 0

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Medications</h1>
        <p className="text-sm text-slate-500 mt-1">Track your daily doses and monitor adherence.</p>
      </div>

      {adherence && <AdherenceSummary avg={avg} />}

      <div className="space-y-3">
        {medications?.map(med => (
          <MedCard
            key={med.id}
            med={med}
            adherencePct={adherence?.find(a => a.medication_id === med.id)?.adherence_percentage ?? 0}
            onToggle={(idx, taken) => logMutation.mutate({ medId: med.id, idx, taken })}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 mt-5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
        <Info className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
        <p className="text-xs text-slate-500">
          Always take medications as prescribed. Contact your physician before making any changes.
        </p>
      </div>
    </div>
  )
}
