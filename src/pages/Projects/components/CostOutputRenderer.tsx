import React, { useState, useRef } from 'react'
import type { OutputNode } from '../../../services/project.service'
import { 
  TrendingUp,
  Layers, Clock, Target, ChevronDown,
  ChevronUp, Calendar, ArrowUpDown, AlertTriangle, GitBranch, Package
} from 'lucide-react'
import { OutputHeader } from './OutputHeader'
import { TabBar, MetricCard } from './shared'
import { Button } from '../../../components/ui/Button'
import { EditableNodeCard } from './EditableNodeCard'

// Extract nested content from various formats

// Parse string like "key: value; key2: value2" or "key=value key2=value2" to extract value for a key
const parseStringField = (str: string | undefined, key: string): string | undefined => {
  if (!str) return undefined
  // Support both "key: value" and "key=value" formats, with optional surrounding quotes
  const regex = new RegExp(`${key}\\s*[=:]\\s*"?([^;,"\]\\[\n]+?)"?(?:\s|;|,|$)`, 'i')
  const match = str.match(regex)
  return match ? match[1].trim() : undefined
}

// Parse number from string like "15000.0"
const parseNumberField = (str: string | undefined, key: string): number => {
  const value = parseStringField(str, key)
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseFloat(value) || 0
  return 0
}

// Extract cost/total/budget from various possible field names
// Checks in order: total_budget, cost, total, total_amount, amount, then parses from description
const extractCostValue = (content: Record<string, any>, description?: string): number => {
  // Check direct object properties first (prioritized order)
  const costFields = ['total_budget', 'cost', 'total', 'total_amount', 'amount']
  
  for (const field of costFields) {
    if (content[field] != null) {
      const value = content[field]
      if (typeof value === 'number') return value
      if (typeof value === 'string') return parseFloat(value) || 0
    }
  }
  
  // Fallback: parse from description string
  if (description) {
    for (const field of costFields) {
      const parsed = parseNumberField(description, field)
      if (parsed > 0) return parsed
    }
  }
  
  return 0
}

// Parse boolean-like field from string
const parseBoolField = (str: string | undefined, key: string): boolean => {
  const value = parseStringField(str, key)
  if (typeof value === 'string') return value.toLowerCase() === 'yes' || value === 'true'
  return false
}

// Format currency (USD)
const formatCurrency = (val: number) => {
  if (val === 0) return '$0'
  if (val >= 1000000000) return `$${(val / 1000000000).toFixed(2)}B`
  if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`
  return `$${val.toLocaleString('en-US')}`
}

// _CATEGORY_COLORS kept for future use when categories are needed
const _CATEGORY_COLORS = [
  { bg: 'bg-[#2563EB]', border: 'border-[#2563EB]', text: 'text-[#2563EB]' },
  { bg: 'bg-[#D97706]', border: 'border-[#D97706]', text: 'text-[#D97706]' },
  { bg: 'bg-[#7C3AED]', border: 'border-[#7C3AED]', text: 'text-[#7C3AED]' },
  { bg: 'bg-[#0D9488]', border: 'border-[#0D9488]', text: 'text-[#0D9488]' },
  { bg: 'bg-[#DC2626]', border: 'border-[#DC2626]', text: 'text-[#DC2626]' },
]
void _CATEGORY_COLORS // Suppress unused warning

// Rating badge component
const RatingBadge: React.FC<{ rating: string }> = ({ rating }) => {
  const config: Record<string, { bg: string; text: string }> = {
    high: { bg: 'bg-green-50', text: 'text-green-700' },
    medium: { bg: 'bg-amber-50', text: 'text-amber-700' },
    low: { bg: 'bg-red-50', text: 'text-red-700' },
  }
  const { bg, text } = config[rating.toLowerCase()] || config.medium
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${bg} ${text}`}>
      {rating}
    </span>
  )
}

// Confidence badge
const ConfidenceBadge: React.FC<{ confidence: string }> = ({ confidence }) => {
  const config: Record<string, { bg: string; text: string }> = {
    high: { bg: 'bg-green-50', text: 'text-green-700' },
    medium: { bg: 'bg-amber-50', text: 'text-amber-700' },
    low: { bg: 'bg-red-50', text: 'text-red-700' },
    inferred: { bg: 'bg-blue-50', text: 'text-blue-700' },
  }
  const { bg, text } = config[confidence.toLowerCase()] || config.medium
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${bg} ${text}`}>
      {confidence}
    </span>
  )
}

// Probability badge for risks
const ProbabilityBadge: React.FC<{ probability: string }> = ({ probability }) => {
  const config: Record<string, { bg: string; text: string }> = {
    low: { bg: 'bg-green-50', text: 'text-green-700' },
    medium: { bg: 'bg-amber-50', text: 'text-amber-700' },
    high: { bg: 'bg-red-50', text: 'text-red-700' },
  }
  const { bg, text } = config[probability.toLowerCase()] || config.medium
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${bg} ${text}`}>
      {probability}
    </span>
  )
}



