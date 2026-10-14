import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { getCurrentUser, getMenu, getOrders, getPayments, getProperty, getTables, updateOrder, getMenuCategories, uploadMenuPhoto, createMenuItem } from "./lib/tabletabApi";
import type { DatabaseMenuItem, DatabaseOrder, MenuCategory } from "./lib/tabletabApi";

type Screen = "overview" | "tables" | "orders" | "menu" | "billing" | "settings";
type AnyRecord = Record<string, any>;

const NAV: Array<{ id: Screen; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "tables", label: "Tables" },
  { id: "orders", label: "Orders" },
  { id: "menu", label: "Menu" },
  { id: "billing", label: "Payments" },
  { id: "settings", label: "Restaurant settings" },
];

const money = (amount: number, currency = "USD") => new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(amount || 0));
const when = (date?: string) => date ? new Date(date).toLocaleString() : "—";
const today = () => new Date().toDateString();

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-[#ded9d0] bg-white p-5 shadow-sm ${className}`}>{children}</section>;
}
function PageTitle({ title, subtitle, right }: { title: string; subtitle: string; right?: React.ReactNode }) {
  return <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ded9d0] bg-white px-6 py-5"><div><h1 className="text-2xl font-bold text-[#20231f]">{title}</h1><p className="mt-1 text-sm text-[#777b73]">{subtitle}</p></div>{right}</header>;
}
function Pill({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex rounded-full bg-[#f0ece5] px-2.5 py-1 text-xs font-semibold capitalize text-[#575b54]">{children}</span>;
}
function ErrorNotice({ message }: { message: string }) {
  return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{message}</div>;
}

export default function AdminApp({ propertyId }: { propertyId?: string }) {
  const [screen, setScreen] = useState<Screen>("overview");
  const [property, setProperty] = useState<AnyRecord | null>(null);
  const [profile, setProfile] = useState<AnyRecord | null>(null);
  const [tables, setTables] = useState<AnyRecord[]>([]);
  const [orders, setOrders] = useState<DatabaseOrder[]>([]);
  const [menu, setMenu] = useState<DatabaseMenuItem[]>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [menuSaving, setMenuSaving] = useState(false);
  const [menuPhoto, setMenuPhoto] = useState<File | null>(null);
  const [menuForm, setMenuForm] = useState({ name: "", description: "", price: "", categoryId: "", dietaryBadge: "Veg" });
  const [payments, setPayments] = useState<AnyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [qrTableId, setQrTableId] = useState("");
  const [qrImage, setQrImage] = useState("");
  const [qrBaseUrl, setQrBaseUrl] = useState(`${window.location.origin}${window.location.pathname}`);

  const refresh = useCallback(async (quiet = false) => {
    if (!propertyId) {
      setError("This account is not linked to a restaurant. Sign in with an account assigned to a restaurant property.");
      setLoading(false);
      return;
    }
    if (!quiet) setLoading(true);
    try {
      const [me, propertyRow, tableRows, orderRows, menuRows, paymentRows, categoryRows] = await Promise.all([
        getCurrentUser(), getProperty(propertyId), getTables(propertyId), getOrders(propertyId), getMenu(propertyId), getPayments(propertyId), getMenuCategories(propertyId),
      ]);
      setProfile(me.profile ?? me.user ?? null);
      setProperty(propertyRow ?? null);
      setTables(tableRows ?? []);
      setOrders(orderRows ?? []);
      setMenu(menuRows ?? []);
      setMenuCategories(categoryRows ?? []);
      setPayments(paymentRows ?? []);
      setError("");
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load live restaurant data.");
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(() => refresh(true), 15000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const qrTable = tables.find((table: AnyRecord) => table.id === qrTableId) ?? tables[0];
  const qrToken = qrTable?.qr_token;
  const qrPropertyKey = property?.slug || property?.id || propertyId || "";
  const qrLink = qrToken && qrPropertyKey
    ? `${qrBaseUrl.replace(/\/+$/, "")}/?hotel=${encodeURIComponent(qrPropertyKey)}&token=${encodeURIComponent(qrToken)}`
    : "";

  useEffect(() => {
    if (!showQr || !qrLink) {
      setQrImage("");
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(qrLink, {
      width: 560,
      margin: 2,
      color: { dark: "#20231f", light: "#ffffff" },
      errorCorrectionLevel: "H",
    }).then((image: string) => {
      if (!cancelled) setQrImage(image);
    }).catch((error: unknown) => {
      console.error("Unable to generate table QR code:", error);
      if (!cancelled) setQrImage("");
    });
    return () => { cancelled = true; };
  }, [qrLink, showQr]);

  const currency = property?.currency_code || "USD";
  const todaysOrders = useMemo(() => orders.filter(o => new Date(o.createdAt).toDateString() === today()), [orders]);
  const todaysPaidPayments = payments.filter(payment =>
    payment.status === "paid" && payment.paid_at && new Date(payment.paid_at).toDateString() === today()
  );
  const todaysSales = todaysPaidPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const averageTicket = todaysOrders.length ? todaysOrders.reduce((sum, order) => sum + Number(order.total || 0), 0) / todaysOrders.length : 0;
  const occupiedTables = tables.filter(t => t.status === "occupied").length;
  const activeOrders = orders.filter(o => ["new", "preparing", "ready"].includes(o.status));
  const activeCount = (status: string) => activeOrders.filter(o => o.status === status).length;
  const recentOrders = [...orders].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 6);

  async function changeStatus(order: DatabaseOrder, status: DatabaseOrder["status"]) {
    if (!propertyId) return;
    try {
      await updateOrder(propertyId, order.id, { status });
      await refresh(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update order status.");
    }
  }

  async function addMenuItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!propertyId) {
      setError("No restaurant is selected.");
      return;
    }
    const name = menuForm.name.trim();
    const price = Number(menuForm.price);
    if (!name || !menuForm.categoryId) {
      setError("Enter a dish name and select a category.");
      return;
    }
    if (menuForm.price.trim() === "" || !Number.isFinite(price) || price < 0) {
      setError("Enter a valid non-negative price.");
      return;
    }

    setMenuSaving(true);
    setError("");
    try {
      let imageUrl = "";
      if (menuPhoto) imageUrl = await uploadMenuPhoto(propertyId, menuPhoto);
      await createMenuItem(propertyId, {
        name,
        description: menuForm.description.trim(),
        price,
        categoryId: menuForm.categoryId,
        imageUrl,
        dietaryBadge: menuForm.dietaryBadge,
      });
      setMenuForm({ name: "", description: "", price: "", categoryId: "", dietaryBadge: "Veg" });
      setMenuPhoto(null);
      const input = document.getElementById("menu-photo-input") as HTMLInputElement | null;
      if (input) input.value = "";
      await refresh(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to add menu item.");
    } finally {
      setMenuSaving(false);
    }
  }

  return <div className="flex min-h-screen w-full bg-[#f3f0ea] text-[#20231f]">
    <aside className="flex w-56 shrink-0 flex-col bg-[#1e2220] p-4 text-white">
      <div className="mb-7 flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-[#b44b2a] text-xl font-bold">T</div><div><p className="font-bold">TableTab</p><p className="text-[10px] uppercase tracking-wider text-white/50">Restaurant OS</p></div></div>
      <div className="mb-5 rounded-xl border border-white/10 bg-white/5 p-3"><p className="truncate text-sm font-semibold">{property?.name || "Restaurant"}</p><p className="mt-1 text-xs text-white/50">Live database</p></div>
      <nav className="flex flex-col gap-1">{NAV.map(item => <button key={item.id} onClick={() => setScreen(item.id)} className={`rounded-lg px-3 py-2.5 text-left text-sm ${screen === item.id ? "bg-[#b44b2a] text-white" : "text-white/70 hover:bg-white/10"}`}>{item.label}</button>)}</nav>
      <div className="mt-auto border-t border-white/10 pt-4"><p className="truncate text-sm">{profile?.full_name || profile?.email || "Signed-in staff"}</p><p className="mt-1 text-xs text-white/50">{profile?.email || "Authenticated account"}</p><p className="mt-3 text-[10px] text-white/40">Auto-refreshes every 15 seconds</p></div>
    </aside>

    <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <PageTitle title={NAV.find(n => n.id === screen)?.label || "Overview"} subtitle={`${property?.name || "Your restaurant"} · ${lastUpdated ? `Last synced ${lastUpdated.toLocaleTimeString()}` : "Connecting to Supabase…"}`} right={<button onClick={() => refresh()} className="rounded-lg bg-[#b44b2a] px-4 py-2 text-sm font-semibold text-white">Refresh data</button>} />
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5 md:p-6">
        {error && <ErrorNotice message={error} />}
        {loading && <Panel><p className="text-sm text-[#777b73]">Loading real data from Supabase…</p></Panel>}

        {!loading && screen === "overview" && <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Payments received today", money(todaysSales, currency)],
              ["Orders today", String(todaysOrders.length)],
              ["Average order", money(averageTicket, currency)],
              ["Occupied tables", `${occupiedTables} / ${tables.length}`],
            ].map(([label, value]) => <Panel key={label}><p className="text-sm text-[#777b73]">{label}</p><p className="mt-3 text-2xl font-bold">{value}</p></Panel>)}
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            <Panel><h2 className="mb-4 text-lg font-bold">Live order status</h2>{["new", "preparing", "ready"].map(status => <div key={status} className="mb-4 last:mb-0"><div className="mb-1 flex justify-between text-sm"><span className="capitalize">{status}</span><strong>{activeCount(status)}</strong></div><div className="h-2 overflow-hidden rounded-full bg-[#f0ece5]"><div className="h-full rounded-full bg-[#b44b2a]" style={{ width: `${activeOrders.length ? activeCount(status) / activeOrders.length * 100 : 0}%` }} /></div></div>)}{activeOrders.length === 0 && <p className="text-sm text-[#777b73]">No active orders in the database.</p>}</Panel>
            <Panel><h2 className="mb-4 text-lg font-bold">Recent orders</h2>{recentOrders.length ? <div className="space-y-3">{recentOrders.map(order => <div key={order.id} className="flex items-center justify-between gap-3 border-b border-[#f0ece5] pb-3 last:border-0"><div className="min-w-0"><p className="truncate text-sm font-semibold">{order.orderNumber || order.id.slice(0, 8)}</p><p className="text-xs text-[#777b73]">{when(order.createdAt)}</p></div><div className="text-right"><p className="text-sm font-semibold">{money(order.total, currency)}</p><Pill>{order.status}</Pill></div></div>)}</div> : <p className="text-sm text-[#777b73]">No orders have been recorded yet.</p>}</Panel>
          </div>
        </>}

        {!loading && screen === "tables" && <Panel><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Tables from database</h2><p className="mt-1 text-sm text-[#777b73]">Generate printable QR codes linked to each real table.</p></div><div className="flex items-center gap-3"><Pill>{tables.length} total</Pill><button onClick={() => { setQrTableId(tables[0]?.id ?? ""); setShowQr(true); }} disabled={!tables.some((table: AnyRecord) => table.qr_token)} className="rounded-lg bg-[#b44b2a] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Table QR codes</button></div></div>{tables.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{tables.map((table: AnyRecord) => <div key={table.id} className="rounded-xl border border-[#ded9d0] p-4"><div className="flex items-start justify-between"><p className="font-bold">{table.display_name || `Table ${table.table_number}`}</p><Pill>{table.status || "unknown"}</Pill></div><p className="mt-2 text-sm text-[#777b73]">Table number: {table.table_number}</p><p className="mt-1 text-sm text-[#777b73]">Capacity: {table.capacity ?? "—"}</p><p className="mt-1 break-all text-xs text-[#999]">ID: {table.id}</p><p className="mt-2 text-xs text-[#777b73]">{table.qr_token ? "QR ready" : "QR token missing"}</p></div>)}</div> : <p className="text-sm text-[#777b73]">No tables exist for this restaurant yet. Add tables in your Supabase dining_tables table.</p>}</Panel>}

        {!loading && screen === "orders" && <Panel><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Orders from database</h2><Pill>{orders.length} total</Pill></div>{orders.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b border-[#ded9d0] text-xs uppercase text-[#777b73]"><th className="p-3">Order</th><th className="p-3">Table</th><th className="p-3">Items</th><th className="p-3">Created</th><th className="p-3">Total</th><th className="p-3">Status</th><th className="p-3">Update</th></tr></thead><tbody>{[...orders].sort((a,b) => +new Date(b.createdAt) - +new Date(a.createdAt)).map(order => <tr key={order.id} className="border-b border-[#f0ece5] last:border-0"><td className="p-3 font-semibold">{order.orderNumber || order.id.slice(0,8)}</td><td className="p-3">{(order as AnyRecord).tableName || (order as AnyRecord).tableNumber || "—"}</td><td className="max-w-xs p-3">{order.items.map(item => `${item.quantity}× ${item.name}`).join(", ") || "—"}</td><td className="p-3">{when(order.createdAt)}</td><td className="p-3">{money(order.total, currency)}</td><td className="p-3"><Pill>{order.status}</Pill></td><td className="p-3"><select aria-label={`Update ${order.orderNumber || order.id}`} value={order.status} onChange={e => changeStatus(order, e.target.value as DatabaseOrder["status"])} className="rounded-md border border-[#ded9d0] bg-white p-2"><option value="draft">Draft</option><option value="new">New</option><option value="preparing">Preparing</option><option value="ready">Ready</option><option value="served">Served</option><option value="cancelled">Cancelled</option></select></td></tr>)}</tbody></table></div> : <p className="text-sm text-[#777b73]">No orders have been recorded yet. Orders placed from the customer menu will appear here.</p>}</Panel>}

        {!loading && screen === "menu" && <div className="space-y-5">
          <Panel>
            <h2 className="mb-1 text-lg font-bold">Add Menu Item</h2>
            <p className="mb-5 text-sm text-[#777b73]">Add a dish and optional photo. It will be saved to this restaurant's Supabase menu.</p>
            <form onSubmit={addMenuItem} className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold">Dish name *<input required maxLength={120} value={menuForm.name} onChange={e => setMenuForm({ ...menuForm, name: e.target.value })} placeholder="e.g. Paneer Tikka" className="rounded-lg border border-[#ded9d0] p-3 font-normal" /></label>
              <label className="flex flex-col gap-2 text-sm font-semibold">Price *<input required type="number" min="0" step="0.01" value={menuForm.price} onChange={e => setMenuForm({ ...menuForm, price: e.target.value })} placeholder="e.g. 249" className="rounded-lg border border-[#ded9d0] p-3 font-normal" /></label>
              <label className="flex flex-col gap-2 text-sm font-semibold">Category *<select required value={menuForm.categoryId} onChange={e => setMenuForm({ ...menuForm, categoryId: e.target.value })} className="rounded-lg border border-[#ded9d0] bg-white p-3 font-normal"><option value="">Select category</option>{menuCategories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select>{menuCategories.length === 0 && <span className="text-xs font-normal text-amber-700">No active categories found for this restaurant. Create one in Supabase first.</span>}</label>
              <label className="flex flex-col gap-2 text-sm font-semibold">Dietary type<select value={menuForm.dietaryBadge} onChange={e => setMenuForm({ ...menuForm, dietaryBadge: e.target.value })} className="rounded-lg border border-[#ded9d0] bg-white p-3 font-normal"><option value="Veg">Vegetarian</option><option value="Non-Veg">Non-vegetarian</option><option value="Vegan">Vegan</option><option value="Jain">Jain</option><option value="Egg">Contains egg</option></select></label>
              <label className="flex flex-col gap-2 text-sm font-semibold md:col-span-2">Description<textarea rows={3} maxLength={1000} value={menuForm.description} onChange={e => setMenuForm({ ...menuForm, description: e.target.value })} placeholder="Describe the dish and ingredients" className="rounded-lg border border-[#ded9d0] p-3 font-normal" /></label>
              <label className="flex flex-col gap-2 text-sm font-semibold md:col-span-2">Dish photo (JPG, PNG or WebP; max 5 MB)<input id="menu-photo-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setMenuPhoto(e.target.files?.[0] ?? null)} className="rounded-lg border border-[#ded9d0] p-3 font-normal" /></label>
              {menuPhoto && <div className="md:col-span-2"><p className="mb-2 text-sm text-[#777b73]">Selected: {menuPhoto.name}</p><img src={URL.createObjectURL(menuPhoto)} alt="Selected dish preview" className="h-40 w-40 rounded-xl border border-[#ded9d0] object-cover" /></div>}
              <div className="flex flex-wrap items-center gap-3 md:col-span-2"><button type="submit" disabled={menuSaving || menuCategories.length === 0} className="rounded-lg bg-[#b44b2a] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{menuSaving ? "Saving menu item…" : "Add Menu Item"}</button><span className="text-xs text-[#777b73]">Menu photos are stored in Supabase Storage.</span></div>
            </form>
          </Panel>
          <Panel><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Menu items from database</h2><Pill>{menu.length} items</Pill></div>{menu.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{menu.map(item => <article key={item.id} className="overflow-hidden rounded-xl border border-[#ded9d0]">{item.img ? <img src={item.img} alt={item.name} className="h-40 w-full object-cover" /> : <div className="flex h-40 items-center justify-center bg-[#f0ece5] text-sm text-[#777b73]">No photo</div>}<div className="space-y-2 p-4"><div className="flex items-start justify-between gap-2"><h3 className="font-bold">{item.name}</h3><strong>{money(item.price, currency)}</strong></div><p className="text-sm text-[#777b73]">{item.category || "Uncategorized"}</p><p className="text-sm">{item.desc || "No description"}</p><Pill>{item.available ? "available" : "unavailable"}</Pill></div></article>)}</div> : <p className="text-sm text-[#777b73]">No menu items exist for this restaurant yet. Add the first dish using the form above.</p>}</Panel>
        </div>}

        {!loading && screen === "billing" && <Panel><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Payment records from database</h2><Pill>{payments.length} records</Pill></div>{payments.length ? <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead><tr className="border-b border-[#ded9d0] text-xs uppercase text-[#777b73]"><th className="p-3">Payment ID</th><th className="p-3">Table</th><th className="p-3">Amount</th><th className="p-3">Method</th><th className="p-3">Status</th><th className="p-3">Date</th></tr></thead><tbody>{payments.map((payment: AnyRecord) => <tr key={payment.id} className="border-b border-[#f0ece5] last:border-0"><td className="p-3 font-semibold">{payment.id.slice(0,8)}</td><td className="p-3">{payment.dining_sessions?.dining_tables?.display_name || payment.dining_sessions?.dining_tables?.table_number || "—"}</td><td className="p-3">{money(payment.amount, payment.currency_code || currency)}</td><td className="p-3">{payment.method || "—"}</td><td className="p-3"><Pill>{payment.status}</Pill></td><td className="p-3">{when(payment.paid_at || payment.created_at)}</td></tr>)}</tbody></table></div> : <p className="text-sm text-[#777b73]">No payment records exist yet. This screen intentionally shows no sample payments. Records will appear when your payment workflow writes to the Supabase payments table.</p>}</Panel>}

        {!loading && screen === "settings" && <Panel><h2 className="mb-4 text-lg font-bold">Restaurant details from Supabase</h2>{property ? <div className="grid gap-4 sm:grid-cols-2">{[["Name",property.name],["Cuisine",property.cuisine],["Phone",property.phone],["Address",property.address],["Email domain",property.email_domain],["Currency",property.currency_code],["Timezone",property.timezone],["Configured table count",property.table_count]].map(([label,value]) => <div key={label} className="rounded-lg bg-[#f8f6f1] p-4"><p className="text-xs uppercase text-[#777b73]">{label}</p><p className="mt-1 break-words font-semibold">{value || "Not configured"}</p></div>)}</div> : <p className="text-sm text-[#777b73]">No restaurant property details were returned for this account.</p>}<p className="mt-5 rounded-lg bg-[#fff5e8] p-3 text-sm text-[#8a5a18]">Service hours, tax rates, notification preferences, and payment-provider settings are not stored in the current database schema. They are not shown as editable mock settings.</p></Panel>}
      </div>
      {showQr && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowQr(false)}>
        <section role="dialog" aria-modal="true" aria-label="Table QR code" className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-5 overflow-y-auto rounded-2xl border border-[#ded9d0] bg-white p-6 shadow-2xl" onClick={event => event.stopPropagation()}>
          <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold">Table QR code</h2><p className="mt-1 text-sm text-[#777b73]">Print this QR code and place it on the selected table.</p></div><button onClick={() => setShowQr(false)} className="rounded-lg border border-[#ded9d0] px-3 py-2" aria-label="Close QR code">✕</button></div>
          <div className="grid gap-5 sm:grid-cols-[260px_1fr]">
            <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-[#ded9d0] p-3">{qrImage ? <img src={qrImage} alt={`QR code for ${qrTable?.display_name || `Table ${qrTable?.table_number ?? ""}`}`} className="w-full" /> : <p className="p-4 text-center text-sm text-[#777b73]">{qrTable?.qr_token ? "Generating QR code…" : "This table has no QR token. Create one in Supabase first."}</p>}</div>
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-sm font-semibold">Table<select value={qrTable?.id ?? ""} onChange={event => setQrTableId(event.target.value)} className="rounded-lg border border-[#ded9d0] bg-white p-3 font-normal">{tables.map((table: AnyRecord) => <option key={table.id} value={table.id}>{table.display_name || `Table ${table.table_number}`} {table.qr_token ? "" : "(missing QR token)"}</option>)}</select></label>
              <label className="flex flex-col gap-2 text-sm font-semibold">Website URL<input value={qrBaseUrl} onChange={event => setQrBaseUrl(event.target.value)} placeholder="https://your-tabletab-domain.com" className="rounded-lg border border-[#ded9d0] p-3 font-normal" /></label>
              {(qrBaseUrl.includes("localhost") || qrBaseUrl.includes("127.0.0.1")) && <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">A localhost QR code will only work on the device running the development server. Use your deployed website URL for customer phones.</p>}
              <div className="rounded-lg bg-[#f8f6f1] p-3"><p className="mb-1 text-xs font-semibold uppercase text-[#777b73]">QR destination</p><p className="break-all text-xs">{qrLink || "QR link unavailable: check the table token, property, and website URL."}</p></div>
              <button disabled={!qrImage || !qrLink} onClick={() => { const link = document.createElement("a"); link.href = qrImage; link.download = `tabletab-table-${String(qrTable?.table_number ?? "qr").replace(/[^a-zA-Z0-9_-]/g, "")}.png`; link.click(); }} className="rounded-lg bg-[#b44b2a] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Download QR code (PNG)</button>
            </div>
          </div>
        </section>
      </div>}
    </main>
  </div>;
}
