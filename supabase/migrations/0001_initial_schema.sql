-- Enable UUID extension for primary keys
create extension if not exists "uuid-ossp";

-- 1. USERS TABLE
-- Extends Supabase's built-in auth.users with public profile data.
create table public.users (
  id uuid references auth.users not null primary key,
  display_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.users enable row level security;

-- 2. CIRCLES TABLE
-- Manages the shared groups, replacing individual leaderboards with collective streaks.
create table public.circles (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  collective_streak integer default 0,
  created_by uuid references public.users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.circles enable row level security;

-- 3. CIRCLE MEMBERS (Junction Table)
-- Maps users to their respective circles for aggregate presence.
create table public.circle_members (
  circle_id uuid references public.circles(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (circle_id, user_id)
);
alter table public.circle_members enable row level security;

-- 4. READING PROGRESS
-- Tracks the exact Surah and Ayah for the "Continue Reading" feature. 
-- Using user_id as the primary key ensures only one auto-save record exists per user.
create table public.reading_progress (
  user_id uuid references public.users(id) on delete cascade not null primary key,
  surah_number integer not null,
  ayah_number integer not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.reading_progress enable row level security;

-- 5. NIYYAHS (Shared Intentions)
-- Private dedications visible only within a specific circle.
create table public.niyyahs (
  id uuid default uuid_generate_v4() primary key,
  circle_id uuid references public.circles(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  intention_text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.niyyahs enable row level security;

-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures data privacy strictly adhering to the "no surveillance" philosophy.

-- Users
create policy "Users can read their own profile" on public.users 
  for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.users 
  for update using (auth.uid() = id);

-- Reading Progress
create policy "Users can read their own reading progress" on public.reading_progress 
  for select using (auth.uid() = user_id);
create policy "Users can insert/update their own reading progress" on public.reading_progress 
  for all using (auth.uid() = user_id);

-- Circles & Niyyahs (Visible only to members)
create policy "Users can view circles they belong to" on public.circles 
  for select using (
    exists (select 1 from public.circle_members where circle_id = id and user_id = auth.uid())
  );
create policy "Users can view niyyahs in their circles" on public.niyyahs 
  for select using (
    exists (select 1 from public.circle_members where circle_id = public.niyyahs.circle_id and user_id = auth.uid())
  );
