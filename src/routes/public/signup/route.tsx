import { createFileRoute } from '@tanstack/react-router'
import { SignUpPage } from '#/pages/SignUp/SignUpPage'

export const Route = createFileRoute('/public/signup')({
  component: SignUpPage,
})
