import React, { useState, useEffect } from 'react'
import { X, AlertCircle, Loader2 } from 'lucide-react'
import yaml from 'js-yaml'
import { projectService } from '../../../services/project.service'
import { Button } from '../../../components/ui/Button'

interface DocumentEditorModalProps {
  isOpen: boolean
  onClose: () => void
  documentId: string
  initialData: any
  documentName: string
  onSaveSuccess: () => void
}

const objectToMarkdown = (obj: any, depth = 1): string => {
  if (obj === null || obj === undefined) return ''
  if (typeof obj !== 'object') return String(obj)

  if (Array.isArray(obj)) {
    return obj.map((item) => `- ${objectToMarkdown(item, depth)}`).join('\n')
  }

  return Object.entries(obj)
    .map(([key, value]) => {
      const headerPrefix = '#'.repeat(depth)
      const title = key
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')

      const body =
        typeof value === 'object' && value !== null
          ? '\n' + objectToMarkdown(value, depth + 1)
          : '\n' + String(value)

      return `${headerPrefix} ${title}\n${body.trim()}`
    })
    .join('\n\n')
}

const markdownToObject = (md: string): any => {
  const lines = md.split('\n')
  const result: any = {}
  let currentKeyPath: string[] = []
  let currentContent: string[] = []
  let currentList: string[] = []

  const flush = () => {
    if (currentKeyPath.length > 0) {
      let target = result
      for (let i = 0; i < currentKeyPath.length; i++) {
        const k = currentKeyPath[i]
        if (!target[k]) target[k] = {}
        target = target[k]
      }

      const lastKey = currentKeyPath[currentKeyPath.length]
      if (currentList.length > 0) {
        target[lastKey] = currentList
      } else if (currentContent.length > 0) {
        target[lastKey] = currentContent.join('\n').trim()
      }
    }
    currentContent = []
    currentList = []
  }

  for (const line of lines) {
    const headerMatch = line.match(/^(#+)\s+(.+)$/)
    if (headerMatch) {
      flush()
      const depth = headerMatch[1].length
      const key = headerMatch[2].toLowerCase().replace(/\s+/g, '_')

      // Update key path based on depth
      currentKeyPath = currentKeyPath.slice(0, depth - 1)
      currentKeyPath.push(key)
    } else if (line.trim().startsWith('- ')) {
      currentList.push(line.trim().substring(2))
    } else if (line.trim() || currentContent.length > 0) {
      currentContent.push(line)
    }
  }
  flush()

  return result
}

export const DocumentEditorModal: React.FC<DocumentEditorModalProps> = ({
  isOpen,
  onClose,
  documentId,
  initialData,
  documentName,
  onSaveSuccess,
}) => {
  const [content, setContent] = useState('')
  const [initialMd, setInitialMd] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isChanged, setIsChanged] = useState(false)

  // Initialize Markdown content when modal opens
  useEffect(() => {
    if (isOpen && initialData) {
      try {
        let parsed = initialData
        if (typeof initialData === 'string') {
          try {
            parsed = JSON.parse(initialData)
          } catch {
            try {
              parsed = yaml.load(initialData)
            } catch {
              parsed = initialData
            }
          }
        }

        const mdStr =
          typeof parsed === 'object' && parsed !== null
            ? objectToMarkdown(parsed)
            : String(parsed)

        setContent(mdStr)
        setInitialMd(mdStr)
        setError(null)
        setIsChanged(false)
      } catch (err) {
        console.error('Failed to stringify content:', err)
        setError('Failed to load document content.')
      }
    }
  }, [isOpen, initialData])

  // Debounced change handler
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsChanged(content.trim() !== initialMd.trim())
    }, 300)
    return () => clearTimeout(timer)
  }, [content, initialMd])

  const handleSave = async () => {
    if (isSaving || !isChanged) return

    setIsSaving(true)
    try {
      // Transform Markdown back to Object -> YAML
      const parsedObj = markdownToObject(content)
      const yamlContent = yaml.dump(parsedObj, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
      })

      const res = await projectService.updateDocument(documentId, {
        content: yamlContent,
        description: `Manual update (Readme Format) to ${documentName}`,
      })

      if (res.error) {
        setError(res.error)
      } else {
        onSaveSuccess()
        onClose()
      }
    } catch (err) {
      setError('An unexpected error occurred while saving.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Popup Container */}
      <div className="relative w-full max-w-4xl h-[85vh] flex flex-col bg-surface rounded-2xl shadow-2xl border border-border-default overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Minimal Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-border-default bg-surface-muted/50">
          <div className="flex items-center gap-4">
            <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-sm shadow-accent/50" />
            <div>
              <h3 className="text-[14px] font-bold text-text-primary tracking-tight leading-none">
                Editing {documentName}
              </h3>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-border-default" />
                Rendered Readme Format
              </p>
            </div>
          </div>

          <Button
            variant="unstyled"
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-muted rounded-xl transition-all"
          >
            <X className="w-5.5 h-5.5" />
          </Button>
        </div>

        {/* Editor Body */}
        <div className="flex-1 relative overflow-hidden bg-surface-muted/30">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="absolute inset-0 w-full h-full p-10 bg-transparent text-text-secondary font-serif text-[15px] leading-relaxed resize-none focus:outline-hidden placeholder:text-text-muted selection:bg-accent/10"
            spellCheck={false}
            placeholder="# Title\n\n## Section\nContent..."
          />
        </div>

        {/* Minimal Footer */}
        <div className="px-8 py-5 border-t border-border-default bg-surface-muted/50 flex items-center justify-between">
          <div className="flex-1 mr-8">
            {error ? (
              <div className="flex items-center gap-2 text-red-500 animate-in slide-in-from-left-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="text-[11px] font-medium truncate max-w-md">
                  {error}
                </p>
              </div>
            ) : isChanged ? (
              <div className="flex items-center gap-3">
                <span className="inline-block w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                  Unsaved Changes
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                  All changes synchronized
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="unstyled"
              onClick={onClose}
              className="px-5 py-2.5 text-[11px] font-bold text-text-muted hover:text-text-primary transition-colors uppercase tracking-widest"
            >
              Discard
            </Button>
            <Button
              variant="unstyled"
              onClick={handleSave}
              disabled={!isChanged || isSaving}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${
                isChanged && !isSaving
                  ? 'bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/25 active:scale-[0.98]'
                  : 'bg-surface-muted text-text-muted cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
