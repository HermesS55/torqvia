-- ============================================================
-- AutoVerse Social Schema — Supabase SQL Editor'da çalıştır
-- ============================================================

-- ─── PROFİL GENİŞLETME ───────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url   TEXT,
  ADD COLUMN IF NOT EXISTS bio          TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS specialty    TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS skills       TEXT[]  DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS website      TEXT    DEFAULT '';

-- ─── POSTS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL CHECK (char_length(content) <= 1000),
  image_url   TEXT,
  repost_of   UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── POST LIKES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.post_likes (
  post_id     UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- ─── POST COMMENTS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.post_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL CHECK (char_length(content) <= 500),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── POST TAGS (mentions) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.post_tags (
  post_id         UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  tagged_user_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tagged_user_id)
);

-- ─── DIRECT MESSAGES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content      TEXT NOT NULL CHECK (char_length(content) <= 2000),
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (sender_id <> receiver_id)
);

-- ─── INDEXES ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS posts_user_id_idx       ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS posts_created_at_idx    ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS post_likes_post_idx     ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS post_comments_post_idx  ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS messages_sender_idx     ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_receiver_idx   ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at DESC);

-- ─── RLS ─────────────────────────────────────────────────────
ALTER TABLE public.posts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages       ENABLE ROW LEVEL SECURITY;

-- POSTS
CREATE POLICY "posts_select" ON public.posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "posts_insert" ON public.posts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "posts_delete" ON public.posts FOR DELETE TO authenticated USING (user_id = auth.uid());

-- POST LIKES
CREATE POLICY "likes_select" ON public.post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "likes_insert" ON public.post_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "likes_delete" ON public.post_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- POST COMMENTS
CREATE POLICY "comments_select" ON public.post_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "comments_insert" ON public.post_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "comments_delete" ON public.post_comments FOR DELETE TO authenticated USING (user_id = auth.uid());

-- POST TAGS
CREATE POLICY "tags_select" ON public.post_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "tags_insert" ON public.post_tags FOR INSERT TO authenticated WITH CHECK (true);

-- MESSAGES — sadece gönderen veya alıcı görebilir
CREATE POLICY "messages_select" ON public.messages FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "messages_insert" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());
CREATE POLICY "messages_delete" ON public.messages FOR DELETE TO authenticated
  USING (sender_id = auth.uid());

-- ─── STORAGE BUCKETS ─────────────────────────────────────────
-- Supabase Dashboard → Storage → New bucket → "avatars" (public: true)
-- Supabase Dashboard → Storage → New bucket → "post-images" (public: true)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true) ON CONFLICT DO NOTHING;

CREATE POLICY "avatars_select"  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_insert"  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_update"  ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_delete"  ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "postimg_select"  ON storage.objects FOR SELECT USING (bucket_id = 'post-images');
CREATE POLICY "postimg_insert"  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "postimg_delete"  ON storage.objects FOR DELETE USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);
