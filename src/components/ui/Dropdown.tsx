import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface DropdownItem {
  id: string | number
  label: string
  description?: string
  icon?: LucideIcon
  metadata?: string
}

interface DropdownProps {
  items: DropdownItem[]
  selectedId?: string | number
  onSelect: (id: string | number) => void
  placeholder?: string
  label?: string
  icon?: LucideIcon
  className?: string
  disabled?: boolean
  align?: 'left' | 'right'
  variant?: 'pill' | 'outline' | 'ghost'
  direction?: 'up' | 'down'
}

export const Dropdown: React.FC<DropdownProps> = ({
  items,
  selectedId,
  onSelect,
  placeholder = 'Select...',
  label,
  icon: Icon,
  className = '',
  disabled = false,
  align = 'left',
  variant = 'pill',
  direction = 'down',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedItem = items.find((item) => item.id === selectedId)

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setIsOpen(!isOpen)
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const menuVariants = {
    pill: 'bg-surface-muted/50 hover:bg-surface-muted border border-border-default rounded-full',
    outline:
      'bg-surface border border-border-default rounded-lg hover:border-accent/50 shadow-sm',
    ghost:
      'bg-transparent hover:bg-surface-muted/40 border-none rounded-xl hover:shadow-sm',
  }

  const positionClasses =
    direction === 'up'
      ? 'bottom-full mb-2 origin-bottom'
      : 'top-full mt-2 origin-top'

  return (
    <div ref={containerRef} className={`relative shrink-0 ${className}`}>
      {/* Trigger */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`
          group flex items-center gap-2 px-3 py-1.5 transition-all cursor-pointer select-none outline-none
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${menuVariants[variant]}
          ${isOpen ? 'ring-2 ring-accent/10 shadow-lg' : ''}
        `}
      >
        {Icon && (
          <Icon className="w-3.5 h-3.5 text-text-muted group-hover:text-accent transition-colors" />
        )}
        <div className="flex flex-col min-w-0">
          {label && (
            <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest leading-none mb-0.5">
              {label}
            </span>
          )}
          <span className="text-[11px] font-bold text-text-secondary group-hover:text-text-primary uppercase tracking-wider transition-colors truncate">
            {selectedItem ? selectedItem.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-3 h-3 text-text-muted shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Menu */}
      {isOpen && (
        <div
          className={`
            absolute z-100 min-w-60 max-w-[320px]
            bg-surface/95 backdrop-blur-xl border border-border-default rounded-2xl shadow-xl overflow-hidden
            animate-in fade-in zoom-in-95 duration-200
            ${positionClasses}
            ${align === 'right' ? 'right-0' : 'left-0'}
          `}
        >
          <div className="max-h-75 overflow-y-auto py-2 custom-scrollbar">
            {items.map((item) => {
              const ItemIcon = item.icon
              const isSelected = item.id === selectedId

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelect(item.id)
                    setIsOpen(false)
                  }}
                  className={`
                    flex flex-col px-4 py-2.5 cursor-pointer transition-all mx-1.5 rounded-xl mb-1 last:mb-0
                    ${
                      isSelected
                        ? 'bg-accent text-white shadow-lg shadow-accent/20 scale-[0.98]'
                        : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    {ItemIcon && (
                      <ItemIcon
                        className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white/70' : 'text-text-muted'}`}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider`}
                        >
                          {item.label}
                        </span>
                        {item.metadata && (
                          <span
                            className={`text-[9px] font-mono shrink-0 ${isSelected ? 'text-white/40' : 'text-text-muted/80'}`}
                          >
                            {item.metadata}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p
                          className={`text-[10px] leading-tight mt-0.5 ${isSelected ? 'text-white/60' : 'text-text-muted'}`}
                        >
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {items.length === 0 && (
            <div className="px-4 py-4 text-center">
              <span className="text-[10px] font-medium text-text-muted uppercase tracking-widest">
                No options available
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
