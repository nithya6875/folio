import { useState } from 'react'

const ANNOTATION_TYPES = [
  { type: 'highlight', emoji: '&#128394;', label: 'Highlight' },
  { type: 'quote', emoji: '&#128172;', label: 'Quote' },
  { type: 'question', emoji: '&#129300;', label: 'Question' },
  { type: 'note', emoji: '&#128221;', label: 'Note' },
  { type: 'whisper', emoji: '&#129323;', label: 'Whisper' }
]

export default function AnnotationForm({ initialType, selectedText, page, onSave, onClose }) {
  const [type, setType] = useState(initialType)
  const [note, setNote] = useState('')
  const [text, setText] = useState(selectedText)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    await onSave({
      type,
      selectedText: text,
      note,
      page
    })

    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add Annotation</h2>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="type-selector">
              {ANNOTATION_TYPES.map(({ type: t, emoji, label }) => (
                <button
                  key={t}
                  type="button"
                  className={`type-btn ${type === t ? 'active' : ''}`}
                  onClick={() => setType(t)}
                  title={label}
                >
                  <span dangerouslySetInnerHTML={{ __html: emoji }} />
                </button>
              ))}
            </div>

            {type === 'whisper' && (
              <p className="text-muted mb-3" style={{ fontSize: '13px' }}>
                &#129323; Whispers are private — only you can see them.
              </p>
            )}

            {selectedText ? (
              <div className={`selected-text-preview ${type}`}>
                "{selectedText}"
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

            <div className="form-group">
              <label className="form-label">Note (optional)</label>
              <textarea
                className="fi"
                placeholder="Add your thoughts..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
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
              disabled={saving || (!selectedText && !text.trim())}
            >
              {saving ? 'Saving...' : 'Save Annotation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
