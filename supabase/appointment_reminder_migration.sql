-- Add reminded_at column to appointments for idempotent reminder sending
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminded_at timestamptz;

-- Enable pg_cron extension (run once as superuser)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule reminder check every hour
-- SELECT cron.schedule(
--   'appointment-reminders',
--   '0 * * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://<PROJECT_REF>.functions.supabase.co/appointment-reminder',
--     headers := '{"Authorization": "Bearer <ANON_KEY>", "Content-Type": "application/json"}'::jsonb,
--     body := '{}'::jsonb
--   );
--   $$
-- );
