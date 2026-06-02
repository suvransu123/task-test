import React from 'react'
import { MoreHorizontal, FolderKanban } from 'lucide-react'
import { Button } from './Button'

interface ProjectCardProps {
  title: string
  subtitle: string
  updatedAt: string
  icon?: React.ReactNode
  avatars?: string[]
  onClick?: () => void
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  title,
  subtitle,
  updatedAt,
  icon,
  avatars = [],
  onClick,
}) => {
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
          {icon || <FolderKanban className="w-6 h-6" />}
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
          {title}
        </h3>
        <p className="text-sm text-text-secondary font-normal leading-relaxed line-clamp-2">
          {subtitle}
        </p>
      </div>

      {/* Footer with status badge and timestamp */}
      <div className="mt-4 pt-3 border-t border-border-default flex justify-between items-center relative z-10">
        <span className="text-xs font-medium text-text-muted">
          Updated {updatedAt}
        </span>
        <div className="flex -space-x-2">
          {avatars.length > 0 ? (
            avatars.slice(0, 4).map((url, i) => (
              <img
                key={i}
                src={url}
                alt="Team member"
                className="w-7 h-7 rounded-full border-2 border-surface bg-surface-muted shadow-sm"
              />
            ))
          ) : (
            <div className="w-7 h-7 rounded-full bg-surface-muted border-2 border-surface shadow-sm flex items-center justify-center">
              <span className="text-[8px] font-bold text-text-muted">OS</span>
            </div>
          )}
          {avatars.length > 3 && (
            <div className="w-7 h-7 rounded-full bg-accent/20 border-2 border-surface flex items-center justify-center">
              <span className="text-[10px] font-bold text-accent">
                +{avatars.length - 2}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}