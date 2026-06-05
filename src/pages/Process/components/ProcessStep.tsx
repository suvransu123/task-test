import React from 'react'
import { useScrollAnimation } from '../../../hooks/useScrollAnimation'

export interface ProcessStepData {
  step: number
  tag: string
  title: string
  description: string
  details: string[]
  visual: React.ReactNode
  isDark?: boolean
  image?: string
  imageClass?: string
  containerClass?: string
}

interface ProcessStepProps {
  data: ProcessStepData
  /** Alternates left/right layout for each step */
  isReversed: boolean
}

export const ProcessStep: React.FC<ProcessStepProps> = ({
  data,
  isReversed,
}) => {
  const { ref, isVisible } = useScrollAnimation<HTMLElement>({
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px',
  })

  return (
    <article
      ref={ref}
      className={`process-step ${isReversed ? 'process-step--reversed' : ''} ${isVisible ? 'is-visible' : ''}`}
      aria-labelledby={`step-${data.step}-heading`}
    >
      {/* ── Text side ── */}
      <div className="process-step-text">
        <div className="process-step-meta">
          <span className="process-step-number">STEP {data.step}</span>
          <span className="process-step-tag">{data.tag}</span>
        </div>

        <h2 id={`step-${data.step}-heading`} className="process-step-title">
          {data.title}
        </h2>

        <p className="process-step-description">{data.description}</p>

        <ul className="process-step-details" role="list">
          {data.details.map((detail) => (
            <li key={detail} className="process-step-detail-item">
              <span className="process-step-detail-icon" aria-hidden="true">
                ✓
              </span>
              {detail}
            </li>
          ))}
        </ul>
      </div>

      {/* ── Visual side ── */}
      <div className={`relative ${data.containerClass || 'bg-slate-900'} rounded-2xl pt-0 px-6 pb-0 overflow-hidden flex items-end justify-center group transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(99,102,241,0.15)]`}>

        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 shadow-sm" />
        <img
          className={`relative mt-7 w-full aspect-video object-cover rounded-t-lg border border-white/10 shadow transition-all duration-700 ease-out group-hover:scale-[1.03] origin-bottom ${data.imageClass || ''}`}
          src={data.image} alt={data.title}
        />
      </div>
    </article>
  )
}