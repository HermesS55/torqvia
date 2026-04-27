-- post_bookmarks tablosu
CREATE TABLE IF NOT EXISTS public.post_bookmarks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id     uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_post_bookmarks_user ON public.post_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_post_bookmarks_post ON public.post_bookmarks(post_id);

-- RLS
ALTER TABLE public.post_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanıcı kendi bookmark'larını yönetebilir"
  ON public.post_bookmarks FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
