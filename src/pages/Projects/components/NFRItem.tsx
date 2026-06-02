import React, { useState } from 'react'
import { ChevronDown, Activity, Link as LinkIcon } from 'lucide-react'
import { Button } from '../../../components/ui/Button'

export interface NonFunctionalRequirement {
  name: string
  description: string
  measurement: string[] | string
  related_frs?: string[] | string
  priority?: 'Critical' | 'High' | 'Medium' | 'Low' | string
}

interface NFRItemProps {
  id: string
  nfr: NonFunctionalRequirement
}

const PRIORITY_CONFIG: Record<string, { bg: string; text: string }> = {
  Critical: { bg: '#FEE2E2', text: '#EF4444' },
  High: { bg: '#F5F3FF', text: '#7C3AED' },
  Medium: { bg: '#EFF6FF', text: '#3B82F6' },
  Low: { bg: '#F1F5F9', text: '#64748B' },
}

export const NFRItem: React.FC<NFRItemProps> = ({ id, nfr }) => {
  const [isOpen, setIsOpen] = useState(false)

  const measurements = Array.isArray(nfr.measurement)
    ? nfr.measurement
    : nfr.measurement
      ? [nfr.measurement]
      : []

  const relatedFrs = Array.isArray(nfr.related_frs)
    ? nfr.related_frs
    : nfr.related_frs
      ? [nfr.related_frs]
      : []

  const priority = nfr.priority || 'Medium'
  const priStyle = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG['Medium']
  const nfrNumber = id.split('-')[1] || '00'

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
            <span
              className={`text-[15px] font-black tracking-tight group-hover:text-accent transition-colors ${isOpen ? 'text-text-primary' : 'text-text-secondary'}`}
            >
              {nfr.name}
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
        /* ── Expanded State (Executive Card) ── */
        <div className="bg-surface border-2 border-border-default rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden relative animate-in zoom-in-95 duration-500">
          <div className="absolute left-0 top-0 w-1.5 h-full bg-accent" />

          <div className="p-8 pb-4">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg">
                  {nfrNumber.slice(-2)}
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-text-primary tracking-tight">
                    {id}: {nfr.name}
                  </h2>
                  <p className="text-[15px] text-text-secondary leading-relaxed max-w-2xl font-medium">
                    {nfr.description}
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
              {/* Left Column: Measurement */}
              {measurements.length > 0 && (
                <div className="space-y-4">
                  <p className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em]">
                    Measurement Criteria
                  </p>
                  <div className="space-y-4">
                    {measurements.map((m, i) => (
                      <div
                        key={i}
                        className="bg-surface-muted p-5 rounded-2xl border border-border-default shadow-sm flex items-center gap-4 group/metric"
                      >
                        <div className="w-10 h-10 rounded-xl bg-surface border border-border-default flex items-center justify-center transition-all group-hover/metric:bg-accent group-hover/metric:text-white">
                          <Activity className="w-5 h-5 text-accent group-hover/metric:text-white" />
                        </div>
                        <p className="text-[13px] font-bold text-text-primary leading-relaxed flex-1">
                          {m}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Right Column: Traceability */}
              {relatedFrs.length > 0 && (
                <div className="space-y-4">
                  <p className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em]">
                    Traceability
                  </p>
                  <div className="bg-surface-muted p-6 rounded-2xl border border-border-default space-y-4">
                    <div className="flex items-center gap-2 text-text-muted">
                      <LinkIcon className="w-4 h-4" />
                      <span className="text-[11px] font-bold uppercase tracking-widest">
                        Related Functional Requirements
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {relatedFrs.map((frId) => (
                        <span
                          key={frId}
                          className="px-3 py-1.5 bg-surface text-accent rounded-lg border border-border-default text-[11px] font-black shadow-sm hover:border-accent transition-all cursor-default"
                        >
                          {frId}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
