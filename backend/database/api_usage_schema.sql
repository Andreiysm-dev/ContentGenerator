-- API Usage Logs Table
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.company(companyId) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    provider TEXT NOT NULL, -- 'openai', 'gemini', 'fal', 'replicate'
    model TEXT NOT NULL,
    type TEXT NOT NULL, -- 'completion', 'image_generation', 'analysis'
    input_tokens INTEGER,
    output_tokens INTEGER,
    estimated_cost NUMERIC(15, 10), -- Actual USD cost
    metadata JSONB, -- Additional details (e.g., resolution for images)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read all logs
CREATE POLICY "Admins can read all api logs"
  ON public.api_usage_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_api_usage_company ON public.api_usage_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON public.api_usage_logs(created_at);
