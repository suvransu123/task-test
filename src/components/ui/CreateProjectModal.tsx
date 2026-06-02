import React from 'react'
import { Modal } from './Modal'
import { ProjectCreationForm } from './ProjectCreationForm'
import type { Workspace } from '../../services/workspace.service'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  workspaces: Workspace[]
  onSuccess: () => void
  initialWorkspaceId?: string
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  workspaces,
  onSuccess,
  initialWorkspaceId,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Project"
      size="2xl"
    >
      <ProjectCreationForm
        workspaces={workspaces}
        onSuccess={onSuccess}
        onCancel={onClose}
        initialWorkspaceId={initialWorkspaceId}
      />
    </Modal>
  )
}
