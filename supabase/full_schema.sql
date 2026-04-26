-- ============================================================
-- TORQVIA — TAM SCHEMA
-- Supabase SQL Editor'da TEK SEFERDE çalıştır
-- Mevcut tabloları bozmaz (IF NOT EXISTS / ON CONFLICT)
-- ============================================================

-- ── 1. PROFILES ─────────────────────────────────────────────
create table if not exists profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text,
  email           text,
  role            text not null default 'owner' check (role in ('owner', 'pro')),
  avatar_url      text,
  bio             text check (char_length(bio) <= 500),
  specialty       text check (char_length(specialty) <= 100),
  skills          text[] default '{}',
  website         text,
  phone           text,
  phone_public    boolean not null default false,
  plan            text not null default 'free' check (plan in ('free', 'turbo', 'elite')),
  private_account boolean not null default false,
  pinned_post_id  uuid,
  created_at      timestamptz default now()
);

alter table profiles
  add column if not exists full_name       text,
  add column if not exists email           text,
  add column if not exists avatar_url      text,
  add column if not exists bio             text,
  add column if not exists specialty       text,
  add column if not exists skills          text[] default '{}',
  add column if not exists website         text,
  add column if not exists phone           text,
  add column if not exists phone_public    boolean not null default false,
  add column if not exists plan            text not null default 'free',
  add column if not exists private_account boolean not null default false,
  add column if not exists pinned_post_id  uuid;

alter table profiles enable row level security;
drop policy if exists "profiles_select" on profiles;
drop policy if exists "profiles_insert" on profiles;
drop policy if exists "profiles_update" on profiles;
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'owner')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── 2. POSTS ────────────────────────────────────────────────
create table if not exists posts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete cascade not null,
  content    text check (char_length(content) <= 2000),
  image_url  text,
  video_url  text,
  repost_of  uuid references posts(id) on delete set null,
  created_at timestamptz default now()
);

alter table posts enable row level security;
drop policy if exists "posts_select" on posts;
drop policy if exists "posts_insert" on posts;
drop policy if exists "posts_delete" on posts;
create policy "posts_select" on posts for select using (true);
create policy "posts_insert" on posts for insert with check (auth.uid() = user_id);
create policy "posts_delete" on posts for delete using (auth.uid() = user_id);

create index if not exists idx_posts_user    on posts(user_id);
create index if not exists idx_posts_created on posts(created_at desc);

-- ── 3. POST LIKES ───────────────────────────────────────────
create table if not exists post_likes (
  id      uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  unique (post_id, user_id)
);

alter table post_likes enable row level security;
drop policy if exists "post_likes_select" on post_likes;
drop policy if exists "post_likes_insert" on post_likes;
drop policy if exists "post_likes_delete" on post_likes;
create policy "post_likes_select" on post_likes for select using (true);
create policy "post_likes_insert" on post_likes for insert with check (auth.uid() = user_id);
create policy "post_likes_delete" on post_likes for delete using (auth.uid() = user_id);

-- ── 4. POST COMMENTS ────────────────────────────────────────
create table if not exists post_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid references posts(id) on delete cascade not null,
  user_id    uuid references profiles(id) on delete cascade not null,
  content    text not null check (char_length(content) <= 500),
  created_at timestamptz default now()
);

alter table post_comments enable row level security;
drop policy if exists "comments_select" on post_comments;
drop policy if exists "comments_insert" on post_comments;
drop policy if exists "comments_delete" on post_comments;
create policy "comments_select" on post_comments for select using (true);
create policy "comments_insert" on post_comments for insert with check (auth.uid() = user_id);
create policy "comments_delete" on post_comments for delete using (auth.uid() = user_id);

create index if not exists idx_comments_post on post_comments(post_id);

-- ── 5. POST TAGS ────────────────────────────────────────────
create table if not exists post_tags (
  id             uuid primary key default gen_random_uuid(),
  post_id        uuid references posts(id) on delete cascade not null,
  tagged_user_id uuid references profiles(id) on delete cascade not null,
  unique (post_id, tagged_user_id)
);

alter table post_tags enable row level security;
drop policy if exists "post_tags_select" on post_tags;
drop policy if exists "post_tags_insert" on post_tags;
create policy "post_tags_select" on post_tags for select using (true);
create policy "post_tags_insert" on post_tags for insert with check (auth.uid() in (
  select user_id from posts where id = post_id
));

