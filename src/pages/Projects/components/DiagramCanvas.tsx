import React, { useEffect, useState, useCallback } from 'react'
import type { Diagram } from '../../../services/project.service'
import { projectService } from '../../../services/project.service'
import { FileX, RefreshCw, Loader2, Layers } from 'lucide-react'
import { MermaidRenderer } from '../../../components/ui/DocumentRenderer/renderers/MermaidRenderer'
import { Button } from '../../../components/ui/Button'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
// Sorted L1 → L2 → L3 (least granular first)
const VALID_DIAGRAM_IDS = ['DIAG-S3-PC4-L1','DIAG-S3-PC4-L2','DIAG-S3-PC4-L3','DIAG-S3-P1', 'DIAG-S3-P1-2', 'DIAG-S3-P1-2-3']

// Metadata for each C4 level
const LEVEL_META: Record<string, { level: string; label: string; description: string; color: string; bg: string }> = {
  'DIAG-S3-P1': { level: 'L1', label: 'System Context', description: 'High-level overview of the system and its external actors', color: '#2563EB', bg: 'rgba(37,99,235,0.07)' },
  'DIAG-S3-P1-2': { level: 'L2', label: 'Container', description: 'Deployable units, services, and data stores within the system', color: '#7C3AED', bg: 'rgba(124,58,237,0.07)' },
  'DIAG-S3-P1-2-3': { level: 'L3', label: 'Component', description: 'Internal components and their interactions within containers', color: '#0D9488', bg: 'rgba(13,148,136,0.07)' },
}

interface DiagramCanvasProps {
  projectId: string
  sessionIndex?: number
  onDiagramRefresh?: () => void
}

interface DiagramCanvasState {
  diagrams: Diagram[]
  loading: boolean
  error: string | null
}

/**
 * DiagramCanvas – Fetches and renders C4 architecture diagrams.
 * Diagrams are sorted L1 → L2 → L3 (System Context → Container → Component).
 */
