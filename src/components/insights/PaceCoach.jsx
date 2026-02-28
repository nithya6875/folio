import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { generatePaceNudges } from '../../lib/claude'
import { getAvatarColor, getInitials } from '../../hooks/usePresence'

export default function PaceCoach({ session, currentBook, members }) {
  const [nudges, setNudges] = useState({})
  const [loading, setLoading] = useState(false)
  const [meetingDate, setMeetingDate] = useState(currentBook.meeting_date || '')
  const [editingDate, setEditingDate] = useState(false)

  const totalPages = currentBook.total_pages || 100

  // Calculate stats
  const activeMember = members.filter(m => m.current_page > 0)
  const avgProgress = activeMember.length > 0
    ? Math.round(activeMember.reduce((sum, m) => sum + (m.current_page / totalPages) * 100, 0) / activeMember.length)
    : 0

  const furthestAhead = [...members].sort((a, b) => (b.current_page || 0) - (a.current_page || 0))[0]
  const mostBehind = [...members].sort((a, b) => (a.current_page || 0) - (b.current_page || 0))[0]

  const daysUntilMeeting = meetingDate
    ? Math.max(0, Math.ceil((new Date(meetingDate) - new Date()) / 86400000))
    : null

  const handleSetMeetingDate = async () => {
    if (!meetingDate) return

    await supabase
      .from('books')
      .update({ meeting_date: meetingDate })
      .eq('id', currentBook.id)

    setEditingDate(false)
  }

  const handleGenerateNudges = async () => {
    if (!meetingDate) {
      alert('Please set a meeting date first')
      return
    }

    setLoading(true)
    try {
      const result = await generatePaceNudges(
        members,
        totalPages,
        meetingDate,
        currentBook.title
      )

      const nudgeMap = {}
      result.forEach(n => {
        nudgeMap[n.name] = n.nudge
      })
      setNudges(nudgeMap)
    } catch (err) {
      console.error('Failed to generate nudges:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatus = (member) => {
    if (!meetingDate || daysUntilMeeting === 0) return 'on-track'

    const pagesLeft = totalPages - (member.current_page || 1)
    const pagesPerDayNeeded = pagesLeft / daysUntilMeeting

    // Estimate pages per day based on join date
    const daysSinceJoined = Math.max(1, (Date.now() - new Date(member.created_at)) / 86400000)
    const pagesPerDayActual = (member.current_page || 1) / daysSinceJoined

    if (pagesPerDayActual >= pagesPerDayNeeded * 0.9) return 'on-track'
    if (pagesPerDayActual >= pagesPerDayNeeded * 0.5) return 'behind'
    return 'at-risk'
  }

  const getFinishEstimate = (member) => {
    const daysSinceJoined = Math.max(1, (Date.now() - new Date(member.created_at)) / 86400000)
    const pagesPerDay = (member.current_page || 1) / daysSinceJoined
    if (pagesPerDay <= 0) return 'Unknown'

    const pagesLeft = totalPages - (member.current_page || 1)
    const daysToFinish = pagesLeft / pagesPerDay

    const finishDate = new Date(Date.now() + daysToFinish * 86400000)
    return finishDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="pace-container">
      <div className="graph-header" style={{ marginBottom: '24px' }}>
        <h2 className="section-title">Reading Progress</h2>
        <p className="text-muted mt-1" style={{ fontSize: '14px' }}>
          Track everyone's pace and stay on schedule for your next meeting.
        </p>
      </div>

      {/* Meeting Date */}
      <div className="card mb-4" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '24px' }}>&#128197;</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 600, marginBottom: '4px' }}>Next Meeting</p>
          {editingDate || !meetingDate ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="date"
                className="fi"
                style={{ width: '180px' }}
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
              />
              <button className="fb" onClick={handleSetMeetingDate}>
                Set
              </button>
              {meetingDate && (
                <button className="fo" onClick={() => setEditingDate(false)}>
                  Cancel
                </button>
              )}
            </div>
          ) : (
            <p className="text-muted">
              {new Date(meetingDate).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
              {daysUntilMeeting !== null && ` (${daysUntilMeeting} days)`}
              {session.isAdmin && (
                <button
                  onClick={() => setEditingDate(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--green)',
                    cursor: 'pointer',
                    marginLeft: '8px',
                    fontSize: '13px',
                    textDecoration: 'underline'
                  }}
                >
                  Edit
                </button>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="pace-overview">
        <div className="pace-stat">
          <div className="pace-stat-value">{avgProgress}%</div>
          <div className="pace-stat-label">Average Progress</div>
        </div>
        <div className="pace-stat">
          <div className="pace-stat-value">&#127942;</div>
          <div className="pace-stat-label">{furthestAhead?.name || 'N/A'}</div>
        </div>
        <div className="pace-stat">
          <div className="pace-stat-value">&#128517;</div>
          <div className="pace-stat-label">{mostBehind?.name || 'N/A'}</div>
        </div>
        <div className="pace-stat">
          <div className="pace-stat-value">{daysUntilMeeting ?? '--'}</div>
          <div className="pace-stat-label">Days Left</div>
        </div>
      </div>

      {/* Generate Nudges Button */}
      <div style={{ marginBottom: '24px' }}>
        <button
          className="fo"
          onClick={handleGenerateNudges}
          disabled={loading || !meetingDate}
        >
          {loading ? 'Generating...' : '&#10024; Generate Encouragement'}
        </button>
      </div>

      {/* Member Cards */}
      <div className="pace-members">
        {members.map(member => {
          const progress = Math.round(((member.current_page || 1) / totalPages) * 100)
          const status = getStatus(member)
          const finishEstimate = getFinishEstimate(member)
          const nudge = nudges[member.name]

          return (
            <div key={member.id} className="pace-member-card">
              <div className="pace-member-header">
                <div className="pace-member-info">
                  <div
                    className="avatar"
                    style={{ backgroundColor: getAvatarColor(member.name) }}
                  >
                    {getInitials(member.name)}
                  </div>
                  <span className="pace-member-name">{member.name}</span>
                </div>
                <span className={`pace-status ${status}`}>
                  {status === 'on-track' && '&#128994; On track'}
                  {status === 'behind' && '&#128993; Falling behind'}
                  {status === 'at-risk' && '&#128308; At risk'}
                </span>
              </div>

              <div className="pace-progress">
                <div
                  className="pace-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="pace-details">
                <span>Page {member.current_page || 1} of {totalPages}</span>
                <span>Est. finish: {finishEstimate}</span>
              </div>

              {nudge && (
                <div className="pace-nudge">{nudge}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
