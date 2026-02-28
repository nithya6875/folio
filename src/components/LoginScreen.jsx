import { useState } from 'react'

export default function LoginScreen({ onCreateClub, onJoinClub }) {
  const [mode, setMode] = useState('join') // 'join' or 'create'
  const [name, setName] = useState('')
  const [clubName, setClubName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'create') {
        await onCreateClub(clubName, password, name)
      } else {
        await onJoinClub(clubName, password, name)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="login-header">
          <h1 className="login-logo logo">Folio</h1>
          <p className="login-tagline">Read together, discuss better</p>
        </div>

        <div className="login-card">
          <div className="login-tabs">
            <button
              className={`login-tab ${mode === 'join' ? 'active' : ''}`}
              onClick={() => setMode('join')}
            >
              Join a Club
            </button>
            <button
              className={`login-tab ${mode === 'create' ? 'active' : ''}`}
              onClick={() => setMode('create')}
            >
              Start a Club
            </button>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Your Name</label>
              <input
                type="text"
                className="fi"
                placeholder="e.g. Jane Austen"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Club Name</label>
              <input
                type="text"
                className="fi"
                placeholder={mode === 'create' ? 'e.g. The Midnight Readers' : 'Enter club name'}
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                {mode === 'create' ? 'Create Password' : 'Club Password'}
              </label>
              <input
                type="password"
                className="fi"
                placeholder={mode === 'create' ? 'Choose a password for your club' : 'Enter password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <div className="login-error">{error}</div>}

            <button
              type="submit"
              className="fb login-submit"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Loading...' : mode === 'create' ? 'Create Club' : 'Join Club'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
