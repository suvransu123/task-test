import React, { useState } from 'react'
import {
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Info,
  Link2,
} from 'lucide-react'
import { Button } from '../../../components/ui/Button'

export interface FunctionalRequirement {
  name: string
  description: string
  acceptance_criteria: string[] | string
  priority: 'Critical' | 'High' | 'Medium' | 'Low' | string
  dependencies?: string[] | string
  derived_from?: string[] | string
  related_usecase?: string[] | string
  edge_cases?: string[] | string
}

interface FRItemProps {
  id: string
  fr: FunctionalRequirement
}
const PRIORITY_CONFIG: Record<string, { bg: string; text: string }> = {
  Critical: { bg: '#FEE2E2', text: '#EF4444' },
  High: { bg: '#F5F3FF', text: '#7C3AED' },
  Medium: { bg: '#EFF6FF', text: '#3B82F6' },
  Low: { bg: '#F1F5F9', text: '#64748B' },
}

export const FRItem: React.FC<FRItemProps> = ({ id, fr }) => {
  const [isOpen, setIsOpen] = useState(false)

  const toArray = (v: string[] | string | undefined): string[] => {
    if (!v || v === 'None') return []
    return Array.isArray(v) ? v : [v]
  }

  const frNumber = id.split('-')[1] || '00'
  const criteria = toArray(fr.acceptance_criteria)
  const edgeCases = toArray(fr.edge_cases)
  const dependencies = toArray(fr.dependencies)

  const priority = fr.priority || 'Medium'
  const priStyle = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG['Medium']

  return (
    <div
      className={`transition-all duration-500 ${isOpen ? 'mb-8' : 'border-b border-border-default last:border-0'}`}
    >
      {!isOpen ? (
        /* ── Collapsed State (Backlog Row) ── */
        <Button
          variant="unstyled"
          onClick={() => setIsOpen(true)}
          className="w-full py-5 px-6 flex items-center justify-between hover:bg-surface-muted group transition-all"
        >
          <div className="flex items-center gap-8">
            <span className="text-[12px] font-bold text-text-muted w-16">
              {id}
            </span>
            <span className="text-[15px] font-black text-text-primary tracking-tight group-hover:text-accent transition-colors">
              {fr.name}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div
              className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest min-w-17.5 text-center"
              style={{ backgroundColor: priStyle.bg, color: priStyle.text }}
            >
              {priority}
            </div>
            <ChevronDown className="w-4 h-4 text-text-muted group-hover:text-text-muted transition-colors -rotate-90" />
          </div>
        </Button>
      ) : (
        /* ── Expanded State (High-Fidelity Executive Card) ── */
        <div className="bg-surface border-2 border-border-default rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden relative animate-in zoom-in-95 duration-500">
          <div className="absolute left-0 top-0 w-1.5 h-full bg-accent" />

          {/* Header Block */}
          <div className="p-8 pb-4">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg">
                  {frNumber.slice(-2)}
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-text-primary tracking-tight">
                    {id}: {fr.name}
                  </h2>
                  <p className="text-[15px] text-text-secondary leading-relaxed max-w-2xl font-medium">
                    {fr.description}
                  </p>
                </div>
              </div>
              <Button
                variant="unstyled"
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <ChevronDown className="w-5 h-5 text-text-muted rotate-180" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12 mb-4">
              {/* Left Column: Acceptance Criteria Card */}
              <div className="bg-surface-muted rounded-3xl p-8 border border-border-default space-y-6">
                <div className="flex items-center gap-3 text-text-muted">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em]">
                    Acceptance Criteria
                  </span>
                </div>
                <ul className="space-y-5">
                  {criteria.map((c, i) => (
                    <li key={i} className="flex gap-4 items-start group/item">
                      <div className="w-5 h-5 rounded-full bg-surface border-2 border-border-default flex items-center justify-center shrink-0 mt-0.5 group-hover/item:border-[#5E43FB] transition-colors">
                        <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                      </div>
                      <span className="text-[14px] text-text-secondary leading-relaxed font-semibold">
                        {c}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right Column: Dependencies & Edge Cases */}
              <div className="space-y-10">
                {/* Dependencies */}
                <div className="space-y-4">
                  <span className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em]">
                    Dependencies
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {dependencies.length > 0 ? (
                      dependencies.map((dep, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 px-4 py-2 bg-surface-muted rounded-xl border border-border-default shadow-sm hover:border-accent transition-all cursor-default"
                        >
                          <Link2 className="w-3.5 h-3.5 text-accent" />
                          <span className="text-[12px] font-black text-text-secondary">
                            {dep}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-[12px] font-medium text-text-muted italic">
                        No technical dependencies defined.
                      </span>
                    )}
                  </div>
                </div>

                {/* Edge Cases / Alerts */}
                <div className="space-y-4">
                  <span className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em]">
                    Edge Cases
                  </span>
                  <div className="space-y-3">
                    {edgeCases.map((ec, i) => (
                      <div
                        key={i}
                        className={`p-4 rounded-xl border flex gap-4 items-center transition-all ${
                          i % 2 === 0
                            ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]'
                            : 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
                        }`}
                      >
                        {i % 2 === 0 ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <Info className="w-4 h-4" />
                        )}
                        <span className="text-[13px] font-bold leading-snug">
                          {ec}
                        </span>
                      </div>
                    ))}
                    {edgeCases.length === 0 && (
                      <p className="text-[12px] text-text-muted italic">
                        No edge cases documented for this module.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
