-- ============================================================
-- Follow Requests + Community Join Requests
-- Supabase SQL Editor'da çalıştır
-- ============================================================

-- Follow Requests (gizli hesaba takip isteği)
create table if not exists follow_requests (
  id           uuid primary key default gen_random_uuid(),
  from_user_id uuid references profiles(id) on delete cascade not null,
  to_user_id   uuid references profiles(id) on delete cascade not null,
  created_at   timestamptz default now(),
  unique (from_user_id, to_user_id)
);

create index if not exists idx_follow_req_to on follow_requests(to_user_id);

alter table follow_requests enable row level security;

create policy "freq_select" on follow_requests for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "freq_insert" on follow_requests for insert
  with check (auth.uid() = from_user_id);

create policy "freq_delete" on follow_requests for delete
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);


-- Community Join Requests (özel topluluğa katılma isteği)
create table if not exists community_join_requests (
  id           uuid primary key default gen_random_uuid(),
  community_id uuid references communities(id) on delete cascade not null,
  user_id      uuid references profiles(id) on delete cascade not null,
  created_at   timestamptz default now(),
  unique (community_id, user_id)
);

create index if not exists idx_cjr_community on community_join_requests(community_id);

alter table community_join_requests enable row level security;

create policy "cjr_select" on community_join_requests for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from community_members
      where community_id = community_join_requests.community_id
        and user_id = auth.uid()
        and role = 'admin'
    )
    or exists (
      select 1 from communities
      where id = community_join_requests.community_id
        and created_by = auth.uid()
    )
  );

create policy "cjr_insert" on community_join_requests for insert
  with check (auth.uid() = user_id);

create policy "cjr_delete" on community_join_requests for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from community_members
      where community_id = community_join_requests.community_id
        and user_id = auth.uid()
        and role = 'admin'
    )
    or exists (
      select 1 from communities
      where id = community_join_requests.community_id
        and created_by = auth.uid()
    )
  );
