import React, { useState, useEffect } from 'react'

/** Step 1 — Customer Idea: animated prompt terminal */
export const Step1Visual: React.FC = () => {
  const [cursorVisible, setCursorVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((v) => !v)
    }, 530)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="pv-terminal">
      <div className="pv-terminal-bar">
        <span className="pv-dot pv-dot--red" />
        <span className="pv-dot pv-dot--yellow" />
        <span className="pv-dot pv-dot--green" />
        <span className="pv-terminal-title">prompt://</span>
      </div>
      <div className="pv-terminal-body">
        <p className="pv-terminal-line">
          <span className="pv-keyword">Build</span> a scalable microservices
          architecture for a fintech platform with real-time ledger...
        </p>
        <p className="pv-terminal-line">
          <span className="pv-keyword">Requirements:</span> high availability,
          PCI-DSS compliance, sub-100ms p99 latency
        </p>
        <p className="pv-terminal-line pv-cursor-line">
          <span
            className="pv-cursor"
            style={{ opacity: cursorVisible ? 1 : 0 }}
            aria-hidden="true"
          >
            |
          </span>
        </p>
      </div>
    </div>
  )
}

/** Step 2 — AI Architecture Engine: diagram preview */
export const Step2Visual: React.FC = () => {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(70)
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="pv-diagram">
      {/* Header */}
      <div className="pv-diagram-header">
        <span className="pv-diagram-badge">AI ARCHITECTURE ENGINE</span>
      </div>
      {/* Progress bar */}
      <div className="pv-diagram-progress-track">
        <div
          className="pv-diagram-progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>
      {/* Nodes */}
      <div className="pv-diagram-nodes">
        {[
          { label: 'API Gateway', color: '#7c3aed' },
          { label: 'Auth Service', color: '#2563eb' },
          { label: 'Ledger Core', color: '#059669' },
          { label: 'Event Bus', color: '#d97706' },
        ].map((node, index) => (
          <div
            key={node.label}
            className="pv-diagram-node"
            style={{
              animationDelay: `${index * 100 + 400}ms`,
            }}
          >
            <span
              className="pv-diagram-node-dot"
              style={{ background: node.color }}
              aria-hidden="true"
            />
            <span className="pv-diagram-node-label">{node.label}</span>
          </div>
        ))}
      </div>
      {/* Connections */}
      <div className="pv-diagram-connections" aria-hidden="true">
        <div className="pv-diagram-conn pv-diagram-conn--1" />
        <div className="pv-diagram-conn pv-diagram-conn--2" />
      </div>
    </div>
  )
}

/** Step 3 — Expert Pod: team cards */
export const Step3Visual: React.FC = () => (
  <div className="pv-pod">
    <div className="pv-pod-header">
      <span className="pv-pod-badge">EXPERT POD ASSEMBLED</span>
    </div>
    <div className="pv-pod-members">
      {[
        {
          role: 'Solutions Architect',
          level: 'Principal',
          initial: 'A',
          color: '#7c3aed',
          available: true,
        },
        {
          role: 'Backend Engineer',
          level: 'Senior',
          initial: 'B',
          color: '#2563eb',
          available: true,
        },
        {
          role: 'AI/ML Engineer',
          level: 'Staff',
          initial: 'E',
          color: '#059669',
          available: true,
        },
        {
          role: 'DevOps Engineer',
          level: 'Senior',
          initial: 'D',
          color: '#d97706',
          available: false,
        },
      ].map((member, index) => (
        <div
          key={member.role}
          className="pv-pod-member"
          style={{
            animationDelay: `${index * 100 + 500}ms`,
          }}
        >
          <span
            className="pv-pod-avatar"
            style={{ background: member.color }}
            aria-label={`${member.role} avatar`}
          >
            {member.initial}
          </span>
          <div className="pv-pod-member-info">
            <span className="pv-pod-member-role">{member.role}</span>
            <span className="pv-pod-member-level">{member.level}</span>
          </div>
          <span
            className={`pv-pod-status ${member.available ? 'pv-pod-status--active' : 'pv-pod-status--pending'}`}
            aria-label={member.available ? 'Active' : 'Pending'}
          />
        </div>
      ))}
    </div>
  </div>
)

/** Step 4 — Execution: sprint board */
export const Step4Visual: React.FC = () => (
  <div className="pv-sprints">
    <div className="pv-sprints-header">
      <span className="pv-sprints-badge">ACTIVE SPRINT</span>
      <span className="pv-sprints-sprint">Sprint 04 of 08</span>
    </div>
    {[
      { label: 'Architecture review', pct: 100, done: true },
      { label: 'API scaffold', pct: 100, done: true },
      { label: 'Auth integration', pct: 85, done: false },
      { label: 'Ledger module', pct: 40, done: false },
    ].map((task, index) => (
      <div
        key={task.label}
        className="pv-sprint-task"
        style={{
          animationDelay: `${index * 80 + 400}ms`,
        }}
      >
        <div className="pv-sprint-task-header">
          <span
            className={`pv-sprint-task-label ${task.done ? 'pv-sprint-task-label--done' : ''}`}
          >
            {task.label}
          </span>
          <span className="pv-sprint-task-pct">{task.pct}%</span>
        </div>
        <div className="pv-sprint-progress-track">
          <div
            className={`pv-sprint-progress-bar ${task.done ? 'pv-sprint-progress-bar--done' : ''}`}
            style={{ width: `${task.pct}%` }}
          />
        </div>
      </div>
    ))}
  </div>
)

/** Step 5 — Production: live system dashboard (dark) */
export const Step5Visual: React.FC = () => {
  const [metrics, setMetrics] = useState({
    uptime: '0%',
    latency: '0ms',
    deployments: '0',
  })

  useEffect(() => {
    // Animate metrics counting up
    const targets = { uptime: 99.98, latency: 87, deployments: 142 }
    const duration = 1500
    const steps = 60
    const interval = duration / steps

    let step = 0
    const timer = setInterval(() => {
      step++
      const progress = step / steps
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic

      setMetrics({
        uptime: `${(targets.uptime * eased).toFixed(2)}%`,
        latency: `${Math.round(targets.latency * eased)}ms`,
        deployments: `${Math.round(targets.deployments * eased)}`,
      })

      if (step >= steps) clearInterval(timer)
    }, interval)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="pv-production">
      <div className="pv-production-status">
        <span className="pv-production-pulse" aria-hidden="true" />
        <span className="pv-production-status-text">SYSTEM LIVE</span>
      </div>
      <div className="pv-production-rocket" aria-label="Production rocket icon">
        🚀
      </div>
      <div className="pv-production-metrics">
        <div className="pv-production-metric">
          <span className="pv-production-metric-value">{metrics.uptime}</span>
          <span className="pv-production-metric-label">Uptime</span>
        </div>
        <div className="pv-production-metric">
          <span className="pv-production-metric-value">{metrics.latency}</span>
          <span className="pv-production-metric-label">Latency p99</span>
        </div>
        <div className="pv-production-metric">
          <span className="pv-production-metric-value">{metrics.deployments}</span>
          <span className="pv-production-metric-label">Deployments</span>
        </div>
      </div>
    </div>
  )
}