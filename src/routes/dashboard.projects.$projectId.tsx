import { createFileRoute } from '@tanstack/react-router'
import { ProjectDetailPage } from '#/pages/Projects/ProjectDetailPage'

export const Route = createFileRoute('/dashboard/projects/$projectId')({
  component: () => {
    const { projectId } = Route.useParams()
    return <ProjectDetailPage projectId={projectId} />
  },
})
