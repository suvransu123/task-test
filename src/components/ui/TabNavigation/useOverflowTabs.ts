import { useState, useEffect, useRef, useCallback } from 'react'

export interface TabItem {
  id: string
  label: string
}

export interface OverflowTabsOptions {
  /**
   * Gap between tabs in pixels (from Tailwind gap utilities).
   * Used for calculating total tab width.
   * Default: 8px (gap-2)
   */
  tabGap?: number
  /**
   * Padding of the "More" button in pixels.
   * Default: 32px (px-8, 8px left + 8px right)
   */
  moreButtonPadding?: number
  /**
   * Whether to always keep at least one tab visible even if none fit.
   * Default: true
   */
  alwaysShowAtLeastOne?: boolean
}

/**
 * Hook that calculates which tabs should be visible and which should
 * be hidden in an overflow menu, based on container and tab widths.
 *
 * @param tabs - Array of tab items
 * @param containerRef - Ref to the container element
 * @param options - Configuration options
 * @returns Object containing visibleTabs, overflowTabs, and isOverflowing
 */
export function useOverflowTabs(
  tabs: TabItem[],
  containerRef: React.RefObject<HTMLElement | null>,
  options: OverflowTabsOptions = {}
) {
  const {
    tabGap = 8,
    moreButtonPadding = 32,
    alwaysShowAtLeastOne = true,
  } = options

  const [visibleTabs, setVisibleTabs] = useState<TabItem[]>(tabs)
  const [overflowTabs, setOverflowTabs] = useState<TabItem[]>([])
  const [isOverflowing, setIsOverflowing] = useState(false)

  // Refs for tab elements - we need to measure each tab's width
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  const registerTabRef = useCallback((id: string, element: HTMLButtonElement | null) => {
    if (element) {
      tabRefs.current.set(id, element)
    } else {
      tabRefs.current.delete(id)
    }
  }, [])

  const calculateOverflow = useCallback(() => {
    if (!containerRef.current || tabs.length === 0) {
      setVisibleTabs(tabs)
      setOverflowTabs([])
      setIsOverflowing(false)
      return
    }

    const containerWidth = containerRef.current.clientWidth
    const tabElements = tabRefs.current

    // If we have no measured tabs yet, show all tabs (no overflow calculation)
    if (tabElements.size === 0) {
      setVisibleTabs(tabs)
      setOverflowTabs([])
      setIsOverflowing(false)
      return
    }

    // Sum up widths of all tabs + gaps between them
    // We always show the "More" button space estimation if any tab would overflow
    let totalTabsWidth = 0
    const tabWidths: Map<string, number> = new Map()

    tabs.forEach((tab, index) => {
      const element = tabElements.get(tab.id)
      if (element) {
        // Get the actual rendered width of the tab button
        const width = element.offsetWidth
        tabWidths.set(tab.id, width)
        totalTabsWidth += width

        // Add gap (except for last tab)
        if (index < tabs.length - 1) {
          totalTabsWidth += tabGap
        }
      }
    })

    // Check if any tabs overflow the container
    // We need to reserve space for the "More" button if we have overflow
    const hasOverflow = totalTabsWidth > containerWidth

    if (!hasOverflow) {
      // No overflow - show all tabs
      setVisibleTabs(tabs)
      setOverflowTabs([])
      setIsOverflowing(false)
      return
    }

    // Find how many tabs can fit while leaving room for the "More" button
    // The "More" button needs space for its content + padding
    const moreButtonWidth = 60 + moreButtonPadding // Estimate: 60px for text + padding

    let accumulatedWidth = 0
    let fittingTabCount = 0

    for (let i = 0; i < tabs.length; i++) {
      const tabWidth = tabWidths.get(tabs[i].id) || 0
      const nextGap = i < tabs.length - 1 ? tabGap : 0

      // Check if this tab would fit with the "More" button
      const wouldFit =
        accumulatedWidth + tabWidth + nextGap + moreButtonWidth <= containerWidth

      if (wouldFit) {
        accumulatedWidth += tabWidth + nextGap
        fittingTabCount++
      } else {
        break
      }
    }

    // Ensure at least one tab is visible if alwaysShowAtLeastOne is true
    if (fittingTabCount === 0 && alwaysShowAtLeastOne && tabs.length > 0) {
      fittingTabCount = 1
    }

    const visible = tabs.slice(0, fittingTabCount)
    const overflow = tabs.slice(fittingTabCount)

    setVisibleTabs(visible)
    setOverflowTabs(overflow)
    setIsOverflowing(overflow.length > 0)
  }, [tabs, containerRef, tabGap, moreButtonPadding, alwaysShowAtLeastOne])

  // Recalculate when tabs or container size changes
  useEffect(() => {
    calculateOverflow()

    // Also set up ResizeObserver on the container
    const container = containerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver(() => {
      // Use requestAnimationFrame to avoid layout thrashing during rapid resize
      requestAnimationFrame(() => {
        calculateOverflow()
      })
    })

    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [calculateOverflow, containerRef])

  return {
    visibleTabs,
    overflowTabs,
    isOverflowing,
    registerTabRef,
    recalculate: calculateOverflow,
  }
}