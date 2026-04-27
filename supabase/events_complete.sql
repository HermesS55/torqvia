-- ============================================================
-- Torqvia — Events (TAM VE TEMİZ — tekrar çalıştırılabilir)
-- Supabase SQL Editor'da SADECE bu dosyayı çalıştır.
-- events_schema.sql ve event_comments_schema.sql'e gerek yok.
-- ============================================================

-- 1. EVENTS TABLOSU
CREATE TABLE IF NOT EXISTS public.events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       text NOT NULL CHECK (char_length(title) <= 120),
  description text CHECK (char_length(description) <= 500),
  event_date  timestamptz NOT NULL,
  location    text CHECK (char_length(location) <= 200),
  category    text DEFAULT 'Etkinlik',
  cover_image text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Eksik kolonlar (daha önce eklenmemişse ekle)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS category    text DEFAULT 'Etkinlik';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS cover_image text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS cover_url   text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS max_attendees integer;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_online   boolean NOT NULL DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS online_link text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS status      text NOT NULL DEFAULT 'active';

-- 2. EVENT ATTENDEES TABLOSU
CREATE TABLE IF NOT EXISTS public.event_attendees (
  event_id  uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

-- 3. EVENT COMMENTS TABLOSU
CREATE TABLE IF NOT EXISTS public.event_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. INDEX'LER
CREATE INDEX IF NOT EXISTS idx_events_date         ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_user         ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_event_att_event     ON public.event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_comments_event ON public.event_comments(event_id);

-- 5. RLS AKTİF ET
ALTER TABLE public.events           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_comments   ENABLE ROW LEVEL SECURITY;

-- 6. ESKİ POLİTİKALARI TEMİZLE (her ikisi de — kısa isimli ve uzun Türkçe isimli)
DROP POLICY IF EXISTS "events_select"   ON public.events;
DROP POLICY IF EXISTS "events_insert"   ON public.events;
DROP POLICY IF EXISTS "events_update"   ON public.events;
DROP POLICY IF EXISTS "events_delete"   ON public.events;
DROP POLICY IF EXISTS "Herkes etkinlikleri okuyabilir"               ON public.events;
DROP POLICY IF EXISTS "Giriş yapan kullanıcı etkinlik oluşturabilir" ON public.events;
DROP POLICY IF EXISTS "Etkinlik sahibi güncelleyebilir"              ON public.events;
DROP POLICY IF EXISTS "Etkinlik sahibi silebilir"                    ON public.events;

DROP POLICY IF EXISTS "event_att_select" ON public.event_attendees;
DROP POLICY IF EXISTS "event_att_insert" ON public.event_attendees;
DROP POLICY IF EXISTS "event_att_delete" ON public.event_attendees;

DROP POLICY IF EXISTS "Herkes event yorumlarını okuyabilir"   ON public.event_comments;
DROP POLICY IF EXISTS "Giriş yapan kullanıcı yorum ekleyebilir" ON public.event_comments;
DROP POLICY IF EXISTS "Yorum sahibi silebilir"                ON public.event_comments;

-- 7. TEMİZ POLİTİKALAR
CREATE POLICY "events_select" ON public.events FOR SELECT USING (true);
CREATE POLICY "events_insert" ON public.events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "events_update" ON public.events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "events_delete" ON public.events FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "event_att_select" ON public.event_attendees FOR SELECT USING (true);
CREATE POLICY "event_att_insert" ON public.event_attendees FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "event_att_delete" ON public.event_attendees FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "event_comments_select" ON public.event_comments FOR SELECT USING (true);
CREATE POLICY "event_comments_insert" ON public.event_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "event_comments_delete" ON public.event_comments FOR DELETE USING (auth.uid() = user_id);
