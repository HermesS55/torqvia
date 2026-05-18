-- ============================================================
-- TORQVIA - Supabase Full Migration
-- Supabase Dashboard > SQL Editor'da çalıştır
-- ============================================================

-- ── 1. profiles tablosu - eksik kolonlar ──────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan                    text    DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS skills                  text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS specialty               text,
  ADD COLUMN IF NOT EXISTS website                 text,
  ADD COLUMN IF NOT EXISTS phone                   text,
  ADD COLUMN IF NOT EXISTS phone_public            boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS private_account         boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pinned_post_id          uuid,
  ADD COLUMN IF NOT EXISTS bio                     text,
  ADD COLUMN IF NOT EXISTS avatar_url              text,
  ADD COLUMN IF NOT EXISTS trial_start_date        timestamptz,
  ADD COLUMN IF NOT EXISTS lifetime_leads_unlocked integer DEFAULT 0;

-- Auto-set trial start date for new pro users
CREATE OR REPLACE FUNCTION public.set_pro_trial_start()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.role = 'pro' AND NEW.trial_start_date IS NULL THEN
    NEW.trial_start_date := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_pro_trial ON public.profiles;
CREATE TRIGGER trigger_set_pro_trial
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_pro_trial_start();

-- TODO: DB identifiers below use legacy "lead" naming. Rename `increment_lead_unlocks` → e.g. `increment_servis_talebi_unlocks`
-- and `lifetime_leads_unlocked` column → `acilan_servis_talepleri` in a future schema migration.
-- Until then, keep these names in sync with the RPC calls in ListingDetail.jsx (handleUnlockTalep).
CREATE OR REPLACE FUNCTION public.increment_lead_unlocks(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.profiles
  SET lifetime_leads_unlocked = COALESCE(lifetime_leads_unlocked, 0) + 1
  WHERE id = p_user_id;
END;
$$;


-- ── 1b. lead_contact_unlocks table ────────────────────────────
-- TODO: Rename table `lead_contact_unlocks` → `servis_talebi_acmalari` in a future migration.
-- Also rename column `lifetime_leads_unlocked` on profiles → `acilan_servis_talepleri`.
CREATE TABLE IF NOT EXISTS public.lead_contact_unlocks (
  pro_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id)  ON DELETE CASCADE,
  unlocked_at timestamptz DEFAULT now(),
  PRIMARY KEY (pro_id, listing_id)
);

ALTER TABLE public.lead_contact_unlocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lcu_select" ON public.lead_contact_unlocks;
DROP POLICY IF EXISTS "lcu_insert" ON public.lead_contact_unlocks;

CREATE POLICY "lcu_select" ON public.lead_contact_unlocks
  FOR SELECT USING (auth.uid() = pro_id);
CREATE POLICY "lcu_insert" ON public.lead_contact_unlocks
  FOR INSERT WITH CHECK (auth.uid() = pro_id);


-- ── 2. posts tablosu - eksik kolonlar ─────────────────────────
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS image_url  text,
  ADD COLUMN IF NOT EXISTS video_url  text,
  ADD COLUMN IF NOT EXISTS repost_of  uuid REFERENCES public.posts(id) ON DELETE SET NULL;


-- ── 3. listings tablosu ───────────────────────────────────────
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS cover_image   text,
  ADD COLUMN IF NOT EXISTS extra_images  text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS show_phone    boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS status        text    DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS service_types text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS urgency       text    DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS fuel_type     text,
  ADD COLUMN IF NOT EXISTS transmission  text,
  ADD COLUMN IF NOT EXISTS mileage       integer,
  ADD COLUMN IF NOT EXISTS budget        numeric,
  ADD COLUMN IF NOT EXISTS location      text,
  ADD COLUMN IF NOT EXISTS year          integer,
  ADD COLUMN IF NOT EXISTS description   text;

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "listings_select_open"  ON public.listings;
DROP POLICY IF EXISTS "listings_insert_owner" ON public.listings;
DROP POLICY IF EXISTS "listings_update_owner" ON public.listings;
DROP POLICY IF EXISTS "listings_delete_owner" ON public.listings;

CREATE POLICY "listings_select_open"  ON public.listings FOR SELECT USING (true);
CREATE POLICY "listings_insert_owner" ON public.listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "listings_update_owner" ON public.listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "listings_delete_owner" ON public.listings FOR DELETE USING (auth.uid() = user_id);


-- ── 4. offers tablosu - eksik kolonlar ───────────────────────
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS appointment_date timestamptz,
  ADD COLUMN IF NOT EXISTS appointment_note text;

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "offers_select" ON public.offers;
DROP POLICY IF EXISTS "offers_insert" ON public.offers;
DROP POLICY IF EXISTS "offers_update" ON public.offers;

