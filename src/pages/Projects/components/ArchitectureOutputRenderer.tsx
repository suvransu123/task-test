import React, { useState, useEffect, useRef } from 'react'
import type { OutputNode } from '../../../services/project.service'
import {  Server, Component, Code2,  BrainCircuit, ChevronDown, ChevronUp, AlertCircle, CheckCircle, HelpCircle, Layers, Info } from 'lucide-react'
import { OutputHeader } from './OutputHeader'
import { DiagramCanvas } from './DiagramCanvas'
import { TechnologyStackOutputRenderer } from './TechnologyStackOutputRenderer'
import { TabBar, MetricCard, EmptyState } from './shared'
import { Button } from '../../../components/ui/Button'
import { EditableNodeCard, NodeEditor } from './EditableNodeCard'
import { Pencil } from 'lucide-react'

interface ExpandedNode {
  id: string
  details: {
    purpose?: string
    method?: string
    path?: string
    responsibility?: string
    rationale?: string
    decision?: string
    system_type?: string
    integration_pattern?: string
    sensitivity?: string
    confidence_level?: string
    evidence_reasoning?: string
    would_change_if?: string[]
    assumptions_made?: string[]
    alternatives_considered?: string[]
    excluded?: string[]
  }
}

// Extract nested content from various formats
const getNestedContent = (node: OutputNode | undefined, field: string): any => {
  if (!node) return undefined
  if (node.content?.content && typeof node.content.content === 'object') {
    const contentObj = node.content.content as Record<string, any>
    if (field in contentObj) return contentObj[field]
  }
  if (node.content && typeof node.content === 'object') {
    const contentObj = node.content as Record<string, any>
    if (field in contentObj) return contentObj[field]
  }
  const nodeObj = node as Record<string, any>
  return field in nodeObj ? nodeObj[field] : undefined
}

