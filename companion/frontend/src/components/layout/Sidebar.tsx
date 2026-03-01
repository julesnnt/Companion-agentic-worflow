/**
 * Sidebar — Premium dark navigation with persona switcher.
 * Inspired by Linear's sidebar design language.
 */

import { Link, useLocation } from 'react-router-dom'
import {
  MessageSquare, FileText, GitBranch, Pill, Activity,
  FolderOpen, LayoutGrid, ChevronDown, CalendarDays,
} from 'lucide-react'
import { useState } from 'react'
import { useAppStore, PERSONAS } from '../../store/appStore'
import clsx from 'clsx'
import type { Persona } from '../../types'

// ── Brand Logo ────────────────────────────────────────────────────────────────

function CompanionLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0 shadow-sm">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M1 8h2.5l1.5-4 2 8 2-5 1 2H15"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div>
        <p className="text-sm font-bold text-white tracking-tight leading-none">COMPANION</p>
        <p className="text-2xs text-slate-500 mt-0.5 tracking-wide">AI Healthcare</p>
      </div>
    </div>
  )
}

// ── Persona Avatar ────────────────────────────────────────────────────────────

export function PersonaAvatar({ persona, size = 'md' }: { persona: Persona; size?: 'xs'|'sm'|'md'|'lg' }) {
  const sizes = { xs: 'w-5 h-5 text-[9px]', sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base' }
  return (
    <div className={clsx(
      `bg-gradient-to-br ${persona.avatarBg} rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white`,
      sizes[size],
    )}>
      {persona.emoji}
    </div>
  )
}

// ── Persona Switcher ──────────────────────────────────────────────────────────

function PersonaSwitcher() {
  const { currentPersona, setPersona } = useAppStore()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative px-3">
      <button
        onClick={() => setOpen(o => !o)}
        className={clsx(
          'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors duration-150',
          open ? 'bg-slate-800' : 'hover:bg-slate-800',
        )}
      >
        <PersonaAvatar persona={currentPersona} size="sm" />
        <div className="flex-1 text-left min-w-0">
          <p className="text-xs font-semibold text-slate-200 leading-none">{currentPersona.name}</p>
          <p className="text-2xs text-slate-500 mt-0.5 truncate">{currentPersona.title}</p>
        </div>
        <ChevronDown className={clsx('h-3 w-3 text-slate-600 flex-shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-3 right-3 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-slideDown">
          <div className="p-1.5">
            <p className="px-2.5 pt-1.5 pb-1 text-2xs font-semibold text-slate-600 uppercase tracking-widest">
              Companions
            </p>
            {PERSONAS.map(p => (
              <button
                key={p.id}
                onClick={() => { setPersona(p); setOpen(false) }}
                className={clsx(
                  'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors text-left',
                  currentPersona.id === p.id ? 'bg-slate-700' : 'hover:bg-slate-750',
                )}
              >
                <PersonaAvatar persona={p} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-200">{p.name}</p>
                  <p className="text-2xs text-slate-500 truncate">{p.title}</p>
                </div>
                {currentPersona.id === p.id && (
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Nav Definition ────────────────────────────────────────────────────────────

const NAV = [
  { id: 'chat',        icon: MessageSquare, label: 'Chat'           },
  { id: 'report',      icon: FileText,      label: 'My Report'      },
  { id: 'calendar',    icon: CalendarDays,  label: 'Health Calendar' },
  { id: 'timeline',    icon: GitBranch,     label: 'Care Roadmap'   },
  { id: 'medications', icon: Pill,          label: 'Medications'    },
  { id: 'checkin',     icon: Activity,      label: 'Daily Check-In' },
  { id: 'documents',   icon: FolderOpen,    label: 'Documents'      },
] as const

// ── Sidebar ───────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const { activeView, setActiveView, patientName } = useAppStore()
  const location = useLocation()
  const isAdmin   = location.pathname.startsWith('/admin')

  return (
    <aside className="flex-shrink-0 flex flex-col bg-slate-900 border-r border-slate-800" style={{ width: '220px' }}>

      {/* Logo */}
      <div className="px-4 py-4 border-b border-slate-800">
        <CompanionLogo />
      </div>

      {/* Patient chip */}
      <div className="px-4 py-3 border-b border-slate-800">
        <p className="text-2xs text-slate-700 font-semibold uppercase tracking-widest mb-1.5">Patient</p>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-2xs font-bold flex-shrink-0 shadow-sm">
            {patientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-300 truncate">{patientName}</p>
            <p className="text-2xs text-slate-600">PAT-001</p>
          </div>
        </div>
      </div>

      {/* Persona switcher */}
      <div className="py-3 border-b border-slate-800">
        <p className="px-3 mb-1 text-2xs text-slate-700 font-semibold uppercase tracking-widest">Companion</p>
        <PersonaSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {!isAdmin && (
          <>
            <p className="px-3 pt-1 pb-1.5 text-2xs text-slate-700 font-semibold uppercase tracking-widest">Patient</p>
            {NAV.map(({ id, icon: Icon, label }) => {
              const active = activeView === id
              return (
                <button
                  key={id}
                  onClick={() => setActiveView(id)}
                  className={clsx(
                    'w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-all duration-150 rounded-md',
                    active
                      ? 'text-brand-300 bg-brand-900/20 border-l-2 border-brand-500 rounded-l-none pl-[10px]'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800',
                  )}
                >
                  <Icon className={clsx('h-4 w-4 flex-shrink-0', active ? 'text-brand-400' : 'text-slate-700')} />
                  {label}
                </button>
              )
            })}
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-3 border-t border-slate-800 pt-2">
        {isAdmin ? (
          <Link to="/" className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all">
            <MessageSquare className="h-4 w-4 text-slate-700 flex-shrink-0" />
            Patient View
          </Link>
        ) : (
          <Link to="/admin" className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all">
            <LayoutGrid className="h-4 w-4 text-slate-700 flex-shrink-0" />
            Admin Dashboard
          </Link>
        )}
      </div>
    </aside>
  )
}
