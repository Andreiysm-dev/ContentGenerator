ALTER TABLE public.profiles ADD COLUMN last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Also ensure it can be updated by the owner
DROP POLICY IF EXISTS "Users can update own presence" ON public.profiles;
CREATE POLICY "Users can update own presence"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
