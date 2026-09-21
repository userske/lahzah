DO $$ 
BEGIN
    -- 1. If 'message' exists but 'content' doesn't, just rename it
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'circle_messages' AND column_name = 'message') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'circle_messages' AND column_name = 'content') THEN
        ALTER TABLE public.circle_messages RENAME COLUMN message TO content;
    END IF;

    -- 2. If 'content' doesn't exist at all (and 'message' wasn't there either, edge case), create it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'circle_messages' AND column_name = 'content') THEN
        ALTER TABLE public.circle_messages ADD COLUMN content text NOT NULL DEFAULT '';
    END IF;

    -- 3. If BOTH 'message' and 'content' exist, the user manually added 'content'. 
    -- We need to drop 'message' so the not-null constraint goes away.
    -- (We'll migrate data first just in case)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'circle_messages' AND column_name = 'message') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'circle_messages' AND column_name = 'content') THEN
        UPDATE public.circle_messages SET content = message WHERE content IS NULL OR content = '';
        ALTER TABLE public.circle_messages DROP COLUMN message;
    END IF;

    -- 4. Add 'type' if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'circle_messages' AND column_name = 'type') THEN
        ALTER TABLE public.circle_messages ADD COLUMN type text not null default 'text';
    END IF;

    -- 5. Add 'reply_to_id' if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'circle_messages' AND column_name = 'reply_to_id') THEN
        ALTER TABLE public.circle_messages ADD COLUMN reply_to_id uuid references public.circle_messages(id) on delete set null;
    END IF;
END $$;
