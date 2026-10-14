-- Menu photos are publicly readable so customer QR menus can display them.
-- Only active owners/admins/managers may upload, update, or delete images
-- inside their own property's folder (first path segment is property UUID).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-photos', 'menu-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Menu photos are publicly readable" on storage.objects;
create policy "Menu photos are publicly readable"
on storage.objects for select
using (bucket_id = 'menu-photos');

drop policy if exists "Restaurant staff upload menu photos" on storage.objects;
create policy "Restaurant staff upload menu photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'menu-photos'
  and public.has_property_role(
    ((storage.foldername(name))[1])::uuid,
    array['owner', 'admin', 'manager']::text[]
  )
);

drop policy if exists "Restaurant staff update menu photos" on storage.objects;
create policy "Restaurant staff update menu photos"
on storage.objects for update to authenticated
using (
  bucket_id = 'menu-photos'
  and public.has_property_role(
    ((storage.foldername(name))[1])::uuid,
    array['owner', 'admin', 'manager']::text[]
  )
)
with check (
  bucket_id = 'menu-photos'
  and public.has_property_role(
    ((storage.foldername(name))[1])::uuid,
    array['owner', 'admin', 'manager']::text[]
  )
);

drop policy if exists "Restaurant staff delete menu photos" on storage.objects;
create policy "Restaurant staff delete menu photos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'menu-photos'
  and public.has_property_role(
    ((storage.foldername(name))[1])::uuid,
    array['owner', 'admin', 'manager']::text[]
  )
);
