-- Migration: Remove LivePix settings table
-- Description: Completely removes the live_pix_settings table as the LivePix integration is being removed.

DROP TABLE IF EXISTS live_pix_settings;
