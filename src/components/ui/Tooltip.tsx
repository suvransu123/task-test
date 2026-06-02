import React, { useState, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'

interface TooltipProps {
  /** The trigger element */
  children: ReactNode
  /** The content to display in the tooltip */
  content: ReactNode
  /** Position of the tooltip relative to the trigger */
  position?: 'top' | 'bottom' | 'left' | 'right'
  /** Delay before showing the tooltip (ms) */
  delay?: number
  /** Additional className for the tooltip */
  className?: string
  /** Whether the tooltip is enabled */
  enabled?: boolean
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'right',
  delay = 150,
  className = '',
  enabled = true,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showTooltip = () => {
    if (!enabled) return
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        const tooltipRect = tooltipRef.current?.getBoundingClientRect()

        let x = 0
        let y = 0

        switch (position) {
          case 'top':
            x = rect.left + rect.width / 2 - (tooltipRect?.width ?? 0) / 2
            y = rect.top - (tooltipRect?.height ?? 0) - 8
            break
          case 'bottom':
            x = rect.left + rect.width / 2 - (tooltipRect?.width ?? 0) / 2
            y = rect.bottom + 8
            break
          case 'left':
            x = rect.left - (tooltipRect?.width ?? 0) - 8
            y = rect.top + rect.height / 2 - (tooltipRect?.height ?? 0) / 2
            break
          case 'right':
          default:
            x = rect.right + 8
            y = rect.top + rect.height / 2 - (tooltipRect?.height ?? 0) / 2
            break
        }

        // Clamp to viewport
        if (tooltipRect) {
          x = Math.max(8, Math.min(x, window.innerWidth - tooltipRect.width - 8))
          y = Math.max(8, Math.min(y, window.innerHeight - tooltipRect.height - 8))
        }

        setCoords({ x, y })
        setIsVisible(true)
      }
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsVisible(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        className="inline-flex"
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          style={{
            position: 'fixed',
            left: coords.x,
            top: coords.y,
            zIndex: 9999,
          }}
          className={`
            animate-in fade-in zoom-in-95 duration-150
            ${className}
          `}
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
        >
          {content}
        </div>
      )}
    </>
  )
}

// ─── Popover Component ────────────────────────────────────────────────────────

interface PopoverProps {
  /** The trigger element */
  trigger: ReactNode
  /** The content to display in the popover */
  children: ReactNode
  /** Whether the popover is open (controlled) */
  isOpen?: boolean
  /** Callback when open state changes */
  onOpenChange?: (isOpen: boolean) => void
  /** Position of the popover */
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  /** Additional className for the popover content */
  className?: string
}

export const Popover: React.FC<PopoverProps> = ({
  trigger,
  children,
  isOpen: controlledIsOpen,
  onOpenChange,
  position = 'center',
  className = '',
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const isControlled = controlledIsOpen !== undefined

  const isOpen = isControlled ? controlledIsOpen : internalIsOpen

  const updatePosition = () => {
    if (triggerRef.current && popoverRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const popoverRect = popoverRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let x = 0
      let y = 0

      switch (position) {
        case 'top':
          x = rect.left + rect.width / 2 - popoverRect.width / 2
          y = rect.top - popoverRect.height - 8
          break
        case 'bottom':
          x = rect.left + rect.width / 2 - popoverRect.width / 2
          y = rect.bottom + 8
          break
        case 'left':
          x = rect.left - popoverRect.width - 8
          y = rect.top + rect.height / 2 - popoverRect.height / 2
          break
        case 'right':
          x = rect.right + 8
          y = rect.top + rect.height / 2 - popoverRect.height / 2
          break
        case 'center':
        default:
          x = rect.left + rect.width / 2 - popoverRect.width / 2
          y = rect.top + rect.height / 2 - popoverRect.height / 2
          break
      }

      // Clamp to viewport
      x = Math.max(8, Math.min(x, viewportWidth - popoverRect.width - 8))
      y = Math.max(8, Math.min(y, viewportHeight - popoverRect.height - 8))

      setCoords({ x, y })
    }
  }

  const handleToggle = () => {
    if (isControlled) {
      onOpenChange?.(!isOpen)
    } else {
      if (!internalIsOpen) {
        updatePosition()
      }
      setInternalIsOpen(!internalIsOpen)
    }
  }

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        if (isControlled) {
          onOpenChange?.(false)
        } else {
          setInternalIsOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, isControlled, onOpenChange])

  return (
    <>
      <div ref={triggerRef} onClick={handleToggle}>
        {trigger}
      </div>

      {isOpen && (
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            left: coords.x,
            top: coords.y,
            zIndex: 9999,
          }}
          className={`
            animate-in fade-in zoom-in-95 duration-150
            ${className}
          `}
        >
          {children}
        </div>
      )}
    </>
  )
}
