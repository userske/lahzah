-- ─── Fix: Missing RLS policies on circles + niyyahs ──────────────────────────
-- Run this in your Supabase SQL Editor at:
-- https://supabase.com/dashboard/project/cwjtmlfxgucdabqxarnk/sql/new

-- ── Circles ──────────────────────────────────────────────────────────────────

-- Allow any authenticated user to create a circle
-- (they must set created_by = their own uid)
DROP POLICY IF EXISTS "Authenticated users can create circles" ON public.circles;
CREATE POLICY "Authenticated users can create circles"
  ON public.circles FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Allow circle creators to update/delete their own circles
DROP POLICY IF EXISTS "Creators can update their circles" ON public.circles;
CREATE POLICY "Creators can update their circles"
  ON public.circles FOR UPDATE
  USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Creators can delete their circles" ON public.circles;
CREATE POLICY "Creators can delete their circles"
  ON public.circles FOR DELETE
  USING (auth.uid() = created_by);

-- Also allow reading a circle by invite_code (needed for the join flow)
-- A user needs to look up a circle before they are a member of it.
DROP POLICY IF EXISTS "Anyone can look up a circle by invite code" ON public.circles;
CREATE POLICY "Anyone can look up a circle by invite code"
  ON public.circles FOR SELECT
  USING (
    -- They are already a member
    public.is_circle_member(id)
    -- OR they are doing a lookup by invite_code (invite_code is not null)
    OR invite_code IS NOT NULL
  );

-- ── Circle Members ────────────────────────────────────────────────────────────

-- Allow members to leave (delete themselves from a circle)
DROP POLICY IF EXISTS "Members can leave circles" ON public.circle_members;
CREATE POLICY "Members can leave circles"
  ON public.circle_members FOR DELETE
  USING (auth.uid() = user_id);

-- ── Niyyahs ───────────────────────────────────────────────────────────────────

-- Allow circle members to create niyyahs
DROP POLICY IF EXISTS "Circle members can create niyyahs" ON public.niyyahs;
CREATE POLICY "Circle members can create niyyahs"
  ON public.niyyahs FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_circle_member(circle_id)
  );

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
