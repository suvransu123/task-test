import React from 'react'

interface SocialButtonProps {
  icon: React.ReactNode
  onClick?: () => void
  className?: string
  label?: string
  isLoading?: boolean
}

export const SocialButton: React.FC<SocialButtonProps> = ({
  icon,
  onClick,
  className = '',
  label,
  isLoading = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`flex items-center justify-center h-12 w-full max-w-35 border border-border-default rounded-lg hover:bg-surface-muted hover:border-accent transition-colors ${className}`}
    >
      <div className="w-5 h-5 flex items-center justify-center">
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-border-default border-t-accent rounded-full animate-spin" />
        ) : (
          icon
        )}
      </div>
      {label && !isLoading && (
        <span className="ml-2 text-sm text-text-secondary">{label}</span>
      )}
    </button>
  )
}
