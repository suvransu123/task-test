/**
 * OverflowTabs Component
 *
 * A responsive tab navigation component that automatically collapses
 * overflowing tabs into a "More" dropdown menu when the container
 * width is insufficient.
 *
 * Features:
 * - Uses ResizeObserver to detect container width changes
 * - Dynamically calculates which tabs fit in the available space
 * - Collapses overflowing tabs into a floating dropdown menu
 * - Maintains consistent purple-accented enterprise styling
 * - Accessible keyboard navigation support
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '../Button'
import type { TabItem } from './useOverflowTabs'
import { useOverflowTabs } from './useOverflowTabs'
import { ChevronDown, ChevronUp, MoreHorizontal } from 'lucide-react'

export interface OverflowTabsProps {
  /** Array of tab items to display */
  tabs: TabItem[]
  /** Currently active tab ID */
  activeTabId: string
  /** Callback when a tab is clicked */
  onTabChange: (tabId: string) => void
  /** Additional CSS classes for the container */
  className?: string
  /** Gap between tabs in pixels (default: 8) */
  tabGap?: number
}

/**
 * OverflowTabs - A tab navigation component with dynamic overflow handling.
 *
 * The component measures each tab's width and the container's width to
 * determine which tabs can be displayed inline. When tabs would overflow,
 * they are moved to a "More" dropdown menu.
 *
 * Width Calculation Logic:
 * 1. On mount and resize, we measure the container width
 * 2. We collect widths of all tab buttons (using refs and callbacks)
 * 3. We calculate the total width of all tabs including gaps
 * 4. If total width exceeds container width:
 *    - We find the maximum number of tabs that fit
 *    - We reserve space for the "More" button
 *    - Remaining tabs go into the overflow array
 * 5. The "More" button only appears when there are overflow tabs
 */
export const OverflowTabs: React.FC<OverflowTabsProps> = ({
  tabs,
  activeTabId,
  onTabChange,
  className = '',
  tabGap = 8,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const moreButtonRef = useRef<HTMLButtonElement>(null)

  const {
    visibleTabs,
    overflowTabs,
    isOverflowing,
    registerTabRef,
  } = useOverflowTabs(tabs, containerRef, {
    tabGap,
    moreButtonPadding: 48, // Extra padding for the "More" button
    alwaysShowAtLeastOne: true,
  })

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target as Node) &&
        moreButtonRef.current &&
        !moreButtonRef.current.contains(event.target as Node)
      ) {
        setIsMoreOpen(false)
      }
    }

    if (isMoreOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMoreOpen])

  // Close dropdown on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMoreOpen) {
        setIsMoreOpen(false)
        moreButtonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isMoreOpen])

  const handleMoreToggle = useCallback(() => {
    setIsMoreOpen((prev) => !prev)
  }, [])

  // Handle keyboard navigation within the dropdown
  const handleDropdownKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        const firstItem = moreMenuRef.current?.querySelector<HTMLElement>(
          '[data-overflow-item]'
        )
        firstItem?.focus()
      }
    },
    []
  )

  // Base tab styles - consistent with enterprise dashboard aesthetic
  const getTabStyles = (isActive: boolean) => {
    const baseStyles =
      'relative px-5 py-3 text-[12px] font-semibold tracking-tight transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset whitespace-nowrap'

    if (isActive) {
      return `${baseStyles} text-accent bg-surface-muted border-b-2 border-accent`
    }

    return `${baseStyles} text-text-secondary hover:text-text-primary hover:bg-surface-muted/50 border-b-2 border-transparent`
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center bg-surface border-b border-border-default ${className}`}
    >
      {/* Primary tabs row */}
      <div className="flex items-stretch overflow-hidden">
        {visibleTabs.map((tab) => (
          <Button
            variant="unstyled"
            key={tab.id}
            ref={(el) => registerTabRef(tab.id, el)}
            onClick={() => onTabChange(tab.id)}
            className={getTabStyles(activeTabId === tab.id)}
            aria-current={activeTabId === tab.id ? 'page' : undefined}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Overflow "More" button and dropdown */}
      {isOverflowing && (
        <div className="relative ml-auto shrink-0">
          <Button
            variant="unstyled"
            ref={moreButtonRef}
            onClick={handleMoreToggle}
            onKeyDown={handleDropdownKeyDown}
            className={`
              flex items-center gap-1.5 px-4 py-3 text-[12px] font-semibold
              text-text-secondary hover:text-text-primary
              bg-surface hover:bg-surface-muted/50
              border-b-2 border-transparent
              transition-all duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset
              ${isMoreOpen ? 'bg-surface-muted text-text-primary border-b-2 border-surface' : ''}
            `}
            aria-expanded={isMoreOpen}
            aria-haspopup="true"
          >
            <MoreHorizontal className="w-4 h-4" />
            <span>More</span>
            {isMoreOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </Button>

          {/* Floating dropdown menu */}
          {isMoreOpen && (
            <div
              ref={moreMenuRef}
              className="
                absolute right-0 top-full mt-1
                min-w-45 max-w-70
                bg-surface border border-border-default
                rounded-lg shadow-xl shadow-slate-900/10
                z-50 overflow-hidden
                animate-in fade-in slide-in-from-top-2 duration-150
              "
              role="menu"
              aria-orientation="vertical"
            >
              <div className="py-1">
                {overflowTabs.map((tab) => (
                  <Button
                    variant="unstyled"
                    key={tab.id}
                    data-overflow-item
                    tabIndex={0}
                    onClick={() => {
                      onTabChange(tab.id)
                      setIsMoreOpen(false)
                      moreButtonRef.current?.focus()
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5
                      text-[13px] font-medium
                      transition-all duration-150
                      focus:outline-none focus-visible:bg-surface-muted
                      ${
                        activeTabId === tab.id
                          ? 'text-accent bg-surface-muted'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted'
                      }
                    `}
                    role="menuitem"
                  >
                    {/* Active indicator */}
                    {activeTabId === tab.id && (
                      <div className="w-1 h-1 rounded-full bg-accent shrink-0" />
                    )}
                    <span className={activeTabId === tab.id ? '' : 'pl-4'}>
                      {tab.label}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Spacer to push any right-side content if no overflow */}
      {!isOverflowing && <div className="flex-1" />}
    </div>
  )
}

export { type TabItem } from './useOverflowTabs'