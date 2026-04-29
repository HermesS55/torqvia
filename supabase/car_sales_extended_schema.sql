-- car_sales tablosuna yeni kolonlar ekle
ALTER TABLE car_sales
  ADD COLUMN IF NOT EXISTS engine_cc     INTEGER,
  ADD COLUMN IF NOT EXISTS horse_power   INTEGER,
  ADD COLUMN IF NOT EXISTS drive_type    TEXT CHECK (drive_type IN ('fwd','rwd','awd','4wd')),
  ADD COLUMN IF NOT EXISTS damage_record TEXT DEFAULT 'yok' CHECK (damage_record IN ('yok','var','bilinmiyor')),
  ADD COLUMN IF NOT EXISTS exchange      BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS owner_count   INTEGER,
  ADD COLUMN IF NOT EXISTS city          TEXT,
  ADD COLUMN IF NOT EXISTS district      TEXT,
  ADD COLUMN IF NOT EXISTS view_count    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS damage_report JSONB DEFAULT '{}';

-- Görüntülenme sayısı için güvenli increment fonksiyonu
CREATE OR REPLACE FUNCTION increment_car_sale_views(sale_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE car_sales SET view_count = COALESCE(view_count, 0) + 1 WHERE id = sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
