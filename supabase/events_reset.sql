-- ============================================================
-- Events — Temiz Kurulum (önce sil, sonra yeniden oluştur)
-- Supabase SQL Editor'da TEK SEFERDE çalıştır
-- ============================================================

-- 1. Varsa eski tabloları sil
drop table if exists event_attendees cascade;
drop table if exists events cascade;

-- 2. Events tablosu
create table events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade not null,
  title       text not null,
  description text,
  event_date  timestamptz not null,
  location    text,
  category    text default 'Buluşma',
  cover_image text,
  created_at  timestamptz default now()
);

-- 3. Katılımcılar tablosu
create table event_attendees (
  event_id  uuid references events(id) on delete cascade not null,
  user_id   uuid references profiles(id) on delete cascade not null,
  joined_at timestamptz default now(),
  primary key (event_id, user_id)
);

-- 4. İndeksler
create index idx_events_date     on events(event_date);
create index idx_events_user     on events(user_id);
create index idx_event_att_event on event_attendees(event_id);

-- 5. RLS
alter table events          enable row level security;
alter table event_attendees enable row level security;

-- 6. Politikalar — events
create policy "events_select" on events for select using (true);
create policy "events_insert" on events for insert with check (auth.uid() = user_id);
create policy "events_update" on events for update using (auth.uid() = user_id);
create policy "events_delete" on events for delete using (auth.uid() = user_id);

-- 7. Politikalar — event_attendees
create policy "event_att_select" on event_attendees for select using (true);
create policy "event_att_insert" on event_attendees for insert with check (auth.uid() = user_id);
create policy "event_att_delete" on event_attendees for delete using (auth.uid() = user_id);

-- 8. Doğrulama — Bu sorgu "OK" dönmeli
select 'events tablosu hazir: ' || count(*)::text || ' kayit' as durum from events;
