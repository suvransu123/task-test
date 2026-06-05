import { useState, useRef } from 'react'
import type { FC } from 'react'
import { Info, Pencil } from 'lucide-react'
import type { OutputNode } from '../../../services/project.service'
import { OutputHeader } from './OutputHeader'
import { TabBar, MetricCard, CapabilityCard } from './shared'
import { EditableNodeCard, NodeEditor } from './EditableNodeCard'
import { Button } from '../../../components/ui/Button'

const getNestedContent = (node: OutputNode | undefined, field: string): string => {
  if (!node) return ''

  if (node.content?.content && typeof node.content.content === 'object') {
    const contentObj = node.content.content as Record<string, any>
    if (field in contentObj) {
      return String(contentObj[field] ?? '')
    }
  }
  if (node.content && typeof node.content === 'object') {
    const contentObj = node.content as Record<string, any>
    if (field in contentObj) {
      return String(contentObj[field] ?? '')
    }
  }
  return ''
}

export const CapabilitiesOutputRenderer: FC<{ outputs: OutputNode[]; onRegenerate?: () => void; isRegenerating?: boolean; projectId?: string; onContentUpdated?: () => void }> = ({ outputs, onRegenerate, isRegenerating, projectId, onContentUpdated }) => {
  const contentRef = useRef<HTMLDivElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)
  const [hoveredPersona, setHoveredPersona] = useState<string | null>(null)
  const [hoveredStoryId, setHoveredStoryId] = useState<string | number | null>(null)
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (!exportRef.current) return
    setIsExporting(true)
    try {
      const { exportToPDF } = await import('../../../utils/pdfExporter')
      await exportToPDF(exportRef.current, { filename: 'capabilities', format: 'a4' })
    } catch (err) {
      console.error('PDF Export Error:', err)
    } finally {
      setIsExporting(false)
    }
  }

  // Filter nodes by type
  const personas = outputs.filter(o => o.type === 'UserPersona')
  const capabilities = outputs.filter(o => o.type === 'Capability')
  const baseCapabilities = outputs.filter(o => o.type === 'BaseCapability')
  const stories = outputs.filter(o => o.type === 'UserStory')

  // Only show tabs that actually have data
  const capabilityTabs = [
    { name: 'Shared Foundation' as const, count: baseCapabilities.length },
    { name: 'Capabilities' as const, count: capabilities.length },
    { name: 'Personas' as const, count: personas.length },
    { name: 'User Stories' as const, count: stories.length },
  ].filter((t) => t.count > 0)

  const [activeTab, setActiveTab] = useState<
    'Capabilities' | 'Personas' | 'User Stories' | 'Shared Foundation'
  >(capabilityTabs[0]?.name ?? 'Capabilities')

  const highImpactCount = capabilities.filter(
    c => (getNestedContent(c, 'impact') || '').toLowerCase() === 'high'
  ).length
  const highComplexityCount = capabilities.filter(
    c => (getNestedContent(c, 'complexity') || '').toLowerCase() === 'high'
  ).length
  const baseHighImpactCount = baseCapabilities.filter(
    c => (getNestedContent(c, 'impact') || '').toLowerCase() === 'high'
  ).length

  // Get story count per persona
  const getStoryCount = (persona: OutputNode): number => {
    const personaName = persona.title?.split('—')[0].trim() || ''
    return stories.filter(s => {
      const cap = getNestedContent(s, 'capability') || ''
      // Match capability field (e.g., "Leena") against extracted name from persona title
      return cap.toLowerCase() === personaName.toLowerCase()
    }).length
  }

  // Get capability for a story (e.g., "Priya — DevOps Engineer" from capability field)
  const getPersonaFromCapability = (capability: string): { name: string; initial: string } | null => {
    if (!capability) return null
    // Format: "Name — Role" or just name
    const parts = capability.split('—')
    const name = parts[0].trim()
    return name ? { name, initial: name.charAt(0).toUpperCase() } : null
  }

  // Find matching persona from UserPersona nodes
  const findPersonaData = (personaName: string) => {
    return personas.find(p =>
      p.title?.toLowerCase().includes(personaName.toLowerCase()) ||
      personaName.toLowerCase().includes(p.title?.toLowerCase() || '')
    )
  }

  // Extract numeric suffix from ID (e.g., "capability-0001" -> 1)
  const extractIdNumber = (id: string): number => {
    const match = id.match(/(\d+)$/)
    return match ? parseInt(match[1], 10) : 0
  }

  // Sort capabilities by their numeric ID in ascending order
  // const sortedCapabilities = [...capabilities].sort((a, b) => {
  //   return extractIdNumber(a.id || '') - extractIdNumber(b.id || '')
  // })
  // const sortedCapabilities = [...capabilities].sort((a, b) => {
  //   return Number(a.content?.priority || 0) - Number(b.content?.priority || 0)
  // })
  const sortedCapabilities = [...capabilities].sort((a, b) => {
    return (
      Number(getNestedContent(a, 'priority')) -
      Number(getNestedContent(b, 'priority'))
    )
  })
  // Sort stories by their numeric ID in ascending order
  const sortedStories = [...stories].sort((a, b) => {
    return extractIdNumber(a.id || '') - extractIdNumber(b.id || '')
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-5xl" ref={contentRef}>

      {/* ── Hidden all-tabs export container ── */}
      <div ref={exportRef} style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '800px', backgroundColor: '#fff' }}>
        <div style={{ fontFamily: 'Georgia, serif', color: '#000', backgroundColor: '#fff', padding: '20mm', maxWidth: '170mm', margin: '0 auto', fontSize: '10pt', lineHeight: '1.5' }}>
          <div style={{ marginBottom: '20pt', borderBottom: '2px solid #000', paddingBottom: '10pt' }}>
            <h1 style={{ fontSize: '18pt', fontWeight: 'bold', margin: '0 0 4pt 0' }}>Capabilities</h1>
            <p style={{ fontSize: '9pt', color: '#666', margin: '0' }}>Personas, capabilities, and user stories.</p>
          </div>

          {/* Capabilities */}
          {sortedCapabilities.length > 0 && (
            <section style={{ marginBottom: '16pt' }}>
              <h2 style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '8pt', borderBottom: '1px solid #000', paddingBottom: '3pt' }}>Capabilities</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8pt' }}>
                {sortedCapabilities.map((cap, idx) => {
                  const impact = (getNestedContent(cap, 'impact') || 'medium').toLowerCase()
                  const complexity = (getNestedContent(cap, 'complexity') || 'medium').toLowerCase()
                  return (
                    <div key={cap.id || idx} style={{ border: '1px solid #ccc', padding: '8pt', fontSize: '9pt' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4pt' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '8pt', color: '#666' }}>{cap.id}</span>
                        {impact === 'high' && <span style={{ fontSize: '7pt', fontWeight: 'bold', textTransform: 'uppercase', color: '#000' }}>HIGH</span>}
                      </div>
                      <div style={{ fontWeight: 'bold', marginBottom: '2pt' }}>{cap.title}</div>
                      <div style={{ color: '#666', marginBottom: '4pt', fontSize: '8pt' }}>{getNestedContent(cap, 'description') || ''}</div>
                      <div style={{ fontSize: '8pt', color: '#666' }}>Impact: {impact} | Complexity: {complexity}</div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Personas */}
          {personas.length > 0 && (
            <section style={{ marginBottom: '16pt' }}>
              <h2 style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '8pt', borderBottom: '1px solid #000', paddingBottom: '3pt' }}>Personas</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8pt' }}>
                {personas.map((persona, idx) => {
                  const role = getNestedContent(persona, 'role')
                  const archetype = getNestedContent(persona, 'archetype')
                  const primaryGoal = getNestedContent(persona, 'primary_goal')
                  const painPoint = getNestedContent(persona, 'pain_point')
                  return (
                    <div key={persona.id || idx} style={{ border: '1px solid #ccc', padding: '8pt', fontSize: '9pt' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '2pt' }}>{persona.title}</div>
                      {role && <div style={{ fontSize: '8pt', color: '#666', marginBottom: '2pt' }}>{role}</div>}
                      {archetype && <div style={{ fontSize: '8pt', color: '#666', fontStyle: 'italic', marginBottom: '4pt' }}>"{archetype}"</div>}
                      {primaryGoal && <div style={{ marginBottom: '2pt', fontSize: '8pt' }}><strong>Goal:</strong> {primaryGoal}</div>}
                      {painPoint && <div style={{ fontSize: '8pt' }}><strong>Pain:</strong> {painPoint}</div>}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* User Stories */}
          {sortedStories.length > 0 && (
            <section>
              <h2 style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '8pt', borderBottom: '1px solid #000', paddingBottom: '3pt' }}>User Stories</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #000' }}>
                    {['ID', 'Story', 'Persona', 'Priority'].map(h => <th key={h} style={{ padding: '4pt 6pt', textAlign: 'left', fontWeight: 'bold', textTransform: 'uppercase', color: '#666' }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {sortedStories.map((story, idx) => {
                    const asA = getNestedContent(story, 'as_a') || getNestedContent(story, 'role') || ''
                    const iWant = getNestedContent(story, 'i_want') || getNestedContent(story, 'action') || ''
                    const soThat = getNestedContent(story, 'so_that') || getNestedContent(story, 'benefit') || 'must'
                    const priority = soThat.toLowerCase()
                    const personaData = getPersonaFromCapability(getNestedContent(story, 'capability'))
                    const personaName = personaData?.name || asA.split('—')[0].trim() || 'Unknown'
                    return (
                      <tr key={story.id || idx} style={{ borderBottom: '1px solid #ccc' }}>
                        <td style={{ padding: '4pt 6pt', color: '#666' }}>{story.id}</td>
                        <td style={{ padding: '4pt 6pt' }}>
                          <div style={{ fontWeight: 'bold' }}>{story.title}</div>
                          <div style={{ color: '#666' }}>{asA}</div>
                          <div style={{ color: '#666' }}>{iWant}</div>
                        </td>
                        <td style={{ padding: '4pt 6pt', color: '#666' }}>{personaName}</td>
                        <td style={{ padding: '4pt 6pt' }}><span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{priority}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </section>
          )}
        </div>
      </div>
      <OutputHeader
        title="Capabilities"
        description="Personas, capabilities, and user stories that translate the brief into the working surface area of the product."
        onRegenerate={onRegenerate}
        isRegenerating={isRegenerating}
        canExport={outputs.length > 0}
        onExport={handleExport}
        isExporting={isExporting}
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <MetricCard value={baseCapabilities.length} label="Shared Foundation" sub={`${baseHighImpactCount} high impact`} />
        <MetricCard value={capabilities.length} label="Capabilities" sub="all grouped" />
        <MetricCard value={personas.length} label="Personas" sub="all confirmed" />
        <MetricCard value={stories.length} label="User Stories" sub="initial backlog" />
        <MetricCard value={highImpactCount} label="High Impact" sub={`${highComplexityCount} high-complexity`} />
      </div>

      {/* Tabs */}
      <TabBar
        tabs={capabilityTabs}
        activeTab={activeTab}
        onTabChange={(name) => setActiveTab(name as typeof activeTab)}
        className="flex gap-2 overflow-x-auto border-b border-border-default mb-8"
      />

      {/* Tab Content */}
      <div className="bg-surface border border-border-default rounded-3xl p-8 shadow[0_1px_3px_rgba(15,15,15,0.05)]">
        {activeTab === 'Capabilities' && (
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-6">
              CAPABILITIES
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedCapabilities.map((cap, idx) => {
                const impact = (getNestedContent(cap, 'impact') || 'medium').toLowerCase()
                const complexity = (getNestedContent(cap, 'complexity') || 'medium').toLowerCase()

                return (
                  <EditableNodeCard
                    key={cap.id || idx}
                    node={cap}
                    projectId={projectId}
                    onSaved={onContentUpdated}
                    editableKeys={['title', 'description']}
                  >
                    <CapabilityCard
                      displayId={cap.id || ''}
                      title={cap.title}
                      description={getNestedContent(cap, 'description') || 'No description available.'}
                      highlight={impact === 'high'}
                      metrics={[
                        { label: 'Impact', value: impact, level: impact },
                        { label: 'Complexity', value: complexity, level: complexity },
                      ]}
                    />
                  </EditableNodeCard>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'Shared Foundation' && (
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-6">
              Shared Foundation
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {baseCapabilities.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-text-muted">
                  No base capabilities available.
                </div>
              ) : (
                baseCapabilities.map((cap, idx) => {
                  const impact = (getNestedContent(cap, 'impact') || 'medium').toLowerCase()
                  const complexity = (getNestedContent(cap, 'complexity') || 'medium').toLowerCase()
                  const confidence = getNestedContent(cap, 'confidence') || 'unknown'
                  const sessionIndex = getNestedContent(cap, 'session_index')

                  return (
                    <EditableNodeCard
                      key={cap.id || idx}
                      node={cap}
                      projectId={projectId}
                      onSaved={onContentUpdated}
                      editableKeys={['title', 'description']}
                    >
                      <CapabilityCard
                        displayId={cap.id || ''}
                        title={cap.title}
                        description={getNestedContent(cap, 'description') || 'No description available.'}
                        highlight={impact === 'high'}
                        metrics={[
                          { label: 'Impact', value: impact, level: impact },
                          { label: 'Complexity', value: complexity, level: complexity },
                          { label: 'Confidence', value: confidence },
                          ...(sessionIndex ? [{ label: 'Session', value: `#${sessionIndex}` }] : []),
                        ]}
                      />
                    </EditableNodeCard>
                  )
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'Personas' && (
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-6">
              PERSONAS
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {personas.map((persona, idx) => {
                const role = getNestedContent(persona, 'role')
                const initial = (persona.title || '?').charAt(0).toUpperCase()
                const storyCount = getStoryCount(persona)

                return (
                  <EditableNodeCard
                    key={persona.id || idx}
                    node={persona}
                    projectId={projectId}
                    onSaved={onContentUpdated}
                    editableKeys={['role', 'archetype', 'primary_goal', 'pain_point']}
                  >
                    <div className="bg-background border border-border-default rounded-xl p-6 shadow-sm">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-[20px]">
                          {initial}
                        </div>
                        <div>
                          <div className="text-[16px] font-bold text-text-primary leading-tight">{persona.title}</div>
                          <div className="text-[13px] text-text-secondary">{role}</div>
                        </div>
                      </div>
                      <div className="text-[13px] text-accent italic mb-6">
                        "{getNestedContent(persona, 'archetype') || 'key persona for the system'}"
                      </div>
                      <div className="flex items-center gap-2 mb-6">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                          {storyCount} stories
                        </span>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Primary Goal</div>
                          <div className="text-[13px] text-text-secondary leading-relaxed">
                            {getNestedContent(persona, 'primary_goal') || 'Not specified'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">Pain Point</div>
                          <div className="text-[13px] text-text-secondary leading-relaxed">
                            {getNestedContent(persona, 'pain_point') || 'Not specified'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </EditableNodeCard>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'User Stories' && (
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-6">
              USER STORIES
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-default">
                    <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">ID</th>
                    <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Story</th>
                    <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Persona</th>
                    <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-text-muted text-right">Priority</th>
                    <th className="py-3 px-4 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStories.map((story, idx) => {
                    // New format: as_a, i_want, so_that
                    const titel = story.title
                    const asA = getNestedContent(story, 'as_a') || getNestedContent(story, 'role') || ''
                    const iWant = getNestedContent(story, 'i_want') || getNestedContent(story, 'action') || ''
                    const soThat = getNestedContent(story, 'so_that') || getNestedContent(story, 'benefit') || 'must'
                    const priority = soThat.toLowerCase()

                    // Extract persona from capability field (e.g., "Ravi — IoT Field Technician")
                    const capability = getNestedContent(story, 'capability')
                    const personaData = getPersonaFromCapability(capability)
                    const personaName = personaData?.name || asA.split('—')[0].trim() || 'Unknown'
                    const personaInitial = personaName.charAt(0).toUpperCase()

                    if (editingStoryId && story.id === editingStoryId && projectId) {
                      return (
                        <tr key={story.id || idx} className="border-b border-border-default bg-surface-muted">
                          <td colSpan={5} className="p-4">
                            <NodeEditor
                              node={story}
                              projectId={projectId}
                              editableKeys={['title', 'as_a', 'i_want', 'capability']}
                              onCancel={() => setEditingStoryId(null)}
                              onSaved={() => {
                                setEditingStoryId(null)
                                onContentUpdated?.()
                              }}
                            />
                          </td>
                        </tr>
                      )
                    }
                    return (
                      <tr key={story.id || idx} className="border-b border-border-default hover:bg-surface-muted transition-colors group">
                        <td className="py-4 px-4 text-[13px] text-text-muted font-medium">{story.id}</td>
                        <td className="py-4 px-4">
                          <div className='text-[14px] font-medium text-text-primary mb-1'>{titel}</div>
                          <div className="text-[13px] text-text-secondary ">{asA}</div>
                          <div className="text-[12px] text-text-secondary">{iWant}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div
                            className="flex items-center gap-2 relative overflow-visible"
                            onMouseEnter={() => {
                              setHoveredPersona(personaName)
                              setHoveredStoryId(story.id || idx)
                            }}
                            onMouseLeave={() => {
                              setHoveredPersona(null)
                              setHoveredStoryId(null)
                            }}
                          >
                            <div className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                              {personaInitial}
                            </div>
                            <span className="text-[13px] text-text-secondary">{personaName}</span>

                            {/* Hover Tooltip */}
                            {hoveredPersona === personaName && hoveredStoryId === (story.id || idx) && (() => {
                              const personaNode = findPersonaData(personaName)
                              const role = getNestedContent(personaNode, 'role')
                              const archetype = getNestedContent(personaNode, 'archetype')

                              if (!role && !archetype) return null

                              return (
                                <div className="absolute left-0 top-full mt-2 z-50 bg-surface border border-border-default rounded-xl p-4 shadow-lg min-w-50 overflow-hidden">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Info className="w-4 h-4 text-accent shrink-0" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Persona Details</span>
                                  </div>
                                  {role && (
                                    <div className="mb-2">
                                      <div className="text-[9px] font-semibold uppercase tracking-widest text-text-muted mb-1">Role</div>
                                      <div className="text-[12px] text-text-primary font-medium">{role}</div>
                                    </div>
                                  )}
                                  {archetype && (
                                    <div>
                                      <div className="text-[9px] font-semibold uppercase tracking-widest text-text-muted mb-1">Architect Type</div>
                                      <div className="text-[12px] text-accent italic">{archetype}</div>
                                    </div>
                                  )}
                                </div>
                              )
                            })()}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded border ${priority === 'must' ? 'text-red-500 bg-red-500/10 border-red-500/20' :
                            priority === 'should' ? 'text-amber-500 bg-amber-500/10 border-amber-500/20' :
                              'text-green-500 bg-green-500/10 border-green-500/20'
                            }`}>
                            {priority}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          {projectId && story.id && (
                            <Button
                              variant="unstyled"
                              onClick={() => setEditingStoryId(story.id || null)}
                              title="Edit"
                              className="p-1 text-text-muted hover:text-accent rounded transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}