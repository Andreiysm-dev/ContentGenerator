-- Add supervisor_comments column to contentCalendar
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contentCalendar' AND column_name = 'supervisor_comments') THEN
        ALTER TABLE public."contentCalendar" ADD COLUMN supervisor_comments text;
    END IF;
END $$;
