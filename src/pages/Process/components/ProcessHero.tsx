import React from 'react'
import { Link } from '@tanstack/react-router'

export const ProcessHero: React.FC = () => {
  return (
    <section className="process-hero" aria-labelledby="process-hero-heading">
      {/* Breadcrumb */}
      <nav className="process-breadcrumb" aria-label="Breadcrumb">
        <Link to="/public/landing" className="process-breadcrumb-link">
          ← Back to Platform
        </Link>
      </nav>

      {/* Eyebrow */}
      <p className="process-eyebrow">HOW IT WORKS</p>

      <h1 id="process-hero-heading" className="process-hero-title">
        From Idea to Production,{' '}
        <span className="process-hero-title--accent">Seamlessly</span>
      </h1>

      <p className="process-hero-subtitle">
        EngineerOS connects your vision to a structured five-stage pipeline —
        combining AI-driven architecture planning with fractional expert teams
        to deliver production-grade systems at unprecedented speed.
      </p>

      {/* Timeline indicator */}
      <div className="process-timeline-bar" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <React.Fragment key={n}>
            <span className="process-timeline-dot">
              <span className="process-timeline-dot-inner" />
            </span>
            {n < 5 && <span className="process-timeline-line" />}
          </React.Fragment>
        ))}
      </div>
    </section>
  )
}
