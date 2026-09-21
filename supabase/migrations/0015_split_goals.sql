-- Add specific columns for Hifz Goals
ALTER TABLE public.circles 
  ADD COLUMN IF NOT EXISTS hifz_goal_start_surah integer,
  ADD COLUMN IF NOT EXISTS hifz_goal_start_ayah integer,
  ADD COLUMN IF NOT EXISTS hifz_goal_end_surah integer,
  ADD COLUMN IF NOT EXISTS hifz_goal_end_ayah integer,
  ADD COLUMN IF NOT EXISTS hifz_goal_total_ayahs integer;

-- The existing goal_start_surah, etc. will be considered the "Reading Goals" going forward.
