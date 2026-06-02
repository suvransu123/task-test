import type { FC, RefObject } from 'react'
import { RefreshCw, Download, Loader2 } from 'lucide-react'
import { Button } from '../../../components/ui/Button'

interface OutputHeaderProps {
  title: string
  description?: string
  onRegenerate?: () => void
  isRegenerating?: boolean
  exportRef?: RefObject<HTMLElement | null>
  exportFilename?: string
  /** Explicit flag to show export button - should be true when there's data to export */
  canExport?: boolean
  /** Callback for export - handles its own export logic */
  onExport?: () => void
  /** Whether export is in progress */
  isExporting?: boolean
}

export const OutputHeader: FC<OutputHeaderProps> = ({
  title,
  description,
  onRegenerate,
  isRegenerating = false,
  exportRef,
  canExport = false,
  onExport,
  isExporting = false,
}) => {
  // Show button when canExport is true and either onExport callback is provided or exportRef is available
  const showExportButton = canExport && (!!onExport || !!exportRef)

  return (
    <div className="flex items-start justify-between mb-8">
      <div className="space-y-3">
        <h1 className="text-[28px] font-bold text-text-primary tracking-tight m-0 leading-[1.3]">
          {title}
        </h1>
        <p className="text-[15px] text-text-secondary leading-[1.6]">
          {description}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {onRegenerate && (
          <Button
            variant="unstyled"
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-accent border border-accent/30 bg-accent/5 hover:bg-accent/10 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRegenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </>
            )}
          </Button>
        )}
        {showExportButton && (
          <Button
            variant="unstyled"
            onClick={onExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-[#5E43FB] border border-[#5E43FB]/30 bg-[#5E43FB]/5 hover:bg-[#5E43FB]/10 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export to PDF"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}