// Milestone card with wave info
const MilestoneCard: React.FC<{
  milestone: OutputNode
  deliverables: OutputNode[]
  capabilities: OutputNode[]
  isExpanded: boolean
  onToggle: () => void
}> = ({ milestone, deliverables: _deliverables, capabilities = [], isExpanded, onToggle }) => {
  const content = (milestone.content as any)?.content || milestone.content || {}
  const description = content.description || ''
  const wave = content.phase ?? content.wave ?? (parseNumberField(content.wave?.toString(), 'wave') || parseStringField(content.wave?.toString(), 'wave') || '')
  const targetDateRange = parseStringField(content.target_date_range?.toString(), 'target_date_range') || ''
  const exitCriteria = content.exit_criteria || ''
  const relatedCapabilityIds: string[] = Array.isArray(content.capabilities)
    ? content.capabilities
    : typeof content.capabilities === 'string'
      ? content.capabilities.split(',').map((s: string) => s.trim()).filter(Boolean)
      : []
  const mid = milestone.id

  // Resolve each referenced capability id to its node (for the title), falling back to the raw id
  const relatedCapabilities = relatedCapabilityIds.map((capId) => {
    const match = capabilities.find(cap =>
      cap.id === capId || cap.id?.includes(capId) || capId.includes(cap.id || '')
    )
    if (match) {
      const matchContent = typeof match.content === 'string' ? JSON.parse(match.content) : (match.content as any)
      return { id: capId, label: match.title || matchContent?.title || capId }
    }
    return { id: capId, label: capId }
  })
  


  return (
    <div 
      className="bg-background border border-border-default rounded-xl shadow-sm overflow-hidden transition-all hover:border-border-strong cursor-pointer"
      onClick={onToggle}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="bg-[#5E43FB]/10 text-[#5E43FB] text-[12px] font-bold px-3 py-1 rounded-full">
              Phase {wave}
            </div>
            <span className="text-[10px] font-mono text-text-muted bg-surface-muted px-2 py-0.5 rounded">
              {mid}
            </span>
            {targetDateRange && (
              <span className="text-[11px] text-text-muted flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {targetDateRange}
              </span>
            )}
          </div>
          <Button variant="unstyled" className="p-1 hover:bg-surface-muted rounded-lg transition-colors">
            {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
          </Button>
        </div>
        <h3 className="text-[15px] font-bold text-text-primary leading-tight mb-2">{milestone.title}</h3>
        <p className="text-[13px] text-text-secondary leading-relaxed">{description}</p>
      </div>
      
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-border-default">
          {relatedCapabilities.length > 0 && (
            <div className="mt-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#5E43FB] mb-2">Capabilities</div>
              <div className="flex flex-wrap gap-2">
                {relatedCapabilities.map((cap, idx) => (
                  <span key={cap.id || idx} className="inline-flex items-center gap-1.5 bg-surface-muted px-3 py-1.5 rounded-full text-[12px] text-text-primary">
                    <span className="font-mono text-[10px] text-text-muted">{cap.id}</span>
                    {cap.label !== cap.id && cap.label}
                  </span>
                ))}
              </div>
            </div>
          )}
          {exitCriteria && (
            <div className="mt-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#5E43FB] mb-1">Exit Criteria</div>
              <div className="text-[13px] text-text-secondary leading-relaxed">{exitCriteria}</div>
            </div>
          )}
          {/* {relatedDeliverables.length > 0 && (
            <div className="mt-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Deliverables ({relatedDeliverables.length})</div>
              <div className="space-y-2">
                {relatedDeliverables.map((d, idx) => {
                  return (
                    <div key={d.id || idx} className="bg-surface-muted rounded-lg p-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-text-muted flex-shrink-0" />
                      <span className="text-[13px] text-text-secondary">{d.title}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )} */}
        </div>
      )}
    </div>
  )
}

// Sort dropdown component
const SortSelect: React.FC<{
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}> = ({ value, onChange, options }) => (
  <div className="flex items-center gap-2">
    <ArrowUpDown className="w-3 h-3 text-text-muted" />
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-[11px] bg-background border border-border-default rounded-lg px-3 py-1.5 text-text-primary cursor-pointer hover:border-border-strong transition-colors"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
)

