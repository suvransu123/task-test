import React, { useEffect, useRef, useState, useId, useCallback } from 'react'
import { AlertCircle, RefreshCw, ZoomIn, ZoomOut, Maximize2, X, ExternalLink, Hand } from 'lucide-react'
import { Button } from '../../Button'

interface MermaidRendererProps {
  chart: string
  model?: string
  className?: string
  fullscreenTitle?: string
  onSyntaxError?: (error: string) => void
  onRetry?: () => void
  onAutoFix?: () => Promise<string | null>
  autoFixEnabled?: boolean
}

/**
 * MermaidRenderer - Renders Mermaid diagram syntax to SVG with zoom controls and fullscreen
 * 
 * Single Responsibility: Handles all mermaid diagram rendering logic
 * Open/Closed Principle: Zoom and fullscreen functionality are encapsulated and extensible
 */
export const MermaidRenderer: React.FC<MermaidRendererProps> = ({
  chart,
  className = '',
  fullscreenTitle = 'Architecture Diagram',
  onSyntaxError,
  onRetry,
  onAutoFix,
  autoFixEnabled = false,
}) => {
  const svgContainerRef = useRef<HTMLDivElement>(null)
  const fullscreenContentRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [svg, setSvg] = useState<string>('')
  const [retryKey, setRetryKey] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isHandMode, setIsHandMode] = useState(false)
  const [isAutoFixing, setIsAutoFixing] = useState(false)
  const [fixedChartVersions, setFixedChartVersions] = useState<string[]>([])
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0)
  const [autoFixAttempts, setAutoFixAttempts] = useState(0)
  const uniqueId = useId()
  
  // Maximum auto-fix retries
  const MAX_AUTO_FIX_ATTEMPTS = 3

  // Zoom state (only used in inline mode)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Zoom limits
  const MIN_SCALE = 0.25
  const MAX_SCALE = 5
  const ZOOM_STEP = 0.1

  // Memoize chart to prevent unnecessary re-renders
  // Use latest fixed version if available, otherwise use original chart
  const chartTrimmed = fixedChartVersions[currentVersionIndex]?.trim() || chart?.trim() || ''

  useEffect(() => {
    // Skip if no chart content
    if (!chartTrimmed) {
      setIsLoading(false)
      setError('No diagram content provided')
      return
    }

    let isMounted = true

    const renderDiagram = async () => {
      setIsLoading(true)
      setError(null)

      // Declared outside try so the catch block can clean up the orphan
      // container mermaid may attach to <body> on failure.
      const diagramId = `mermaid-${uniqueId}-${Date.now()}`

      try {
        // Dynamic import of mermaid to avoid SSR issues
        const mermaid = (await import('mermaid')).default

        // Initialize mermaid with theme configuration
        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: {
            primaryColor: '#5E43FB',
            primaryTextColor: '#1a1a2e',
            primaryBorderColor: '#5E43FB',
            lineColor: '#6B7280',
            secondaryColor: '#F3F4F6',
            tertiaryColor: '#FAFAFA',
            background: '#FFFFFF',
            mainBkg: '#FFFFFF',
            nodeBorder: '#D1D5DB',
            clusterBkg: '#F9FAFB',
            titleColor: '#1a1a2e',
            edgeLabelBackground: '#FFFFFF',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '14px',
          },
          flowchart: {
            htmlLabels: true,
            curve: 'basis',
            padding: 20,
          },
          sequence: {
            actorMargin: 50,
            boxMargin: 10,
            boxTextMargin: 5,
            noteMargin: 10,
            messageMargin: 35,
            mirrorActors: true,
          },
        })

        // Pre-validate so mermaid never invokes render() on bad input. When
        // render() fails, mermaid leaves an orphan <div id="d{id}"> on <body>
        // containing its built-in "Syntax error in text / mermaid version X"
        // SVG. Validating first avoids that injection entirely. The auto-fix
        // path below still fires because we throw with "Syntax" in the message.
        const parseResult = await mermaid.parse(chartTrimmed, { suppressErrors: true })
        if (parseResult === false) {
          throw new Error('Syntax error in mermaid diagram')
        }

        // Render the diagram
        const { svg: renderedSvg } = await mermaid.render(diagramId, chartTrimmed)

        if (isMounted) {
          setSvg(renderedSvg)
          setIsLoading(false)
        }
      } catch (err) {
        // Defensive cleanup: if mermaid still managed to attach an error SVG
        // to <body> (older builds or edge cases), remove the orphan element
        // so it doesn't leak under the panel.
        document.getElementById(`d${diagramId}`)?.remove()
        document.getElementById(diagramId)?.remove()

        if (isMounted) {
          console.error('Mermaid rendering error:', err)
          const errorMessage = err instanceof Error ? err.message : 'Failed to render diagram'
          // Check if this is a syntax error
          const isSyntaxError = errorMessage.toLowerCase().includes('syntax') || 
            errorMessage.toLowerCase().includes('parse') ||
            errorMessage.toLowerCase().includes('unexpected') ||
            errorMessage.toLowerCase().includes('invalid')
          
          // Auto-fix logic: retry with fixed content if enabled and under max attempts
          // Show loading state immediately - don't show error while auto-fixing
          console.debug('Mermaid syntax error detected:', errorMessage, 'Auto-fix enabled:', autoFixEnabled, 'Attempts:', autoFixAttempts, 'Max attempts:', MAX_AUTO_FIX_ATTEMPTS, isSyntaxError)
          if (isSyntaxError && autoFixEnabled && onAutoFix && autoFixAttempts < MAX_AUTO_FIX_ATTEMPTS) {
            setIsAutoFixing(true)
            
            try {
              const fixedContent = await onAutoFix()
              if (fixedContent && isMounted) {
                // Add to fixed versions array for tracking
                setFixedChartVersions(prev => [...prev, fixedContent])
                setCurrentVersionIndex(prev => prev + 1)
                setAutoFixAttempts(prev => prev + 1)
                setIsAutoFixing(false)
                // Trigger re-render with fixed content
                setRetryKey((prev) => prev + 1)
              } else if (isMounted) {
                setIsAutoFixing(false)
                setError(errorMessage)
              }
            } catch (fixErr) {
              console.error('Auto-fix failed:', fixErr)
              if (isMounted) {
                setIsAutoFixing(false)
                setError(errorMessage)
              }
            }
          } else {
            // Only show error if auto-fix is not enabled or max retries reached
            setError(errorMessage)
            setIsLoading(false)
            if (isSyntaxError && onSyntaxError) {
              onSyntaxError(errorMessage)
            }
          }
        }
      }
    }

    renderDiagram()

    return () => {
      isMounted = false
    }
  }, [chartTrimmed, retryKey, uniqueId, fixedChartVersions[currentVersionIndex]])

  // Reset auto-fix state when chart changes
  useEffect(() => {
    setFixedChartVersions([])
    setCurrentVersionIndex(0)
    setAutoFixAttempts(0)
  }, [chart])

  // Reset zoom when chart changes
  useEffect(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [chartTrimmed])

  const handleRetry = () => {
    setRetryKey((prev) => prev + 1)
    if (onRetry) onRetry()
  }

  // Zoom handlers (only for inline mode)
  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + ZOOM_STEP, MAX_SCALE))
  }, [])

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - ZOOM_STEP, MIN_SCALE))
  }, [])

  const handleResetZoom = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  // Fullscreen handlers
  const openFullscreen = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
    setIsHandMode(false)
    setIsFullscreen(true)
  }, [])

  const closeFullscreen = useCallback(() => {
    setIsFullscreen(false)
    setScale(1)
    setPosition({ x: 0, y: 0 })
    setIsHandMode(false)
  }, [])

  // Toggle hand mode
  const toggleHandMode = useCallback(() => {
    setIsHandMode((prev) => !prev)
  }, [])

  // Handle escape key to close fullscreen
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        closeFullscreen()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isFullscreen, closeFullscreen])

  // Reserved for future inline panning feature
