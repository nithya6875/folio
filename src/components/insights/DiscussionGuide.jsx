import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { generateDiscussionGuide } from '../../lib/claude'

export default function DiscussionGuide({ session, currentBook }) {
  const [guide, setGuide] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Check for cached guide
  useEffect(() => {
    const cached = localStorage.getItem(`guide_${currentBook.id}`)
    if (cached) {
      try {
        setGuide(JSON.parse(cached))
      } catch {
        // Invalid cache
      }
    }
  }, [currentBook.id])

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch annotations and messages
      const [annotationsRes, messagesRes, membersRes] = await Promise.all([
        supabase
          .from('annotations')
          .select('*')
          .eq('book_id', currentBook.id)
          .eq('is_whisper', false),
        supabase
          .from('messages')
          .select('*, channels!inner(name)')
          .eq('club_id', session.clubId),
        supabase
          .from('members')
          .select('name')
          .eq('club_id', session.clubId)
      ])

      const annotations = annotationsRes.data || []
      const messages = messagesRes.data || []
      const memberNames = (membersRes.data || []).map(m => m.name)

      // Filter to relevant channels
      const relevantMessages = messages.filter(m =>
        ['general', 'hot-takes', 'chapter-notes'].includes(m.channels?.name)
      )

      const result = await generateDiscussionGuide(
        currentBook.title,
        currentBook.author || 'Unknown',
        annotations,
        relevantMessages,
        memberNames
      )

      setGuide(result)
      localStorage.setItem(`guide_${currentBook.id}`, JSON.stringify(result))
    } catch (err) {
      console.error('Failed to generate guide:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!guide) {
    return (
      <div className="guide-container">
        <div className="guide-header">
          <h2 className="section-title">Discussion Guide</h2>
          <p className="text-muted mt-2">
            Generate an AI-powered discussion guide based on your club's annotations and conversations.
          </p>
        </div>

        <button
          className="fb guide-generate-btn mt-4"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              Generating...
            </>
          ) : (
            <>
              <span>✨</span>
              Generate Discussion Guide
            </>
          )}
        </button>

        {error && (
          <p className="text-red mt-3" style={{ fontSize: '14px' }}>
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="guide-container">
      <div className="guide-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 className="section-title">Discussion Guide</h2>
          <p className="text-muted mt-1" style={{ fontSize: '14px' }}>
            {currentBook.title} by {currentBook.author || 'Unknown'}
          </p>
        </div>
        <button className="fo" onClick={handleGenerate} disabled={loading}>
          {loading ? 'Regenerating...' : 'Regenerate'}
        </button>
      </div>

      <div className="guide-opening">{guide.opening}</div>

      {/* Themes */}
      {guide.themes && guide.themes.length > 0 && (
        <div className="guide-section">
          <h3 className="guide-section-title">
            <span>📚</span> Key Themes
          </h3>
          {guide.themes.map((theme, idx) => (
            <div key={idx} className="theme-card">
              <h4 className="theme-title">{theme.title}</h4>
              <p className="theme-desc">{theme.description}</p>
              <ul className="theme-questions">
                {theme.questions.map((q, qIdx) => (
                  <li key={qIdx}>{q}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Debates */}
      {guide.debates && guide.debates.length > 0 && (
        <div className="guide-section">
          <h3 className="guide-section-title">
            <span>⚖️</span> Points of Debate
          </h3>
          {guide.debates.map((debate, idx) => (
            <div key={idx} className="debate-card">
              <div className="debate-statement">{debate.statement}</div>
              <div className="debate-sides">
                <div className="debate-side pro">
                  <div className="debate-side-label">For</div>
                  <p className="debate-argument">{debate.proArgument}</p>
                  {debate.membersOnEachSide?.pro?.length > 0 && (
                    <div className="debate-members">
                      {debate.membersOnEachSide.pro.map(m => (
                        <span key={m} className="member-badge">{m}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="debate-side con">
                  <div className="debate-side-label">Against</div>
                  <p className="debate-argument">{debate.conArgument}</p>
                  {debate.membersOnEachSide?.con?.length > 0 && (
                    <div className="debate-members">
                      {debate.membersOnEachSide.con.map(m => (
                        <span key={m} className="member-badge">{m}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Member Spotlights */}
      {guide.memberSpotlights && guide.memberSpotlights.length > 0 && (
        <div className="guide-section">
          <h3 className="guide-section-title">
            <span>🌟</span> Member Spotlights
          </h3>
          <div className="spotlight-grid">
            {guide.memberSpotlights.map((spotlight, idx) => (
              <div key={idx} className="spotlight-card">
                <div className="spotlight-header">
                  <div
                    className="avatar"
                    style={{
                      backgroundColor: getColorFromName(spotlight.member),
                      width: 36,
                      height: 36
                    }}
                  >
                    {spotlight.member[0]}
                  </div>
                  <span className="spotlight-name">{spotlight.member}</span>
                </div>
                <p className="spotlight-quote">"{spotlight.standoutMoment}"</p>
                <p className="spotlight-followup">{spotlight.followUp}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Agenda */}
      {guide.suggestedAgenda && guide.suggestedAgenda.length > 0 && (
        <div className="guide-section">
          <h3 className="guide-section-title">
            <span>📅</span> Suggested Agenda
          </h3>
          <div className="agenda-timeline">
            {guide.suggestedAgenda.map((item, idx) => (
              <div key={idx} className="agenda-item">
                <div className="agenda-minutes">{item.minutes} min</div>
                <div className="agenda-text">{item.item}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Closing */}
      {guide.closingReflection && (
        <div className="guide-closing">{guide.closingReflection}</div>
      )}
    </div>
  )
}

function getColorFromName(name) {
  const colors = ['#2D5016', '#B8860B', '#8B3A3A', '#1E4D6B', '#6B4E1E']
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}
