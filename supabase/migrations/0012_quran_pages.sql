-- Create the table to store full offline pages of the Quran (from API v4)
CREATE TABLE IF NOT EXISTS quran_pages (
    page_number INTEGER PRIMARY KEY,
    verses_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security
ALTER TABLE quran_pages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the quran pages
CREATE POLICY "Anyone can read quran pages"
    ON quran_pages
    FOR SELECT
    USING (true);
