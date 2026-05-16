-- Community bans table
CREATE TABLE IF NOT EXISTS community_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES communities(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  banned_until timestamptz, -- NULL = permanent
  created_at timestamptz DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- RLS
ALTER TABLE community_bans ENABLE ROW LEVEL SECURITY;

-- Admins/creators can manage bans
CREATE POLICY "community_bans_admin" ON community_bans
  USING (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = community_bans.community_id
        AND user_id = auth.uid()
        AND role IN ('admin', 'creator')
    )
  );

-- Anyone can read bans (to check if they're banned)
CREATE POLICY "community_bans_read" ON community_bans
  FOR SELECT USING (true);
