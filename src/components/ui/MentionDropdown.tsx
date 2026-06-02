import React, { useEffect, useRef, useState } from 'react'

interface MentionDropdownProps {
  items: string[]
  query: string
  onSelect: (item: string) => void
  onDismiss: () => void
}

export const MentionDropdown: React.FC<MentionDropdownProps> = ({
  items,
  query,
  onSelect,
  onDismiss,
}) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)

  // Filter items by the current query (case-insensitive prefix match first, then contains)
  const filtered = React.useMemo(() => {
    if (!query) return items
    const q = query.toLowerCase()
    const prefix = items.filter((k) => k.toLowerCase().startsWith(q))
    const rest = items.filter(
      (k) => !k.toLowerCase().startsWith(q) && k.toLowerCase().includes(q),
    )
    return [...prefix, ...rest]
  }, [items, query])

  // Reset active index whenever filter changes
  useEffect(() => {
    setActiveIndex(0)
  }, [filtered.length, query])

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  // Global keydown handler for navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (filtered.length === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((prev) => (prev + 1) % filtered.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((prev) => (prev + filtered.length) % filtered.length)
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        onSelect(filtered[activeIndex])
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onDismiss()
      }
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () =>
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [filtered, activeIndex, onSelect, onDismiss])

  if (filtered.length === 0) return null

  /** Renders an item label with the matched query bolded */
  const renderHighlighted = (item: string, q: string) => {
    if (!q) return <span>{item}</span>
    const matchIdx = item.toLowerCase().indexOf(q.toLowerCase())
    if (matchIdx < 0) return <span>{item}</span>
    return (
      <>
        {matchIdx > 0 && <span>{item.slice(0, matchIdx)}</span>}
        <span className="text-accent font-bold">
          {item.slice(matchIdx, matchIdx + q.length)}
        </span>
        {matchIdx + q.length < item.length && (
          <span>{item.slice(matchIdx + q.length)}</span>
        )}
      </>
    )
  }

  return (
    <div
      className="absolute bottom-full left-0 right-0 mb-4 z-50 bg-surface/90 backdrop-blur-2xl rounded-[28px] shadow-xl border border-border-default overflow-hidden animate-in slide-in-from-bottom-2 duration-300"
      style={{ maxHeight: '280px' }}
    >
      <div className="px-6 py-4 bg-surface-muted/50 flex items-center justify-between relative shadow-sm">
        <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
          Knowledge Context
        </span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-surface-muted rounded-lg text-[9px] font-mono text-text-muted shadow-inner">
            ↑↓
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-surface-muted rounded-lg text-[9px] font-mono text-text-muted shadow-inner">
            ↵
          </div>
        </div>
      </div>
      <ul
        ref={listRef}
        className="overflow-y-auto max-h-55 py-2 scroll-smooth selection:bg-transparent"
        role="listbox"
        aria-label="Mention suggestions"
      >
        {filtered.map((item, idx) => {
          const isSelected = idx === activeIndex
          return (
            <li
              key={item}
              role="option"
              aria-selected={isSelected}
              onMouseDown={(e) => {
                e.preventDefault()
                onSelect(item)
              }}
              onMouseEnter={() => setActiveIndex(idx)}
              className={`
                flex items-center gap-4 px-6 py-3 cursor-pointer transition-all duration-300 mx-2 rounded-2xl
                font-bold text-[13px]
                ${
                  isSelected
                    ? 'bg-accent text-white shadow-lg shadow-accent/20 -translate-y-0.5'
                    : 'text-text-secondary hover:bg-surface-muted ring-inset'
                }
              `}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-surface/20 scale-110' : 'bg-surface-muted'}`}
              >
                <span
                  className={`text-[10px] font-black ${isSelected ? 'text-white' : 'text-text-muted'}`}
                >
                  @
                </span>
              </div>
              <div className="flex-1 truncate tracking-tight">
                {renderHighlighted(item, query)}
              </div>
            </li>
          )
        })}
      </ul>
      <div className="px-6 py-3 bg-surface-muted/50 border-t border-border-default">
        <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] block text-center">
          Matching {filtered.length} Source Documents
        </span>
      </div>
    </div>
  )
}
