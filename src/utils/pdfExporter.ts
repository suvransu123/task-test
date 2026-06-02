/**
 * PDF Export Utility
 * 
 * Single Responsibility: Handles PDF generation using html2canvas and jsPDF
 * Open/Closed: Extensible with new options without modifying core logic
 */

import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

// Configuration interface - abstraction for export options
export interface PDFExportOptions {
  filename?: string
  margin?: number
  imageQuality?: number
  scale?: number
  orientation?: 'portrait' | 'landscape'
  format?: 'auto' | 'a4'
}

const DEFAULT_OPTIONS: Required<PDFExportOptions> = {
  filename: 'export',
  margin: 10,
  imageQuality: 1,
  scale: 2,
  orientation: 'portrait',
  format: 'auto',
}

// Validation helper - single responsibility for validation
const validateElement = (element: HTMLElement | null): void => {
  if (!element) {
    throw new Error('Element not found for PDF export')
  }
  if (element.offsetHeight === 0 || element.offsetWidth === 0) {
    throw new Error('Element has no visible content to export')
  }
}

// Convert oklab/oklch colors to rgb values
const convertUnsupportedColor = (prop: string, value: string): string => {
  // Check if value contains unsupported color functions
  if (value.includes('oklab') || value.includes('oklch') || value.includes('color-mix')) {
    // Default fallback colors based on property type
    if (prop.includes('background')) {
      return '#ffffff' // White background
    }
    if (prop.includes('color') && prop !== 'container-color') {
      return '#000000' // Black text
    }
    return 'transparent'
  }
  return value
}

// Strip all class names, IDs, and style elements to prevent CSS rules from applying
const stripCssSelectors = (element: HTMLElement): void => {
  element.removeAttribute('class')
  element.removeAttribute('id')

  element.querySelectorAll('[class], [id]').forEach(el => {
    el.removeAttribute('class')
    el.removeAttribute('id')
  })

  // Remove all style tags to prevent CSS rules from being parsed
  element.querySelectorAll('style').forEach(s => s.remove())
}

// Deep clone an element with computed styles inlined (avoids CSS parsing issues)
const cloneElementWithInlinedStyles = (element: HTMLElement): HTMLElement => {
  const clone = element.cloneNode(true) as HTMLElement

  // Strip class names, IDs, and style elements to prevent any CSS rules
  stripCssSelectors(clone)

  // Get all computed styles from source and inline them
  const computed = getComputedStyle(element)
  const style = clone.style

  // Copy all style properties with sanitized values
  for (let i = 0; i < computed.length; i++) {
    const prop = computed[i]
    const value = computed.getPropertyValue(prop)
    const convertedValue = convertUnsupportedColor(prop, value)

    // Set using setProperty with important flag to override any CSS rules
    style.setProperty(prop, convertedValue, 'important')
  }

  // Recursively process children
  const processChildren = (cloneEl: Element, sourceEl: Element): void => {
    const cloneChildren = Array.from(cloneEl.children)
    const sourceChildren = Array.from(sourceEl.children)

    cloneChildren.forEach((childClone, index) => {
      if (sourceChildren[index] instanceof HTMLElement) {
        const sourceChild = sourceChildren[index] as HTMLElement

        // Strip class names and IDs from child
        if (childClone instanceof HTMLElement) {
          stripCssSelectors(childClone)
        }

        const childComputed = getComputedStyle(sourceChild)
        const childStyle = (childClone as HTMLElement).style

        // Copy all computed styles
        for (let i = 0; i < childComputed.length; i++) {
          const prop = childComputed[i]
          const value = childComputed.getPropertyValue(prop)
          const convertedValue = convertUnsupportedColor(prop, value)
          childStyle.setProperty(prop, convertedValue, 'important')
        }

        // Recurse into children
        processChildren(childClone, sourceChild)
      }
    })
  }

  processChildren(clone, element)
  return clone
}

// Capture element as canvas with cleaned clone (no external CSS)
const captureElement = async (
  element: HTMLElement,
  options: Required<PDFExportOptions>
): Promise<HTMLCanvasElement> => {
  // Clone the element with inlined styles
  const clonedElement = cloneElementWithInlinedStyles(element)
  // cloneElementWithInlinedStyles sets everything with !important, so we must
  // also use setProperty with 'important' to override position-related styles.
  // Without this, the clone retains `position: absolute; left: -9999px` which
  // means it won't expand its container and html2canvas captures a 0×0 canvas.
  clonedElement.style.setProperty('position', 'relative', 'important')
  clonedElement.style.setProperty('left', '0', 'important')
  clonedElement.style.setProperty('top', '0', 'important')
  clonedElement.style.setProperty('right', 'auto', 'important')
  clonedElement.style.setProperty('bottom', 'auto', 'important')

  // Create a temporary container with no external styles
  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.top = '0'
  container.style.backgroundColor = '#ffffff'
  container.style.width = `${element.offsetWidth}px`
  container.appendChild(clonedElement)
  document.body.appendChild(container)

  try {
    // Use onclone to sanitize any remaining styles in the cloned document
    return html2canvas(container, {
      scale: options.scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      imageTimeout: 0,
      onclone: (clonedDoc: Document) => {
        // Remove any stylesheets that might have been added
        clonedDoc.querySelectorAll('link[rel="stylesheet"]').forEach(link => link.remove())
      },
    })
  } finally {
    document.body.removeChild(container)
  }
}

