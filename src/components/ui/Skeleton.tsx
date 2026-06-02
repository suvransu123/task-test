import React from 'react'

interface SkeletonProps {
  className?: string
  count?: number
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-linear-to-r from-surface-muted via-surface to-surface-muted bg-size-[200%_100%] animate-shimmer rounded ${className}`}
        />
      ))}
    </>
  )
}

// Sidebar skeleton for loading state
export const SidebarSkeleton: React.FC<{ collapsed?: boolean }> = ({ collapsed = false }) => {
  const items = [
    { width: 'w-32', height: 'h-10' },
    { width: 'w-36', height: 'h-10' },
    { width: 'w-44', height: 'h-10' },
    { width: 'w-40', height: 'h-10' },
  ]

  return (
    <div className="space-y-2 px-3">
      {items.map((_item, i) => (
        <div
          key={i}
          className={`
            ${collapsed ? 'w-10 h-10 mx-auto rounded-md' : 'h-10 rounded-md'}
            animate-pulse bg-linear-to-r from-surface-muted via-surface to-surface-muted bg-size-[200%_100%] animate-shimmer
          `}
        />
      ))}
    </div>
  )
}

// Card skeleton for project cards and similar elements
export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-surface border border-border-default rounded-3xl p-8 space-y-4">
      <div className="flex justify-between items-start">
        <div className="w-12 h-12 rounded-2xl bg-surface-muted animate-pulse" />
        <div className="w-6 h-6 rounded-full bg-surface-muted animate-pulse" />
      </div>
      <div className="space-y-3">
        <div className="h-6 w-3/4 bg-surface-muted rounded animate-pulse" />
        <div className="h-4 w-full bg-surface-muted rounded animate-pulse" />
        <div className="h-4 w-2/3 bg-surface-muted rounded animate-pulse" />
      </div>
      <div className="pt-4 border-t border-border-default">
        <div className="h-4 w-24 bg-surface-muted rounded animate-pulse" />
      </div>
    </div>
  )
}

// Table row skeleton
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 4 }) => {
  return (
    <tr className="border-b border-border-default">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-4 px-4">
          <div className={`h-4 bg-surface-muted rounded animate-pulse ${i === 0 ? 'w-16' : 'w-full'}`} />
        </td>
      ))}
    </tr>
  )
}

// Tab skeleton
export const TabSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="flex gap-2 overflow-x-auto border-b border-border-default mb-8 pb-1">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-2 px-4 py-3"
        >
          <div className="w-4 h-4 bg-surface-muted rounded animate-pulse" />
          <div className="h-4 bg-surface-muted rounded animate-pulse" style={{ width: `${60 + (i * 10) % 40}px` }} />
        </div>
      ))}
    </div>
  )
}

// Metric card skeleton
export const MetricSkeleton: React.FC = () => {
  return (
    <div className="bg-surface border border-border-default rounded-xl p-5 shadow-[0_1px_3px_rgba(15,15,15,0.08)] space-y-2">
      <div className="h-4 w-24 bg-surface-muted rounded animate-pulse" />
      <div className="h-8 w-16 bg-surface-muted rounded animate-pulse" />
      <div className="h-3 w-20 bg-surface-muted rounded animate-pulse" />
    </div>
  )
}

// Content block skeleton for main content areas
export const ContentSkeleton: React.FC<{ lines?: number; heading?: boolean }> = ({ 
  lines = 5, 
  heading = true 
}) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {heading && (
        <>
          <div className="space-y-2">
            <div className="h-8 w-48 bg-surface-muted rounded animate-pulse" />
            <div className="h-4 w-80 bg-surface-muted rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
          </div>
        </>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i} 
            className="h-4 bg-surface-muted rounded animate-pulse" 
            style={{ width: `${70 + (i * 15) % 30}%` }}
          />
        ))}
      </div>
    </div>
  )
}