-- ============================================================
-- Pro Ratings (Araç Sahibi → Servis Uzmanı değerlendirmesi)
-- Supabase SQL Editor'da çalıştır
-- ============================================================

create table if not exists pro_ratings (
  id         uuid primary key default gen_random_uuid(),
  pro_id     uuid references profiles(id) on delete cascade not null,
  owner_id   uuid references profiles(id) on delete cascade not null,
  rating     integer not null check (rating >= 1 and rating <= 5),
  comment    text check (char_length(comment) <= 500),
  created_at timestamptz default now(),
  unique (pro_id, owner_id)
);

create index if not exists idx_ratings_pro on pro_ratings(pro_id);

alter table pro_ratings enable row level security;
create policy "ratings_select" on pro_ratings for select using (true);
create policy "ratings_insert" on pro_ratings for insert with check (auth.uid() = owner_id);
create policy "ratings_update" on pro_ratings for update using (auth.uid() = owner_id);
create policy "ratings_delete" on pro_ratings for delete using (auth.uid() = owner_id);
