/**
 * ReportViewer — Three-version tabbed report display.
 * Features: back navigation, breadcrumb, "Planifier avec Companion" CTA.
 */

import { useState } from 'react'
import {
  Stethoscope, User, CheckSquare, Info, Tag, AlertTriangle,
  ArrowLeft, Sparkles, Loader2, RefreshCw,
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import ReportUploader from './ReportUploader'
import ParsePreview from '../calendar/ParsePreview'
import clsx from 'clsx'
import type { ActionItem, ParsedEventsPreview } from '../../types'
import { parseReportForCalendar } from '../../services/api'

// ── Breadcrumb + back button ──────────────────────────────────────────────────

function Breadcrumb({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors group"
      >
        <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
        Rapports
      </button>
      <span className="text-slate-300 text-xs">/</span>
      <span className="text-xs text-slate-700 font-medium">Mon rapport</span>
    </div>
  )
}

// ── Page header ───────────────────────────────────────────────────────────────

function PageHeader({
  onPlanify,
  isParsing,
}: {
  onPlanify: () => void
  isParsing: boolean
}) {
  const { report, clearReport } = useAppStore()
  if (!report) return null

  const urgencyStyle = {
    critical: 'badge-high',
    high:     'badge-high',
    moderate: 'badge-medium',
    low:      'badge-low',
  }[report.urgency] ?? 'badge-neutral'

  return (
    <div className="mb-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Medical Report</h1>
          <p className="text-sm text-slate-500 mt-1">{report.modality} · {report.generated_at.split('T')[0]}</p>
          {report.radiologist && (
            <p className="text-xs text-slate-400 mt-0.5">Radiologist: {report.radiologist}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={clsx('badge capitalize', urgencyStyle)}>
            {report.urgency} urgency
          </span>
        </div>
      </div>

      {/* Action row */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
        <button
          onClick={onPlanify}
          disabled={isParsing}
          className="btn-primary"
        >
          {isParsing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Companion analyse le document…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Planifier avec Companion
            </>
          )}
        </button>

        <button
          onClick={clearReport}
          className="btn-secondary btn-sm"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Changer de rapport
        </button>
      </div>
    </div>
  )
}

// ── Tab definitions ───────────────────────────────────────────────────────────

const TABS = [
  { id: 'patient',   label: 'Plain Language', icon: User,         desc: 'Simplified for you'    },
  { id: 'action',    label: 'Action Plan',     icon: CheckSquare,  desc: 'What to do next'       },
  { id: 'physician', label: 'Clinical Report', icon: Stethoscope,  desc: 'Full clinical detail'  },
] as const

const ACTION_CATEGORY_STYLE: Record<string, string> = {
  appointment: 'bg-blue-50   text-blue-700   border-blue-200',
  medication:  'bg-violet-50 text-violet-700 border-violet-200',
  test:        'bg-amber-50  text-amber-700  border-amber-200',
  lifestyle:   'bg-emerald-50 text-emerald-700 border-emerald-200',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function InfoSection({ label, content }: { label: string; content: string }) {
  return (
    <div className="space-y-1.5">
      <p className="label">{label}</p>
      <p className="text-sm text-slate-700 leading-relaxed">{content}</p>
    </div>
  )
}

function ClinicalSection({ heading, content }: { heading: string; content: string }) {
  return (
    <div className="border-l-2 border-brand-300 pl-4 py-1">
      <p className="text-2xs font-semibold text-brand-600 uppercase tracking-widest mb-1.5">{heading}</p>
      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  )
}

function ActionCard({ item }: { item: ActionItem }) {
  const categoryClass = ACTION_CATEGORY_STYLE[item.category] ?? 'bg-slate-50 text-slate-700 border-slate-200'
  return (
    <div className="flex items-start gap-3.5 p-4 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
      <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 shadow-xs">
        {item.priority}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 leading-snug">{item.action}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs text-slate-500">{item.timeframe}</span>
          <span className="text-slate-300">·</span>
          <span className={clsx('badge text-2xs capitalize', categoryClass)}>{item.category}</span>
        </div>
      </div>
    </div>
  )
}

function Disclaimer({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
      <Info className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-slate-500 leading-relaxed">{text}</p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ReportViewer() {
  const { transformedReport, report, clearReport, patientId } = useAppStore()
  const [activeTab, setActiveTab] = useState<'patient' | 'action' | 'physician'>('patient')
  const [isParsing, setIsParsing] = useState(false)
  const [preview, setPreview] = useState<ParsedEventsPreview | null>(null)

  const handlePlanify = async () => {
    setIsParsing(true)
    try {
      const data = await parseReportForCalendar(patientId)
      setPreview(data)
    } catch {
      // silently ignore — demo mode always succeeds
    } finally {
      setIsParsing(false)
    }
  }

  if (!transformedReport) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Medical Report</h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload your structured medical report to generate AI-powered summaries.
          </p>
        </div>
        <ReportUploader />
      </div>
    )
  }

  const { physician_version: ph, patient_version: pt, action_version: ac } = transformedReport

  return (
    <div>
      <Breadcrumb onBack={clearReport} />
      <PageHeader onPlanify={handlePlanify} isParsing={isParsing} />

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={clsx(
              'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all duration-150',
              activeTab === id
                ? 'bg-white text-brand-700 shadow-xs border border-brand-100'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            <Icon className={clsx('h-3.5 w-3.5', activeTab === id ? 'text-brand-500' : 'text-slate-400')} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-fadeIn">

        {activeTab === 'patient' && (
          <div className="card p-6 space-y-5">
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">{pt.title}</h2>
            <InfoSection label="Summary" content={pt.summary} />
            <div className="h-px bg-slate-100" />
            <InfoSection label="What this means" content={pt.what_this_means} />
            <InfoSection label="What happens next" content={pt.what_happens_next} />
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4">
              <p className="text-sm text-brand-800 leading-relaxed">{pt.reassurance}</p>
            </div>
            <Disclaimer text={pt.disclaimer} />
          </div>
        )}

        {activeTab === 'action' && (
          <div className="card p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">{ac.title}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{ac.intro}</p>
            </div>
            <div className="space-y-2">
              {ac.next_steps.map((item: ActionItem, i: number) => (
                <ActionCard key={i} item={item} />
              ))}
            </div>
            <Disclaimer text={ac.disclaimer} />
          </div>
        )}

        {activeTab === 'physician' && (
          <div className="card p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">{ph.title}</h2>
              {report?.radiologist && (
                <p className="text-xs text-slate-400 mt-1">Report by {report.radiologist}</p>
              )}
            </div>
            {ph.sections.map((sec, i) => (
              <ClinicalSection key={i} heading={sec.heading} content={sec.content} />
            ))}
            {report?.risk_indicators?.length > 0 && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-700 mb-1.5">Risk Indicators</p>
                  <div className="flex flex-wrap gap-1.5">
                    {report.risk_indicators.map((r, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-2xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                        <Tag className="h-2.5 w-2.5" />
                        {r.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <Disclaimer text={ph.disclaimer} />
          </div>
        )}
      </div>

      {/* ParsePreview modal */}
      {preview && (
        <ParsePreview
          data={preview}
          onClose={() => setPreview(null)}
          onConfirmed={() => setPreview(null)}
        />
      )}
    </div>
  )
}
