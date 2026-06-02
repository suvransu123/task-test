import React from 'react'
import { parseContent } from './utils'
import { MarkdownRenderer } from './renderers/MarkdownRenderer'
import { ListRenderer } from './renderers/ListRenderer'
import { ObjectRenderer } from './renderers/ObjectRenderer'

interface DocumentRendererProps {
  content: any
  depth?: number
  model?: string
  disableMermaid?: boolean
}

export const DocumentRenderer: React.FC<DocumentRendererProps> = ({
  content,
  depth = 1,
  model,
  disableMermaid,
}) => {
  if (content === null || content === undefined) return null

  const parsedData = parseContent(content)

  // Primitives
  if (typeof parsedData !== 'object' || parsedData === null) {
    const stringContent = String(parsedData)
    const isMarkdown = /#|\*|- |[0-9]\. |\[.*\]\(.*\)/.test(stringContent)

    if (isMarkdown) {
      return (
        <MarkdownRenderer
          content={stringContent}
          model={model}
          disableMermaid={disableMermaid}
        />
      )
    }
    return (
      <p className="text-text-secondary mb-4 leading-relaxed text-sm">
        {stringContent}
      </p>
    )
  }

  // Arrays
  if (Array.isArray(parsedData)) {
    return (
      <ListRenderer
        items={parsedData}
        depth={depth}
        model={model}
        disableMermaid={disableMermaid}
      />
    )
  }

  // Objects
  return (
    <ObjectRenderer
      data={parsedData}
      depth={depth}
      model={model}
      disableMermaid={disableMermaid}
    />
  )
}
