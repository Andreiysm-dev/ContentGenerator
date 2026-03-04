-- Add collaborators column to contentCalendar table
ALTER TABLE "contentCalendar" ADD COLUMN IF NOT EXISTS "collaborators" JSONB DEFAULT '[]';
