-- 0009_reading_history.sql
-- Detailed reading history that tracks exact Ayahs read per Surah on any given day.

create table public.reading_history (
  user_id uuid references public.users(id) on delete cascade not null,
  read_date date not null, -- Stores the local date the user read (YYYY-MM-DD)
  surah_number integer not null,
  ayahs_count integer default 1, -- Incremented each time they read a new ayah in this surah today
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, read_date, surah_number)
);

alter table public.reading_history enable row level security;

-- Users can only see and insert/update their own reading history
create policy "Users can view their own reading history"
  on public.reading_history for select
  using (auth.uid() = user_id);

create policy "Users can insert their own reading history"
  on public.reading_history for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own reading history"
  on public.reading_history for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
