/**
 * TreatmentTimeline — Premium interactive care roadmap.
 * Design: Vertical timeline with phase cards and clear status hierarchy.
 */

import { useAppStore } from '../../store/appStore'
import { CheckCircle, Clock, Microscope, Heart, Calendar, Stethoscope, User, Briefcase } from 'lucide-react'
import clsx from 'clsx'
import type { TreatmentPhase, PhaseType, RoadmapTask } from '../../types'
import ReportUploader from '../reports/ReportUploader'

const TYPE_CONFIG: Record<PhaseType, { icon: React.ElementType; color: string; bg: string }> = {
  diagnosis:   { icon: Microscope,  color: 'text-blue-600',   bg: 'bg-blue-100'   },
  treatment:   { icon: Heart,       color: 'text-rose-600',   bg: 'bg-rose-100'   },
  monitoring:  { icon: Clock,       color: 'text-brand-600',  bg: 'bg-brand-100'  },
  'follow-up': { icon: Calendar,    color: 'text-violet-600', bg: 'bg-violet-100' },
  specialist:  { icon: Stethoscope, color: 'text-amber-600',  bg: 'bg-amber-100'  },
}

const OWNER_CONFIG: Record<string, { color: string; icon: React.ElementType }> = {
  patient:    { color: 'text-brand-600 bg-brand-50 border-brand-200',   icon: User      },
  doctor:     { color: 'text-blue-600 bg-blue-50 border-blue-200',      icon: Stethoscope },
  specialist: { color: 'text-amber-600 bg-amber-50 border-amber-200',   icon: Briefcase },
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressSummary({ phases }: { phases: TreatmentPhase[] }) {
  const total     = phases.length
  const completed = phases.filter(p => p.status === 'completed').length
  const active    = phases.filter(p => p.status === 'active').length
  const pct       = Math.round(((completed + active * 0.5) / total) * 100)

  return (
    <div className="card p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-slate-700">Care Progress</p>
        <span className="text-lg font-bold text-brand-600">{pct}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />{completed} completed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-brand-400" />{active} active
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-300" />{total - completed - active} upcoming
        </span>
      </div>
    </div>
  )
}

// ── Phase card ────────────────────────────────────────────────────────────────

function PhaseCard({ phase, index, isLast }: { phase: TreatmentPhase; index: number; isLast: boolean }) {
  const config    = TYPE_CONFIG[phase.type] ?? TYPE_CONFIG.monitoring
  const Icon      = config.icon
  const isActive  = phase.status === 'active'
  const isDone    = phase.status === 'completed'

  return (
    <div className="flex gap-4">
      {/* Left column — icon + connector */}
      <div className="flex flex-col items-center flex-shrink-0" style={{ width: '40px' }}>
        <div className={clsx(
          'w-10 h-10 rounded-xl flex items-center justify-center shadow-xs',
          isDone ? 'bg-emerald-100' : isActive ? config.bg : 'bg-slate-100',
        )}>
          {isDone
            ? <CheckCircle className="h-5 w-5 text-emerald-600" />
            : <Icon className={clsx('h-5 w-5', isActive ? config.color : 'text-slate-400')} />
          }
        </div>
        {!isLast && (
          <div className={clsx(
            'w-0.5 flex-1 mt-2 mb-2 min-h-6',
            isDone ? 'bg-emerald-200' : isActive ? 'bg-brand-200' : 'bg-slate-200',
          )} />
        )}
      </div>

      {/* Right column — content card */}
      <div className="flex-1 pb-5">
        <div className={clsx(
          'card p-4 transition-all',
          isActive ? 'border-brand-200 bg-white shadow-sm' :
          isDone   ? 'border-slate-100 bg-slate-50/50 opacity-80' :
                     'border-slate-100',
        )}>
          {/* Phase header */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <p className={clsx(
                'text-sm font-semibold',
                isActive ? 'text-slate-900' : isDone ? 'text-slate-500' : 'text-slate-600',
              )}>
                {phase.phase}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{phase.expected_timeframe}</p>
            </div>
            <PhaseStatusBadge status={phase.status} />
          </div>

          <p className="text-xs text-slate-500 leading-relaxed mb-3">{phase.description}</p>

          {/* Tasks */}
          <div className="space-y-1.5">
            {phase.tasks.map((task, i) => <TaskRow key={i} task={task} />)}
          </div>
        </div>
      </div>
    </div>
  )
}

function TaskRow({ task }: { task: RoadmapTask }) {
  const ownerConf = OWNER_CONFIG[task.owner] ?? OWNER_CONFIG.patient
  const Icon = ownerConf.icon

  return (
    <div className="flex items-start gap-2.5 py-1.5 px-2 rounded-lg hover:bg-slate-50 transition-colors">
      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0 mt-1.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-700">{task.task}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={clsx('inline-flex items-center gap-1 text-2xs px-1.5 py-0.5 rounded-full border', ownerConf.color)}>
            <Icon className="h-2.5 w-2.5" />
            {task.owner}
          </span>
          {task.due_in && <span className="text-2xs text-slate-400">{task.due_in}</span>}
        </div>
      </div>
    </div>
  )
}

function PhaseStatusBadge({ status }: { status: TreatmentPhase['status'] }) {
  if (status === 'active')    return <span className="badge badge-brand">In Progress</span>
  if (status === 'completed') return <span className="badge badge-low">Completed</span>
  return <span className="badge badge-neutral">Upcoming</span>
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TreatmentTimeline() {
  const { roadmap } = useAppStore()

  if (!roadmap) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Care Roadmap</h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload your medical report to generate a personalised, phased treatment roadmap.
          </p>
        </div>
        <ReportUploader />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Care Roadmap</h1>
        <p className="text-sm text-slate-500 mt-1 leading-relaxed">{roadmap.summary}</p>
      </div>

      <ProgressSummary phases={roadmap.phases} />

      <div>
        {roadmap.phases.map((phase, idx) => (
          <PhaseCard
            key={phase.id}
            phase={phase}
            index={idx}
            isLast={idx === roadmap.phases.length - 1}
          />
        ))}
      </div>

      <p className="text-xs text-slate-400 text-center mt-2">
        Roadmap generated from your report. Your physician may adjust these recommendations.
      </p>
    </div>
  )
}
