-- ============================================================
-- Torqvia — Events & Event Attendees
-- Supabase SQL Editor'da çalıştır
-- ============================================================

create table if not exists events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade not null,
  title       text not null check (char_length(title) <= 120),
  description text check (char_length(description) <= 500),
  event_date  timestamptz not null,
  location    text check (char_length(location) <= 200),
  category    text default 'Etkinlik',
  cover_image text,
  created_at  timestamptz default now()
);

create table if not exists event_attendees (
  event_id  uuid references events(id) on delete cascade not null,
  user_id   uuid references profiles(id) on delete cascade not null,
  joined_at timestamptz default now(),
  primary key (event_id, user_id)
);

create index if not exists idx_events_date      on events(event_date);
create index if not exists idx_events_user      on events(user_id);
create index if not exists idx_event_att_event  on event_attendees(event_id);

alter table events enable row level security;
alter table event_attendees enable row level security;

drop policy if exists "events_select"   on events;
drop policy if exists "events_insert"   on events;
drop policy if exists "events_update"   on events;
drop policy if exists "events_delete"   on events;

create policy "events_select" on events for select using (true);
create policy "events_insert" on events for insert with check (auth.uid() = user_id);
create policy "events_update" on events for update using (auth.uid() = user_id);
create policy "events_delete" on events for delete using (auth.uid() = user_id);

drop policy if exists "event_att_select" on event_attendees;
drop policy if exists "event_att_insert" on event_attendees;
drop policy if exists "event_att_delete" on event_attendees;

create policy "event_att_select" on event_attendees for select using (true);
create policy "event_att_insert" on event_attendees for insert with check (auth.uid() = user_id);
create policy "event_att_delete" on event_attendees for delete using (auth.uid() = user_id);
