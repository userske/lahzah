-- ─── Fix: RLS infinite recursion + invite_code migration ─────────────────────
-- Run this in your Supabase SQL Editor at:
-- https://supabase.com/dashboard/project/cwjtmlfxgucdabqxarnk/sql/new

-- Step 1: Drop the recursive policy on circle_members
DROP POLICY IF EXISTS "Members can view members of their circles" ON public.circle_members;

-- Step 2: Create a SECURITY DEFINER helper function that checks membership
-- without triggering the RLS policy on circle_members (bypasses recursion).
CREATE OR REPLACE FUNCTION public.is_circle_member(p_circle_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM circle_members
    WHERE circle_id = p_circle_id
      AND user_id = auth.uid()
  );
$$;

-- Step 3: Re-create the policy using the helper function (no recursion)
CREATE POLICY "Members can view members of their circles"
  ON public.circle_members FOR SELECT
  USING (public.is_circle_member(circle_id));

-- Step 4: Add invite_code column if it doesn't exist
ALTER TABLE public.circles
  ADD COLUMN IF NOT EXISTS invite_code text UNIQUE;

-- Step 5: Generate invite codes for any circles that don't have one yet
UPDATE public.circles
  SET invite_code = upper(substr(md5(random()::text), 1, 6))
  WHERE invite_code IS NULL;

-- Step 6: Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
