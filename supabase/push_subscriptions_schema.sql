-- Push subscription tablosu
create table if not exists push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  subscription jsonb not null,
  created_at timestamptz default now(),
  unique(user_id, (subscription->>'endpoint'))
);

alter table push_subscriptions enable row level security;

create policy "Kullanıcı kendi subscription'larını yönetebilir"
  on push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Notifications tablosuna from_user_name kolonu eklenmişse bu tetikleyici gereksiz
-- Database Webhook: Supabase Dashboard > Database > Webhooks > Create
-- Table: notifications, Event: INSERT, URL: Edge Function URL
