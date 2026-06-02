/**
 * Centralized type definitions for shared interfaces across the application.
 * This file ensures type consistency and follows the DRY principle.
 */

// Project-related types
export interface Thread {
  id: number
  session_id: number
  thread_id: string
  remarks: string
  is_completed: boolean
  input_document_ids: string[]
  output_document_id: string | null
  version_number: number
  state: Record<string, unknown>
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
}

export interface Session {
  id: number
  phase_id: string
  title: string
  user_id: string
  session_index: number
  docs_required: boolean
  required_docs?: RequiredDoc[]
  created_at: string
  updated_at: string | null
  threads: Thread[]
}

export interface RequiredDoc {
  session_id: number
  phase_id: string
}

export interface PhaseResponse {
  project_id: string
  name: string
  index: number
  id: number
  phase_id: string
  created_at: string
  updated_at: string | null
  sessions: Session[]
}

// Document-related types
export interface DocumentVersion {
  version_number: number
  created_at: string
}

export interface Document {
  id: string
  name: string
  type: string
  content: unknown
  created_at: string
  updated_at?: string
}

// Project types (from workspace.service)
export interface Project {
  name: string
  description: string
  phases: number[]
  id: number
  project_id: string
  workspace_id: string
  members: string[]
  created_at: string
  updated_at: string | null
}

export interface Workspace {
  name: string
  description: string
  id: number
  workspace_id: string
  user_id: string
  members: string[]
  created_at: string
  updated_at: string | null
  projects: Project[]
}

// API Response types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  status: number
  validationErrors?: Record<string, string>
}

// V2 Service types
export interface PipelineStep {
  session_index: number
  name: string
  status: string
  is_extra: boolean
}

export interface PipelinePlan {
  domains: string[]
  traits: string[]
  steps: PipelineStep[]
  total_steps: number
  active_steps: number
  skipped_steps: number
  extra_steps: number
}

export interface DomainProfile {
  domains: string[]
  traits: string[]
  confidence: number
}

export type ReasoningMode = 'minimal' | 'audit' | 'full'

export interface ReasoningModeResponse {
  mode: ReasoningMode
}

export interface ChatSession {
  session_id: string
  thread_id: string
}

export interface ImpactAnalysisResult {
  directly_affected: string[]
  downstream: string[]
  stale_exports: string[]
  requires_regeneration: boolean
}
