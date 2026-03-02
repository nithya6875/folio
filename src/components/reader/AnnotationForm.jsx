import { useState } from 'react'

const ANNOTATION_TYPES = [
  { type: 'highlight', emoji: '🖍️', label: 'Highlight', description: 'Mark important text' },
  { type: 'quote', emoji: '💬', label: 'Quote', description: 'Save a memorable passage' },
  { type: 'question', emoji: '❓', label: 'Question', description: 'Ask the club something' },
  { type: 'note', emoji: '📝', label: 'Note', description: 'Share your analysis' },
  { type: 'whisper', emoji: '🤫', label: 'Whisper', description: 'Private note for yourself' }
]

export default function AnnotationForm({ initialType, selectedText, page, onSave, onClose }) {
  const [type, setType] = useState(initialType)
  const [note, setNote] = useState('')
  const [text, setText] = useState(selectedText)
  const [saving, setSaving] = useState(false)

  const currentType = ANNOTATION_TYPES.find(t => t.type === type)

  // Validation based on type
  const isValid = () => {
    const hasText = selectedText || text.trim()
    if (!hasText) return false

    switch (type) {
      case 'highlight':
        return true // No note required
      case 'quote':
        return true // No note required
      case 'question':
        return note.trim().length > 0 // Question text required
      case 'note':
        return note.trim().length > 0 // Analysis required
      case 'whisper':
        return true // Note optional
      default:
        return true
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValid()) return

    setSaving(true)

    await onSave({
      type,
      selectedText: text,
      note,
      page
    })

    setSaving(false)
  }

  const getNoteLabel = () => {
    switch (type) {
      case 'highlight':
        return 'Add a comment (optional)'
      case 'quote':
        return 'Why does this resonate? (optional)'
      case 'question':
        return 'Your question for the club'
      case 'note':
        return 'Your analysis'
      case 'whisper':
        return 'Your private thoughts (optional)'
      default:
        return 'Note'
    }
  }

  const getNotePlaceholder = () => {
    switch (type) {
      case 'highlight':
        return 'Quick thought about this passage...'
      case 'quote':
        return 'This stood out because...'
      case 'question':
        return 'What do you all think about...?'
      case 'note':
        return 'I noticed that... / This connects to... / The author is suggesting...'
      case 'whisper':
        return 'A thought just for you...'
      default:
        return 'Add your thoughts...'
    }
  }

  const isNoteRequired = type === 'question' || type === 'note'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add {currentType?.label || 'Annotation'}</h2>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Type selector */}
            <div className="type-selector">
              {ANNOTATION_TYPES.map(({ type: t, emoji, label }) => (
                <button
                  key={t}
                  type="button"
                  className={`type-btn ${type === t ? 'active' : ''}`}
                  onClick={() => setType(t)}
                  title={label}
                >
                  <span>{emoji}</span>
                </button>
              ))}
            </div>

            {/* Type description */}
            <p className="type-description">
              {currentType?.emoji} {currentType?.description}
              {type === 'whisper' && ' — only you can see this'}
            </p>

            {/* Selected text preview */}
            {selectedText ? (
              <div className={`selected-text-preview ${type}`}>
                {type === 'quote' ? `"${selectedText}"` : selectedText}
              </div>
            ) : (
              <div className="form-group mb-3">
                <label className="form-label">Selected Text</label>
                <textarea
                  className="fi"
                  placeholder="Paste or type the text you're annotating..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            {/* Note field - different based on type */}
            <div className="form-group">
              <label className="form-label">
                {getNoteLabel()}
                {isNoteRequired && <span className="required-star"> *</span>}
              </label>
              <textarea
                className="fi"
                placeholder={getNotePlaceholder()}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={type === 'highlight' ? 2 : 4}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="fo" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="fb"
              disabled={saving || !isValid()}
            >
              {saving ? 'Saving...' : `Save ${currentType?.label || 'Annotation'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
