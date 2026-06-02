import React from 'react'

interface LogoProps {
  className?: string
  showText?: boolean
  /** 'light' (default) renders dark text; 'dark' renders white text for use on dark backgrounds */
  theme?: 'light' | 'dark'
}

export const Logo: React.FC<LogoProps> = ({
  className,
  showText = true,
  theme = 'light',
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="w-8 h-8 bg-accent rounded-md flex items-center justify-center shrink-0">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <rect x="9" y="9" width="6" height="6" />
          <path d="M15 2v2" />
          <path d="M15 20v2" />
          <path d="M2 15h2" />
          <path d="M2 9h2" />
          <path d="M20 15h2" />
          <path d="M20 9h2" />
          <path d="M9 2v2" />
          <path d="M9 20v2" />
        </svg>
      </div>
      {showText && (
        <span
          className={`font-bold text-xl tracking-tight overflow-hidden whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-accent'
          }`}
        >
          EngineerOS
        </span>
      )}
    </div>
  )
}
