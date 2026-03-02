// Seed script for demo engagement data
// Run this from browser console: import('/src/lib/seedData.js').then(m => m.seedEngagement())

import { supabase } from './supabase'

const DEMO_ANNOTATIONS = [
  // Highlights
  { type: 'highlight', text: 'I write to you from the edge of what was once our home', note: 'Powerful opening line. Sets the tone of displacement.', page: 1 },
  { type: 'highlight', text: 'The children sleep now, unaware of the storms that brought us here', note: null, page: 3 },
  { type: 'highlight', text: 'Love is not a single flame but a thousand small fires', note: 'Beautiful metaphor', page: 12 },
  { type: 'highlight', text: 'I have learned that exile is not a place but a state of being', note: 'This hit hard', page: 24 },
  { type: 'highlight', text: 'You taught me that betrayal wears familiar faces', note: null, page: 38 },

  // Quotes
  { type: 'quote', text: 'What is a mother if not the keeper of impossible choices?', note: 'This line defines Medea\'s entire arc', page: 15 },
  { type: 'quote', text: 'They call me witch, as if naming my power could contain it', note: 'Reclaiming the narrative', page: 22 },
  { type: 'quote', text: 'I gave you my country. You gave me your convenience.', note: 'Jason\'s betrayal summarized perfectly', page: 45 },
  { type: 'quote', text: 'The gods do not abandon us. We abandon ourselves to them.', note: null, page: 67 },

  // Questions
  { type: 'question', text: 'Is revenge ever justified when children are involved?', note: 'I keep going back and forth on this. What do others think?', page: 52 },
  { type: 'question', text: 'Did Medea have any other choice?', note: 'The patriarchal society left her no options', page: 78 },
  { type: 'question', text: 'How much of her magic is literal vs metaphorical?', note: 'I\'m reading it as her intelligence and agency being labeled as witchcraft', page: 30 },

  // Notes
  { type: 'note', text: 'The letter format creates such intimacy', note: 'We\'re eavesdropping on her most private thoughts. It makes her humanity impossible to ignore.', page: 5 },
  { type: 'note', text: 'Jason remains silent throughout', note: 'His absence speaks volumes. He never responds to her letters.', page: 40 },
  { type: 'note', text: 'The imagery of fire recurs constantly', note: 'Fire = passion, destruction, transformation. Medea embodies all three.', page: 55 },
]

const DEMO_MESSAGES = [
  // General channel
  { channel: 'general', content: 'Just started Letters from Medea and wow, the prose is stunning!' },
  { channel: 'general', content: 'I\'m about 30 pages in. Anyone else finding it hard to put down?' },
  { channel: 'general', content: 'The epistolary format is such a clever choice. We only get Medea\'s perspective.' },
  { channel: 'general', content: 'Finally caught up! Ready for our discussion.' },
  { channel: 'general', content: 'This is my first time reading anything about Medea. Should I read the original Euripides first?' },
  { channel: 'general', content: 'I don\'t think you need to, but it adds layers if you do!' },

  // Hot takes channel
  { channel: 'hot-takes', content: 'Hot take: Jason is worse than any villain in modern literature' },
  { channel: 'hot-takes', content: 'Medea did nothing wrong. I said what I said.' },
  { channel: 'hot-takes', content: 'Unpopular opinion: The ending felt rushed' },
  { channel: 'hot-takes', content: 'This book made me angrier than any book I\'ve read this year' },
  { channel: 'hot-takes', content: 'The real monster is the society that created her situation' },

  // Chapter notes channel
  { channel: 'chapter-notes', content: 'Letters 1-5: The setup is devastating. She\'s writing to someone who will never read these.' },
  { channel: 'chapter-notes', content: 'Letters 6-12: The flashbacks to Colchis are beautiful. She gave up everything.' },
  { channel: 'chapter-notes', content: 'The letter to her children broke me completely.' },
  { channel: 'chapter-notes', content: 'Did anyone else notice the shift in tone around letter 15? She stops pleading.' },
]

