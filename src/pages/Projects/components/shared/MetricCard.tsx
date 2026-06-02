import type { FC, ReactNode } from 'react'

interface MetricCardProps {
  /** Primary, emphasized value (the big number). */
  value: ReactNode
  /** Caption describing the value. */
  label: string
  /** Optional sub-caption shown beneath. */
  sub?: ReactNode
  /**
   * When true, the label renders above the value (used by Cost Estimation).
   * Defaults to value-first (used by Capabilities / Architecture).
   */
  labelFirst?: boolean
  /** Optional colored top accent border (e.g. Cost Estimation cards). */
  accentColor?: string
}

/**
 * MetricCard – shared summary stat card shown in the metrics row above the
 * tabbed content of the output renderers.
 *
 * Single Responsibility: present a value/label/sub triple inside a consistent
 * card chrome. Callers format the value (currency, counts, ranges) themselves.
 */
export const MetricCard: FC<MetricCardProps> = ({
  value,
  label,
  sub,
  labelFirst = false,
  accentColor,
}) => {
  const valueEl = (
    <div className="text-[28px] font-bold text-text-primary leading-none">{value}</div>
  )
  const labelEl = (
    <div className="text-[13px] font-medium text-text-secondary">{label}</div>
  )

  return (
    <div
      className="bg-surface border border-border-default rounded-xl p-5 shadow-[0_1px_3px_rgba(15,15,15,0.08)]"
      style={
        accentColor
          ? { borderTopWidth: 4, borderTopColor: accentColor }
          : undefined
      }
    >
      {labelFirst ? (
        <div className="space-y-2">
          {labelEl}
          {valueEl}
        </div>
      ) : (
        <div className="space-y-2">
          {valueEl}
          {labelEl}
        </div>
      )}
      {sub && <div className="text-[12px] text-text-muted mt-2">{sub}</div>}
    </div>
  )
}

export default MetricCard
