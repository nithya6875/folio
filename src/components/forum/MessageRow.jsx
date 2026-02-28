import { useState } from 'react'
import { getAvatarColor, getInitials } from '../../hooks/usePresence'

const REACTION_EMOJIS = ['&#10084;&#65039;', '&#128077;', '&#128514;', '&#128558;', '&#128293;', '&#127881;', '&#128064;', '&#128173;']

export default function MessageRow({ group, allMessages, memberName, onReply, onReaction }) {
  const firstMessage = group.messages[0]
  const [showReactionPicker, setShowReactionPicker] = useState(null)

  const formatTime = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const findReplyMessage = (replyToId) => {
    return allMessages.find(m => m.id === replyToId)
  }

  const handleReaction = (messageId, emoji) => {
    // Decode HTML entity
    const temp = document.createElement('div')
    temp.innerHTML = emoji
    const decoded = temp.textContent
    onReaction(messageId, decoded)
    setShowReactionPicker(null)
  }

  return (
    <div className="message-group">
      <div
        className="avatar"
        style={{ backgroundColor: getAvatarColor(group.author) }}
      >
        {getInitials(group.author)}
      </div>

      <div className="message-content">
        <div className="message-header">
          <span className="message-author">{group.author}</span>
          <span className="message-time">{formatTime(firstMessage.created_at)}</span>
        </div>

        {group.messages.map((message, idx) => {
          const replyTo = message.reply_to_id ? findReplyMessage(message.reply_to_id) : null

          return (
            <div key={message.id} className={idx > 0 ? 'message-continuation' : ''}>
              {replyTo && (
                <div className="reply-indicator" style={{ marginBottom: '4px', padding: '4px 8px' }}>
                  <span style={{ color: 'var(--muted)', fontSize: '12px' }}>
                    &#8617; Replying to {replyTo.author}
                  </span>
                </div>
              )}

              <p className="message-text">{message.content}</p>

              {/* Reactions */}
              {message.reactions && Object.keys(message.reactions).length > 0 && (
                <div className="message-reactions">
                  {Object.entries(message.reactions).map(([emoji, users]) => (
                    <button
                      key={emoji}
                      className={`reaction-pill ${users.includes(memberName) ? 'active' : ''}`}
                      onClick={() => onReaction(message.id, emoji)}
                    >
                      <span>{emoji}</span>
                      <span>{users.length}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="message-actions">
                <button
                  className="action-btn"
                  onClick={() => onReply(message)}
                >
                  &#8617; Reply
                </button>
                <div style={{ position: 'relative' }}>
                  <button
                    className="action-btn"
                    onClick={() => setShowReactionPicker(
                      showReactionPicker === message.id ? null : message.id
                    )}
                  >
                    &#128522;
                  </button>
                  {showReactionPicker === message.id && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '0',
                        background: 'var(--white)',
                        border: '1px solid var(--border)',
                        padding: '4px',
                        display: 'flex',
                        gap: '2px',
                        zIndex: 10
                      }}
                    >
                      {REACTION_EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '16px',
                            padding: '4px'
                          }}
                          onClick={() => handleReaction(message.id, emoji)}
                          dangerouslySetInnerHTML={{ __html: emoji }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
