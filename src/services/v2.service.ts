import { httpClient } from './httpClient'
import type {
  DomainProfile,
  ReasoningMode,
  ReasoningModeResponse,
  ChatSession,
  ImpactAnalysisResult,
} from './types'

// Re-export types for backward compatibility
export type {
  PipelinePlan,
  DomainProfile,
  ReasoningMode,
  ReasoningModeResponse,
  ChatSession,
  ImpactAnalysisResult,
} from './types'

// --- V2 Service ---

export const v2Service = {
  // -- Domain Profile --

  /**
   * Fetch the inferred domain profile (domains, traits, confidence).
   * GET /v2/projects/{projectId}/profile
   */
  getDomainProfile(projectId: string) {
    return httpClient.get<DomainProfile>(`/v2/projects/${projectId}/profile`)
  },

  // -- Reasoning Mode --

  /**
   * Get the current reasoning mode for a project.
   * GET /v2/projects/{projectId}/reasoning-mode
   */
  getReasoningMode(projectId: string) {
    return httpClient.get<ReasoningModeResponse>(
      `/v2/projects/${projectId}/reasoning-mode`,
    )
  },

  /**
   * Set the reasoning mode for a project.
   * PUT /v2/projects/{projectId}/reasoning-mode
   */
  setReasoningMode(projectId: string, mode: ReasoningMode) {
    return httpClient.put<ReasoningModeResponse>(
      `/v2/projects/${projectId}/reasoning-mode`,
      { mode },
    )
  },

  // -- Chat Session --

  /**
   * Create a new chat/copilot session for a project.
   * POST /v2/projects/{projectId}/chat/session
   */
  createChatSession(projectId: string) {
    return httpClient.post<ChatSession>(
      `/v2/projects/${projectId}/chat/session`,
      {},
    )
  },

  /**
   * Build the WebSocket message payload for sending a chat message.
   *
   * This is NOT a REST call — the actual WebSocket connection should be
   * managed by the caller using the threadId returned from createChatSession.
   */
  buildChatPayload(threadId: string, message: string, model?: string) {
    return {
      thread_id: threadId,
      message,
      ...(model ? { model } : {}),
    }
  },

  // -- Impact Analysis --

  /**
   * Run impact analysis for a set of changed nodes.
   * POST /v2/projects/{projectId}/impact-analysis
   */
  getImpactAnalysis(projectId: string, nodeIds: string[]) {
    return httpClient.post<ImpactAnalysisResult>(
      `/v2/projects/${projectId}/impact-analysis`,
      { node_ids: nodeIds },
    )
  },
}
