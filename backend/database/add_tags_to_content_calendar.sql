-- Add tags column to contentCalendar
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contentCalendar' AND column_name = 'tags') THEN
        ALTER TABLE public."contentCalendar" ADD COLUMN tags jsonb DEFAULT '[]'::jsonb;
    END IF;
END $$;
