// Gemini API helper (free tier)

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

export async function claudeCall(systemPrompt, userPrompt, options = {}) {
  if (!GEMINI_API_KEY) {
    console.warn('Missing VITE_GEMINI_API_KEY. AI features will not work.')
    throw new Error('API key not configured')
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${systemPrompt}\n\n${userPrompt}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        }
      })
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Gemini API error')
  }

  const data = await response.json()
  return data.candidates[0].content.parts[0].text
}

// Parse JSON from AI response (handles markdown code blocks)
export function parseClaudeJson(text) {
  // Try to extract JSON from markdown code block
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim()
  return JSON.parse(jsonStr)
}

// Generate discussion guide
export async function generateDiscussionGuide(bookTitle, bookAuthor, annotations, messages, memberNames) {
  const systemPrompt = `You are a warm, literary book club facilitator. Generate discussion content that references specific member contributions and creates engaging conversation. Always respond with valid JSON only, no other text.`

  const userPrompt = `Generate a discussion guide for a book club reading "${bookTitle}" by ${bookAuthor}.

Club members: ${memberNames.join(', ')}

Member annotations:
${annotations.slice(0, 15).map(a => `- ${a.member_name} (p${a.page_number}, ${a.type}): "${a.selected_text}" ${a.note ? `Note: ${a.note}` : ''}`).join('\n')}

Forum discussions:
${messages.slice(0, 15).map(m => `- ${m.author}: ${m.content}`).join('\n')}

Return JSON with this exact structure:
{
  "opening": "1-2 sentence warm conversation starter referencing something specific a member said",
  "themes": [
    { "title": "Theme name", "description": "Brief description", "questions": ["Question 1", "Question 2", "Question 3"] }
  ],
  "debates": [
    {
      "statement": "A debatable claim derived from member disagreements",
      "proArgument": "Argument in favor",
      "conArgument": "Argument against",
      "membersOnEachSide": { "pro": ["Member names"], "con": ["Member names"] }
    }
  ],
  "memberSpotlights": [
    { "member": "Name", "standoutMoment": "Their notable contribution", "followUp": "A question for them" }
  ],
  "suggestedAgenda": [
    { "item": "Discussion topic", "minutes": 10 }
  ],
  "closingReflection": "Thoughtful closing thought"
}`

  const response = await claudeCall(systemPrompt, userPrompt)
  return parseClaudeJson(response)
}

// Extract character relationships
export async function extractCharacters(bookTitle, bookAuthor, annotations) {
  const systemPrompt = `You are a literary analyst. Extract character information and relationships from the book and club discussions. Always respond with valid JSON only, no other text.`

  const userPrompt = `Analyze the characters in "${bookTitle}" by ${bookAuthor}.

Club annotations mentioning characters:
${annotations.slice(0, 15).map(a => `- Page ${a.page_number}: "${a.selected_text}" (${a.note || 'no note'})`).join('\n')}

Return JSON with this exact structure:
{
  "characters": [
    { "id": "lowercase-id", "name": "Full Name", "role": "protagonist|antagonist|supporting|minor", "description": "Brief description" }
  ],
  "relationships": [
    { "source": "character-id", "target": "character-id", "label": "relationship type (loves, rivals, etc)", "strength": 1, "sentiment": "positive|negative|complex" }
  ],
  "clubFocus": ["character-ids the club is discussing most"]
}`

  const response = await claudeCall(systemPrompt, userPrompt)
  return parseClaudeJson(response)
}

// Generate pace coach nudges
export async function generatePaceNudges(members, totalPages, meetingDate, bookTitle) {
  const systemPrompt = `You are a friendly, witty reading coach. Generate short, encouraging nudge messages for book club members. Keep them warm and funny, not preachy. Always respond with valid JSON only, no other text.`

  const memberData = members.map(m => ({
    name: m.name,
    currentPage: m.current_page,
    percentComplete: Math.round((m.current_page / totalPages) * 100)
  }))

  const userPrompt = `Generate personalized pace nudges for these book club members reading "${bookTitle}".
Total pages: ${totalPages}
Meeting date: ${meetingDate}

Members:
${memberData.map(m => `- ${m.name}: page ${m.currentPage} (${m.percentComplete}% complete)`).join('\n')}

Return JSON array with nudge for each member:
[
  { "name": "Member name", "nudge": "One sentence encouraging/funny nudge" }
]`

  const response = await claudeCall(systemPrompt, userPrompt)
  return parseClaudeJson(response)
}

// Generate end-of-book capsule
export async function generateBookCapsule(bookTitle, bookAuthor, annotations, messages, members) {
  const systemPrompt = `You are a book club historian creating a commemorative capsule of a completed book. Be warm, celebratory, and specific about member contributions. Always respond with valid JSON only, no other text.`

  const userPrompt = `Create an end-of-book capsule for "${bookTitle}" by ${bookAuthor}.

Members: ${members.map(m => m.name).join(', ')}

Annotations (${annotations.length} total):
${annotations.slice(0, 15).map(a => `- ${a.member_name} (p${a.page_number}): "${a.selected_text.slice(0, 100)}..." ${a.note || ''}`).join('\n')}

Forum messages (${messages.length} total):
${messages.slice(0, 15).map(m => `- ${m.author}: ${m.content.slice(0, 100)}...`).join('\n')}

Return JSON:
{
  "headline": "The Book Club finishes ${bookTitle}",
  "summary": "2-3 sentences about the club's collective experience",
  "memberMoments": [
    { "member": "Name", "quote": "their most memorable annotation or comment", "badge": "Creative badge title" }
  ],
  "stats": {
    "totalAnnotations": ${annotations.length},
    "totalMessages": ${messages.length},
    "mostAnnotatedPage": 1,
    "mostDebatedTopic": "topic"
  },
  "verdict": "The club's consensus on the book in one sentence",
  "nextChapterTeaser": "A warm sentence about continuing the reading journey"
}`

  const response = await claudeCall(systemPrompt, userPrompt)
  return parseClaudeJson(response)
}
