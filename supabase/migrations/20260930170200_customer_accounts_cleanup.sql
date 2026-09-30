-- Customer accounts + cleanup of demo operational records.
-- Menu catalog and staff/property records are intentionally preserved.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    email = excluded.email,
    phone = coalesce(excluded.phone, public.profiles.phone),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Remove prototype/duplicate operational records while retaining menu and staff details.
truncate table public.payments, public.service_requests, public.order_items, public.orders, public.dining_sessions restart identity;
update public.dining_tables set status = 'available' where status <> 'inactive';

-- Keep the seeded catalog unique by property/category/name.
with duplicates as (
  select id, row_number() over (partition by property_id, category_id, name order by created_at, id) as rn
  from public.menu_items
)
delete from public.menu_items mi
using duplicates d
where mi.id = d.id and d.rn > 1;

-- Keep one copy of each category per property and repair menu item references before deleting extras.
with duplicate_categories as (
  select id,
         first_value(id) over (partition by property_id, name order by sort_order, created_at, id) as keep_id,
         row_number() over (partition by property_id, name order by sort_order, created_at, id) as rn
  from public.menu_categories
), remap as (
  select id, keep_id from duplicate_categories where rn > 1
)
update public.menu_items mi
set category_id = remap.keep_id
from remap
where mi.category_id = remap.id;

with duplicate_categories as (
  select id,
         row_number() over (partition by property_id, name order by sort_order, created_at, id) as rn
  from public.menu_categories
)
delete from public.menu_categories mc
using duplicate_categories d
where mc.id = d.id and d.rn > 1;
