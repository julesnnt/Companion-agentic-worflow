/**
 * MessageBubble — Premium message renderer.
 * Design: Document-style AI responses, clean user messages.
 */

import clsx from 'clsx'
import { format } from 'date-fns'
import { AlertOctagon, ShieldAlert } from 'lucide-react'
import type { ChatMessage, Persona } from '../../types'
import { PersonaAvatar } from '../layout/Sidebar'

interface Props {
  message: ChatMessage
  persona: Persona
}

// ── Render markdown-like content ──────────────────────────────────────────────

function MessageContent({ text, isUser }: { text: string; isUser: boolean }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let key = 0

  for (const line of lines) {
    if (!line.trim()) { elements.push(<br key={key++} />); continue }

    // Bold **text**
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    const rendered = parts.map((p, i) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>
        : p
    )

    // Numbered or bulleted list items
    const numMatch = line.match(/^(\d+)\.\s(.+)/)
    const bulletMatch = line.match(/^[-•]\s(.+)/)

    if (numMatch) {
      elements.push(
        <div key={key++} className="flex gap-2 my-0.5">
          <span className={clsx('font-semibold flex-shrink-0 text-sm', isUser ? 'text-white/70' : 'text-brand-600')}>
            {numMatch[1]}.
          </span>
          <span>{numMatch[2]}</span>
        </div>
      )
    } else if (bulletMatch) {
      elements.push(
        <div key={key++} className="flex gap-2 my-0.5">
          <span className={clsx('flex-shrink-0 mt-1', isUser ? 'text-white/60' : 'text-slate-400')}>•</span>
          <span>{bulletMatch[1]}</span>
        </div>
      )
    } else {
      elements.push(<p key={key++} className="my-0.5">{rendered}</p>)
    }
  }

  return <div className="msg-content text-sm leading-relaxed space-y-0.5">{elements}</div>
}

// ── Main bubble ───────────────────────────────────────────────────────────────

export default function MessageBubble({ message, persona }: Props) {
  const isUser = message.role === 'user'
  const time   = format(new Date(message.timestamp), 'HH:mm')

  if (isUser) {
    return (
      <div className="flex items-end justify-end gap-2 px-6 py-1.5 group animate-fadeIn">
        <div className="max-w-[72%]">
          <div className="bg-brand-600 text-white px-4 py-3 rounded-2xl rounded-br-sm shadow-xs">
            <MessageContent text={message.content} isUser />
          </div>
          <p className="text-2xs text-slate-400 text-right mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {time}
          </p>
        </div>
        {/* User avatar */}
        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-2xs font-bold text-slate-600 flex-shrink-0 mb-5">
          S
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-2 animate-fadeIn">
      {/* Emergency banner */}
      {message.emergency && (
        <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
          <AlertOctagon className="h-4 w-4 flex-shrink-0" />
          Emergency response activated — please seek immediate medical assistance
        </div>
      )}

      {/* High risk warning */}
      {message.risk_level === 'medium' && !message.emergency && (
        <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          <ShieldAlert className="h-3.5 w-3.5 flex-shrink-0" />
          Elevated concern detected — consider consulting your physician
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Persona avatar */}
        <div className="flex-shrink-0 mt-0.5">
          <PersonaAvatar persona={persona} size="sm" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + time */}
          <div className="flex items-baseline gap-2 mb-1.5">
            <span className="text-xs font-semibold text-slate-700">{persona.name}</span>
            <span className="text-2xs text-slate-400">{time}</span>
          </div>

          {/* Content card */}
          <div className={clsx(
            'bg-white border rounded-2xl rounded-tl-sm px-4 py-3 shadow-xs max-w-[85%]',
            message.emergency ? 'border-red-200 bg-red-50' : 'border-slate-200',
          )}>
            <MessageContent text={message.content} isUser={false} />
          </div>
        </div>
      </div>
    </div>
  )
}
