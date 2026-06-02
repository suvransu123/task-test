import React, { useMemo, useState } from 'react'
import type { OutputNode } from '../../../services/project.service'
import { EmptyState } from './shared'
import { Button } from '../../../components/ui/Button'
import { EditableNodeCard } from './EditableNodeCard'

// ─── Layer colour palette ─────────────────────────────────────────────────────

interface LayerTheme {
  /** Left border + dot colour */
  accent: string
  /** Badge background */
  badgeBg: string
  /** Badge text */
  badgeText: string
}

const LAYER_THEMES: Record<string, LayerTheme> = {
  frontend: { accent: '#7C3AED', badgeBg: '#EDE9FE', badgeText: '#6D28D9' },
  backend: { accent: '#7C3AED', badgeBg: '#EDE9FE', badgeText: '#6D28D9' },
  database: { accent: '#F59E0B', badgeBg: '#FEF3C7', badgeText: '#D97706' },
  infrastructure: {
    accent: '#10B981',
    badgeBg: '#D1FAE5',
    badgeText: '#059669',
  },
  storage: { accent: '#0891B2', badgeBg: '#E0F2FE', badgeText: '#0E7490' },
  api: { accent: '#EC4899', badgeBg: '#FCE7F3', badgeText: '#DB2777' },
  security: { accent: '#EF4444', badgeBg: '#FEE2E2', badgeText: '#DC2626' },
  analytics: { accent: '#F97316', badgeBg: '#FFF7ED', badgeText: '#EA580C' },
}

const DEFAULT_THEME: LayerTheme = {
  accent: '#94A3B8',
  badgeBg: '#F1F5F9',
  badgeText: '#64748B',
}

function getTheme(layer: string): LayerTheme {
  return LAYER_THEMES[layer?.toLowerCase()] ?? DEFAULT_THEME
}

// Normalise a field that may arrive as a string[] or a comma-separated string.
function toList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean)
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
  }
  return []
}

// ─── Derive ordered unique layers from nodes ──────────────────────────────────

function extractLayers(nodes: OutputNode[]): string[] {
  const seen = new Set<string>()
  const ordered: string[] = []
  nodes.forEach((n) => {
    const layer = (n.content?.layer ?? '').toLowerCase()
    if (layer && !seen.has(layer)) {
      seen.add(layer)
      ordered.push(layer)
    }
  })
  return ordered
}

// ─── Filter pill ──────────────────────────────────────────────────────────────

interface FilterPillProps {
  layer: string
  active: boolean
  onClick: () => void
}

