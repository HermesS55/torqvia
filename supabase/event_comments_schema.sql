-- events tablosuna eksik kolonlar
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS category    text,
  ADD COLUMN IF NOT EXISTS max_attendees integer,
  ADD COLUMN IF NOT EXISTS cover_url   text,
  ADD COLUMN IF NOT EXISTS is_online   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS online_link text,
  ADD COLUMN IF NOT EXISTS status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled','completed'));

-- event_comments tablosu
CREATE TABLE IF NOT EXISTS public.event_comments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content      text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_comments_event ON public.event_comments(event_id);

-- RLS
ALTER TABLE public.event_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes event yorumlarını okuyabilir"
  ON public.event_comments FOR SELECT USING (true);

CREATE POLICY "Giriş yapan kullanıcı yorum ekleyebilir"
  ON public.event_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Yorum sahibi silebilir"
  ON public.event_comments FOR DELETE
  USING (auth.uid() = user_id);

-- events RLS (yoksa)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='events' AND policyname='Herkes etkinlikleri okuyabilir') THEN
    CREATE POLICY "Herkes etkinlikleri okuyabilir"
      ON public.events FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='events' AND policyname='Giriş yapan kullanıcı etkinlik oluşturabilir') THEN
    CREATE POLICY "Giriş yapan kullanıcı etkinlik oluşturabilir"
      ON public.events FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='events' AND policyname='Etkinlik sahibi güncelleyebilir') THEN
    CREATE POLICY "Etkinlik sahibi güncelleyebilir"
      ON public.events FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='events' AND policyname='Etkinlik sahibi silebilir') THEN
    CREATE POLICY "Etkinlik sahibi silebilir"
      ON public.events FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
