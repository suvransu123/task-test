import React, { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'

export const HeroSection: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section
      className="landing-hero"
      id="platform"
      aria-labelledby="hero-heading"
    >
      <div className="landing-hero-content">
        {/* Badge */}
        <div className={isLoaded ? 'hero-badge hero-animate-badge' : 'hero-badge'}>
          <span className="hero-badge-dot" />
          <span>AI-Powered Engineering Platform</span>
        </div>

        {/* Title */}
        <h1
          id="hero-heading"
          className={`landing-hero-title ${isLoaded ? 'hero-animate-title' : ''}`}
        >
          Ship at the{' '}
          <span className="landing-hero-title--accent">Speed of Thought</span>
        </h1>

        {/* Subtitle */}
        <p className={`landing-hero-subtitle ${isLoaded ? 'hero-animate-subtitle' : ''}`}>
          Connect your vision to a high-performance execution engine. Fractional
          experts, automated orchestration, and production-grade delivery in one
          seamless pipeline.
        </p>

        {/* CTA Buttons */}
        <div className={`landing-hero-cta ${isLoaded ? 'hero-animate-cta' : ''}`}>
          <Link
            to="/public/signup"
            className="landing-btn-primary landing-btn-lg"
            id="hero-get-started-btn"
          >
            Get Started Free
          </Link>
          <a href="#process" className="landing-btn-outline landing-btn-lg">
            See How It Works
          </a>
        </div>
      </div>
    </section>
  )
}