/**
 * TabNavigation Components
 *
 * This module provides a responsive tab navigation system that automatically
 * handles overflow scenarios by collapsing tabs into a "More" dropdown menu.
 *
 * Components:
 * - OverflowTabs: Main tab component with dynamic overflow handling
 *
 * Hooks:
 * - useOverflowTabs: Hook for calculating which tabs should be visible/overflowed
 */

export { OverflowTabs } from './OverflowTabs'
export type { OverflowTabsProps } from './OverflowTabs'
export { useOverflowTabs } from './useOverflowTabs'
export type { TabItem, OverflowTabsOptions } from './useOverflowTabs'