import React from 'react'
import { LandingNavbar } from './components/LandingNavbar'
import { HeroSection } from './components/HeroSection'
import { HowItWorksSection } from './components/HowItWorksSection'
import { StatsSection } from './components/StatsSection'
import { LandingFooter } from './components/LandingFooter'
import './landing.css'

/**
 * LandingPage
 *
 * Public marketing page shown to unauthenticated users.
 * Authenticated users are redirected to /dashboard via the index route guard.
 */
export const LandingPage: React.FC = () => {
  return (
    <div className="landing-root">
      <LandingNavbar />
      <main className="landing-main">
        <HeroSection />
        <HowItWorksSection />
        <StatsSection />
      </main>
      <LandingFooter />
    </div>
  )
}
