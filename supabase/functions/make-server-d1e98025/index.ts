import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();
const base = "/make-server-d1e98025";
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(supabaseUrl, serviceRoleKey);
const TAX_RATE = 0.085;
const SERVICE_RATE = 0.05;

app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization", "apikey", "x-public-token"],
  allowMethods: ["GET", "POST", "PATCH", "PUT", "OPTIONS"],
}));

function jsonError(c: any, message: string, status = 400) {
  return c.json({ error: message }, status);
}

async function getUser(c: any) {
  const auth = c.req.header("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const client = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return { user: data.user, client };
}

async function requireStaff(c: any, propertyId: string, roles?: string[]) {
  const session = await getUser(c);
  if (!session) return { error: jsonError(c, "Authentication required", 401) };
  let query = admin.from("property_members").select("id, role, is_active").eq("property_id", propertyId).eq("user_id", session.user.id).eq("is_active", true);
  if (roles?.length) query = query.in("role", roles);
  const { data, error } = await query.maybeSingle();
  if (error || !data) return { error: jsonError(c, "You do not have access to this property", 403) };
  return { user: session.user, member: data };
}

async function findProperty(idOrSlug: string) {
  const byId = await admin.from("properties").select("*").eq("id", idOrSlug).maybeSingle();
  if (byId.data) return byId.data;
  const bySlug = await admin.from("properties").select("*").eq("slug", idOrSlug).maybeSingle();
  return bySlug.data;
}

function round(n: number) { return Math.round(n * 100) / 100; }

async function getMenuRows(propertyId: string) {
  const { data, error } = await admin
    .from("menu_items")
    .select("id,name,description,price,dietary_badge,image_url,is_available,menu_categories!inner(name)")
    .eq("property_id", propertyId)
    .eq("is_available", true)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map((m: any) => ({
    id: m.id,
    name: m.name,
    desc: m.description ?? "",
    price: Number(m.price),
    badge: m.dietary_badge ?? "",
    img: m.image_url ?? "",
    category: m.menu_categories?.name ?? "Other",
    available: m.is_available,
  }));
}

app.get(`${base}/health`, (c) => c.json({ status: "ok", version: "postgres-v2" }));

app.get(`${base}/properties`, async (c) => {
  const { data, error } = await admin.from("properties").select("id,name,slug,cuisine,table_count,color,is_active").eq("is_active", true).order("name");
  if (error) return jsonError(c, error.message, 500);
  return c.json({ properties: data ?? [] });
});

app.get(`${base}/me`, async (c) => {
  const session = await getUser(c);
  if (!session) return jsonError(c, "Authentication required", 401);
  const { data: profile } = await admin.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
  const { data: memberships, error } = await admin
    .from("property_members")
    .select("id,property_id,role,is_active,properties(id,name,slug,cuisine,table_count,color)")
    .eq("user_id", session.user.id)
    .eq("is_active", true);
  if (error) return jsonError(c, error.message, 500);
  return c.json({ user: session.user, profile, memberships: memberships ?? [] });
});

app.post(`${base}/register-property`, async (c) => {
  try {
    const body = await c.req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    if (!email || password.length < 8) return jsonError(c, "Valid email and an 8+ character password are required");
    const propertyName = String(body.propertyName ?? "").trim();
    const organizationName = String(body.organization ?? "").trim();
    const tableCount = Number(body.tables);
    if (!propertyName || !organizationName || !Number.isInteger(tableCount) || tableCount < 1 || tableCount > 500) {
      return jsonError(c, "Property, organization and table count are required");
    }
    const slugBase = propertyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "property";
    const slug = `${slugBase}-${crypto.randomUUID().slice(0, 8)}`;
    const domain = email.split("@")[1] ?? "";
    const { data: existingDomain } = await admin.from("properties").select("id").eq("email_domain", domain).maybeSingle();
    if (existingDomain) return jsonError(c, "A property with this email domain is already registered", 409);

    const { data: created, error: userError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: body.ownerName ?? "" },
    });
    if (userError || !created.user) return jsonError(c, userError?.message ?? "Unable to create account", 400);
    const userId = created.user.id;
    const { data: org, error: orgError } = await admin.from("organizations").insert({ name: organizationName }).select().single();
    if (orgError) throw orgError;
    const { data: property, error: propertyError } = await admin.from("properties").insert({
      organization_id: org.id, name: propertyName, slug, email_domain: domain,
      cuisine: String(body.cuisine ?? "Restaurant dining"), phone: String(body.phone ?? ""),
      address: String(body.address ?? ""), table_count: tableCount,
    }).select().single();
    if (propertyError) throw propertyError;
    await admin.from("profiles").upsert({ id: userId, full_name: String(body.ownerName ?? ""), email, phone: String(body.phone ?? "") });
    await admin.from("property_members").insert({ property_id: property.id, user_id: userId, role: "owner" });
    const tables = Array.from({ length: tableCount }, (_, i) => ({ property_id: property.id, table_number: String(i + 1).padStart(2, "0"), display_name: `Table ${String(i + 1).padStart(2, "0")}` }));
    await admin.from("dining_tables").insert(tables);
    for (const [i, name] of ["Popular", "Starters", "Mains", "Breads", "Drinks"].entries()) {
      await admin.from("menu_categories").insert({ property_id: property.id, name, sort_order: i });
    }
    return c.json({ property, user: created.user }, 201);
  } catch (e) {
    console.error(e);
    return jsonError(c, e instanceof Error ? e.message : "Unable to register property", 500);
  }
});

