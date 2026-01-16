-- Add debug_log column to like_goals
ALTER TABLE like_goals ADD COLUMN IF NOT EXISTS debug_log text;
