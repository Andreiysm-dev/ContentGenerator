-- Add scheduled_at column if it likely doesn't exist (or just ignore error if it does)
-- Better yet, run these commands separately if needed.
-- Since the column exists, we can skip the ADD COLUMN part or wrap it in a DO block.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contentCalendar' AND column_name = 'scheduled_at') THEN
        ALTER TABLE public."contentCalendar" ADD COLUMN scheduled_at timestamp with time zone;
    END IF;
END $$;

-- Create an index for faster querying (IF NOT EXISTS is supported in newer Postgres, otherwise standard create)
CREATE INDEX IF NOT EXISTS "idx_contentCalendar_scheduled_at" ON public."contentCalendar"(scheduled_at);

-- Update status constraint
ALTER TABLE public."contentCalendar"
DROP CONSTRAINT IF EXISTS "contentCalendar_status_check";

ALTER TABLE public."contentCalendar"
ADD CONSTRAINT "contentCalendar_status_check"
CHECK (status IN ('DRAFT', 'GENERATED', 'Approved', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'FAILED'));
-- Note: Added 'Approved' mixed case just in case, based on typical data issues.
