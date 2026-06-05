import type { FC } from 'react'

export interface CapabilityCardMetric {
  label: string
  value: string
  /**
   * When provided, a colored status dot is rendered next to the value
   * (high → red, medium → amber, anything else → gray). Omit for plain
   * text metrics like confidence or session.
   */
  level?: string
}

interface CapabilityCardProps {
  /** Display identifier shown in the top-left (e.g. "0001" or "BASE-0001"). */
  displayId: string
  title: string
  description: string
  /** Renders the red "high" badge in the top-right when true. */
  highlight?: boolean
  metrics: CapabilityCardMetric[]
}

const levelDotClass = (level: string): string => {
  switch (level.toLowerCase()) {
    case 'high':
      return 'bg-red-500'
    case 'medium':
      return 'bg-amber-500'
    default:
      return 'bg-gray-400'
  }
}

/**
 * CapabilityCard – shared card for the Capabilities and Base Capabilities tabs.
 * Both tabs render the same chrome (id, title, description, metric row); the
 * only differences are the id prefix and which metrics are supplied, so those
 * are passed in by the caller.
 */
export const CapabilityCard: FC<CapabilityCardProps> = ({
  displayId,
  title,
  description,
  highlight = false,
  metrics,
}) => {
  return (
    <div className="bg-background border border-border-default rounded-xl p-5 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div className="text-[13px] font-bold text-accent">{displayId}</div>
        {/* {highlight && (
          <div className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-red-500 bg-red-500/10 border border-red-500/20 rounded">
            high
          </div>
        )} */}
      </div>
      <h3 className="text-[15px] font-bold text-text-primary mb-2 leading-tight">
        {title}
      </h3>
      <p className="text-[13px] text-text-secondary leading-relaxed mb-6">
        {description}
      </p>
      <div className="flex gap-6">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">
              {metric.label}
            </div>
            {metric.level !== undefined ? (
              <div className="flex items-center gap-1.5 text-[13px] font-medium text-text-secondary">
                <span className={`w-2 h-2 rounded-full ${levelDotClass(metric.level)}`} />
                <span className="capitalize">{metric.value}</span>
              </div>
            ) : (
              <div className="text-[13px] font-medium text-text-secondary capitalize">
                {metric.value}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default CapabilityCard
