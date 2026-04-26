-- ============================================================
-- AutoVerse — Listing V2 (kapsamlı ilan alanları)
-- Supabase SQL Editor'da çalıştır
-- ============================================================

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS year          SMALLINT,
  ADD COLUMN IF NOT EXISTS mileage       INTEGER,
  ADD COLUMN IF NOT EXISTS fuel_type     TEXT,
  ADD COLUMN IF NOT EXISTS transmission  TEXT,
  ADD COLUMN IF NOT EXISTS budget        NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS location      TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS service_types TEXT[]  DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS urgency       TEXT    DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS cover_image   TEXT,
  ADD COLUMN IF NOT EXISTS extra_images  TEXT[]  DEFAULT ARRAY[]::TEXT[];

-- listing-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
  VALUES ('listing-images', 'listing-images', true, 10485760)  -- 10MB
  ON CONFLICT DO NOTHING;

CREATE POLICY "listimg_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'listing-images');

CREATE POLICY "listimg_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'listing-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "listimg_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'listing-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
