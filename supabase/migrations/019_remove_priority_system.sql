-- Migration: Remove priority system columns
-- Description: Removes priority_amount from queue and skip_queue settings from live_pix_settings.

DO $$ 
BEGIN
    -- Remove from queue table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'queue' AND column_name = 'priority_amount') THEN
        ALTER TABLE queue DROP COLUMN priority_amount;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_queue_priority_amount') THEN
        DROP INDEX idx_queue_priority_amount;
    END IF;

    -- Remove is_priority if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'queue' AND column_name = 'is_priority') THEN
        ALTER TABLE queue DROP COLUMN is_priority;
    END IF;

    -- Remove from live_pix_settings table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'live_pix_settings' AND column_name = 'skip_queue_enabled') THEN
        ALTER TABLE live_pix_settings DROP COLUMN skip_queue_enabled;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'live_pix_settings' AND column_name = 'skip_queue_price') THEN
        ALTER TABLE live_pix_settings DROP COLUMN skip_queue_price;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'live_pix_settings' AND column_name = 'skip_queue_message') THEN
        ALTER TABLE live_pix_settings DROP COLUMN skip_queue_message;
    END IF;

END $$;
