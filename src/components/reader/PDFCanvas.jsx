import { useEffect, useRef, useCallback } from 'react'

export default function PDFCanvas({
  pdfDoc,
  pageNumber,
  zoom,
  heatmapOn,
  annotationCount,
  onTextSelection
}) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const textLayerRef = useRef(null)
  const renderTaskRef = useRef(null)

  useEffect(() => {
    if (!pdfDoc) return

    renderPage()

    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
      }
    }
  }, [pdfDoc, pageNumber, zoom, heatmapOn, annotationCount])

  const renderPage = async () => {
    try {
      const page = await pdfDoc.getPage(pageNumber)
      const scale = zoom * 1.5 // Base scale for better quality
      const viewport = page.getViewport({ scale })

      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      canvas.width = viewport.width
      canvas.height = viewport.height

      // Update container size
      containerRef.current.style.width = `${viewport.width}px`
      containerRef.current.style.height = `${viewport.height}px`

      // Cancel previous render
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
      }

      // Render PDF page
      renderTaskRef.current = page.render({
        canvasContext: context,
        viewport
      })

      await renderTaskRef.current.promise

      // Apply heatmap overlay
      if (heatmapOn && annotationCount > 0) {
        const opacity = Math.min(0.4, 0.1 + annotationCount * 0.1)
        const color = annotationCount >= 3
          ? `rgba(220, 53, 69, ${opacity})`  // Red for hot
          : `rgba(184, 134, 11, ${opacity})` // Amber for warm

        context.fillStyle = color
        context.fillRect(0, 0, canvas.width, canvas.height)
      }

      // Render text layer
      const textContent = await page.getTextContent()
      const textLayer = textLayerRef.current

      // Clear previous text layer
      textLayer.innerHTML = ''
      textLayer.style.width = `${viewport.width}px`
      textLayer.style.height = `${viewport.height}px`

      // Use PDF.js text layer rendering
      pdfjsLib.renderTextLayer({
        textContentSource: textContent,
        container: textLayer,
        viewport,
        textDivs: []
      })

    } catch (err) {
      if (err.name !== 'RenderingCancelledException') {
        console.error('Render error:', err)
      }
    }
  }

  // Handle text selection
  const handleMouseUp = useCallback((e) => {
    // Debounce
    setTimeout(() => {
      const selection = window.getSelection()
      const text = selection.toString().trim()

      if (text.length >= 2) {
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        onTextSelection(text, rect)
      }
    }, 60)
  }, [onTextSelection])

  useEffect(() => {
    const textLayer = textLayerRef.current
    if (!textLayer) return

    textLayer.addEventListener('mouseup', handleMouseUp)

    return () => {
      textLayer.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseUp])

  return (
    <div className="pdf-container" ref={containerRef}>
      <canvas ref={canvasRef} className="pdf-canvas" />
      <div ref={textLayerRef} className="text-layer" />
    </div>
  )
}
