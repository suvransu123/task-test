import React from 'react'
import { Lightbulb, ExternalLink } from 'lucide-react'

interface ProjectIntelligenceWidgetProps {
  logicCompleteness: number
}

export const ProjectIntelligenceWidget: React.FC<
  ProjectIntelligenceWidgetProps
> = ({ logicCompleteness }) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[11px] font-black text-text-primary uppercase tracking-[0.1em]">
          Project Intelligence
        </h2>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
            Connected
          </span>
        </div>
      </div>

      {/* Logic Completeness */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span className="text-text-secondary">Logic Completeness</span>
          <span className="text-text-primary">{logicCompleteness}%</span>
        </div>
        <div className="h-1.5 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${logicCompleteness}%` }}
          />
        </div>
      </div>

      {/* Architecture Insight */}
      <div className="bg-surface-muted border border-[#DDD6FE] rounded-xl p-4 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center shadow-sm shrink-0">
            <Lightbulb className="w-4 h-4 text-accent" />
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-black text-accent uppercase tracking-wider">
              Architecture Insight
            </p>
            <p className="text-[12px] text-[#4A3AFF] leading-relaxed font-medium">
              Consider implementing a Redis caching layer for the IoT sensor
              streams to reduce database I/O latency by 40%.
            </p>
          </div>
        </div>
      </div>

      {/* Contextual Entities */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.1em]">
          Contextual Entities
        </h3>
        <div className="space-y-2">
          {[
            { name: 'Facility Schema.json', type: 'json' },
            { name: 'Billing-Logic.ts', type: 'ts' },
          ].map((entity) => (
            <div
              key={entity.name}
              className="flex items-center justify-between p-3 bg-surface border border-border-default rounded-lg hover:border-accent hover:shadow-sm transition-all cursor-pointer group"
            >
              <span className="text-[12px] font-semibold text-text-primary">
                {entity.name}
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-text-muted group-hover:text-accent transition-colors" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