-- ── 6. FOLLOWS ──────────────────────────────────────────────
create table if not exists follows (
  id           uuid primary key default gen_random_uuid(),
  follower_id  uuid references profiles(id) on delete cascade not null,
  following_id uuid references profiles(id) on delete cascade not null,
  unique (follower_id, following_id)
);

alter table follows enable row level security;
drop policy if exists "follows_select" on follows;
drop policy if exists "follows_insert" on follows;
drop policy if exists "follows_delete" on follows;
create policy "follows_select" on follows for select using (true);
create policy "follows_insert" on follows for insert with check (auth.uid() = follower_id);
create policy "follows_delete" on follows for delete using (auth.uid() = follower_id);

create index if not exists idx_follows_follower  on follows(follower_id);
create index if not exists idx_follows_following on follows(following_id);

-- ── 7. FOLLOW REQUESTS ──────────────────────────────────────
create table if not exists follow_requests (
  id           uuid primary key default gen_random_uuid(),
  from_user_id uuid references profiles(id) on delete cascade not null,
  to_user_id   uuid references profiles(id) on delete cascade not null,
  created_at   timestamptz default now(),
  unique (from_user_id, to_user_id)
);

alter table follow_requests enable row level security;
drop policy if exists "freq_select" on follow_requests;
drop policy if exists "freq_insert" on follow_requests;
drop policy if exists "freq_delete" on follow_requests;
create policy "freq_select"  on follow_requests for select using (auth.uid() in (from_user_id, to_user_id));
create policy "freq_insert"  on follow_requests for insert with check (auth.uid() = from_user_id);
create policy "freq_delete"  on follow_requests for delete using (auth.uid() in (from_user_id, to_user_id));

-- ── 8. BLOCKS ───────────────────────────────────────────────
create table if not exists blocks (
  id         uuid primary key default gen_random_uuid(),
  blocker_id uuid references profiles(id) on delete cascade not null,
  blocked_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (blocker_id, blocked_id)
);

alter table blocks enable row level security;
drop policy if exists "blocks_select" on blocks;
drop policy if exists "blocks_insert" on blocks;
drop policy if exists "blocks_delete" on blocks;
create policy "blocks_select" on blocks for select using (auth.uid() = blocker_id);
create policy "blocks_insert" on blocks for insert with check (auth.uid() = blocker_id);
create policy "blocks_delete" on blocks for delete using (auth.uid() = blocker_id);

-- ── 9. REPORTS ──────────────────────────────────────────────
create table if not exists reports (
  id             uuid primary key default gen_random_uuid(),
  reporter_id    uuid references profiles(id) on delete cascade not null,
  target_user_id uuid references profiles(id) on delete cascade not null,
  reason         text not null check (char_length(reason) <= 500),
  created_at     timestamptz default now()
);

alter table reports enable row level security;
drop policy if exists "reports_insert" on reports;
create policy "reports_insert" on reports for insert with check (auth.uid() = reporter_id);

-- ── 10. NOTIFICATIONS ───────────────────────────────────────
create table if not exists notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references profiles(id) on delete cascade not null,
  type         text not null,
  from_user_id uuid references profiles(id) on delete cascade,
  post_id      uuid references posts(id) on delete cascade,
  message      text,
  read         boolean not null default false,
  created_at   timestamptz default now()
);

alter table notifications enable row level security;
drop policy if exists "notifs_select" on notifications;
drop policy if exists "notifs_insert" on notifications;
drop policy if exists "notifs_update" on notifications;
drop policy if exists "notifs_delete" on notifications;
create policy "notifs_select" on notifications for select using (auth.uid() = user_id);
create policy "notifs_insert" on notifications for insert with check (true);
create policy "notifs_update" on notifications for update using (auth.uid() = user_id);
create policy "notifs_delete" on notifications for delete using (auth.uid() = user_id);

create index if not exists idx_notifs_user on notifications(user_id, created_at desc);

-- ── 11. MESSAGES ────────────────────────────────────────────
create table if not exists messages (
  id          uuid primary key default gen_random_uuid(),
  sender_id   uuid references profiles(id) on delete cascade not null,
  receiver_id uuid references profiles(id) on delete cascade not null,
  content     text not null check (char_length(content) <= 2000),
  read        boolean not null default false,
  created_at  timestamptz default now()
);

