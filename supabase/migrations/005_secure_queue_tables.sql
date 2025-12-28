-- Migration: Secure Queue and Playing Users tables
-- Description: Adds user_id to queue tables and enables RLS to prevent data leaks between users.

-- 1. Add user_id to 'queue' table
ALTER TABLE queue 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- 2. Add user_id to 'playing_users' table
ALTER TABLE playing_users 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- 3. Enable RLS on 'queue'
ALTER TABLE queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own queue" ON queue;

CREATE POLICY "Users can manage their own queue"
ON queue
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Enable RLS on 'playing_users'
ALTER TABLE playing_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own playing list" ON playing_users;

CREATE POLICY "Users can manage their own playing list"
ON playing_users
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Optional: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_queue_user_id ON queue(user_id);
CREATE INDEX IF NOT EXISTS idx_playing_users_user_id ON playing_users(user_id);
