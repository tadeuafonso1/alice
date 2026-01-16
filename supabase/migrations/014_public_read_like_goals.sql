-- Allow public read access to like_goals for OBS overlays
CREATE POLICY "Public can view any goal settings"
ON public.like_goals
FOR SELECT
USING (true);
