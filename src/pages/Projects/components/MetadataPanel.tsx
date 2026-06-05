import {
  useState,
  useEffect,
  useCallback,
} from 'react'
import type { FC } from 'react'
import {
  FileText,
  Loader2,
} from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { useDocumentVersions } from '../../../hooks/useDocumentVersions'
import { DocumentEditorModal } from './DocumentEditorModal'
import { BriefOutputRenderer } from './BriefOutputRenderer'
import { CapabilitiesOutputRenderer } from './CapabilitiesOutputRenderer'
import { ArchitectureOutputRenderer } from './ArchitectureOutputRenderer'
import { CostOutputRenderer } from './CostOutputRenderer'
import { projectService } from '../../../services/project.service'
import type { OutputNode } from '../../../services/project.service'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MetadataPanelProps {
  documents: any[]
  docsLoading: boolean
  projectId?: string
  onGenerateDoc?: (docIndex: number) => void
  generatingIdx?: number | null
  generationStatuses?: string[]
  selectedModel?: string
  onActiveDocChange?: (docIdx: number) => void
  /** Emitted when the active tab or displayed content changes, for @mention key extraction */
  onActiveTabChange?: (tabName: string, documentData: any) => void
  externalActiveIdx?: number
  /** Output nodes received from WebSocket */
  outputNodes?: any[]

  /** Trigger to force graph data refetch (e.g., after validate_output message) */
  graphRefreshTrigger?: number
  /** Whether the current section is being regenerated (used for button loading state) */
  isRegenerating?: boolean
  /** Callback when regeneration completes (validate_output received) - resets isRegenerating */
  onRegenerateComplete?: () => void
  /** Trigger to force diagram refresh in Technical Architecture tab */
  diagramRefreshTrigger?: number
  /**
   * Per-phase data presence flags, index-aligned with TAB_NAMES.
   * Used to enforce sequential initialization (a phase can only be initialized
   * when every upstream phase has data).
   */
  phaseHasData?: boolean[]
}

// Ref interface for exposing methods to parent
export interface MetadataPanelRef {
  fetchGraphData: () => void
}

const TAB_NAMES = [
  'Brief',
  'Capabilities',
  'Technical Architecture',
  'Cost Estimation',
]

// Node types that count as "data present" for each tab (index-aligned with TAB_NAMES).
// Exported so the parent can derive cross-phase dependency state from the same source of truth.
export const TAB_OUTPUT_TYPES: Record<number, string[]> = {
  0: [
    'Domain',
    'Subdomain',
    'ProblemStatement',
    'Stakeholder',
    'Assumption',
    'Goal',
    'Trait',
    'Risk',
    'DesiredOutcome',
    'DecisionPoint',
    'Component',
  ],
  1: ['BaseCapability', 'Capability', 'Trait', 'UserPersona', 'UserStory'],
  2: [
    'Component',
    'ArchitectureDecision',
    'Service',
    'API',
    'DataEntity',
    'ExternalSystem',
    'Infrastructure',
    'Deployment',
    'TechnologyChoice',
  ],
  3: [
    'CostEstimate',
    'CostComponent',
    'EffortEstimate',
    'InvestmentItem',
    'BudgetCategory',
    'Risk',
    'RiskItem',
    'Scenario',
    'Milestone',
    'ComplexityRating',
    'Deliverable',
    'Contingency',
    'Dependency',
    'RoiProjection',
  ],
}




// ─── Main Component ───────────────────────────────────────────────────────────

