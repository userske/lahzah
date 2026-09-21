-- ─── Study Buddies / Accountability Pairs ───────────────────────────────────

create table public.study_pairs (
  id uuid default uuid_generate_v4() primary key,
  requester_id uuid references public.users(id) on delete cascade not null,
  partner_id uuid references public.users(id) on delete cascade not null,
  circle_id uuid references public.circles(id) on delete cascade,
  status text not null default 'pending', -- 'pending' | 'accepted' | 'declined'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint no_self_pair check (requester_id != partner_id),
  unique(requester_id, partner_id)
);
alter table public.study_pairs enable row level security;

create policy "Users can view their own pairs"
  on public.study_pairs for select
  using (auth.uid() = requester_id or auth.uid() = partner_id);

create policy "Users can create pairs"
  on public.study_pairs for insert
  with check (auth.uid() = requester_id);

create policy "Partners can accept/decline"
  on public.study_pairs for update
  using (auth.uid() = partner_id);

-- ─── Memorization Heritage ──────────────────────────────────────────────────

-- Tracks who taught whom (memorization lineage / isnad)
create table public.memorization_heritage (
  id uuid default uuid_generate_v4() primary key,
  circle_id uuid references public.circles(id) on delete cascade not null,
  teacher_id uuid references public.users(id) on delete cascade not null,
  student_id uuid references public.users(id) on delete cascade not null,
  surah_range text not null default 'Full Quran', -- e.g. "Al-Fatiha - Al-Baqarah"
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint no_self_teach check (teacher_id != student_id)
);
alter table public.memorization_heritage enable row level security;

create policy "Circle members can view heritage"
  on public.memorization_heritage for select
  using (
    exists (
      select 1 from public.circle_members
      where circle_id = public.memorization_heritage.circle_id
      and user_id = auth.uid()
    )
  );

create policy "Users can record their own heritage"
  on public.memorization_heritage for insert
  with check (auth.uid() = student_id);

-- ─── Khatm Portions (Circle Quran division) ─────────────────────────────────

create table public.khatm_portions (
  id uuid default uuid_generate_v4() primary key,
  circle_id uuid references public.circles(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  juz_number integer not null check (juz_number between 1 and 30),
  completed boolean not null default false,
  claimed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone,
  unique(circle_id, juz_number)
);
alter table public.khatm_portions enable row level security;

create policy "Circle members can view khatm portions"
  on public.khatm_portions for select
  using (
    exists (
      select 1 from public.circle_members
      where circle_id = public.khatm_portions.circle_id
      and user_id = auth.uid()
    )
  );

create policy "Users can claim and update their own portions"
  on public.khatm_portions for all
  using (auth.uid() = user_id);
