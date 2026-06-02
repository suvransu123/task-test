import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { unescapeString } from '../utils'
import { MermaidRenderer } from './MermaidRenderer'

interface MarkdownRendererProps {
  content: string
  model?: string
  disableMermaid?: boolean
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  model,
  disableMermaid,
}) => {
  return (
    <div className="prose prose-sm max-w-none text-text-secondary leading-relaxed mb-4 prose-headings:text-text-primary prose-strong:text-text-primary prose-a:text-accent">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-mermaid/.exec(className || '')
            const value = String(children).replace(/\n$/, '')

            if (match && !disableMermaid) {
              return <MermaidRenderer chart={value} model={model} />
            }

            // Standard code blocks for JSON/YAML/etc.
            return (
              <div className="p-6 overflow-x-auto custom-scrollbar bg-surface-muted rounded-xl border border-border-default">
                <code
                  className={`${className} text-text-secondary text-[13px] font-mono leading-relaxed block`}
                  {...props}
                >
                  {children}
                </code>
              </div>
            )
          },
          // Custom high-fidelity table styling
          table: ({ children }) => (
            <div className="my-8 bg-surface border border-border-default rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 overflow-x-auto">
              <table className="w-full text-left border-collapse table-auto">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-surface-muted border-b border-border-default uppercase text-xs font-black tracking-widest text-text-muted">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-border-default">{children}</tbody>
          ),
          th: ({ children }) => (
            <th className="px-6 py-4 text-[10px] font-black">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-6 py-5 text-[13px] leading-relaxed text-text-secondary font-medium group-hover:bg-surface-muted/30 transition-colors">
              {children}
            </td>
          ),
          tr: ({ children }) => (
            <tr className="group hover:bg-surface-muted/30 transition-colors">
              {children}
            </tr>
          ),
          // Markdown content structure adjustments
          h1: ({ children }) => (
            <h1 className="text-3xl font-black text-text-primary tracking-tight mt-12 mb-6 uppercase border-b-2 border-border-default pb-4">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-black text-text-primary tracking-tight mt-10 mb-4 uppercase">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-black text-text-muted tracking-[0.2em] mt-8 mb-3 uppercase">
              {children}
            </h3>
          ),
          hr: () => <hr className="my-16 border-border-default" />,
        }}
      >
        {unescapeString(content)}
      </ReactMarkdown>
    </div>
  )
}
