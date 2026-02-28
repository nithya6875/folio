# Folio

A collaborative book club web app. Read PDFs together, annotate, discuss in real-time, and get AI-powered insights.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file and fill in your credentials
cp .env.example .env

# Start development server
npm run dev
```

## Environment Variables

Create a `.env` file with:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ANTHROPIC_API_KEY=your-anthropic-api-key
```

## Supabase Setup

1. Create a new Supabase project
2. Run `schema.sql` in the SQL Editor
3. Create a storage bucket named `pdfs` (private)
4. Enable Realtime on `annotations`, `messages`, and `members` tables

## Features

- **PDF Reader**: Upload and read PDFs together with text selection
- **Annotations**: Highlight, quote, question, note, and whisper (private)
- **Reading Presence**: See who's reading nearby pages in real-time
- **Heatmap**: Visualize annotation density across pages
- **Forum**: Real-time chat with channels, replies, and reactions
- **Library**: Nominate and vote on next books, view reading history
- **AI Insights**:
  - Discussion Guide: AI-generated conversation starters and themes
  - Character Graph: D3.js visualization of character relationships
  - Pace Coach: Track reading progress and get AI nudges
  - Book Capsule: Commemorative end-of-book summary

## Tech Stack

- React 18 + Vite
- Supabase (PostgreSQL + Realtime + Storage)
- Anthropic Claude API
- PDF.js for rendering
- D3.js for character graph

## Deploy

```bash
npm run build
vercel --prod
```
