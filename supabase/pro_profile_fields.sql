-- Pro kullanıcılar için ek profil alanları
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS service_hours    text,
  ADD COLUMN IF NOT EXISTS location         text,
  ADD COLUMN IF NOT EXISTS price_range      text,
  ADD COLUMN IF NOT EXISTS notification_prefs jsonb NOT NULL DEFAULT '{
    "likes": true,
    "comments": true,
    "follows": true,
    "messages": true,
    "offers": true,
    "offer_accepted": true,
    "offer_rejected": true
  }'::jsonb;

-- Offers: pro kullanıcının kendi gönderdiği teklifleri görebilmesi için RLS policy
-- (Eğer offers tablosunda sadece listing sahibine okuma yetkisi veriliyorsa bu eksik olur)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='offers' AND policyname='Teklif sahibi kendi tekliflerini görebilir'
  ) THEN
    CREATE POLICY "Teklif sahibi kendi tekliflerini görebilir"
      ON public.offers FOR SELECT
      USING (auth.uid() = sender_id OR auth.uid() IN (
        SELECT user_id FROM public.listings WHERE id = listing_id
      ));
  END IF;
END $$;
