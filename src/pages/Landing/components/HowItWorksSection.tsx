import React from 'react'

interface StepCardProps {
  step: number
  title: string
  children: React.ReactNode
  variant?: 'default' | 'dark'
}

const StepCard: React.FC<StepCardProps> = ({
  step,
  title,
  children,
  variant = 'default',
}) => (
  <div
    className={`how-it-works-card ${variant === 'dark' ? 'how-it-works-card--dark' : ''}`}
  >
    <p className="how-it-works-step-label">STEP {step}</p>
    <h3 className="how-it-works-card-title">{title}</h3>
    <div className="how-it-works-card-body">{children}</div>
  </div>
)

export const HowItWorksSection: React.FC = () => {
  return (
    <section
      className="landing-section"
      id="process"
      aria-labelledby="how-it-works-heading"
    >
      <h2 id="how-it-works-heading" className="sr-only">
        How It Works
      </h2>

      {/* Section header */}
      <div className="how-it-works-section-title">
        <p className="how-it-works-eyebrow">THE PROCESS</p>
        <h3 className="how-it-works-main-title">
          From Idea to Production
        </h3>
        <p className="how-it-works-main-subtitle">
          Five seamless steps that transform your vision into production-ready systems
        </p>
      </div>

      {/* Cards grid */}
      <div className="how-it-works-grid">
        {/* Step 1 - Customer Idea */}
        <StepCard step={1} title="Customer Idea">
          <div className="step-prompt-box">
            <span className="step-prompt-keyword">prompt://</span>
            <p className="step-prompt-text">
              Build a scalable microservices architecture for a fintech platform
              with real-time ledger...
            </p>
          </div>
        </StepCard>

        {/* Step 2 - AI Architecture Engine */}
        <StepCard step={2} title="AI Architecture">
          <div className="step-ai-card">
            <div className="step-ai-bar" aria-hidden="true" />
            <div className="step-ai-icons" aria-hidden="true">
              <span className="step-ai-icon step-ai-icon--asterisk">✳</span>
              <span className="step-ai-icon step-ai-icon--lines">≡</span>
            </div>
          </div>
        </StepCard>

        {/* Step 3 - Expert Pod */}
        <StepCard step={3} title="Expert Pod">
          <div className="step-experts-list">
            {[
              { role: 'Architect', initial: 'A', color: '#7C3AED' },
              { role: 'Backend', initial: 'B', color: '#2563EB' },
              { role: 'AI Eng.', initial: 'E', color: '#059669' },
            ].map((expert) => (
              <div key={expert.role} className="step-expert-item">
                <span
                  className="step-expert-avatar"
                  style={{ background: expert.color }}
                  aria-hidden="true"
                >
                  {expert.initial}
                </span>
                <span className="step-expert-role">{expert.role}</span>
              </div>
            ))}
          </div>
        </StepCard>

        {/* Step 4 - Execution */}
        <StepCard step={4} title="Execution">
          <div className="step-execution-box">
            <div className="step-sprint-header">
              <span className="step-sprint-label">SPRINT 04</span>
              <span className="step-sprint-pct">85%</span>
            </div>
            <div
              className="step-progress-track"
              aria-label="Sprint 04 progress: 85%"
            >
              <div className="step-progress-bar" style={{ width: '85%' }} />
            </div>
          </div>
        </StepCard>

        {/* Step 5 - Production */}
        <StepCard step={5} title="Production" variant="dark">
          <div className="step-production-content">
            <span className="step-production-icon" aria-hidden="true">
              🚀
            </span>
            <span className="step-production-label">SYSTEM LIVE</span>
          </div>
        </StepCard>
      </div>
    </section>
  )
}