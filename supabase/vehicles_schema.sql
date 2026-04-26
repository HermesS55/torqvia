-- ============================================================
-- Vehicles (Garaj - Kullanıcı araç profilleri)
-- Supabase SQL Editor'da çalıştır
-- ============================================================

create table if not exists vehicles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete cascade not null,
  brand      text not null check (char_length(brand) <= 60),
  model      text not null check (char_length(model) <= 60),
  year       integer check (year >= 1900 and year <= 2100),
  plate      text check (char_length(plate) <= 15),
  mileage    integer check (mileage >= 0),
  color      text check (char_length(color) <= 40),
  fuel_type  text check (fuel_type in ('benzin','dizel','lpg','hybrid','elektrik')),
  notes      text check (char_length(notes) <= 500),
  image_url  text,
  created_at timestamptz default now()
);

create index if not exists idx_vehicles_user on vehicles(user_id);

alter table vehicles enable row level security;
create policy "vehicles_select" on vehicles for select using (true);
create policy "vehicles_insert" on vehicles for insert with check (auth.uid() = user_id);
create policy "vehicles_update" on vehicles for update using (auth.uid() = user_id);
create policy "vehicles_delete" on vehicles for delete using (auth.uid() = user_id);
