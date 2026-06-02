import React from 'react'
import { DocumentRenderer } from '..'
import { formatKey } from '../utils'

interface ObjectRendererProps {
  data: Record<string, any>
  depth: number
  model?: string
  disableMermaid?: boolean
}

export const ObjectRenderer: React.FC<ObjectRendererProps> = ({
  data,
  depth,
  model,
  disableMermaid,
}) => {
  const entries = Object.entries(data).filter(
    ([key]) => !['id', '_id', '__v'].includes(key),
  )

  if (entries.length === 0) return null

  return (
    <>
      {entries.map(([key, value]) => {
        const isTopLevel = depth === 1
        return (
          <div
            key={key}
            className={
              isTopLevel ? 'mb-8' : 'mb-4 pl-4 border-l-2 border-border-default'
            }
          >
            {isTopLevel ? (
              // Top-level keys: clean bold heading like "Objective", "Project Goal"
              <h2 className="text-xl font-bold text-text-primary mb-3 tracking-tight">
                {formatKey(key)}
              </h2>
            ) : (
              // Nested keys: small uppercase label
              <h5 className="text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest">
                {formatKey(key)}
              </h5>
            )}
            <DocumentRenderer
              content={value}
              depth={depth + 1}
              model={model}
              disableMermaid={disableMermaid}
            />
          </div>
        )
      })}
    </>
  )
}
