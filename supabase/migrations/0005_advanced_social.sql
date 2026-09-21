-- ─── Advanced Social Features (Phase 5) ──────────────────────────────────────

-- 1. Circle Locations (Geospatial data for Circle Finder)
-- Requires PostGIS extension. We'll ensure it exists.
create extension if not exists postgis;

create table public.circle_locations (
  circle_id uuid references public.circles(id) on delete cascade primary key,
  location geography(point) not null,
  is_public boolean default true,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.circle_locations enable row level security;

create policy "Anyone can view public circle locations"
  on public.circle_locations for select
  using (is_public = true);

create policy "Circle admins can manage location"
  on public.circle_locations for all
  using (
    exists (
      select 1 from public.circles
      where id = public.circle_locations.circle_id
      and created_by = auth.uid()
    )
  );

-- 2. Circle Messages (Text Chat)
create table public.circle_messages (
  id uuid default uuid_generate_v4() primary key,
  circle_id uuid references public.circles(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.circle_messages enable row level security;

create policy "Circle members can view messages"
  on public.circle_messages for select
  using (
    exists (
      select 1 from public.circle_members
      where circle_id = public.circle_messages.circle_id
      and user_id = auth.uid()
    )
  );

create policy "Circle members can insert messages"
  on public.circle_messages for insert
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.circle_members
      where circle_id = public.circle_messages.circle_id
      and user_id = auth.uid()
    )
  );

-- 3. Live Reading Sessions (Shared Cursors/Highlights)
-- Instead of just a bookmark, this tracks active reading sessions for real-time sync.
create table public.live_reading_sessions (
  circle_id uuid references public.circles(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  current_surah integer not null,
  current_ayah integer not null,
  is_active boolean default true,
  last_ping_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (circle_id, user_id)
);

alter table public.live_reading_sessions enable row level security;

create policy "Circle members can view live sessions"
  on public.live_reading_sessions for select
  using (
    exists (
      select 1 from public.circle_members
      where circle_id = public.live_reading_sessions.circle_id
      and user_id = auth.uid()
    )
  );

create policy "Users can update their own session"
  on public.live_reading_sessions for all
  using (auth.uid() = user_id);

-- Enable realtime for these tables
alter publication supabase_realtime add table public.circle_messages;
alter publication supabase_realtime add table public.live_reading_sessions;
