import { useState } from 'react'

export default function Nominations({ nominations, memberName, onNominate, onVote }) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !author.trim()) return

    setSubmitting(true)
    await onNominate(title.trim(), author.trim(), reason.trim())
    setTitle('')
    setAuthor('')
    setReason('')
    setSubmitting(false)
  }

  // Sort by votes descending
  const sorted = [...nominations].sort((a, b) =>
    (b.votes?.length || 0) - (a.votes?.length || 0)
  )

  const topVotes = sorted[0]?.votes?.length || 0

  return (
    <div className="library-section">
      <div className="section-header">
        <h2 className="section-title">Nominations</h2>
      </div>

      <form className="nomination-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="fi"
          placeholder="Book title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          type="text"
          className="fi"
          placeholder="Author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          required
        />
        <input
          type="text"
          className="fi"
          placeholder="Why this book? (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          style={{ flex: 2 }}
        />
        <button
          type="submit"
          className="fb"
          disabled={submitting || !title.trim() || !author.trim()}
        >
          {submitting ? 'Adding...' : 'Nominate'}
        </button>
      </form>

      {sorted.length > 0 ? (
        <div className="nominations-grid">
          {sorted.map(nomination => {
            const voteCount = nomination.votes?.length || 0
            const hasVoted = nomination.votes?.includes(memberName)
            const isTopPick = voteCount > 0 && voteCount === topVotes

            return (
              <div key={nomination.id} className="nomination-card">
                {isTopPick && (
                  <div className="top-pick-banner">Top Pick</div>
                )}

                <div className="nomination-vote">
                  <button
                    className={`vote-btn ${hasVoted ? 'voted' : ''}`}
                    onClick={() => onVote(nomination.id)}
                  >
                    ▲
                  </button>
                  <span className="vote-count">{voteCount}</span>
                </div>

                <h3 className="nomination-title">{nomination.title}</h3>
                <p className="nomination-author">by {nomination.author}</p>

                {nomination.reason && (
                  <p className="nomination-reason">"{nomination.reason}"</p>
                )}

                <div className="nomination-footer">
                  Nominated by {nomination.nominated_by}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty-state" style={{ padding: '40px 20px' }}>
          <p className="text-muted">No nominations yet. Be the first to suggest a book!</p>
        </div>
      )}
    </div>
  )
}
