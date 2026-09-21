-- Add invite_code to circles table
ALTER TABLE public.circles 
ADD COLUMN IF NOT EXISTS invite_code text unique;

-- Optional: You might want to generate invite codes for existing circles
-- UPDATE public.circles SET invite_code = substr(md5(random()::text), 1, 6) WHERE invite_code IS NULL;
