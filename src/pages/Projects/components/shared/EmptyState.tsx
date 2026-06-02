import type { FC } from 'react'

interface EmptyStateProps {
  message: string
}

/**
 * EmptyState – shared "no data" placeholder used inside the tabbed content of
 * the output renderers (e.g. "No data for components.").
 */
export const EmptyState: FC<EmptyStateProps> = ({ message }) => (
  <div className="p-12 text-center bg-surface-muted rounded-2xl border border-dashed border-border-default">
    <p className="text-[11px] font-black uppercase tracking-widest text-text-muted">
      {message}
    </p>
  </div>
)

export default EmptyState
