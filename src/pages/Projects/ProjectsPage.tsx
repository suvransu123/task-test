import React, { useState, useMemo } from 'react'
import { formatRelativeTime } from '../../utils/date'
import { ProjectCard } from '../../components/ui/ProjectCard'
import { CreateProjectCard } from '../../components/ui/CreateProjectCard'
import { Button } from '../../components/ui/Button'
import { CreateProjectModal } from '../../components/ui/CreateProjectModal'
import { Plus, ListFilter, ArrowUpDown, FolderKanban, Search, X } from 'lucide-react'
import { getRouteApi, useRouter } from '@tanstack/react-router'

const projectsRoute = getRouteApi('/dashboard/projects/')

export const ProjectsPage: React.FC = () => {
  const { workspaces, projects } = projectsRoute.useLoaderData()
  const { workspaceId } = projectsRoute.useSearch()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const selectedWorkspace = useMemo(() => {
    return workspaces.find((w) => w.workspace_id === workspaceId)
  }, [workspaces, workspaceId])

  const handleProjectCreated = async () => {
    setIsModalOpen(false)
    await router.invalidate()
  }

  const filteredProjects = useMemo(() => {
    let result = [...projects].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )

    if (workspaceId) {
      result = result.filter((project) => project.workspace_id === workspaceId)
    }

    if (!searchQuery.trim()) return result

    const query = searchQuery.toLowerCase()
    return result.filter(
      (project) =>
        project.name.toLowerCase().includes(query) ||
        (project.description &&
          project.description.toLowerCase().includes(query)),
    )
  }, [projects, searchQuery, workspaceId])

  const handleClearWorkspaceFilter = () => {
    router.navigate({
      to: '/dashboard/projects',
      search: (prev: any) => ({ ...prev, workspaceId: undefined }),
    })
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
            {selectedWorkspace
              ? `${selectedWorkspace.name}`
              : 'Project Intelligence'}
          </h1>
          <p
            className="text-base text-text-secondary font-medium max-w-xl leading-relaxed"
            style={{
              fontSize: '1.0625rem',
              lineHeight: 1.65,
            }}
          >
            Manage your project ecosystem, architecture modules, and archives
            from a unified intelligence view.
          </p>
        </div>
        <Button
          className="bg-accent hover:bg-accent/90 text-white gap-2 px-6 h-12 rounded-xl shadow-lg shadow-accent/25 transition-all active:scale-95 group overflow-hidden relative"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-5 h-5" />
          <span className="font-semibold text-sm">New Project</span>
        </Button>
      </div>

      {/* Search & Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 w-full">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="Search our database..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-surface-muted text-text-primary border border-border-default rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent/30 transition-all placeholder:text-text-muted placeholder:font-medium"
            />
          </div>

          {/* Clear Filter Chip */}
          {workspaceId && (
            <Button
              variant="unstyled"
              onClick={handleClearWorkspaceFilter}
              className="flex items-center gap-2 h-10 px-4 bg-surface border border-border-default text-text-secondary hover:border-accent hover:text-accent rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-sm"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              Clear Filter
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Sort & Filter Buttons */}
        <div className="flex items-center gap-3">
          <Button variant="unstyled" className="flex items-center gap-2 h-12 px-5 bg-surface border border-border-default text-text-primary rounded-xl text-xs font-bold shadow-sm hover:border-accent transition-all">
            <ArrowUpDown className="w-4 h-4 text-accent" />
            SORT
          </Button>
          <Button variant="unstyled" className="flex items-center gap-2 h-12 px-5 bg-surface border border-border-default text-text-primary rounded-xl text-xs font-bold shadow-sm hover:border-accent transition-all">
            <ListFilter className="w-4 h-4 text-accent" />
            FILTER
          </Button>
        </div>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredProjects.map((project) => (
          <ProjectCard
            key={project.project_id}
            title={project.name}
            subtitle={project.description}
            updatedAt={formatRelativeTime(project.created_at)}
            icon={<FolderKanban className="w-6 h-6" />}
            onClick={() =>
              router.navigate({
                to: `/dashboard/projects/${project.project_id}`,
              })
            }
          />
        ))}
        <CreateProjectCard onClick={() => setIsModalOpen(true)} />
      </div>

      {/* Empty State - No results */}
      {filteredProjects.length === 0 && projects.length > 0 && (
        <div className="mt-6 py-6 text-center border-2 border-dashed border-border-default rounded-3xl">
          <p className="text-text-secondary font-medium">
            No projects found matching "{searchQuery}"
          </p>
          <Button
            variant="ghost"
            onClick={() => setSearchQuery('')}
            className="mt-2 text-text-muted hover:text-text-secondary"
          >
            Clear search
          </Button>
        </div>
      )}

      {/* Empty State - No projects at all */}
      {projects.length === 0 && (
        <p className="text-sm text-text-muted mt-4">
          No projects yet. Create your first one to get started!
        </p>
      )}

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        workspaces={workspaces}
        onSuccess={handleProjectCreated}
        initialWorkspaceId={workspaceId}
      />
    </main>
  )
}