// Types are now centralized in services/types.ts
import { httpClient } from './httpClient'
import {
  getDocumentContent,
  getDocumentVersions,
  getVersionContent,
} from './common.service'
import type { Project } from './types'

export type { Project } from './types'

export interface CreateProjectRequest {
  name: string
  description: string
}

export const projectService = {
  /**
   * Fetches all projects for the authenticated user.
   */
  async getAll(skip = 0, limit = 100) {
    return httpClient.get<Project[]>(`/projects?skip=${skip}&limit=${limit}`)
  },

  /**
   * Creates a new project under a workspace.
   */
  async create(workspaceId: string, payload: CreateProjectRequest) {
    return httpClient.post<Project>(
      `/workspaces/${workspaceId}/projects`,
      payload,
    )
  },

  /**
   * Fetches a single project by its ID.
   */
  async getById(projectId: string) {
    return httpClient.get<Project>(`/projects/${projectId}`)
  },

  getDocumentContent,
  getDocumentVersions,
  getVersionContent,

  /**
   * Updates a document's content and description.
   */
  async updateDocument(
    documentId: string,
    payload: { content: string; description?: string },
  ) {
    return httpClient.put<any>(`/documents/${documentId}`, payload)
  },

  /**
   * Fixes a Mermaid diagram string using the specified model.
   */
  async fixMermaid(mermaid: string, model: string) {
    return httpClient.post<{ mermaid: string }>('/mermaid/fix', {
      mermaid,
      model,
    })
  },

  /**
   * Fetches project graph data for a specific session index.
   * @param projectId - The project ID
   * @param sessionIndex - The session index (1-based): 1=Brief, 2=User Stories, etc.
   */
  async getProjectGraph(projectId: string, sessionIndex: number) {
    return httpClient.get<GraphResponse>(`/projects/${projectId}/graph?session_index=${sessionIndex}`)
  },

  /**
   * Fetches architecture diagrams for a specific session index.
   * @param projectId - The project ID
   * @param sessionIndex - The session index (3=Technical Architecture)
   */
  async getProjectDiagrams(projectId: string, sessionIndex: number) {
    return httpClient.get<DiagramResponse>(`/projects/${projectId}/diagrams?session_index=${sessionIndex}`)
  },

  /**
   * Fixes syntax errors in a Mermaid diagram.
   * @param projectId - The project ID
   * @param diagramId - The diagram ID (e.g., "DIAG-S3-P1")
   */
  async fixDiagramSyntax(projectId: string, diagramId: string) {
    return httpClient.post<{ fixed_content: string }>(
      `/projects/${projectId}/diagrams/${diagramId}/fix-syntax`,
      {},
    )
  },

  /**
   * Replaces the full content of a single graph node.
   * @param projectId - The project ID
   * @param nodeId - The node's id (e.g., "milestone-0002")
   * @param content - The new content object (entire replacement, not a diff)
   */
  async updateNodeContent(
    projectId: string,
    nodeId: string,
    content: Record<string, unknown>,
  ) {
    return httpClient.patch<unknown>(
      `/projects/${projectId}/nodes/${nodeId}/content`,
      { content },
    )
  },
}

// Graph API Response types
export interface GraphNodeSource {
  session?: number
  thread_id?: string
  message_ids?: string[]
  created_by?: string
  updated_by?: string
}

export interface GraphNode {
  id: string
  type: string
  title: string
  content?: {
    id?: string
    type?: string
    content?: Record<string, any>
    inference_reason?: string
    confirmation_status?: string
    source?: GraphNodeSource
    status?: string
    tags?: string[]
    l0_summary?: string
    l1_summary?: string
    // Common fields
    name?: string
    description?: string
    relevance?: string
    cross_domain?: boolean
    parent_domain?: string
    // Goal fields
    priority?: string
    business_impact?: string
    success_metrics?: string[]
    statement?: string
    non_goals?: string[]
    assumptions_constraints?: string[]
    // Assumption fields
    impact_severity?: string
    impact_if_wrong?: string
    validity_criteria?: string
    category?: string
    // Stakeholder fields
    stakeholder_type?: string
    role?: string
    how_they_are_affected?: string
    needs?: string[]
    // Trait fields
    evidence?: string
    // DecisionPoint fields
    selected_option?: string
    decision_rationale?: string
    condition?: string
    options?: string[]
    default_option?: string
    requires_human_input?: boolean
    // Component fields
    responsibility?: string
    boundaries?: string[]
    inputs?: string[]
    outputs?: string[]
    // Metadata
    metadata?: Record<string, any>
  }
  confidence?: string
  inference_reason?: string
  confirmation_status?: string
  source?: GraphNodeSource
  status?: string
  tags?: string[]
  l0_summary?: string
  l1_summary?: string
}

export interface GraphEdge {
  id: string
  type: string
  from_id: string
  to_id: string
  confidence?: string
  inference_reason?: string
  confirmation_status?: string
  status?: string
  metadata?: Record<string, any>
}

export interface GraphResponse {
  nodes: GraphNode[]
  edges?: GraphEdge[]
}

// Diagram API Response types
export interface DiagramResponse {
  diagrams: Diagram[]
}

export interface Diagram {
  id: string
  type: string
  title?: string
  content?: string
  mermaid?: string
  description?: string
  metadata?: Record<string, any>
}

// Legacy OutputNode type for backward compatibility
export interface OutputNode {
  id: string
  type: string
  title: string
  description?: string
  content?: Record<string, any>
  data?: Record<string, any>
  metadata?: Record<string, any>
  confidence?: string
  status?: string
  session?: number
  created_at?: string
  updated_at?: string
  inference_reason?: string
  confirmation_status?: string
  source?: GraphNodeSource
  tags?: string[]
  l0_summary?: string
  l1_summary?: string
}

export type OutputNodeType =
  | 'Domain'
  | 'Subdomain'
  | 'Trait'
  | 'ProblemStatement'
  | 'DesiredOutcome'
  | 'Goal'
  | 'Stakeholder'
  | 'Risk'
  | 'Assumption'
  | 'UserStory'
  | 'Requirement'
  | 'FunctionalRequirement'
  | 'Architecture'
  | 'Technology'
  | 'Flow'
  | 'UserFlow'
  | 'DataModel'
  | 'Entity'
  | 'DecisionPoint'
  | 'Capability'
  | 'Persona'
  | 'Component'
  | 'BudgetCategory'
  | 'InvestmentItem'
  | 'EffortEstimate'
  | 'RiskItem'
  | 'Milestone'
  | 'Deliverable'
  | 'ComplexityRating'
  | 'Contingency'
  | 'Dependency'
  | 'RoiProjection'
  | string

export interface OutputNodeResponse {
  nodes: OutputNode[]
  session: number | null
  count: number
}
