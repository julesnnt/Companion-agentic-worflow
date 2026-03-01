/**
 * EventModal — Create / view / edit / delete a health event.
 */

import { useState } from 'react'
import { X, Trash2, Edit2, Check, Stethoscope, Pill, FlaskConical, AlertCircle } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../../services/api'
import { useAppStore } from '../../store/appStore'
import clsx from 'clsx'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { HealthEvent, HealthEventType } from '../../types'

// ── Config ────────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<HealthEventType, {
  label: string; icon: React.ElementType; bg: string; text: string; border: string
}> = {
  appointment: { label: 'Rendez-vous',  icon: Stethoscope,  bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },
  medication:  { label: 'Médicament',   icon: Pill,         bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  exam:        { label: 'Examen',       icon: FlaskConical, bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  urgent:      { label: 'Urgent',       icon: AlertCircle,  bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toLocalInput(iso: string): string {
  try { return iso.slice(0, 16) } catch { return '' }
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  event?: HealthEvent           // undefined = create mode
  defaultDate?: string          // ISO date for create mode
  onClose: () => void
}

export default function EventModal({ event, defaultDate, onClose }: Props) {
  const { patientId } = useAppStore()
  const qc = useQueryClient()
  const isCreate = !event

  const [editing, setEditing] = useState(isCreate)
  const [form, setForm] = useState({
    type:           (event?.type ?? 'appointment') as HealthEventType,
    title:          event?.title ?? '',
    description:    event?.description ?? '',
    start_datetime: toLocalInput(event?.start_datetime ?? defaultDate ?? new Date().toISOString()),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['calendar-events'] })

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { ...form, user_id: patientId, recurring: false,
        start_datetime: new Date(form.start_datetime).toISOString() }
      return isCreate
        ? createCalendarEvent(payload)
        : updateCalendarEvent(event!.id, payload)
    },
    onSuccess: () => { invalidate(); onClose() },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteCalendarEvent(event!.id, patientId),
    onSuccess: () => { invalidate(); onClose() },
  })

  const cfg = TYPE_CONFIG[form.type]
  const Icon = cfg.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-modal max-w-md w-full overflow-hidden animate-slideUp">

        {/* Header */}
        <div className={clsx('px-5 py-4 flex items-center gap-3 border-b', cfg.bg, cfg.border)}>
          <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', cfg.bg, cfg.border, 'border')}>
            <Icon className={clsx('h-4 w-4', cfg.text)} />
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as HealthEventType }))}
                className={clsx('text-sm font-semibold bg-transparent border-none outline-none cursor-pointer', cfg.text)}
              >
                {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            ) : (
              <p className={clsx('text-sm font-semibold', cfg.text)}>{cfg.label}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!isCreate && !editing && (
              <button onClick={() => setEditing(true)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white/60 transition-colors">
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            )}
            <button onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white/60 transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">

          {/* Title */}
          <div>
            <label className="label-field">Titre</label>
            {editing ? (
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Nom de l'événement"
                className="input"
                autoFocus
              />
            ) : (
              <p className="text-base font-semibold text-slate-900">{event?.title}</p>
            )}
          </div>

          {/* Date/time */}
          <div>
            <label className="label-field">Date et heure</label>
            {editing ? (
              <input
                type="datetime-local"
                value={form.start_datetime}
                onChange={e => setForm(f => ({ ...f, start_datetime: e.target.value }))}
                className="input"
              />
            ) : (
              <p className="text-sm text-slate-700">
                {event && format(parseISO(event.start_datetime), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="label-field">Notes</label>
            {editing ? (
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Instructions, notes..."
                rows={3}
                className="input"
              />
            ) : (
              <p className="text-sm text-slate-600 leading-relaxed">
                {event?.description || <span className="text-slate-400 italic">Aucune note</span>}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex items-center gap-2">
          {editing ? (
            <>
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !form.title}
                className="btn-primary flex-1 justify-center"
              >
                <Check className="h-4 w-4" />
                {saveMutation.isPending ? 'Enregistrement…' : isCreate ? 'Créer' : 'Sauvegarder'}
              </button>
              {!isCreate && (
                <button onClick={() => setEditing(false)} className="btn-secondary">
                  Annuler
                </button>
              )}
            </>
          ) : (
            <>
              <button onClick={onClose} className="btn-secondary flex-1 justify-center">Fermer</button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="btn-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
