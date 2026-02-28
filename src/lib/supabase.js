import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// Helper to get signed URL for PDF
export async function getSignedPdfUrl(path) {
  const { data, error } = await supabase.storage
    .from('pdfs')
    .createSignedUrl(path, 3600) // 1 hour expiry

  if (error) throw error
  return data.signedUrl
}

// Helper to upload PDF
export async function uploadPdf(clubId, bookId, file) {
  const path = `${clubId}/${bookId}.pdf`
  const { error } = await supabase.storage
    .from('pdfs')
    .upload(path, file, { upsert: true })

  if (error) throw error
  return path
}