export const DiagramCanvas: React.FC<DiagramCanvasProps> = ({
  projectId,
  sessionIndex = 3,
  onDiagramRefresh,
}) => {
  const [state, setState] = useState<DiagramCanvasState>({
    diagrams: [],
    loading: true,
    error: null,
  })
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set())

  const toggleDescription = (id: string) => {
    setExpandedDescriptions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const fetchDiagrams = useCallback(async () => {
    if (!projectId) {
      setState((prev) => ({ ...prev, error: 'No project ID provided', loading: false }))
      return
    }
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const response = await projectService.getProjectDiagrams(projectId, sessionIndex)
      if (response.error) {
        setState({ diagrams: [], loading: false, error: response.error })
      } else if (response.data) {
        const allDiagrams: Diagram[] = response.data.diagrams || []
        const filteredDiagrams = allDiagrams
          .filter((d) => VALID_DIAGRAM_IDS.includes(d.id))
          .sort((a, b) => VALID_DIAGRAM_IDS.indexOf(a.id) - VALID_DIAGRAM_IDS.indexOf(b.id))
        setState({
          diagrams: filteredDiagrams,
          loading: false,
          error:
            filteredDiagrams.length === 0 && allDiagrams.length > 0
              ? 'No matching diagrams found'
              : null,
        })
      } else {
        setState({ diagrams: [], loading: false, error: 'No diagrams found' })
      }
    } catch (err) {
      console.error('Failed to fetch diagrams:', err)
      setState({
        diagrams: [],
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch diagrams',
      })
    }
  }, [projectId, sessionIndex])

  useEffect(() => { fetchDiagrams() }, [fetchDiagrams])

  useEffect(() => {
    if (onDiagramRefresh && state.diagrams.length > 0) onDiagramRefresh()
  }, [state.diagrams.length, onDiagramRefresh])

  const handleRefresh = () => fetchDiagrams()

  /* ── Loading ─────────────────────────────────────────────────────── */
  if (state.loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-surface border border-border-default rounded-2xl">
        <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
        <p className="text-[13px] font-medium text-text-muted">Loading architecture diagrams…</p>
      </div>
    )
  }

  /* ── Error ───────────────────────────────────────────────────────── */
  if (state.error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-red-50 border border-red-200 rounded-2xl">
        <FileX className="w-10 h-10 text-red-400 mb-4" />
        <p className="text-[13px] font-medium text-red-600 mb-4">{state.error}</p>
        <Button
          variant="unstyled"
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </Button>
      </div>
    )
  }

  /* ── Empty ───────────────────────────────────────────────────────── */
  if (state.diagrams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-surface border border-dashed border-border-default rounded-2xl">
        <FileX className="w-10 h-10 text-text-muted mb-4" />
        <p className="text-[13px] font-medium text-text-muted mb-4">No architecture diagrams available.</p>
        <Button
          variant="unstyled"
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-secondary bg-surface-muted border border-border-default rounded-lg hover:bg-surface transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>
    )
  }

  /* ── Diagrams ────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* Panel sub-header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-text-muted" />
          <span className="text-[13px] font-semibold text-text-secondary">
            {state.diagrams.length} Diagram{state.diagrams.length > 1 ? 's' : ''}
          </span>
          <div className="flex gap-1 ml-1">
            {state.diagrams.map((d) => {
              const meta = LEVEL_META[d.id]
              if (!meta) return null
              return (
                <span
                  key={d.id}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  {meta.level}
                </span>
              )
            })}
          </div>
        </div>
        <Button
          variant="unstyled"
          onClick={handleRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-text-secondary bg-surface-muted border border-border-default rounded-lg hover:bg-surface hover:border-border-strong transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* Individual diagram cards */}
      {state.diagrams.map((diagram, index) => {
        const mermaidContent = diagram.content || diagram.mermaid || ''
        const meta = LEVEL_META[diagram.id]

        return (
          <div
            key={diagram.id || index}
            className="rounded-2xl border border-border-default overflow-hidden shadow-sm"
          >
            {/* Card header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b border-border-default"
              style={{ background: meta?.bg ?? 'transparent' }}
            >
              <div className="flex items-center gap-3">
                {meta && (
                  <span
                    className="text-[11px] font-black px-2.5 py-1 rounded-lg tracking-widest shrink-0"
                    style={{ background: meta.color, color: '#fff' }}
                  >
                    {meta.level}
                  </span>
                )}
                <div>
                  <div className="text-[13px] font-bold text-text-primary leading-tight">
                    {meta?.label ?? diagram.title ?? 'Architecture Diagram'}
                  </div>
                  {(diagram.metadata?.description ?? meta?.description) && (
                    <div className="text-[11px] text-text-muted mt-0.5">
                      {diagram.metadata?.description ?? meta?.description}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-text-muted bg-surface px-2 py-0.5 rounded border border-border-default shrink-0">
                  {diagram.id}
                </span>
              </div>
            </div>

            {/* Diagram */}
            <div className="bg-surface p-4">
              <MermaidRenderer
                chart={mermaidContent}
                className="bg-white rounded-xl border border-border-default min-h-75"
                fullscreenTitle={meta?.label ?? diagram.title ?? 'Architecture Diagram'}
                autoFixEnabled={true}
                onAutoFix={async () => {
                  try {
                    const response = await projectService.fixDiagramSyntax(projectId, diagram.id)
                    if (response.error || !response.data?.fixed_content) {
                      return null
                    }
                    return response.data.fixed_content
                  } catch {
                    return null
                  }
                }}
              />
            </div>

            {/* Diagram description - 3-line preview, expand on click */}
            {(diagram.description || diagram.metadata?.description) && (() => {
              const isExpanded = expandedDescriptions.has(diagram.id)
              const descriptionContent = diagram.description || diagram.metadata?.description
              return (
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  onClick={() => toggleDescription(diagram.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggleDescription(diagram.id)
                    }
                  }}
                  className="group border-t border-border-default bg-surface-muted/30 px-6 py-4 cursor-pointer hover:bg-surface-muted/60 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
                      Description
                    </span>
                    <span className="text-[11px] font-semibold text-accent group-hover:underline">
                      {isExpanded ? 'Show less' : 'Show more'}
                    </span>
                  </div>
                  <div
                    className={`prose prose-slate prose-sm max-w-none text-text-secondary leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{descriptionContent}</ReactMarkdown>
                  </div>
                </div>
              )
            })()}
          </div>
        )
      })}
    </div>
  )
}

export default DiagramCanvas