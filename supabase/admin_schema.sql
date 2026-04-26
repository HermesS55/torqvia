-- ============================================================
-- Admin Role & Policies
-- Supabase SQL Editor'da çalıştır
-- ============================================================

-- 1. 'admin' rolünü CHECK kısıtına ekle
alter table profiles
  drop constraint if exists profiles_role_check;

alter table profiles
  add constraint profiles_role_check
  check (role in ('owner', 'pro', 'admin'));

-- 2. Admin kontrolü için güvenli yardımcı fonksiyon
--    SECURITY DEFINER: RLS döngüsünü önler
create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- 3. Reports: Admin okuyabilsin
drop policy if exists "reports_select_admin" on reports;
create policy "reports_select_admin" on reports
  for select using (is_admin());

-- 4. Reports: Admin silebilsin
drop policy if exists "reports_delete_admin" on reports;
create policy "reports_delete_admin" on reports
  for delete using (is_admin());

-- 5. Profiles: Admin başkasını güncelleyebilsin (ban/unban)
drop policy if exists "profiles_update_admin" on profiles;
create policy "profiles_update_admin" on profiles
  for update using (auth.uid() = id or is_admin());

-- 6. Profiles: banned kolonu ekle (yoksa)
alter table profiles
  add column if not exists banned boolean not null default false;

-- ============================================================
-- Kullanım:
-- Bir kullanıcıya admin rolü vermek için:
--   update profiles set role = 'admin' where id = 'KULLANICI_UUID';
-- ============================================================
