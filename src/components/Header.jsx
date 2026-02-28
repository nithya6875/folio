import { getAvatarColor, getInitials } from '../hooks/usePresence'

export default function Header({ session, tabs, activeTab, onTabChange, onSignOut }) {
  return (
    <header className="header">
      <div className="header-left">
        <span className="header-logo logo">Folio</span>
        <span className="header-club">{session.clubName}</span>
      </div>

      <nav className="header-nav">
        {tabs.map(tab => (
          <button
            key={tab}
            className={`nav-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => onTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="header-right">
        <div className="header-user">
          <div
            className="avatar"
            style={{ backgroundColor: getAvatarColor(session.memberName) }}
          >
            {getInitials(session.memberName)}
          </div>
          <span>{session.memberName}</span>
          {session.isAdmin && <span className="admin-badge">Admin</span>}
        </div>
        <button className="sign-out-btn" onClick={onSignOut}>
          Sign out
        </button>
      </div>
    </header>
  )
}
