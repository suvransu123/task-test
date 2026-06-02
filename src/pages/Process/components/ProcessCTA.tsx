import React from 'react'
import { Link } from '@tanstack/react-router'
import { useScrollAnimation } from '../../../hooks/useScrollAnimation'

export const ProcessCTA: React.FC = () => {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({
    threshold: 0.3,
  })

  return (
    <section className="process-cta" aria-labelledby="process-cta-heading">
      <div
        ref={ref}
        className={`process-cta-inner ${isVisible ? 'is-visible' : ''}`}
      >
        <p className="process-cta-eyebrow">READY TO SHIP FASTER?</p>
        <h2 id="process-cta-heading" className="process-cta-title">
          Start your first project today
        </h2>
        <p className="process-cta-subtitle">
          Join teams already shipping at the speed of thought. Setup takes less
          than five minutes — no infrastructure required.
        </p>
        <div className="process-cta-actions">
          <Link
            to="/public/signup"
            className="landing-btn-primary landing-btn-lg"
            id="process-cta-signup-btn"
          >
            Get Started Free
          </Link>
          <Link
            to="/public/signin"
            className="landing-btn-outline landing-btn-lg"
            id="process-cta-signin-btn"
          >
            Sign In
          </Link>
        </div>
      </div>
    </section>
  )
}