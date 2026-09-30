-- Demo catalog/property seed. Auth users are created separately by the Edge Function's
-- /bootstrap-demo endpoint so no password material is stored in SQL.
insert into public.organizations (id, name)
values ('11111111-1111-4111-8111-111111111111', 'TableTab Demo Hospitality')
on conflict (id) do nothing;

insert into public.properties (id, organization_id, name, slug, email_domain, cuisine, phone, address, table_count, currency_code, timezone, color)
values
('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'Saffron & Ember', 'saffron', 'saffronember.com', 'Modern Indian dining', '+1 415 555 0100', '12 Market Street', 24, 'USD', 'America/Los_Angeles', '#b44b2a'),
('33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', 'The Grand Palms', 'grandpalms', 'grandpalms.com', 'Contemporary coastal dining', '+1 415 555 0110', '88 Palm Avenue', 32, 'USD', 'America/Los_Angeles', '#32705a')
on conflict (id) do nothing;

insert into public.dining_tables (property_id, table_number, display_name, capacity)
select p.id, lpad(gs::text, 2, '0'), 'Table ' || lpad(gs::text, 2, '0'), case when gs % 4 = 0 then 4 else 2 end
from public.properties p cross join lateral generate_series(1, p.table_count) gs
on conflict (property_id, table_number) do nothing;

insert into public.menu_categories (property_id, name, sort_order)
select p.id, x.name, x.sort_order
from public.properties p cross join (values ('Popular',0),('Starters',1),('Mains',2),('Breads',3),('Drinks',4)) x(name,sort_order)
on conflict (property_id, name) do nothing;

insert into public.menu_items (property_id, category_id, name, description, price, image_url, dietary_badge, is_vegetarian, is_gluten_free, is_popular, sort_order)
select p.id, c.id, m.name, m.description, m.price, m.image_url, m.badge, m.veg, m.gf, m.popular, m.sort_order
from public.properties p
join public.menu_categories c on c.property_id = p.id
join (values
('butter-chicken','Popular','Butter chicken','Tandoori chicken, tomato makhani, fenugreek',24,'/assets/menu-butter-chicken.jpg','GF',false,true,true,0),
('paneer-tikka','Popular','Paneer tikka','Charred peppers, red onion, mint chutney',18,'/assets/menu-paneer-tikka.jpg','V',true,false,true,1),
('biryani','Mains','Chicken dum biryani','Basmati rice, saffron, crispy onions, raita',22,'/assets/menu-chicken-biryani.jpg','GF',false,true,false,0),
('rogan-josh','Mains','Lamb rogan josh','Kashmiri chilli, cardamom, slow-cooked lamb',27,'/assets/menu-rogan-josh.jpg','GF',false,true,false,1),
('dosa','Mains','Masala dosa','Crisp rice crêpe, spiced potato, sambar',16,'/assets/menu-masala-dosa.jpg','V',true,false,false,2),
('samosa','Starters','Vegetable samosa','Potato, peas, tamarind and mint chutneys',10,'/assets/menu-samosa.jpg','V',true,false,false,0),
('naan','Breads','Garlic butter naan','Tandoor-baked bread, roasted garlic, coriander',6,'/assets/menu-garlic-naan.jpg','V',true,false,false,0),
('lassi','Drinks','Mango lassi','Alphonso mango, yoghurt, cardamom',8,'/assets/menu-mango-lassi.jpg','V',true,false,false,0)
) m(id,category,name,description,price,image_url,badge,veg,gf,popular,sort_order) on c.name=m.category
where not exists (select 1 from public.menu_items mi where mi.property_id=p.id and mi.name=m.name);
