import { useState, useMemo, useRef } from 'react'
import type { FC } from 'react'
import {
  AlertTriangle,
  Target,
  CheckCircle2,
  Lightbulb,
  Globe,
  TrendingUp,
  Zap,
  Users,
} from 'lucide-react'
import { OutputHeader } from './OutputHeader'
import { TabBar } from './shared'
import { EditableNodeCard } from './EditableNodeCard'

// Node types from the new format
interface BriefNode {
  type: string
  id: string
  title: string
  content: {
    // Common fields
    name?: string
    description?: string
    // Trait fields
    category?: string
    evidence?: string
    // DesiredOutcome fields
    success_signals?: string[]
    outcome?: string
    business_value?: string
    // Domain fields
    relevance?: string
    // Assumption fields
    impact_if_wrong?: string
    validity_criteria?: string
    status?: string
    statement?: string
    // DecisionPoint fields
    selected_option?: string
    decision_rationale?: string
    condition?: string
    options?: string[]
    default_option?: string
    requires_human_input?: boolean
    // ProblemStatement fields
    root_causes?: string[]
    symptoms?: string[]
    current_workarounds?: string[]
    business_consequences?: string[]
    summary?: string
    // Priority/Impact for various types
    priority?: string
    impact?: string
    // Goal fields
    business_impact?: string
    success_metrics?: string[]
    non_goals?: string[]
    assumptions_constraints?: string[]
    // Stakeholder fields
    stakeholder_type?: string
    role?: string
    how_they_are_affected?: string
    needs?: string[]
  }
  confidence: string
  session_index: number
}

interface BriefOutputRendererProps {
  outputs: BriefNode[]
  onRegenerate?: () => void
  isRegenerating?: boolean
  projectId?: string
  onContentUpdated?: () => void
}

// Get color for confidence level
const getConfidenceColor = (confidence: string) => {
  switch (confidence.toLowerCase()) {
    case 'confirmed':
      return 'bg-green-500/10 text-green-500 border-green-500/20'
    case 'inferred':
      return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    case 'validated':
      return 'bg-accent/10 text-accent border-accent/20'
    default:
      return 'bg-surface-muted text-text-muted border-border-default'
  }
}

// Get color for impact level
const getImpactColor = (impact: string) => {
  switch (impact.toLowerCase()) {
    case 'high':
      return 'text-red-500 bg-red-500/10 border-red-500/20'
    case 'medium':
      return 'text-amber-500 bg-amber-500/10 border-amber-500/20'
    case 'low':
      return 'text-green-500 bg-green-500/10 border-green-500/20'
    default:
      return 'text-text-muted bg-surface-muted border-border-default'
  }
}

