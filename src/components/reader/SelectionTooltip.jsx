import { useEffect, useRef } from 'react'

const ANNOTATION_TYPES = [
  { type: 'highlight', emoji: '&#128394;', label: 'Highlight' },
  { type: 'quote', emoji: '&#128172;', label: 'Quote' },
  { type: 'question', emoji: '&#129300;', label: 'Question' },
  { type: 'note', emoji: '&#128221;', label: 'Note' },
  { type: 'whisper', emoji: '&#129323;', label: 'Whisper' }
]

export default function SelectionTooltip({ position, onSelect, onClose }) {
  const tooltipRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
        onClose()
      }
    }

    // Delay to prevent immediate close
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  // Position tooltip above selection, centered
  const tooltipWidth = 220
  const left = Math.max(10, Math.min(position.x - tooltipWidth / 2, window.innerWidth - tooltipWidth - 10))
  const top = Math.max(10, position.y - 50)

  return (
    <div
      ref={tooltipRef}
      className="selection-tooltip"
      style={{
        left: `${left}px`,
        top: `${top}px`
      }}
    >
      {ANNOTATION_TYPES.map(({ type, emoji, label }) => (
        <button
          key={type}
          className="tooltip-btn"
          onClick={() => onSelect(type)}
          title={label}
          dangerouslySetInnerHTML={{ __html: emoji }}
        />
      ))}
    </div>
  )
}
