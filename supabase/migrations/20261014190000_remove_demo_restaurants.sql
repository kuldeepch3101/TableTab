-- Remove the two fixed demo restaurants created by 20260930170100_tabletab_seed.sql.
-- Deleting these property rows cascades their demo tables, menu items, sessions,
-- orders, payments, and property memberships. Real user-created properties are untouched.
delete from public.properties
where id in (
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333'
);

-- Remove the seed-only organization if it no longer owns any properties.
delete from public.organizations
where id = '11111111-1111-4111-8111-111111111111'
  and not exists (
    select 1 from public.properties p
    where p.organization_id = organizations.id
  );
