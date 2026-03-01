/**
 * HealthCalendar — Premium monthly health event calendar.
 * Design: Notion / Apple Calendar inspired.
 * Features: Month / Week / List views, drag-and-drop, event CRUD.
 */

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft, ChevronRight, Plus, Stethoscope, Pill,
  FlaskConical, AlertCircle, List, LayoutGrid, CalendarDays,
} from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths,
  parseISO, isToday, addWeeks, subWeeks,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import clsx from 'clsx'
import { getCalendarEvents, updateCalendarEvent } from '../../services/api'
import { useAppStore } from '../../store/appStore'
import type { HealthEvent, HealthEventType } from '../../types'
import EventModal from './EventModal'

// ── Event type config ─────────────────────────────────────────────────────────

const TYPE_CFG: Record<HealthEventType, {
  label: string; icon: React.ElementType
  chip: string; dot: string; border: string
}> = {
  appointment: {
    label: 'Rendez-vous', icon: Stethoscope,
    chip: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    dot: 'bg-blue-500', border: 'border-blue-200',
  },
  medication: {
    label: 'Médicament', icon: Pill,
    chip: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
    dot: 'bg-emerald-500', border: 'border-emerald-200',
  },
  exam: {
    label: 'Examen', icon: FlaskConical,
    chip: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
    dot: 'bg-amber-500', border: 'border-amber-200',
  },
  urgent: {
    label: 'Urgent', icon: AlertCircle,
    chip: 'bg-red-100 text-red-700 hover:bg-red-200',
    dot: 'bg-red-500', border: 'border-red-200',
  },
}

type CalView = 'month' | 'week' | 'list'

// ── Event chip (draggable) ────────────────────────────────────────────────────

function EventChip({
  event, compact = false,
  onClick,
}: {
  event: HealthEvent; compact?: boolean; onClick: () => void
}) {
  const cfg = TYPE_CFG[event.type]
  const Icon = cfg.icon
  const time = format(parseISO(event.start_datetime), 'HH:mm')

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('eventId', event.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      title={event.title}
      className={clsx(
        'flex items-center gap-1 rounded text-2xs font-medium cursor-grab active:cursor-grabbing transition-colors truncate select-none',
        compact ? 'px-1 py-px' : 'px-1.5 py-0.5',
        cfg.chip,
      )}
    >
      <Icon className="h-2.5 w-2.5 flex-shrink-0" />
      <span className="truncate">{time} {event.title}</span>
    </div>
  )
}

// ── Month view ────────────────────────────────────────────────────────────────

const WEEKDAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function MonthView({
  currentDate,
  events,
  onDropEvent,
  onClickEvent,
  onAddEvent,
}: {
  currentDate: Date
  events: HealthEvent[]
  onDropEvent: (id: string, date: Date) => void
  onClickEvent: (ev: HealthEvent) => void
  onAddEvent: (date: Date) => void
}) {
  const [dragOverDate, setDragOverDate] = useState<string | null>(null)

  const calStart = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
  const calEnd   = endOfWeek(endOfMonth(currentDate),   { weekStartsOn: 1 })
  const days     = eachDayOfInterval({ start: calStart, end: calEnd })

  const eventsForDay = useCallback((day: Date) =>
    events.filter(ev => isSameDay(parseISO(ev.start_datetime), day))
      .sort((a, b) => a.start_datetime.localeCompare(b.start_datetime)),
    [events],
  )

  const handleDrop = (e: React.DragEvent, day: Date) => {
    e.preventDefault()
    setDragOverDate(null)
    const id = e.dataTransfer.getData('eventId')
    if (id) onDropEvent(id, day)
  }

  const MAX = 3

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-slate-200">
        {WEEKDAYS_FR.map(d => (
          <div key={d} className="px-2 py-2 text-center text-2xs font-semibold text-slate-500 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="flex-1 grid grid-cols-7" style={{ gridTemplateRows: `repeat(${days.length / 7}, minmax(0, 1fr))` }}>
        {days.map((day) => {
          const dayKey = format(day, 'yyyy-MM-dd')
          const dayEvs = eventsForDay(day)
          const inMonth = isSameMonth(day, currentDate)
          const today   = isToday(day)
          const over    = dragOverDate === dayKey

          return (
            <div
              key={dayKey}
              className={clsx(
                'border-b border-r border-slate-100 p-1.5 group flex flex-col transition-colors min-h-[90px]',
                !inMonth && 'bg-slate-50/60',
                over && 'bg-brand-50 ring-1 ring-inset ring-brand-300',
              )}
              onDragOver={e => { e.preventDefault(); setDragOverDate(dayKey) }}
              onDragLeave={() => setDragOverDate(null)}
              onDrop={e => handleDrop(e, day)}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span className={clsx(
                  'w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium',
                  today
                    ? 'bg-brand-600 text-white'
                    : inMonth ? 'text-slate-700' : 'text-slate-300',
                )}>
                  {format(day, 'd')}
                </span>
                <button
                  onClick={() => onAddEvent(day)}
                  className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-brand-600 hover:bg-brand-50 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              {/* Events */}
              <div className="space-y-0.5 flex-1">
                {dayEvs.slice(0, MAX).map(ev => (
                  <EventChip key={ev.id} event={ev} compact onClick={() => onClickEvent(ev)} />
                ))}
                {dayEvs.length > MAX && (
                  <p className="text-2xs text-slate-400 px-1 hover:text-slate-600 cursor-default">
                    +{dayEvs.length - MAX} de plus
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Week view ─────────────────────────────────────────────────────────────────

function WeekView({
  currentDate, events, onClickEvent, onAddEvent,
}: {
  currentDate: Date; events: HealthEvent[]
  onClickEvent: (ev: HealthEvent) => void; onAddEvent: (date: Date) => void
}) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: weekStart, end: endOfWeek(currentDate, { weekStartsOn: 1 }) })

  return (
    <div className="flex-1 overflow-auto">
      <div className="grid grid-cols-7 gap-px bg-slate-200 min-h-full">
        {days.map(day => {
          const dayEvs = events
            .filter(ev => isSameDay(parseISO(ev.start_datetime), day))
            .sort((a, b) => a.start_datetime.localeCompare(b.start_datetime))
          const today = isToday(day)

          return (
            <div key={format(day, 'yyyy-MM-dd')} className="bg-white flex flex-col group">
              <div className={clsx(
                'text-center py-3 border-b border-slate-100',
                today && 'bg-brand-50',
              )}>
                <p className="text-2xs text-slate-500 uppercase font-medium">
                  {format(day, 'EEE', { locale: fr })}
                </p>
                <p className={clsx(
                  'text-lg font-bold mt-0.5',
                  today ? 'text-brand-600' : 'text-slate-800',
                )}>
                  {format(day, 'd')}
                </p>
              </div>
              <div className="flex-1 p-1.5 space-y-1 relative">
                {dayEvs.map(ev => (
                  <EventChip key={ev.id} event={ev} onClick={() => onClickEvent(ev)} />
                ))}
                <button
                  onClick={() => onAddEvent(day)}
                  className="w-full flex items-center justify-center gap-1 py-1 text-2xs text-slate-300 hover:text-brand-500 opacity-0 group-hover:opacity-100 transition-all rounded"
                >
                  <Plus className="h-3 w-3" /> Ajouter
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── List view ─────────────────────────────────────────────────────────────────

function ListView({ events, onClickEvent }: { events: HealthEvent[]; onClickEvent: (ev: HealthEvent) => void }) {
  const sorted = [...events].sort((a, b) => a.start_datetime.localeCompare(b.start_datetime))

  // Group by date
  const groups: Record<string, HealthEvent[]> = {}
  for (const ev of sorted) {
    const key = format(parseISO(ev.start_datetime), 'yyyy-MM-dd')
    if (!groups[key]) groups[key] = []
    groups[key].push(ev)
  }

  if (!sorted.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        <div className="text-center">
          <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Aucun événement à venir</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {Object.entries(groups).map(([dateKey, evs]) => {
        const date = new Date(dateKey)
        const today = isToday(date)
        return (
          <div key={dateKey}>
            <div className={clsx(
              'sticky top-0 px-5 py-2 text-xs font-semibold border-b border-slate-100 z-10',
              today ? 'bg-brand-50 text-brand-700' : 'bg-slate-50 text-slate-500',
            )}>
              {format(date, "EEEE d MMMM yyyy", { locale: fr })}
              {today && <span className="ml-2 badge badge-brand text-2xs">Aujourd'hui</span>}
            </div>
            <div className="divide-y divide-slate-50">
              {evs.map(ev => {
                const cfg = TYPE_CFG[ev.type]
                const Icon = cfg.icon
                return (
                  <button
                    key={ev.id}
                    onClick={() => onClickEvent(ev)}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className={clsx('w-1 h-8 rounded-full flex-shrink-0', cfg.dot)} />
                    <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border', cfg.border, 'bg-white')}>
                      <Icon className={clsx('h-3.5 w-3.5', `text-${cfg.dot.replace('bg-', '')}`.replace('bg-', 'text-'))} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{ev.title}</p>
                      {ev.description && (
                        <p className="text-2xs text-slate-400 truncate">{ev.description}</p>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 flex-shrink-0 font-mono">
                      {format(parseISO(ev.start_datetime), 'HH:mm')}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      {Object.entries(TYPE_CFG).map(([type, cfg]) => (
        <div key={type} className="flex items-center gap-1.5">
          <span className={clsx('w-2 h-2 rounded-full flex-shrink-0', cfg.dot)} />
          <span className="text-2xs text-slate-500">{cfg.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium animate-slideUp z-50 flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
      {message}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function HealthCalendar() {
  const { patientId } = useAppStore()
  const qc = useQueryClient()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalView>('month')
  const [selectedEvent, setSelectedEvent] = useState<HealthEvent | undefined>()
  const [addForDate, setAddForDate] = useState<Date | undefined>()
  const [toast, setToast] = useState<string | null>(null)

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar-events', patientId],
    queryFn:  () => getCalendarEvents(patientId),
    staleTime: 0,
  })

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const updateMutation = useMutation({
    mutationFn: ({ id, event }: { id: string; event: Omit<typeof events[0], 'id'> }) =>
      updateCalendarEvent(id, event),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar-events'] })
      showToast('Événement déplacé ✓')
    },
  })

  const handleDropEvent = (eventId: string, newDate: Date) => {
    const ev = events.find(e => e.id === eventId)
    if (!ev) return
    const orig = parseISO(ev.start_datetime)
    const updated = new Date(newDate)
    updated.setHours(orig.getHours(), orig.getMinutes(), 0, 0)
    updateMutation.mutate({
      id: eventId,
      event: { ...ev, start_datetime: updated.toISOString() },
    })
  }

  const goBack = () => view === 'month'
    ? setCurrentDate(subMonths(currentDate, 1))
    : setCurrentDate(new Date(currentDate.getTime() - 7 * 86400000))

  const goForward = () => view === 'month'
    ? setCurrentDate(addMonths(currentDate, 1))
    : setCurrentDate(new Date(currentDate.getTime() + 7 * 86400000))

  const headerLabel = view === 'month'
    ? format(currentDate, 'MMMM yyyy', { locale: fr })
    : `Semaine du ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMMM', { locale: fr })}`

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Health Calendar</h1>
        <p className="text-sm text-slate-500 mt-1">Vos rendez-vous, examens et médicaments au même endroit.</p>
      </div>

      {/* Calendar card */}
      <div className="card flex flex-col overflow-hidden" style={{ minHeight: '580px' }}>

        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 flex-shrink-0">
          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button onClick={goBack} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
              Aujourd'hui
            </button>
            <button onClick={goForward} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Month title */}
          <h2 className="text-sm font-semibold text-slate-800 capitalize flex-1">{headerLabel}</h2>

          {/* Legend */}
          <div className="hidden lg:flex">
            <Legend />
          </div>

          {/* View switcher */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5">
            {([
              { id: 'month', icon: LayoutGrid,   label: 'Mois'     },
              { id: 'week',  icon: CalendarDays,  label: 'Semaine'  },
              { id: 'list',  icon: List,          label: 'Liste'    },
            ] as const).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={clsx(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all',
                  view === id ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Add button */}
          <button
            onClick={() => setAddForDate(currentDate)}
            className="btn-primary btn-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter
          </button>
        </div>

        {/* Calendar body */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {view === 'month' && (
              <MonthView
                currentDate={currentDate}
                events={events}
                onDropEvent={handleDropEvent}
                onClickEvent={setSelectedEvent}
                onAddEvent={setAddForDate}
              />
            )}
            {view === 'week' && (
              <WeekView
                currentDate={currentDate}
                events={events}
                onClickEvent={setSelectedEvent}
                onAddEvent={setAddForDate}
              />
            )}
            {view === 'list' && (
              <ListView
                events={events.filter(ev => new Date(ev.start_datetime) >= new Date(new Date().setHours(0,0,0,0)))}
                onClickEvent={setSelectedEvent}
              />
            )}
          </>
        )}
      </div>

      {/* Event modal */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(undefined)}
        />
      )}
      {addForDate && !selectedEvent && (
        <EventModal
          defaultDate={addForDate.toISOString()}
          onClose={() => setAddForDate(undefined)}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} />}
    </div>
  )
}
