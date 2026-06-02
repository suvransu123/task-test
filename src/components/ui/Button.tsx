import React from 'react'
import { clsx } from 'clsx'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual style. Use `unstyled` to opt out of the design-system chrome and
   * supply your own classes via `className` (handy for icon-only toolbar
   * buttons, tabs, pills, etc. that don't map onto a standard variant).
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'unstyled'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  isLoading?: boolean
}

const VARIANTS: Record<'primary' | 'secondary' | 'outline' | 'ghost', string> = {
  primary: 'bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm',
  secondary: 'bg-surface-muted text-text-primary hover:bg-surface-hover border border-border-default',
  outline: 'border border-border-default bg-transparent hover:bg-surface-muted text-text-primary',
  ghost: 'bg-transparent hover:bg-surface-muted text-text-secondary hover:text-text-primary',
}

const SIZES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

const BASE_STYLES =
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/30 disabled:pointer-events-none disabled:opacity-50'

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      className = '',
      disabled,
      ...props
    },
    ref,
  ) => {
    // `unstyled` emits only the caller's className so custom buttons render
    // exactly as before — no competing base/variant/size utilities.
    const composedClassName =
      variant === 'unstyled'
        ? className
        : clsx(BASE_STYLES, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className)

    return (
      <button
        ref={ref}
        className={composedClassName}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : null}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
