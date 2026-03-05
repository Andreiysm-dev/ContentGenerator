-- Migration: Add dashboard_settings to company table
ALTER TABLE company ADD COLUMN IF NOT EXISTS dashboard_settings JSONB DEFAULT '{}'::jsonb;
