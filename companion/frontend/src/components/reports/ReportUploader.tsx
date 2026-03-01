/**
 * ReportUploader — Premium drag-and-drop report loader.
 */

import { useState, useCallback } from 'react'
import { Upload, FileJson, CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { transformReport, generateRoadmap } from '../../services/api'
import type { MedicalReport } from '../../types'
import clsx from 'clsx'

const DEMO_REPORT: MedicalReport = {
  report_id: 'RPT-2024-0115-001',
  patient_id: 'PAT-001',
  generated_at: '2024-01-15T09:00:00Z',
  modality: 'CT Scan — Chest (with contrast)',
  technologist: 'R. Williams, RT(R)',
  radiologist: 'Dr. Amara Diallo, MD, FRCR',
  clinical_history: '54-year-old female, ex-smoker (20 pack-years), mild chronic cough.',
  findings: {
    primary: 'A solid, non-calcified pulmonary nodule measuring 8 mm in the right upper lobe with spiculated margins.',
    secondary: [
      'Mild pleural thickening noted bilaterally.',
      'No mediastinal or hilar lymphadenopathy.',
      'No pleural effusion.',
    ],
    incidental: [
      'Mild degenerative changes, thoracic spine T6–T9.',
      'Trace pericardial fluid — likely physiological.',
    ],
  },
  impression: '8 mm spiculated pulmonary nodule in the right upper lobe. Warrants further evaluation per Fleischner guidelines.',
  recommendations: [
    'Follow-up CT chest with contrast in 3 months.',
    'Pulmonology consultation recommended.',
    'Consider PET-CT if nodule demonstrates growth.',
    'Smoking cessation support.',
  ],
  risk_indicators: ['smoking_history', 'spiculated_margins', 'nodule_8mm'],
  urgency: 'moderate',
}

export default function ReportUploader() {
  const { setReport, setTransformedReport, setRoadmap, patientName } = useAppStore()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError]   = useState('')
  const [dragging, setDragging] = useState(false)

  const processReport = useCallback(async (report: MedicalReport) => {
    setStatus('loading')
    setError('')
    try {
      setReport(report)
      const [transformed, roadmap] = await Promise.all([
        transformReport(report, patientName),
        generateRoadmap(report),
      ])
      setTransformedReport(transformed)
      setRoadmap(roadmap)
      setStatus('success')
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Failed to process report. Check backend connection.')
      setStatus('error')
    }
  }, [setReport, setTransformedReport, setRoadmap, patientName])

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = e => {
      try { processReport(JSON.parse(e.target?.result as string)) }
      catch { setError('Invalid JSON. Please upload a valid report file.'); setStatus('error') }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <label
        className={clsx(
          'flex flex-col items-center gap-3 p-10 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200',
          dragging
            ? 'border-brand-400 bg-brand-50'
            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
        )}
        onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]) }}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
      >
        {status === 'loading' ? (
          <Loader2 className="h-10 w-10 text-brand-500 animate-spin" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
            <FileJson className="h-6 w-6 text-slate-400" />
          </div>
        )}
        <div className="text-center">
          <p className="text-sm font-medium text-slate-700">
            {status === 'loading' ? 'Processing through AI pipeline…' : 'Drop a report JSON here'}
          </p>
          <p className="text-xs text-slate-400 mt-1">Supports DICOM-to-report JSON format</p>
        </div>
        {status !== 'loading' && (
          <span className="btn-secondary btn-sm inline-flex">
            <Upload className="h-3.5 w-3.5" />
            Choose file
          </span>
        )}
        <input type="file" accept=".json" className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </label>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs text-slate-400">or use demo data</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Demo button */}
      <button
        onClick={() => processReport(DEMO_REPORT)}
        disabled={status === 'loading'}
        className="w-full group flex items-center justify-between px-4 py-3 bg-white border border-slate-200 hover:border-brand-300 hover:bg-brand-50 rounded-xl text-sm font-medium text-slate-600 hover:text-brand-700 transition-all shadow-xs disabled:opacity-50"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
            <FileJson className="h-4 w-4 text-brand-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium">CT Chest Demo Report</p>
            <p className="text-xs text-slate-400">Pulmonary nodule · Moderate urgency</p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" />
      </button>

      {/* Status feedback */}
      {status === 'success' && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 animate-slideUp">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span>Report processed successfully. Select a version above to view.</span>
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 animate-slideUp">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
