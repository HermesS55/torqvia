-- ============================================================
-- AutoVerse — Media & Plan Schema
-- Supabase SQL Editor'da çalıştır
-- ============================================================

-- posts tablosuna video desteği
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS video_url TEXT;

-- profiles tablosuna plan desteği
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan            TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'turbo', 'elite')),
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;

-- post-videos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
  VALUES ('post-videos', 'post-videos', true, 209715200)  -- 200MB limit
  ON CONFLICT DO NOTHING;

-- Storage policies — post-videos
CREATE POLICY "postvideos_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'post-videos');

CREATE POLICY "postvideos_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'post-videos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "postvideos_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'post-videos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
