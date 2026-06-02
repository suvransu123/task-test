import React from 'react'
import { Plus } from 'lucide-react'
import { Button } from './Button'

interface CreateProjectCardProps {
  label?: string
  onClick?: () => void
}

export const CreateProjectCard: React.FC<CreateProjectCardProps> = ({
  label = 'Create New Project',
  onClick,
}) => {
  return (
    <Button
      variant="unstyled"
      onClick={onClick}
      className="border-2 border-dashed border-border-default rounded-3xl p-4 flex flex-col items-center justify-center gap-3 hover:border-accent hover:bg-surface-muted/30 transition-all duration-200 cursor-pointer group min-h-40"
    >
      <div className="icon-wrapper w-12 h-12 rounded-2xl bg-surface-muted border border-border-default flex items-center justify-center text-text-muted group-hover:bg-accent group-hover:text-white transition-all shadow-sm">
        <Plus className="w-6 h-6" />
      </div>
      <span className="text-xs font-bold text-text-muted uppercase tracking-widest group-hover:text-accent transition-colors">
        {label}
      </span>
    </Button>
  )
}