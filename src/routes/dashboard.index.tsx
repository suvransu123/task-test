import { createFileRoute } from '@tanstack/react-router'
import { DashboardPage } from '#/pages/Dashboard/DashboardPage'
import { workspaceService } from '#/services/workspace.service'

export const Route = createFileRoute('/dashboard/')({
  loader: async () => {
    const { data } = await workspaceService.getAll()
    return { workspaces: data ?? [] }
  },
  component: DashboardPage,
})
