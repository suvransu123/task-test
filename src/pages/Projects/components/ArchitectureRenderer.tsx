import React from 'react'
import {
  Layers,
  ShieldCheck,
  Cpu,
  Database,
  Globe,
  Activity,
  Component as ComponentIcon,
  HelpCircle,
} from 'lucide-react'
import { DocumentRenderer } from '../../../components/ui/DocumentRenderer'
import { DataTable } from '../../../components/ui/DataTable'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ArchitectureData {
  project_name?: string
  project_description?: string
  part1?: {
    system_context_diagram?: string
    element_breakdown?: Array<{
      element: string
      category: string
      description: string
    }>
  }
  part2?: {
    architecture_style?: string
    container_boundary_strategy?: string
    data_architecture_strategy?: string
    communication_model?: string
    structural_definition?: Array<{
      container: string
      tech_stack: string
      responsibility: string
    }>
    design_rationale?: string
    risks_and_tradeoffs?: string
  }
  part3?: {
    selection_rationale?: string
    identification_strategy?: string
    architectural_pattern?: string
    component_responsibilities?: Array<{
      component: string
      core_responsibilities: string
      coupling: string
    }>
  }
  brief_and_others?: {
    circular_dependencies?: string
    database_bottlenecks?: string
  }
  [key: string]: any
}

