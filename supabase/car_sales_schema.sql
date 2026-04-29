-- ============================================================
-- car_sales tablosu
-- ============================================================
CREATE TABLE IF NOT EXISTS car_sales (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id    UUID REFERENCES vehicles(id) ON DELETE SET NULL,

  brand         TEXT NOT NULL,
  model         TEXT NOT NULL,
  year          INTEGER,
  mileage       INTEGER,
  fuel_type     TEXT CHECK (fuel_type IN ('benzin','dizel','lpg','hybrid','elektrik')),
  transmission  TEXT CHECK (transmission IN ('manuel','otomatik','yari_otomatik')),
  color         TEXT,
  price         NUMERIC(12,2) NOT NULL CHECK (price > 0),
  description   TEXT,
  location      TEXT,
  show_phone    BOOLEAN DEFAULT FALSE,

  cover_image   TEXT,
  extra_images  TEXT[] DEFAULT '{}',

  status        TEXT DEFAULT 'active' CHECK (status IN ('active','sold','closed')),

  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- car_sale_favorites tablosu (kalıcı favoriler)
-- ============================================================
CREATE TABLE IF NOT EXISTS car_sale_favorites (
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sale_id     UUID REFERENCES car_sales(id)  ON DELETE CASCADE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, sale_id)
);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE car_sales          ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_sale_favorites ENABLE ROW LEVEL SECURITY;

-- Herkese okuma (aktif ilanlar)
CREATE POLICY "car_sales: public read active"
  ON car_sales FOR SELECT
  USING (status = 'active' OR auth.uid() = user_id);

-- Sadece kendi ilanını ekle
CREATE POLICY "car_sales: insert own"
  ON car_sales FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Sadece kendi ilanını güncelle
CREATE POLICY "car_sales: update own"
  ON car_sales FOR UPDATE
  USING (auth.uid() = user_id);

-- Sadece kendi ilanını sil
CREATE POLICY "car_sales: delete own"
  ON car_sales FOR DELETE
  USING (auth.uid() = user_id);

-- Favoriler: kendi kayıtlarını oku/yaz/sil
CREATE POLICY "favorites: select own"
  ON car_sale_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "favorites: insert own"
  ON car_sale_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favorites: delete own"
  ON car_sale_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- İndeksler
-- ============================================================
CREATE INDEX IF NOT EXISTS car_sales_user_id_idx    ON car_sales(user_id);
CREATE INDEX IF NOT EXISTS car_sales_status_idx     ON car_sales(status);
CREATE INDEX IF NOT EXISTS car_sales_brand_idx      ON car_sales(brand);
CREATE INDEX IF NOT EXISTS car_sales_price_idx      ON car_sales(price);
CREATE INDEX IF NOT EXISTS car_sales_created_at_idx ON car_sales(created_at DESC);

-- updated_at otomatik güncellensin
CREATE OR REPLACE FUNCTION update_car_sales_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER car_sales_updated_at
  BEFORE UPDATE ON car_sales
  FOR EACH ROW EXECUTE FUNCTION update_car_sales_updated_at();
