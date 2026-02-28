import { useEffect, useRef } from 'react'
import MessageRow from './MessageRow'

export default function MessageList({ messages, memberName, onReply, onReaction }) {
  const listRef = useRef(null)
  const prevLengthRef = useRef(messages.length)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
    prevLengthRef.current = messages.length
  }, [messages.length])

  // Group consecutive messages from same author within 2 minutes
  const groupedMessages = []
  let currentGroup = null

  messages.forEach(message => {
    const messageTime = new Date(message.created_at).getTime()
    const shouldGroup = currentGroup &&
      currentGroup.author === message.author &&
      messageTime - currentGroup.lastTime < 120000 // 2 minutes

    if (shouldGroup) {
      currentGroup.messages.push(message)
      currentGroup.lastTime = messageTime
    } else {
      currentGroup = {
        author: message.author,
        messages: [message],
        lastTime: messageTime
      }
      groupedMessages.push(currentGroup)
    }
  })

  if (messages.length === 0) {
    return (
      <div className="message-list">
        <div className="empty-state" style={{ flex: 1, padding: '60px 20px' }}>
          <p className="text-muted">No messages yet. Start the conversation!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="message-list" ref={listRef}>
      {groupedMessages.map((group, idx) => (
        <MessageRow
          key={group.messages[0].id}
          group={group}
          allMessages={messages}
          memberName={memberName}
          onReply={onReply}
          onReaction={onReaction}
        />
      ))}
    </div>
  )
}