interface ArchitectureRendererProps {
  data: ArchitectureData | any
  model: string
  disableMermaid?: boolean
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

// ─── Sub-Components ──────────────────────────────────────────────────────────

const SectionHeader: React.FC<{
  part: string
  title: string
  subtitle?: string
}> = ({ part, title, subtitle }) => (
  <div className="flex items-center justify-between border-b-2 border-border-default pb-4 mb-8">
    <div className="space-y-1">
      <h2 className="text-xl font-black text-text-primary tracking-tight uppercase">
        <span className="text-text-muted mr-3">{part} —</span>
        {title}
      </h2>
      {subtitle && (
        <p className="text-xs font-bold text-text-muted tracking-[0.2em] uppercase">
          {subtitle}
        </p>
      )}
    </div>
  </div>
)

const StrategyCard: React.FC<{
  title: string
  content: string
  icon?: any
  theme?: 'light' | 'dark' | 'glass'
}> = ({ title, content, icon: Icon, theme = 'light' }) => {
  if (theme === 'dark') {
    return (
      <div className="bg-surface-muted rounded-xl p-6 border border-border-default shadow-xl group">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-text-muted group-hover:text-accent transition-colors">
            {Icon ? <Icon size={16} /> : <Activity size={16} />}
          </div>
          <h4 className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em]">
            {title}
          </h4>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed font-medium">
          {content}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border-default rounded-xl p-6 shadow-sm hover:border-accent/30 transition-all group relative overflow-hidden">
      {/* Subtle top indicator */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-border-default group-hover:bg-accent/50 transition-colors" />

      <div className="space-y-4">
        <h4 className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">
          {title.replace(/_/g, ' ')}
        </h4>
        <p className="text-[13px] text-text-secondary leading-relaxed font-medium">
          {content}
        </p>
      </div>
    </div>
  )
}

// ... (ArchitectureTable is replaced by the universal DataTable)

// ─── Main Renderer ───────────────────────────────────────────────────────────

export const ArchitectureRenderer: React.FC<ArchitectureRendererProps> = ({
  data,
  model,
  disableMermaid,
}) => {
  if (!data) return null

  // Handle pure string (likely a Mermaid diagram for User Flow/Data Models)
  if (
    typeof data === 'string' &&
    (data.includes('```mermaid') ||
      data.includes('graph ') ||
      data.includes('sequenceDiagram'))
  ) {
    return (
      <div className="py-8 animate-in fade-in duration-700">
        <DocumentRenderer
          content={data}
          model={model}
          disableMermaid={disableMermaid}
        />
      </div>
    )
  }

  // Attempt to parse or organize data into the C4 structure
  const structure: ArchitectureData = React.useMemo(() => {
    // If data already follows the structure, use it
    if (data.part1 || data.part2 || data.part3) return data

    // Smart mapping for unstructured data (e.g. from existing AI output)
    const s: ArchitectureData = {
      part1: {},
      part2: { structural_definition: [] },
      part3: { component_responsibilities: [] },
      brief_and_others: {},
    }

    // If it's an object but doesn't have C4 parts, try to fill them or just show them in a list
    let hasMapping = false
    Object.entries(data).forEach(([key, value]) => {
      const k = key.toLowerCase()
      if (k.includes('breakdown') || k.includes('elements')) {
        s.part1!.element_breakdown = Array.isArray(value) ? value : []
        hasMapping = true
      }
      if (k.includes('container') || k.includes('definition')) {
        s.part2!.structural_definition = Array.isArray(value) ? value : []
        hasMapping = true
      }
      if (k.includes('component') || k.includes('responsibilities')) {
        s.part3!.component_responsibilities = Array.isArray(value) ? value : []
        hasMapping = true
      }
      if (k.includes('style')) {
        s.part2!.architecture_style = String(value)
        hasMapping = true
      }
      if (k.includes('data_architecture')) {
        s.part2!.data_architecture_strategy = String(value)
        hasMapping = true
      }
      if (k.includes('communication')) {
        s.part2!.communication_model = String(value)
        hasMapping = true
      }
      if (k.includes('diagram') || k.includes('mermaid')) {
        s.part1!.system_context_diagram = String(value)
        hasMapping = true
      }
    })

    // If no specific mapping found, and it's an object, we'll treat it as generic but still try to use the new UI components
    if (!hasMapping && typeof data === 'object') {
      // Fallback: put generic KV pairs into strategy cards or a simple list if they don't fit
      return { ...s, ...data, isGeneric: true }
    }

    return s
  }, [data])

  // If it's generic data (not C4), render a simplified version using the new aesthetic
  if (structure.isGeneric) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-700">
        {Object.entries(data).map(([key, value]: [string, any]) => (
          <StrategyCard
            key={key}
            title={key.replace(/_/g, ' ')}
            content={
              typeof value === 'object'
                ? JSON.stringify(value, null, 2)
                : String(value)
            }
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-16 animate-in fade-in duration-1000 pb-20">
      {/* Header */}
      <div className="space-y-3 pb-8">
        <p className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">
          Technical Documentation
        </p>
        <h1 className="text-4xl font-black text-text-primary tracking-tight leading-tight">
          C4 Model Documentation —{' '}
          {structure.project_name || 'System Architecture'}
        </h1>
        <p className="text-[15px] text-text-secondary leading-relaxed font-medium max-w-3xl">
          {structure.project_description ||
            'Detailed structural definition of the application following the C4 Architecture model standards.'}
        </p>
      </div>

      {/* PART 1 — SYSTEM CONTEXT (L1) */}
      <section>
        <SectionHeader
          part="PART 1"
          title="SYSTEM CONTEXT (L1)"
          subtitle="CONTEXT LAYER"
        />

        {/* Diagram Area */}
        <div className="mb-12">
          <DocumentRenderer
            content={
              structure.part1?.system_context_diagram ||
              structure.system_context_diagram ||
              '```mermaid\ngraph TD\n  User((User)) --> System[Travel Diary]\n  System --> Mail[Email System]\n```'
            }
            model={model}
            disableMermaid={disableMermaid}
          />
        </div>

        {/* Element Breakdown */}
        {structure.part1?.element_breakdown &&
          structure.part1.element_breakdown.length > 0 && (
            <div className="space-y-4">
              <DataTable
                title="Element Breakdown"
                columns={['Element', 'Category', 'Description']}
                data={structure.part1.element_breakdown.map((e) => [
                  e.element,
                  e.category,
                  e.description,
                ])}
              />
            </div>
          )}
      </section>

      {/* PART 2 — CONTAINER DIAGRAM (L2) */}
      <section>
        <SectionHeader
          part="PART 2"
          title="CONTAINER DIAGRAM (L2)"
          subtitle="ARCHITECTURE STRATEGY"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {structure.part2?.architecture_style && (
            <StrategyCard
              title="Architecture Style"
              content={structure.part2.architecture_style}
              icon={Layers}
            />
          )}
          {structure.part2?.container_boundary_strategy && (
            <StrategyCard
              title="Container Boundary Strategy"
              content={structure.part2.container_boundary_strategy}
              icon={ShieldCheck}
            />
          )}
          {structure.part2?.data_architecture_strategy && (
            <StrategyCard
              title="Data Architecture Strategy"
              content={structure.part2.data_architecture_strategy}
              icon={Database}
            />
          )}
          {structure.part2?.communication_model && (
            <StrategyCard
              title="Communication Model"
              content={structure.part2.communication_model}
              icon={Globe}
            />
          )}
        </div>

        {structure.part2?.structural_definition &&
          structure.part2.structural_definition.length > 0 && (
            <div className="space-y-4">
              <DataTable
                title="Structural Definition Table"
                columns={['Container', 'Tech Stack', 'Responsibility']}
                data={structure.part2.structural_definition.map((c) => [
                  c.container,
                  c.tech_stack,
                  c.responsibility,
                ])}
              />
            </div>
          )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {structure.part2?.design_rationale && (
            <div className="bg-surface-muted border border-border-default rounded-xl p-6">
              <h4 className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-4">
                L2 Design Rationale
              </h4>
              <p className="text-[13px] text-text-secondary leading-relaxed font-medium">
                {structure.part2.design_rationale}
              </p>
            </div>
          )}
          {structure.part2?.risks_and_tradeoffs && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
              <h4 className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-4">
                Risks &amp; Trade-offs
              </h4>
              <p className="text-[13px] text-red-500/80 leading-relaxed font-medium">
                {structure.part2.risks_and_tradeoffs}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* PART 3 — COMPONENT DIAGRAM (L3) */}
      <section>
        <SectionHeader
          part="PART 3"
          title="COMPONENT DIAGRAM (L3)"
          subtitle="DETAILED IMPLEMENTATION"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {structure.part3?.selection_rationale && (
            <StrategyCard
              title="Selection Rationale"
              content={structure.part3.selection_rationale}
              icon={Cpu}
            />
          )}
          {structure.part3?.identification_strategy && (
            <StrategyCard
              title="Identification Strategy"
              content={structure.part3.identification_strategy}
              icon={Layers}
            />
          )}
          {structure.part3?.architectural_pattern && (
            <StrategyCard
              title="Architectural Pattern"
              content={structure.part3.architectural_pattern}
              icon={ComponentIcon}
            />
          )}
        </div>

        {structure.part3?.component_responsibilities &&
          structure.part3.component_responsibilities.length > 0 && (
            <div className="space-y-4">
              <DataTable
                title="Component Responsibilities"
                columns={['Component', 'Core Responsibilities', 'Coupling']}
                data={structure.part3.component_responsibilities.map((c) => [
                  c.component,
                  c.core_responsibilities,
                  c.coupling,
                ])}
              />
            </div>
          )}
      </section>

      {/* Bottom Section: Brief & Others */}
      {(structure.brief_and_others?.circular_dependencies ||
        structure.brief_and_others?.database_bottlenecks) && (
        <section className="bg-surface-muted rounded-2xl p-10 border border-border-default shadow-xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent blur-[150px] opacity-10 -translate-y-1/2 translate-x-1/2" />

          <div className="relative space-y-8">
            <h3 className="text-[11px] font-black text-accent uppercase tracking-[0.4em]">
              Brief &amp; Others Key details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {structure.brief_and_others?.circular_dependencies && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <HelpCircle size={14} className="text-text-muted" />
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                      Circular Dependencies
                    </span>
                  </div>
                  <p className="text-[13px] text-text-secondary leading-relaxed font-medium">
                    {structure.brief_and_others.circular_dependencies}
                  </p>
                </div>
              )}
              {structure.brief_and_others?.database_bottlenecks && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Database size={14} className="text-text-muted" />
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                      Database Bottlenecks
                    </span>
                  </div>
                  <p className="text-[13px] text-text-secondary leading-relaxed font-medium">
                    {structure.brief_and_others.database_bottlenecks}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