// Pure B&W minimal export renderer - single responsibility for PDF export
const renderMinimalExport = (
  groupedNodes: Record<string, BriefNode[]>,
) => {
  const s = { fontFamily: 'Georgia, serif', color: '#000', bg: '#fff', border: '#ccc', muted: '#666' }
  
  return (
    <div style={{ fontFamily: s.fontFamily, color: s.color, backgroundColor: s.bg, padding: '20mm', maxWidth: '170mm', margin: '0 auto', fontSize: '10pt', lineHeight: '1.5' }}>
      {/* Title */}
      <div style={{ marginBottom: '20pt', borderBottom: '2px solid #000', paddingBottom: '10pt' }}>
        <h1 style={{ fontSize: '18pt', fontWeight: 'bold', margin: '0 0 4pt 0' }}>Brief</h1>
        <p style={{ fontSize: '9pt', color: s.muted, margin: '0' }}>Project context, desired outcomes, assumptions, and key decisions.</p>
      </div>

      {/* Problem Section */}
      {groupedNodes.ProblemStatement.length > 0 && (
        <section style={{ marginBottom: '16pt' }}>
          <h2 style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '10pt', borderBottom: '1px solid #000', paddingBottom: '4pt' }}>Problem Statements</h2>
          {groupedNodes.ProblemStatement.map((p, idx) => (
            <div key={idx} style={{ marginBottom: '12pt' }}>
              <div style={{ fontSize: '8pt', color: s.muted, marginBottom: '2pt' }}>P-{idx + 1}</div>
              <p style={{ fontSize: '10pt', fontWeight: 'bold', margin: '0 0 6pt 0' }}>{p.title}</p>
              {p.content?.root_causes?.length ? (
                <div style={{ marginBottom: '6pt' }}>
                  <div style={{ fontSize: '8pt', fontWeight: 'bold', marginBottom: '2pt' }}>Root Causes</div>
                  <ul style={{ margin: '0', paddingLeft: '14pt', fontSize: '9pt', color: s.muted }}>
                    {p.content.root_causes.map((c, i) => <li key={i} style={{ marginBottom: '2pt' }}>{c}</li>)}
                  </ul>
                </div>
              ) : null}
              {p.content?.business_consequences?.length ? (
                <div>
                  <div style={{ fontSize: '8pt', fontWeight: 'bold', marginBottom: '2pt' }}>Business Consequences</div>
                  <ul style={{ margin: '0', paddingLeft: '14pt', fontSize: '9pt', color: s.muted }}>
                    {p.content.business_consequences.map((c, i) => <li key={i} style={{ marginBottom: '2pt' }}>{c}</li>)}
                  </ul>
                </div>
              ) : null}
            </div>
          ))}
        </section>
      )}

      {/* Desired Outcomes */}
      {groupedNodes.DesiredOutcome.length > 0 && (
        <section style={{ marginBottom: '16pt' }}>
          <h2 style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '10pt', borderBottom: '1px solid #000', paddingBottom: '4pt' }}>Desired Outcomes</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8pt' }}>
            {groupedNodes.DesiredOutcome.map((o, idx) => (
              <div key={idx} style={{ border: `1px solid ${s.border}`, padding: '8pt' }}>
                <div style={{ fontSize: '8pt', color: s.muted, marginBottom: '2pt' }}>OUTCOME-{idx + 1} ({o.confidence})</div>
                <p style={{ fontSize: '10pt', fontWeight: 'bold', margin: '0 0 4pt 0' }}>{o.title}</p>
                {o.content?.success_signals?.length ? (
                  <div>
                    <div style={{ fontSize: '8pt', fontWeight: 'bold', marginBottom: '2pt' }}>Success Signals</div>
                    <ul style={{ margin: '0', paddingLeft: '12pt', fontSize: '8pt', color: s.muted }}>
                      {o.content.success_signals.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Goals */}
      {groupedNodes.Goal.length > 0 && (
        <section style={{ marginBottom: '16pt' }}>
          <h2 style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '10pt', borderBottom: '1px solid #000', paddingBottom: '4pt' }}>Project Goals</h2>
          {groupedNodes.Goal.map((g, idx) => (
            <div key={idx} style={{ border: `1px solid ${s.border}`, padding: '8pt', marginBottom: '8pt' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4pt' }}>
                <span style={{ fontSize: '8pt', color: s.muted }}>GOAL-{idx + 1}</span>
                <span style={{ fontSize: '8pt', color: s.muted }}>{g.confidence} {g.content?.priority ? `| ${g.content.priority} priority` : ''}</span>
              </div>
              <p style={{ fontSize: '10pt', fontWeight: 'bold', margin: '0 0 4pt 0' }}>{g.title.replace(/_/g, ' ')}</p>
              {g.content?.success_metrics?.length ? (
                <ul style={{ margin: '0', paddingLeft: '12pt', fontSize: '8pt', color: s.muted }}>
                  {g.content.success_metrics.map((m, i) => <li key={i} style={{ marginBottom: '2pt' }}>{m}</li>)}
                </ul>
              ) : null}
            </div>
          ))}
        </section>
      )}

      {/* Assumptions */}
      {(groupedNodes.Assumption.length > 0 || groupedNodes.Trait.length > 0 || groupedNodes.Domain.length > 0) && (
        <section style={{ marginBottom: '16pt' }}>
          <h2 style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '10pt', borderBottom: '1px solid #000', paddingBottom: '4pt' }}>Assumptions, Traits &amp; Domains</h2>
          
          {groupedNodes.Assumption.length > 0 && (
            <div style={{ marginBottom: '10pt' }}>
              <div style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: '6pt' }}>Assumptions</div>
              {groupedNodes.Assumption.map((a, idx) => (
                <div key={idx} style={{ marginBottom: '6pt', fontSize: '9pt' }}>
                  <span style={{ fontWeight: 'bold' }}>{a.title}</span>
                  <span style={{ color: s.muted, marginLeft: '8pt' }}>({a.confidence})</span>
                  {a.content?.statement && <p style={{ margin: '2pt 0 0 0', color: s.muted }}>{a.content.statement}</p>}
                </div>
              ))}
            </div>
          )}

          {groupedNodes.Trait.length > 0 && (
            <div style={{ marginBottom: '10pt' }}>
              <div style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: '4pt' }}>Traits</div>
              <div style={{ fontSize: '9pt', color: s.muted }}>{groupedNodes.Trait.map(t => t.content?.name || t.title).join(', ')}</div>
            </div>
          )}

          {groupedNodes.Domain.length > 0 && (
            <div>
              <div style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: '4pt' }}>Domains</div>
              <div style={{ fontSize: '9pt', color: s.muted }}>{groupedNodes.Domain.map(d => d.content?.name || d.title).join(', ')}</div>
            </div>
          )}
        </section>
      )}

      {/* Decisions */}
      {groupedNodes.DecisionPoint.length > 0 && (
        <section>
          <h2 style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '10pt', borderBottom: '1px solid #000', paddingBottom: '4pt' }}>Decision Points</h2>
          {groupedNodes.DecisionPoint.map((d, idx) => (
            <div key={idx} style={{ marginBottom: '10pt', fontSize: '9pt' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2pt' }}>
                <span style={{ fontWeight: 'bold' }}>{d.title}</span>
                <span style={{ color: s.muted }}>DECISION-{idx + 1} ({d.confidence})</span>
              </div>
              {d.content?.selected_option && (
                <p style={{ margin: '4pt 0', fontStyle: 'italic' }}>Selected: {d.content.selected_option}</p>
              )}
              {d.content?.decision_rationale && (
                <p style={{ margin: '2pt 0', color: s.muted }}>Rationale: {d.content.decision_rationale}</p>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  )
}



export const BriefOutputRenderer: FC<BriefOutputRendererProps> = ({
  outputs,
  onRegenerate,
  isRegenerating,
  projectId,
  onContentUpdated,
}) => {
  const exportRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<
    | 'Overview'
    | 'Stakeholders'
    | 'Problem'
    | 'Outcomes'
    | 'Goals'
    | 'Assumptions'
    | 'Decisions'
  >('Overview')
  const [isExporting, setIsExporting] = useState(false)

  // Group nodes by type
  const groupedNodes = useMemo(() => {
    const groups: Record<string, BriefNode[]> = {
      ProblemStatement: [],
      DesiredOutcome: [],
      Goal: [],
      Trait: [],
      Assumption: [],
      DecisionPoint: [],
      Domain: [],
      Stakeholder: [],
    }

    outputs.forEach((node) => {
      if (groups[node.type]) {
        groups[node.type].push(node)
      }
    })

    return groups
  }, [outputs])

  const tabs = [
    { name: 'Overview' as const, count: undefined },
    {
      name: 'Stakeholders' as const,
      count: groupedNodes.Stakeholder.length,
    },
    {
      name: 'Problem' as const,
      count: groupedNodes.ProblemStatement.length,
    },
    {
      name: 'Outcomes' as const,
      count: groupedNodes.DesiredOutcome.length,
    },
    {
      name: 'Goals' as const,
      count: groupedNodes.Goal.length,
    },
    {
      name: 'Assumptions' as const,
      count: groupedNodes.Assumption.length,
    },
    {
      name: 'Decisions' as const,
      count: groupedNodes.DecisionPoint.length,
    },
  ]

  // Filter tabs with no data
  const visibleTabs = tabs.filter(
    (tab) => tab.count === undefined || tab.count > 0,
  )

  // Handle export - export from hidden container with all content
  const handleExport = async () => {
    if (!exportRef.current) return

    setIsExporting(true)

    try {
      const { exportToPDF } = await import('../../../utils/pdfExporter')
      await exportToPDF(exportRef.current, { filename: 'brief', format: 'a4' })
    } catch (err) {
      console.error('PDF Export Error:', err)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-5xl">
      {/* Hidden export container - contains all tabs rendered below each other */}
      <div
        ref={exportRef}
        style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '800px' }}
      >
        <div className="p-8 bg-white">
          <div className="mb-8">
            <h1 className="text-[28px] font-bold text-gray-900 tracking-tight leading-[1.3]">
              Brief
            </h1>
            <p className="text-[15px] text-gray-500 leading-[1.6] mt-3">
              Project context, desired outcomes, assumptions, and key decisions guiding the solution.
            </p>
          </div>

          {/* Render all content for export - no tabs */}
          {renderMinimalExport(groupedNodes)}
        </div>
      </div>

      <OutputHeader
        title="Brief"
        description="Project context, desired outcomes, assumptions, and key decisions guiding the solution."
        onRegenerate={onRegenerate}
        isRegenerating={isRegenerating}
        canExport={outputs.length > 0}
        onExport={handleExport}
        isExporting={isExporting}
      />

      {/* Tabs */}
      <TabBar
        tabs={visibleTabs}
        activeTab={activeTab}
        onTabChange={(name) => setActiveTab(name as typeof activeTab)}
      />

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'Overview' && (
          <>
            {/* Problem Statement Section */}
            {groupedNodes.ProblemStatement.length > 0 && (
              <section className="bg-surface border border-border-default rounded-3xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                      <Lightbulb className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
                        PROBLEM STATEMENT
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getConfidenceColor(
                          groupedNodes.ProblemStatement[0]?.confidence,
                        )}`}
                      >
                        {groupedNodes.ProblemStatement[0]?.confidence}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-[16px] text-text-primary leading-relaxed font-medium mb-6">
                  {groupedNodes.ProblemStatement[0]?.title}
                </p>

                {/* Root Causes */}
                {(groupedNodes.ProblemStatement[0]?.content
                  ?.root_causes?.length ?? 0) > 0 && (
                  <div className="space-y-4 pt-4 border-t border-border-default">
                    <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
                      Root Causes
                    </div>
                    <div className="space-y-3">
                      {groupedNodes.ProblemStatement[0].content.root_causes?.map(
                        (cause, idx) => (
                          <div
                            key={idx}
                            className="flex gap-4 p-4 bg-surface-muted rounded-xl border border-border-default items-center"
                          >
                            <span className="text-[14px] font-black text-red-500 w-4">
                              {idx + 1}
                            </span>
                            <span className="text-[14px] font-medium text-text-secondary leading-relaxed">
                              {cause}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Desired Outcomes Section */}
            {groupedNodes.DesiredOutcome.length > 0 && (
              <section className="bg-surface border border-border-default rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-accent" />
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
                    DESIRED OUTCOMES
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedNodes.DesiredOutcome.map((outcome, idx) => (
                    <div
                      key={idx}
                      className="bg-accent/5 border border-accent/10 rounded-xl p-5"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-[11px] text-accent font-bold font-mono uppercase">
                          OUTCOME-{idx + 1}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getConfidenceColor(
                            outcome.confidence,
                          )}`}
                        >
                          {outcome.confidence}
                        </span>
                      </div>
                      <h3 className="text-[15px] font-bold text-text-primary mb-3 leading-tight">
                        {outcome.title}
                      </h3>

                      {/* Success Signals */}
                      {(outcome.content?.success_signals?.length ?? 0) > 0 && (
                        <div className="space-y-2 mt-4 pt-4 border-t border-accent/10">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">
                            Success Signals
                          </div>
                          {outcome.content?.success_signals?.map(
                            (signal, sIdx) => (
                              <div key={sIdx} className="flex gap-2 items-start">
                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                <span className="text-[12px] text-text-secondary leading-relaxed">
                                  {signal}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Goals Summary Section */}
            {groupedNodes.Goal.length > 0 && (
              <section className="bg-surface border border-border-default rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
                    PROJECT GOALS
                  </div>
                </div>

                <div className="space-y-4">
                  {groupedNodes.Goal.map((goal, idx) => (
                    <div
                      key={idx}
                      className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-[11px] text-purple-500 font-bold font-mono uppercase">
                          GOAL-{idx + 1}
                        </span>
                        <div className="flex gap-2">
                          {goal.content?.priority && (
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getImpactColor(
                                goal.content.priority,
                              )}`}
                            >
                              {goal.content.priority}
                            </span>
                          )}
                        </div>
                      </div>
                      <h4 className="text-[14px] font-semibold text-text-primary leading-relaxed mb-2">
                        {goal.title.replace(/_/g, ' ')}
                      </h4>
                      {(goal.content?.success_metrics?.length ?? 0) > 0 && (
                        <div className="flex flex-col gap-1">
                          {goal.content?.success_metrics?.map((metric, mIdx) => (
                            <div key={mIdx} className="flex gap-2 items-start">
                              <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                              <span className="text-[12px] text-text-secondary leading-relaxed">
                                {metric}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="bg-surface border border-border-default rounded-3xl p-8">
              <div className="flex flex-row gap-8">
                {/* Traits */}
                {groupedNodes.Trait.length > 0 && (
                  <div className="flex-1 space-y-4">
                    <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
                      Project Traits
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {groupedNodes.Trait.map((trait, idx) => (
                        <div
                          key={idx}
                          className="px-4 py-2 bg-accent/10 text-accent text-[13px] font-bold rounded-full border border-accent/20 flex items-center gap-2"
                        >
                          <Zap className="w-4 h-4" />
                          {trait.content?.name || trait.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Domains */}
                {groupedNodes.Domain.length > 0 && (
                  <div className="flex-1 space-y-4">
                    <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
                      Domains
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {groupedNodes.Domain.map((domain, idx) => (
                        <div
                          key={idx}
                          className="px-4 py-2 bg-amber-500/10 text-amber-500 text-[13px] font-bold rounded-full border border-amber-500/20 flex items-center gap-2"
                        >
                          <Globe className="w-4 h-4" />
                          {domain.content?.name || domain.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Stakeholders Section in Overview */}
            {groupedNodes.Stakeholder.length > 0 && (
              <section className="bg-surface border border-border-default rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
                    STAKEHOLDERS
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedNodes.Stakeholder.map((stakeholder, idx) => (
                    <div
                      key={idx}
                      className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-[10px] text-blue-500 font-bold font-mono uppercase">
                          SH-{idx + 1}
                        </span>
                        {stakeholder.content?.stakeholder_type && (
                          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            {stakeholder.content.stakeholder_type}
                          </span>
                        )}
                      </div>
                      <h4 className="text-[14px] font-bold text-text-primary mb-2 leading-tight">
                        {stakeholder.title}
                      </h4>
                      {stakeholder.content?.role && (
                        <p className="text-[12px] text-text-muted">
                          <span className="font-semibold">Role:</span> {stakeholder.content.role}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Stakeholders Tab */}
        {activeTab === 'Stakeholders' && (
          <section className="bg-surface border border-border-default rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
                STAKEHOLDERS
              </div>
            </div>

            <div className="space-y-6">
              {groupedNodes.Stakeholder.length > 0 ? (
                groupedNodes.Stakeholder.map((stakeholder, idx) => (
                  <EditableNodeCard
                    key={stakeholder.id || idx}
                    node={stakeholder}
                    projectId={projectId}
                    onSaved={onContentUpdated}
                    editableKeys={['title']}
                  >
                  <div
                    className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-6 space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-[11px] text-blue-500 font-bold font-mono uppercase">
                        STAKEHOLDER-{idx + 1}
                      </span>
                      <div className="flex gap-2">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getConfidenceColor(
                            stakeholder.confidence,
                          )}`}
                        >
                          {stakeholder.confidence}
                        </span>
                        {stakeholder.content?.stakeholder_type && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-blue-100 text-blue-700 border-blue-200">
                            {stakeholder.content.stakeholder_type}
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-[16px] font-bold text-text-primary leading-relaxed">
                      {stakeholder.title}
                    </h3>

                    {stakeholder.content?.role && (
                      <div className="flex gap-2 items-start">
                        <Target className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">
                            Role
                          </div>
                          <span className="text-[13px] text-text-secondary leading-relaxed">
                            {stakeholder.content.role}
                          </span>
                        </div>
                      </div>
                    )}

                    {stakeholder.content?.how_they_are_affected && (
                      <div className="flex gap-2 items-start">
                        <TrendingUp className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">
                            How They Are Affected
                          </div>
                          <span className="text-[13px] text-text-secondary leading-relaxed">
                            {stakeholder.content.how_they_are_affected}
                          </span>
                        </div>
                      </div>
                    )}

                    {(stakeholder.content?.needs?.length ?? 0) > 0 && (
                      <div className="space-y-2 pt-4 border-t border-blue-500/10">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">
                          Needs
                        </div>
                        {stakeholder.content?.needs?.map((need, nIdx) => (
                          <div key={nIdx} className="flex gap-2 items-start">
                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                            <span className="text-[13px] text-text-secondary leading-relaxed">
                              {need}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  </EditableNodeCard>
                ))
              ) : (
                <div className="text-center py-12 text-text-muted">
                  No stakeholders available.
                </div>
              )}
            </div>
          </section>
        )}

        {/* Problem Tab */}
        {activeTab === 'Problem' && (
          <section className="bg-surface border border-border-default rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-red-500" />
                </div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
                  PROBLEM STATEMENTS
                </div>
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getConfidenceColor(
                  groupedNodes.ProblemStatement[0]?.confidence,
                )}`}
              >
                {groupedNodes.ProblemStatement[0]?.confidence || 'N/A'}
              </span>
            </div>

            <div className="space-y-8">
              {groupedNodes.ProblemStatement.map((problem, idx) => (
                <EditableNodeCard
                  key={problem.id || idx}
                  node={problem}
                  projectId={projectId}
                  onSaved={onContentUpdated}
                  editableKeys={['title', 'root_causes', 'business_consequences']}
                >
                <div className="space-y-6">
                  {/* Problem Title */}
                  <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-6">
                    <h3 className="text-[16px] font-bold text-text-primary leading-relaxed">
                      {problem.title}
                    </h3>
                  </div>

                  {/* Root Causes */}
                  {(problem.content?.root_causes?.length ?? 0) > 0 && (
                    <div className="space-y-4">
                      <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
                        Root Causes
                      </div>
                      <div className="space-y-3">
                        {problem.content?.root_causes?.map((cause, cIdx) => (
                          <div
                            key={cIdx}
                            className="flex gap-4 p-4 bg-surface-muted rounded-xl border border-border-default items-start"
                          >
                            <span className="text-[14px] font-black text-red-500 w-4 shrink-0">
                              {cIdx + 1}
                            </span>
                            <span className="text-[14px] font-medium text-text-secondary leading-relaxed">
                              {cause}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Business Consequences */}
                  {(problem.content?.business_consequences?.length ?? 0) > 0 && (
                    <div className="space-y-4">
                      <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
                        Business Consequences
                      </div>
                      <div className="space-y-3">
                        {problem.content?.business_consequences?.map(
                          (consequence, cIdx) => (
                            <div
                              key={cIdx}
                              className="flex gap-4 p-4 bg-accent/5 rounded-xl border border-accent/10 items-start"
                            >
                              <TrendingUp className="w-4 h-4 text-accent shrink-0 mt-1" />
                              <span className="text-[14px] font-medium text-text-secondary leading-relaxed">
                                {consequence}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
                </EditableNodeCard>
              ))}

              {groupedNodes.ProblemStatement.length === 0 && (
                <div className="text-center py-12 text-text-muted">
                  No problem statements available.
                </div>
              )}
            </div>
          </section>
        )}

        {/* Outcomes Tab */}
        {activeTab === 'Outcomes' && (
          <section className="bg-surface border border-border-default rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-accent" />
              </div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
                DESIRED OUTCOMES
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groupedNodes.DesiredOutcome.map((outcome, idx) => (
                <EditableNodeCard
                  key={outcome.id || idx}
                  node={outcome}
                  projectId={projectId}
                  onSaved={onContentUpdated}
                  editableKeys={['title', 'success_signals']}
                >
                <div
                  className="bg-accent/5 border border-accent/10 rounded-xl p-6 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[11px] text-accent font-bold font-mono uppercase">
                      OUTCOME-{idx + 1}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getConfidenceColor(
                        outcome.confidence,
                      )}`}
                    >
                      {outcome.confidence}
                    </span>
                  </div>

                  <h3 className="text-[16px] font-bold text-text-primary leading-relaxed">
                    {outcome.title}
                  </h3>

                  {/* Success Signals */}
                  {(outcome.content?.success_signals?.length?? 0) > 0 && (
                    <div className="space-y-2 pt-4 border-t border-accent/10">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">
                        Success Signals
                      </div>
                      {outcome.content?.success_signals?.map(
                        (signal, sIdx) => (
                          <div key={sIdx} className="flex gap-2 items-start">
                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                            <span className="text-[13px] text-text-secondary leading-relaxed">
                              {signal}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>
                </EditableNodeCard>
              ))}

              {groupedNodes.DesiredOutcome.length === 0 && (
                <div className="col-span-2 text-center py-12 text-text-muted">
                  No desired outcomes available.
                </div>
              )}
            </div>
          </section>
        )}

        {/* Goals Tab */}
        {activeTab === 'Goals' && (
          <section className="bg-surface border border-border-default rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
                PROJECT GOALS
              </div>
            </div>

            <div className="space-y-6">
              {groupedNodes.Goal.map((goal, idx) => (
                <EditableNodeCard
                  key={goal.id || idx}
                  node={goal}
                  projectId={projectId}
                  onSaved={onContentUpdated}
                  editableKeys={[
                    'success_metrics',
                    ...((goal.content?.non_goals?.length ?? 0) > 0 ? ['non_goals'] : []),
                  ]}
                >
                <div
                  className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-6 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[11px] text-purple-500 font-bold font-mono uppercase">
                      GOAL-{idx + 1}
                    </span>
                    <div className="flex gap-2 items-center">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getConfidenceColor(
                          goal.confidence,
                        )}`}
                      >
                        {goal.confidence}
                      </span>
                      {goal.content?.priority && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getImpactColor(
                            goal.content.priority,
                          )}`}
                        >
                          {goal.content.priority} priority
                        </span>
                      )}
                      {goal.content?.business_impact && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getImpactColor(
                            goal.content.business_impact,
                          )}`}
                        >
                          {goal.content.business_impact} impact
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-[16px] font-bold text-text-primary leading-relaxed">
                    {goal.title.replace(/_/g, ' ')}
                  </h3>

                  {/* Success Metrics */}
                  {(goal.content?.success_metrics?.length ?? 0) > 0 && (
                    <div className="space-y-2 pt-4 border-t border-purple-500/10">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">
                        Success Metrics
                      </div>
                      {goal.content?.success_metrics?.map((metric, mIdx) => (
                        <div key={mIdx} className="flex gap-3 p-3 bg-surface-muted rounded-lg items-start">
                          <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                          <span className="text-[13px] text-text-secondary leading-relaxed">
                            {metric}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Non-Goals */}
                  {(goal.content?.non_goals?.length ?? 0) > 0 && (
                    <div className="space-y-2 pt-4 border-t border-purple-500/10">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">
                        Out of Scope
                      </div>
                      {goal.content?.non_goals?.map((nonGoal, ngIdx) => (
                        <div key={ngIdx} className="flex gap-3 p-3 bg-red-500/5 rounded-lg border border-red-500/10 items-start">
                          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <span className="text-[13px] text-text-secondary leading-relaxed">
                            {nonGoal}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                </EditableNodeCard>
              ))}

              {groupedNodes.Goal.length === 0 && (
                <div className="text-center py-12 text-text-muted">
                  No goals available.
                </div>
              )}
            </div>
          </section>
        )}

        {/* Assumptions Tab */}
        {activeTab === 'Assumptions' && (
          <section className="bg-surface border border-border-default rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
                ASSUMPTIONS &amp; TRAITS
              </div>
            </div>

            {/* Assumptions */}
            {groupedNodes.Assumption.length > 0 && (
              <div className="space-y-6 mb-8">
                <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
                  Assumptions
                </div>
                <div className="space-y-4">
                  {groupedNodes.Assumption.map((assumption, idx) => (
                    <EditableNodeCard
                      key={assumption.id || idx}
                      node={assumption}
                      projectId={projectId}
                      onSaved={onContentUpdated}
                      editableKeys={['title']}
                    >
                    <div
                      className="bg-surface-muted border border-border-default rounded-xl p-5 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-[11px] text-amber-500 font-bold font-mono uppercase">
                          ASSUMPTION-{idx + 1}
                        </span>
                        <div className="flex gap-2">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getConfidenceColor(
                              assumption.confidence,
                            )}`}
                          >
                            {assumption.confidence}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getImpactColor(
                              assumption.content?.impact_if_wrong ?? '',
                            )}`}
                          >
                            {assumption.content?.impact_if_wrong} impact
                          </span>
                        </div>
                      </div>
                      <h3 className="text-[15px] font-semibold text-text-primary leading-relaxed">
                        {assumption.title}
                      </h3>
                      {assumption.content?.statement && (
                        <p className="text-[13px] text-text-secondary leading-relaxed">
                          {assumption.content.statement}
                        </p>
                      )}
                    </div>
                    </EditableNodeCard>
                  ))}
                </div>
              </div>
            )}

            {groupedNodes.Assumption.length === 0 &&
              groupedNodes.Trait.length === 0 &&
              groupedNodes.Domain.length === 0 && (
                <div className="text-center py-12 text-text-muted">
                  No assumptions, traits, or domains available.
                </div>
              )}
          </section>
        )}

        {/* Decisions Tab */}
        {activeTab === 'Decisions' && (
          <section className="bg-surface border border-border-default rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
                DECISION POINTS
              </div>
            </div>

            <div className="space-y-6">
              {groupedNodes.DecisionPoint.map((decision, idx) => (
                <EditableNodeCard
                  key={decision.id || idx}
                  node={decision}
                  projectId={projectId}
                  onSaved={onContentUpdated}
                  editableKeys={['title', 'selected_option', 'decision_rationale', 'requires_human_input']}
                >
                <div
                  className="bg-green-500/5 border border-green-500/10 rounded-xl p-6 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[11px] text-green-500 font-bold font-mono uppercase">
                      DECISION-{idx + 1}
                    </span>
                    <div className="flex gap-2">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getConfidenceColor(
                          decision.confidence,
                        )}`}
                      >
                        {decision.confidence}
                      </span>
                      {decision.content?.requires_human_input && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-500 border-amber-500/20">
                          Requires Input
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-[15px] font-bold text-text-primary leading-relaxed">
                    {decision.title}
                  </h3>

                  {/* Selected Option */}
                  {decision.content?.selected_option && (
                    <div className="flex gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl items-start">
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-green-500 mb-1">
                          Selected Option
                        </div>
                        <span className="text-[14px] font-medium text-text-primary leading-relaxed">
                          {decision.content.selected_option}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Decision Rationale */}
                  {decision.content?.decision_rationale && (
                    <div className="flex gap-3 p-4 bg-surface-muted rounded-xl items-start">
                      <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">
                          Rationale
                        </div>
                        <span className="text-[13px] text-text-secondary leading-relaxed">
                          {decision.content.decision_rationale}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                </EditableNodeCard>
              ))}

              {groupedNodes.DecisionPoint.length === 0 && (
                <div className="text-center py-12 text-text-muted">
                  No decision points available.
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
