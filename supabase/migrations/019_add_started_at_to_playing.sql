-- Migration: Add started_at to playing_users
-- Description: Track when a user was moved to the playing list for the countdown timer.

ALTER TABLE playing_users 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT now();
