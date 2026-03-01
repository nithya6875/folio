import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { generateBookCapsule } from '../../lib/claude'
import { getAvatarColor, getInitials } from '../../hooks/usePresence'

export default function BookCapsule({ session, currentBook, members }) {
  const [capsule, setCapsule] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Check for existing capsule
  useEffect(() => {
    checkExistingCapsule()
  }, [currentBook.id])

  const checkExistingCapsule = async () => {
    const { data } = await supabase
      .from('book_history')
      .select('capsule')
      .eq('club_id', session.clubId)
      .eq('title', currentBook.title)
      .single()

    if (data?.capsule) {
      setCapsule(data.capsule)
    }
  }

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch all data
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

      const result = await generateBookCapsule(
        currentBook.title,
        currentBook.author || 'Unknown',
        annotationsRes.data || [],
        messagesRes.data || [],
        members
      )

      setCapsule(result)

      // Save to history if book is completed
      if (currentBook.completed_at) {
        await supabase
          .from('book_history')
          .update({ capsule: result })
          .eq('club_id', session.clubId)
          .eq('title', currentBook.title)
      }
    } catch (err) {
      console.error('Failed to generate capsule:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    window.print()
  }

  if (!capsule) {
    return (
      <div className="capsule-container">
        <div className="graph-header">
          <h2 className="section-title">End-of-Book Capsule</h2>
          <p className="text-muted mt-2">
            Generate a commemorative summary of your club's reading journey.
          </p>
        </div>

        <button
          className="fb mt-4"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? 'Generating...' : '🏆 Generate Capsule'}
        </button>

        {error && (
          <p className="text-red mt-3" style={{ fontSize: '14px' }}>
            {error}
          </p>
        )}

        <p className="text-muted mt-4" style={{ fontSize: '13px' }}>
          Tip: Generate this after marking your book complete for the best results.
        </p>
      </div>
    )
  }

  return (
    <div className="capsule-container" id="print-area">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .capsule-actions {
            display: none !important;
          }
        }
      `}</style>

      <div className="capsule-card">
        <h1 className="capsule-headline">{capsule.headline}</h1>

        <div className="capsule-dateline">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>

        <p className="capsule-summary">{capsule.summary}</p>

        {/* Member Moments */}
        {capsule.memberMoments && capsule.memberMoments.length > 0 && (
          <div className="capsule-section">
            <h3 className="capsule-section-title">Member Highlights</h3>
            <div className="capsule-moments">
              {capsule.memberMoments.map((moment, idx) => (
                <div key={idx} className="capsule-moment">
                  <div className="capsule-moment-badge">{moment.badge}</div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                    <div
                      className="avatar"
                      style={{
                        backgroundColor: getAvatarColor(moment.member),
                        width: '40px',
                        height: '40px'
                      }}
                    >
                      {getInitials(moment.member)}
                    </div>
                  </div>
                  <p className="capsule-moment-member">{moment.member}</p>
                  <p className="capsule-moment-quote">"{moment.quote}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        {capsule.stats && (
          <div className="capsule-section">
            <h3 className="capsule-section-title">By the Numbers</h3>
            <div className="capsule-stats">
              <div className="capsule-stat">
                <div className="capsule-stat-value">{capsule.stats.totalAnnotations}</div>
                <div className="capsule-stat-label">Annotations</div>
              </div>
              <div className="capsule-stat">
                <div className="capsule-stat-value">{capsule.stats.totalMessages}</div>
                <div className="capsule-stat-label">Messages</div>
              </div>
              <div className="capsule-stat">
                <div className="capsule-stat-value">p{capsule.stats.mostAnnotatedPage}</div>
                <div className="capsule-stat-label">Hottest Page</div>
              </div>
              <div className="capsule-stat">
                <div className="capsule-stat-value" style={{ fontSize: '14px' }}>
                  {capsule.stats.mostDebatedTopic}
                </div>
                <div className="capsule-stat-label">Hot Topic</div>
              </div>
            </div>
          </div>
        )}

        {/* Verdict */}
        {capsule.verdict && (
          <div className="capsule-verdict">"{capsule.verdict}"</div>
        )}

        {/* Teaser */}
        {capsule.nextChapterTeaser && (
          <p className="capsule-teaser">{capsule.nextChapterTeaser}</p>
        )}
      </div>

      <div className="capsule-actions">
        <button className="fo" onClick={handleGenerate} disabled={loading}>
          {loading ? 'Regenerating...' : 'Regenerate'}
        </button>
        <button className="fb" onClick={handleExport}>
          Export as PDF
        </button>
      </div>
    </div>
  )
}
