import React, { useState } from 'react'
import { ChevronDown, Goal as GoalIcon } from 'lucide-react'
import { Button } from '../../../components/ui/Button'

export interface Goal {
  statement: string
  description: string
  assumptions_constraints: string
  non_goals: string
  success_metrics: string | string[]
}

interface GoalAccordionProps {
  id: string
  goal: Goal
}

/**
 * Minimalist accordion for a project goal.
 * Uses monospaced ID, comment-style section headers, and hyphen lists.
 */
const DotList: React.FC<{
  items: string[]
  color?: string
  label?: string
}> = ({ items, color = '#5E43FB', label }) => (
  <div className="space-y-4">
    {label && (
      <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
        {label}
      </p>
    )}
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li
          key={i}
          className="flex gap-3 items-start leading-relaxed text-[13px] text-text-secondary font-medium"
        >
          <div
            className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 transition-shadow group-hover:shadow-lg"
            style={{ backgroundColor: color }}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
)

export const GoalAccordion: React.FC<GoalAccordionProps> = ({ id, goal }) => {
  const [isOpen, setIsOpen] = useState(false)

  const metrics = Array.isArray(goal.success_metrics)
    ? goal.success_metrics
    : goal.success_metrics
      ? [goal.success_metrics]
      : []

  const parseList = (input: any) => {
    if (Array.isArray(input)) {
      return input.map((item) => {
        if (typeof item === 'object' && item !== null) {
          const entries = Object.entries(item)
          if (entries.length > 0) {
            const [key, value] = entries[0]
            return `${key}: ${value}`
          }
          return JSON.stringify(item)
        }
        return String(item)
      })
    }
    if (typeof input !== 'string') return []
    return input
      .split('-')
      .map((s) => s.trim().replace(/^[*-]\s*/, ''))
      .filter((s) => s.length > 0)
  }

  return (
    <div
      className={`border-b border-border-default last:border-0 overflow-hidden transition-all duration-500 ${isOpen ? 'bg-surface' : ''}`}
    >
      {/* ── Header ── */}
      <Button
        variant="unstyled"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full py-5 px-6 flex items-center justify-between text-left transition-all relative group ${
          isOpen ? 'bg-surface pb-2' : 'hover:bg-surface-muted'
        }`}
      >
        {isOpen && (
          <div className="absolute left-0 top-0 w-1.5 h-full bg-accent" />
        )}

        <div className="flex items-center gap-6">
          <div
            className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
              isOpen
                ? 'bg-surface-muted text-accent'
                : 'bg-surface-muted text-text-muted'
            }`}
          >
            {id}
          </div>
          <span
            className={`text-[15px] font-black tracking-tight transition-colors duration-200 ${isOpen ? 'text-text-primary text-lg' : 'text-text-secondary group-hover:text-accent'}`}
          >
            {goal.statement}
          </span>
        </div>

        <span
          className={`transition-all duration-300 ${isOpen ? 'text-accent rotate-180' : 'text-text-muted'}`}
        >
          <ChevronDown className="w-4 h-4" />
        </span>
      </Button>

      {/* ── Body ── */}
      {isOpen && (
        <div className="px-10 py-8 space-y-10 bg-surface animate-in fade-in slide-in-from-top-2 duration-500">
          {/* Executive Summary Section */}
          <div className="space-y-4">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
              Executive Summary
            </p>
            <p className="text-[15px] text-text-secondary leading-relaxed font-normal max-w-3xl whitespace-pre-wrap">
              {goal.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Left Column: Assumptions & Constraints */}
            {goal.assumptions_constraints && (
              <DotList
                label="Assumptions & Constraints"
                items={parseList(goal.assumptions_constraints)}
                color="#5E43FB"
              />
            )}

            {/* Right Column: Non-Goals */}
            {goal.non_goals && (
              <DotList
                label="Non-Goals"
                items={parseList(goal.non_goals)}
                color="#EF4444"
              />
            )}
          </div>

          {/* Success Metrics Feature Card */}
          {metrics.length > 0 && (
            <div className="space-y-4 pt-4">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
                Success Metrics
              </p>
              <div className="bg-surface-muted rounded-24px p-8 border border-border-default shadow-sm relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full translate-x-12 -translate-y-12" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                  {metrics.map((metric, i) => (
                    <div
                      key={i}
                      className="bg-surface p-6 rounded-2xl border border-border-default shadow-sm flex items-center gap-5 hover:border-accent transition-all group/metric"
                    >
                      <div className="w-12 h-12 rounded-xl bg-surface-muted flex items-center justify-center transition-all group-hover/metric:bg-accent">
                        <GoalIcon className="w-6 h-6 text-accent group-hover/metric:text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[14px] font-black text-text-primary tracking-tight">
                          {metric}
                        </p>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">
                          Strategic Objective
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
