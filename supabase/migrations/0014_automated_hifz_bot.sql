-- 1. Track the last automated challenge date for a circle
ALTER TABLE public.circles ADD COLUMN IF NOT EXISTS last_automated_challenge_date date;

-- 2. Make created_by nullable in group_hifz_challenges so the Bot can create challenges
ALTER TABLE public.group_hifz_challenges ALTER COLUMN created_by DROP NOT NULL;
