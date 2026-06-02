import React from 'react'

interface LoginLayoutProps {
  leftContent: React.ReactNode
  rightContent: React.ReactNode
}

export const LoginLayout: React.FC<LoginLayoutProps> = ({
  leftContent,
  rightContent,
}) => {
  return (
    <div className="flex min-h-screen bg-surface font-sans">
      {/* Left Pane (Desktop Branding) - Deep gradient from indigo to purple */}
      <div className="hidden lg:flex flex-col w-[55%] bg-linear-to-br from-[#1e1b4b] via-[#2e1065] to-[#4c1d95] p-20 justify-between relative overflow-hidden group">
        {/* Abstract Background Elements */}
        <div className="absolute top-[-15%] right-[-15%] w-175 h-175 bg-[#7C3AED]/20 rounded-full blur-[140px] pointer-events-none group-hover:bg-[#7C3AED]/30 transition-all duration-1000" />
        <div className="absolute bottom-[-10%] left-[-10%] w-125 h-125 bg-[#C084FC]/10 rounded-full blur-[120px] pointer-events-none group-hover:bg-[#C084FC]/20 transition-all duration-1000" />
        {/* Additional accent glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 bg-[#5E43FB]/10 rounded-full blur-[180px] pointer-events-none opacity-50" />

        <div className="relative z-10 h-full flex flex-col">{leftContent}</div>
      </div>

      {/* Right Pane (Utility/Forms) */}
      <div className="flex-1 flex flex-col p-8 lg:p-20 justify-center items-center relative bg-surface animate-in slide-in-from-right-4 duration-700">
        <div className="w-full max-w-md">{rightContent}</div>
      </div>
    </div>
  )
}
