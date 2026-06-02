import { useState } from 'react'
import { WorkspaceCard } from '../../components/ui/WorkspaceCard'
import { CreateProjectCard } from '../../components/ui/CreateProjectCard'
import { Plus } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { CreateEntityModal } from '../../components/ui/CreateEntityModal'
import { getRouteApi, useRouter } from '@tanstack/react-router'
import { workspaceService } from '../../services/workspace.service'

const dashboardRoute = getRouteApi('/dashboard')
const dashboardIndexRoute = getRouteApi('/dashboard/')

export const DashboardPage: React.FC = () => {
  const { user } = dashboardRoute.useLoaderData()
  const { workspaces: rawWorkspaces } = dashboardIndexRoute.useLoaderData()
  const workspaces = [...rawWorkspaces].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const router = useRouter()

  const handleCreateWorkspace = async (data: {
    name: string
    description: string
  }) => {
    const { data: created, error, status } = await workspaceService.create(data)

    if (status === 422 || error) {
      return {
        success: false,
        error: error || 'Validation error. Please check your input.',
      }
    }

    if (created) {
      await router.invalidate()
      return { success: true }
    }

    return { success: false, error: 'Something went wrong.' }
  }

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-10 gap-4 flex-col sm:flex-row">
        <div>
          <h1
            className="text-3xl font-bold text-text-primary mb-2"
            style={{
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.03em',
            }}
          >
            Welcome back, {(user?.full_name || 'Member').split(' ')[0]}
          </h1>
          <p
            className="text-base text-text-secondary font-medium max-w-xl leading-relaxed"
            style={{
              fontSize: '1.0625rem',
              lineHeight: 1.65,
            }}
          >
            Your workspace ecosystem is active. Here's a summary of your recent
            intelligence modules and projects.
          </p>
        </div>
        <Button
          className="bg-accent hover:bg-accent/90 text-white gap-2 px-6 h-12 rounded-xl shadow-lg shadow-accent/25 transition-all active:scale-95 group overflow-hidden relative"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="w-5 h-5" />
          <span className="font-semibold text-sm">New Workspace</span>
        </Button>
      </div>

      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <span
          className="text-xs font-bold text-text-muted uppercase whitespace-nowrap"
          style={{
            letterSpacing: '0.2em',
          }}
        >
          Your Workspace Ecosystem
        </span>
        <div className="h-px flex-1 bg-border-default" />
      </div>

      {/* Workspace Grid */}
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
        }}
      >
        <style>
          {`
            @media (min-width: 640px) {
              .workspace-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            }
            @media (min-width: 768px) {
              .workspace-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            }
            @media (min-width: 1024px) {
              .workspace-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
            }
          `}
        </style>
        <div className="grid gap-3 workspace-grid">
          {workspaces.map((workspace) => (
            <WorkspaceCard
              key={workspace.workspace_id}
              workspace={workspace}
              onClick={() =>
                router.navigate({
                  to: '/dashboard/projects',
                  search: { workspaceId: workspace.workspace_id },
                })
              }
            />
          ))}
          <CreateProjectCard
            label="Create New Workspace"
            onClick={() => setIsCreateModalOpen(true)}
          />
        </div>
      </div>

      {workspaces.length === 0 && (
        <p className="text-sm text-text-muted mt-4">
          No workspaces yet. Create your first one to get started!
        </p>
      )}

      <CreateEntityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        entityType="workspace"
        onSubmit={handleCreateWorkspace}
      />
    </main>
  )
}