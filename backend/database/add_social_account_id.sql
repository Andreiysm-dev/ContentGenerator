-- Add social_account_id column to contentCalendar
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contentCalendar' AND column_name = 'social_account_id') THEN
        ALTER TABLE public."contentCalendar" ADD COLUMN social_account_id text;
    END IF;
END $$;

-- Create index for social_account_id
CREATE INDEX IF NOT EXISTS "idx_contentCalendar_social_account_id" ON public."contentCalendar"(social_account_id);