// Reserved for future inline panning feature - intentionally unused but kept for potential future implementation
// @ts-expect-error - reserved for future use
const handleInlineMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }, [position])

  const handleInlineMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()
    e.stopPropagation()
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }, [isDragging, dragStart])

  const handleInlineMouseUp = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  // Scroll to zoom (inline mode only)
  // Use non-passive event listener on the diagram container to properly prevent page scroll
  useEffect(() => {
    const container = svgContainerRef.current?.parentElement
    if (!container) return

    // Create handler
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
      
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
      setScale((prev) => Math.min(Math.max(prev + delta, MIN_SCALE), MAX_SCALE))
    }

    // Add as non-passive to allow preventDefault
    container.addEventListener('wheel', handler, { passive: false })

    return () => {
      container.removeEventListener('wheel', handler)
    }
  }, [chartTrimmed])

  // Prevent page scrolling in inline mode
  const handleInlineContainerMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      e.preventDefault()
    }
  }, [])

  // Mouse event handlers for fullscreen drag mode
  const handleFullscreenMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isHandMode || e.button !== 0) return
    e.preventDefault()
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }, [isHandMode, position])

  const handleFullscreenMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !isHandMode) return
    e.preventDefault()
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }, [isDragging, isHandMode, dragStart])

  const handleFullscreenMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Prevent context menu on diagram
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
  }, [])

  // Render inline diagram content (with scroll to zoom)
  const renderInlineContent = useCallback(() => (
    <div
      className={`relative flex-1 overflow-hidden rounded-xl border border-border-default bg-white ${
        isDragging ? 'cursor-grabbing' : scale > 1 ? 'cursor-grab' : ''
      }`}
      style={{ minHeight: '300px' }}
      onMouseDown={handleInlineContainerMouseDown}
      onMouseMove={handleInlineMouseMove}
      onMouseUp={handleInlineMouseUp}
      onMouseLeave={handleInlineMouseUp}
      onContextMenu={handleContextMenu}
    >
      {isLoading ? (
        <div className="flex items-center justify-center w-full h-full min-h-75">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : svg ? (
        <div
          ref={svgContainerRef}
          className="mermaid-svg-container w-full h-full flex items-center justify-center p-4"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full min-h-75 text-text-secondary">
          No diagram content
        </div>
      )}
    </div>
  ), [svg, isLoading, scale, position, isDragging, handleInlineMouseMove, handleInlineMouseUp, handleInlineContainerMouseDown, handleContextMenu])

  // Render fullscreen diagram content (with hand mode for drag)
  const renderFullscreenContent = useCallback(() => (
    <div
      className={`relative flex-1 overflow-hidden bg-gray-50 ${
        isHandMode ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''
      }`}
      style={{ minHeight: '100%' }}
      onMouseDown={handleFullscreenMouseDown}
      onMouseMove={handleFullscreenMouseMove}
      onMouseUp={handleFullscreenMouseUp}
      onMouseLeave={handleFullscreenMouseUp}
      onContextMenu={handleContextMenu}
    >
      {isLoading ? (
        <div className="flex items-center justify-center w-full h-full">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : svg ? (
        <div
          className="mermaid-svg-container w-full h-full flex items-center justify-center p-4"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full text-text-secondary">
          No diagram content
        </div>
      )}
    </div>
  ), [svg, isLoading, scale, position, isDragging, isHandMode, handleFullscreenMouseDown, handleFullscreenMouseMove, handleFullscreenMouseUp, handleContextMenu])

  // Render zoom controls for inline mode
  const renderInlineZoomControls = useCallback(() => (
    <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-white/95 backdrop-blur-sm border border-border-default rounded-lg shadow-lg p-1">
      <Button
        variant="unstyled"
        onClick={handleZoomOut}
        disabled={scale <= MIN_SCALE}
        className="p-2 text-text-secondary hover:text-accent hover:bg-accent/10 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        title="Zoom out (scroll down on diagram)"
      >
        <ZoomOut className="w-4 h-4" />
      </Button>
      <span className="px-2 text-xs font-medium text-text-secondary min-w-12 text-center">
        {Math.round(scale * 100)}%
      </span>
      <Button
        variant="unstyled"
        onClick={handleZoomIn}
        disabled={scale >= MAX_SCALE}
        className="p-2 text-text-secondary hover:text-accent hover:bg-accent/10 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        title="Zoom in (scroll up on diagram)"
      >
        <ZoomIn className="w-4 h-4" />
      </Button>
      <div className="w-px h-5 bg-border-default mx-1" />
      <Button
        variant="unstyled"
        onClick={handleResetZoom}
        className="p-2 text-text-secondary hover:text-accent hover:bg-accent/10 rounded transition-colors"
        title="Reset zoom"
      >
        <Maximize2 className="w-4 h-4" />
      </Button>
      <div className="w-px h-5 bg-border-default mx-1" />
      <Button
        variant="unstyled"
        onClick={openFullscreen}
        className="p-2 text-text-secondary hover:text-accent hover:bg-accent/10 rounded transition-colors"
        title="Open in fullscreen"
      >
        <ExternalLink className="w-4 h-4" />
      </Button>
    </div>
  ), [scale, handleZoomIn, handleZoomOut, handleResetZoom, openFullscreen])

  // Render zoom controls for fullscreen mode
  const renderFullscreenControls = useCallback(() => (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      <Button
        variant="unstyled"
        onClick={handleZoomOut}
        disabled={scale <= MIN_SCALE}
        className="p-1.5 text-text-secondary hover:text-accent hover:bg-white rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        title="Zoom out"
      >
        <ZoomOut className="w-4 h-4" />
      </Button>
      <span className="px-2 text-xs font-medium text-text-secondary min-w-12 text-center">
        {Math.round(scale * 100)}%
      </span>
      <Button
        variant="unstyled"
        onClick={handleZoomIn}
        disabled={scale >= MAX_SCALE}
        className="p-1.5 text-text-secondary hover:text-accent hover:bg-white rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        title="Zoom in"
      >
        <ZoomIn className="w-4 h-4" />
      </Button>
      <div className="w-px h-4 bg-gray-300 mx-1" />
      <Button
        variant="unstyled"
        onClick={handleResetZoom}
        className="p-1.5 text-text-secondary hover:text-accent hover:bg-white rounded transition-colors"
        title="Reset zoom"
      >
        <Maximize2 className="w-4 h-4" />
      </Button>
      <div className="w-px h-4 bg-gray-300 mx-1" />
      <Button
        variant="unstyled"
        onClick={toggleHandMode}
        className={`p-1.5 rounded transition-colors ${
          isHandMode
            ? 'text-accent bg-white shadow-sm'
            : 'text-text-secondary hover:text-accent hover:bg-white'
        }`}
        title={isHandMode ? 'Hand mode active - drag to move' : 'Enable hand mode to drag diagram'}
      >
        <Hand className="w-4 h-4" />
      </Button>
    </div>
  ), [scale, handleZoomIn, handleZoomOut, handleResetZoom, toggleHandMode, isHandMode])

  // Show error only if:
  // - Error exists AND
  // - Not currently auto-fixing AND
  // - Either no fixed versions exist (first attempt failed) OR max retries have been exhausted
  const showError = error && !isAutoFixing && (fixedChartVersions.length === 0 || autoFixAttempts >= MAX_AUTO_FIX_ATTEMPTS)
  
  if (showError) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-xl ${className}`}>
        <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
        <p className="text-sm text-red-600 font-medium mb-4 text-center max-w-md">
          {error}
        </p>
        <Button
          variant="unstyled"
          onClick={handleRetry}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </Button>
      </div>
    )
  }

  // Show auto-fixing loading state with retry count
  if (isAutoFixing) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-amber-50 border border-amber-200 rounded-xl ${className}`}>
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-amber-600 font-medium mb-2 text-center max-w-md">
          Auto-fixing diagram syntax (attempt {autoFixAttempts + 1}/{MAX_AUTO_FIX_ATTEMPTS})...
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Inline Diagram (Architecture Diagram tab) */}
      <div className={`relative flex flex-col ${className}`}>
        {renderInlineZoomControls()}
        {renderInlineContent()}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center"
          onClick={closeFullscreen}
        >
          <div
            className="relative w-[95vw] h-[95vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-default bg-white shrink-0">
              <h3 className="text-lg font-semibold text-text-primary">{fullscreenTitle}</h3>
              <div className="flex items-center gap-2">
                {renderFullscreenControls()}
                <Button
                  variant="unstyled"
                  onClick={closeFullscreen}
                  className="p-2 text-text-secondary hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                  title="Close fullscreen"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Diagram Content - Takes full space */}
            <div ref={fullscreenContentRef} className="flex-1 overflow-hidden relative">
              {renderFullscreenContent()}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default MermaidRenderer