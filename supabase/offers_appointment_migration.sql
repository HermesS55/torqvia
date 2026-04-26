-- ============================================================
-- Offers: randevu + tamamlandı durumu migration
-- Supabase SQL Editor'da çalıştır
-- ============================================================

-- Randevu alanları ekle
alter table offers add column if not exists appointment_date timestamptz;
alter table offers add column if not exists appointment_note text check (char_length(appointment_note) <= 200);

-- completed durumunu status constraint'e ekle
alter table offers drop constraint if exists offers_status_check;
alter table offers add constraint offers_status_check
  check (status in ('pending', 'accepted', 'rejected', 'completed'));
