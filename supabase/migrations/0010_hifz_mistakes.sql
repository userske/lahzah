-- Create table to track user's struggled ayahs in Hifz Mode
CREATE TABLE IF NOT EXISTS public.hifz_mistakes (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    surah INT NOT NULL,
    ayah INT NOT NULL,
    status TEXT DEFAULT 'struggling' CHECK (status IN ('struggling', 'memorized')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, surah, ayah)
);

ALTER TABLE public.hifz_mistakes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own mistakes" 
ON public.hifz_mistakes FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mistakes" 
ON public.hifz_mistakes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mistakes" 
ON public.hifz_mistakes FOR UPDATE 
USING (auth.uid() = user_id);

-- Create or update function to toggle a mistake (upsert)
CREATE OR REPLACE FUNCTION log_hifz_mistake(
    p_surah INT,
    p_ayah INT,
    p_status TEXT DEFAULT 'struggling'
) RETURNS void AS $$
BEGIN
    INSERT INTO public.hifz_mistakes (user_id, surah, ayah, status)
    VALUES (auth.uid(), p_surah, p_ayah, p_status)
    ON CONFLICT (user_id, surah, ayah) 
    DO UPDATE SET status = EXCLUDED.status, updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
