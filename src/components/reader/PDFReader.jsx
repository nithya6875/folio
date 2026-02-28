import { useState, useEffect, useCallback } from 'react'
import { supabase, uploadPdf, getSignedPdfUrl } from '../../lib/supabase'
import { usePresence } from '../../hooks/usePresence'
import { useAnnotationsRealtime } from '../../hooks/useRealtime'
import Toolbar from './Toolbar'
import PDFCanvas from './PDFCanvas'
import AnnotationPanel from './AnnotationPanel'
import SelectionTooltip from './SelectionTooltip'
import AnnotationForm from './AnnotationForm'
import PresenceRail from './PresenceRail'
import HeatmapStrip from './HeatmapStrip'

export default function PDFReader({ session, currentBook, setCurrentBook, members }) {
  const [pdfDoc, setPdfDoc] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [zoom, setZoom] = useState(1.0)
  const [annotations, setAnnotations] = useState([])
  const [panelOpen, setPanelOpen] = useState(true)
  const [heatmapOn, setHeatmapOn] = useState(false)
  const [selection, setSelection] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState(null)
  const [annotationForm, setAnnotationForm] = useState(null)
  const [uploading, setUploading] = useState(false)

  // Presence
  const { nearbyMembers, allMembers } = usePresence(
    session.clubId,
    session.memberId,
    currentPage
  )

  // Load PDF when book changes
  useEffect(() => {
    if (!currentBook?.pdf_path) return

    loadPdf()
  }, [currentBook?.pdf_path])

  // Load annotations
  useEffect(() => {
    if (!currentBook) return
    fetchAnnotations()
  }, [currentBook?.id])

  // Realtime annotations
  useAnnotationsRealtime(session.clubId, (newAnnotation) => {
    if (newAnnotation.book_id === currentBook?.id) {
      setAnnotations(prev => [...prev, newAnnotation])
    }
  })

  // Save current page to localStorage whenever it changes (only after PDF is loaded)
  useEffect(() => {
    if (currentBook?.id && currentPage > 0 && pdfDoc) {
      localStorage.setItem(`folio_page_${currentBook.id}`, currentPage.toString())
    }
  }, [currentBook?.id, currentPage, pdfDoc])

  const loadPdf = async () => {
    try {
      const signedUrl = await getSignedPdfUrl(currentBook.pdf_path)
      const loadingTask = pdfjsLib.getDocument(signedUrl)
      const pdf = await loadingTask.promise
      setPdfDoc(pdf)
      setTotalPages(pdf.numPages)

      // Restore saved page from localStorage
      const savedPage = localStorage.getItem(`folio_page_${currentBook.id}`)
      if (savedPage) {
        const page = parseInt(savedPage, 10)
        if (page >= 1 && page <= pdf.numPages) {
          setCurrentPage(page)
        } else {
          setCurrentPage(1)
        }
      } else {
        setCurrentPage(1)
      }
    } catch (err) {
      console.error('Failed to load PDF:', err)
    }
  }

  const fetchAnnotations = async () => {
    const { data } = await supabase
      .from('annotations')
      .select('*')
      .eq('book_id', currentBook.id)
      .order('created_at', { ascending: false })

    if (data) {
      setAnnotations(data)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // Create book record
      const { data: book, error: bookError } = await supabase
        .from('books')
        .insert({
          club_id: session.clubId,
          title: file.name.replace('.pdf', ''),
          is_active: true
        })
        .select()
        .single()

      if (bookError) throw bookError

      // Upload PDF
      const path = await uploadPdf(session.clubId, book.id, file)

      // Get total pages
      const loadingTask = pdfjsLib.getDocument(URL.createObjectURL(file))
      const pdf = await loadingTask.promise

      // Update book with path and pages
      await supabase
        .from('books')
        .update({
          pdf_path: path,
          total_pages: pdf.numPages
        })
        .eq('id', book.id)

      setCurrentBook({
        ...book,
        pdf_path: path,
        total_pages: pdf.numPages
      })
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Failed to upload PDF: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleTextSelection = useCallback((text, rect) => {
    if (text.length < 2) {
      setSelection(null)
      setTooltipPosition(null)
      return
    }

    setSelection(text)
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    })
  }, [])

  const handleAnnotationType = (type) => {
    setAnnotationForm({
      type,
      selectedText: selection,
      page: currentPage
    })
    setTooltipPosition(null)
    setSelection(null)
  }

  const handleSaveAnnotation = async (data) => {
    const annotation = {
      book_id: currentBook.id,
      club_id: session.clubId,
      member_name: session.memberName,
      page_number: data.page,
      selected_text: data.selectedText,
      note: data.note || null,
      type: data.type,
      is_whisper: data.type === 'whisper'
    }

    const { error } = await supabase
      .from('annotations')
      .insert(annotation)

    if (error) {
      console.error('Failed to save annotation:', error)
      alert('Failed to save annotation')
    }

    setAnnotationForm(null)
  }

  const goToPage = (page) => {
    const p = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(p)
  }

  // Calculate heatmap data
  const annotationsByPage = annotations.reduce((acc, ann) => {
    if (!ann.is_whisper) {
      acc[ann.page_number] = (acc[ann.page_number] || 0) + 1
    }
    return acc
  }, {})

  // Filter annotations for current page
  const currentPageAnnotations = annotations.filter(a =>
    a.page_number === currentPage &&
    (!a.is_whisper || a.member_name === session.memberName)
  )

  const otherAnnotations = annotations.filter(a =>
    a.page_number !== currentPage &&
    (!a.is_whisper || a.member_name === session.memberName)
  )

  if (!currentBook) {
    return (
      <div className="reader-container">
        <div className="empty-state" style={{ flex: 1 }}>
          <div className="empty-icon">&#128367;</div>
          <h2 className="empty-title">
            {session.isAdmin ? 'Upload a book to get started' : 'No book yet'}
          </h2>
          <p className="empty-text">
            {session.isAdmin
              ? 'Upload a PDF to begin reading together with your club.'
              : 'Your admin hasn\'t uploaded a book yet. Check back soon!'}
          </p>
          {session.isAdmin && (
            <label className="fb mt-4" style={{ cursor: 'pointer' }}>
              {uploading ? 'Uploading...' : 'Upload PDF'}
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                disabled={uploading}
              />
            </label>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="reader-container">
      <div className="reader-main">
        <Toolbar
          currentPage={currentPage}
          totalPages={totalPages}
          zoom={zoom}
          bookTitle={currentBook.title}
          heatmapOn={heatmapOn}
          panelOpen={panelOpen}
          isAdmin={session.isAdmin}
          onPageChange={goToPage}
          onZoomChange={setZoom}
          onHeatmapToggle={() => setHeatmapOn(!heatmapOn)}
          onPanelToggle={() => setPanelOpen(!panelOpen)}
          onReplacePdf={handleFileUpload}
        />

        <div className="reader-viewport">
          <PresenceRail
            nearbyMembers={nearbyMembers}
            currentPage={currentPage}
          />

          {pdfDoc && (
            <PDFCanvas
              pdfDoc={pdfDoc}
              pageNumber={currentPage}
              zoom={zoom}
              heatmapOn={heatmapOn}
              annotationCount={annotationsByPage[currentPage] || 0}
              onTextSelection={handleTextSelection}
            />
          )}

          {totalPages > 0 && (
            <>
              <HeatmapStrip
                totalPages={totalPages}
                annotationsByPage={annotationsByPage}
                currentPage={currentPage}
                onPageClick={goToPage}
              />

              {/* Mini progress bar */}
              <div className="mini-progress">
                {allMembers.map(member => (
                  <div
                    key={member.id}
                    className="progress-dot"
                    style={{
                      left: `${((member.current_page || 1) / totalPages) * 100}%`,
                      backgroundColor: getAvatarColor(member.name)
                    }}
                    title={`${member.name} - Page ${member.current_page}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <AnnotationPanel
        open={panelOpen}
        currentPageAnnotations={currentPageAnnotations}
        otherAnnotations={otherAnnotations}
        myName={session.memberName}
        onAddNote={() => setAnnotationForm({
          type: 'note',
          selectedText: '',
          page: currentPage
        })}
        onGoToPage={goToPage}
      />

      {tooltipPosition && (
        <SelectionTooltip
          position={tooltipPosition}
          onSelect={handleAnnotationType}
          onClose={() => {
            setTooltipPosition(null)
            setSelection(null)
          }}
        />
      )}

      {annotationForm && (
        <AnnotationForm
          initialType={annotationForm.type}
          selectedText={annotationForm.selectedText}
          page={annotationForm.page}
          onSave={handleSaveAnnotation}
          onClose={() => setAnnotationForm(null)}
        />
      )}
    </div>
  )
}

// Helper for avatar color
function getAvatarColor(name) {
  const colors = [
    '#2D5016', '#B8860B', '#8B3A3A', '#1E4D6B', '#6B4E1E',
    '#4A1E6B', '#1E6B5A', '#6B1E4A', '#3A6B1E', '#6B3A1E'
  ]

  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}
