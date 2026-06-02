import React from 'react'
import { LandingNavbar } from '../Landing/components/LandingNavbar'
import { LandingFooter } from '../Landing/components/LandingFooter'
import { ProcessHero } from './components/ProcessHero'
import { ProcessSteps } from './components/ProcessSteps'
import { ProcessCTA } from './components/ProcessCTA'
import '../Landing/landing.css'
import './process.css'

/**
 * ProcessPage
 *
 * Public marketing page that details EngineerOS's five-step delivery pipeline.
 * Accessible at /public/process. Shares the LandingNavbar and LandingFooter
 * for consistent site-wide chrome.
 */
export const ProcessPage: React.FC = () => {
  return (
    <div className="landing-root process-root">
      <LandingNavbar activePage="process" />
      <main className="landing-main">
        <ProcessHero />
        <ProcessSteps />
        <ProcessCTA />
      </main>
      <LandingFooter />
    </div>
  )
}
