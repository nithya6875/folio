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
  const textLayerRenderTask = useRef(null)

  useEffect(() => {
    if (!pdfDoc) return

    renderPage()

    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
      }
      if (textLayerRenderTask.current) {
        textLayerRenderTask.current.cancel()
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

      // Cancel previous renders
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
      }
      if (textLayerRenderTask.current) {
        textLayerRenderTask.current.cancel()
      }

      // Render PDF page to canvas
      renderTaskRef.current = page.render({
        canvasContext: context,
        viewport
      })

      await renderTaskRef.current.promise

      // Apply heatmap overlay
      if (heatmapOn && annotationCount > 0) {
        const opacity = Math.min(0.4, 0.1 + annotationCount * 0.1)
        const color = annotationCount >= 3
          ? `rgba(220, 53, 69, ${opacity})`
          : `rgba(184, 134, 11, ${opacity})`

        context.fillStyle = color
        context.fillRect(0, 0, canvas.width, canvas.height)
      }

      // Render text layer
      const textLayer = textLayerRef.current
      textLayer.innerHTML = ''
      textLayer.style.width = `${viewport.width}px`
      textLayer.style.height = `${viewport.height}px`

      const textContent = await page.getTextContent()

      // Use PDF.js renderTextLayer
      textLayerRenderTask.current = pdfjsLib.renderTextLayer({
        textContentSource: textContent,
        container: textLayer,
        viewport: viewport,
        textDivs: []
      })

      await textLayerRenderTask.current.promise

    } catch (err) {
      if (err.name !== 'RenderingCancelledException') {
        console.error('Render error:', err)
      }
    }
  }

  // Handle text selection
  const handleMouseUp = useCallback(() => {
    setTimeout(() => {
      const selection = window.getSelection()
      const text = selection.toString().trim()

      if (text.length >= 2) {
        try {
          const range = selection.getRangeAt(0)
          const rect = range.getBoundingClientRect()
          onTextSelection(text, rect)
        } catch (e) {
          // Selection might be invalid
        }
      }
    }, 10)
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
