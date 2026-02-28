import { useState } from 'react'
import AnnotationCard from './AnnotationCard'

const FILTERS = [
  { id: 'page', label: 'This Page' },
  { id: 'chapter', label: 'This Chapter' },
  { id: 'all', label: 'All' }
]

export default function AnnotationPanel({
  open,
  annotations,
  currentPage,
  myName,
  onAddNote,
  onGoToPage
}) {
  const [filter, setFilter] = useState('page')

  if (!open) return null

  // Filter annotations based on selected filter
  const filteredAnnotations = annotations.filter(a => {
    // Always filter out other people's whispers
    if (a.is_whisper && a.member_name !== myName) return false

    switch (filter) {
      case 'page':
        return a.page_number === currentPage
      case 'chapter':
        // Chapter = within 10 pages
        return Math.abs(a.page_number - currentPage) <= 10
      case 'all':
      default:
        return true
    }
  })

  // Sort by page number, then by date
  const sortedAnnotations = [...filteredAnnotations].sort((a, b) => {
    if (filter === 'page') {
      // For current page, sort by newest first
      return new Date(b.created_at) - new Date(a.created_at)
    }
    // For chapter/all, sort by page number
    if (a.page_number !== b.page_number) {
      return a.page_number - b.page_number
    }
    return new Date(b.created_at) - new Date(a.created_at)
  })

  return (
    <aside className="annotation-panel">
      <div className="panel-header">
        <h2 className="panel-title">Annotations</h2>
        <button className="fo panel-add-btn" onClick={onAddNote}>
          + Add note
        </button>
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs">
        {FILTERS.map(f => (
          <button
            key={f.id}
            className={`filter-tab ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
            {f.id === 'page' && (
              <span className="filter-count">
                {annotations.filter(a => a.page_number === currentPage && (!a.is_whisper || a.member_name === myName)).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="panel-content">
        {sortedAnnotations.length > 0 ? (
          <div className="panel-section">
            {sortedAnnotations.map(annotation => (
              <AnnotationCard
                key={annotation.id}
                annotation={annotation}
                myName={myName}
                showPage={filter !== 'page'}
                onGoToPage={onGoToPage}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <p className="text-muted">
              {filter === 'page' && 'No annotations on this page.'}
              {filter === 'chapter' && 'No annotations in this chapter.'}
              {filter === 'all' && 'No annotations yet.'}
            </p>
            <p className="text-muted" style={{ fontSize: '14px', marginTop: '8px' }}>
              Select text in the PDF to add highlights, quotes, or notes.
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
