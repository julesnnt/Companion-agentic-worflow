/**
 * EmergencyModal — High-impact emergency response overlay.
 * Design: Clear, urgent, action-first.
 */

import { Phone, X, AlertOctagon, MessageCircle } from 'lucide-react'
import { useAppStore } from '../../store/appStore'

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-red-100 border border-red-200 text-red-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
        {n}
      </div>
      <p className="text-sm text-slate-700 leading-relaxed">{text}</p>
    </div>
  )
}

export default function EmergencyModal() {
  const { emergencyModalOpen, setEmergencyModal } = useAppStore()
  if (!emergencyModalOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={() => setEmergencyModal(false)}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-modal max-w-md w-full overflow-hidden animate-slideUp">

        {/* Header */}
        <div className="bg-red-600 px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
            <AlertOctagon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-white leading-tight">Potential Medical Emergency</h2>
            <p className="text-red-200 text-xs mt-0.5">Immediate action may be required</p>
          </div>
          <button
            onClick={() => setEmergencyModal(false)}
            className="text-red-200 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          <p className="text-sm text-slate-600 leading-relaxed">
            Your message indicates you may be experiencing a medical emergency.
            Please act immediately.
          </p>

          <div className="space-y-3">
            <Step n={1} text="Call 911 (or your local emergency number) immediately." />
            <Step n={2} text="Do NOT drive yourself — call an ambulance or have someone take you." />
            <Step n={3} text="Go to your nearest Emergency Room if ambulance is not available." />
            <Step n={4} text="If mental health crisis, call or text 988 (Suicide & Crisis Lifeline)." />
          </div>

          {/* Crisis line highlight */}
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-red-700">24/7 Crisis Support</p>
              <p className="text-sm font-bold text-red-800">988 — Call or Text Anytime</p>
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center">
            COMPANION cannot call emergency services. This AI is for informational support only.
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <a
            href="tel:911"
            className="btn-danger flex-1 justify-center"
          >
            <Phone className="h-4 w-4" />
            Call 911
          </a>
          <button
            onClick={() => setEmergencyModal(false)}
            className="btn-secondary flex-1"
          >
            I am safe
          </button>
        </div>
      </div>
    </div>
  )
}
