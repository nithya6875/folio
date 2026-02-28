import { useState } from 'react'

export default function Toolbar({
  currentPage,
  totalPages,
  zoom,
  bookTitle,
  heatmapOn,
  panelOpen,
  isAdmin,
  onPageChange,
  onZoomChange,
  onHeatmapToggle,
  onPanelToggle,
  onReplacePdf
}) {
  const [pageInput, setPageInput] = useState(currentPage.toString())

  const handlePageSubmit = (e) => {
    e.preventDefault()
    const page = parseInt(pageInput, 10)
    if (!isNaN(page)) {
      onPageChange(page)
    }
  }

  const handlePageInputChange = (e) => {
    setPageInput(e.target.value)
  }

  const handlePageInputBlur = () => {
    setPageInput(currentPage.toString())
  }

  // Update input when page changes externally
  if (parseInt(pageInput, 10) !== currentPage && document.activeElement?.name !== 'pageInput') {
    setPageInput(currentPage.toString())
  }

  const zoomIn = () => onZoomChange(Math.min(zoom + 0.25, 3))
  const zoomOut = () => onZoomChange(Math.max(zoom - 0.25, 0.5))
  const resetZoom = () => onZoomChange(1.0)

  return (
    <div className="reader-toolbar">
      <div className="toolbar-left">
        <button
          className="toolbar-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          title="Previous page"
        >
          &#8592;
        </button>

        <form onSubmit={handlePageSubmit} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input
            type="text"
            name="pageInput"
            className="fi page-input"
            value={pageInput}
            onChange={handlePageInputChange}
            onBlur={handlePageInputBlur}
          />
          <span className="page-total">of {totalPages}</span>
        </form>

        <button
          className="toolbar-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          title="Next page"
        >
          &#8594;
        </button>
      </div>

      <div className="toolbar-center">
        <button
          className="toolbar-btn"
          onClick={zoomOut}
          disabled={zoom <= 0.5}
          title="Zoom out"
        >
          &#8722;
        </button>

        <span className="zoom-display" onClick={resetZoom} style={{ cursor: 'pointer' }}>
          {Math.round(zoom * 100)}%
        </span>

        <button
          className="toolbar-btn"
          onClick={zoomIn}
          disabled={zoom >= 3}
          title="Zoom in"
        >
          &#43;
        </button>

        <span className="book-title" title={bookTitle}>
          {bookTitle}
        </span>
      </div>

      <div className="toolbar-right">
        <button
          className={`toolbar-btn ${heatmapOn ? 'active' : ''}`}
          onClick={onHeatmapToggle}
          title="Toggle heatmap"
        >
          &#128293;
        </button>

        {isAdmin && (
          <label className="toolbar-btn" title="Replace PDF" style={{ cursor: 'pointer' }}>
            &#8635;
            <input
              type="file"
              accept=".pdf"
              onChange={onReplacePdf}
              style={{ display: 'none' }}
            />
          </label>
        )}

        <button
          className={`toolbar-btn ${panelOpen ? 'active' : ''}`}
          onClick={onPanelToggle}
          title="Toggle annotation panel"
        >
          &#9776;
        </button>
      </div>
    </div>
  )
}
