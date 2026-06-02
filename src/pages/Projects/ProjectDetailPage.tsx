import React, { useState, useEffect, useCallback, useRef } from 'react'
import { MetadataPanel, TAB_OUTPUT_TYPES } from './components/MetadataPanel'
import { ChatComponent } from './components/ChatComponent'
import type { ChatComponentRef } from './components/ChatComponent'
import { useProjectSessions } from '../../hooks/useProjectSessions'
import { useHeader } from '../../context/HeaderContext'
import { projectService } from '../../services/project.service'
import { Button } from '../../components/ui/Button'

interface ProjectDetailPageProps {
  projectId: string
}

const TAB_NAMES = [
  'Brief',
  'Capabilities',
  'Technical Architecture',
  'Cost Estimation',
]

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({
  projectId,
}) => {
  const [documents] = useState<any[]>([])
  const { models, loading, error } = useProjectSessions(projectId)

  const { setTabs, setTitle, setProjectDetails } = useHeader()
  const chatRef = useRef<ChatComponentRef>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Custom Resizer State - Splitting Content and Right Rail
  const [contentWidth, setContentWidth] = useState(68) // Percentage for Main Content
  const [isDragging, setIsDragging] = useState(false)

  const [generatingIdx, setGeneratingIdx] = useState<number | null>(null)
  const [generationStatuses, setGenerationStatuses] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [activeSession, setActiveSession] = useState(1)
  const [activeIdx, setActiveIdx] = useState(0)
  const [activeTab, setActiveTab] = useState('Brief')
  const [activeDocumentData, setActiveDocumentData] = useState<any>(null)
  const [outputNodes, setOutputNodes] = useState<any[]>([])
  // State-based trigger to ensure graph refetch works regardless of ref timing
  const [graphRefreshTrigger, setGraphRefreshTrigger] = useState(0)
  // State-based trigger to force diagram refresh in Technical Architecture tab
  const [diagramRefreshTrigger, setDiagramRefreshTrigger] = useState(0)
  // Track if we're currently regenerating a section
  const [isRegenerating, setIsRegenerating] = useState(false)
  // Per-phase data presence — index-aligned with TAB_NAMES (Brief, Capabilities, Architecture, Cost).
  // Drives the sequential initialization gate in MetadataPanel.
  const [phaseHasData, setPhaseHasData] = useState<boolean[]>([false, false, false, false])

  const handleGenerateDoc = (sessionIndex: number) => {
    if (chatRef.current) {
      setGeneratingIdx(sessionIndex)
      setGenerationStatuses([])
      setIsRegenerating(true)
      chatRef.current.sendRawMessage({
        session_index: sessionIndex,
        message: '',
      })
    }
  }

  const handleNewDocument = () => {
    setGeneratingIdx(null)
  }

  const handleStatusUpdate = (status: string) => {
    setGenerationStatuses((prev) => [...prev, status])
  }

  const handleError = () => {
    setGeneratingIdx(null)
  }

  // Fetch project details for Description popup
  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const response = await projectService.getById(projectId)

        if (response.error) {
          console.error('Failed to fetch project details:', response.error)
          setProjectDetails({ name: 'Untitled Project', description: '' })
          return
        }

        // response.data might be an object with project details or could be null/undefined
        if (response.data && typeof response.data === 'object') {
          const data = response.data as any
          // Check if we have actual project data (name exists and is not empty)
          if (data.name && typeof data.name === 'string' && data.name.trim() !== '') {
            setProjectDetails({
              name: data.name || 'Untitled Project',
              description: data.description || '',
            })
          } else {
            setProjectDetails({ name: 'Untitled Project', description: data.description || '' })
          }
        } else {
          setProjectDetails({ name: 'Untitled Project', description: '' })
        }
      } catch (error) {
        console.error('Failed to fetch project details:', error)
        setProjectDetails({ name: 'Untitled Project', description: '' })
      }
    }
    fetchProjectDetails()
  }, [projectId, setProjectDetails])

  // Recompute per-phase data presence across all 4 sessions whenever the
  // project changes or the graph data is refreshed (post-generation). Each
  // phase is "present" iff its session graph contains at least one node of
  // a type that belongs to that phase.
  useEffect(() => {
    if (!projectId) return
    let cancelled = false

    const computePhaseHasData = async () => {
      const results = await Promise.all(
        [0, 1, 2, 3].map(async (phaseIdx) => {
          try {
            const response = await projectService.getProjectGraph(
              projectId,
              phaseIdx + 1,
            )
            if (response.error || !response.data) return false
            const data = response.data as any
            const nodes: any[] = Array.isArray(data.nodes)
              ? data.nodes
              : Array.isArray(data)
                ? data
                : []
            const allowedTypes = TAB_OUTPUT_TYPES[phaseIdx]
            return nodes.some((n) => allowedTypes.includes(n?.type))
          } catch {
            return false
          }
        }),
      )
      if (!cancelled) setPhaseHasData(results)
    }

    computePhaseHasData()
    return () => {
      cancelled = true
    }
  }, [projectId, graphRefreshTrigger])

  const handleNodesReceived = useCallback((nodes: any[]) => {
    setGeneratingIdx(null)
    setOutputNodes(nodes)
  }, [])

  // Trigger graph refetch when validate_output response is received from chat
  const handleValidateOutputReceived = useCallback(() => {
    setGeneratingIdx(null)
    // Increment trigger to force MetadataPanel to refetch graph data
    setGraphRefreshTrigger((prev) => prev + 1)
    // Increment trigger to force diagram refresh if on Technical Architecture tab (session 3, tab index 2)
    if (activeIdx === 2) {
      setDiagramRefreshTrigger((prev) => prev + 1)
    }
  }, [activeIdx])

  // Reset isRegenerating when regeneration completes
  const handleRegenerateComplete = useCallback(() => {
    setIsRegenerating(false)
  }, [])

  const handleActiveDocChange = useCallback((idx: number) => {
    setActiveSession(idx + 1)
  }, [])

  const handleActiveTabChange = useCallback((tabName: string, docData: any) => {
    setActiveTab(tabName)
    setActiveDocumentData(docData)
  }, [])

  // Update Header Context (Sidebar Items) - includes Description as FIRST element
  useEffect(() => {
    // Description is always the first item (informational, not clickable for tab change)
    const descriptionTab = {
      id: 'Description',
      label: 'Description',
      active: false,
      hasData: false,
      onClick: () => {}, // No tab change for Description - it just shows hover popup
    }

    const sidebarTabs = [
      descriptionTab,
      ...TAB_NAMES.map((name, idx) => {
        const tabDocIdx = idx <= 1 ? 0 : idx
        const hasData = documents.length > 0 && tabDocIdx < documents.length
        return {
          id: name,
          label: name,
          active: activeIdx === idx,
          hasData,
          onClick: () => setActiveIdx(idx),
        }
      }),
    ]
    setTabs(sidebarTabs)
    return () => {
      setTitle(null)
      setTabs([])
    }
  }, [activeIdx, documents, setTabs, setTitle])

  // --- Custom Resizer Logic ---
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const newWidthPx = e.clientX - containerRect.left
      const newWidthPct = (newWidthPx / containerRect.width) * 100

      // Boundaries: 50% Minimum to 80% Maximum for Main Content
      const clampedWidth = Math.min(Math.max(newWidthPct, 50), 80)
      setContentWidth(clampedWidth)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    document.body.style.userSelect = 'none'

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
    }
  }, [isDragging])

  return (
    <div
      className="flex h-full bg-surface overflow-hidden"
      ref={containerRef}
    >
      {/* Main Content Area */}
      <div
        style={{ width: `${contentWidth}%` }}
        className="flex flex-col relative min-w-0"
      >
        <MetadataPanel
          projectId={projectId}
          documents={documents}
          docsLoading={false}
          onGenerateDoc={handleGenerateDoc}
          generatingIdx={generatingIdx}
          generationStatuses={generationStatuses}
          selectedModel={selectedModel}
          onActiveDocChange={handleActiveDocChange}
          onActiveTabChange={handleActiveTabChange}
          externalActiveIdx={activeIdx}
          outputNodes={outputNodes}
          graphRefreshTrigger={graphRefreshTrigger}
          diagramRefreshTrigger={diagramRefreshTrigger}
          isRegenerating={isRegenerating}
          onRegenerateComplete={handleRegenerateComplete}
          phaseHasData={phaseHasData}
        />
      </div>

      {/* Custom Resizer Handle */}
      <div
        onMouseDown={handleMouseDown}
        className={`w-1 cursor-col-resize hover:bg-accent/20 transition-colors z-10 border-x border-border-default bg-surface-muted ${isDragging ? 'bg-accent/10' : ''}`}
      />

      {/* Right Rail - Intelligence & Copilot */}
      <div
        style={{ width: `${100 - contentWidth}%` }}
        className="bg-surface flex flex-col relative min-w-[320px] border-l border-border-default overflow-hidden"
      >
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
            <div className="w-6 h-6 border-2 border-[#5E43FB] border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
              Initialising Copilot
            </span>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="bg-red-500/10 p-8 rounded-3xl border border-red-500/20 max-w-sm">
              <h3 className="text-red-500 font-bold mb-2">Connection Error</h3>
              <p className="text-red-500/70 text-xs leading-relaxed">{error}</p>
              <Button
                variant="unstyled"
                className="mt-6 px-6 py-2.5 bg-red-500 text-white rounded-xl text-xs font-black shadow-lg hover:bg-red-500/90 transition-all active:scale-95"
                onClick={() => window.location.reload()}
              >
                RETRY CONNECTION
              </Button>
            </div>
          </div>
        ) : (
          <ChatComponent
            ref={chatRef}
            projectId={projectId}
            models={models}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            onNewDocument={handleNewDocument}
            onStatusUpdate={handleStatusUpdate}
            onError={handleError}
            activeSession={activeSession}
            activeTab={activeTab}
            activeDocumentData={activeDocumentData}
            onNodesReceived={handleNodesReceived}
            onValidateOutputReceived={handleValidateOutputReceived}
            onRegenerateComplete={handleRegenerateComplete}
          />
        )}
      </div>
    </div>
  )
}
