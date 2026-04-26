-- İlan durumu (açık / kapalı)
-- Supabase SQL Editor'da çalıştır

alter table listings
  add column if not exists status text not null default 'open'
    check (status in ('open', 'closed'));
