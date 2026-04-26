-- ============================================================
-- AutoVerse Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ─── TRIGGER: auto-create profile on signup ─────────────────
-- Runs as SECURITY DEFINER so it bypasses RLS safely.
-- The app passes role/phone via auth.signUp options.data.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, phone, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'owner'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── PROFILES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role      TEXT NOT NULL CHECK (role IN ('owner', 'pro')),
  phone     TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── LISTINGS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.listings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  brand       TEXT NOT NULL,
  model       TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── OFFERS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.offers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  price       NUMERIC(10, 2) NOT NULL CHECK (price > 0),
  message     TEXT,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (listing_id, sender_id)
);

-- ─── INDEXES ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS listings_user_id_idx ON public.listings(user_id);
CREATE INDEX IF NOT EXISTS listings_created_at_idx ON public.listings(created_at DESC);
CREATE INDEX IF NOT EXISTS offers_listing_id_idx ON public.offers(listing_id);
CREATE INDEX IF NOT EXISTS offers_sender_id_idx ON public.offers(sender_id);
CREATE INDEX IF NOT EXISTS offers_status_idx ON public.offers(status);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers    ENABLE ROW LEVEL SECURITY;

-- ─── PROFILES POLICIES ──────────────────────────────────────

-- Any authenticated user can read any profile (needed for joining)
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can only insert their own profile
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Users can only update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ─── LISTINGS POLICIES ──────────────────────────────────────

-- All authenticated users can read all listings
CREATE POLICY "listings_select_authenticated"
  ON public.listings FOR SELECT
  TO authenticated
  USING (true);

-- Only owners can create listings
CREATE POLICY "listings_insert_owners_only"
  ON public.listings FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Only the listing owner can update their listing
CREATE POLICY "listings_update_own"
  ON public.listings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Only the listing owner can delete their listing
CREATE POLICY "listings_delete_own"
  ON public.listings FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ─── OFFERS POLICIES ────────────────────────────────────────

-- The listing owner and the offer sender can read offers
CREATE POLICY "offers_select_relevant_users"
  ON public.offers FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.listings
      WHERE listings.id = offers.listing_id
        AND listings.user_id = auth.uid()
    )
  );

-- Only pros can create offers
CREATE POLICY "offers_insert_pros_only"
  ON public.offers FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'pro'
    )
  );

-- Only the listing owner can update offer status (accept/reject)
CREATE POLICY "offers_update_listing_owner"
  ON public.offers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE listings.id = offers.listing_id
        AND listings.user_id = auth.uid()
    )
  );

-- Offer sender can delete their own pending offer
CREATE POLICY "offers_delete_own_pending"
  ON public.offers FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid() AND status = 'pending');
