import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from '@tanstack/react-router'
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Layers,
  Database,
  Zap,
} from 'lucide-react'
import { useHeader } from '../../context/HeaderContext'
import { SidebarSkeleton } from '../ui/Skeleton'
import { Button } from '../ui/Button'

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

const ICON_MAP: Record<string, any> = {
  Brief: FileText,
  Capabilities: Zap,
  'Technical Architecture': Layers,
  'Cost Estimation': Database,
}

// ─── Description Popup Component ───────────────────────────────────────────────

interface DescriptionPopupProps {
  projectName: string
  projectDescription: string
  onClose: () => void
}

export const DescriptionPopup: React.FC<DescriptionPopupProps> = ({
  projectName,
  projectDescription,
  onClose,
}) => {
  // Center the popup on screen
  const popupStyle: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '40vw',
    maxWidth: '600px',
    minWidth: '320px',
    zIndex: 9999,
  }

  const popupContent = (
    <div
      style={popupStyle}
      className="bg-surface border border-border-default rounded-xl shadow-2xl overflow-hidden"
    >
      {/* Header with accent */}
      <div className="relative px-6 py-5 bg-linear-to-r from-accent/5 to-transparent border-b border-border-default">
        {/* Left accent bar */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />
        
        <div className="flex items-start justify-between pr-8">
          <div className="space-y-1">
            <div className="text-[11px] font-black uppercase tracking-widest text-text-muted">
              Project Name
            </div>
            <div className="text-[18px] font-bold text-text-primary leading-tight">
              {projectName}
            </div>
          </div>
        </div>
        
        {/* Close button */}
        <Button
          variant="unstyled"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-muted transition-all"
          aria-label="Close description"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </Button>
      </div>

      {/* Description Section */}
      <div className="px-6 py-5">
        <div className="text-[11px] font-black uppercase tracking-widest text-text-muted mb-3">
          Description
        </div>
        <div className="text-[14px] text-text-secondary leading-relaxed max-h-64 overflow-y-auto">
          {projectDescription ? (
            <p className="whitespace-pre-wrap">{projectDescription}</p>
          ) : (
            <p className="italic text-text-muted">No description provided</p>
          )}
        </div>
      </div>
    </div>
  )

  // Use portal to render at body level to avoid clipping
  return createPortal(popupContent, document.body)
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const { tabs, projectDetails } = useHeader()
  const location = useLocation()
  const isProjectPage = location.pathname.includes('/dashboard/projects/')
  const [isInitialized, setIsInitialized] = useState(false)
  const [showFallback, setShowFallback] = useState(false)

  // Description popup state - tracks click at the item level
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false)

  // Prevent flash of default navigation items during initialization
  useEffect(() => {
    if (isProjectPage) {
      // Give a brief moment for the project page tabs to be set
      const timer = setTimeout(() => {
        setIsInitialized(true)
        // Only show fallback if still no tabs after initialization
        setShowFallback(tabs.length === 0)
      }, 100)
      return () => clearTimeout(timer)
    } else {
      setIsInitialized(true)
      setShowFallback(false)
    }
  }, [isProjectPage, tabs.length])

  const defaultNavItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/dashboard/projects', label: 'Projects', icon: FolderKanban },
  ]

  // Show skeleton loading during initialization on project page
  if (isProjectPage && !isInitialized) {
    return (
      <aside
        className={`
          relative h-full bg-surface border-r border-border-default flex flex-col transition-all duration-300 ease-in-out z-40 shrink-0
          ${isCollapsed ? 'w-16' : 'w-52'}
        `}
      >
        <nav
          className={`flex-1 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden custom-scrollbar transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-3'}`}
        >
          <SidebarSkeleton collapsed={isCollapsed} />
        </nav>
        <div className="p-3 border-t border-border-default">
          <Button
            variant="unstyled"
            onClick={onToggle}
            className={`w-full flex items-center justify-center py-1.5 rounded-md text-text-muted hover:text-text-secondary hover:bg-surface-muted transition-all text-[10px] font-bold uppercase tracking-widest`}
          >
            {isCollapsed ? '›' : '‹'}
          </Button>
        </div>
      </aside>
    )
  }

  const displayItems =
    isProjectPage && tabs.length > 0
      ? tabs
      : showFallback
      ? defaultNavItems.map((item) => ({
          id: item.to,
          label: item.label,
          icon: item.icon,
          active: location.pathname === item.to,
          onClick: () => {},
          link: item.to,
        }))
      : defaultNavItems.map((item) => ({
          id: item.to,
          label: item.label,
          icon: item.icon,
          active: location.pathname === item.to,
          onClick: () => {},
          link: item.to,
        }))

  return (
    <aside
      className={`
        relative h-full bg-surface border-r border-border-default flex flex-col transition-all duration-300 ease-in-out z-40 shrink-0
        ${isCollapsed ? 'w-16' : 'w-52'}
      `}
    >
      

      {isProjectPage && isCollapsed && (
        <div className="flex justify-center py-4 border-b border-border-default">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      <nav
        className={`flex-1 py-4 overflow-y-auto overflow-x-hidden custom-scrollbar transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-3'}`}
      >
        {displayItems.map((item: any) => {
          const Icon = item.icon || ICON_MAP[item.label] || FileText
          const isActive = item.active
          const isDescription = item.id === 'Description'

          // Add spacer after Description item (first item)
          const needsSpacer = isDescription

          return (
            <React.Fragment key={item.id}>
              {/* Description popup overlay - rendered OUTSIDE the menu item */}
              {isDescription && isDescriptionOpen && (
                <div
                  className="fixed inset-0 z-9998 bg-black/20 backdrop-blur-sm flex items-center justify-center"
                  onClick={() => setIsDescriptionOpen(false)}
                >
                  <div onClick={(e) => e.stopPropagation()}>
                    <DescriptionPopup
                      projectName={projectDetails?.name || 'Untitled Project'}
                      projectDescription={projectDetails?.description || ''}
                      onClose={() => setIsDescriptionOpen(false)}
                    />
                  </div>
                </div>
              )}

              {/* Menu item - only handles Description click, delegates to item.onClick for others */}
              <div
                className={`
                flex items-center rounded-md transition-all group relative cursor-pointer text-[13px]
                ${
                  isActive
                    ? 'bg-surface-muted text-accent font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted font-medium'
                }
                ${isCollapsed ? 'justify-center h-10 w-10 mx-auto px-0' : 'gap-2.5 px-3 py-2.5'}
                ${needsSpacer ? 'mb-2' : ''}
              `}
                onClick={(e) => {
                  if (isDescription) {
                    e.stopPropagation()
                    setIsDescriptionOpen(true)
                  }
                  // Call the item's onClick handler (for tab switching)
                  item.onClick?.()
                }}
              >
                {/* Info icon for Description item */}
                {isDescription ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`w-4 h-4 shrink-0 ${isActive ? 'text-accent' : 'text-text-muted group-hover:text-text-secondary'}`}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                ) : (
                  <Icon
                    className={`w-4 h-4 shrink-0 ${isActive ? 'text-accent' : 'text-text-muted group-hover:text-text-secondary'}`}
                  />
                )}
                {!isCollapsed && (
                  <span className="leading-none">{item.label}</span>
                )}

                {/* Collapsed tooltip */}
                {isCollapsed && !isDescription && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-accent text-white text-[10px] uppercase tracking-widest font-black rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-60 shadow-xl">
                    {item.label}
                  </div>
                )}
              </div>

              {/* Horizontal divider after Description item */}
              {needsSpacer && !isCollapsed && (
                <div className="h-px mx-3 bg-border-default mb-1" />
              )}
            </React.Fragment>
          )
        })}
      </nav>

      {/* Collapse toggle — subtle arrow at bottom */}
      <div className="p-3 border-t border-border-default">
        <Button
          variant="unstyled"
          onClick={onToggle}
          className={`w-full flex items-center justify-center py-1.5 rounded-md text-text-muted hover:text-text-secondary hover:bg-surface-muted transition-all text-[10px] font-bold uppercase tracking-widest`}
        >
          {isCollapsed ? '›' : '‹'}
        </Button>
      </div>
    </aside>
  )
}
