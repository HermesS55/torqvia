-- Add post_id to messages for shared post cards
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS post_id uuid REFERENCES posts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_messages_post_id ON messages(post_id) WHERE post_id IS NOT NULL;
