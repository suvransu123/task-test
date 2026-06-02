import { createFileRoute } from '@tanstack/react-router'
import { ProjectsPage } from '#/pages/Projects/ProjectsPage'
import { workspaceService } from '#/services/workspace.service'
import { projectService } from '#/services/project.service'

interface ProjectsSearch {
  workspaceId?: string
}

export const Route = createFileRoute('/dashboard/projects/')({
  validateSearch: (search: Record<string, unknown>): ProjectsSearch => {
    return {
      workspaceId: (search.workspaceId as string) || undefined,
    }
  },
  loader: async () => {
    const [workspacesRes, projectsRes] = await Promise.all([
      workspaceService.getAll(),
      projectService.getAll(),
    ])
    return {
      workspaces: workspacesRes.data ?? [],
      projects: projectsRes.data ?? [],
    }
  },
  component: ProjectsPage,
})
