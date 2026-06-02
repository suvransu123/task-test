import React, { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface HeaderTab {
  id: string
  label: string
  active?: boolean
  hasData?: boolean
  onClick?: () => void
}

interface HeaderContextType {
  tabs: HeaderTab[]
  setTabs: (tabs: HeaderTab[]) => void
  title: string | null
  setTitle: (title: string | null) => void
  actions: ReactNode | null
  setActions: (actions: ReactNode | null) => void
  /** Project details for Description popup */
  projectDetails: {
    name: string
    description: string
  } | null
  setProjectDetails: (details: { name: string; description: string } | null) => void
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined)

export const HeaderProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [tabs, setTabs] = useState<HeaderTab[]>([])
  const [title, setTitle] = useState<string | null>(null)
  const [actions, setActions] = useState<ReactNode | null>(null)
  const [projectDetails, setProjectDetails] = useState<{ name: string; description: string } | null>(null)

  return (
    <HeaderContext.Provider
      value={{ tabs, setTabs, title, setTitle, actions, setActions, projectDetails, setProjectDetails }}
    >
      {children}
    </HeaderContext.Provider>
  )
}

export const useHeader = () => {
  const context = useContext(HeaderContext)
  if (context === undefined) {
    throw new Error('useHeader must be used within a HeaderProvider')
  }
  return context
}
