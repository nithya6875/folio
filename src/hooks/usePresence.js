import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

export function usePresence(clubId, memberId, currentPage) {
  const [nearbyMembers, setNearbyMembers] = useState([])
  const [allMembers, setAllMembers] = useState([])
  const heartbeatRef = useRef(null)
  const pollRef = useRef(null)

  // Broadcast current page
  const broadcastPage = useCallback(async (page) => {
    if (!clubId || !memberId) return

    await supabase
      .from('members')
      .update({
        current_page: page,
        last_seen: new Date().toISOString()
      })
      .eq('id', memberId)
  }, [clubId, memberId])

  // Poll for nearby members
  const pollMembers = useCallback(async () => {
    if (!clubId || !memberId) return

    const cutoff = new Date(Date.now() - 45000).toISOString() // 45 seconds ago

    const { data } = await supabase
      .from('members')
      .select('id, name, current_page, last_seen')
      .eq('club_id', clubId)
      .gt('last_seen', cutoff)
      .neq('id', memberId)

    if (data) {
      setAllMembers(data)
      // Filter to within ±10 pages
      const nearby = data.filter(m =>
        Math.abs(m.current_page - currentPage) <= 10
      )
      setNearbyMembers(nearby)
    }
  }, [clubId, memberId, currentPage])

  // Set up heartbeat and polling
  useEffect(() => {
    if (!clubId || !memberId) return

    // Initial broadcast
    broadcastPage(currentPage)

    // Heartbeat every 10 seconds
    heartbeatRef.current = setInterval(() => {
      broadcastPage(currentPage)
    }, 10000)

    // Poll members every 8 seconds
    pollMembers()
    pollRef.current = setInterval(pollMembers, 8000)

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [clubId, memberId, currentPage, broadcastPage, pollMembers])

  // Update page immediately when it changes
  useEffect(() => {
    broadcastPage(currentPage)
  }, [currentPage, broadcastPage])

  return {
    nearbyMembers,
    allMembers,
    broadcastPage
  }
}

// Generate consistent color from name
export function getAvatarColor(name) {
  const colors = [
    '#2D5016', '#B8860B', '#8B3A3A', '#1E4D6B', '#6B4E1E',
    '#4A1E6B', '#1E6B5A', '#6B1E4A', '#3A6B1E', '#6B3A1E'
  ]

  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}

// Get initials from name
export function getInitials(name) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
