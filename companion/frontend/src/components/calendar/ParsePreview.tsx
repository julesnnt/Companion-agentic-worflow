/**
 * ParsePreview — "Wow" modal: Companion auto-extracted events from a medical report.
 * User reviews, edits dates, then confirms → bulk-creates events on calendar.
 */

import { useState } from 'react'
import { X, Sparkles, Stethoscope, Pill, FlaskConical, AlertCircle, Check, Calendar, Edit2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { bulkCreateCalendarEvents } from '../../services/api'
import { useAppStore } from '../../store/appStore'
import clsx from 'clsx'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { HealthEvent, HealthEventType, ParsedEventsPreview } from '../../types'

// ── Config ────────────────────────────────────────────────────────────────────

const TYPE_CFG: Record<HealthEventType, {
  label: string; icon: React.ElementType; bg: string; text: string; dot: string
}> = {
  appointment: { label: 'Rendez-vous', icon: Stethoscope,  bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
  medication:  { label: 'Médicament',  icon: Pill,         bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  exam:        { label: 'Examen',      icon: FlaskConical, bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500'   },
  urgent:      { label: 'Urgent',      icon: AlertCircle,  bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500'     },
}

function toLocalInput(iso: string): string {
  try { return iso.slice(0, 16) } catch { return '' }
}

// ── Event row ─────────────────────────────────────────────────────────────────

function EventRow({
  event,
  checked,
  onToggle,
  onDateChange,
}: {
  event: HealthEvent
  checked: boolean
  onToggle: () => void
  onDateChange: (newIso: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const cfg = TYPE_CFG[event.type]
  const Icon = cfg.icon

  return (
    <div className={clsx(
      'flex items-start gap-3 px-4 py-3 transition-colors',
      checked ? 'bg-white' : 'bg-slate-50 opacity-60',
    )}>
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={clsx(
          'w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0 mt-0.5 transition-all',
          checked
            ? 'bg-brand-600 border-brand-600 text-white'
            : 'border-slate-300 bg-white',
        )}
      >
        {checked && <Check className="h-3 w-3" />}
      </button>

      {/* Type icon */}
      <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', cfg.bg)}>
        <Icon className={clsx('h-3.5 w-3.5', cfg.text)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{event.title}</p>
            {event.description && (
              <p className="text-2xs text-slate-400 truncate mt-0.5">{event.description}</p>
            )}
          </div>
          <span className={clsx('badge text-2xs flex-shrink-0', cfg.bg, cfg.text)}>{cfg.label}</span>
        </div>

        {/* Date/time */}
        <div className="flex items-center gap-2 mt-1.5">
          <Calendar className="h-3 w-3 text-slate-400 flex-shrink-0" />
          {editing ? (
            <input
              type="datetime-local"
              defaultValue={toLocalInput(event.start_datetime)}
              onBlur={e => {
                onDateChange(new Date(e.target.value).toISOString())
                setEditing(false)
              }}
              autoFocus
              className="text-xs border border-brand-300 rounded px-2 py-0.5 outline-none ring-1 ring-brand-500/20"
            />
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-brand-600 transition-colors group"
            >
              {format(parseISO(event.start_datetime), "d MMM yyyy 'à' HH:mm", { locale: fr })}
              <Edit2 className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  data: ParsedEventsPreview
  onClose: () => void
  onConfirmed: () => void
}

export default function ParsePreview({ data, onClose, onConfirmed }: Props) {
  const { patientId, setActiveView } = useAppStore()
  const qc = useQueryClient()

  // Local editable copies of events
  const [events, setEvents] = useState<HealthEvent[]>(data.events)
  const [checked, setChecked] = useState<Set<string>>(new Set(data.events.map(e => e.id)))

  const toggleChecked = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const updateDate = (id: string, newIso: string) => {
    setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, start_datetime: newIso } : ev))
  }

  const selectedEvents = events.filter(ev => checked.has(ev.id))

  const confirmMutation = useMutation({
    mutationFn: () => bulkCreateCalendarEvents(
      selectedEvents.map(ev => ({ ...ev, user_id: patientId }))
    ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar-events'] })
      setActiveView('calendar')
      onConfirmed()
    },
  })

  // Group events by type for display
  const groups: Partial<Record<HealthEventType, HealthEvent[]>> = {}
  for (const ev of events) {
    if (!groups[ev.type]) groups[ev.type] = []
    groups[ev.type]!.push(ev)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-2xl overflow-hidden animate-slideUp flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  Companion a planifié votre suivi
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">{data.summary}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Select all */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{checked.size}</span> événement{checked.size > 1 ? 's' : ''} sélectionné{checked.size > 1 ? 's' : ''}
            </p>
            <button
              onClick={() => checked.size === events.length
                ? setChecked(new Set())
                : setChecked(new Set(events.map(e => e.id)))
              }
              className="text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
            >
              {checked.size === events.length ? 'Tout décocher' : 'Tout sélectionner'}
            </button>
          </div>
        </div>

        {/* Event list — scrollable */}
        <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
          {events.map(ev => (
            <EventRow
              key={ev.id}
              event={ev}
              checked={checked.has(ev.id)}
              onToggle={() => toggleChecked(ev.id)}
              onDateChange={(iso) => updateDate(ev.id, iso)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-3 flex-shrink-0 bg-slate-50/80">
          <p className="text-xs text-slate-400 flex-1">
            Cliquez sur une date pour la modifier avant confirmation.
          </p>
          <button onClick={onClose} className="btn-secondary btn-sm">
            Annuler
          </button>
          <button
            onClick={() => confirmMutation.mutate()}
            disabled={confirmMutation.isPending || checked.size === 0}
            className="btn-primary"
          >
            {confirmMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Ajout en cours…
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Ajouter {checked.size} événement{checked.size > 1 ? 's' : ''} au calendrier
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
