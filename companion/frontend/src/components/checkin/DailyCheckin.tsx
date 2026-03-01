/**
 * DailyCheckin — Premium structured symptom check-in form.
 * Design: Clean form with visual sliders and clear risk feedback.
 */

import { useState } from 'react'
import { Activity, Thermometer, Zap, MessageSquare, Pill, Send, AlertOctagon, CheckCircle, TrendingDown } from 'lucide-react'
import { submitCheckin } from '../../services/api'
import { useAppStore } from '../../store/appStore'
import type { CheckinResult } from '../../types'
import clsx from 'clsx'

const DEFAULT = {
  pain_level: 0, temperature: 36.6, fatigue_level: 0,
  custom_symptoms: '', medications_taken: true,
}

// ── Value colour helper ───────────────────────────────────────────────────────

function levelColor(v: number, max = 10) {
  if (v >= max * 0.7) return 'text-red-600'
  if (v >= max * 0.4) return 'text-amber-600'
  return 'text-emerald-600'
}

// ── Slider field ──────────────────────────────────────────────────────────────

function SliderField({
  icon: Icon, label, value, min, max, step = 1, unit = '',
  onChange, note,
}: {
  icon: React.ElementType; label: string; value: number; min: number; max: number;
  step?: number; unit?: string; onChange: (v: number) => void; note?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-slate-400" />
          <label className="label-field !mb-0 !text-slate-700">{label}</label>
        </div>
        <span className={clsx('text-sm font-bold tabular-nums', levelColor(value - min, max - min))}>
          {value}{unit}
        </span>
      </div>
      <div className="relative">
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(step === 1 ? parseInt(e.target.value) : parseFloat(e.target.value))}
          className="w-full"
          style={{
            background: `linear-gradient(to right, #0D9488 ${pct}%, #E2E8F0 ${pct}%)`,
          }}
        />
      </div>
      {note && <p className="text-2xs text-slate-400">{note}</p>}
    </div>
  )
}

// ── Result card ───────────────────────────────────────────────────────────────

function ResultCard({ result }: { result: CheckinResult }) {
  const styles = {
    high:   { wrap: 'border-red-200 bg-red-50',    head: 'text-red-700',    icon: AlertOctagon,  color: 'text-red-500'    },
    medium: { wrap: 'border-amber-200 bg-amber-50', head: 'text-amber-700',  icon: TrendingDown,  color: 'text-amber-500'  },
    low:    { wrap: 'border-emerald-200 bg-white',  head: 'text-emerald-700', icon: CheckCircle,  color: 'text-emerald-500' },
  }[result.risk_level]

  const Ic = styles.icon

  return (
    <div className={clsx('card border p-5 mt-5 animate-slideUp', styles.wrap)}>
      <div className="flex items-start gap-3">
        <Ic className={clsx('h-5 w-5 flex-shrink-0 mt-0.5', styles.color)} />
        <div className="flex-1">
          <p className={clsx('text-sm font-semibold mb-1', styles.head)}>
            {result.risk_level === 'high' ? 'High Risk Detected'
             : result.risk_level === 'medium' ? 'Moderate Concern'
             : 'Check-In Complete'}
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">{result.message}</p>
          <div className="mt-3 p-3 bg-white/70 rounded-lg border border-white">
            <p className="text-xs font-semibold text-slate-600 mb-1">Recommended action</p>
            <p className="text-xs text-slate-700 leading-relaxed">{result.suggested_action}</p>
          </div>
          {result.flags.length > 0 && (
            <div className="mt-3 space-y-1">
              {result.flags.map((f, i) => (
                <p key={i} className="text-xs text-slate-500 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-slate-400 flex-shrink-0" />
                  {f}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DailyCheckin() {
  const { patientId, setEmergencyModal } = useAppStore()
  const [form, setForm]       = useState(DEFAULT)
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState<CheckinResult | null>(null)

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const res = await submitCheckin({ patient_id: patientId, ...form })
      setResult(res)
      if (res.emergency) setEmergencyModal(true)
    } catch {
      setResult({ risk_level: 'low', suggested_action: 'Try again.', notify_physician: false, emergency: false, message: 'Connection error.', flags: [] })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Daily Check-In</h1>
        <p className="text-sm text-slate-500 mt-1">
          Tell us how you're feeling. Your care team monitors this data.
        </p>
      </div>

      <form onSubmit={handle} className="card p-6 space-y-6 max-w-lg">

        <SliderField
          icon={Activity} label="Pain Level" value={form.pain_level}
          min={0} max={10} unit="/10"
          onChange={v => setForm(f => ({ ...f, pain_level: v }))}
          note="0 = No pain · 10 = Unbearable"
        />

        <SliderField
          icon={Thermometer} label="Body Temperature" value={form.temperature}
          min={35.0} max={42.0} step={0.1} unit="°C"
          onChange={v => setForm(f => ({ ...f, temperature: v }))}
          note="Normal: 36.1–37.5°C · Fever: > 38.5°C"
        />

        <SliderField
          icon={Zap} label="Fatigue Level" value={form.fatigue_level}
          min={0} max={10} unit="/10"
          onChange={v => setForm(f => ({ ...f, fatigue_level: v }))}
          note="0 = Fully energised · 10 = Severely exhausted"
        />

        {/* Medications toggle */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Pill className="h-4 w-4 text-slate-400" />
            <label className="label-field !mb-0 !text-slate-700">Medications taken today?</label>
          </div>
          <div className="flex gap-2">
            {[
              { v: true,  label: 'Yes, all taken',   active: 'bg-emerald-600 text-white border-emerald-600' },
              { v: false, label: 'No / missed dose',  active: 'bg-red-500 text-white border-red-500' },
            ].map(({ v, label, active }) => (
              <button
                key={String(v)}
                type="button"
                onClick={() => setForm(f => ({ ...f, medications_taken: v }))}
                className={clsx(
                  'flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all',
                  form.medications_taken === v ? active : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Symptoms text */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-slate-400" />
            <label className="label-field !mb-0 !text-slate-700">Any other symptoms or concerns?</label>
          </div>
          <textarea
            value={form.custom_symptoms}
            onChange={e => setForm(f => ({ ...f, custom_symptoms: e.target.value }))}
            placeholder="Describe any symptoms, concerns, or changes you've noticed…"
            rows={3}
            className="input"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analysing…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Submit Check-In
            </>
          )}
        </button>
      </form>

      {result && <ResultCard result={result} />}
    </div>
  )
}
