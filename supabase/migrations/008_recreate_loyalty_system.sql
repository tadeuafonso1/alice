-- Drop existing objects if they exist
DROP TABLE IF EXISTS public.loyalty_points CASCADE;
DROP FUNCTION IF EXISTS public.increment_loyalty_points(TEXT, INTEGER, UUID);

-- Create loyalty_points table
CREATE TABLE public.loyalty_points (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT,
    username TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(owner_id, username)
);

-- Enable RLS for loyalty_points
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

-- Create policies for loyalty_points
CREATE POLICY "Users can view their own loyalty points data"
    ON public.loyalty_points FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can manage their own loyalty points data"
    ON public.loyalty_points FOR ALL
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- RPC function to increment points safely
CREATE OR REPLACE FUNCTION public.increment_loyalty_points(
    p_username TEXT,
    p_points INTEGER,
    p_owner_id UUID
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.loyalty_points (username, points, owner_id)
    VALUES (p_username, p_points, p_owner_id)
    ON CONFLICT (owner_id, username)
    DO UPDATE SET 
        points = loyalty_points.points + EXCLUDED.points,
        last_seen = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_loyalty_points(TEXT, INTEGER, UUID) TO authenticated;

-- Add comments
COMMENT ON TABLE public.loyalty_points IS 'Tracks loyalty points for viewers of each streamer';
COMMENT ON FUNCTION public.increment_loyalty_points IS 'Safely increments or decrements loyalty points for a user';
