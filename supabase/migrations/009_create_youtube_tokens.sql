-- Migration: Create youtube_tokens table for secure token storage
-- Description: Stores YouTube API refresh tokens securely with RLS

CREATE TABLE IF NOT EXISTS youtube_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE youtube_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own tokens (needed for refreshing)
CREATE POLICY "Users can view their own youtube tokens"
  ON youtube_tokens FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own tokens
CREATE POLICY "Users can insert their own youtube tokens"
  ON youtube_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own tokens
CREATE POLICY "Users can update their own youtube tokens"
  ON youtube_tokens FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can delete their own tokens
CREATE POLICY "Users can delete their own youtube tokens"
  ON youtube_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_youtube_tokens_user_id ON youtube_tokens(user_id);
