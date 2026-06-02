import React from 'react'

interface MinimalDataFieldProps {
  label: string
  value: string | string[] | undefined
  /** Optional override for value rendering, e.g. colored cross-links */
  renderValue?: (value: string[]) => React.ReactNode
}

/**
 * Renders a single key-value row in documentation/code style.
 * Used across UserStoryItem and FRItem for consistent minimalist formatting.
 *
 * Output: `key: value` where key is monospaced blue and value is monospaced zinc.
 */
export const MinimalDataField: React.FC<MinimalDataFieldProps> = ({
  label,
  value,
  renderValue,
}) => {
  if (value === undefined || value === null) return null

  const isEmpty =
    (typeof value === 'string' && (value === '' || value === 'None')) ||
    (Array.isArray(value) && value.length === 0)

  const display = Array.isArray(value) ? value.join(', ') : value

  return (
    <div className="flex gap-1 items-baseline font-mono text-[11px] leading-relaxed">
      <span className="text-accent shrink-0">{label}:</span>
      {isEmpty ? (
        <span className="text-text-muted italic">none</span>
      ) : renderValue ? (
        renderValue(Array.isArray(value) ? value : [value])
      ) : (
        <span className="text-text-secondary">{display}</span>
      )}
    </div>
  )
}
