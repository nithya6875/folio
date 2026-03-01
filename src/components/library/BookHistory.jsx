import { useState } from 'react'

export default function BookHistory({ history }) {
  const [selectedBook, setSelectedBook] = useState(null)

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    })
  }

  if (history.length === 0) {
    return (
      <div className="library-section">
        <div className="section-header">
          <h2 className="section-title">Reading History</h2>
        </div>
        <div className="empty-state" style={{ padding: '40px 20px' }}>
          <p className="text-muted">No completed books yet. Your reading journey awaits!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="library-section">
      <div className="section-header">
        <h2 className="section-title">Reading History</h2>
      </div>

      <div className="history-grid">
        {history.map(book => (
          <div
            key={book.id}
            className="history-card"
            onClick={() => setSelectedBook(book)}
          >
            <h3 className="history-title">{book.title}</h3>
            {book.author && (
              <p className="history-author">by {book.author}</p>
            )}
            <p className="history-date">
              Completed {formatDate(book.completed_at)}
            </p>
          </div>
        ))}
      </div>

      {/* Capsule Modal */}
      {selectedBook && (
        <div className="modal-overlay" onClick={() => setSelectedBook(null)}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '600px' }}
          >
            <div className="modal-header">
              <h2 className="modal-title">{selectedBook.title}</h2>
              <button
                className="modal-close"
                onClick={() => setSelectedBook(null)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              {selectedBook.capsule ? (
                <div>
                  {/* Stats */}
                  {selectedBook.capsule.stats && (
                    <div className="capsule-stats" style={{ marginBottom: '20px' }}>
                      <div className="capsule-stat">
                        <div className="capsule-stat-value">
                          {selectedBook.capsule.stats.totalAnnotations}
                        </div>
                        <div className="capsule-stat-label">Annotations</div>
                      </div>
                      <div className="capsule-stat">
                        <div className="capsule-stat-value">
                          {selectedBook.capsule.stats.totalMessages}
                        </div>
                        <div className="capsule-stat-label">Messages</div>
                      </div>
                      <div className="capsule-stat">
                        <div className="capsule-stat-value">
                          {selectedBook.capsule.stats.totalPages || '?'}
                        </div>
                        <div className="capsule-stat-label">Pages</div>
                      </div>
                      <div className="capsule-stat">
                        <div className="capsule-stat-value">
                          p{selectedBook.capsule.stats.mostAnnotatedPage || '?'}
                        </div>
                        <div className="capsule-stat-label">Hot Page</div>
                      </div>
                    </div>
                  )}

                  {/* Generated capsule content */}
                  {selectedBook.capsule.capsule?.summary && (
                    <p className="mb-4">{selectedBook.capsule.capsule.summary}</p>
                  )}

                  {selectedBook.capsule.capsule?.verdict && (
                    <div className="capsule-verdict" style={{ marginTop: '20px' }}>
                      "{selectedBook.capsule.capsule.verdict}"
                    </div>
                  )}

                  {/* Archived insights info */}
                  <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                    <p className="text-muted" style={{ fontSize: '13px', textAlign: 'center' }}>
                      {selectedBook.capsule.guide ? '+ Discussion Guide' : ''}
                      {selectedBook.capsule.guide && selectedBook.capsule.characters ? ' | ' : ''}
                      {selectedBook.capsule.characters ? '+ Character Map' : ''}
                    </p>
                    <p className="text-muted" style={{ fontSize: '12px', textAlign: 'center', marginTop: '8px' }}>
                      View full insights in Insights &rarr; Archive
                    </p>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <p className="text-muted">
                    No insights archived for this book.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
