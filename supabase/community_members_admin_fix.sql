-- Fix: community_members tablosuna UPDATE politikası ekle,
-- DELETE politikasını creator + admin kabiliyetli hale getir

-- Eski delete politikasını kaldır (sadece self-delete izin veriyordu)
DROP POLICY IF EXISTS "mem_delete" ON community_members;
DROP POLICY IF EXISTS "cm_delete"  ON community_members;

-- Yeni DELETE: kendi çıkma + creator kick + admin kick (admin başka admin'i kickleyemez)
CREATE POLICY "cm_delete_v2" ON community_members
  FOR DELETE USING (
    -- Kullanıcı kendi üyeliğini silebilir (topluluktan ayrılma)
    auth.uid() = user_id
    OR
    -- Topluluk kurucusu herkesi çıkarabilir
    EXISTS (SELECT 1 FROM communities WHERE id = community_id AND created_by = auth.uid())
    OR
    -- Adminler non-admin üyeleri çıkarabilir
    EXISTS (
      SELECT 1 FROM community_members self_cm
      WHERE self_cm.community_id = community_members.community_id
        AND self_cm.user_id = auth.uid()
        AND self_cm.role = 'admin'
        AND community_members.role != 'admin'
    )
  );

-- Yeni UPDATE: creator veya admin, üye rollerini güncelleyebilir
CREATE POLICY "cm_update_v2" ON community_members
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM communities WHERE id = community_id AND created_by = auth.uid())
    OR EXISTS (
      SELECT 1 FROM community_members self_cm
      WHERE self_cm.community_id = community_members.community_id
        AND self_cm.user_id = auth.uid()
        AND self_cm.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM communities WHERE id = community_id AND created_by = auth.uid())
    OR EXISTS (
      SELECT 1 FROM community_members self_cm
      WHERE self_cm.community_id = community_members.community_id
        AND self_cm.user_id = auth.uid()
        AND self_cm.role = 'admin'
    )
  );
