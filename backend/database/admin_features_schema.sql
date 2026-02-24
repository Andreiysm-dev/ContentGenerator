-- Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT, -- e.g., 'company', 'content', 'user'
  entity_id TEXT,
  metadata JSONB, -- Additional details about the action
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initial Settings
INSERT INTO public.system_settings (key, value, description)
VALUES 
  ('maintenance_mode', 'false', 'Whether the application is in maintenance mode'),
  ('api_usage_caps', '{"daily_generations": 100, "daily_images": 20}', 'Global API usage limits per user'),
  ('feature_flags', '{"video_generation": false, "advanced_ai": true}', 'Experimental feature toggles'),
  ('system_announcement', '""', 'A banner message shown to all users')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS for admin tables
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Admins can do everything, others nothing on these tables
CREATE POLICY "Admins can manage audit logs"
  ON public.audit_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can manage system settings"
  ON public.system_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Non-admins might need to read SOME settings (like maintenance mode)
CREATE POLICY "Everyone can read maintenance mode"
  ON public.system_settings
  FOR SELECT
  USING (key = 'maintenance_mode' OR key = 'system_announcement');
