import React from 'react'
import { DocumentRenderer } from '..'
import { MarkdownRenderer } from './MarkdownRenderer'
import { unescapeString } from '../utils'

interface ListRendererProps {
  items: any[]
  depth: number
  model?: string
  disableMermaid?: boolean
}

export const ListRenderer: React.FC<ListRendererProps> = ({
  items,
  depth,
  model,
  disableMermaid,
}) => {
  if (items.length === 0) {
    return (
      <p className="text-text-muted italic text-[10px] mb-4">No items found</p>
    )
  }

  return (
    <ul className="list-disc pl-5 mb-6 space-y-2">
      {items.map((item, idx) => (
        <li key={idx} className="text-text-secondary leading-relaxed text-sm">
          {typeof item === 'object' && item !== null ? (
            <DocumentRenderer
              content={item}
              depth={depth + 1}
              model={model}
              disableMermaid={disableMermaid}
            />
          ) : (
            <MarkdownRenderer
              content={unescapeString(String(item))}
              model={model}
              disableMermaid={disableMermaid}
            />
          )}
        </li>
      ))}
    </ul>
  )
}
