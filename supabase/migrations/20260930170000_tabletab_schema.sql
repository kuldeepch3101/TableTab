create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug text not null unique,
  email_domain text not null unique,
  cuisine text,
  phone text,
  address text,
  table_count integer not null default 1 check (table_count between 1 and 500),
  currency_code text not null default 'USD',
  timezone text not null default 'UTC',
  color text not null default '#b44b2a',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.property_members (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner','admin','manager','kitchen','server')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (property_id, user_id)
);

create table if not exists public.dining_tables (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  table_number text not null,
  display_name text,
  capacity integer not null default 2 check (capacity > 0),
  qr_token uuid not null unique default gen_random_uuid(),
  status text not null default 'available' check (status in ('available','occupied','reserved','inactive')),
  created_at timestamptz not null default now(),
  unique (property_id, table_number)
);

create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (property_id, name)
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  category_id uuid references public.menu_categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  image_url text,
  dietary_badge text,
  is_vegetarian boolean not null default false,
  is_vegan boolean not null default false,
  is_gluten_free boolean not null default false,
  is_available boolean not null default true,
  is_popular boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dining_sessions (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  table_id uuid not null references public.dining_tables(id) on delete restrict,
  customer_user_id uuid references public.profiles(id) on delete set null,
  public_token uuid not null unique default gen_random_uuid(),
  guest_count integer not null default 1 check (guest_count > 0),
  status text not null default 'active' check (status in ('active','bill_requested','closed','cancelled')),
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  dining_session_id uuid not null references public.dining_sessions(id) on delete restrict,
  order_number text not null,
  status text not null default 'new' check (status in ('draft','new','preparing','ready','served','cancelled')),
  order_note text,
  subtotal numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  service_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  placed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id, order_number)
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  item_name text not null,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  spice_level text check (spice_level is null or spice_level in ('mild','medium','hot')),
  special_instructions text,
  line_total numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  dining_session_id uuid not null references public.dining_sessions(id) on delete cascade,
  request_type text not null check (request_type in ('help','water','cutlery','bill','other')),
  message text,
  status text not null default 'open' check (status in ('open','acknowledged','completed','cancelled')),
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  dining_session_id uuid not null references public.dining_sessions(id) on delete restrict,
  provider text,
  provider_reference text,
  amount numeric(12,2) not null check (amount >= 0),
  currency_code text not null default 'USD',
  method text check (method in ('cash','card','room_charge','other')),
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists property_members_user_idx on public.property_members(user_id);
create index if not exists dining_tables_property_idx on public.dining_tables(property_id);
create index if not exists menu_categories_property_idx on public.menu_categories(property_id, sort_order);
create index if not exists menu_items_property_idx on public.menu_items(property_id, category_id, is_available);
create index if not exists dining_sessions_property_status_idx on public.dining_sessions(property_id, status);
create index if not exists orders_property_status_idx on public.orders(property_id, status, placed_at desc);
create index if not exists orders_session_idx on public.orders(dining_session_id);
create index if not exists order_items_order_idx on public.order_items(order_id);
create index if not exists service_requests_property_status_idx on public.service_requests(property_id, status, requested_at);

create or replace function public.set_updated_at() returns trigger
language plpgsql security invoker as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists organizations_updated_at on public.organizations;
create trigger organizations_updated_at before update on public.organizations for each row execute function public.set_updated_at();
drop trigger if exists properties_updated_at on public.properties;
create trigger properties_updated_at before update on public.properties for each row execute function public.set_updated_at();
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists menu_items_updated_at on public.menu_items;
create trigger menu_items_updated_at before update on public.menu_items for each row execute function public.set_updated_at();
drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders for each row execute function public.set_updated_at();

create or replace function public.is_property_member(p_property_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.property_members pm
    where pm.property_id = p_property_id
      and pm.user_id = auth.uid()
      and pm.is_active = true
  );
$$;

create or replace function public.has_property_role(p_property_id uuid, p_roles text[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.property_members pm
    where pm.property_id = p_property_id
      and pm.user_id = auth.uid()
      and pm.is_active = true
      and pm.role = any(p_roles)
  );
$$;

alter table public.organizations enable row level security;
alter table public.properties enable row level security;
alter table public.profiles enable row level security;
alter table public.property_members enable row level security;
alter table public.dining_tables enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.dining_sessions enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.service_requests enable row level security;
alter table public.payments enable row level security;

-- Staff can see and manage only data belonging to their property. The service role used by
-- the Edge Function bypasses RLS and performs the validated customer/QR writes.
drop policy if exists organizations_member_select on public.organizations;
create policy organizations_member_select on public.organizations for select to authenticated
using (exists (select 1 from public.properties p where p.organization_id = organizations.id and public.is_property_member(p.id)));

drop policy if exists properties_member_all on public.properties;
create policy properties_member_all on public.properties for all to authenticated
using (public.is_property_member(id)) with check (public.is_property_member(id));

drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles for all to authenticated
using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists property_members_self_or_admin on public.property_members;
create policy property_members_self_or_admin on public.property_members for select to authenticated
using (user_id = auth.uid() or public.has_property_role(property_id, array['owner','admin']));

drop policy if exists dining_tables_member_all on public.dining_tables;
create policy dining_tables_member_all on public.dining_tables for all to authenticated
using (public.is_property_member(property_id)) with check (public.is_property_member(property_id));

drop policy if exists menu_categories_member_all on public.menu_categories;
create policy menu_categories_member_all on public.menu_categories for all to authenticated
using (public.is_property_member(property_id)) with check (public.is_property_member(property_id));

drop policy if exists menu_items_member_all on public.menu_items;
create policy menu_items_member_all on public.menu_items for all to authenticated
using (public.is_property_member(property_id)) with check (public.is_property_member(property_id));

drop policy if exists dining_sessions_member_all on public.dining_sessions;
create policy dining_sessions_member_all on public.dining_sessions for all to authenticated
using (public.is_property_member(property_id)) with check (public.is_property_member(property_id));

drop policy if exists orders_member_all on public.orders;
create policy orders_member_all on public.orders for all to authenticated
using (public.is_property_member(property_id)) with check (public.is_property_member(property_id));

drop policy if exists order_items_member_all on public.order_items;
create policy order_items_member_all on public.order_items for all to authenticated
using (exists (select 1 from public.orders o where o.id = order_id and public.is_property_member(o.property_id)))
with check (exists (select 1 from public.orders o where o.id = order_id and public.is_property_member(o.property_id)));

drop policy if exists service_requests_member_all on public.service_requests;
create policy service_requests_member_all on public.service_requests for all to authenticated
using (public.is_property_member(property_id)) with check (public.is_property_member(property_id));

drop policy if exists payments_member_all on public.payments;
create policy payments_member_all on public.payments for all to authenticated
using (public.is_property_member(property_id)) with check (public.is_property_member(property_id));
