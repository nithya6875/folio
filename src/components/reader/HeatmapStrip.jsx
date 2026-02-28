export default function HeatmapStrip({
  totalPages,
  annotationsByPage,
  currentPage,
  onPageClick
}) {
  // Find max annotations for scaling
  const maxCount = Math.max(1, ...Object.values(annotationsByPage))

  const segments = []
  for (let i = 1; i <= totalPages; i++) {
    const count = annotationsByPage[i] || 0
    const intensity = count / maxCount

    let backgroundColor = 'transparent'
    if (count > 0) {
      if (count >= 3) {
        backgroundColor = `rgba(220, 53, 69, ${0.3 + intensity * 0.5})`
      } else {
        backgroundColor = `rgba(184, 134, 11, ${0.2 + intensity * 0.4})`
      }
    }

    const isCurrentPage = i === currentPage

    segments.push(
      <div
        key={i}
        className="heatmap-segment"
        style={{
          backgroundColor,
          boxShadow: isCurrentPage ? 'inset 0 0 0 2px #2D5016' : 'none',
          ...(count >= 3 && {
            animation: 'glow 2s infinite alternate'
          })
        }}
        onClick={() => onPageClick(i)}
        title={`Page ${i}${count > 0 ? ` — ${count} annotation${count > 1 ? 's' : ''}` : ''}`}
      />
    )
  }

  return (
    <div className="heatmap-strip">
      {segments}
    </div>
  )
}
