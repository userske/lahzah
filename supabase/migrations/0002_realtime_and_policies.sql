-- Enable Realtime for the reading_progress table so circle activity
-- updates live across all members of a circle without polling.
alter publication supabase_realtime add table public.reading_progress;

-- RLS policies for circle_members (needed for useCircleActivity hook queries)
create policy "Members can view members of their circles"
  on public.circle_members for select
  using (
    exists (
      select 1 from public.circle_members cm
      where cm.circle_id = public.circle_members.circle_id
        and cm.user_id = auth.uid()
    )
  );

-- Allow authenticated users to insert themselves as circle members
create policy "Users can join circles"
  on public.circle_members for insert
  with check (auth.uid() = user_id);

-- Allow users to create circles
create policy "Authenticated users can create circles"
  on public.circles for insert
  with check (auth.uid() = created_by);

-- Allow users to insert their own profile on sign-up
create policy "Users can insert their own profile"
  on public.users for insert
  with check (auth.uid() = id);
