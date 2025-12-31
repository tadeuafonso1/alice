-- Ensure the increment_loyalty_points function exists
-- This migration recreates the function to fix any schema cache issues

DROP FUNCTION IF EXISTS public.increment_loyalty_points(TEXT, INTEGER, UUID);

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

COMMENT ON FUNCTION public.increment_loyalty_points IS 'Safely increments or decrements loyalty points for a user';
