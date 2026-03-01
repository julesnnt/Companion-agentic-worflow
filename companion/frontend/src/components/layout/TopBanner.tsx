/**
 * TopBanner — Minimal dark disclaimer strip integrated into the shell.
 */

import { useState } from 'react'
import { X } from 'lucide-react'

export default function TopBanner() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div className="flex-shrink-0 bg-slate-900 border-b border-slate-800 px-5 py-1.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-500" />
        </span>
        <p className="text-2xs text-slate-500 truncate">
          <span className="text-slate-400 font-medium">Medical AI Assistant</span>
          {' · '}
          COMPANION does not replace professional medical advice or treatment.
          Always consult a qualified healthcare provider.
          {' '}
          <span className="text-red-400 font-semibold">Emergency? Call 911 immediately.</span>
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 text-slate-700 hover:text-slate-500 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}
