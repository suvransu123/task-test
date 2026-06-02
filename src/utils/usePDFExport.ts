/**
 * usePDFExport Hook
 * 
 * Single Responsibility: Manages PDF export state and provides export functionality
 * Dependency Inversion: Depends on abstract exportToPDF function
 * Interface Segregation: Clean interface with only needed methods
 */

import { useState, useCallback } from 'react'
import type { RefObject } from 'react'
import type { PDFExportOptions } from './pdfExporter'
import { exportToPDF } from './pdfExporter'

// Exported state interface - abstraction of export state
export interface UsePDFExportState {
  isExporting: boolean
  error: string | null
}

// Exported actions interface - abstraction of export actions
export interface UsePDFExportActions {
  exportPDF: (options?: PDFExportOptions) => Promise<void>
  resetError: () => void
}

// Combined type for external use
export type UsePDFExport = UsePDFExportState & UsePDFExportActions

// Error handling helper - single responsibility for error messages
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'An unknown error occurred during PDF export'
}

/**
 * Custom hook for PDF export functionality
 * 
 * @param targetRef - Ref to the DOM element to export
 * @param defaultFilename - Default filename prefix for exports
 * @returns Object with export state and actions
 * 
 * @example
 * ```tsx
 * const { isExporting, exportPDF } = usePDFExport(contentRef, 'project-report')
 * 
 * return (
 *   <>
 *     <div ref={contentRef}>{/* content to export *\/}</div>
 *     <button onClick={() => exportPDF({ filename: 'custom-name' })}>Export PDF</button>
 *   </>
 * )
 * ```
 */
export const usePDFExport = (
  targetRef: RefObject<HTMLElement | null>,
  defaultFilename: string = 'export'
): UsePDFExport => {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const exportPDF = useCallback(
    async (options: PDFExportOptions = {}) => {
      // Reset previous errors
      setError(null)
      setIsExporting(true)

      try {
        const element = targetRef.current

        if (!element) {
          throw new Error('Export target element not found')
        }

        await exportToPDF(element, {
          ...options,
          filename: options.filename || defaultFilename,
        })
      } catch (err) {
        const errorMessage = getErrorMessage(err)
        setError(errorMessage)
        console.error('PDF Export Error:', err)
      } finally {
        setIsExporting(false)
      }
    },
    [targetRef, defaultFilename]
  )

  const resetError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isExporting,
    error,
    exportPDF,
    resetError,
  }
}

/**
 * Hook for exporting without a ref (for dynamically targeting elements)
 * Uses element ID selector instead
 */
export const usePDFExportById = (
  elementId: string,
  defaultFilename: string = 'export'
): UsePDFExport => {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const exportPDF = useCallback(
    async (options: PDFExportOptions = {}) => {
      setError(null)
      setIsExporting(true)

      try {
        const element = document.getElementById(elementId)

        await exportToPDF(element, {
          ...options,
          filename: options.filename || defaultFilename,
        })
      } catch (err) {
        const errorMessage = getErrorMessage(err)
        setError(errorMessage)
        console.error('PDF Export Error:', err)
      } finally {
        setIsExporting(false)
      }
    },
    [elementId, defaultFilename]
  )

  const resetError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isExporting,
    error,
    exportPDF,
    resetError,
  }
}