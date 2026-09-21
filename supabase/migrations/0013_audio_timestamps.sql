-- Migration: 0013_audio_timestamps.sql
-- Purpose: Stores word-by-word timestamps from Tarteel JSON segments

CREATE TABLE IF NOT EXISTS public.audio_timestamps (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reciter_slug TEXT NOT NULL,
    surah_number INTEGER NOT NULL,
    ayah_number INTEGER NOT NULL,
    verse_key TEXT NOT NULL, -- e.g., '1:1'
    duration_ms INTEGER NOT NULL,
    segments JSONB NOT NULL, -- The array of [word_index, start_ms, end_ms]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(reciter_slug, verse_key)
);

-- Index for fast lookup during gapless audio playback
CREATE INDEX IF NOT EXISTS idx_audio_timestamps_lookup 
ON public.audio_timestamps(reciter_slug, surah_number);

-- RLS Policies
ALTER TABLE public.audio_timestamps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Timestamps are readable by everyone" 
ON public.audio_timestamps FOR SELECT 
USING (true);

-- Only service role / admin can insert
CREATE POLICY "Timestamps are insertable by admins" 
ON public.audio_timestamps FOR INSERT 
WITH CHECK (true);
