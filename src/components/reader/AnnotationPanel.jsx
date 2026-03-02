import { useState } from 'react'
import AnnotationCard from './AnnotationCard'

const SCOPE_FILTERS = [
  { id: 'page', label: 'This Page' },
  { id: 'chapter', label: 'This Chapter' },
  { id: 'all', label: 'All' }
]

const TYPE_FILTERS = [
  { id: 'all', label: 'All', emoji: '📚' },
  { id: 'question', label: 'Questions', emoji: '❓' },
  { id: 'quote', label: 'Quotes', emoji: '💬' },
  { id: 'highlight', label: 'Highlights', emoji: '🖍️' },
  { id: 'note', label: 'Notes', emoji: '📝' }
]

export default function AnnotationPanel({
  open,
  annotations,
  currentPage,
  myName,
  onAddNote,
  onGoToPage
}) {
  const [scopeFilter, setScopeFilter] = useState('page')
  const [typeFilter, setTypeFilter] = useState('all')

  if (!open) return null

  // Filter annotations based on selected filters
  const filteredAnnotations = annotations.filter(a => {
    // Always filter out other people's whispers
    if (a.is_whisper && a.member_name !== myName) return false

    // Scope filter
    let passesScope = true
    switch (scopeFilter) {
      case 'page':
        passesScope = a.page_number === currentPage
        break
      case 'chapter':
        passesScope = Math.abs(a.page_number - currentPage) <= 10
        break
      case 'all':
      default:
        passesScope = true
    }

    // Type filter
    let passesType = true
    if (typeFilter !== 'all') {
      passesType = a.type === typeFilter
    }

    return passesScope && passesType
  })

  // Sort by page number, then by date
  const sortedAnnotations = [...filteredAnnotations].sort((a, b) => {
    if (scopeFilter === 'page') {
      return new Date(b.created_at) - new Date(a.created_at)
    }
    if (a.page_number !== b.page_number) {
      return a.page_number - b.page_number
    }
    return new Date(b.created_at) - new Date(a.created_at)
  })

  // Count questions for badge
  const questionCount = annotations.filter(a =>
    a.type === 'question' && (!a.is_whisper || a.member_name === myName)
  ).length

  return (
    <aside className="annotation-panel">
      <div className="panel-header">
        <h2 className="panel-title">Annotations</h2>
        <button className="fo panel-add-btn" onClick={onAddNote}>
          + Add
        </button>
      </div>

      {/* Scope filter tabs */}
      <div className="filter-tabs">
        {SCOPE_FILTERS.map(f => (
          <button
            key={f.id}
            className={`filter-tab ${scopeFilter === f.id ? 'active' : ''}`}
            onClick={() => setScopeFilter(f.id)}
          >
            {f.label}
            {f.id === 'page' && (
              <span className="filter-count">
                {annotations.filter(a =>
                  a.page_number === currentPage &&
                  (!a.is_whisper || a.member_name === myName)
                ).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Type filter pills */}
      <div className="type-filter-row">
        {TYPE_FILTERS.map(f => (
          <button
            key={f.id}
            className={`type-filter-pill ${typeFilter === f.id ? 'active' : ''}`}
            onClick={() => setTypeFilter(f.id)}
          >
            {f.emoji}
            {f.id === 'question' && questionCount > 0 && (
              <span className="type-filter-count">{questionCount}</span>
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
                showPage={scopeFilter !== 'page'}
                onGoToPage={onGoToPage}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <p className="text-muted">
              {typeFilter !== 'all'
                ? `No ${typeFilter}s ${scopeFilter === 'page' ? 'on this page' : scopeFilter === 'chapter' ? 'in this chapter' : 'yet'}.`
                : scopeFilter === 'page'
                  ? 'No annotations on this page.'
                  : scopeFilter === 'chapter'
                    ? 'No annotations in this chapter.'
                    : 'No annotations yet.'
              }
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
