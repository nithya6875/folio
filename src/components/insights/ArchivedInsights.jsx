import { useState } from 'react'
import { getAvatarColor, getInitials } from '../../hooks/usePresence'

export default function ArchivedInsights({ bookHistory }) {
  const [selectedBook, setSelectedBook] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (bookHistory.length === 0) {
    return (
      <div className="archive-container">
        <div className="graph-header">
          <h2 className="section-title">Archived Insights</h2>
          <p className="text-muted mt-2">
            No completed books yet. When you finish a book, its insights will be preserved here.
          </p>
        </div>
      </div>
    )
  }

  if (!selectedBook) {
    return (
      <div className="archive-container">
        <div className="graph-header">
          <h2 className="section-title">Archived Insights</h2>
          <p className="text-muted mt-2">
            Browse insights from your completed books.
          </p>
        </div>

        <div className="archive-grid">
          {bookHistory.map(book => (
            <div
              key={book.id}
              className="archive-card"
              onClick={() => {
                setSelectedBook(book)
                setActiveTab('overview')
              }}
            >
              <div className="archive-card-icon">📚</div>
              <h3 className="archive-card-title">{book.title}</h3>
              {book.author && (
                <p className="archive-card-author">by {book.author}</p>
              )}
              <p className="archive-card-date">
                Completed {formatDate(book.completed_at)}
              </p>
              {book.capsule?.stats && (
                <div className="archive-card-stats">
                  <span>{book.capsule.stats.totalAnnotations} annotations</span>
                  <span>{book.capsule.stats.totalMessages} messages</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const insights = selectedBook.capsule || {}
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'guide', label: 'Discussion Guide', disabled: !insights.guide },
    { id: 'characters', label: 'Characters', disabled: !insights.characters },
    { id: 'annotations', label: 'Annotations', disabled: !insights.annotations?.length }
  ]

  return (
    <div className="archive-container">
      <div className="archive-header">
        <button
          className="archive-back"
          onClick={() => setSelectedBook(null)}
        >
          &larr; Back to Archive
        </button>
        <div>
          <h2 className="section-title">{selectedBook.title}</h2>
          {selectedBook.author && (
            <p className="text-muted">{selectedBook.author}</p>
          )}
        </div>
      </div>

      <div className="archive-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`archive-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            disabled={tab.disabled}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="archive-content">
        {activeTab === 'overview' && (
          <OverviewSection insights={insights} book={selectedBook} />
        )}
        {activeTab === 'guide' && insights.guide && (
          <GuideSection guide={insights.guide} />
        )}
        {activeTab === 'characters' && insights.characters && (
          <CharactersSection characters={insights.characters} />
        )}
        {activeTab === 'annotations' && insights.annotations && (
          <AnnotationsSection annotations={insights.annotations} />
        )}
      </div>
    </div>
  )
}

function OverviewSection({ insights, book }) {
  const stats = insights.stats || {}

  return (
    <div className="archive-overview">
      <div className="capsule-stats" style={{ marginBottom: '24px' }}>
        <div className="capsule-stat">
          <div className="capsule-stat-value">{stats.totalAnnotations || 0}</div>
          <div className="capsule-stat-label">Annotations</div>
        </div>
        <div className="capsule-stat">
          <div className="capsule-stat-value">{stats.totalMessages || 0}</div>
          <div className="capsule-stat-label">Messages</div>
        </div>
        <div className="capsule-stat">
          <div className="capsule-stat-value">{stats.totalPages || '?'}</div>
          <div className="capsule-stat-label">Pages</div>
        </div>
        <div className="capsule-stat">
          <div className="capsule-stat-value">p{stats.mostAnnotatedPage || '?'}</div>
          <div className="capsule-stat-label">Hottest Page</div>
        </div>
      </div>

      {insights.capsule && (
        <div className="archive-capsule-preview">
          {insights.capsule.headline && (
            <h3 className="capsule-headline" style={{ fontSize: '20px', marginBottom: '12px' }}>
              {insights.capsule.headline}
            </h3>
          )}
          {insights.capsule.summary && (
            <p className="capsule-summary">{insights.capsule.summary}</p>
          )}
          {insights.capsule.verdict && (
            <div className="capsule-verdict" style={{ marginTop: '16px' }}>
              "{insights.capsule.verdict}"
            </div>
          )}
        </div>
      )}

      {!insights.capsule && !insights.guide && !insights.characters && (
        <div className="empty-state" style={{ padding: '40px 20px' }}>
          <p className="text-muted">
            This book was completed before insights were generated.
          </p>
        </div>
      )}

      <div className="archive-meta">
        <p className="text-muted" style={{ fontSize: '13px' }}>
          Archived on {new Date(insights.archivedAt || book.completed_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}

function GuideSection({ guide }) {
  return (
    <div className="guide-container" style={{ padding: 0 }}>
      {guide.opening && (
        <div className="guide-opening">{guide.opening}</div>
      )}

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
                {theme.questions?.map((q, qIdx) => (
                  <li key={qIdx}>{q}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

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
                </div>
                <div className="debate-side con">
                  <div className="debate-side-label">Against</div>
                  <p className="debate-argument">{debate.conArgument}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {guide.closingReflection && (
        <div className="guide-closing">{guide.closingReflection}</div>
      )}
    </div>
  )
}

function CharactersSection({ characters }) {
  const ROLE_COLORS = {
    protagonist: '#2D5016',
    antagonist: '#8B3A3A',
    supporting: '#B8860B',
    minor: '#8a7a6a'
  }

  return (
    <div className="archive-characters">
      <div className="characters-grid">
        {characters.characters?.map((char, idx) => (
          <div key={idx} className="character-card">
            <div
              className="character-avatar"
              style={{ backgroundColor: ROLE_COLORS[char.role] || ROLE_COLORS.minor }}
            >
              {char.name[0]}
            </div>
            <h4 className="character-name">{char.name}</h4>
            <p className="character-role" style={{ textTransform: 'capitalize' }}>
              {char.role}
            </p>
            <p className="character-desc">{char.description}</p>
          </div>
        ))}
      </div>

      {characters.relationships && characters.relationships.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h4 style={{ marginBottom: '12px' }}>Relationships</h4>
          <div className="relationships-list">
            {characters.relationships.map((rel, idx) => (
              <div key={idx} className="relationship-item">
                <span className="relationship-pair">
                  {rel.source} &harr; {rel.target}
                </span>
                <span className={`relationship-label ${rel.sentiment || 'neutral'}`}>
                  {rel.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AnnotationsSection({ annotations }) {
  const [filter, setFilter] = useState('all')

  const filteredAnnotations = filter === 'all'
    ? annotations
    : annotations.filter(a => a.type === filter)

  const types = ['all', ...new Set(annotations.map(a => a.type))]

  return (
    <div className="archive-annotations">
      <div className="annotation-filters" style={{ marginBottom: '16px' }}>
        {types.map(type => (
          <button
            key={type}
            className={`annotation-filter ${filter === type ? 'active' : ''}`}
            onClick={() => setFilter(type)}
          >
            {type === 'all' ? 'All' : type}
          </button>
        ))}
      </div>

      <div className="annotations-list">
        {filteredAnnotations.map(annotation => (
          <div key={annotation.id} className="annotation-item archived">
            <div className="annotation-header">
              <div className="annotation-meta">
                <div
                  className="avatar"
                  style={{
                    backgroundColor: getAvatarColor(annotation.member_name),
                    width: '24px',
                    height: '24px',
                    fontSize: '11px'
                  }}
                >
                  {getInitials(annotation.member_name)}
                </div>
                <span className="annotation-author">{annotation.member_name}</span>
                <span className="annotation-page">p.{annotation.page_number}</span>
              </div>
              <span className={`annotation-type ${annotation.type}`}>
                {annotation.type}
              </span>
            </div>
            <blockquote className="annotation-quote">
              "{annotation.selected_text}"
            </blockquote>
            {annotation.note && (
              <p className="annotation-note">{annotation.note}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
