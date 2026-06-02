import { createFileRoute } from '@tanstack/react-router'
import { SignInPage } from '#/pages/SignIn/SignInPage'

export const Route = createFileRoute('/public/signin')({
  component: SignInPage,
})
