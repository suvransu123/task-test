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
      <div
        className={`process-step-visual ${data.isDark ? 'process-step-visual--dark' : ''}`}
      >
        {data.visual}
      </div>
    </article>
  )
}