const FilterPill: React.FC<FilterPillProps> = ({ layer, active, onClick }) => {
  const theme = getTheme(layer)
  const label = layer.charAt(0).toUpperCase() + layer.slice(1)

  return (
    <Button
      variant="unstyled"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold border transition-all duration-150 whitespace-nowrap ${
        active
          ? 'bg-surface shadow-sm border-border-hover'
          : 'bg-transparent border-border-default hover:border-border-hover opacity-60 hover:opacity-100'
      }`}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: theme.accent }}
      />
      <span className="text-text-secondary">{label}</span>
    </Button>
  )
}

// ─── Technology card ──────────────────────────────────────────────────────────

interface TechCardProps {
  node: OutputNode
}

const TechCard: React.FC<TechCardProps> = ({ node }) => {
  const { id, content = {} } = node
  const layer: string = content.layer ?? ''
  const tech: string = content.technology ?? node.title ?? id
  const justify: string = content.justification ?? ''
  const usage: string = content.usage ?? ''
  const alternatives: string[] = toList(content.alternatives_considered)
  const risks: string[] = toList(content.risks)

  const theme = getTheme(layer)
  const layerLabel = layer.toUpperCase()

  return (
    <div
      className="group bg-surface border border-border-default rounded-2xl overflow-hidden flex flex-col border-l-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-border-hover"
      style={{ borderLeftColor: theme.accent }}
    >
      {/* ── Card header (subtle layer tint) ── */}
      <div
        className="px-6 pt-5 pb-4 flex items-start justify-between gap-3 border-b border-border-default"
        style={{ background: `${theme.accent}0D` }}
      >
        <div className="min-w-0">
          <span className="block text-[10px] font-bold font-mono text-text-muted tracking-wide mb-1">
            {id}
          </span>
          <h3 className="text-[18px] font-black text-text-primary tracking-tight leading-tight truncate">
            {tech}
          </h3>
        </div>

        {layerLabel && (
          <span
            className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
            style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
          >
            {layerLabel}
          </span>
        )}
      </div>

      {/* ── Card body ── */}
      <div className="p-6 flex flex-col gap-4 flex-1">
        {/* ── Justification ── */}
        {justify && (
          <div className="space-y-1.5">
            <p
              className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.15em]"
              style={{ color: theme.accent }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.accent }} />
              Justification
            </p>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              {justify}
            </p>
          </div>
        )}

        {/* ── Usage details ── */}
        {usage && (
          <div className="space-y-1.5">
            <p
              className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.15em]"
              style={{ color: theme.accent }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.accent }} />
              Usage
            </p>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              {usage}
            </p>
          </div>
        )}

        {/* ── Alternatives + Risks ── */}
        {(alternatives.length > 0 || risks.length > 0) && (
          <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-border-default">
            {alternatives.length > 0 && (
              <div className="rounded-xl bg-surface-muted border border-border-default p-3 space-y-1.5">
                <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.15em]">
                  Alternatives
                </p>
                <ul className="space-y-1">
                  {alternatives.map((item, i) => (
                    <li
                      key={i}
                      className="flex gap-1.5 text-[12px] text-text-secondary leading-relaxed"
                    >
                      <span className="text-text-muted shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {risks.length > 0 && (
              <div className="rounded-xl bg-red-500/5 border border-red-500/15 p-3 space-y-1.5">
                <p className="text-[9px] font-black text-red-500 uppercase tracking-[0.15em]">
                  Risks
                </p>
                <ul className="space-y-1">
                  {risks.map((item, i) => (
                    <li
                      key={i}
                      className="flex gap-1.5 text-[12px] text-text-secondary leading-relaxed"
                    >
                      <span className="text-red-500/60 shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main renderer ────────────────────────────────────────────────────────────

interface Props {
  outputs: OutputNode[]
  projectId?: string
  onContentUpdated?: () => void
}

export const TechnologyStackOutputRenderer: React.FC<Props> = ({ outputs, projectId, onContentUpdated }) => {
  const [activeLayer, setActiveLayer] = useState<string | null>(null)

  const techNodes = useMemo(
    () => outputs.filter((o) => o.type === 'TechnologyChoice'),
    [outputs],
  )

  const layers = useMemo(() => extractLayers(techNodes), [techNodes])

  const visibleNodes = useMemo(
    () =>
      activeLayer
        ? techNodes.filter(
            (n) => (n.content?.layer ?? '').toLowerCase() === activeLayer,
          )
        : techNodes,
    [techNodes, activeLayer],
  )

  const handlePillClick = (layer: string) => {
    setActiveLayer((prev) => (prev === layer ? null : layer))
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            Technology Stack
          </h1>
          <p className="text-[13px] text-text-secondary font-medium mt-0.5">
            Selected technologies with justifications and trade-offs
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-[12px] font-bold text-text-primary">Active</span>
        </div>
      </div>

      {/* ── Layer filter pills ── */}
      {layers.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {layers.map((layer) => (
            <FilterPill
              key={layer}
              layer={layer}
              active={activeLayer === layer}
              onClick={() => handlePillClick(layer)}
            />
          ))}
        </div>
      )}

      {/* ── Technology grid ── */}
      {visibleNodes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {visibleNodes.map((node) => (
            <EditableNodeCard
              key={node.id}
              node={node}
              projectId={projectId}
              onSaved={onContentUpdated}
              editableKeys={['title', 'justification', 'usage', 'alternatives_considered', 'risks']}
            >
              <TechCard node={node} />
            </EditableNodeCard>
          ))}
        </div>
      ) : (
        <EmptyState message="No technology choices available." />
      )}
    </div>
  )
}
