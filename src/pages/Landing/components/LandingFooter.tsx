import React from 'react'
import { Link } from '@tanstack/react-router'
import { Logo } from '../../../components/ui/Logo'

export const LandingFooter: React.FC = () => {
  const year = new Date().getFullYear()

  return (
    <footer className="landing-footer">
      <div className="landing-footer-inner">
        {/* Logo */}
        <Link
          to="/public/landing"
          className="landing-footer-logo-link"
          aria-label="EngineerOS home"
        >
          <Logo showText={true} />
        </Link>

        {/* Legal links */}
        <nav className="landing-footer-links" aria-label="Footer navigation">
          <a href="#" className="landing-footer-link">
            Privacy Policy
          </a>
          <a href="#" className="landing-footer-link">
            Terms of Service
          </a>
          <a href="#" className="landing-footer-link">
            Security
          </a>
          <a href="#" className="landing-footer-link">
            Status
          </a>
        </nav>

        {/* Copyright */}
        <p className="landing-footer-copy">
          © {year} ENGINEEROS. HIGH-PERFORMANCE ENGINEERING INTELLIGENCE.
        </p>
      </div>
    </footer>
  )
}