app.get(`${base}/menu/:propertyId`, async (c) => {
  try {
    const property = await findProperty(c.req.param("propertyId"));
    if (!property || !property.is_active) return jsonError(c, "Property not found", 404);
    return c.json({ menu: await getMenuRows(property.id), property: { id: property.id, name: property.name, cuisine: property.cuisine, currencyCode: property.currency_code } });
  } catch (e) { console.error(e); return jsonError(c, "Unable to load menu", 500); }
});

app.get(`${base}/tables/:propertyId`, async (c) => {
  const auth = await requireStaff(c, c.req.param("propertyId"));
  if (auth.error) return auth.error;
  const { data, error } = await admin.from("dining_tables").select("id,table_number,display_name,capacity,qr_token,status").eq("property_id", c.req.param("propertyId")).order("table_number");
  if (error) return jsonError(c, error.message, 500);
  return c.json({ tables: data ?? [] });
});

app.get(`${base}/orders/:propertyId`, async (c) => {
  const auth = await requireStaff(c, c.req.param("propertyId"));
  if (auth.error) return auth.error;
  const { data, error } = await admin.from("orders").select("*,order_items(*),dining_sessions(guest_count,table_id,dining_tables(table_number))").eq("property_id", c.req.param("propertyId")).order("placed_at", { ascending: false });
  if (error) return jsonError(c, error.message, 500);
  return c.json({ orders: (data ?? []).map(mapOrder) });
});

app.get(`${base}/orders/:propertyId/:orderId`, async (c) => {
  const auth = await requireStaff(c, c.req.param("propertyId"));
  if (auth.error) return auth.error;
  const { data, error } = await admin.from("orders").select("*,order_items(*),dining_sessions(guest_count,table_id,dining_tables(table_number))").eq("property_id", c.req.param("propertyId")).eq("id", c.req.param("orderId")).maybeSingle();
  if (error) return jsonError(c, error.message, 500);
  if (!data) return jsonError(c, "Order not found", 404);
  return c.json({ order: mapOrder(data) });
});

app.patch(`${base}/orders/:propertyId/:orderId`, async (c) => {
  const auth = await requireStaff(c, c.req.param("propertyId"), ["owner", "admin", "manager", "kitchen", "server"]);
  if (auth.error) return auth.error;
  const body = await c.req.json();
  const updates: Record<string, unknown> = {};
  if (body.status) updates.status = body.status;
  if (body.orderNote !== undefined) updates.order_note = String(body.orderNote).slice(0, 500);
  const { data, error } = await admin.from("orders").update(updates).eq("property_id", c.req.param("propertyId")).eq("id", c.req.param("orderId")).select("*,order_items(*),dining_sessions(guest_count,table_id,dining_tables(table_number))").single();
  if (error) return jsonError(c, error.message, 400);
  return c.json({ order: mapOrder(data) });
});

