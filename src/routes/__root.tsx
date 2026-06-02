import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import type { User } from '../services/auth.service'
import { authService } from '../services/auth.service'
import '../styles.css'

interface MyRouterContext {
  auth: typeof authService
  user?: User
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  return (
    <>
      <Outlet />
    </>
  )
}
