-- listings.status check constraint'ine 'in_progress' ekleniyor
-- Supabase SQL Editor'da çalıştır

-- Eski constraint'i kaldır (Postgres inline check için otomatik üretilen ad)
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_status_check;

-- Yeni constraint: open | in_progress | closed
ALTER TABLE listings
  ADD CONSTRAINT listings_status_check
  CHECK (status IN ('open', 'in_progress', 'closed'));