app.post(`${base}/public/session`, async (c) => {
  try {
    const body = await c.req.json();
    const tableToken = String(body.tableToken ?? "");
    if (!tableToken) return jsonError(c, "tableToken is required");
    const { data: table } = await admin.from("dining_tables").select("id,property_id,status,table_number").eq("qr_token", tableToken).maybeSingle();
    if (!table || table.status === "inactive") return jsonError(c, "Invalid table QR token", 404);
    const customerSession = await getUser(c);
    const { data: existing } = await admin.from("dining_sessions").select("*").eq("table_id", table.id).eq("status", "active").maybeSingle();
    if (existing) {
      if (customerSession?.user?.id && !existing.customer_user_id) {
        await admin.from("dining_sessions").update({ customer_user_id: customerSession.user.id }).eq("id", existing.id);
        existing.customer_user_id = customerSession.user.id;
      }
      return c.json({ session: existing });
    }
    const { data: session, error } = await admin.from("dining_sessions").insert({ property_id: table.property_id, table_id: table.id, customer_user_id: customerSession?.user?.id ?? null, guest_count: Math.max(1, Number(body.guestCount) || 1) }).select().single();
    if (error) throw error;
    await admin.from("dining_tables").update({ status: "occupied" }).eq("id", table.id);
    return c.json({ session }, 201);
  } catch (e) { console.error(e); return jsonError(c, "Unable to create dining session", 500); }
});

app.post(`${base}/orders`, async (c) => {
  try {
    const body = await c.req.json();
    const publicToken = String(body.sessionToken ?? "");
    if (!publicToken) return jsonError(c, "sessionToken is required");
    const { data: session } = await admin.from("dining_sessions").select("id,property_id,status").eq("public_token", publicToken).eq("status", "active").maybeSingle();
    if (!session) return jsonError(c, "Active dining session not found", 404);
    if (!Array.isArray(body.items) || body.items.length === 0) return jsonError(c, "Order is empty");
    const ids = body.items.map((i: any) => String(i.menuItemId));
    const { data: dishes, error: menuError } = await admin.from("menu_items").select("id,name,price").eq("property_id", session.property_id).eq("is_available", true).in("id", ids);
    if (menuError) throw menuError;
    const dishMap = new Map((dishes ?? []).map((d: any) => [d.id, d]));
    const items = body.items.map((input: any) => {
      const dish: any = dishMap.get(String(input.menuItemId));
      if (!dish) throw new Error("Menu item unavailable");
      const quantity = Math.max(1, Math.floor(Number(input.quantity) || 1));
      const unitPrice = Number(dish.price);
      return { menu_item_id: dish.id, item_name: dish.name, unit_price: unitPrice, quantity, spice_level: input.spiceLevel || null, special_instructions: String(input.note ?? "").slice(0, 300) || null, line_total: round(unitPrice * quantity) };
    });
    const subtotal = round(items.reduce((s: number, i: any) => s + i.line_total, 0));
    const tax = round(subtotal * TAX_RATE);
    const service = round(subtotal * SERVICE_RATE);
    const total = round(subtotal + tax + service);
    const { count } = await admin.from("orders").select("id", { count: "exact", head: true }).eq("property_id", session.property_id);
    const orderNumber = `TT-${String((count ?? 0) + 1).padStart(5, "0")}`;
    const { data: order, error: orderError } = await admin.from("orders").insert({ property_id: session.property_id, dining_session_id: session.id, order_number: orderNumber, order_note: String(body.orderNote ?? "").slice(0, 500) || null, subtotal, tax_amount: tax, service_amount: service, total_amount: total }).select().single();
    if (orderError) throw orderError;
    const { error: itemError } = await admin.from("order_items").insert(items.map((i: any) => ({ ...i, order_id: order.id })));
    if (itemError) throw itemError;
    const { data: full } = await admin.from("orders").select("*,order_items(*),dining_sessions(guest_count,table_id,dining_tables(table_number))").eq("id", order.id).single();
    return c.json({ order: mapOrder(full) }, 201);
  } catch (e) { console.error(e); return jsonError(c, e instanceof Error ? e.message : "Unable to create order", 400); }
});

