-- Allow personal_journal to store 'hifz_struggle' entries logged from Hifz Mode
-- (The table was created in 0005_advanced_social.sql; we're relaxing the type constraint here)

DO $$
BEGIN
  -- Drop existing constraint if any (may not exist on older versions)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'personal_journal'
      AND constraint_name = 'personal_journal_type_check'
  ) THEN
    ALTER TABLE public.personal_journal DROP CONSTRAINT personal_journal_type_check;
  END IF;

  -- Add updated constraint including hifz_struggle
  ALTER TABLE public.personal_journal
    ADD CONSTRAINT personal_journal_type_check
    CHECK (type IN ('reflection', 'milestone', 'goal_update', 'hifz_struggle'));
END;
$$;
