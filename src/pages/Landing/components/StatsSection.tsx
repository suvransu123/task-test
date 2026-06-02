import React from 'react'

interface StatCardProps {
  value: string
  label: string
  description: string
}

const StatCard: React.FC<StatCardProps> = ({ value, label, description }) => (
  <div className="stats-card">
    <p className="stats-card-value">{value}</p>
    <p className="stats-card-label">{label}</p>
    <p className="stats-card-description">{description}</p>
  </div>
)

export const StatsSection: React.FC = () => {
  const stats: StatCardProps[] = [
    {
      value: '4x',
      label: 'VELOCITY INCREASE',
      description:
        'Our AI-driven orchestration removes bottlenecks before they even exist in your roadmap.',
    },
    {
      value: '60%',
      label: 'COST REDUCTION',
      description:
        'Fractional expertise means you only pay for the precision engineering you need, when you need it.',
    },
    {
      value: 'Zero',
      label: 'INFRASTRUCTURE OVERHEAD',
      description:
        'We manage the full deployment lifecycle from first commit to production scale-up.',
    },
  ]

  return (
    <section
      className="landing-section landing-section--stats"
      id="experts"
      aria-labelledby="stats-heading"
    >
      <h2 id="stats-heading" className="sr-only">
        Our Results
      </h2>

      {/* Section header */}
      <div className="stats-section-header">
        <h3 className="stats-section-title">Built for Speed</h3>
        <p className="stats-section-subtitle">
          Numbers that speak for themselves
        </p>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
    </section>
  )
}