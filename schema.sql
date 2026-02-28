-- Folio Database Schema
-- Run this in Supabase SQL Editor

-- Clubs
create table if not exists clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  password_hash text not null,
  created_at timestamptz default now()
);

-- Members (session-based, no auth required)
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references clubs(id) on delete cascade,
  name text not null,
  is_admin boolean default false,
  last_seen timestamptz default now(),
  current_page int default 1,
  created_at timestamptz default now()
);

-- Books (one active book per club at a time)
create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references clubs(id) on delete cascade,
  title text not null,
  author text,
  pdf_path text,
  total_pages int,
  is_active boolean default true,
  meeting_date timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- Annotations on PDF pages
create table if not exists annotations (
  id uuid primary key default gen_random_uuid(),
  book_id uuid references books(id) on delete cascade,
  club_id uuid references clubs(id) on delete cascade,
  member_name text not null,
  page_number int not null,
  selected_text text not null,
  note text,
  type text not null check (type in ('highlight','quote','question','note','whisper')),
  is_whisper boolean default false,
  created_at timestamptz default now()
);

-- Forum channels
create table if not exists channels (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references clubs(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz default now()
);

-- Forum messages
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid references channels(id) on delete cascade,
  club_id uuid references clubs(id) on delete cascade,
  author text not null,
  content text not null,
  reply_to_id uuid references messages(id),
  reactions jsonb default '{}',
  created_at timestamptz default now()
);

-- Book nominations (for next-book voting)
create table if not exists nominations (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references clubs(id) on delete cascade,
  title text not null,
  author text not null,
  reason text,
  nominated_by text not null,
  votes text[] default '{}',
  created_at timestamptz default now()
);

-- Past books (reading history)
create table if not exists book_history (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references clubs(id) on delete cascade,
  title text not null,
  author text,
  completed_at timestamptz default now(),
  capsule jsonb
);

-- Create indexes for better performance
create index if not exists idx_members_club on members(club_id);
create index if not exists idx_books_club on books(club_id);
create index if not exists idx_annotations_book on annotations(book_id);
create index if not exists idx_annotations_club on annotations(club_id);
create index if not exists idx_channels_club on channels(club_id);
create index if not exists idx_messages_channel on messages(channel_id);
create index if not exists idx_messages_club on messages(club_id);
create index if not exists idx_nominations_club on nominations(club_id);
create index if not exists idx_book_history_club on book_history(club_id);

-- Enable Row Level Security (optional, for production)
-- alter table clubs enable row level security;
-- alter table members enable row level security;
-- alter table books enable row level security;
-- alter table annotations enable row level security;
-- alter table channels enable row level security;
-- alter table messages enable row level security;
-- alter table nominations enable row level security;
-- alter table book_history enable row level security;

-- Enable realtime on key tables
-- Run these in Supabase Dashboard > Database > Replication
-- or use:
alter publication supabase_realtime add table annotations;
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table members;

-- Storage bucket setup (run in Supabase Dashboard > Storage)
-- 1. Create bucket named "pdfs" - set to private
-- 2. Add policy for authenticated reads via signed URLs
