-- Migration: Add priority_amount to queue table
-- Description: Supports dynamic sorting where higher donors get higher priority.

ALTER TABLE queue 
ADD COLUMN IF NOT EXISTS priority_amount NUMERIC DEFAULT 0;

-- Create index for sorting performance
CREATE INDEX IF NOT EXISTS idx_queue_priority_amount ON queue(priority_amount DESC);
