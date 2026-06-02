import React from 'react'
import { Clock, Loader2 } from 'lucide-react'
import type { DocumentVersion } from '../../../hooks/useDocumentVersions'
import { Dropdown } from '../../../components/ui/Dropdown'
import type { DropdownItem } from '../../../components/ui/Dropdown'

interface VersionSelectorProps {
  versions: DocumentVersion[]
  currentVersion: number | null
  onVersionSelect: (versionNumber: number) => void
  loading?: boolean
}

/**
 * Minimalist version selector dropdown.
 * Using the premium Dropdown component for a high-fidelity feel.
 */
export const VersionSelector: React.FC<VersionSelectorProps> = ({
  versions,
  currentVersion,
  onVersionSelect,
  loading = false,
}) => {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(date)
    } catch {
      return dateStr
    }
  }

  if (versions.length === 0 && !loading) return null

  const versionItems: DropdownItem[] = versions.map((v) => ({
    id: v.version_number,
    label: `Version ${v.version_number}`,
    metadata: formatDate(v.created_at),
    icon: Clock,
  }))

  const activeId =
    currentVersion ??
    (versions.length > 0 ? versions[0].version_number : undefined)

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 border border-border-default rounded-lg bg-surface-muted/50">
        <Loader2 className="w-3.5 h-3.5 text-text-muted animate-spin" />
        <span className="text-[11px] font-mono text-text-muted uppercase tracking-widest">
          Loading Versions...
        </span>
      </div>
    )
  }

  return (
    <Dropdown
      items={versionItems}
      selectedId={activeId}
      onSelect={(id) => onVersionSelect(Number(id))}
      icon={Clock}
      placeholder="Select Version"
      variant="outline"
      className="min-w-[220px]"
    />
  )
}