// Parse __method_ string to extract method and path
const parseMethodString = (methodStr: string | undefined): { method: string; path: string } => {
  if (!methodStr) return { method: 'GET', path: '' }
  
  try {
    if (methodStr.includes('"GET"') || methodStr.includes("'GET'")) {
      const pathMatch = methodStr.match(/path["\s:]+["']([^"']+)["']/)
      return { method: 'GET', path: pathMatch ? pathMatch[1] : '' }
    }
    if (methodStr.includes('"POST"') || methodStr.includes("'POST'")) {
      const pathMatch = methodStr.match(/path["\s:]+["']([^"']+)["']/)
      return { method: 'POST', path: pathMatch ? pathMatch[1] : '' }
    }
    if (methodStr.includes('"PUT"') || methodStr.includes("'PUT'")) {
      const pathMatch = methodStr.match(/path["\s:]+["']([^"']+)["']/)
      return { method: 'PUT', path: pathMatch ? pathMatch[1] : '' }
    }
    if (methodStr.includes('"DELETE"') || methodStr.includes("'DELETE'")) {
      const pathMatch = methodStr.match(/path["\s:]+["']([^"']+)["']/)
      return { method: 'DELETE', path: pathMatch ? pathMatch[1] : '' }
    }
  } catch (e) {
    // Fallback
  }
  
  return { method: 'GET', path: methodStr }
}

// Extract detailed info from node content
const extractNodeDetails = (node: OutputNode): { details: ExpandedNode['details']; description: string; purpose: string; confidence: string } => {
  const content = (node.content as any)?.content || node.content || {}
  
  const description = content.description || (node as any).l1_summary?.split('\n')[0]?.replace(/^[^\:]+\:/, '')?.trim() || getNestedContent(node, 'description') || 'No description available.'
  const purpose = content.purpose || getNestedContent(node, 'purpose') || ''
  const confidence = node.confidence || getNestedContent(node, 'confidence') || 'inferred'
  
  const reasoning = content.reasoning || {}
  const evidence_confidence = content.evidence_confidence || {}
  
  const details: ExpandedNode['details'] = {
    purpose: content.purpose || undefined,
    method: content.method || undefined,
    path: content.path || undefined,
    responsibility: content.responsibility || undefined,
    rationale: content.rationale || reasoning.rationale || reasoning.selection_rationale || undefined,
    decision: content.decision || getNestedContent(node, 'decision') || undefined,
    system_type: content.system_type || undefined,
    integration_pattern: content.integration_pattern || undefined,
    sensitivity: content.sensitivity || undefined,
    confidence_level: evidence_confidence.level || confidence,
    evidence_reasoning: evidence_confidence.reasoning || reasoning.selection_rationale || undefined,
    would_change_if: reasoning.would_change_if || [],
    assumptions_made: reasoning.assumptions_made || [],
    alternatives_considered: reasoning.alternatives_considered || [],
    excluded: reasoning.excluded || [],
  }
  
  return { details, description, purpose, confidence }
}

// Confidence badge component
const ConfidenceBadge: React.FC<{ confidence: string }> = ({ confidence }) => {
  const config = {
    high: { icon: CheckCircle, color: 'text-green-600 bg-green-50', label: 'High' },
    medium: { icon: HelpCircle, color: 'text-amber-600 bg-amber-50', label: 'Medium' },
    inferred: { icon: AlertCircle, color: 'text-blue-600 bg-blue-50', label: 'Inferred' },
    low_confidence: { icon: AlertCircle, color: 'text-red-600 bg-red-50', label: 'Low' },
    default: { icon: HelpCircle, color: 'text-gray-600 bg-gray-50', label: 'Unknown' },
  }
  
  const { icon: Icon, color, label } = config[confidence as keyof typeof config] || config.default
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded ${color}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
}

// Method badge for API table
const MethodBadge: React.FC<{ method: string }> = ({ method }) => {
  const config: Record<string, { bg: string; text: string }> = {
    GET: { bg: 'bg-blue-50', text: 'text-blue-600' },
    POST: { bg: 'bg-green-50', text: 'text-green-600' },
    PUT: { bg: 'bg-amber-50', text: 'text-amber-600' },
    DELETE: { bg: 'bg-red-50', text: 'text-red-600' },
    PATCH: { bg: 'bg-purple-50', text: 'text-purple-600' },
  }
  
  const { bg, text } = config[method.toUpperCase()] || { bg: 'bg-gray-50', text: 'text-gray-600' }
  
  return (
    <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded ${bg} ${text}`}>
      {method}
    </span>
  )
}

// Expandable card component
const ExpandableCard: React.FC<{
  title: string
  description: string
  details: ExpandedNode['details']
  confidence: string
  isExpanded: boolean
  onToggle: () => void
  itemId?: string
}> = ({ title, description, details, confidence, isExpanded, onToggle, itemId }) => {
  const hasDetails = Object.values(details).some(v => v && (Array.isArray(v) ? v.length > 0 : true))
  
  return (
    <div className="bg-background border border-border-default rounded-xl shadow-sm overflow-hidden transition-all hover:border-border-strong">
      <div 
        className="p-5 cursor-pointer flex items-start justify-between gap-4"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          {itemId && (
            <span className="text-[11px] font-bold text-[#5E43FB]">{itemId}</span>
          )}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="text-[15px] font-bold text-text-primary leading-tight">{title}</h3>
            <ConfidenceBadge confidence={confidence} />
          </div>
          <p className="text-[13px] text-text-secondary leading-relaxed line-clamp-2">{description}</p>
          {details.purpose && (
            <p className="text-[12px] text-text-muted mt-1 italic">Purpose: {details.purpose}</p>
          )}
        </div>
        {hasDetails && (
          <Button variant="unstyled" className="shrink-0 p-1 hover:bg-surface-muted rounded-lg transition-colors">
            {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
          </Button>
        )}
      </div>
      
      {isExpanded && hasDetails && (
        <div
          className="px-5 pb-5 border-t border-border-default"
          style={{ background: 'rgba(94,67,251,0.03)', borderLeft: '3px solid #5E43FB' }}
        >
          <div className="pt-4 space-y-4">
            {details.rationale && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#5E43FB] mb-1">Rationale</div>
                <div className="text-[13px] text-text-secondary leading-relaxed">{details.rationale}</div>
              </div>
            )}
            
            {details.decision && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#5E43FB] mb-1">Decision</div>
                <div className="text-[13px] text-text-secondary leading-relaxed">{details.decision}</div>
              </div>
            )}
            
            {details.responsibility && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Responsibility</div>
                <div className="text-[13px] text-text-secondary leading-relaxed">{details.responsibility}</div>
              </div>
            )}
            
            {details.sensitivity && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Sensitivity</div>
                <div className="text-[13px] text-text-secondary leading-relaxed capitalize">{details.sensitivity}</div>
              </div>
            )}
            
            {details.assumptions_made && details.assumptions_made.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Assumptions</div>
                <ul className="text-[13px] text-text-secondary leading-relaxed list-disc list-inside space-y-1">
                  {details.assumptions_made.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {details.evidence_reasoning && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Evidence</div>
                <div className="text-[13px] text-text-secondary leading-relaxed">{details.evidence_reasoning}</div>
              </div>
            )}
            
            {details.would_change_if && details.would_change_if.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Would Change If</div>
                <ul className="text-[13px] text-text-secondary leading-relaxed list-disc list-inside space-y-1">
                  {details.would_change_if.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// API Row component
const APIRow: React.FC<{
  node: OutputNode
  isExpanded: boolean
  onToggle: () => void
  projectId?: string
  onContentUpdated?: () => void
}> = ({ node, isExpanded, onToggle, projectId, onContentUpdated }) => {
  const [isEditing, setIsEditing] = useState(false)
  const content = (node.content as any)?.content || node.content || {}
  const methodStr = content.__method_ || ''
  const { method, path } = parseMethodString(methodStr)

  const description = content.description || getNestedContent(node, 'description') || 'No description available.'
  const purpose = content.purpose || ''
  const confidence = node.confidence || 'inferred'

  if (isEditing && projectId && node.id) {
    return (
      <tr className="border-b border-border-default bg-surface-muted">
        <td colSpan={4} className="p-4">
          <NodeEditor
            node={node}
            projectId={projectId}
            editableKeys={['__method_', 'path', 'description', 'purpose']}
            onCancel={() => setIsEditing(false)}
            onSaved={() => {
              setIsEditing(false)
              onContentUpdated?.()
            }}
          />
        </td>
      </tr>
    )
  }

  return (
    <>
      <tr
        className="border-b border-border-default hover:bg-surface-muted transition-colors cursor-pointer group"
        onClick={onToggle}
      >
        <td className="py-4 px-4">
          <MethodBadge method={method} />
        </td>
        <td className="py-4 px-4">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-text-primary">{node.title}</span>
            {path && (
              <code className="text-[11px] text-text-muted bg-surface-muted px-1.5 py-0.5 rounded font-mono">{path}</code>
            )}
          </div>
        </td>
        <td className="py-4 px-4">
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-text-secondary">{description}</span>
            <ConfidenceBadge confidence={confidence} />
          </div>
        </td>
        <td className="py-4 px-4">
          <div className="flex items-center gap-1">
            {projectId && node.id && (
              <Button
                variant="unstyled"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditing(true)
                }}
                title="Edit"
                className="p-1 text-text-muted hover:text-accent rounded transition-colors opacity-0 group-hover:opacity-100"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button variant="unstyled" className="p-1 hover:bg-surface rounded transition-colors">
              {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
            </Button>
          </div>
        </td>
      </tr>
      {isExpanded && purpose && (
        <tr className="border-b border-border-default bg-surface-muted">
          <td colSpan={4} className="px-4 py-3">
            <div className="text-[11px] text-text-muted">
              <span className="font-bold uppercase tracking-widest">Purpose:</span> {purpose}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export const ArchitectureOutputRenderer: React.FC<{
  outputs: OutputNode[]
  loading?: boolean
  onRegenerate?: () => void
  isRegenerating?: boolean
  projectId?: string
  diagramRefreshTrigger?: number
  onContentUpdated?: () => void
}> = ({ outputs, onRegenerate, isRegenerating, projectId, diagramRefreshTrigger = 0, onContentUpdated }) => {
  const contentRef = useRef<HTMLDivElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (!exportRef.current) return
    setIsExporting(true)
    try {
      const { exportToPDF } = await import('../../../utils/pdfExporter')
      await exportToPDF(exportRef.current, { filename: 'architecture', format: 'a4' })
    } catch (err) {
      console.error('PDF Export Error:', err)
    } finally {
      setIsExporting(false)
    }
  }
  
  const components = outputs.filter((o) => o.type === 'Component')
  const dataEntities = outputs.filter((o) => o.type === 'DataEntity')
  const infrastructure = outputs.filter((o) => o.type === 'Infrastructure')
  const deployment = outputs.filter((o) => o.type === 'Deployment')
  const apis = outputs.filter((o) => o.type === 'API')
  const archDecisions = outputs.filter((o) => o.type === 'ArchitectureDecision')
  const techStackNodes = outputs.filter((o) => o.type === 'TechnologyChoice')
  const capabilities = outputs.filter((o) => o.type === 'Capability' || o.type === 'BaseCapability')

  // Use all components with type 'Component'
  const validComponents = components

  // State for diagram refresh trigger
  const [diagramKey, setDiagramKey] = useState(0)

  // Update diagram key when refresh trigger changes
  useEffect(() => {
    if (diagramRefreshTrigger > 0) {
      setDiagramKey(diagramRefreshTrigger)
    }
  }, [diagramRefreshTrigger])

  // Tab names type
  type TabName = 'Architecture Diagram' | 'Technology Stack'  | 'Infrastructure' | 'Deployment' | 'APIs' | 'Decisions' | 'Base Capabilities'

  // Define tabs with their icon and count
  const allTabs: { name: TabName; count: number; icon: React.FC<any>; description?: string }[] = [
    { name: 'Architecture Diagram', count: 1, icon: Component },
    { name: 'Technology Stack', count: techStackNodes.length, icon: Layers },
    { name: 'Infrastructure', count: infrastructure.length, icon: Server },
    { name: 'Deployment', count: deployment.length, icon: Server },
    { name: 'APIs', count: apis.length, icon: Code2 },
    { name: 'Decisions', count: archDecisions.length, icon: BrainCircuit },
    { name: 'Base Capabilities', count: capabilities.length, icon: Layers },
  ]

  // Extract numeric suffix from ID (e.g., "component-0001" -> 1)
  const extractIdNumber = (id: string): number => {
    const match = id.match(/(\d+)$/)
    return match ? parseInt(match[1], 10) : 0
  }

  // Sort components by their numeric ID in ascending order
  const sortedComponents = [...validComponents].sort((a, b) => {
    return extractIdNumber(a.id || '') - extractIdNumber(b.id || '')
  })

  // Filter tabs to only show those with data (except Architecture Diagram which is always shown)
  const tabs = allTabs.filter(tab => tab.name === 'Architecture Diagram' || tab.count > 0)

  const [activeTab, setActiveTab] = useState<TabName>(tabs[0]?.name || 'Architecture Diagram')

  const activeDataMap: Record<TabName, OutputNode[]> = {
    'Architecture Diagram': sortedComponents,
    'Technology Stack': techStackNodes,
    'Infrastructure': infrastructure,
    'Deployment': deployment,
    'APIs': apis,
    'Decisions': archDecisions,
    'Base Capabilities': capabilities,
  }

  const activeNodes = activeDataMap[activeTab]

  const handleToggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-5xl" ref={contentRef}>

      {/* ── Hidden all-tabs export container ── */}
      <div ref={exportRef} style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '800px', backgroundColor: '#fff' }}>
        <div style={{ fontFamily: 'Georgia, serif', color: '#000', backgroundColor: '#fff', padding: '20mm', maxWidth: '170mm', margin: '0 auto', fontSize: '10pt', lineHeight: '1.5' }}>
          <div style={{ marginBottom: '20pt', borderBottom: '2px solid #000', paddingBottom: '10pt' }}>
            <h1 style={{ fontSize: '18pt', fontWeight: 'bold', margin: '0 0 4pt 0' }}>Technical Architecture</h1>
            <p style={{ fontSize: '9pt', color: '#666', margin: '0' }}>System components, infrastructure, and decisions.</p>
          </div>

          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6pt', marginBottom: '16pt' }}>
            {[
              { label: 'Decisions', value: archDecisions.length },
              { label: 'Data Entities', value: dataEntities.length },
              { label: 'APIs', value: apis.length },
              { label: 'Components', value: components.length },
            ].map(m => (
              <div key={m.label} style={{ border: '1px solid #ccc', padding: '8pt', textAlign: 'center' }}>
                <div style={{ fontSize: '14pt', fontWeight: 'bold' }}>{m.value}</div>
                <div style={{ fontSize: '7pt', color: '#666' }}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* Infrastructure, Deployment */}
          {[
           
            { label: 'Infrastructure', nodes: infrastructure },
            { label: 'Deployment', nodes: deployment },
          ].filter(s => s.nodes.length > 0).map(section => (
            <section key={section.label} style={{ marginBottom: '14pt' }}>
              <h2 style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '6pt', borderBottom: '1px solid #000', paddingBottom: '2pt' }}>{section.label}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6pt' }}>
                {section.nodes.map((node, i) => {
                  const { description, confidence } = extractNodeDetails(node)
                  return (
                    <div key={node.id || i} style={{ border: '1px solid #ccc', padding: '6pt', fontSize: '8pt' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4pt', marginBottom: '2pt' }}>
                        <span style={{ fontWeight: 'bold' }}>{node.title}</span>
                        <span style={{ fontSize: '6pt', fontWeight: 'bold', textTransform: 'uppercase', color: '#666' }}>{confidence}</span>
                      </div>
                      <div style={{ color: '#666' }}>{description}</div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}

          {/* APIs Table */}
          {apis.length > 0 && (
            <section style={{ marginBottom: '14pt' }}>
              <h2 style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '6pt', borderBottom: '1px solid #000', paddingBottom: '2pt' }}>APIs</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #000' }}>
                    {['Method', 'Endpoint', 'Description'].map(h => <th key={h} style={{ padding: '4pt 6pt', textAlign: 'left', fontSize: '7pt', fontWeight: 'bold', textTransform: 'uppercase', color: '#666' }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {apis.map((api, i) => {
                    const content = (api.content as any)?.content || api.content || {}
                    const { method, path } = parseMethodString(content.__method_ || '')
                    const desc = content.description || ''
                    return (
                      <tr key={api.id || i} style={{ borderBottom: '1px solid #ccc' }}>
                        <td style={{ padding: '4pt 6pt' }}><span style={{ fontWeight: 'bold' }}>{method}</span></td>
                        <td style={{ padding: '4pt 6pt' }}><span style={{ fontWeight: 'bold' }}>{api.title}</span>{path && <span style={{ marginLeft: '4pt', color: '#666' }}>{path}</span>}</td>
                        <td style={{ padding: '4pt 6pt', color: '#666' }}>{desc}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </section>
          )}

          {/* Architecture Decisions */}
          {archDecisions.length > 0 && (
            <section>
              <h2 style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '6pt', borderBottom: '1px solid #000', paddingBottom: '2pt' }}>Architecture Decisions</h2>
              {archDecisions.map((dec, i) => {
                const { details, description } = extractNodeDetails(dec)
                return (
                  <div key={dec.id || i} style={{ marginBottom: '8pt', fontSize: '9pt' }}>
                    <div style={{ fontWeight: 'bold' }}>{dec.title}</div>
                    <div style={{ color: '#666' }}>{description}</div>
                    {details.rationale && <div style={{ color: '#666', borderLeft: '2px solid #666', paddingLeft: '6pt', marginTop: '2pt' }}>{details.rationale}</div>}
                  </div>
                )
              })}
            </section>
          )}
        </div>
      </div>
      <OutputHeader
        title="Technical Architecture"
        description="System components, infrastructure, integrations, and architecture decisions that form the system foundation."
        onRegenerate={onRegenerate}
        isRegenerating={isRegenerating}
        canExport={outputs.length > 0}
        onExport={handleExport}
        isExporting={isExporting}
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <MetricCard value={archDecisions.length} label="Decisions" sub="key architectural choices" />
        <MetricCard value={dataEntities.length} label="Data Entities" sub="domain models" />
        <MetricCard value={apis.length} label="APIs" sub="integrations" />
      </div>

      {/* Tabs */}
      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(name) => {
          setActiveTab(name as TabName)
          setExpandedId(null)
        }}
      />

      {/* Tab Content */}
      <div className="bg-surface border border-border-default rounded-3xl p-8 shadow-[0_1px_3px_rgba(15,15,15,0.05)]">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
            {activeTab.toUpperCase()}
          </div>
          {allTabs.find(t => t.name === activeTab)?.description && (
            <div className="flex items-center gap-2 text-[11px] text-text-muted">
              <Info className="w-3.5 h-3.5" />
              <span>{allTabs.find(t => t.name === activeTab)?.description}</span>
            </div>
          )}
        </div>

        {activeTab === 'Architecture Diagram' ? (
          // Render the mermaid diagram from API — independent of component output data
          projectId ? (
            <DiagramCanvas
              key={`diagram-${diagramKey}`}
              projectId={projectId}
              sessionIndex={3}
            />
          ) : (
            <EmptyState message="No project ID provided for diagram rendering." />
          )
        ) : activeNodes.length === 0 ? (
          <EmptyState message={`No data for ${activeTab.toLowerCase()}.`} />
        ) : activeTab === 'Technology Stack' ? (
          <TechnologyStackOutputRenderer outputs={techStackNodes} projectId={projectId} onContentUpdated={onContentUpdated} />
        ) : activeTab === 'APIs' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Method</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Endpoint</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Description</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-text-muted w-12"></th>
                </tr>
              </thead>
              <tbody>
                {activeNodes.map((api, idx) => (
                  <APIRow
                    key={api.id || idx}
                    node={api}
                    isExpanded={expandedId === api.id}
                    onToggle={() => handleToggleExpand(api.id || `api-${idx}`)}
                    projectId={projectId}
                    onContentUpdated={onContentUpdated}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {activeNodes.map((node, i) => {
              // Infrastructure and Deployment tabs: resource detail cards
              if (activeTab === 'Infrastructure' || activeTab === 'Deployment') {
                // Strip [stub] prefix from titles if present
                const displayTitle = node.title.replace(/^\[stub\]\s*/i, '')
                const description = getNestedContent(node, 'description') || ''
                const resourceType = getNestedContent(node, 'resource_type') || ''
                const provider = getNestedContent(node, 'provider') || ''
                const usage = getNestedContent(node, 'usage') || ''
                // Deployment-only strategy fields
                const strategy = getNestedContent(node, 'strategy') || ''
                const scalingStrategy = getNestedContent(node, 'scaling_strategy') || ''
                return (
                  <EditableNodeCard
                    key={node.id || i}
                    node={node}
                    projectId={projectId}
                    onSaved={onContentUpdated}
                    editableKeys={['title', 'description', 'usage']}
                  >
                  <div
                    className="group flex flex-col gap-3 p-5 bg-background border border-border-default rounded-xl hover:border-border-hover hover:shadow-md transition-all"
                  >
                    {/* Header: icon + title + provider */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-[#5E43FB]/10 flex items-center justify-center shrink-0">
                          <Server className="w-4 h-4 text-[#5E43FB]" />
                        </div>
                        <h3 className="text-[15px] font-bold text-text-primary leading-tight truncate">
                          {displayTitle}
                        </h3>
                      </div>
                      {provider && (
                        <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-accent/10 text-accent">
                          {provider}
                        </span>
                      )}
                    </div>

                    {/* Resource type chip */}
                    {resourceType && (
                      <span className="self-start inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-surface-muted text-text-secondary border border-border-default">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#5E43FB]" />
                        {resourceType}
                      </span>
                    )}

                    {/* Description */}
                    {description && (
                      <p className="text-[13px] text-text-secondary leading-relaxed">
                        {description}
                      </p>
                    )}

                    {/* Deployment strategy details */}
                    {activeTab === 'Deployment' && (strategy || scalingStrategy) && (
                      <div className="grid grid-cols-2 gap-3">
                        {strategy && (
                          <div className="rounded-xl bg-surface-muted border border-border-default p-3 space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-text-muted">
                              Strategy
                            </p>
                            <p className="text-[12px] text-text-secondary leading-relaxed">
                              {strategy}
                            </p>
                          </div>
                        )}
                        {scalingStrategy && (
                          <div className="rounded-xl bg-surface-muted border border-border-default p-3 space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-text-muted">
                              Scaling Strategy
                            </p>
                            <p className="text-[12px] text-text-secondary leading-relaxed">
                              {scalingStrategy}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Usage */}
                    {usage && (
                      <div className="pt-3 mt-auto border-t border-border-default">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">
                          Usage
                        </div>
                        <p className="text-[13px] text-text-secondary leading-relaxed">
                          {usage}
                        </p>
                      </div>
                    )}
                  </div>
                  </EditableNodeCard>
                )
              }

              // All other tabs use expandable cards with full details
              const { details, description, confidence } = extractNodeDetails(node)
              return (
                <EditableNodeCard
                  key={node.id || i}
                  node={node}
                  projectId={projectId}
                  onSaved={onContentUpdated}
                  editableKeys={
                    activeTab === 'Decisions'
                      ? ['title', 'description', 'rationale', 'decision']
                      : ['title', 'description', 'rationale']
                  }
                >
                  <ExpandableCard
                    title={node.title}
                    description={description}
                    details={details}
                    confidence={confidence}
                    isExpanded={expandedId === node.id}
                    onToggle={() => handleToggleExpand(node.id || `node-${i}`)}
                  />
                </EditableNodeCard>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}