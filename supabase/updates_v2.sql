-- ============================================================
-- Torqvia — Güncelleme v2
-- Supabase SQL Editor'da çalıştır
-- ============================================================

-- 1. follows RLS: follow isteği kabulü için (following_id = auth.uid() da izin ver)
DROP POLICY IF EXISTS "follows_insert" ON public.follows;
CREATE POLICY "follows_insert" ON public.follows FOR INSERT TO authenticated
  WITH CHECK (follower_id = auth.uid() OR following_id = auth.uid());

-- 2. communities: birden fazla kategori desteği
ALTER TABLE communities ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';

-- 3. community_messages: fotoğraf gönderme desteği
ALTER TABLE community_messages ADD COLUMN IF NOT EXISTS image_url TEXT;
-- İçerik zorunluluğunu kaldır (fotoğraf tek başına gönderilebilsin)
ALTER TABLE community_messages ALTER COLUMN content DROP NOT NULL;
ALTER TABLE community_messages ALTER COLUMN content SET DEFAULT '';

-- 4. listings: telefon numarası gösterme seçeneği
ALTER TABLE listings ADD COLUMN IF NOT EXISTS show_phone BOOLEAN DEFAULT false;

-- 5. messages: okundu bilgisi + paylaşılan gönderi görseli
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url TEXT;

-- RLS: alıcı kendi mesajlarına read_at yazabilsin
DROP POLICY IF EXISTS "messages_update" ON public.messages;
CREATE POLICY "messages_update" ON public.messages FOR UPDATE TO authenticated
  USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());