CREATE POLICY "offers_select" ON public.offers
  FOR SELECT USING (
    auth.uid() = sender_id
    OR auth.uid() IN (SELECT user_id FROM public.listings WHERE id = listing_id)
  );
CREATE POLICY "offers_insert" ON public.offers
  FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "offers_update" ON public.offers
  FOR UPDATE USING (
    auth.uid() = sender_id
    OR auth.uid() IN (SELECT user_id FROM public.listings WHERE id = listing_id)
  );


-- ── 5. messages tablosu ───────────────────────────────────────
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_update" ON public.messages;

CREATE POLICY "messages_select" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "messages_update" ON public.messages
  FOR UPDATE USING (auth.uid() = receiver_id);


-- ── 6. notifications tablosu - post_id kolonu ────────────────
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS post_id      uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS from_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS message      text,
  ADD COLUMN IF NOT EXISTS read         boolean DEFAULT false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete" ON public.notifications;

CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE USING (auth.uid() = user_id);


-- ── 7. blocks tablosu ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blocks (
  blocker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blocks_select" ON public.blocks;
DROP POLICY IF EXISTS "blocks_insert" ON public.blocks;
DROP POLICY IF EXISTS "blocks_delete" ON public.blocks;

-- Her iki taraf da bloğu görebilir (karşılıklı kontrol için)
CREATE POLICY "blocks_select" ON public.blocks
  FOR SELECT USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);
CREATE POLICY "blocks_insert" ON public.blocks
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "blocks_delete" ON public.blocks
  FOR DELETE USING (auth.uid() = blocker_id);


-- ── 8. reports tablosu ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reports (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_user_id uuid        REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id          uuid        REFERENCES public.posts(id) ON DELETE CASCADE,
  reason           text        NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_insert" ON public.reports;
CREATE POLICY "reports_insert" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);


-- ── 8. pro_ratings tablosu ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pro_ratings (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating     integer     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(pro_id, owner_id)
);

ALTER TABLE public.pro_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pro_ratings_select" ON public.pro_ratings;
DROP POLICY IF EXISTS "pro_ratings_insert" ON public.pro_ratings;
DROP POLICY IF EXISTS "pro_ratings_update" ON public.pro_ratings;
DROP POLICY IF EXISTS "pro_ratings_delete" ON public.pro_ratings;

CREATE POLICY "pro_ratings_select" ON public.pro_ratings FOR SELECT USING (true);
CREATE POLICY "pro_ratings_insert" ON public.pro_ratings FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "pro_ratings_update" ON public.pro_ratings FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "pro_ratings_delete" ON public.pro_ratings FOR DELETE USING (auth.uid() = owner_id);


-- ── 9. Storage Buckets ───────────────────────────────────────

-- avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- post-images
INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- post-videos
INSERT INTO storage.buckets (id, name, public) VALUES ('post-videos', 'post-videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- listing-images
INSERT INTO storage.buckets (id, name, public) VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS (tüm bucketlar için tek seferde)
DROP POLICY IF EXISTS "storage_public_read"  ON storage.objects;
DROP POLICY IF EXISTS "storage_auth_insert"  ON storage.objects;
DROP POLICY IF EXISTS "storage_owner_delete" ON storage.objects;

CREATE POLICY "storage_public_read" ON storage.objects
  FOR SELECT USING (bucket_id IN ('avatars', 'post-images', 'post-videos', 'listing-images'));

CREATE POLICY "storage_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('avatars', 'post-images', 'post-videos', 'listing-images')
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "storage_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id IN ('avatars', 'post-images', 'post-videos', 'listing-images')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );


-- ── 10. post_comments yorum düzenleme/silme RLS ─────────────
-- Kullanıcılar kendi yorumlarını düzenleyip silebilmeli
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select"         ON public.post_comments;
DROP POLICY IF EXISTS "comments_insert"         ON public.post_comments;
DROP POLICY IF EXISTS "comments_update_owner"   ON public.post_comments;
DROP POLICY IF EXISTS "comments_delete_owner"   ON public.post_comments;

CREATE POLICY "comments_select"       ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "comments_insert"       ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_update_owner" ON public.post_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "comments_delete_owner" ON public.post_comments FOR DELETE USING (auth.uid() = user_id);

-- messages silme politikası (sadece gönderen silebilir)
DROP POLICY IF EXISTS "messages_delete" ON public.messages;
CREATE POLICY "messages_delete" ON public.messages
  FOR DELETE USING (auth.uid() = sender_id);


-- ── 11. Admin role desteği ────────────────────────────────────
-- profiles.role sütununa 'admin' değeri ekle (eğer CHECK kısıtı varsa)
-- Eğer role sütununda check constraint yoksa bu satırı atlayabilirsin.
-- Yöneticiye admin rolü vermek için:
-- UPDATE public.profiles SET role = 'admin' WHERE id = '<admin_user_id>';

-- reports tablosu için admin select politikası
DROP POLICY IF EXISTS "reports_select_admin" ON public.reports;
CREATE POLICY "reports_select_admin" ON public.reports
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    OR auth.uid() = reporter_id
  );

