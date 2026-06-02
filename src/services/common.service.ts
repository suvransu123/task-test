/**
 * Common service containing shared API methods used across multiple services.
 * This file follows the DRY principle by centralizing common API calls.
 */

import { httpClient } from './httpClient'

/**
 * Fetches document content by document ID.
 */
export const getDocumentContent = (documentId: string) => {
  return httpClient.get<unknown>(`/documents/${documentId}/content`)
}

/**
 * Fetches available AI models.
 */
export const getModels = () => {
  return httpClient.get<string[]>('/models')
}

/**
 * Fetches document versions by document ID.
 */
export const getDocumentVersions = (documentId: string) => {
  return httpClient.get<{ version_number: number; created_at: string }[]>(
    `/documents/${documentId}/versions`,
  )
}

/**
 * Fetches content for a specific document version.
 */
export const getVersionContent = (
  documentId: string,
  versionNumber: number,
) => {
  return httpClient.get<unknown>(
    `/documents/${documentId}/versions/${versionNumber}/content`,
  )
}
