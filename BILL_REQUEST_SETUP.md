# TableTab custom bill-request notifications

This implementation reuses the existing `public.service_requests` table and existing `/service-requests` customer endpoint. It does not require a new database table or a schema migration.

## What changed

- Added authenticated staff endpoint `GET /make-server-d1e98025/service-requests/:propertyId` to list requests for the staff member's restaurant.
- Added authenticated staff endpoint `PATCH /make-server-d1e98025/service-requests/:propertyId/:requestId` to acknowledge, complete, or cancel a request, restricted to the staff member's restaurant.
- Admin dashboard polls every 15 seconds, shows a bill-request counter, displays a popup for newly detected open bill requests, and provides a persistent bill-request list with acknowledge/handled controls.
- Bill request loading is isolated from the main dashboard load so an unavailable request endpoint does not block the kitchen/admin data.

## Required deployment

The frontend alone cannot add API routes to the already-deployed Supabase Edge Function. Deploy the updated function source from this project folder:

```powershell
npx supabase login
npx supabase link --project-ref urtylrqltqifltgndilr
npx supabase functions deploy make-server-d1e98025
```

Use the same Supabase project that the live TableTab site already uses. Do not expose or paste the service-role key into frontend files. The deployed function must already have its normal Supabase environment secrets (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).

## Test

1. Deploy the Edge Function.
2. Deploy the updated frontend to the same live domain that table QR codes point to.
3. Sign in to the admin account and keep the dashboard open.
4. Scan a table QR with a phone, submit a bill request, and wait up to 15 seconds.
5. Verify the popup, counter, and persistent request list. Acknowledge it, then mark it handled.

The local `localhost` frontend is useful for development, but customer phones need a deployed or LAN-accessible URL in the QR code. Existing table QR tokens and database schema are unchanged.
