import { getAvatarColor, getInitials } from '../../hooks/usePresence'

export default function AnnotationCard({ annotation, myName, showPage, onGoToPage }) {
  const isWhisper = annotation.is_whisper
  const isMine = annotation.member_name === myName

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
      className="annotation-card"
      onClick={handleClick}
      style={{ cursor: showPage ? 'pointer' : 'default' }}
    >
      <div className="annotation-header">
        <div
          className="avatar annotation-avatar"
          style={{ backgroundColor: getAvatarColor(annotation.member_name) }}
        >
          {getInitials(annotation.member_name)}
        </div>
        <span className="annotation-author">{annotation.member_name}</span>
        <div className="annotation-meta">
          {isWhisper && <span className="whisper-badge">&#129323;</span>}
          {showPage && (
            <span className="page-badge">p{annotation.page_number}</span>
          )}
          <span>{formatTime(annotation.created_at)}</span>
        </div>
      </div>

      <div className={`annotation-text ${annotation.type}`}>
        {annotation.selected_text || '(No text selected)'}
      </div>

      {annotation.note && (
        <div className="annotation-note">
          {annotation.note}
        </div>
      )}
    </div>
  )
}
