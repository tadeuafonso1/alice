-- Migration 012: Add sync columns and public policy to like_goals
ALTER TABLE IF EXISTS public.like_goals 
ADD COLUMN IF NOT EXISTS current_likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stream_found BOOLEAN DEFAULT TRUE;

-- Allow public access to read the goal settings if they know the user_id
-- (Necessary for OBS overlay which doesn't have a session)
CREATE POLICY "Public read access for like goals" 
ON public.like_goals FOR SELECT 
USING (true);

-- Ensure RLS is enabled
ALTER TABLE public.like_goals ENABLE ROW LEVEL SECURITY;