DROP POLICY IF EXISTS "reports_delete_admin" ON public.reports;
CREATE POLICY "reports_delete_admin" ON public.reports
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );


-- ── 12. saved_listings tablosu ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.saved_listings (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id uuid        NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

ALTER TABLE public.saved_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_listings_select" ON public.saved_listings;
DROP POLICY IF EXISTS "saved_listings_insert" ON public.saved_listings;
DROP POLICY IF EXISTS "saved_listings_delete" ON public.saved_listings;

CREATE POLICY "saved_listings_select" ON public.saved_listings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "saved_listings_insert" ON public.saved_listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved_listings_delete" ON public.saved_listings FOR DELETE USING (auth.uid() = user_id);


-- ── 13. portfolio_items tablosu ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url  text        NOT NULL,
  caption    text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portfolio_select" ON public.portfolio_items;
DROP POLICY IF EXISTS "portfolio_insert" ON public.portfolio_items;
DROP POLICY IF EXISTS "portfolio_delete" ON public.portfolio_items;

CREATE POLICY "portfolio_select" ON public.portfolio_items FOR SELECT USING (true);
CREATE POLICY "portfolio_insert" ON public.portfolio_items FOR INSERT WITH CHECK (auth.uid() = pro_id);
CREATE POLICY "portfolio_delete" ON public.portfolio_items FOR DELETE USING (auth.uid() = pro_id);


-- ── 14. events tablosu ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  description text,
  event_date  timestamptz NOT NULL,
  location    text,
  cover_image text,
  category    text        DEFAULT 'Buluşma',
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_select" ON public.events;
DROP POLICY IF EXISTS "events_insert" ON public.events;
DROP POLICY IF EXISTS "events_update" ON public.events;
DROP POLICY IF EXISTS "events_delete" ON public.events;

CREATE POLICY "events_select" ON public.events FOR SELECT USING (true);
CREATE POLICY "events_insert" ON public.events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "events_update" ON public.events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "events_delete" ON public.events FOR DELETE USING (auth.uid() = user_id);


-- ── 15. event_attendees tablosu ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_attendees (
  event_id   uuid        NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_attendees_select" ON public.event_attendees;
DROP POLICY IF EXISTS "event_attendees_insert" ON public.event_attendees;
DROP POLICY IF EXISTS "event_attendees_delete" ON public.event_attendees;

CREATE POLICY "event_attendees_select" ON public.event_attendees FOR SELECT USING (true);
CREATE POLICY "event_attendees_insert" ON public.event_attendees FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "event_attendees_delete" ON public.event_attendees FOR DELETE USING (auth.uid() = user_id);


-- ── 16. follow_requests tablosu ──────────────────────────────
-- (Eğer yoksa; özel hesap takip istekleri için)
CREATE TABLE IF NOT EXISTS public.follow_requests (
  from_user_id uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (from_user_id, to_user_id)
);

ALTER TABLE public.follow_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "follow_requests_select" ON public.follow_requests;
DROP POLICY IF EXISTS "follow_requests_insert" ON public.follow_requests;
DROP POLICY IF EXISTS "follow_requests_delete" ON public.follow_requests;

CREATE POLICY "follow_requests_select" ON public.follow_requests
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "follow_requests_insert" ON public.follow_requests
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "follow_requests_delete" ON public.follow_requests
  FOR DELETE USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);


-- ── 17. posts düzenleme (UPDATE) RLS ─────────────────────────
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_select"       ON public.posts;
DROP POLICY IF EXISTS "posts_insert"       ON public.posts;
DROP POLICY IF EXISTS "posts_update_owner" ON public.posts;
DROP POLICY IF EXISTS "posts_delete_owner" ON public.posts;

CREATE POLICY "posts_select"       ON public.posts FOR SELECT USING (true);
CREATE POLICY "posts_insert"       ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_update_owner" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "posts_delete_owner" ON public.posts FOR DELETE USING (auth.uid() = user_id);


-- ── 18. Schema cache yenile ───────────────────────────────────
NOTIFY pgrst, 'reload schema';


-- ── 19. notifications: listing_id kolonu ────────────────────
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE;


-- ── 20. profiles: last_seen + banned ─────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen  timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned     boolean NOT NULL DEFAULT false;

-- messages: image_url sütunu (zaten varsa skip)
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS image_url  text;

-- Admin kullanıcıların profiles tablosunu güncelleyebilmesi için policy
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id
    OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

NOTIFY pgrst, 'reload schema';