export const CostOutputRenderer: React.FC<{ outputs: OutputNode[]; loading?: boolean; onRegenerate?: () => void; isRegenerating?: boolean; projectId?: string; onContentUpdated?: () => void }> = ({ outputs, onRegenerate, isRegenerating, projectId, onContentUpdated }) => {
  const contentRef = useRef<HTMLDivElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [complexitySort, setComplexitySort] = useState<string>('rating-high')
  const [investmentSort, setInvestmentSort] = useState<string>('amount-high')
  const [milestoneSort, setMilestoneSort] = useState<string>('wave-asc')
  const [effortSort, setEffortSort] = useState<string>('budget-high')
  const [deliverableSort, setDeliverableSort] = useState<string>('title-asc')
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (!exportRef.current) return
    setIsExporting(true)
    try {
      const { exportToPDF } = await import('../../../utils/pdfExporter')
      await exportToPDF(exportRef.current, { filename: 'cost-estimation', format: 'a4' })
    } catch (err) {
      console.error('PDF Export Error:', err)
    } finally {
      setIsExporting(false)
    }
  }
  
  // Filter by type
  const investmentItems = outputs.filter((o) => o.type === 'InvestmentItem')
  const effortEstimates = outputs.filter((o) => o.type === 'EffortEstimate')
  // Risk items - support both 'RiskItem' and 'Risk' types
  const riskItems = outputs.filter((o) => o.type === 'RiskItem' || o.type === 'Risk')
  const milestones = outputs.filter((o) => o.type === 'Milestone')
  const deliverables = outputs.filter((o) => o.type === 'Deliverable')
  const complexityRatings = outputs.filter((o) => o.type === 'ComplexityRating')
  
  const dependencies = outputs.filter((o) => o.type === 'Dependency')
  const capabilities = outputs.filter((o) => o.type === 'Capability' || o.type === 'BaseCapability')

  // Calculate totals using the new extractCostValue helper
  // Total Time = Sum of effort estimates time (min and max months)
  const totalMinMonths = effortEstimates.reduce((sum, eff) => {
    const content = (eff.content as any)?.content || eff.content || {}
    const minMonths = parseFloat(content.min_months) || 0
    return sum + minMonths
  }, 0)
  
  const totalMaxMonths = effortEstimates.reduce((sum, eff) => {
    const content = (eff.content as any)?.content || eff.content || {}
    const maxMonths = parseFloat(content.max_months) || 0
    return sum + maxMonths
  }, 0)
  
  // Total hours (min and max)
  const totalMinHours = effortEstimates.reduce((sum, eff) => {
    const content = (eff.content as any)?.content || eff.content || {}
    const minHours = parseFloat(content.min_hours) || 0
    return sum + minHours
  }, 0)
  
  const totalMaxHours = effortEstimates.reduce((sum, eff) => {
    const content = (eff.content as any)?.content || eff.content || {}
    const maxHours = parseFloat(content.max_hours) || 0
    return sum + maxHours
  }, 0)
  
  // Total Budget = Sum of all effort estimates budgets
  const totalBudget = effortEstimates.reduce((sum, eff) => {
    const content = (eff.content as any)?.content || eff.content || {}
    const budget = parseFloat(content.budget) || 0
    return sum + budget
  }, 0)


  // Tabs
  type TabName = 'Efforts' | 'Milestones' | 'Deliverables' | 'Complexity' | 'Risk' | 'Dependency' | 'Investment'
  const allTabs: { name: TabName; count?: number; icon: React.FC<any> }[] = [
    { name: 'Efforts', count: effortEstimates.length, icon: Clock },
    { name: 'Milestones', count: milestones.length, icon: Target },
    { name: 'Deliverables', count: deliverables.length, icon: Package },
    { name: 'Complexity', count: complexityRatings.length, icon: Layers },
    { name: 'Risk', count: riskItems.length, icon: AlertTriangle },
    { name: 'Dependency', count: dependencies.length, icon: GitBranch },
    { name: 'Investment', count: investmentItems.length, icon: TrendingUp },
  ]

  // Only show tabs that actually have data
  const tabs = allTabs.filter(tab => tab.count !== undefined && tab.count > 0)
  const [activeTab, setActiveTab] = useState<TabName>(tabs[0]?.name || 'Efforts')

  const handleToggle = (id: string) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  // Sorting helper functions
  const sortByAmount = (items: OutputNode[], sortOrder: string) => {
    return [...items].sort((a, b) => {
      const contentA = (a.content as any)?.content || a.content || {}
      const contentB = (b.content as any)?.content || b.content || {}
      const amountA = extractCostValue(contentA, contentA.description as string | undefined)
      const amountB = extractCostValue(contentB, contentB.description as string | undefined)
      return sortOrder === 'amount-high' ? amountB - amountA : amountA - amountB
    })
  }

  const sortByTitle = (items: OutputNode[], sortOrder: string) => {
    return [...items].sort((a, b) => {
      return sortOrder === 'title-asc' 
        ? (a.title || '').localeCompare(b.title || '')
        : (b.title || '').localeCompare(a.title || '')
    })
  }

  const sortByWave = (items: OutputNode[], sortOrder: string) => {
    return [...items].sort((a, b) => {
      const contentA = (a.content as any)?.content || a.content || {}
      const contentB = (b.content as any)?.content || b.content || {}
      const waveA = parseFloat(String(contentA.phase ?? contentA.wave ?? '')) || parseFloat(parseStringField(contentA.wave?.toString(), 'wave') || '0') || 0
      const waveB = parseFloat(String(contentB.phase ?? contentB.wave ?? '')) || parseFloat(parseStringField(contentB.wave?.toString(), 'wave') || '0') || 0
      if (waveA !== waveB) {
        return sortOrder === 'wave-asc' ? waveA - waveB : waveB - waveA
      }
      return (a.title || '').localeCompare(b.title || '')
    })
  }

  const sortByShippable = (items: OutputNode[], sortOrder: string) => {
    return [...items].sort((a, b) => {
      const contentA = (a.content as any)?.content || a.content || {}
      const contentB = (b.content as any)?.content || b.content || {}
      const shippableA = contentA.shippable === 'yes' || contentA.shippable === 'true' || contentA.shippable === true || parseBoolField(contentA.description, 'shippable')
      const shippableB = contentB.shippable === 'yes' || contentB.shippable === 'true' || contentB.shippable === true || parseBoolField(contentB.description, 'shippable')
      return sortOrder === 'shippable' 
        ? (shippableB ? 1 : 0) - (shippableA ? 1 : 0)
        : (a.title || '').localeCompare(b.title || '')
    })
  }

  const sortByBudget = (items: OutputNode[], sortOrder: string) => {
    return [...items].sort((a, b) => {
      const contentA = (a.content as any)?.content || a.content || {}
      const contentB = (b.content as any)?.content || b.content || {}
      const budgetA = parseFloat(contentA.budget) || 0
      const budgetB = parseFloat(contentB.budget) || 0
      if (budgetA !== budgetB) {
        return sortOrder === 'budget-high' ? budgetB - budgetA : budgetA - budgetB
      }
      return (a.title || '').localeCompare(b.title || '')
    })
  }

  const sortByConfidence = (items: OutputNode[], sortOrder: string) => {
    return [...items].sort((a, b) => {
      const contentA = (a.content as any)?.content || a.content || {}
      const contentB = (b.content as any)?.content || b.content || {}
      const confidencePriority: Record<string, number> = { high: 1, inferred: 2, medium: 3, low: 4 }
      const confA = confidencePriority[(contentA.confidence || 'medium').toLowerCase()] || 3
      const confB = confidencePriority[(contentB.confidence || 'medium').toLowerCase()] || 3
      if (confA !== confB) {
        return sortOrder === 'confidence' ? confA - confB : 0
      }
      return (a.title || '').localeCompare(b.title || '')
    })
  }

  const sortByRecurring = (items: OutputNode[], sortOrder: string) => {
    return [...items].sort((a, b) => {
      const contentA = (a.content as any)?.content || a.content || {}
      const contentB = (b.content as any)?.content || b.content || {}
      const recurringA = contentA.recurring === 'yes' || contentA.recurring === 'true' || contentA.recurring === true || parseBoolField(contentA.description, 'recurring')
      const recurringB = contentB.recurring === 'yes' || contentB.recurring === 'true' || contentB.recurring === true || parseBoolField(contentB.description, 'recurring')
      if (sortOrder === 'recurring') {
        return (recurringB ? 1 : 0) - (recurringA ? 1 : 0)
      }
      const amountA = extractCostValue(contentA, contentA.description as string | undefined)
      const amountB = extractCostValue(contentB, contentB.description as string | undefined)
      return amountB - amountA
    })
  }

  const sortById = (items: OutputNode[], sortOrder: string) => {
    return [...items].sort((a, b) => {
      const idA = (a.id || '').toString().toLowerCase()
      const idB = (b.id || '').toString().toLowerCase()
      return sortOrder === 'id-asc' ? idA.localeCompare(idB) : idB.localeCompare(idA)
    })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-5xl" ref={contentRef}>

      {/* ── Hidden all-tabs export container ── */}
      <div ref={exportRef} style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '800px', backgroundColor: '#fff' }}>
        <div style={{ fontFamily: 'Georgia, serif', color: '#000', backgroundColor: '#fff', padding: '20mm', maxWidth: '170mm', margin: '0 auto', fontSize: '10pt', lineHeight: '1.5' }}>
          <div style={{ marginBottom: '20pt', borderBottom: '2px solid #000', paddingBottom: '10pt' }}>
            <h1 style={{ fontSize: '18pt', fontWeight: 'bold', margin: '0 0 4pt 0' }}>Cost Estimation</h1>
            <p style={{ fontSize: '9pt', color: '#666', margin: '0' }}>Effort estimates and milestones.</p>
          </div>

          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8pt', marginBottom: '20pt' }}>
            {[
              { label: 'Total Budget', value: formatCurrency(totalBudget), sub: `${effortEstimates.length} estimates` },
              { label: 'Total Time', value: `${totalMinMonths}-${totalMaxMonths} months`, sub: 'effort estimates' },
            ].map(m => (
              <div key={m.label} style={{ border: '1px solid #ccc', padding: '10pt', textAlign: 'center' }}>
                <div style={{ fontSize: '8pt', color: '#666', marginBottom: '2pt' }}>{m.label}</div>
                <div style={{ fontSize: '14pt', fontWeight: 'bold' }}>{m.value}</div>
                <div style={{ fontSize: '7pt', color: '#999' }}>{m.sub}</div>
              </div>
            ))}
          </div>

          

          {/* Milestones */}
          {milestones.length > 0 && (
            <section style={{ marginBottom: '16pt' }}>
              <h2 style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '8pt', borderBottom: '1px solid #000', paddingBottom: '3pt' }}>Milestones</h2>
              {sortByWave(milestones, 'wave-asc').map((ms, idx) => {
                const content = (ms.content as any)?.content || ms.content || {}
                const wave = content.phase ?? content.wave ?? ''
                const exitCriteria = content.exit_criteria || ''
                return (
                  <div key={ms.id || idx} style={{ marginBottom: '8pt', fontSize: '9pt' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6pt', marginBottom: '2pt' }}>
                      {wave && <span style={{ fontSize: '7pt', fontWeight: 'bold', backgroundColor: '#f0f0f0', padding: '1pt 4pt' }}>Wave {wave}</span>}
                      <span style={{ fontWeight: 'bold' }}>{ms.title}</span>
                    </div>
                    <div style={{ fontSize: '8pt', color: '#666' }}>{content.description || ''}</div>
                    {exitCriteria && <div style={{ fontSize: '8pt', color: '#666', marginTop: '2pt' }}>Exit: {exitCriteria}</div>}
                  </div>
                )
              })}
            </section>
          )}

          {/* Effort Estimates */}
          {effortEstimates.length > 0 && (
            <section style={{ marginBottom: '16pt' }}>
              <h2 style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '8pt', borderBottom: '1px solid #000', paddingBottom: '3pt' }}>Effort Estimates</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6pt' }}>
                {effortEstimates.map((ef, idx) => {
                  const content = (ef.content as any)?.content || ef.content || {}
                  const budget = parseFloat(content.budget) || 0
                  const minM = content.min_months, maxM = content.max_months
                  return (
                    <div key={ef.id || idx} style={{ border: '1px solid #ccc', padding: '8pt', fontSize: '9pt' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '2pt' }}>{ef.title}</div>
                      {budget > 0 && <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>${budget.toLocaleString()}</div>}
                      {(minM || maxM) && <div style={{ fontSize: '8pt', color: '#666' }}>{minM || 0}-{maxM || 0} months</div>}
                      <div style={{ fontSize: '8pt', color: '#666' }}>{content.description || ''}</div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Complexity Ratings */}
          {complexityRatings.length > 0 && (
            <section>
              <h2 style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '8pt', borderBottom: '1px solid #000', paddingBottom: '3pt' }}>Complexity Ratings</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6pt' }}>
                {complexityRatings.map((cr, idx) => {
                  const content = (cr.content as any)?.content || cr.content || {}
                  const rating = content.rating || 'medium'
                  return (
                    <div key={cr.id || idx} style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid #ccc', padding: '8pt', fontSize: '9pt' }}>
                      <span style={{ fontWeight: 'bold' }}>{cr.title}</span>
                      <span style={{ fontSize: '7pt', fontWeight: 'bold', textTransform: 'uppercase', color: rating === 'high' ? '#666' : rating === 'low' ? '#999' : '#666' }}>{rating}</span>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      </div>
      <OutputHeader
        title="Cost Estimation"
        description="Effort estimates, milestones, complexity ratings, risks, dependencies, and investment planning synthesized from session 4."
        onRegenerate={onRegenerate}
        isRegenerating={isRegenerating}
        canExport={outputs.length > 0}
        onExport={handleExport}
        isExporting={isExporting}
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-8">
        <MetricCard
          labelFirst
          accentColor="#2563EB"
          label="Total Budget"
          value={formatCurrency(totalBudget)}
          sub={`${effortEstimates.length} estimates`}
        />
        <MetricCard
          labelFirst
          accentColor="#D97706"
          label="Total Time"
          value={`${totalMinMonths}-${totalMaxMonths} months`}
          sub={
            (totalMinHours > 0 || totalMaxHours > 0) ? (
              <>{(totalMinHours > 0 ? `${totalMinHours.toLocaleString()}` : '?')}-{(totalMaxHours > 0 ? `${totalMaxHours.toLocaleString()}` : '?')} hours</>
            ) : (
              'effort estimates'
            )
          }
        />
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
      <div className="space-y-6">
        {/* INVESTMENT TAB */}
        {activeTab === 'Investment' && (
          <div className="space-y-4">
            {/* Section header with sort */}
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
                Investment Items
              </div>
              <SortSelect
                value={investmentSort}
                onChange={setInvestmentSort}
                options={[
                  { value: 'amount-high', label: 'Amount: High First' },
                  { value: 'amount-low', label: 'Amount: Low First' },
                  { value: 'title-asc', label: 'Title: A-Z' },
                  { value: 'title-desc', label: 'Title: Z-A' },
                  { value: 'recurring', label: 'Recurring First' },
                ]}
              />
            </div>

            {(investmentSort === 'recurring'
              ? sortByRecurring(investmentItems, investmentSort)
              : investmentSort === 'title-asc' || investmentSort === 'title-desc'
              ? sortByTitle(investmentItems, investmentSort)
              : sortByAmount(investmentItems, investmentSort)
            ).map((inv, idx) => {
              const content = (inv.content as any)?.content || inv.content || {}
              const description = content.description || ''
              const amount = extractCostValue(content, description)
              const recurring = content.recurring != null
                ? (content.recurring === 'yes' || content.recurring === 'true' || content.recurring === true)
                : parseBoolField(content.description, 'recurring')
              const vendor = content.vendor || parseStringField(content.description, 'vendor') || ''
              const iid = inv.id

              return (
                <EditableNodeCard key={inv.id || idx} node={inv} projectId={projectId} onSaved={onContentUpdated} editableKeys={['title', 'description', 'amount']}>
                <div
                  className="bg-background border border-border-default rounded-[14px] p-5 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: id + title + desc */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-mono text-text-muted mb-1 tracking-wide">{iid}</div>
                      <h3 className="text-[15px] font-bold text-text-primary leading-snug mb-1">{inv.title}</h3>
                      {description && (
                        <p className="text-[12px] text-text-muted leading-relaxed line-clamp-2">{description}</p>
                      )}
                      {vendor && (
                        <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-text-muted bg-surface-muted px-2 py-0.5 rounded-full">
                          <span className="font-medium">Vendor:</span> {vendor}
                        </div>
                      )}
                    </div>

                    {/* Right: amount badge + type pill */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div
                        className="text-[20px] font-black leading-none px-3 py-1.5 rounded-xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(93,67,251,0.08) 0%, rgba(217,119,6,0.08) 100%)',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        {formatCurrency(amount)}
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                          recurring
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-surface-muted text-text-muted border border-border-default'
                        }`}
                      >
                        {recurring ? '↻ Monthly' : '✦ One-time'}
                      </span>
                    </div>
                  </div>
                </div>
                </EditableNodeCard>
              )
            })}
          </div>
        )}

        {activeTab === 'Milestones' && (
          <div className="space-y-6">
            <div className="bg-surface border border-border-default rounded-3xl p-8 shadow-[0_1px_3px_rgba(15,15,15,0.05)]">
              <div className="flex items-center justify-between mb-6">
                <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
                  PROJECT MILESTONES
                </div>
                <SortSelect
                  value={milestoneSort}
                  onChange={setMilestoneSort}
                  options={[
                    { value: 'wave-asc', label: 'Wave: First to Last' },
                    { value: 'wave-desc', label: 'Wave: Last to First' },
                    { value: 'title-asc', label: 'Title: A-Z' },
                    { value: 'title-desc', label: 'Title: Z-A' },
                  ]}
                />
              </div>
              <div className="space-y-4">
                {sortByWave(milestones, milestoneSort).map((milestone, idx) => (
                  <EditableNodeCard
                    key={milestone.id || idx}
                    node={milestone}
                    projectId={projectId}
                    onSaved={onContentUpdated}
                    editableKeys={['title', 'target_date_range', 'description', 'exit_criteria', 'capabilities']}
                  >
                    <MilestoneCard
                      milestone={milestone}
                      deliverables={deliverables}
                      capabilities={capabilities}
                      isExpanded={expandedId === milestone.id}
                      onToggle={() => handleToggle(milestone.id || `milestone-${idx}`)}
                    />
                  </EditableNodeCard>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DELIVERABLES TAB */}
        {activeTab === 'Deliverables' && (
          <div className="bg-surface border border-border-default rounded-3xl p-8 shadow-[0_1px_3px_rgba(15,15,15,0.05)]">
            <div className="flex items-center justify-between mb-6">
              <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
                DELIVERABLES
              </div>
              <SortSelect
                value={deliverableSort}
                onChange={setDeliverableSort}
                options={[
                  { value: 'title-asc', label: 'Title: A-Z' },
                  { value: 'title-desc', label: 'Title: Z-A' },
                  { value: 'shippable', label: 'Shippable First' },
                ]}
              />
            </div>
            <div className="space-y-4">
              {sortByShippable(deliverables, deliverableSort).map((del, idx) => {
                const content = (del.content as any)?.content || del.content || {}
                const description = content.description || ''
                const shippable = content.shippable != null
                  ? (content.shippable === 'yes' || content.shippable === 'true' || content.shippable === true)
                  : parseBoolField(content.description, 'shippable')
                const verificationMethod = content.verification_method || parseStringField(content.description, 'verification_method') || ''
                const did = del.id

                return (
                  <EditableNodeCard key={del.id || idx} node={del} projectId={projectId} onSaved={onContentUpdated} editableKeys={['title', 'description']}>
                    <div className="bg-background border border-border-default rounded-lg p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-text-muted bg-surface-muted px-2 py-0.5 rounded">
                            {did}
                          </span>
                          <h3 className="text-[14px] font-bold text-text-primary">{del.title}</h3>
                        </div>
                        <div className="flex gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded ${
                            shippable ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {shippable ? 'Shippable' : 'Internal'}
                          </span>
                          {verificationMethod && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                            {verificationMethod}
                          </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[13px] text-text-secondary leading-relaxed">{description}</p>
                    </div>
                  </EditableNodeCard>
                )
              })}
            </div>
          </div>
        )}

        {/* EFFORT TAB */}
        {activeTab === 'Efforts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
                Effort Estimates
              </div>
              <SortSelect
                value={effortSort}
                onChange={setEffortSort}
                options={[
                  { value: 'budget-high', label: 'Budget: High First' },
                  { value: 'budget-low', label: 'Budget: Low First' },
                  { value: 'title-asc', label: 'Title: A-Z' },
                  { value: 'title-desc', label: 'Title: Z-A' },
                  { value: 'confidence', label: 'Confidence: High First' },
                  { value: 'id-asc', label: 'ID: 001-999' },
                  { value: 'id-desc', label: 'ID: 999-001' },
                ]}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {((() => {
                let sorted: typeof effortEstimates
                if (effortSort === 'title-asc' || effortSort === 'title-desc') {
                  sorted = sortByTitle(effortEstimates, effortSort)
                } else if (effortSort === 'confidence') {
                  sorted = sortByConfidence(effortEstimates, effortSort)
                } else if (effortSort === 'id-asc' || effortSort === 'id-desc') {
                  sorted = sortById(effortEstimates, effortSort)
                } else {
                  sorted = sortByBudget(effortEstimates, effortSort)
                }
                return sorted.map((effort, idx) => {
                  const content = (effort.content as any)?.content || effort.content || {}
                  const description = content.description || ''
                  const basis = content.basis || ''
                  
                  // New format fields
                  const minMonths = content.min_months
                  const maxMonths = content.max_months
                  const minHours = content.min_hours
                  const maxHours = content.max_hours
                  const budget = parseFloat(content.budget) || 0
                  const currency = content.currency || 'INR'
                  const estimationMethod = content.estimation_method || 'expert'
                  const confidence = content.confidence || 'medium'
                  
                  const eid = effort.id

                  return (
                    <EditableNodeCard key={effort.id || idx} node={effort} projectId={projectId} onSaved={onContentUpdated} editableKeys={['description', 'basis', 'budget', 'currency', 'min_months', 'max_months', 'min_hours', 'max_hours']}>
                    <div className="bg-background border border-border-default rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                      <div className="p-5">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-[10px] font-mono text-text-muted bg-surface-muted px-2 py-0.5 rounded">
                            {eid}
                          </span>
                          <div className="flex gap-1.5">
                            <ConfidenceBadge confidence={confidence} />
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                              {estimationMethod}
                            </span>
                          </div>
                        </div>
                        
                        {/* Title */}
                        <h3 className="text-[15px] font-bold text-text-primary mb-2 leading-tight">{effort.title}</h3>
                        
                        {/* Budget */}
                        {budget > 0 && (
                          <div className="inline-flex items-center gap-2 bg-[#5E43FB]/5 border border-[#5E43FB]/20 rounded-lg px-3 py-2 mb-3">
                            <span className="text-[11px] text-text-muted uppercase tracking-wider">Budget</span>
                            <span className="text-[18px] font-black text-[#5E43FB]">
                              {currency === 'USD' ? '$' : '$'}{budget.toLocaleString()}
                            </span>
                          </div>
                        )}
                        
                        {/* Time Range */}
                        {(minMonths || maxMonths) && (
                          <div className="mb-3">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Duration</div>
                            <div className="flex items-center gap-2">
                              <span className="text-[16px] font-bold text-text-primary">{minMonths || 0}</span>
                              <span className="text-[12px] text-text-muted">to</span>
                              <span className="text-[16px] font-bold text-text-primary">{maxMonths || 0}</span>
                              <span className="text-[12px] text-text-muted">months</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Hours Range */}
                        {(minHours || maxHours) && (
                          <div className="mb-3">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Hours</div>
                            <div className="flex items-center gap-2">
                              <span className="text-[16px] font-bold text-text-primary">{minHours || 0}</span>
                              <span className="text-[12px] text-text-muted">to</span>
                              <span className="text-[16px] font-bold text-text-primary">{maxHours || 0}</span>
                              <span className="text-[12px] text-text-muted">hours</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Description */}
                        {description && (
                          <p className="text-[12px] text-text-muted leading-relaxed">{description}</p>
                        )}
                      </div>
                      
                      {/* Basis Section */}
                      {basis && (
                        <div className="px-5 pb-5">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-[#5E43FB] mb-1">Basis</div>
                          <p className="text-[12px] text-text-secondary leading-relaxed">{basis}</p>
                        </div>
                      )}
                    </div>
                    </EditableNodeCard>
                  )
                })
              })())}
            </div>
          </div>
        )}

        {/* RISK TAB */}
        {activeTab === 'Risk' && (
          <div className="bg-surface border border-border-default rounded-3xl p-8 shadow-[0_1px_3px_rgba(15,15,15,0.05)]">
            <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-6">
              01. {riskItems.length} RISK ITEMS
            </div>
            <div className="space-y-4">
              {riskItems.map((risk, idx) => {
                const content = (risk.content as any)?.content || risk.content || {}
                const description = content.description || ''
                const probability = content.probability || 'medium'
                const impact = content.impact || '2x'
                const riskType = content.risk_type || 'technical'
                const mitigation = content.mitigation || ''
                const rid = risk.id

                return (
                  <EditableNodeCard key={risk.id || idx} node={risk} projectId={projectId} onSaved={onContentUpdated} editableKeys={['title', 'description', 'risk_type', 'mitigation']}>
                  <div className="bg-background border border-border-default rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-mono text-text-muted bg-surface-muted px-2 py-0.5 rounded">
                        {rid}
                      </span>
                      <h3 className="text-[14px] font-bold text-text-primary flex-1">{risk.title}</h3>
                      <div className="flex gap-2">
                        <ProbabilityBadge probability={probability} />
                        <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                          Impact: {impact}
                        </span>
                      </div>
                    </div>
                    <p className="text-[13px] text-text-secondary leading-relaxed mb-3">{description}</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-surface-muted text-text-muted capitalize">
                        Type: {riskType}
                      </span>
                    </div>
                    {mitigation && (
                      <div className="mt-3 pt-3 border-t border-border-default">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Mitigation</div>
                        <p className="text-[12px] text-text-secondary leading-relaxed">{mitigation}</p>
                      </div>
                    )}
                  </div>
                  </EditableNodeCard>
                )
              })}
            </div>
          </div>
        )}

        {/* DEPENDENCY TAB */}
        {activeTab === 'Dependency' && (
          <div className="bg-surface border border-border-default rounded-3xl p-8 shadow-[0_1px_3px_rgba(15,15,15,0.05)]">
            <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-6">
              01. {dependencies.length} DEPENDENCIES
            </div>
            <div className="space-y-4">
              {dependencies.map((dep, idx) => {
                const content = (dep.content as any)?.content || dep.content || {}
                const description = content.description || ''
                const dependencyType = content.dependency_type || parseStringField(description, 'dependency_type') || 'finish_to_start'
                const lagMonths = content.lag_months != null ? Number(content.lag_months) : parseNumberField(description, 'lag_months')
                const justification = content.justification || parseStringField(description, 'justification') || ''
                const isDomainMandated = content.is_domain_mandated != null
                  ? (content.is_domain_mandated === 'yes' || content.is_domain_mandated === true)
                  : parseBoolField(description, 'is_domain_mandated')
                const criticality = content.criticality || 'medium'

                return (
                  <EditableNodeCard key={dep.id || idx} node={dep} projectId={projectId} onSaved={onContentUpdated} editableKeys={['description', 'dependency_type', 'lag_months', 'justification', 'is_domain_mandated', 'criticality']}>
                  <div className="bg-background border border-border-default rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[14px] font-bold text-text-primary">{dep.title}</h3>
                      <div className="flex gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                          {String(dependencyType).replace(/_/g, ' ')}
                        </span>
                        {isDomainMandated && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                            Domain Mandated
                          </span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded ${
                          criticality === 'high' ? 'bg-red-50 text-red-700' :
                          criticality === 'medium' ? 'bg-amber-50 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {criticality} criticality
                        </span>
                      </div>
                    </div>
                    <p className="text-[13px] text-text-secondary leading-relaxed mb-2">{description}</p>
                    {justification && (
                      <div className="text-[12px] text-text-muted bg-surface-muted rounded-lg p-3">
                        {justification}
                      </div>
                    )}
                    {lagMonths > 0 && (
                      <div className="text-[11px] text-text-muted mt-2">
                        Lag: {lagMonths} months
                      </div>
                    )}
                  </div>
                  </EditableNodeCard>
                )
              })}
            </div>
          </div>
        )}

        {/* COMPLEXITY TAB */}
        {activeTab === 'Complexity' && (
          <div className="bg-surface border border-border-default rounded-3xl p-8 shadow-[0_1px_3px_rgba(15,15,15,0.05)]">
            {/* Header with sort */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
                COMPLEXITY RATINGS
              </div>
              <SortSelect
                value={complexitySort}
                onChange={setComplexitySort}
                options={[
                  { value: 'rating-high', label: 'Rating: High First' },
                  { value: 'rating-low', label: 'Rating: Low First' },
                  { value: 'title-asc', label: 'Title: A-Z' },
                  { value: 'title-desc', label: 'Title: Z-A' },
                ]}
              />
            </div>
            {/* Sort complexity ratings based on selection */}
            {(() => {
              const ratingPriority: Record<string, number> = { high: 1, medium: 2, low: 3 }
              const sortedRatings = [...complexityRatings].sort((a, b) => {
                const contentA = (a.content as any)?.content || a.content || {}
                const contentB = (b.content as any)?.content || b.content || {}
                const ratingA = (contentA.rating || 'medium').toLowerCase()
                const ratingB = (contentB.rating || 'medium').toLowerCase()
                
                switch (complexitySort) {
                  case 'rating-high': {
                    const priorityAHigh = ratingPriority[ratingA] ?? 2
                    const priorityBHigh = ratingPriority[ratingB] ?? 2
                    if (priorityAHigh !== priorityBHigh) return priorityAHigh - priorityBHigh
                    return (a.title || '').localeCompare(b.title || '')
                  }
                  case 'rating-low': {
                    const priorityALow = ratingPriority[ratingA] ?? 2
                    const priorityBLow = ratingPriority[ratingB] ?? 2
                    if (priorityALow !== priorityBLow) return priorityBLow - priorityALow
                    return (a.title || '').localeCompare(b.title || '')
                  }
                  case 'title-asc':
                    return (a.title || '').localeCompare(b.title || '')
                  case 'title-desc':
                    return (b.title || '').localeCompare(a.title || '')
                  default:
                    return 0
                }
              })
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sortedRatings.map((cr, idx) => {
                    const content = (cr.content as any)?.content || cr.content || {}
                    const description = content.description || ''
                    const rating = content.rating || 'medium'
                    const rationale = content.rationale || ''
                    const cid = cr.id
                    // Extract effort/effort_min/effort_max if available
                    const effortMin = content.effort_min || content.effort?.min
                    const effortMax = content.effort_max || content.effort?.max
                    const effortUnit = content.effort_unit || 'person-days'

                    return (
                      <EditableNodeCard key={cr.id || idx} node={cr} projectId={projectId} onSaved={onContentUpdated} editableKeys={['title', 'description', 'rationale']}>
                      <div className="bg-background border border-border-default rounded-lg p-5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-text-muted bg-surface-muted px-2 py-0.5 rounded">
                              {cid}
                            </span>
                            <h3 className="text-[14px] font-bold text-text-primary">{cr.title}</h3>
                          </div>
                          <RatingBadge rating={rating} />
                        </div>
                        <p className="text-[12px] text-text-muted mb-2">{description}</p>
                        {(effortMin || effortMax) && (
                          <div className="text-[12px] text-text-secondary bg-surface-muted rounded-lg p-2 mb-2 flex items-center gap-2">
                            <Clock className="w-3 h-3 text-text-muted" />
                            <span>
                              {effortMin && effortMax 
                                ? `Estimated effort: ${effortMin} - ${effortMax} ${effortUnit}` 
                                : effortMin 
                                  ? `Min effort: ${effortMin} ${effortUnit}`
                                  : `Max effort: ${effortMax} ${effortUnit}`
                              }
                            </span>
                          </div>
                        )}
                        {rationale && (
                          <div className="text-[12px] text-text-secondary bg-surface-muted rounded-lg p-3 mt-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted block mb-1">Rationale</span>
                            {rationale}
                          </div>
                        )}
                      </div>
                      </EditableNodeCard>
                    )
                  })}
                </div>
              )
              })()}

            {/* ROI Projections */}
            {/* {roiProjections.length > 0 && (
              <div className="mt-8 pt-6 border-t border-border-default">
                <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-4">
                  ROI PROJECTIONS
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {roiProjections.map((roi, idx) => {
                    const content = (roi.content as any)?.content || roi.content || {}
                    const roiInvestment = extractCostValue(content, content.description as string | undefined)
                    const expectedValue = extractCostValue({ expected_value: content.expected_value }, content.description as string | undefined)
                    const paybackMonths = content.payback_period_months || 12

                    return (
                      <div key={roi.id || idx} className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg p-5">
                        <h4 className="text-[14px] font-bold text-green-800 mb-3">{roi.title}</h4>
                        <div className="space-y-3">
                          <div>
                            <div className="text-[10px] font-bold uppercase text-green-600">Investment</div>
                            <div className="text-[20px] font-black text-green-700">{formatCurrency(roiInvestment)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase text-green-600">Expected Value</div>
                            <div className="text-[20px] font-black text-green-700">{formatCurrency(expectedValue)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase text-green-600">Payback</div>
                            <div className="text-[20px] font-black text-green-700">{paybackMonths} mo</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )} */}
          </div>
        )}
      </div>
    </div>
  )
}