app.get(`${base}/public/orders/:sessionToken`, async (c) => {
  try {
    const token = c.req.param("sessionToken");
    const { data: session } = await admin.from("dining_sessions").select("id,property_id,customer_user_id,status").eq("public_token", token).maybeSingle();
    if (!session) return jsonError(c, "Dining session not found", 404);
    const customerSession = await getUser(c);
    if (session.customer_user_id && customerSession?.user?.id && session.customer_user_id !== customerSession.user.id) {
      return jsonError(c, "This dining session belongs to another customer", 403);
    }
    const { data, error } = await admin.from("orders")
      .select("*,order_items(*),dining_sessions(guest_count,table_id,dining_tables(table_number))")
      .eq("dining_session_id", session.id)
      .order("placed_at", { ascending: false });
    if (error) throw error;
    return c.json({ orders: (data ?? []).map(mapOrder) });
  } catch (e) {
    console.error(e);
    return jsonError(c, "Unable to load session orders", 500);
  }
});

app.post(`${base}/service-requests`, async (c) => {
  try {
    const body = await c.req.json();
    const sessionToken = String(body.sessionToken ?? "");
    const { data: session } = await admin.from("dining_sessions").select("id,property_id").eq("public_token", sessionToken).eq("status", "active").maybeSingle();
    if (!session) return jsonError(c, "Active dining session not found", 404);
    const allowed = ["help", "water", "cutlery", "bill", "other"];
    const type = allowed.includes(body.type) ? body.type : "other";
    const { data: request, error } = await admin.from("service_requests").insert({ property_id: session.property_id, dining_session_id: session.id, request_type: type, message: String(body.message ?? "").slice(0, 500) || null }).select().single();
    if (error) throw error;
    if (type === "bill") await admin.from("dining_sessions").update({ status: "bill_requested" }).eq("id", session.id);
    return c.json({ request }, 201);
  } catch (e) { return jsonError(c, e instanceof Error ? e.message : "Unable to create service request", 400); }
});

app.post(`${base}/public/close-session`, async (c) => {
  const body = await c.req.json();
  const token = String(body.sessionToken ?? "");
  const { data: session } = await admin.from("dining_sessions").select("id,table_id").eq("public_token", token).maybeSingle();
  if (!session) return jsonError(c, "Session not found", 404);
  await admin.from("dining_sessions").update({ status: "closed", closed_at: new Date().toISOString() }).eq("id", session.id);
  await admin.from("dining_tables").update({ status: "available" }).eq("id", session.table_id);
  return c.json({ ok: true });
});

function mapOrder(row: any) {
  return {
    id: row.id,
    orderNumber: row.order_number,
    propertyId: row.property_id,
    diningSessionId: row.dining_session_id,
    status: row.status,
    guests: row.dining_sessions?.guest_count ?? null,
    tableNumber: row.dining_sessions?.dining_tables?.table_number ?? null,
    items: (row.order_items ?? []).map((i: any) => ({ menuItemId: i.menu_item_id, name: i.item_name, quantity: i.quantity, unitPrice: Number(i.unit_price), spiceLevel: i.spice_level, note: i.special_instructions })),
    orderNote: row.order_note,
    subtotal: Number(row.subtotal),
    tax: Number(row.tax_amount),
    service: Number(row.service_amount),
    total: Number(row.total_amount),
    createdAt: row.placed_at,
    updatedAt: row.updated_at,
  };
}

Deno.serve(app.fetch);
