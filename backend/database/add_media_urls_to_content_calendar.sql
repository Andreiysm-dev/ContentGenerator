-- Add media_urls column to contentCalendar
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contentCalendar' AND column_name = 'media_urls') THEN
        ALTER TABLE public."contentCalendar" ADD COLUMN media_urls text[] DEFAULT '{}'::text[];
    END IF;
END $$;