export const MetadataPanel: FC<MetadataPanelProps> = ({
  documents,
  projectId,
  onGenerateDoc,
  generatingIdx,
  onActiveDocChange,
  onActiveTabChange,
  externalActiveIdx = 0,
  outputNodes,
  graphRefreshTrigger = 0,
  isRegenerating = false,
  onRegenerateComplete,
  diagramRefreshTrigger = 0,
  phaseHasData,
}) => {
  const activeIdx = externalActiveIdx
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [outputs, setOutputs] = useState<OutputNode[]>([])
  const [outputsLoading, setOutputsLoading] = useState(false)
  const [outputsError, setOutputsError] = useState<string | null>(null)

  const {
    contentLoading: versionContentLoading,
    versionContent,
    fetchVersions,
    refreshVersions,
    resetVersionContent,
  } = useDocumentVersions()

  // Fetch graph data when projectId, active tab, or data source changes
  const fetchGraphData = useCallback(async () => {
    if (!projectId) return

    try {
      setOutputsLoading(true)
      setOutputsError(null)
      // session_index is 1-based (1=Brief, 2=User Stories, etc.)
      const sessionIndex = activeIdx + 1

      // Online mode: fetch from API
      const response = await projectService.getProjectGraph(projectId, sessionIndex)
      if (response.data) {
        // Handle new { nodes, edges } format from graph API
        const data = response.data as any
        if (data.nodes && Array.isArray(data.nodes)) {
          setOutputs(data.nodes)
        } else if (Array.isArray(data)) {
          // Legacy format: flat array
          setOutputs(data)
        } else {
          setOutputs([])
        }
      } else if (response.error) {
        setOutputsError(response.error)
        setOutputs([])
      }
    } catch {
      setOutputsError('Failed to load graph data')
      setOutputs([])
    } finally {
      setOutputsLoading(false)
    }
  }, [projectId, activeIdx])

  useEffect(() => {
    fetchGraphData()
  }, [fetchGraphData, graphRefreshTrigger])

  // Reset isRegenerating when regeneration completes
  useEffect(() => {
    if (onRegenerateComplete) {
      onRegenerateComplete()
    }
  }, [graphRefreshTrigger, onRegenerateComplete])

  // Get outputs for current tab based on node types
  // Combine API outputs with WebSocket received nodes
  const allOutputs = [...(outputNodes ?? []), ...(outputs ?? [])]
  const currentOutputTypes = TAB_OUTPUT_TYPES[activeIdx]
  const currentOutputs = Array.isArray(allOutputs)
    ? allOutputs.filter((o) => currentOutputTypes.includes(o.type))
    : []
  // Check if we have output data from either API or WebSocket
  const hasOutputData =
    currentOutputs.length > 0 || (outputNodes && outputNodes.length > 0)

  const docIdx = activeIdx
  const isGenerated = documents.length > 0 && docIdx < documents.length
  const activeDoc = isGenerated ? documents[docIdx] : null

  // Sequential initialization gate: Brief (0) is always unlocked; every later
  // phase requires every upstream phase to already have data. If phaseHasData
  // is not yet provided by the parent, fall back to the legacy "documents
  // exist" heuristic so the panel stays functional during the first render.
  const canInitialize =
    activeIdx === 0
      ? true
      : phaseHasData
        ? phaseHasData.slice(0, activeIdx).every(Boolean)
        : documents.length > activeIdx - 1

  useEffect(() => {
    onActiveDocChange?.(docIdx)
  }, [docIdx, onActiveDocChange])

  useEffect(() => {
    const rawResolved = versionContent
      ? versionContent
      : activeDoc
        ? activeDoc.content ?? activeDoc
        : null
    onActiveTabChange?.(TAB_NAMES[activeIdx], rawResolved)
  }, [activeIdx, versionContent, activeDoc, onActiveTabChange])

  useEffect(() => {
    if (activeDoc?.id) {
      fetchVersions(activeDoc.id)
      resetVersionContent()
    }
  }, [activeDoc?.id, fetchVersions, resetVersionContent])


  const handleGenerate = () => {
    return onGenerateDoc?.(activeIdx + 1)
  }

  const currentData = versionContent ?? activeDoc?.content ?? activeDoc ?? null

  // Render the appropriate output renderer based on active tab
  const renderOutputContent = () => {
    switch (activeIdx) {
      case 0:
        return <BriefOutputRenderer outputs={currentOutputs} onRegenerate={handleGenerate} isRegenerating={isRegenerating} projectId={projectId} onContentUpdated={fetchGraphData} />
      case 1:
        return <CapabilitiesOutputRenderer outputs={currentOutputs} onRegenerate={handleGenerate} isRegenerating={isRegenerating} projectId={projectId} onContentUpdated={fetchGraphData} />
      case 2:
        return <ArchitectureOutputRenderer outputs={currentOutputs} onRegenerate={handleGenerate} isRegenerating={isRegenerating} projectId={projectId} diagramRefreshTrigger={diagramRefreshTrigger} onContentUpdated={fetchGraphData} />
      case 3:
        return <CostOutputRenderer outputs={currentOutputs} onRegenerate={handleGenerate} isRegenerating={isRegenerating} projectId={projectId} onContentUpdated={fetchGraphData} />
      default:
        return null
    }
  }

  // Check if we should show output data. When the phase has no graph nodes,
  // fall through to the Initialize button instead of mounting the renderer —
  // for Architecture this avoids fetching diagrams before the phase exists.
  const showOutputRenderer = hasOutputData && currentOutputs.length > 0

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-surface">

      <div className="flex-1 overflow-y-auto relative custom-scrollbar">
        {/* Loading outputs */}
        {outputsLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
            <div className="space-y-6 max-w-md w-full">
              {/* Shimmer skeleton for loading state */}
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-linear-to-r from-surface-muted via-surface to-surface-muted animate-shimmer" />
              </div>
              <div className="h-8 w-48 mx-auto bg-linear-to-r from-surface-muted via-surface to-surface-muted rounded animate-shimmer" />
              <div className="h-4 w-64 mx-auto bg-linear-to-r from-surface-muted via-surface to-surface-muted rounded animate-shimmer" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 bg-linear-to-r from-surface-muted via-surface to-surface-muted rounded-xl animate-shimmer" />
                ))}
              </div>
              <div className="space-y-3 mt-4">
                <div className="h-4 w-full bg-linear-to-r from-surface-muted via-surface to-surface-muted rounded animate-shimmer" />
                <div className="h-4 w-3/4 bg-linear-to-r from-surface-muted via-surface to-surface-muted rounded animate-shimmer" />
                <div className="h-4 w-5/6 bg-linear-to-r from-surface-muted via-surface to-surface-muted rounded animate-shimmer" />
              </div>
            </div>
          </div>
        ) : outputsError ? (
          /* Outputs error - show document or generate */
          !isGenerated || generatingIdx === docIdx ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
              <div className="w-20 h-20 bg-surface-muted border border-border-default rounded-4xl flex items-center justify-center mb-8 shadow-sm rotate-3 group hover:rotate-0 transition-transform duration-500">
                <FileText className="w-10 h-10 text-text-muted group-hover:text-accent transition-colors" />
              </div>
              <h3 className="text-2xl font-black text-text-primary tracking-tight mb-3">
                {TAB_NAMES[activeIdx]}
              </h3>
              <p className="text-[15px] text-text-secondary max-w-[320px] leading-relaxed mb-10 font-medium">
                {canInitialize
                  ? `The ${TAB_NAMES[activeIdx]} phase is ready to be synthesized by Intelligence.`
                  : `Complete the previous phase to unlock the ${TAB_NAMES[activeIdx]} design.`}
              </p>
              <Button
                onClick={handleGenerate}
                disabled={generatingIdx !== null || !canInitialize}
                className="px-10 h-14 rounded-2xl bg-accent hover:bg-accent-muted text-white font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-200"
              >
                {generatingIdx === docIdx ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    {canInitialize
                      ? `Initialize ${TAB_NAMES[activeIdx]}`
                      : 'Phase Locked'}
                  </span>
                )}
              </Button>
            </div>
          ) : showOutputRenderer ? (
            <div className="px-6 py-6 animate-in fade-in duration-700">
              {renderOutputContent()}
            </div>
          ) : (
            <EmptyState
              tabName={TAB_NAMES[activeIdx]}
              canInitialize={canInitialize}
              generatingIdx={generatingIdx ?? null}
              docIdx={docIdx}
              onGenerate={handleGenerate}
            />
          )
        ) : showOutputRenderer ? (
          /* Show outputs data */
          <div className="px-6 py-6 animate-in fade-in duration-700">
            {renderOutputContent()}
          </div>
        ) : !isGenerated || generatingIdx === docIdx ? (
          /* No output data, show generate prompt */
          <EmptyState
            tabName={TAB_NAMES[activeIdx]}
            canInitialize={canInitialize}
            generatingIdx={generatingIdx ?? null}
            docIdx={docIdx}
            onGenerate={handleGenerate}
          />
        ) : (
          <div className="px-6 py-6 animate-in fade-in duration-700">
            {versionContentLoading && (
              <div className="absolute inset-0 z-50 bg-surface/60 backdrop-blur-md flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-8 h-8 text-accent animate-spin" />
                  <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">
                    Retrieving Version...
                  </span>
                </div>
              </div>
            )}
            {/* Render document content if available */}
            {currentData && (
              <div className="text-[15px] text-text-secondary leading-relaxed">
                <pre className="whitespace-pre-wrap font-mono text-[13px]">
                  {JSON.stringify(currentData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {activeDoc && (
        <DocumentEditorModal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          documentId={activeDoc.id}
          initialData={currentData}
          documentName={activeDoc.document_name ?? TAB_NAMES[activeIdx]}
          onSaveSuccess={() => {
            refreshVersions(activeDoc.id)
            resetVersionContent()
          }}
        />
      )}
    </div>
  )
}

// ─── Empty State Component ─────────────────────────────────────────────────────

const EmptyState: FC<{
  tabName: string
  canInitialize: boolean
  generatingIdx: number | null
  docIdx: number
  onGenerate: () => void
}> = ({ tabName, canInitialize, generatingIdx, docIdx, onGenerate }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
    <div className="w-20 h-20 bg-surface-muted border border-border-default rounded-4xl flex items-center justify-center mb-8 shadow-sm rotate-3 group hover:rotate-0 transition-transform duration-500">
      <FileText className="w-10 h-10 text-text-muted group-hover:text-accent transition-colors" />
    </div>
    <h3 className="text-2xl font-black text-text-primary tracking-tight mb-3">
      {tabName}
    </h3>
    <p className="text-[15px] text-text-secondary max-w-[320px] leading-relaxed mb-10 font-medium">
      {canInitialize
        ? `The ${tabName} phase is ready to be synthesized by Intelligence.`
        : `Complete the previous phase to unlock the ${tabName} design.`}
    </p>
    <Button
      onClick={onGenerate}
      disabled={generatingIdx !== null || !canInitialize}
      className="px-10 h-14 rounded-2xl bg-accent hover:bg-accent-muted text-white font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-200"
    >
      {generatingIdx === docIdx ? (
        <Loader2 className="w-6 h-6 animate-spin" />
      ) : (
        <span className="flex items-center gap-2">
          {canInitialize ? `Initialize ${tabName}` : 'Phase Locked'}
        </span>
      )}
    </Button>
  </div>
)