-- 1. HIFZ PROGRESS TABLE
-- Tracks the spaced repetition status of individual verses
create table public.hifz_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  verse_key text not null, -- Format: 'surah:ayah'
  status text not null default 'learning', -- 'learning', 'reviewing', 'mastered'
  ease_factor real not null default 2.5,
  interval integer not null default 0,
  next_review_at timestamp with time zone not null default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, verse_key)
);
alter table public.hifz_progress enable row level security;

-- 2. POLICIES
create policy "Users can view their own hifz progress"
  on public.hifz_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert their own hifz progress"
  on public.hifz_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own hifz progress"
  on public.hifz_progress for update
  using (auth.uid() = user_id);