export async function seedEngagement() {
  console.log('🌱 Starting engagement seed...')

  try {
    // Get current club and book info
    const { data: sessionData } = await supabase.auth.getSession()

    // Get the club from localStorage (how Folio stores session)
    const folioSession = localStorage.getItem('folio_session')
    if (!folioSession) {
      console.error('❌ No Folio session found. Please log in first.')
      return
    }

    const session = JSON.parse(folioSession)
    const clubId = session.clubId

    console.log('📚 Club ID:', clubId)

    // Get current active book
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('*')
      .eq('club_id', clubId)
      .eq('is_active', true)
      .single()

    if (bookError || !book) {
      console.error('❌ No active book found:', bookError)
      return
    }

    console.log('📖 Book:', book.title)

    // Get members
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('*')
      .eq('club_id', clubId)

    if (membersError || !members || members.length === 0) {
      console.error('❌ No members found:', membersError)
      return
    }

    console.log('👥 Members:', members.map(m => m.name).join(', '))

    // Get or create channels
    const { data: existingChannels } = await supabase
      .from('channels')
      .select('*')
      .eq('club_id', clubId)

    let channels = existingChannels || []

    const channelNames = ['general', 'hot-takes', 'chapter-notes']
    for (const name of channelNames) {
      if (!channels.find(c => c.name === name)) {
        const { data: newChannel } = await supabase
          .from('channels')
          .insert({ club_id: clubId, name, description: `${name} discussions` })
          .select()
          .single()
        if (newChannel) channels.push(newChannel)
      }
    }

    console.log('💬 Channels ready:', channels.map(c => c.name).join(', '))

    // Seed annotations
    console.log('📝 Adding annotations...')
    const annotations = DEMO_ANNOTATIONS.map((ann, idx) => ({
      book_id: book.id,
      club_id: clubId,
      member_name: members[idx % members.length].name,
      page_number: ann.page,
      selected_text: ann.text,
      note: ann.note,
      type: ann.type,
      is_whisper: false,
      created_at: new Date(Date.now() - (DEMO_ANNOTATIONS.length - idx) * 3600000).toISOString()
    }))

    const { error: annError } = await supabase
      .from('annotations')
      .insert(annotations)

    if (annError) {
      console.error('❌ Error adding annotations:', annError)
    } else {
      console.log(`✅ Added ${annotations.length} annotations`)
    }

    // Seed messages
    console.log('💬 Adding forum messages...')
    const messages = []

    for (let i = 0; i < DEMO_MESSAGES.length; i++) {
      const msg = DEMO_MESSAGES[i]
      const channel = channels.find(c => c.name === msg.channel)
      if (!channel) continue

      messages.push({
        channel_id: channel.id,
        club_id: clubId,
        author: members[i % members.length].name,
        content: msg.content,
        created_at: new Date(Date.now() - (DEMO_MESSAGES.length - i) * 1800000).toISOString()
      })
    }

    const { error: msgError } = await supabase
      .from('messages')
      .insert(messages)

    if (msgError) {
      console.error('❌ Error adding messages:', msgError)
    } else {
      console.log(`✅ Added ${messages.length} messages`)
    }

    // Update member reading progress
    console.log('📊 Updating reading progress...')
    const totalPages = book.total_pages || 100

    for (let i = 0; i < members.length; i++) {
      const progress = Math.floor(Math.random() * 60) + 20 // 20-80% progress
      const currentPage = Math.floor((progress / 100) * totalPages)

      await supabase
        .from('members')
        .update({ current_page: currentPage })
        .eq('id', members[i].id)
    }

    console.log('✅ Updated member progress')

    console.log('🎉 Engagement seed complete! Refresh the page to see the data.')

  } catch (err) {
    console.error('❌ Seed failed:', err)
  }
}

// Make it available globally for easy console access
if (typeof window !== 'undefined') {
  window.seedEngagement = seedEngagement
}
