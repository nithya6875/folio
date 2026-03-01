import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useMessagesRealtime } from '../../hooks/useRealtime'
import ChannelSidebar from './ChannelSidebar'
import MessageList from './MessageList'
import MessageInput from './MessageInput'

export default function Forum({ session }) {
  const [channels, setChannels] = useState([])
  const [activeChannel, setActiveChannel] = useState(null)
  const [messages, setMessages] = useState([])
  const [replyTo, setReplyTo] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch channels
  useEffect(() => {
    fetchChannels()
  }, [session.clubId])

  // Fetch messages when channel changes
  useEffect(() => {
    if (activeChannel) {
      fetchMessages()
    }
  }, [activeChannel?.id])

  // Realtime messages
  const handleNewMessage = useCallback((message) => {
    if (message.channel_id === activeChannel?.id) {
      setMessages(prev => {
        // Avoid duplicates if we already added it optimistically
        if (prev.some(m => m.id === message.id)) return prev
        return [...prev, message]
      })
    }
  }, [activeChannel?.id])

  useMessagesRealtime(activeChannel?.id, handleNewMessage)

  const fetchChannels = async () => {
    const { data } = await supabase
      .from('channels')
      .select('*')
      .eq('club_id', session.clubId)
      .order('created_at')

    if (data) {
      setChannels(data)
      if (data.length > 0 && !activeChannel) {
        setActiveChannel(data[0])
      }
    }
    setLoading(false)
  }

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('channel_id', activeChannel.id)
      .order('created_at')

    if (data) {
      setMessages(data)
    }
  }

  const handleCreateChannel = async (name) => {
    const { data, error } = await supabase
      .from('channels')
      .insert({
        club_id: session.clubId,
        name: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: ''
      })
      .select()
      .single()

    if (data) {
      setChannels(prev => [...prev, data])
      setActiveChannel(data)
    }
  }

  const handleSendMessage = async (content) => {
    const message = {
      channel_id: activeChannel.id,
      club_id: session.clubId,
      author: session.memberName,
      content,
      reply_to_id: replyTo?.id || null,
      reactions: {}
    }

    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single()

    if (!error && data) {
      setMessages(prev => [...prev, data])
      setReplyTo(null)
    }
  }

  const handleReaction = async (messageId, emoji) => {
    const message = messages.find(m => m.id === messageId)
    if (!message) return

    const reactions = { ...message.reactions }
    const users = reactions[emoji] || []

    if (users.includes(session.memberName)) {
      // Remove reaction
      reactions[emoji] = users.filter(u => u !== session.memberName)
      if (reactions[emoji].length === 0) {
        delete reactions[emoji]
      }
    } else {
      // Add reaction
      reactions[emoji] = [...users, session.memberName]
    }

    await supabase
      .from('messages')
      .update({ reactions })
      .eq('id', messageId)

    // Optimistic update
    setMessages(prev =>
      prev.map(m =>
        m.id === messageId ? { ...m, reactions } : m
      )
    )
  }

  if (loading) {
    return (
      <div className="loading" style={{ height: '100%' }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="forum-container">
      <ChannelSidebar
        channels={channels}
        activeChannel={activeChannel}
        isAdmin={session.isAdmin}
        onChannelSelect={setActiveChannel}
        onCreateChannel={handleCreateChannel}
      />

      <div className="forum-main">
        {activeChannel ? (
          <>
            <div className="forum-header">
              <h2 className="forum-channel-name">
                <span className="channel-hash">#</span>
                {activeChannel.name}
              </h2>
              {activeChannel.description && (
                <p className="forum-channel-desc">{activeChannel.description}</p>
              )}
            </div>

            <MessageList
              messages={messages}
              memberName={session.memberName}
              onReply={setReplyTo}
              onReaction={handleReaction}
            />

            <MessageInput
              memberName={session.memberName}
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
              onSend={handleSendMessage}
            />
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">&#128172;</div>
            <h2 className="empty-title">No channels yet</h2>
            <p className="empty-text">Create a channel to start discussing.</p>
          </div>
        )}
      </div>
    </div>
  )
}
