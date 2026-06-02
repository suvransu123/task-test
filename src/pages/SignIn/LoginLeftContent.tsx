import React from 'react'
import { Logo } from '../../components/ui/Logo'

const FEATURES = [
  'Enterprise-grade security and compliance',
  'Automated infrastructure provisioning',
  'Real-time system observability',
]

export const LoginLeftContent: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="scale-125 origin-left">
        <Logo />
      </div>

      <div className="mt-24 space-y-8 animate-in fade-in slide-in-from-left-6 duration-1000">
        <div>
          <span className="text-[10px] font-black tracking-[0.3em] text-[#C084FC] uppercase opacity-80 mb-6 block">
            Intelligence Platform
          </span>
          <h1 className="text-5xl font-black leading-[1.1] text-white tracking-tight font-display mb-6">
            Software Systems,
            <br />
            <span className="text-white/40">Architected by Intelligence.</span>
          </h1>
          <p className="text-[17px] text-white/50 leading-relaxed max-w-lg font-medium">
            EngineerOS integrates architecture, development, and SRE into a
            unified operating system for modern software organizations.
          </p>
        </div>

        <ul className="space-y-6 pt-4">
          {FEATURES.map((feature, index) => (
            <li
              key={index}
              className="flex items-center gap-4 text-white/80 font-semibold group/item"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-surface/5 border border-white/10 group-hover/item:border-[#7C3AED]/50 group-hover/item:bg-surface/10 transition-all duration-300">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 text-[#C084FC]"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="text-[15px] tracking-tight">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto text-[11px] font-black text-white/20 uppercase tracking-[0.4em]">
        © 2025 EngineerOS Systems • Executive Edition
      </div>
    </div>
  )
}
