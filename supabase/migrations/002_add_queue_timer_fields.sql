-- Migration: Add timer fields to queue table
-- Description: Add fields to persist individual user timers and warning status

-- Add timer_start_time column to track when user joined/last spoke
ALTER TABLE queue ADD COLUMN IF NOT EXISTS timer_start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add warning_sent column to track if 30-second warning was already sent
ALTER TABLE queue ADD COLUMN IF NOT EXISTS warning_sent BOOLEAN DEFAULT false;

-- Create index for timer queries
CREATE INDEX IF NOT EXISTS idx_queue_timer_start_time ON queue(timer_start_time);

-- Update existing rows to set timer_start_time to joined_at if it exists
UPDATE queue SET timer_start_time = joined_at WHERE timer_start_time IS NULL AND joined_at IS NOT NULL;
