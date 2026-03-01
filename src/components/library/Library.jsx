import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Nominations from './Nominations'
import BookHistory from './BookHistory'

export default function Library({ session, currentBook, setCurrentBook, onBookComplete }) {
  const [nominations, setNominations] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [session.clubId])

  const fetchData = async () => {
    const [nominationsRes, historyRes] = await Promise.all([
      supabase
        .from('nominations')
        .select('*')
        .eq('club_id', session.clubId)
        .order('created_at', { ascending: false }),
      supabase
        .from('book_history')
        .select('*')
        .eq('club_id', session.clubId)
        .order('completed_at', { ascending: false })
    ])

    if (nominationsRes.data) setNominations(nominationsRes.data)
    if (historyRes.data) setHistory(historyRes.data)
    setLoading(false)
  }

  const handleNominate = async (title, author, reason) => {
    const nomination = {
      club_id: session.clubId,
      title,
      author,
      reason,
      nominated_by: session.memberName,
      votes: [session.memberName]
    }

    const { data, error } = await supabase
      .from('nominations')
      .insert(nomination)
      .select()
      .single()

    if (data) {
      setNominations(prev => [data, ...prev])
    }
  }

  const handleVote = async (nominationId) => {
    const nomination = nominations.find(n => n.id === nominationId)
    if (!nomination) return

    const hasVoted = nomination.votes?.includes(session.memberName)
    let newVotes

    if (hasVoted) {
      newVotes = nomination.votes.filter(v => v !== session.memberName)
    } else {
      newVotes = [...(nomination.votes || []), session.memberName]
    }

    await supabase
      .from('nominations')
      .update({ votes: newVotes })
      .eq('id', nominationId)

    setNominations(prev =>
      prev.map(n =>
        n.id === nominationId ? { ...n, votes: newVotes } : n
      )
    )
  }

  const handleMarkComplete = async () => {
    if (!currentBook) return

    const confirmed = window.confirm(
      `Mark "${currentBook.title}" as complete? This will archive all insights and discussions.`
    )

    if (!confirmed) return

    // Gather all cached insights from localStorage
    const cachedGuide = localStorage.getItem(`guide_${currentBook.id}`)
    const cachedCharacters = localStorage.getItem(`characters_${currentBook.id}`)

    let guide = null
    let characters = null
    let capsule = null

    try {
      if (cachedGuide) guide = JSON.parse(cachedGuide)
      if (cachedCharacters) characters = JSON.parse(cachedCharacters)
    } catch {
      // Invalid cache, ignore
    }

    // Fetch annotations and messages for stats
    const [annotationsRes, messagesRes] = await Promise.all([
      supabase
        .from('annotations')
        .select('*')
        .eq('book_id', currentBook.id)
        .eq('is_whisper', false),
      supabase
        .from('messages')
        .select('*')
        .eq('club_id', session.clubId)
    ])

    const annotations = annotationsRes.data || []
    const messages = messagesRes.data || []

    // Calculate most annotated page
    const pageCount = {}
    annotations.forEach(a => {
      pageCount[a.page_number] = (pageCount[a.page_number] || 0) + 1
    })
    const mostAnnotatedPage = Object.keys(pageCount).length > 0
      ? Object.entries(pageCount).sort((a, b) => b[1] - a[1])[0][0]
      : 1

    // Build archived insights object
    const archivedInsights = {
      guide,
      characters,
      capsule,
      stats: {
        totalAnnotations: annotations.length,
        totalMessages: messages.length,
        mostAnnotatedPage: parseInt(mostAnnotatedPage),
        totalPages: currentBook.total_pages
      },
      annotations: annotations.slice(0, 50), // Keep top 50 for reference
      archivedAt: new Date().toISOString()
    }

    // Move to history with all insights
    const { error: historyError } = await supabase
      .from('book_history')
      .insert({
        club_id: session.clubId,
        title: currentBook.title,
        author: currentBook.author,
        completed_at: new Date().toISOString(),
        capsule: archivedInsights
      })

    if (historyError) {
      console.error('Failed to add to history:', historyError)
      return
    }

    // Mark book as inactive
    await supabase
      .from('books')
      .update({
        is_active: false,
        completed_at: new Date().toISOString()
      })
      .eq('id', currentBook.id)

    // Clear localStorage caches for this book
    localStorage.removeItem(`guide_${currentBook.id}`)
    localStorage.removeItem(`characters_${currentBook.id}`)
    localStorage.removeItem(`folio_page_${currentBook.id}`)

    // Refresh data
    fetchData()
    onBookComplete()
    setCurrentBook(null)
  }

  if (loading) {
    return (
      <div className="loading" style={{ height: '100%' }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="library-container">
      {currentBook && session.isAdmin && (
        <div className="library-section">
          <div className="section-header">
            <h2 className="section-title">Current Book</h2>
            <button className="fo" onClick={handleMarkComplete}>
              Mark Complete
            </button>
          </div>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ fontSize: '48px' }}>&#128214;</div>
            <div>
              <h3 style={{ fontSize: '20px', marginBottom: '4px' }}>{currentBook.title}</h3>
              {currentBook.author && (
                <p className="text-muted">{currentBook.author}</p>
              )}
              <p className="text-muted" style={{ fontSize: '13px', marginTop: '8px' }}>
                {currentBook.total_pages} pages
              </p>
            </div>
          </div>
        </div>
      )}

      <Nominations
        nominations={nominations}
        memberName={session.memberName}
        onNominate={handleNominate}
        onVote={handleVote}
      />

      <BookHistory history={history} />
    </div>
  )
}
