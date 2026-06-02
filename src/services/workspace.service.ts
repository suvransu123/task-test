import { httpClient } from './httpClient'
import type { Workspace } from './types'

export type { Workspace } from './types'

export interface CreateWorkspaceRequest {
  name: string
  description: string
}

export const workspaceService = {
  /**
   * Fetches all workspaces for the authenticated user.
   */
  async getAll(skip = 0, limit = 100) {
    return httpClient.get<Workspace[]>(
      `/workspaces?skip=${skip}&limit=${limit}`,
    )
  },

  /**
   * Creates a new workspace.
   */
  async create(payload: CreateWorkspaceRequest) {
    return httpClient.post<Workspace>('/workspaces', payload)
  },
}
