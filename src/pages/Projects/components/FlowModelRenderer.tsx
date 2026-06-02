import React from 'react'
import yaml from 'js-yaml'
import { DocumentRenderer } from '../../../components/ui/DocumentRenderer'
import { MarkdownRenderer } from '../../../components/ui/DocumentRenderer/renderers/MarkdownRenderer'

interface FlowModelRendererProps {
  data: any
  model: string
  disableMermaid?: boolean
}

export const FlowModelRenderer: React.FC<FlowModelRendererProps> = ({
  data,
  model,
  disableMermaid,
}) => {
  if (!data) return null

  // If the data is an object/array, convert it to a YAML code block for the "MD Reader" look
  if (typeof data === 'object' && data !== null) {
    try {
      const yamlString = yaml.dump(data, {
        indent: 2,
        lineWidth: -1, // Don't wrap lines
        noRefs: true,
        sortKeys: false,
      })

      const markdownContent = `\`\`\`yaml\n${yamlString}\n\`\`\``

      return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <MarkdownRenderer
            content={markdownContent}
            model={model}
            disableMermaid={disableMermaid}
          />
        </div>
      )
    } catch (e) {
      // Fallback if YAML dump fails
      return (
        <DocumentRenderer
          content={data}
          model={model}
          disableMermaid={disableMermaid}
        />
      )
    }
  }

  // If it's already a string, just use DocumentRenderer
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <DocumentRenderer
        content={data}
        model={model}
        disableMermaid={disableMermaid}
      />
    </div>
  )
}
