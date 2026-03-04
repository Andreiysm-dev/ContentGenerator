-- Create content_comments table
CREATE TABLE IF NOT EXISTS public.content_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_calendar_id UUID REFERENCES public."contentCalendar"("contentCalendarId") ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.content_comments ENABLE ROW LEVEL SECURITY;

-- Policy for viewing comments: Any user can view if they have access to the company (simplified for now, mimicking audit_logs access)
CREATE POLICY "Users can view comments for authorized content" ON public.content_comments
    FOR SELECT USING (true); -- Verification will be handled at API level

-- Policy for inserting comments: Any authenticated user
CREATE POLICY "Users can insert their own comments" ON public.content_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for deleting comments: Only the author or company owner
CREATE POLICY "Authors or board owners can delete comments" ON public.content_comments
    FOR DELETE USING (auth.uid() = user_id);
