import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import DiscussionGuide from './DiscussionGuide'
import CharacterGraph from './CharacterGraph'
import PaceCoach from './PaceCoach'
import BookCapsule from './BookCapsule'
import ArchivedInsights from './ArchivedInsights'

const NAV_ITEMS = [
  { id: 'guide', label: 'Discussion Guide', icon: '&#128172;' },
  { id: 'characters', label: 'Characters', icon: '&#128101;' },
  { id: 'progress', label: 'Progress', icon: '&#128200;' },
  { id: 'capsule', label: 'Book Capsule', icon: '&#127942;' },
  { id: 'archive', label: 'Archive', icon: '&#128218;' }
]

export default function Insights({ session, currentBook, members }) {
  const [activeSection, setActiveSection] = useState('guide')
  const [bookHistory, setBookHistory] = useState([])

  useEffect(() => {
    fetchBookHistory()
  }, [session.clubId])

  const fetchBookHistory = async () => {
    const { data } = await supabase
      .from('book_history')
      .select('*')
      .eq('club_id', session.clubId)
      .order('completed_at', { ascending: false })

    if (data) {
      setBookHistory(data)
    }
  }

  const renderSection = () => {
    // Archive is always accessible
    if (activeSection === 'archive') {
      return (
        <ArchivedInsights
          bookHistory={bookHistory}
        />
      )
    }

    if (!currentBook) {
      return (
        <div className="empty-state" style={{ height: '100%' }}>
          <div className="empty-icon">📚</div>
          <h2 className="empty-title">No book selected</h2>
          <p className="empty-text">
            Upload a book in the Reader tab to unlock AI-powered insights.
          </p>
        </div>
      )
    }

    switch (activeSection) {
      case 'guide':
        return (
          <DiscussionGuide
            session={session}
            currentBook={currentBook}
          />
        )
      case 'characters':
        return (
          <CharacterGraph
            session={session}
            currentBook={currentBook}
          />
        )
      case 'progress':
        return (
          <PaceCoach
            session={session}
            currentBook={currentBook}
            members={members}
          />
        )
      case 'capsule':
        return (
          <BookCapsule
            session={session}
            currentBook={currentBook}
            members={members}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="insights-container">
      <nav className="insights-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`insights-nav-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => setActiveSection(item.id)}
          >
            <span dangerouslySetInnerHTML={{ __html: item.icon }} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="insights-main">
        {renderSection()}
      </div>
    </div>
  )
}
