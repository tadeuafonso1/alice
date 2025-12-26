-- Migration: Create queue_state table for persisting queue timer state
-- Description: This table stores the global state of the queue (timer active/inactive, timeout settings)

CREATE TABLE IF NOT EXISTS queue_state (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_timer_active BOOLEAN DEFAULT true,
  timeout_minutes INTEGER DEFAULT 5,
  is_queue_open BOOLEAN DEFAULT true,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE queue_state ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own queue state
CREATE POLICY "Users can view their own queue state"
  ON queue_state FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own queue state
CREATE POLICY "Users can insert their own queue state"
  ON queue_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own queue state
CREATE POLICY "Users can update their own queue state"
  ON queue_state FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can delete their own queue state
CREATE POLICY "Users can delete their own queue state"
  ON queue_state FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_queue_state_user_id ON queue_state(user_id);
