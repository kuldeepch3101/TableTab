# TableTab backend setup

This project now uses **Supabase Auth + PostgreSQL + Edge Functions**. The old `kv_store_d1e98025` demo store is no longer used by the application API.

## 1. Apply the database schema

From the project root:

```bash
supabase login
supabase link --project-ref urtylrqltqifltgndilr
supabase db push
```

The migration creates:

- organizations / properties tenancy
- profiles / property_members staff access
- dining_tables with unique QR tokens
- menu_categories / menu_items
- dining_sessions
- orders / order_items
- service_requests
- payments
- indexes, timestamps and RLS policies
- demo properties, tables and menu catalog

## 2. Deploy the API

```bash
supabase functions deploy make-server-d1e98025
```

The function uses the Supabase-provided `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` environment variables. The service-role key is used **only inside the Edge Function** and must never be placed in the React frontend.

## 3. Frontend behavior

Staff authentication now uses Supabase Auth's password grant. The access token is stored locally and sent to protected staff API routes.

Property registration calls `/register-property`, which creates:

1. an Auth user
2. an organization
3. a property
4. an owner membership
5. the property's tables
6. the initial menu categories

Customer QR flow uses a server-generated `dining_tables.qr_token`. A QR URL should contain the property slug and token, for example:

```text
/?hotel=saffron&token=<table-qr-token>
```

The Edge Function validates that token before creating a dining session. Anonymous customers never receive unrestricted database write access.

## 4. API routes

### Public

- `GET /menu/:propertyIdOrSlug`
- `GET /properties`
- `POST /public/session`
- `POST /orders` with `sessionToken`
- `POST /service-requests` with `sessionToken`
- `POST /public/close-session`
- `GET /health`

### Authenticated staff

- `GET /me`
- `GET /tables/:propertyId`
- `GET /orders/:propertyId`
- `GET /orders/:propertyId/:orderId`
- `PATCH /orders/:propertyId/:orderId`

### Registration

- `POST /register-property`

## 5. Security model

Every operational table carries `property_id`, and staff access is checked against `property_members`.

RLS is enabled on every public table. Staff policies use the `is_property_member()` / `has_property_role()` security-definer helpers to avoid recursive policy evaluation.

Anonymous customers interact through the Edge Function using a QR/session token. They are not given public insert/update policies on orders, sessions or service requests.

Do not expose `SUPABASE_SERVICE_ROLE_KEY` in `.env` files shipped to the browser, GitHub, Vite code, or QR links.

## 6. Important existing UI limitation

The admin dashboard still contains several presentation/demo statistics and static table cards. The backend is ready for the real data, but those individual dashboard screens need to be wired to their corresponding endpoints if you want every number/card to be live.

## 7. Optional demo accounts

The UI already contains three demo-login buttons. Create those Auth users after applying the migrations:

```bash
# Windows PowerShell
$env:SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
npm run bootstrap:demo
```

The script uses the service-role key only on your local machine and creates:

- `sara@email.com` / `demo1234` — customer
- `amelia@saffronember.com` / `demo1234` — Saffron & Ember staff
- `chef@grandpalms.com` / `demo1234` — Grand Palms kitchen staff

Never commit the service-role key or put it in the Vite frontend.

## Customer accounts and live order sync

The customer flow now uses Supabase Auth. Customers can create an account from the TableTab sign-in screen. New Auth users are mirrored into `public.profiles` by the `on_auth_user_created` trigger in migration `20260930170200_customer_accounts_cleanup.sql`.

QR customers must authenticate before a dining session is created. The authenticated customer's user ID is attached to `dining_sessions.customer_user_id`.

The customer app polls the session orders endpoint every 2.5 seconds so kitchen status changes are reflected in the customer's order screen. The kitchen display polls the property's orders every 2.5 seconds and writes status changes back through the server API. Both views therefore read/write the same PostgreSQL order records.

## Operational demo-data cleanup

Migration `20260930170200_customer_accounts_cleanup.sql` removes prototype operational records from payments, service requests, order items, orders, and dining sessions and resets active table statuses to `available`. It intentionally preserves organizations, properties, staff memberships, menu categories, and menu items.

Apply the migration after the previous two migrations:

```powershell
npx supabase db push
```

Then run the application normally:

```powershell
npm run dev
```

Customer test:
1. Open the sign-in screen.
2. Select **Create an account**.
3. Create a customer account.
4. Scan/open a table QR URL while signed in.
5. Place an order.
6. Open the Kitchen view with a staff account.
7. Move the order from New → Preparing → Ready → Served.
8. Return to the customer order screen. The status updates automatically.


## Customer email verification

Customer signup sends a real Supabase verification email. Set `VITE_AUTH_REDIRECT_URL` to the public HTTPS URL of the deployed TableTaap frontend, for example `https://app.example.com`. Do not put the service-role key in any `VITE_` variable. For local development the redirect defaults to `http://localhost:5173`.

In Supabase, add the same URL under Authentication -> URL Configuration -> Redirect URLs. Keep the production URL exact (and add a wildcard only when you intentionally support paths). After the customer clicks the email confirmation link, TableTaap consumes the Supabase access token and restores the customer session.
