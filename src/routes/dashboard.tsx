import { useState } from 'react'
import {
  createFileRoute,
  Outlet,
  redirect,
  useLocation,
} from '@tanstack/react-router'
import { DashboardHeader } from '#/components/dashboard/DashboardHeader'
import { Sidebar } from '#/components/dashboard/Sidebar'
import { authService } from '#/services/auth.service'
import { HeaderProvider } from '#/context/HeaderContext'
import { DataSourceProvider } from '#/context/DataSourceContext'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated()) {
      throw redirect({
        to: '/public/signin',
        search: {
          redirect: location.href,
        },
      })
    }
  },
  loader: async () => {
    const { data, error } = await authService.getMe()
    if (error || !data) {
      // If we can't get the user profile, the token might be invalid/expired
      authService.logout()
      throw redirect({ to: '/public/signin' })
    }
    return { user: data }
  },
  component: DashboardLayout,
})

function DashboardLayout() {
  const { user } = Route.useLoaderData()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const location = useLocation()

  // Show sidebar ONLY on project detail pages (/dashboard/projects/[id])
  // Not on /dashboard or /dashboard/projects (list)
  const isProjectDetailPage = /^\/dashboard\/projects\/[^\/]+$/.test(
    location.pathname,
  )

  return (
    <HeaderProvider>
      <DataSourceProvider>
        <div className="flex flex-col h-screen overflow-hidden">
          <DashboardHeader user={user} />
          <div className="flex-1 flex min-w-0 font-sans overflow-hidden">
            {isProjectDetailPage && (
              <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              />
            )}
            <main className="flex-1 overflow-y-auto custom-scrollbar">
              <Outlet />
            </main>
          </div>
        </div>
      </DataSourceProvider>
    </HeaderProvider>
  )
}
