/**
 * DocumentManager — Upload, categorise, and browse medical documents.
 * Design: Clean upload zone, pill filter tabs, document cards.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDocuments, uploadDocument } from '../../services/api'
import { useAppStore } from '../../store/appStore'
import { Upload, FileText, Image, FileInput, Shield, FolderOpen, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import type { DocumentCategory, MedicalDocument } from '../../types'
import { format } from 'date-fns'

const CATEGORIES: { id: DocumentCategory | 'all'; label: string; icon: React.ElementType }[] = [
  { id: 'all',          label: 'All',        icon: FolderOpen  },
  { id: 'imaging',      label: 'Imaging',    icon: Image       },
  { id: 'prescription', label: 'Rx',         icon: FileText    },
  { id: 'insurance',    label: 'Insurance',  icon: Shield      },
  { id: 'invoice',      label: 'Invoices',   icon: FileInput   },
]

const CAT_BADGE: Record<string, string> = {
  imaging:      'bg-blue-50   text-blue-700   border-blue-200',
  prescription: 'bg-violet-50 text-violet-700 border-violet-200',
  insurance:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  invoice:      'bg-amber-50  text-amber-700  border-amber-200',
  other:        'bg-slate-50  text-slate-600  border-slate-200',
}

// ── Document card ─────────────────────────────────────────────────────────────

function DocCard({ doc }: { doc: MedicalDocument }) {
  const catStyle = CAT_BADGE[doc.category] ?? CAT_BADGE.other

  return (
    <div className="card flex items-start gap-3 p-4 hover:shadow-sm transition-shadow">
      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <FileText className="h-4 w-4 text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{doc.filename}</p>
        {doc.summary && (
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{doc.summary}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full border', catStyle)}>
            {doc.category}
          </span>
          <span className="text-2xs text-slate-400">
            {format(new Date(doc.uploaded_at), 'MMM d, yyyy')}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-1">
        <FolderOpen className="h-5 w-5 text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-600">No documents found</p>
      <p className="text-xs text-slate-400">Upload a file or change the filter.</p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DocumentManager() {
  const { patientId } = useAppStore()
  const qc = useQueryClient()
  const [filter, setFilter] = useState<DocumentCategory | 'all'>('all')

  const { data: docs } = useQuery({
    queryKey: ['documents', patientId, filter],
    queryFn:  () => getDocuments(patientId, filter === 'all' ? undefined : filter),
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadDocument(patientId, file),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['documents', patientId] }),
  })

  const handleFile = (file: File) => uploadMutation.mutate(file)

  const isPending = uploadMutation.isPending

  return (
    <div>
      {/* Page header */}
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Documents</h1>
        <p className="text-sm text-slate-500 mt-1">Upload and organise your medical records.</p>
      </div>

      {/* Upload zone */}
      <label className={clsx(
        'flex flex-col items-center gap-2 border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all mb-5',
        isPending
          ? 'border-brand-300 bg-brand-50'
          : 'border-slate-200 bg-slate-50 hover:border-brand-400 hover:bg-brand-50/50',
      )}>
        {isPending
          ? <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
          : <Upload className="h-8 w-8 text-slate-300" />
        }
        <p className="text-sm font-medium text-slate-700">
          {isPending ? 'Processing document…' : 'Click or drag a file to upload'}
        </p>
        <p className="text-xs text-slate-400">PDF, JPEG, PNG · Auto-categorised by AI</p>
        <input
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </label>

      {/* Filter tabs */}
      <div className="bg-slate-100 p-1 rounded-xl flex gap-1 mb-5 overflow-x-auto">
        {CATEGORIES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0',
              filter === id
                ? 'bg-white text-slate-800 shadow-xs border border-brand-100'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Document list */}
      <div className="space-y-2">
        {docs?.length
          ? docs.map(doc => <DocCard key={doc.document_id} doc={doc} />)
          : <EmptyState />
        }
      </div>
    </div>
  )
}
