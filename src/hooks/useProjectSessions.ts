import { useState, useEffect, useCallback } from 'react'
import { v2Service } from '../services/v2.service'
import { getModels } from '../services/common.service'
import type { ReasoningMode } from '../services/types'

export const useProjectSessions = (projectId: string) => {
  const [models, setModels] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error] = useState<string | null>(null)
  const [reasoningMode, setReasoningModeState] =
    useState<ReasoningMode>('minimal')

  const fetchModels = useCallback(async () => {
    try {
      const res = await getModels()
      if (res.data) {
        setModels(res.data)
      }
    } catch {
      // Gracefully degrade
    } finally {
      setLoading(false)
    }
  }, [])

  const setReasoningMode = useCallback(
    async (mode: ReasoningMode) => {
      try {
        const success = await v2Service.setReasoningMode(projectId, mode)
        if (success) {
          setReasoningModeState(mode)
        }
      } catch {
        // Gracefully degrade
      }
    },
    [projectId],
  )

  useEffect(() => {
    fetchModels()
  }, [fetchModels])

  return {
    models,
    loading,
    error,
    reasoningMode,
    setReasoningMode,
  }
}
