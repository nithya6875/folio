import AnnotationCard from './AnnotationCard'

export default function AnnotationPanel({
  open,
  currentPageAnnotations,
  otherAnnotations,
  myName,
  onAddNote,
  onGoToPage
}) {
  if (!open) return null

  return (
    <aside className="annotation-panel">
      <div className="panel-header">
        <h2 className="panel-title">Annotations</h2>
        <button className="fo panel-add-btn" onClick={onAddNote}>
          + Add note
        </button>
      </div>

      <div className="panel-content">
        {currentPageAnnotations.length > 0 && (
          <div className="panel-section">
            <h3 className="panel-section-title">This page</h3>
            {currentPageAnnotations.map(annotation => (
              <AnnotationCard
                key={annotation.id}
                annotation={annotation}
                myName={myName}
                showPage={false}
              />
            ))}
          </div>
        )}

        {otherAnnotations.length > 0 && (
          <div className="panel-section">
            <h3 className="panel-section-title">All annotations</h3>
            {otherAnnotations.map(annotation => (
              <AnnotationCard
                key={annotation.id}
                annotation={annotation}
                myName={myName}
                showPage={true}
                onGoToPage={onGoToPage}
              />
            ))}
          </div>
        )}

        {currentPageAnnotations.length === 0 && otherAnnotations.length === 0 && (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <p className="text-muted">No annotations yet.</p>
            <p className="text-muted" style={{ fontSize: '14px', marginTop: '8px' }}>
              Select text in the PDF to add highlights, quotes, or notes.
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
