import React from 'react'
import { Link } from '@tanstack/react-router'
import { Logo } from '../../../components/ui/Logo'

type ActivePage = 'landing' | 'process' | 'experts' | 'pricing'

interface LandingNavbarProps {
  /** Marks the current page's nav link as active. Defaults to 'landing'. */
  activePage?: ActivePage
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  activePage = 'landing',
}) => {
  return (
    <header className="landing-navbar">
      <div className="landing-nav-inner">
        <Link
          to="/public/landing"
          className="landing-logo-link"
          aria-label="EngineerOS home"
        >
          <Logo showText={true} />
        </Link>

        {/* Center nav links */}
        <nav className="landing-nav-links" aria-label="Main navigation">
          <Link
            to="/public/landing"
            className={`landing-nav-link ${activePage === 'landing' ? 'landing-nav-link--active' : ''}`}
            id="nav-link-platform"
          >
            Platform
          </Link>
          <Link
            to="/public/process"
            className={`landing-nav-link ${activePage === 'process' ? 'landing-nav-link--active' : ''}`}
            id="nav-link-process"
          >
            Process
          </Link>
        </nav>

        {/* CTA buttons */}
        <div className="landing-nav-actions">
          <Link
            to="/public/signin"
            className="landing-btn-ghost"
            id="nav-signin-btn"
          >
            Sign In
          </Link>
          <Link
            to="/public/signup"
            className="landing-btn-primary"
            id="nav-get-started-btn"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  )
}
