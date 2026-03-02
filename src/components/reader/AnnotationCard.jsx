import { getAvatarColor, getInitials } from '../../hooks/usePresence'

const TYPE_CONFIG = {
  highlight: { emoji: '🖍️', label: 'highlighted' },
  quote: { emoji: '💬', label: 'saved quote' },
  question: { emoji: '❓', label: 'asked' },
  note: { emoji: '📝', label: 'noted' },
  whisper: { emoji: '🤫', label: 'whispered' }
}

export default function AnnotationCard({ annotation, myName, showPage, onGoToPage }) {
  const isWhisper = annotation.is_whisper
  const isMine = annotation.member_name === myName
  const config = TYPE_CONFIG[annotation.type] || TYPE_CONFIG.note

  const formatTime = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString()
  }

  const handleClick = () => {
    if (showPage && onGoToPage) {
      onGoToPage(annotation.page_number)
    }
  }

  return (
    <div
      className={`annotation-card ${annotation.type}`}
      onClick={handleClick}
      style={{ cursor: showPage ? 'pointer' : 'default' }}
    >
      {/* Header with avatar and meta */}
      <div className="annotation-header">
        <div
          className="avatar annotation-avatar"
          style={{ backgroundColor: getAvatarColor(annotation.member_name) }}
        >
          {getInitials(annotation.member_name)}
        </div>
        <div className="annotation-header-text">
          <span className="annotation-author">{annotation.member_name}</span>
          <span className="annotation-action"> {config.label}</span>
        </div>
        <div className="annotation-meta">
          {showPage && (
            <span className="page-badge">p{annotation.page_number}</span>
          )}
          <span>{formatTime(annotation.created_at)}</span>
        </div>
      </div>

      {/* Type badge */}
      <div className={`annotation-type-badge ${annotation.type}`}>
        {config.emoji} {annotation.type}
        {isWhisper && ' (private)'}
      </div>

      {/* Content based on type */}
      {annotation.type === 'quote' ? (
        <blockquote className="annotation-quote-text">
          "{annotation.selected_text}"
        </blockquote>
      ) : annotation.type === 'question' ? (
        <>
          <div className="annotation-text highlight-bg">
            {annotation.selected_text}
          </div>
          <div className="annotation-question">
            <span className="question-icon">❓</span>
            {annotation.note}
          </div>
        </>
      ) : (
        <div className={`annotation-text ${annotation.type}`}>
          {annotation.selected_text || '(No text selected)'}
        </div>
      )}

      {/* Note (for non-question types) */}
      {annotation.note && annotation.type !== 'question' && (
        <div className="annotation-note">
          {annotation.note}
        </div>
      )}
    </div>
  )
}
