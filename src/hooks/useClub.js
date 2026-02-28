import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import bcrypt from 'bcryptjs'

const SESSION_KEY = 'folio_session'

export function useClub() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // Validate session by checking member still exists
        validateSession(parsed).then(valid => {
          if (valid) {
            setSession(parsed)
          } else {
            localStorage.removeItem(SESSION_KEY)
          }
          setLoading(false)
        })
      } catch {
        localStorage.removeItem(SESSION_KEY)
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  const validateSession = async (sessionData) => {
    try {
      const { data } = await supabase
        .from('members')
        .select('id')
        .eq('id', sessionData.memberId)
        .eq('club_id', sessionData.clubId)
        .single()
      return !!data
    } catch {
      return false
    }
  }

  const createClub = useCallback(async (name, password, memberName) => {
    setError(null)
    setLoading(true)

    try {
      // Generate slug from name
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

      // Check if slug exists
      const { data: existing } = await supabase
        .from('clubs')
        .select('id')
        .eq('slug', slug)
        .single()

      if (existing) {
        throw new Error('A club with this name already exists')
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10)

      // Create club
      const { data: club, error: clubError } = await supabase
        .from('clubs')
        .insert({ name, slug, password_hash: passwordHash })
        .select()
        .single()

      if (clubError) throw clubError

      // Create member as admin
      const { data: member, error: memberError } = await supabase
        .from('members')
        .insert({
          club_id: club.id,
          name: memberName,
          is_admin: true
        })
        .select()
        .single()

      if (memberError) throw memberError

      // Create default channels
      const defaultChannels = [
        { club_id: club.id, name: 'general', description: 'General discussion' },
        { club_id: club.id, name: 'chapter-notes', description: 'Chapter by chapter thoughts' },
        { club_id: club.id, name: 'hot-takes', description: 'Spicy opinions welcome' },
        { club_id: club.id, name: 'spoilers', description: 'Finished the book? Discuss freely' },
        { club_id: club.id, name: 'next-book', description: 'What should we read next?' }
      ]

      await supabase.from('channels').insert(defaultChannels)

      // Save session
      const newSession = {
        clubId: club.id,
        clubName: club.name,
        clubSlug: club.slug,
        memberId: member.id,
        memberName: member.name,
        isAdmin: member.is_admin
      }

      localStorage.setItem(SESSION_KEY, JSON.stringify(newSession))
      setSession(newSession)
      setLoading(false)

      return newSession
    } catch (err) {
      setError(err.message)
      setLoading(false)
      throw err
    }
  }, [])

  const joinClub = useCallback(async (clubName, password, memberName) => {
    setError(null)
    setLoading(true)

    try {
      // Find club by name or slug
      const slug = clubName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

      const { data: club, error: clubError } = await supabase
        .from('clubs')
        .select('*')
        .or(`slug.eq.${slug},name.ilike.${clubName}`)
        .single()

      if (clubError || !club) {
        throw new Error('Club not found')
      }

      // Verify password
      const passwordValid = await bcrypt.compare(password, club.password_hash)
      if (!passwordValid) {
        throw new Error('Incorrect password')
      }

      // Check if member name already exists in club
      const { data: existingMember } = await supabase
        .from('members')
        .select('*')
        .eq('club_id', club.id)
        .eq('name', memberName)
        .single()

      let member
      if (existingMember) {
        // Rejoin as existing member
        member = existingMember
        // Update last seen
        await supabase
          .from('members')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', member.id)
      } else {
        // Create new member
        const { data: newMember, error: memberError } = await supabase
          .from('members')
          .insert({
            club_id: club.id,
            name: memberName,
            is_admin: false
          })
          .select()
          .single()

        if (memberError) throw memberError
        member = newMember
      }

      // Save session
      const newSession = {
        clubId: club.id,
        clubName: club.name,
        clubSlug: club.slug,
        memberId: member.id,
        memberName: member.name,
        isAdmin: member.is_admin
      }

      localStorage.setItem(SESSION_KEY, JSON.stringify(newSession))
      setSession(newSession)
      setLoading(false)

      return newSession
    } catch (err) {
      setError(err.message)
      setLoading(false)
      throw err
    }
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    setSession(null)
  }, [])

  return {
    session,
    loading,
    error,
    createClub,
    joinClub,
    signOut
  }
}
