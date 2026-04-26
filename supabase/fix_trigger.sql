-- ============================================================
-- Trigger Düzeltmesi — Kayıt hatası ve Google OAuth desteği
-- Supabase SQL Editor'da çalıştır
-- ============================================================

-- 1. phone sütununa default ver (NOT NULL kalır ama boş geçilebilir)
alter table profiles alter column phone set default '';

-- 2. Varsa eski trigger'ı sil
drop trigger if exists on_auth_user_created on auth.users;

-- 3. Sağlam trigger fonksiyonu — hem normal kayıt hem Google OAuth çalışır
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, email, role, phone, full_name, avatar_url)
  values (
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
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 4. Trigger'ı yeniden oluştur
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