alter table messages enable row level security;
drop policy if exists "messages_select" on messages;
drop policy if exists "messages_insert" on messages;
drop policy if exists "messages_update" on messages;
create policy "messages_select" on messages for select using (auth.uid() in (sender_id, receiver_id));
create policy "messages_insert" on messages for insert with check (auth.uid() = sender_id);
create policy "messages_update" on messages for update using (auth.uid() in (sender_id, receiver_id));

create index if not exists idx_messages_sender   on messages(sender_id);
create index if not exists idx_messages_receiver on messages(receiver_id);
create index if not exists idx_messages_created  on messages(created_at);

-- ── 12. LISTINGS ────────────────────────────────────────────
create table if not exists listings (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) on delete cascade not null,
  brand         text not null,
  model         text not null,
  year          integer,
  mileage       integer,
  fuel_type     text,
  transmission  text,
  location      text,
  budget        numeric,
  urgency       text not null default 'normal' check (urgency in ('normal', 'acil')),
  service_types text[] default '{}',
  description   text,
  show_phone    boolean not null default false,
  cover_image   text,
  extra_images  text[] default '{}',
  status        text not null default 'open' check (status in ('open', 'closed')),
  created_at    timestamptz default now()
);

alter table listings
  add column if not exists brand         text,
  add column if not exists model         text,
  add column if not exists year          integer,
  add column if not exists mileage       integer,
  add column if not exists fuel_type     text,
  add column if not exists transmission  text,
  add column if not exists location      text,
  add column if not exists budget        numeric,
  add column if not exists urgency       text not null default 'normal',
  add column if not exists service_types text[] default '{}',
  add column if not exists description   text,
  add column if not exists show_phone    boolean not null default false,
  add column if not exists cover_image   text,
  add column if not exists extra_images  text[] default '{}',
  add column if not exists status        text not null default 'open';

alter table listings enable row level security;
drop policy if exists "listings_select" on listings;
drop policy if exists "listings_insert" on listings;
drop policy if exists "listings_update" on listings;
drop policy if exists "listings_delete" on listings;
create policy "listings_select" on listings for select using (true);
create policy "listings_insert" on listings for insert with check (auth.uid() = user_id);
create policy "listings_update" on listings for update using (auth.uid() = user_id);
create policy "listings_delete" on listings for delete using (auth.uid() = user_id);

create index if not exists idx_listings_user    on listings(user_id);
create index if not exists idx_listings_created on listings(created_at desc);

-- ── 13. OFFERS ──────────────────────────────────────────────
create table if not exists offers (
  id               uuid primary key default gen_random_uuid(),
  listing_id       uuid references listings(id) on delete cascade not null,
  sender_id        uuid references profiles(id) on delete cascade not null,
  price            numeric not null check (price > 0),
  message          text check (char_length(message) <= 1000),
  status           text not null default 'pending'
                     check (status in ('pending', 'accepted', 'rejected', 'completed')),
  appointment_date timestamptz,
  appointment_note text check (char_length(appointment_note) <= 200),
  created_at       timestamptz default now()
);

alter table offers
  add column if not exists appointment_date timestamptz,
  add column if not exists appointment_note text;

do $$ begin
  alter table offers drop constraint if exists offers_status_check;
  alter table offers add constraint offers_status_check
    check (status in ('pending', 'accepted', 'rejected', 'completed'));
exception when others then null; end $$;

alter table offers enable row level security;
drop policy if exists "offers_select" on offers;
drop policy if exists "offers_insert" on offers;
drop policy if exists "offers_update" on offers;
drop policy if exists "offers_delete" on offers;
create policy "offers_select" on offers for select using (
  auth.uid() = sender_id or
  auth.uid() in (select user_id from listings where id = listing_id)
);
create policy "offers_insert" on offers for insert with check (auth.uid() = sender_id);
create policy "offers_update" on offers for update using (
  auth.uid() = sender_id or
  auth.uid() in (select user_id from listings where id = listing_id)
);
create policy "offers_delete" on offers for delete using (auth.uid() = sender_id);

create index if not exists idx_offers_listing on offers(listing_id);
create index if not exists idx_offers_sender  on offers(sender_id);

