import React, { useState } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { AlertCircle } from 'lucide-react'

export type EntityType = 'workspace' | 'project'

interface CreateEntityModalProps {
  isOpen: boolean
  onClose: () => void
  entityType: EntityType
  onSubmit: (data: {
    name: string
    description: string
  }) => Promise<{ success: boolean; error?: string }>
}

const LABELS: Record<
  EntityType,
  {
    title: string
    nameLabel: string
    namePlaceholder: string
    descPlaceholder: string
    submitLabel: string
  }
> = {
  workspace: {
    title: 'Create New Workspace',
    nameLabel: 'Workspace Name',
    namePlaceholder: 'e.g. Q4 Marketing Initiative',
    descPlaceholder:
      'Briefly describe the goals and context of this workspace...',
    submitLabel: 'Create Workspace',
  },
  project: {
    title: 'Create New Project',
    nameLabel: 'Project Name',
    namePlaceholder: 'e.g. Mobile App Redesign',
    descPlaceholder:
      'Briefly describe the goals and context of this project...',
    submitLabel: 'Create Project',
  },
}

export const CreateEntityModal: React.FC<CreateEntityModalProps> = ({
  isOpen,
  onClose,
  entityType,
  onSubmit,
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const labels = LABELS[entityType]

  const handleClose = () => {
    if (isLoading) return
    setName('')
    setDescription('')
    setError('')
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError(`${labels.nameLabel} is required.`)
      return
    }

    setIsLoading(true)
    try {
      const result = await onSubmit({
        name: name.trim(),
        description: description.trim(),
      })
      if (result.success) {
        setName('')
        setDescription('')
        onClose()
      } else {
        setError(result.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setError('An unexpected error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={labels.title}
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 mt-4">
        {error && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-500 text-sm px-4 py-3 rounded-xl">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <label className="mono-all-caps text-text-muted">
            {labels.nameLabel}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={labels.namePlaceholder}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-surface-muted border border-border-default rounded-xl text-base text-text-primary focus:outline-hidden focus:ring-2 focus:ring-accent/20 transition-all placeholder:text-text-muted disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <label className="mono-all-caps text-text-muted">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={labels.descPlaceholder}
            rows={4}
            disabled={isLoading}
            className="w-full px-5 py-4 bg-surface-muted border border-border-default rounded-xl text-lg text-text-primary focus:outline-hidden focus:ring-2 focus:ring-accent/20 transition-all placeholder:text-text-muted resize-none disabled:opacity-50 min-h-40"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="bg-transparent border-border-default text-text-secondary"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            isLoading={isLoading}
            className="bg-accent hover:bg-accent/90 text-white px-8 h-12 rounded-xl shadow-lg shadow-accent/25 transition-all active:scale-95"
          >
            <span className="font-bold">{labels.submitLabel}</span>
          </Button>
        </div>
      </form>
    </Modal>
  )
}
