-- Fix community_bans RLS: separate per-command policies
-- Creator check via communities table, admin check via community_members

DROP POLICY IF EXISTS "community_bans_admin" ON community_bans;
DROP POLICY IF EXISTS "community_bans_read"  ON community_bans;

-- Anyone can read (to check own ban status or enforce on join)
CREATE POLICY "community_bans_select" ON community_bans
  FOR SELECT USING (true);

-- Creator OR admin can insert bans
CREATE POLICY "community_bans_insert" ON community_bans
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM communities WHERE id = community_bans.community_id AND created_by = auth.uid())
    OR EXISTS (SELECT 1 FROM community_members WHERE community_id = community_bans.community_id AND user_id = auth.uid() AND role = 'admin')
  );

-- Creator OR admin can update bans
CREATE POLICY "community_bans_update" ON community_bans
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM communities WHERE id = community_bans.community_id AND created_by = auth.uid())
    OR EXISTS (SELECT 1 FROM community_members WHERE community_id = community_bans.community_id AND user_id = auth.uid() AND role = 'admin')
  );

-- Creator OR admin can delete bans (unban)
CREATE POLICY "community_bans_delete" ON community_bans
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM communities WHERE id = community_bans.community_id AND created_by = auth.uid())
    OR EXISTS (SELECT 1 FROM community_members WHERE community_id = community_bans.community_id AND user_id = auth.uid() AND role = 'admin')
  );
