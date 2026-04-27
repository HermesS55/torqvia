-- messages tablosuna fotoğraf/video desteği ekle
-- Supabase SQL Editor'da çalıştır

-- image_url kolonu yoksa ekle
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS image_url TEXT;

-- content artık zorunlu olmasın (sadece fotoğraf/video gönderilebilsin)
ALTER TABLE public.messages ALTER COLUMN content DROP NOT NULL;

-- en az biri dolu olsun: content veya image_url
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_has_content;
ALTER TABLE public.messages ADD CONSTRAINT messages_has_content
  CHECK (content IS NOT NULL OR image_url IS NOT NULL);

-- post-images bucket'ı için storage politikası (yoksa ekle)
INSERT INTO storage.buckets (id, name, public)
  VALUES ('post-images', 'post-images', true)
  ON CONFLICT (id) DO NOTHING;

-- post-videos bucket'ı için storage politikası (yoksa ekle)
INSERT INTO storage.buckets (id, name, public)
  VALUES ('post-videos', 'post-videos', true)
  ON CONFLICT (id) DO NOTHING;

-- post-images: oturum açmış herkes yükleyebilir
DROP POLICY IF EXISTS "post_images_insert" ON storage.objects;
CREATE POLICY "post_images_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'post-images');

DROP POLICY IF EXISTS "post_images_select" ON storage.objects;
CREATE POLICY "post_images_select" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'post-images');

-- post-videos: oturum açmış herkes yükleyebilir
DROP POLICY IF EXISTS "post_videos_insert" ON storage.objects;
CREATE POLICY "post_videos_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'post-videos');

DROP POLICY IF EXISTS "post_videos_select" ON storage.objects;
CREATE POLICY "post_videos_select" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'post-videos');
