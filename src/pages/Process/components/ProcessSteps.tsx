import React from 'react'
import { ProcessStep } from './ProcessStep'
import {
  Step1Visual,
  Step2Visual,
  Step3Visual,
  Step4Visual,
  Step5Visual,
} from './ProcessVisuals'
import type { ProcessStepData } from './ProcessStep'

const STEPS: ProcessStepData[] = [
  {
    step: 1,
    tag: 'Input',
    title: 'You Share Your Idea',
    description:
      'It starts with a natural-language prompt — no spec documents, no lengthy intake forms. Describe your vision in plain language and our system takes it from there.',
    details: [
      'Natural-language project intake via intelligent prompt',
      'Domain auto-detection across web, mobile, data, and AI',
      'Instant feasibility analysis before any commitment',
      'Requirements disambiguation with clarifying follow-ups',
    ],
    visual: <Step1Visual />,
  },
  {
    step: 2,
    tag: 'Architecture',
    title: 'AI Designs the Architecture',
    description:
      'Our proprietary AI Architecture Engine translates your requirements into a fully mapped, production-ready technical blueprint — covering services, data models, and integration points.',
    details: [
      'Automatic service decomposition and dependency mapping',
      'Technology stack selection based on project constraints',
      'Security and compliance patterns built into the design',
      'Cost-optimised infrastructure recommendations included',
    ],
    visual: <Step2Visual />,
  },
  {
    step: 3,
    tag: 'Team',
    title: 'Your Expert Pod Is Assembled',
    description:
      'EngineerOS matches your project to a curated pod of fractional experts — architects, engineers, and specialists — with the exact skill profile your architecture demands.',
    details: [
      'AI-matched engineers with proven domain track record',
      'Right-sized teams — no idle headcount, no gaps',
      'Dedicated pod lead as your single point of contact',
      'Background-checked senior engineers, ready in 48 hours',
    ],
    visual: <Step3Visual />,
  },
  {
    step: 4,
    tag: 'Execution',
    title: 'Automated Orchestration Drives Delivery',
    description:
      'Sprints are planned, tracked, and continuously optimised by the platform. AI-driven orchestration removes blockers before they surface, keeping delivery on the critical path.',
    details: [
      'Sprint planning generated from architecture blueprint',
      'Real-time progress tracking with burn-down visibility',
      'Automated blocker detection and re-routing',
      'Continuous integration gates enforced on every commit',
    ],
    visual: <Step4Visual />,
  },
  {
    step: 5,
    tag: 'Production',
    title: 'Ship — and Keep Shipping',
    description:
      'Your system goes live with zero infrastructure overhead. EngineerOS manages the full deployment lifecycle, from first commit to production scale-up and beyond.',
    details: [
      'Zero-downtime blue-green deployments out of the box',
      'Automated monitoring, alerting, and incident response',
      'Continuous performance optimisation post-launch',
      'On-demand expert support as your system scales',
    ],
    visual: <Step5Visual />,
    isDark: true,
  },
]

export const ProcessSteps: React.FC = () => {
  return (
    <section className="process-steps-section" aria-label="Process steps">
      <div className="process-steps-inner">
        {STEPS.map((step, index) => (
          <ProcessStep
            key={step.step}
            data={step}
            isReversed={index % 2 !== 0}
          />
        ))}
      </div>
    </section>
  )
}
