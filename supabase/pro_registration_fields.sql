-- ============================================================
-- Pro Kayıt Alanları Migration
-- Supabase Dashboard SQL Editor'da çalıştır
-- ============================================================

-- ── 1. YENİ KOLONLAR ────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS shop_name text,
  ADD COLUMN IF NOT EXISTS city      text;

-- specialties: önce NOT NULL olmadan ekle, sonra güvenli geçiş yap
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialties text[] DEFAULT '{}';
UPDATE profiles SET specialties = '{}' WHERE specialties IS NULL;
ALTER TABLE profiles ALTER COLUMN specialties SET NOT NULL;

-- ── 2. TRIGGER GÜNCELLEMESİ ─────────────────────────────────

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, role, phone, full_name, avatar_url, shop_name, city, specialties)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'owner'),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      ''
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture',
      null
    ),
    new.raw_user_meta_data->>'shop_name',
    new.raw_user_meta_data->>'city',
    CASE
      WHEN jsonb_typeof(new.raw_user_meta_data->'specialties') = 'array'
        THEN array(SELECT jsonb_array_elements_text(new.raw_user_meta_data->'specialties'))
      ELSE '{}'::text[]
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