-- ── 14. VEHICLES (GARAJ) ────────────────────────────────────
create table if not exists vehicles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete cascade not null,
  brand      text not null,
  model      text not null,
  year       integer,
  plate      text,
  mileage    integer,
  color      text,
  fuel_type  text,
  notes      text check (char_length(notes) <= 500),
  image_url  text,
  created_at timestamptz default now()
);

alter table vehicles enable row level security;
drop policy if exists "vehicles_select" on vehicles;
drop policy if exists "vehicles_insert" on vehicles;
drop policy if exists "vehicles_update" on vehicles;
drop policy if exists "vehicles_delete" on vehicles;
create policy "vehicles_select" on vehicles for select using (true);
create policy "vehicles_insert" on vehicles for insert with check (auth.uid() = user_id);
create policy "vehicles_update" on vehicles for update using (auth.uid() = user_id);
create policy "vehicles_delete" on vehicles for delete using (auth.uid() = user_id);

create index if not exists idx_vehicles_user on vehicles(user_id);

-- ── 15. PRO RATINGS ─────────────────────────────────────────
create table if not exists pro_ratings (
  id         uuid primary key default gen_random_uuid(),
  pro_id     uuid references profiles(id) on delete cascade not null,
  owner_id   uuid references profiles(id) on delete cascade not null,
  rating     integer not null check (rating >= 1 and rating <= 5),
  comment    text check (char_length(comment) <= 500),
  created_at timestamptz default now(),
  unique (pro_id, owner_id)
);

alter table pro_ratings enable row level security;
drop policy if exists "ratings_select" on pro_ratings;
drop policy if exists "ratings_insert" on pro_ratings;
drop policy if exists "ratings_update" on pro_ratings;
drop policy if exists "ratings_delete" on pro_ratings;
create policy "ratings_select" on pro_ratings for select using (true);
create policy "ratings_insert" on pro_ratings for insert with check (auth.uid() = owner_id);
create policy "ratings_update" on pro_ratings for update using (auth.uid() = owner_id);
create policy "ratings_delete" on pro_ratings for delete using (auth.uid() = owner_id);

create index if not exists idx_ratings_pro on pro_ratings(pro_id);

-- ── 16. COMMUNITIES ─────────────────────────────────────────
create table if not exists communities (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) <= 80),
  description text check (char_length(description) <= 500),
  category   text,
  rules      text,
  avatar_url text,
  cover_url  text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

alter table communities enable row level security;
drop policy if exists "communities_select" on communities;
drop policy if exists "communities_insert" on communities;
drop policy if exists "communities_update" on communities;
drop policy if exists "communities_delete" on communities;
create policy "communities_select" on communities for select using (true);
create policy "communities_insert" on communities for insert with check (auth.uid() = created_by);
create policy "communities_update" on communities for update using (auth.uid() = created_by);
create policy "communities_delete" on communities for delete using (auth.uid() = created_by);

-- ── 17. COMMUNITY MEMBERS ───────────────────────────────────
create table if not exists community_members (
  id           uuid primary key default gen_random_uuid(),
  community_id uuid references communities(id) on delete cascade not null,
  user_id      uuid references profiles(id) on delete cascade not null,
  role         text not null default 'member' check (role in ('member', 'moderator', 'admin')),
  joined_at    timestamptz default now(),
  unique (community_id, user_id)
);

alter table community_members enable row level security;
drop policy if exists "cm_select" on community_members;
drop policy if exists "cm_insert" on community_members;
drop policy if exists "cm_delete" on community_members;
create policy "cm_select" on community_members for select using (true);
create policy "cm_insert" on community_members for insert with check (auth.uid() = user_id);
create policy "cm_delete" on community_members for delete using (auth.uid() = user_id);

create index if not exists idx_cm_community on community_members(community_id);
create index if not exists idx_cm_user      on community_members(user_id);

-- ── 18. COMMUNITY POSTS ─────────────────────────────────────
create table if not exists community_posts (
  id           uuid primary key default gen_random_uuid(),
  community_id uuid references communities(id) on delete cascade not null,
  user_id      uuid references profiles(id) on delete cascade not null,
  content      text not null check (char_length(content) <= 2000),
  image_url    text,
  created_at   timestamptz default now()
);

alter table community_posts enable row level security;
drop policy if exists "cp_select" on community_posts;
drop policy if exists "cp_insert" on community_posts;
drop policy if exists "cp_delete" on community_posts;
create policy "cp_select" on community_posts for select using (true);
create policy "cp_insert" on community_posts for insert with check (auth.uid() = user_id);
create policy "cp_delete" on community_posts for delete using (auth.uid() = user_id);

