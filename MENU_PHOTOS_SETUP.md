# TableTab: Add menu items with photos

This update adds an **Add Menu Item** form to the Admin dashboard and stores uploaded JPG, PNG, or WebP images (up to 5 MB) in Supabase Storage.

## Files changed

- `src/AdminApp.tsx`: Add Menu Item form, photo selection/preview, and real menu listing.
- `src/lib/tabletabApi.ts`: loads menu categories, uploads photos, and creates menu items.
- `supabase/functions/make-server-d1e98025/index.ts`: authenticated category listing and menu-item creation endpoints.
- `supabase/migrations/20261014203000_menu_photo_storage.sql`: creates/configures the `menu-photos` bucket and storage policies.

## Apply the change

1. Open the project folder in VS Code.
2. Install dependencies if needed:

   ```powershell
   npm install
   ```

3. Apply the storage migration using your normal Supabase migration workflow. Before using `npx supabase db push`, inspect pending migrations first because earlier project migrations may also be pending. Alternatively, run the contents of `supabase/migrations/20261014203000_menu_photo_storage.sql` in Supabase SQL Editor.
4. Deploy the updated Edge Function:

   ```powershell
   npx supabase functions deploy make-server-d1e98025
   ```

5. Build and start the frontend:

   ```powershell
   npm run build
   npm run dev
   ```

6. Sign in as an active restaurant owner, admin, or manager. Open Admin > Menu, select a category, enter the dish name and price, optionally choose a photo, then select **Add Menu Item**.

## Notes

- A menu category must already exist for the selected restaurant. The property-registration endpoint creates standard categories. If your property has none, add category rows in `public.menu_categories` first, using that property's UUID.
- The bucket is public-read so customer QR menus can display images. Upload/update/delete access is limited by Storage policies to active owners/admins/managers and the property's UUID folder.
- The backend service-role key must remain in Supabase Edge Function secrets; never place it in frontend code.
- The menu creation endpoint uses the existing `menu_items` columns and returns a server error if the actual deployed schema differs.


## If photo upload returns HTTP 400

The app now displays the actual Storage response instead of a generic policy message. Check the message shown in the form. Make sure the SQL migration above has been run in the same Supabase project used by `utils/supabase/info.tsx`, then sign out and sign back in so the app gets a fresh access token. The Storage policy uses `public.has_property_role(...)` so it checks the active owner/admin/manager membership through the schema's security-definer helper.
