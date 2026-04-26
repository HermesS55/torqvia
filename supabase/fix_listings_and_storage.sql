-- ============================================================
-- Listings tablosu eksik kolonlar + Storage bucket'ları
-- Supabase SQL Editor'da çalıştır
-- ============================================================

-- 1. Listings tablosuna eksik kolonları ekle
alter table listings
  add column if not exists description    text,
  add column if not exists budget         numeric,
  add column if not exists cover_image    text,
  add column if not exists extra_images   text[] default '{}',
  add column if not exists urgency        text not null default 'normal'
    check (urgency in ('normal', 'acil')),
  add column if not exists fuel_type      text,
  add column if not exists transmission   text,
  add column if not exists location       text,
  add column if not exists mileage        integer,
  add column if not exists service_types  text[] default '{}',
  add column if not exists show_phone     boolean not null default false,
  add column if not exists status         text not null default 'open'
    check (status in ('open', 'closed'));

-- 2. Storage bucket'larını oluştur (public erişimli)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars',        'avatars',        true, 3145728,  array['image/jpeg','image/png','image/webp','image/gif']),
  ('post-images',    'post-images',    true, 5242880,  array['image/jpeg','image/png','image/webp','image/gif']),
  ('post-videos',    'post-videos',    true, 52428800, array['video/mp4','video/quicktime','video/webm']),
  ('listing-images', 'listing-images', true, 5242880,  array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;

-- 3. Storage RLS politikaları — avatars
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_auth_upload"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "avatars_auth_update"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "avatars_auth_delete"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- 4. Storage RLS politikaları — post-images
create policy "post_images_public_read"
  on storage.objects for select
  using (bucket_id = 'post-images');

create policy "post_images_auth_upload"
  on storage.objects for insert
  with check (bucket_id = 'post-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "post_images_auth_delete"
  on storage.objects for delete
  using (bucket_id = 'post-images' and auth.uid()::text = (storage.foldername(name))[1]);

-- 5. Storage RLS politikaları — post-videos
create policy "post_videos_public_read"
  on storage.objects for select
  using (bucket_id = 'post-videos');

create policy "post_videos_auth_upload"
  on storage.objects for insert
  with check (bucket_id = 'post-videos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "post_videos_auth_delete"
  on storage.objects for delete
  using (bucket_id = 'post-videos' and auth.uid()::text = (storage.foldername(name))[1]);

-- 6. Storage RLS politikaları — listing-images
create policy "listing_images_public_read"
  on storage.objects for select
  using (bucket_id = 'listing-images');

create policy "listing_images_auth_upload"
  on storage.objects for insert
  with check (bucket_id = 'listing-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "listing_images_auth_delete"
  on storage.objects for delete
  using (bucket_id = 'listing-images' and auth.uid()::text = (storage.foldername(name))[1]);

-- 7. Schema cache'i yenile
notify pgrst, 'reload schema';