create index if not exists idx_cp_community on community_posts(community_id);

-- ── 19. COMMUNITY POST LIKES ────────────────────────────────
create table if not exists community_post_likes (
  id      uuid primary key default gen_random_uuid(),
  post_id uuid references community_posts(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  unique (post_id, user_id)
);

alter table community_post_likes enable row level security;
drop policy if exists "cpl_select" on community_post_likes;
drop policy if exists "cpl_insert" on community_post_likes;
drop policy if exists "cpl_delete" on community_post_likes;
create policy "cpl_select" on community_post_likes for select using (true);
create policy "cpl_insert" on community_post_likes for insert with check (auth.uid() = user_id);
create policy "cpl_delete" on community_post_likes for delete using (auth.uid() = user_id);

-- ── 20. COMMUNITY MESSAGES ──────────────────────────────────
create table if not exists community_messages (
  id           uuid primary key default gen_random_uuid(),
  community_id uuid references communities(id) on delete cascade not null,
  user_id      uuid references profiles(id) on delete cascade not null,
  content      text not null check (char_length(content) <= 1000),
  created_at   timestamptz default now()
);

alter table community_messages enable row level security;
drop policy if exists "cmsgs_select" on community_messages;
drop policy if exists "cmsgs_insert" on community_messages;
create policy "cmsgs_select" on community_messages for select using (true);
create policy "cmsgs_insert" on community_messages for insert with check (auth.uid() = user_id);

create index if not exists idx_cmsgs_community on community_messages(community_id);

-- ── 21. STORAGE BUCKETS ─────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars',        'avatars',        true, 3145728,   array['image/jpeg','image/png','image/webp','image/gif']),
  ('post-images',    'post-images',    true, 5242880,   array['image/jpeg','image/png','image/webp','image/gif']),
  ('post-videos',    'post-videos',    true, 52428800,  array['video/mp4','video/quicktime','video/webm']),
  ('listing-images', 'listing-images', true, 5242880,   array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;

-- Storage RLS policies
do $$ begin

  -- avatars
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='avatars_read') then
    create policy "avatars_read"   on storage.objects for select using (bucket_id = 'avatars');
  end if;
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='avatars_write') then
    create policy "avatars_write"  on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
  end if;
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='avatars_update') then
    create policy "avatars_update" on storage.objects for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
  end if;
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='avatars_delete') then
    create policy "avatars_delete" on storage.objects for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
  end if;

  -- post-images
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='post_images_read') then
    create policy "post_images_read"  on storage.objects for select using (bucket_id = 'post-images');
  end if;
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='post_images_write') then
    create policy "post_images_write" on storage.objects for insert with check (bucket_id = 'post-images' and auth.uid()::text = (storage.foldername(name))[1]);
  end if;
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='post_images_delete') then
    create policy "post_images_delete" on storage.objects for delete using (bucket_id = 'post-images' and auth.uid()::text = (storage.foldername(name))[1]);
  end if;

  -- post-videos
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='post_videos_read') then
    create policy "post_videos_read"  on storage.objects for select using (bucket_id = 'post-videos');
  end if;
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='post_videos_write') then
    create policy "post_videos_write" on storage.objects for insert with check (bucket_id = 'post-videos' and auth.uid()::text = (storage.foldername(name))[1]);
  end if;
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='post_videos_delete') then
    create policy "post_videos_delete" on storage.objects for delete using (bucket_id = 'post-videos' and auth.uid()::text = (storage.foldername(name))[1]);
  end if;

  -- listing-images
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='listing_images_read') then
    create policy "listing_images_read"  on storage.objects for select using (bucket_id = 'listing-images');
  end if;
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='listing_images_write') then
    create policy "listing_images_write" on storage.objects for insert with check (bucket_id = 'listing-images' and auth.uid()::text = (storage.foldername(name))[1]);
  end if;
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='listing_images_delete') then
    create policy "listing_images_delete" on storage.objects for delete using (bucket_id = 'listing-images' and auth.uid()::text = (storage.foldername(name))[1]);
  end if;

end $$;

-- ── 22. SCHEMA CACHE YENİLE ─────────────────────────────────
notify pgrst, 'reload schema';
