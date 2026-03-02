import { useState, useEffect } from 'react'
import { useClub } from './hooks/useClub'
import { supabase } from './lib/supabase'
import './lib/seedData' // Makes seedEngagement() available in console
import LoginScreen from './components/LoginScreen'
import Header from './components/Header'
import PDFReader from './components/reader/PDFReader'
import Forum from './components/forum/Forum'
import Library from './components/library/Library'
import Insights from './components/insights/Insights'

const TABS = ['Reader', 'Forum', 'Library', 'Insights']

export default function App() {
  const { session, loading, createClub, joinClub, signOut } = useClub()
  const [activeTab, setActiveTab] = useState('Reader')
  const [currentBook, setCurrentBook] = useState(null)
  const [members, setMembers] = useState([])

  // Fetch current book and members when session loads
  useEffect(() => {
    if (!session) return

    fetchCurrentBook()
    fetchMembers()
  }, [session])

  const fetchCurrentBook = async () => {
    const { data } = await supabase
      .from('books')
      .select('*')
      .eq('club_id', session.clubId)
      .eq('is_active', true)
      .single()

    if (data) {
      setCurrentBook(data)
    }
  }

  const fetchMembers = async () => {
    const { data } = await supabase
      .from('members')
      .select('*')
      .eq('club_id', session.clubId)

    if (data) {
      setMembers(data)
    }
  }

  if (loading) {
    return (
      <div className="loading" style={{ height: '100vh' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!session) {
    return (
      <LoginScreen
        onCreateClub={createClub}
        onJoinClub={joinClub}
      />
    )
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'Reader':
        return (
          <PDFReader
            session={session}
            currentBook={currentBook}
            setCurrentBook={setCurrentBook}
            members={members}
          />
        )
      case 'Forum':
        return (
          <Forum
            session={session}
          />
        )
      case 'Library':
        return (
          <Library
            session={session}
            currentBook={currentBook}
            setCurrentBook={setCurrentBook}
            onBookComplete={fetchCurrentBook}
          />
        )
      case 'Insights':
        return (
          <Insights
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
    <div className="app-shell">
      <Header
        session={session}
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSignOut={signOut}
      />
      <main className="main-content">
        {renderTab()}
      </main>
    </div>
  )
}
