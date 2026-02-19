-- Create the scheduled_posts table
CREATE TABLE IF NOT EXISTS public.scheduled_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.company("companyId") ON DELETE CASCADE,
    content_calendar_id UUID REFERENCES public."contentCalendar"("contentCalendarId") ON DELETE SET NULL, -- Link back to original
    
    -- Schedule Info
    scheduled_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'PUBLISHED', 'FAILED')),
    
    -- Content Payload (The exact things to post)
    content TEXT NOT NULL, -- Full caption + hashtags
    media_urls TEXT[], -- Array of URLs to the assets in 'scheduled-assets' bucket
    
    -- Target Accounts
    account_ids TEXT[] NOT NULL, -- Array of social_accounts IDs
    
    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    publish_result JSONB -- Store the API response from social networks
);

-- Index for fast polling
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status_time 
ON public.scheduled_posts (status, scheduled_at) 
WHERE status = 'PENDING';

-- Create the new storage bucket 'scheduled-assets'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('scheduled-assets', 'scheduled-assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Allow authenticated users to upload/read their own company assets
-- Note: This is a simplified policy. For production, ensure strictly checking company_id ownership.
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'scheduled-assets' );

CREATE POLICY "Authenticated Insert" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'scheduled-assets' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated Update" 
ON storage.objects FOR UPDATE
USING ( bucket_id = 'scheduled-assets' AND auth.role() = 'authenticated' );
