import { useState } from 'react'

export default function ChannelSidebar({
  channels,
  activeChannel,
  isAdmin,
  onChannelSelect,
  onCreateChannel
}) {
  const [showForm, setShowForm] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (newChannelName.trim()) {
      onCreateChannel(newChannelName.trim())
      setNewChannelName('')
      setShowForm(false)
    }
  }

  return (
    <aside className="channel-sidebar">
      <div className="sidebar-header">
        <h3 className="sidebar-title">Channels</h3>
      </div>

      <div className="channel-list">
        {channels.map(channel => (
          <div
            key={channel.id}
            className={`channel-item ${activeChannel?.id === channel.id ? 'active' : ''}`}
            onClick={() => onChannelSelect(channel)}
          >
            <span className="channel-hash">#</span>
            <span>{channel.name}</span>
          </div>
        ))}

        {isAdmin && (
          showForm ? (
            <form onSubmit={handleSubmit} style={{ padding: '8px 20px' }}>
              <input
                type="text"
                className="fi"
                placeholder="channel-name"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                autoFocus
                onBlur={() => {
                  if (!newChannelName.trim()) {
                    setShowForm(false)
                  }
                }}
              />
            </form>
          ) : (
            <button
              className="add-channel-btn"
              onClick={() => setShowForm(true)}
            >
              <span>+</span>
              <span>Add channel</span>
            </button>
          )
        )}
      </div>
    </aside>
  )
}
