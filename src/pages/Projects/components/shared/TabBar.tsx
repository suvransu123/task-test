import type { FC, ComponentType } from 'react'
import { Button } from '../../../../components/ui/Button'

export interface TabBarItem {
  /** Stable identifier and label for the tab */
  name: string
  /** Optional count badge. Rendered only when defined. */
  count?: number
  /** Optional leading icon (e.g. a lucide-react icon). */
  icon?: ComponentType<{ className?: string }>
}

interface TabBarProps {
  tabs: TabBarItem[]
  activeTab: string
  onTabChange: (name: string) => void
  /** Optional override for the container classes. */
  className?: string
}

/**
 * TabBar – shared underline-style tab navigation used across the project
 * output renderers (Brief, Capabilities, Technical Architecture, Cost).
 *
 * Single Responsibility: render a horizontal, scrollable set of tabs with an
 * optional icon and count badge, and report selection changes to the parent.
 * Selection state and any side effects (e.g. resetting expanded rows) are
 * owned by the caller via `activeTab` / `onTabChange`.
 */
export const TabBar: FC<TabBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = 'flex gap-2 overflow-x-auto border-b border-border-default mb-8 pb-1 scrollbar-hide',
}) => {
  return (
    <div className={className}>
      {tabs.map(({ name, count, icon: Icon }) => {
        const isActive = activeTab === name
        return (
          <Button
            variant="unstyled"
            key={name}
            onClick={() => onTabChange(name)}
            className={`flex items-center gap-2 px-4 py-3 text-[14px] font-medium whitespace-nowrap transition-all border-b-2 ${
              isActive
                ? 'text-accent border-accent'
                : 'text-text-muted border-transparent hover:text-text-secondary'
            }`}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {name}
            {count !== undefined && (
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'bg-surface-muted text-text-muted'
                }`}
              >
                {count}
              </span>
            )}
          </Button>
        )
      })}
    </div>
  )
}

export default TabBar
