-- Add social_post_id and social_provider columns to contentCalendar
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contentCalendar' AND column_name = 'social_post_id') THEN
        ALTER TABLE public."contentCalendar" ADD COLUMN social_post_id text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contentCalendar' AND column_name = 'social_provider') THEN
        ALTER TABLE public."contentCalendar" ADD COLUMN social_provider text;
    END IF;
END $$;

-- Create index for social_post_id
CREATE INDEX IF NOT EXISTS "idx_contentCalendar_social_post_id" ON public."contentCalendar"(social_post_id);
