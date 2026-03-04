-- Add card_name column to contentCalendar
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contentCalendar' AND column_name = 'card_name') THEN
        ALTER TABLE public."contentCalendar" ADD COLUMN card_name text;
    END IF;
END $$;
