-- ============================================================
-- AutoVerse — Settings / Privacy columns
-- Supabase SQL Editor'da çalıştır
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_public   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_public   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS profile_public BOOLEAN NOT NULL DEFAULT true;
