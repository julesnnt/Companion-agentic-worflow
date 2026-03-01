/**
 * RightPanel — Contextual information panel.
 * Clean white with tabbed content.
 */

import { useAppStore } from '../../store/appStore'
import { useQuery } from '@tanstack/react-query'
import { getMedications, getAlerts } from '../../services/api'
import clsx from 'clsx'
import { Clock, Pill, Bell, CheckCircle, Circle, ChevronRight } from 'lucide-react'
import type { RiskLevel, TreatmentPhase } from '../../types'

const TABS = [
  { id: 'timeline',    label: 'Roadmap', icon: Clock },
  { id: 'medications', label: 'Meds',    icon: Pill  },
  { id: 'alerts',      label: 'Alerts',  icon: Bell  },
] as const

function StatusDot({ status }: { status: TreatmentPhase['status'] }) {
  return (
    <div className={clsx(
      'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
      status === 'active'    ? 'border-brand-500 bg-brand-500' :
      status === 'completed' ? 'border-emerald-500 bg-emerald-500' :
                               'border-slate-300 bg-white',
    )}>
      {status === 'completed' && <CheckCircle className="h-3 w-3 text-white" />}
      {status === 'active'    && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
    </div>
  )
}

function RiskDot({ level }: { level: RiskLevel }) {
  return (
    <span className={clsx(
      'w-2 h-2 rounded-full flex-shrink-0',
      level === 'high' ? 'bg-red-500' : level === 'medium' ? 'bg-amber-400' : 'bg-emerald-500',
    )} />
  )
}

export default function RightPanel() {
  const { rightPanelTab, setRightPanelTab, roadmap, patientId } = useAppStore()

  const { data: medications } = useQuery({
    queryKey: ['medications', patientId],
    queryFn:  () => getMedications(patientId),
  })
  const { data: alerts } = useQuery({
    queryKey: ['alerts'],
    queryFn:  () => getAlerts(),
  })

  const alertHigh = alerts?.filter(a => a.risk_level === 'high').length ?? 0

  return (
    <aside className="flex-shrink-0 bg-white border-l border-slate-100 flex flex-col" style={{ width: '268px' }}>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 px-1 pt-1 flex-shrink-0">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setRightPanelTab(id as any)}
            className={clsx(
              'relative flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors',
              rightPanelTab === id ? 'text-brand-700' : 'text-slate-400 hover:text-slate-600',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            {id === 'alerts' && alertHigh > 0 && (
              <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-2xs flex items-center justify-center font-bold">
                {alertHigh}
              </span>
            )}
            {rightPanelTab === id && (
              <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-brand-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">

        {rightPanelTab === 'timeline' && (
          <>
            {!roadmap ? <EmptyState text="Upload a report to generate your care roadmap." /> : (
              <div>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">{roadmap.summary}</p>
                <div className="space-y-0">
                  {roadmap.phases.map((phase, idx) => (
                    <div key={phase.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <StatusDot status={phase.status} />
                        {idx < roadmap.phases.length - 1 && (
                          <div className={clsx(
                            'w-0.5 flex-1 my-1 min-h-4',
                            phase.status === 'completed' ? 'bg-emerald-200' :
                            phase.status === 'active'    ? 'bg-brand-200' : 'bg-slate-200',
                          )} />
                        )}
                      </div>
                      <div className="flex-1 pb-4 min-w-0">
                        <div className={clsx(
                          'p-3 rounded-lg border',
                          phase.status === 'active'
                            ? 'bg-brand-50 border-brand-200'
                            : 'bg-slate-50 border-slate-200',
                        )}>
                          <p className="text-xs font-semibold text-slate-800">{phase.phase}</p>
                          <p className="text-2xs text-slate-500 mt-0.5">{phase.expected_timeframe}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {rightPanelTab === 'medications' && (
          <div className="space-y-2">
            {!medications?.length ? <EmptyState text="No medications tracked yet." /> :
            medications.map(med => (
              <div key={med.id} className={clsx(
                'p-3 rounded-lg border',
                med.taken_today.every(Boolean) ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50',
              )}>
                <div className="flex items-start justify-between gap-1 mb-0.5">
                  <p className="text-xs font-semibold text-slate-800">{med.name}</p>
                  <span className="badge badge-brand text-2xs">{med.dosage}</span>
                </div>
                <p className="text-2xs text-slate-500">{med.frequency}</p>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {med.times.map((t, i) => (
                    <span key={i} className={clsx(
                      'inline-flex items-center gap-1 text-2xs px-1.5 py-0.5 rounded border',
                      med.taken_today[i]
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        : 'bg-white text-slate-500 border-slate-200',
                    )}>
                      {med.taken_today[i] ? <CheckCircle className="h-2.5 w-2.5" /> : <Circle className="h-2.5 w-2.5" />}
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {rightPanelTab === 'alerts' && (
          <div className="space-y-2">
            {!alerts?.length ? <EmptyState text="No active alerts." /> :
            alerts.slice(0, 6).map((alert, i) => (
              <div key={i} className="group p-3 rounded-lg border border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <RiskDot level={alert.risk_level} />
                  <p className="text-xs font-semibold text-slate-700 truncate flex-1">{alert.patient_name}</p>
                </div>
                <p className="text-2xs text-slate-500 leading-relaxed line-clamp-2 pl-4">{alert.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
        <Circle className="h-4 w-4 text-slate-300" />
      </div>
      <p className="text-xs text-slate-400 max-w-[160px] leading-relaxed">{text}</p>
    </div>
  )
}
