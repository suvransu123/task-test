import React from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserStory {
  title?: string
  as_a: string
  i_want: string
  so_that: string
  assumptions?: string | string[]
  business_value: string
  category: string
  dependencies?: string[] | string
  goal_related?: string
  success_metrics?: string | string[]
}

interface UserStoryItemProps {
  id: string
  story: UserStory
}

// ─── Category chip ────────────────────────────────────────────────────────────

const CategoryChip: React.FC<{ label: string }> = ({ label }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-surface-muted text-text-secondary border border-border-default">
    {label}
  </span>
)

// Helper to normalise list fields to string[]
const toList = (value?: string | string[]): string[] => {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean)
  return value
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

// ─── Main story card (screenshot layout) ─────────────────────────────────────

export const UserStoryItem: React.FC<UserStoryItemProps> = ({ id, story }) => {
  const deps = toList(story.dependencies as any)
  const depsText = deps.length ? deps.join(', ') : 'None'
  const assumptions = toList(story.assumptions as any)
  const assumptionsText = assumptions.length ? assumptions.join('; ') : '—'
  const successMetrics = toList(story.success_metrics as any)
  const successText = successMetrics.length ? successMetrics.join('; ') : '—'

  const cleanTitle = (story.title ?? '').replace(/^User Wants to\s+/i, '') || id

  return (
    <div className="space-y-3">
      {/* Story heading row: US-001  Bold Title  [Category tag] */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[11px] font-black text-text-muted uppercase tracking-widest shrink-0">
          {id}
        </span>
        <h3 className="text-[15px] font-bold text-text-primary">{cleanTitle}</h3>
        {story.category && <CategoryChip label={story.category} />}
      </div>

      {/* As a / I want / So that card */}
      <div className="border border-border-default rounded-lg overflow-hidden">
        <div className="divide-y divide-[#F1F5F9]">
          <div className="flex items-baseline px-5 py-3 gap-6">
            <span className="text-[11px] font-semibold text-text-muted w-14 shrink-0">
              As a
            </span>
            <span className="text-[13px] text-text-primary font-medium">
              {story.as_a}
            </span>
          </div>
          <div className="flex items-baseline px-5 py-3 gap-6">
            <span className="text-[11px] font-semibold text-text-muted w-14 shrink-0">
              I want
            </span>
            <span className="text-[13px] text-text-secondary">{story.i_want}</span>
          </div>
          <div className="flex items-baseline px-5 py-3 gap-6">
            <span className="text-[11px] font-semibold text-text-muted w-14 shrink-0">
              So that
            </span>
            <span className="text-[13px] text-text-secondary">{story.so_that}</span>
          </div>
        </div>
      </div>

      {/* 4-column metadata row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#E2E8F0] border border-border-default rounded-lg overflow-hidden text-[12px]">
        <div className="bg-surface px-4 py-3 space-y-1">
          <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.15em]">
            Business Value
          </p>
          <p className="text-text-primary font-medium leading-snug">
            {story.business_value || '—'}
          </p>
        </div>
        <div className="bg-surface px-4 py-3 space-y-1">
          <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.15em]">
            Success Metric
          </p>
          <p className="text-text-primary font-medium leading-snug">{successText}</p>
        </div>
        <div className="bg-surface px-4 py-3 space-y-1">
          <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.15em]">
            Dependencies
          </p>
          <p className="text-text-primary font-medium leading-snug">{depsText}</p>
        </div>
        <div className="bg-surface px-4 py-3 space-y-1">
          <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.15em]">
            Assumptions
          </p>
          <p className="text-text-primary font-medium leading-snug">
            {assumptionsText}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Persona card (screenshot layout) ────────────────────────────────────────

export interface PersonaNode {
  id: string
  type: 'UserPersona'
  title: string
  content: {
    name: string
    role: string
    demographics?: string
    tech_comfort_level?: string
    goals?: string | string[]
    pain_points?: string | string[]
    scenarios?: string | string[]
  }
}

export const PersonaCard: React.FC<{ node: PersonaNode }> = ({ node }) => {
  const { content } = node

  const goals = toList(content.goals as any)
  const painPoints = toList(content.pain_points as any)
  const scenarios = toList(content.scenarios as any)

  // Build demographic descriptor: "25-45 · Moderate to high tech comfort"
  const demo = [content.demographics, content.tech_comfort_level]
    .filter(Boolean)
    .join(' · ')

  const initial = (content.name || '?').charAt(0).toUpperCase()

  return (
    <div className="border border-border-default rounded-xl overflow-hidden">
      {/* Section label */}
      <div className="px-6 py-3 border-b border-border-default bg-surface-muted">
        <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
          01. Persona
        </span>
      </div>

      <div className="p-6">
        {/* Avatar + name row */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#1E293B] flex items-center justify-center shrink-0">
            <span className="text-white text-[15px] font-black">{initial}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[16px] font-bold text-text-primary">
                {content.name}
              </span>
              {demo && (
                <span className="text-[12px] text-text-secondary font-normal">
                  {content.role}
                  {demo ? ` · ${demo}` : ''}
                </span>
              )}
              {!demo && content.role && (
                <span className="text-[12px] text-text-secondary font-normal">
                  {content.role}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3-column grid: GOALS | PAIN POINTS | SCENARIOS */}
        <div className="grid grid-cols-3 gap-6">
          {/* Goals */}
          <div className="space-y-2">
            <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">
              Goals
            </p>
            <ul className="space-y-1.5">
              {goals.length > 0 ? (
                goals.map((g, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-text-muted mt-0.5 text-[10px] shrink-0">·</span>
                    <span className="text-[12px] text-text-secondary leading-snug">{g}</span>
                  </li>
                ))
              ) : (
                <li className="text-[12px] text-text-muted italic">—</li>
              )}
            </ul>
          </div>

          {/* Pain Points */}
          <div className="space-y-2">
            <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">
              Pain Points
            </p>
            <ul className="space-y-1.5">
              {painPoints.length > 0 ? (
                painPoints.map((p, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-text-muted mt-0.5 text-[10px] shrink-0">·</span>
                    <span className="text-[12px] text-text-secondary leading-snug">{p}</span>
                  </li>
                ))
              ) : (
                <li className="text-[12px] text-text-muted italic">—</li>
              )}
            </ul>
          </div>

          {/* Scenarios */}
          <div className="space-y-2">
            <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">
              Scenarios
            </p>
            <ul className="space-y-1.5">
              {scenarios.length > 0 ? (
                scenarios.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-text-muted mt-0.5 text-[10px] shrink-0">·</span>
                    <span className="text-[12px] text-text-secondary leading-snug">{s}</span>
                  </li>
                ))
              ) : (
                <li className="text-[12px] text-text-muted italic">—</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Capability card (screenshot layout) ─────────────────────────────────────

export interface CapabilityNode {
  id: string
  type: 'Capability'
  title: string
  content: {
    name: string
    description?: string
    parent_capability?: string
    inputs?: string
    outputs?: string
    success_metrics?: string
    status?: string
  }
}

export const CapabilityCard: React.FC<{ node: CapabilityNode }> = ({
  node,
}) => {
  const { content } = node
  const isInferred =
    !content.status ||
    content.status?.toLowerCase() === 'inferred' ||
    content.status?.toLowerCase() === 'draft'

  return (
    <div className="border border-border-default rounded-xl overflow-hidden">
      {/* Section label */}
      <div className="px-6 py-3 border-b border-border-default bg-surface-muted">
        <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
          02. Capability
        </span>
      </div>

      <div className="p-6 space-y-4">
        {/* ID row + Inferred badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.12em]">
              {node.id}
            </span>
            {content.parent_capability && (
              <>
                <span className="text-text-muted">·</span>
                <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.12em]">
                  {content.parent_capability}
                </span>
              </>
            )}
          </div>
          {isInferred && (
            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-200">
              Inferred
            </span>
          )}
        </div>

        {/* Title + description */}
        <div className="space-y-1.5">
          <h3 className="text-[15px] font-bold text-text-primary">
            {content.name}
          </h3>
          {content.description && (
            <p className="text-[12px] text-text-secondary leading-relaxed">
              {content.description}
            </p>
          )}
        </div>

        {/* Input / Output / Success metrics row */}
        <div className="grid grid-cols-3 gap-4 pt-2 border-t border-border-default">
          <div className="space-y-0.5">
            <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.15em]">
              Input
            </p>
            <p className="text-[12px] text-text-primary font-medium leading-snug">
              {content.inputs || '—'}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.15em]">
              Output
            </p>
            <p className="text-[12px] text-text-primary font-medium leading-snug">
              {content.outputs || '—'}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.15em]">
              Success
            </p>
            <p className="text-[12px] text-text-primary font-medium leading-snug">
              {content.success_metrics || '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
