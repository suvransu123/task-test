import React from 'react'
import { MoreHorizontal, FolderKanban } from 'lucide-react'
import { Button } from './Button'
import type { Workspace } from '../../services/workspace.service'

interface WorkspaceCardProps {
  workspace: Workspace
  onClick?: () => void
}

/**
 * Formats an ISO date string into a human-readable relative time.
 */
function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return `${Math.floor(diffDays / 30)}mo ago`
}

export const WorkspaceCard: React.FC<WorkspaceCardProps> = ({
  workspace,
  onClick,
}) => {
  const projectCount = workspace.projects.length

  return (
    <div
      onClick={onClick}
      className="bg-surface border border-border-default rounded-3xl p-4 cursor-pointer transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg hover:border-accent/30 flex flex-col h-full relative overflow-hidden group"
    >
      {/* Decorative accent corner */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-bl-full translate-x-0 -translate-y-2 group-hover:bg-accent/10 transition-colors" />

      {/* Header with icon and menu */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="icon-wrapper w-12 h-12 rounded-2xl bg-surface-muted border border-border-default flex items-center justify-center text-text-secondary group-hover:bg-accent group-hover:text-white transition-all shadow-sm">
          <FolderKanban className="w-6 h-6" />
        </div>
        <Button
          variant="unstyled"
          className="text-text-muted hover:text-text-primary p-2 rounded-xl hover:bg-surface-muted transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 relative z-10">
        <h3
          className="text-lg font-semibold text-text-primary mb-2 line-clamp-1"
          style={{ letterSpacing: '-0.01em' }}
        >
          {workspace.name}
        </h3>
        <p className="text-sm text-text-secondary font-normal leading-relaxed line-clamp-2">
          {workspace.description}
        </p>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-border-default flex justify-between items-center relative z-10">
        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
          {projectCount} {projectCount === 1 ? 'project' : 'projects'}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
          <span className="text-xs font-medium text-text-muted">
            {formatRelativeTime(workspace.created_at)}
          </span>
        </div>
      </div>
    </div>
  )
}