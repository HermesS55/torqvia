-- ── Garage: vehicles table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicles (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID         REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  brand      TEXT         NOT NULL,
  model      TEXT         NOT NULL,
  year       INTEGER,
  plate      TEXT,
  mileage    INTEGER,
  color      TEXT,
  fuel_type  TEXT,
  notes      TEXT,
  image_url  TEXT,
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vehicles_select" ON vehicles FOR SELECT USING (true);
CREATE POLICY "vehicles_insert" ON vehicles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "vehicles_update" ON vehicles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "vehicles_delete" ON vehicles FOR DELETE USING (user_id = auth.uid());

-- ── Onboarding flag ──────────────────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_done BOOLEAN DEFAULT FALSE;

-- Existing users with a name skip onboarding
UPDATE profiles SET onboarding_done = TRUE
WHERE (full_name IS NOT NULL AND full_name != '') OR created_at < NOW() - INTERVAL '5 minutes';
