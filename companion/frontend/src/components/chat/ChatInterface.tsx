/**
 * ChatInterface — Premium conversational UI.
 * Design: Claude.ai-inspired spacious layout with persona-aware styling.
 */

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { sendChatMessage } from '../../services/api'
import type { Persona } from '../../types'
import MessageBubble from './MessageBubble'
import { PersonaAvatar } from '../layout/Sidebar'
import type { ChatMessage } from '../../types'
import clsx from 'clsx'

let _id = 0
const genId = () => `msg-${Date.now()}-${++_id}`

// ── Suggestion chips per persona ──────────────────────────────────────────────

const SUGGESTIONS: Record<string, string[]> = {
  atlas:  ['Explain my CT scan results', 'What does "spiculated nodule" mean?', 'What are my next steps?'],
  luna:   ['I\'m feeling anxious about my results', 'How do I cope with this diagnosis?', 'I need someone to talk to'],
  robert: ['How do I get a specialist referral?', 'Can you help with my insurance claim?', 'Reschedule my appointment'],
  nova:   ['Help me set a recovery goal', 'What exercises can I do?', 'I need motivation today'],
}

const WELCOME: Record<string, string> = {
  atlas:  'I can explain your medical report, clarify clinical terms, and help you understand your care plan. What would you like to know?',
  luna:   'I\'m here to listen and support you through your health journey. How are you feeling today?',
  robert: 'I can help with appointments, insurance, documents, and all the administrative aspects of your care. What do you need?',
  nova:   'Let\'s focus on your recovery goals and keep you motivated. What are we working on today?',
}

// ── Typing indicator ──────────────────────────────────────────────────────────

function TypingIndicator({ persona }: { persona: Persona }) {
  return (
    <div className="flex items-start gap-3 px-6 py-3 animate-fadeIn">
      <PersonaAvatar persona={persona} size="sm" />
      <div className="flex items-center gap-1 py-3 px-4 bg-white border border-slate-200 rounded-2xl rounded-tl-sm shadow-xs">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
            style={{ animationDelay: `${i * 0.18}s`, animationDuration: '0.9s' }}
          />
        ))}
      </div>
    </div>
  )
}

// ── Welcome screen ────────────────────────────────────────────────────────────

function WelcomeScreen({ onSuggest }: { onSuggest: (text: string) => void }) {
  const { currentPersona } = useAppStore()
  const suggestions = SUGGESTIONS[currentPersona.id] ?? []

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 animate-fadeIn">
      {/* Large persona avatar */}
      <div className={clsx(
        'w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center text-2xl text-white font-bold shadow-lg mb-5',
        currentPersona.avatarBg,
      )}>
        {currentPersona.emoji}
      </div>

      <h2 className="text-xl font-semibold text-slate-800 tracking-tight mb-1">
        {currentPersona.name}
      </h2>
      <p className="text-sm text-slate-500 mb-1">{currentPersona.title}</p>
      <p className="text-sm text-slate-500 text-center max-w-sm leading-relaxed mb-8">
        {WELCOME[currentPersona.id]}
      </p>

      {/* Suggestion chips */}
      <div className="flex flex-col gap-2 w-full max-w-md">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSuggest(s)}
            className="group flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 hover:border-brand-300 hover:bg-brand-50 rounded-xl text-sm text-slate-600 hover:text-brand-700 text-left transition-all duration-150 shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-slate-400 group-hover:text-brand-400 flex-shrink-0 transition-colors" />
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Chat Interface ────────────────────────────────────────────────────────────

export default function ChatInterface() {
  const { currentPersona, messages, addMessage, patientId, setEmergencyModal, report, clearMessages } = useAppStore()
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef             = useRef<HTMLDivElement>(null)
  const inputRef              = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px'
  }

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return

    const userMsg: ChatMessage = {
      id: genId(), role: 'user', content: msg, timestamp: new Date().toISOString(),
    }
    addMessage(userMsg)
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    setLoading(true)

    try {
      const history = messages.slice(-12).map(m => ({ role: m.role, content: m.content }))
      const response = await sendChatMessage({
        patient_id: patientId,
        persona_id: currentPersona.id,
        message: msg,
        history,
        report_context: report ? {
          modality: report.modality,
          impression: report.impression,
          urgency: report.urgency,
          recommendations: report.recommendations,
        } : undefined,
      })

      if (response.emergency) setEmergencyModal(true)

      addMessage({
        id: genId(), role: 'assistant', content: response.message,
        timestamp: new Date().toISOString(),
        persona_id: response.persona_id,
        emergency: response.emergency,
        risk_level: response.risk_assessment?.risk_level,
      })
    } catch {
      addMessage({
        id: genId(), role: 'assistant',
        content: 'I\'m having trouble connecting to the server. Please ensure the backend is running and try again.',
        timestamp: new Date().toISOString(),
        persona_id: currentPersona.id,
      })
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PersonaAvatar persona={currentPersona} size="sm" />
          <div>
            <p className="text-sm font-semibold text-slate-900 leading-none">{currentPersona.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{currentPersona.title}</p>
          </div>
          <div className="flex items-center gap-1 ml-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-2xs font-medium px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearMessages}
            className="btn-ghost btn-sm text-slate-400 hover:text-slate-600"
            title="Clear conversation"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <WelcomeScreen onSuggest={(s) => handleSend(s)} />
        ) : (
          <div className="py-4">
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} persona={currentPersona} />
            ))}
            {loading && <TypingIndicator persona={currentPersona} />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 bg-white border-t border-slate-100 px-4 py-3">
        <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:bg-white focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-500/10 transition-all duration-200">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${currentPersona.name} something…`}
            rows={1}
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 resize-none outline-none leading-relaxed"
            style={{ minHeight: '22px', maxHeight: '140px' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className={clsx(
              'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150',
              input.trim() && !loading
                ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-xs'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed',
            )}
          >
            {loading
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Send className="h-3.5 w-3.5" />
            }
          </button>
        </div>
        <p className="text-2xs text-slate-400 text-center mt-2">
          Enter to send · Shift+Enter for new line · AI responses are informational only
        </p>
      </div>
    </div>
  )
}
