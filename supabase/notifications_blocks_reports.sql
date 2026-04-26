-- ============================================================
-- Notifications, Blocks, Reports + Pinned Post + Delete Account
-- Supabase SQL Editor'da çalıştır
-- ============================================================

-- Notifications
create table if not exists notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references profiles(id) on delete cascade not null,
  type         text not null, -- 'like' | 'comment' | 'follow' | 'message' | 'mention'
  from_user_id uuid references profiles(id) on delete cascade,
  post_id      uuid references posts(id) on delete cascade,
  message      text,
  read         boolean default false,
  created_at   timestamptz default now()
);

create index if not exists idx_notifs_user_created on notifications(user_id, created_at desc);

alter table notifications enable row level security;
create policy "notifs_select" on notifications for select using (auth.uid() = user_id);
create policy "notifs_insert" on notifications for insert with check (auth.uid() = from_user_id or from_user_id is null);
create policy "notifs_update" on notifications for update using (auth.uid() = user_id);
create policy "notifs_delete" on notifications for delete using (auth.uid() = user_id);

-- Blocks
create table if not exists blocks (
  blocker_id uuid references profiles(id) on delete cascade,
  blocked_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (blocker_id, blocked_id)
);

alter table blocks enable row level security;
create policy "blocks_select" on blocks for select using (auth.uid() = blocker_id);
create policy "blocks_insert" on blocks for insert with check (auth.uid() = blocker_id);
create policy "blocks_delete" on blocks for delete using (auth.uid() = blocker_id);

-- Reports
create table if not exists reports (
  id               uuid primary key default gen_random_uuid(),
  reporter_id      uuid references profiles(id) on delete cascade not null,
  reported_user_id uuid references profiles(id) on delete set null,
  post_id          uuid references posts(id) on delete set null,
  reason           text not null,
  created_at       timestamptz default now()
);

alter table reports enable row level security;
create policy "reports_insert" on reports for insert with check (auth.uid() = reporter_id);

-- Pinned post column on profiles
alter table profiles add column if not exists pinned_post_id uuid references posts(id) on delete set null;

-- Private account column on profiles
alter table profiles add column if not exists private_account boolean default false;

-- Account self-deletion RPC
create or replace function delete_my_account()
returns void
language plpgsql
security definer
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  delete from profiles where id = auth.uid();
end;
$$;
