import { useState, useCallback, useRef } from 'react'
import { projectService } from '../services/project.service'

export interface DocumentVersion {
  version_number: number
  created_at: string
}

/**
 * Hook to manage document versions and content loading.
 * Implements session-based caching for version lists.
 */
export const useDocumentVersions = () => {
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [loading, setLoading] = useState(false)
  const [contentLoading, setContentLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [versionContent, setVersionContent] = useState<any>(null)

  // Cache for version lists: documentId -> DocumentVersion[]
  const versionsCache = useRef<Record<string, DocumentVersion[]>>({})

  const fetchVersions = useCallback(
    async (documentId: string, forceRefresh = false) => {
      if (!documentId) return

      // Check cache first if not forcing refresh
      if (!forceRefresh && versionsCache.current[documentId]) {
        setVersions(versionsCache.current[documentId])
        return
      }

      setLoading(true)
      setError(null)
      try {
        const res = await projectService.getDocumentVersions(documentId)
        if (res.data) {
          // Ensure versions are sorted by number descending (most recent first)
          const sorted = (res.data as DocumentVersion[]).sort(
            (a, b) => b.version_number - a.version_number,
          )
          setVersions(sorted)
          versionsCache.current[documentId] = sorted
        }
      } catch (err) {
        console.error('Failed to fetch versions:', err)
        setError('Failed to load version list')
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const fetchVersionContent = useCallback(
    async (documentId: string, versionNumber: number) => {
      if (!documentId) return

      setContentLoading(true)
      setError(null)
      try {
        const res = await projectService.getVersionContent(
          documentId,
          versionNumber,
        )
        if (res.data) {
          setVersionContent(res.data)
        }
      } catch (err) {
        console.error('Failed to fetch version content:', err)
        setError(`Failed to load version ${versionNumber}`)
      } finally {
        setContentLoading(false)
      }
    },
    [],
  )

  const resetVersionContent = useCallback(() => {
    setVersionContent(null)
  }, [])

  const refreshVersions = useCallback(
    (documentId: string) => {
      if (documentId) {
        delete versionsCache.current[documentId]
        fetchVersions(documentId, true)
      }
    },
    [fetchVersions],
  )

  return {
    versions,
    loading,
    contentLoading,
    error,
    versionContent,
    fetchVersions,
    refreshVersions,
    fetchVersionContent,
    resetVersionContent,
  }
}