// Generate PDF document.
// format='auto' (default): creates a single custom-height page that fits all
//   content — no pagination, no cards sliced at page boundaries.
// format='a4': standard A4 with multi-page pagination.
const createPDFDocument = (
  canvas: HTMLCanvasElement,
  options: Required<PDFExportOptions>
): { pdf: jsPDF; pdfWidth: number; pdfHeight: number; singlePage: boolean } => {
  if (canvas.width === 0 || canvas.height === 0) {
    throw new Error('Captured canvas has no content (0x0 dimensions)')
  }

  if (options.format === 'auto') {
    // Use A4 width (210 mm) and compute the exact height needed for the content.
    // This produces a single tall page with no cuts.
    const a4Width = 210 // mm
    const contentWidth = a4Width - options.margin * 2
    const contentHeight = (canvas.height * contentWidth) / canvas.width
    const pageHeight = contentHeight + options.margin * 2

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [a4Width, pageHeight],
    })

    return {
      pdf,
      pdfWidth: pdf.internal.pageSize.getWidth(),
      pdfHeight: pdf.internal.pageSize.getHeight(),
      singlePage: true,
    }
  }

  // Fixed-format (e.g. 'a4'): standard multi-page behaviour.
  const pdf = new jsPDF({
    orientation: options.orientation,
    unit: 'mm',
    format: options.format,
  })

  return {
    pdf,
    pdfWidth: pdf.internal.pageSize.getWidth(),
    pdfHeight: pdf.internal.pageSize.getHeight(),
    singlePage: false,
  }
}

// Add image to PDF using canvas slicing — one cropped slice per page.
// This avoids the "sliding image" technique which always causes content
// to be re-shown at page boundaries (visible as duplicated rows/cards).
const addImageToPDF = (
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  pdfWidth: number,
  pdfHeight: number,
  margin: number,
  imageQuality: number,
  singlePage: boolean
): void => {
  const contentWidthMm = pdfWidth - margin * 2
  const contentHeightMm = pdfHeight - margin * 2

  if (singlePage) {
    // Single custom-height page: the page was sized to fit, one slice covers all.
    const imgHeightMm = (canvas.height * contentWidthMm) / canvas.width
    const imgData = canvas.toDataURL('image/jpeg', imageQuality)
    pdf.addImage(imgData, 'JPEG', margin, margin, contentWidthMm, imgHeightMm)
    return
  }

  // Multi-page: crop the canvas into horizontal slices, one per page.
  // Each slice is exactly one page-height of pixels tall (last slice may be shorter).
  // This guarantees zero overlap — each pixel of content appears on exactly one page.
  const pixelsPerMm = canvas.width / contentWidthMm
  const sliceHeightPx = Math.round(contentHeightMm * pixelsPerMm)

  let yOffsetPx = 0
  let isFirstPage = true

  while (yOffsetPx < canvas.height) {
    if (!isFirstPage) pdf.addPage()

    const remainingPx = canvas.height - yOffsetPx
    const thisSliceHeightPx = Math.min(sliceHeightPx, remainingPx)
    const thisSliceHeightMm = thisSliceHeightPx / pixelsPerMm

    // Draw just this slice onto a temporary canvas.
    const sliceCanvas = document.createElement('canvas')
    sliceCanvas.width = canvas.width
    sliceCanvas.height = thisSliceHeightPx
    const ctx = sliceCanvas.getContext('2d')!
    ctx.drawImage(canvas, 0, -yOffsetPx)

    const sliceData = sliceCanvas.toDataURL('image/jpeg', imageQuality)
    pdf.addImage(sliceData, 'JPEG', margin, margin, contentWidthMm, thisSliceHeightMm)

    yOffsetPx += sliceHeightPx
    isFirstPage = false
  }
}

// Main export function - facade that orchestrates the export process
export const exportToPDF = async (
  element: HTMLElement | null,
  options: PDFExportOptions = {}
): Promise<void> => {
  // Merge options with defaults
  const mergedOptions: Required<PDFExportOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
  }

  // Validate input
  validateElement(element)

  // Capture the element
  const canvas = await captureElement(element!, mergedOptions)

  // Create PDF document
  const { pdf, pdfWidth, pdfHeight, singlePage } = createPDFDocument(
    canvas,
    mergedOptions
  )

  // Add content to PDF using canvas slicing (no sliding-image overlap)
  addImageToPDF(pdf, canvas, pdfWidth, pdfHeight, mergedOptions.margin, mergedOptions.imageQuality, singlePage)

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `${mergedOptions.filename}-${timestamp}.pdf`

  // Trigger download
  pdf.save(filename)
}

// Helper to export with custom content (for non-DOM content)
export const exportHTMLToPDF = async (
  htmlContent: string,
  options: PDFExportOptions = {}
): Promise<void> => {
  // Create temporary container
  const container = document.createElement('div')
  container.innerHTML = htmlContent
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.top = '0'
  container.style.width = '210mm' // A4 width
  container.style.backgroundColor = '#ffffff'
  container.style.padding = '20px'
  document.body.appendChild(container)

  try {
    await exportToPDF(container, options)
  } finally {
    // Cleanup
    document.body.removeChild(container)
  }
}