import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  id,
  className = '',
  type,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`
  const isPassword = type === 'password'
  const inputType = isPassword && showPassword ? 'text' : type

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-text-secondary text-left"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type={inputType}
          className={`
            w-full px-3 py-2.5 border rounded-lg text-sm transition-colors 
            focus:outline-hidden focus:ring-2 focus:ring-accent/20 pr-10
            bg-surface border-border-default text-text-primary 
            placeholder:text-text-muted
            dark:bg-surface dark:border-border-default dark:text-text-primary
            ${error
              ? 'border-red-500 bg-red-50/50 dark:bg-red-500/10 dark:border-red-500'
              : 'focus:border-accent hover:border-border-hover'
            }
          `}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      {error ? (
        <span className="text-xs text-red-500 mt-1">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-text-muted mt-1">{helperText}</span>
      ) : null}
    </div>
  )
}
