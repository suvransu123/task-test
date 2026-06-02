import { createFileRoute } from '@tanstack/react-router'
import { ProcessPage } from '#/pages/Process/ProcessPage'

export const Route = createFileRoute('/public/process')({
  component: ProcessPage,
})
