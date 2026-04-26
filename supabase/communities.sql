-- ============================================================
-- Communities Feature
-- Supabase SQL Editor'da çalıştır
-- ============================================================

create table if not exists communities (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 3 and 80),
  description text check (char_length(description) <= 500),
  avatar_url  text,
  cover_url   text,
  category    text default 'Genel',
  rules       text check (char_length(rules) <= 1000),
  created_by  uuid references profiles(id) on delete cascade not null,
  is_private  boolean default false,
  created_at  timestamptz default now()
);

create table if not exists community_members (
  community_id uuid references communities(id) on delete cascade,
  user_id      uuid references profiles(id) on delete cascade,
  role         text default 'member',
  joined_at    timestamptz default now(),
  primary key (community_id, user_id)
);

create table if not exists community_posts (
  id           uuid primary key default gen_random_uuid(),
  community_id uuid references communities(id) on delete cascade not null,
  user_id      uuid references profiles(id) on delete cascade not null,
  content      text not null check (char_length(content) between 1 and 2000),
  image_url    text,
  created_at   timestamptz default now()
);

create table if not exists community_post_likes (
  post_id uuid references community_posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  primary key (post_id, user_id)
);

create table if not exists community_messages (
  id           uuid primary key default gen_random_uuid(),
  community_id uuid references communities(id) on delete cascade not null,
  user_id      uuid references profiles(id) on delete cascade not null,
  content      text not null check (char_length(content) between 1 and 1000),
  created_at   timestamptz default now()
);

-- Indexes
create index if not exists idx_comm_members_comm on community_members(community_id);
create index if not exists idx_comm_members_user on community_members(user_id);
create index if not exists idx_comm_posts_comm   on community_posts(community_id);
create index if not exists idx_comm_msgs_comm    on community_messages(community_id);
create index if not exists idx_comm_msgs_created on community_messages(community_id, created_at);

-- RLS
alter table communities          enable row level security;
alter table community_members    enable row level security;
alter table community_posts      enable row level security;
alter table community_post_likes enable row level security;
alter table community_messages   enable row level security;

-- Communities
create policy "comm_select"  on communities for select using (true);
create policy "comm_insert"  on communities for insert with check (auth.uid() = created_by);
create policy "comm_update"  on communities for update using (auth.uid() = created_by);
create policy "comm_delete"  on communities for delete using (auth.uid() = created_by);

-- Members
create policy "mem_select" on community_members for select using (true);
create policy "mem_insert" on community_members for insert with check (auth.uid() = user_id);
create policy "mem_delete" on community_members for delete using (auth.uid() = user_id);

-- Posts
create policy "cpost_select" on community_posts for select using (true);
create policy "cpost_insert" on community_posts for insert with check (
  auth.uid() = user_id and
  exists (select 1 from community_members where community_id = community_posts.community_id and user_id = auth.uid())
);
create policy "cpost_delete" on community_posts for delete using (
  auth.uid() = user_id or
  exists (select 1 from communities where id = community_posts.community_id and created_by = auth.uid())
);

-- Post likes
create policy "clike_select" on community_post_likes for select using (true);
create policy "clike_insert" on community_post_likes for insert with check (auth.uid() = user_id);
create policy "clike_delete" on community_post_likes for delete using (auth.uid() = user_id);

-- Messages
create policy "cmsg_select" on community_messages for select using (true);
create policy "cmsg_insert" on community_messages for insert with check (
  auth.uid() = user_id and
  exists (select 1 from community_members where community_id = community_messages.community_id and user_id = auth.uid())
);
