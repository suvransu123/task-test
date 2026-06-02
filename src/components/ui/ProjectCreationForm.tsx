import React, { useState } from 'react'
import { Button } from './Button'
import { AlertCircle, ArrowLeft, Sparkles, Check, RotateCw, X } from 'lucide-react'
import { projectService } from '../../services/project.service'
import { enhancementService } from '../../services/enhancement.service'
import type { Workspace } from '../../services/workspace.service'

interface ProjectCreationFormProps {
  workspaces?: Workspace[]
  initialWorkspaceId?: string
  hideWorkspaceSelect?: boolean
  onSuccess: () => void
  onCancel: () => void
  onBack?: () => void
  isLoading?: boolean
}

export const ProjectCreationForm: React.FC<ProjectCreationFormProps> = ({
  workspaces = [],
  initialWorkspaceId = '',
  hideWorkspaceSelect = false,
  onSuccess,
  onCancel,
  onBack,
}) => {
  const [selectedWorkspaceId, setSelectedWorkspaceId] =
    useState(initialWorkspaceId)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [internalIsLoading, setInternalIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhancementError, setEnhancementError] = useState('')
  const [enhancedDescription, setEnhancedDescription] = useState('')

  const handleEnhanceDescription = async () => {
    if (!description.trim()) return

    setIsEnhancing(true)
    setEnhancementError('')
    setEnhancedDescription('')

    try {
      const enhanced = await enhancementService.enhanceDescription(
        name.trim(),
        description.trim(),
      )
      setEnhancedDescription(enhanced)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to enhance description'
      setEnhancementError(message)
    } finally {
      setIsEnhancing(false)
    }
  }

  const handleAcceptEnhancement = () => {
    setDescription(enhancedDescription)
    setEnhancedDescription('')
  }

  const handleRegenerate = () => {
    handleEnhanceDescription()
  }

  const handleCancelEnhancement = () => {
    setEnhancedDescription('')
    setEnhancementError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const workspaceIdToUse = hideWorkspaceSelect
      ? initialWorkspaceId
      : selectedWorkspaceId

    if (!workspaceIdToUse) {
      setError('Please select a workspace.')
      return
    }

    if (!name.trim()) {
      setError('Project name is required.')
      return
    }

    setInternalIsLoading(true)
    try {
      const { error: apiError, status } = await projectService.create(
        workspaceIdToUse,
        {
          name: name.trim(),
          description: description.trim(),
        },
      )

      if (status === 422 || apiError) {
        setError(apiError || 'Validation error. Please check your input.')
        return
      }

      onSuccess()
    } catch {
      setError('An unexpected error occurred.')
    } finally {
      setInternalIsLoading(true) // Keep it true during navigation/close if needed
      setInternalIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-5">
      {onBack && (
        <Button
          variant="unstyled"
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent transition-colors group mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to workspace
        </Button>
      )}

      {error && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-500 text-sm px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!hideWorkspaceSelect && (
        <div className="space-y-2">
          <label className="mono-all-caps text-text-muted">Workspace</label>
          <div className="relative group">
            <select
              value={selectedWorkspaceId}
              onChange={(e) => setSelectedWorkspaceId(e.target.value)}
              disabled={internalIsLoading}
              className="w-full px-4 py-3 bg-surface-muted border border-border-default rounded-xl text-base text-text-primary focus:outline-hidden focus:ring-2 focus:ring-accent/20 transition-all disabled:opacity-50 appearance-none cursor-pointer"
            >
              <option value="" disabled>
                Select a workspace...
              </option>
              {workspaces.map((ws) => (
                <option key={ws.workspace_id} value={ws.workspace_id}>
                  {ws.name}
                </option>
              ))}
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-accent transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="mono-all-caps text-text-muted">Project Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Mobile App Redesign"
          disabled={internalIsLoading}
          className="w-full px-4 py-3 bg-surface-muted border border-border-default rounded-xl text-base text-text-primary focus:outline-hidden focus:ring-2 focus:ring-accent/20 transition-all placeholder:text-text-muted disabled:opacity-50"
        />
      </div>

      <div className="space-y-2">
        <label className="mono-all-caps text-text-muted">Description</label>
        
        {/* Enhance Button */}
        <div className="flex justify-end">
          <Button
            variant="unstyled"
            type="button"
            onClick={handleEnhanceDescription}
            disabled={!description.trim() || isEnhancing || internalIsLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-accent hover:bg-accent/10 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isEnhancing ? (
              <>
                <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Enhancing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Enhance</span>
              </>
            )}
          </Button>
        </div>

        {/* Enhancement Error */}
        {enhancementError && (
          <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{enhancementError}</span>
          </div>
        )}

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Briefly describe the goals and context of this project..."
          rows={3}
          disabled={internalIsLoading}
          className="w-full px-5 py-4 bg-surface-muted border border-border-default rounded-xl text-lg text-text-primary focus:outline-hidden focus:ring-2 focus:ring-accent/20 transition-all placeholder:text-text-muted resize-none disabled:opacity-50 min-h-35"
        />

        {/* Review Container */}
        {enhancedDescription && (
          <div className="mt-3 p-4 bg-surface-muted border border-accent/30 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-sm text-accent font-medium">
              <Sparkles className="w-4 h-4" />
              <span>Enhanced Description</span>
            </div>
            <p className="text-base text-text-primary leading-relaxed whitespace-pre-wrap">
              {enhancedDescription}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="unstyled"
                type="button"
                onClick={handleCancelEnhancement}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </Button>
              <Button
                variant="unstyled"
                type="button"
                onClick={handleRegenerate}
                disabled={isEnhancing}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-accent hover:bg-accent/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <RotateCw className="w-4 h-4" />
                <span>Regenerate</span>
              </Button>
              <Button
                variant="unstyled"
                type="button"
                onClick={handleAcceptEnhancement}
                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-accent text-white hover:bg-accent/90 rounded-lg transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Accept</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={internalIsLoading}
          className="bg-transparent border-border-default text-text-secondary h-12 rounded-xl"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={internalIsLoading}
          isLoading={internalIsLoading}
          className="bg-accent hover:bg-accent/90 text-white px-8 h-12 rounded-xl shadow-lg shadow-accent/25 transition-all active:scale-95"
        >
          <span className="font-bold">Create Project</span>
        </Button>
      </div>
    </form>
  )
}
