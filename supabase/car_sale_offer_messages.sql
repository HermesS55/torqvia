-- Car sale offer fields in messages table
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS offer_amount numeric,
  ADD COLUMN IF NOT EXISTS sale_id uuid REFERENCES car_sales(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS offer_status text CHECK (offer_status IN ('pending', 'accepted', 'rejected', 'countered'));

-- Index for quick lookup of offers by sale
CREATE INDEX IF NOT EXISTS idx_messages_sale_id ON messages(sale_id) WHERE sale_id IS NOT NULL;
