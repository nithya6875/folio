import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export function useRealtime(table, clubId, callback, filter = {}) {
  const channelRef = useRef(null)

  useEffect(() => {
    if (!clubId) return

    // Build filter string
    const filterStr = filter.column && filter.value
      ? `${filter.column}=eq.${filter.value}`
      : `club_id=eq.${clubId}`

    const channelName = `${table}-${clubId}-${Date.now()}`

    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: filterStr
        },
        (payload) => {
          callback(payload)
        }
      )
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [table, clubId, callback, filter.column, filter.value])
}

// Hook specifically for annotations
export function useAnnotationsRealtime(clubId, onInsert) {
  useRealtime('annotations', clubId, (payload) => {
    if (payload.eventType === 'INSERT') {
      onInsert(payload.new)
    }
  })
}

// Hook specifically for messages
export function useMessagesRealtime(channelId, onInsert) {
  const channelRef = useRef(null)

  useEffect(() => {
    if (!channelId) return

    const channelName = `messages-${channelId}-${Date.now()}`

    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`
        },
        (payload) => {
          onInsert(payload.new)
        }
      )
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [channelId, onInsert])
}
