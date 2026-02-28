import { useState, useRef, useEffect } from 'react'
import { getAvatarColor, getInitials } from '../../hooks/usePresence'

export default function MessageInput({ memberName, replyTo, onCancelReply, onSend }) {
  const [content, setContent] = useState('')
  const textareaRef = useRef(null)

  // Focus when replying
  useEffect(() => {
    if (replyTo) {
      textareaRef.current?.focus()
    }
  }, [replyTo])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleSubmit = () => {
    const trimmed = content.trim()
    if (trimmed) {
      onSend(trimmed)
      setContent('')
    }
  }

  return (
    <div className="message-input-container">
      {replyTo && (
        <div className="reply-indicator">
          <span>&#8617;</span>
          <span className="reply-text">
            Replying to {replyTo.author}: {replyTo.content}
          </span>
          <button className="reply-close" onClick={onCancelReply}>
            &times;
          </button>
        </div>
      )}

      <div className="message-input-wrapper">
        <div
          className="avatar"
          style={{ backgroundColor: getAvatarColor(memberName) }}
        >
          {getInitials(memberName)}
        </div>

        <textarea
          ref={textareaRef}
          className="fi"
          placeholder="Type a message..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />

        <button
          className="fb"
          onClick={handleSubmit}
          disabled={!content.trim()}
        >
          Send
        </button>
      </div>
    </div>
  )
}
