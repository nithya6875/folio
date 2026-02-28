import { useState, useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { supabase } from '../../lib/supabase'
import { extractCharacters } from '../../lib/claude'

const ROLE_COLORS = {
  protagonist: '#2D5016',
  antagonist: '#8B3A3A',
  supporting: '#B8860B',
  minor: '#8a7a6a'
}

export default function CharacterGraph({ session, currentBook }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const svgRef = useRef(null)

  // Check for cached data
  useEffect(() => {
    const cached = localStorage.getItem(`characters_${currentBook.id}`)
    if (cached) {
      try {
        setData(JSON.parse(cached))
      } catch {
        // Invalid cache
      }
    }
  }, [currentBook.id])

  // Render graph when data changes
  useEffect(() => {
    if (data && svgRef.current) {
      renderGraph()
    }
  }, [data, selectedCharacter])

  const handleExtract = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: annotations } = await supabase
        .from('annotations')
        .select('*')
        .eq('book_id', currentBook.id)
        .eq('is_whisper', false)

      const result = await extractCharacters(
        currentBook.title,
        currentBook.author || 'Unknown',
        annotations || []
      )

      setData(result)
      localStorage.setItem(`characters_${currentBook.id}`, JSON.stringify(result))
    } catch (err) {
      console.error('Failed to extract characters:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const renderGraph = () => {
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    // Create zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svg.call(zoom)

    const g = svg.append('g')

    // Create simulation
    const simulation = d3.forceSimulation(data.characters)
      .force('link', d3.forceLink(data.relationships)
        .id(d => d.id)
        .distance(120))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40))

    // Draw links
    const link = g.append('g')
      .selectAll('line')
      .data(data.relationships)
      .join('line')
      .attr('stroke', d => d.sentiment === 'negative' ? '#8B3A3A' : '#E8DECE')
      .attr('stroke-width', d => d.strength)
      .attr('stroke-dasharray', d => d.sentiment === 'negative' ? '5,5' : 'none')

    // Draw link labels
    const linkLabel = g.append('g')
      .selectAll('text')
      .data(data.relationships)
      .join('text')
      .attr('class', 'link-label')
      .attr('text-anchor', 'middle')
      .text(d => d.label)

    // Draw nodes
    const node = g.append('g')
      .selectAll('g')
      .data(data.characters)
      .join('g')
      .attr('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        }))
      .on('click', (event, d) => {
        event.stopPropagation()
        setSelectedCharacter(selectedCharacter?.id === d.id ? null : d)
      })

    // Node circles
    node.append('circle')
      .attr('r', d => data.clubFocus?.includes(d.id) ? 25 : 18)
      .attr('fill', d => ROLE_COLORS[d.role] || ROLE_COLORS.minor)
      .attr('stroke', d => data.clubFocus?.includes(d.id) ? '#2D5016' : 'none')
      .attr('stroke-width', 3)

    // Glow effect for focused characters
    node.filter(d => data.clubFocus?.includes(d.id))
      .append('circle')
      .attr('r', 30)
      .attr('fill', 'none')
      .attr('stroke', '#2D5016')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.3)
      .style('filter', 'blur(4px)')

    // Node labels
    node.append('text')
      .attr('class', 'node-label')
      .attr('dy', 35)
      .attr('text-anchor', 'middle')
      .text(d => d.name.split(' ')[0])

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)

      linkLabel
        .attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => (d.source.y + d.target.y) / 2)

      node.attr('transform', d => `translate(${d.x},${d.y})`)
    })
  }

  if (!data) {
    return (
      <div className="graph-container">
        <div className="graph-header">
          <h2 className="section-title">Character Relationships</h2>
          <p className="text-muted mt-2">
            Visualize character relationships and see which ones your club is discussing most.
          </p>
        </div>

        <button
          className="fb mt-4"
          onClick={handleExtract}
          disabled={loading}
        >
          {loading ? 'Extracting...' : 'Extract Characters'}
        </button>

        {error && (
          <p className="text-red mt-3" style={{ fontSize: '14px' }}>
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="graph-container">
      <div className="graph-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 className="section-title">Character Relationships</h2>
          <p className="text-muted mt-1" style={{ fontSize: '14px' }}>
            Drag nodes to rearrange. Click a character to see details.
          </p>
        </div>
        <button className="fo" onClick={handleExtract} disabled={loading}>
          {loading ? 'Extracting...' : 'Re-extract'}
        </button>
      </div>

      <svg ref={svgRef} className="graph-svg" />

      <div className="graph-legend">
        {Object.entries(ROLE_COLORS).map(([role, color]) => (
          <div key={role} className="legend-item">
            <div className="legend-dot" style={{ backgroundColor: color }} />
            <span style={{ textTransform: 'capitalize' }}>{role}</span>
          </div>
        ))}
      </div>

      {selectedCharacter && (
        <div
          className="card"
          style={{
            position: 'absolute',
            top: '80px',
            right: '32px',
            width: '280px',
            zIndex: 10
          }}
        >
          <h4 style={{ marginBottom: '8px' }}>{selectedCharacter.name}</h4>
          <p
            className="text-muted"
            style={{
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px'
            }}
          >
            {selectedCharacter.role}
          </p>
          <p style={{ fontSize: '14px' }}>{selectedCharacter.description}</p>
          <button
            className="fo mt-3"
            style={{ width: '100%', fontSize: '13px' }}
            onClick={() => setSelectedCharacter(null)}
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}
