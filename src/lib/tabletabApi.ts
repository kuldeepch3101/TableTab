import { projectId, publicAnonKey } from "../../utils/supabase/info";

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1e98025`;
const AUTH_URL = `https://${projectId}.supabase.co/auth/v1`;
const ACCESS_TOKEN_KEY = "tabletab:access-token";

// Set VITE_AUTH_REDIRECT_URL to your deployed TableTaap URL in production.
// During local development, the current origin is used as a safe fallback.
export function getAuthRedirectUrl() {
  return (import.meta.env.VITE_AUTH_REDIRECT_URL || window.location.origin).replace(/\/$/, "");
}

export function startGoogleSignIn() {
  // Used only to distinguish a newly created Google account from a returning login.
  sessionStorage.setItem("tabletab:google-oauth-started-at", String(Date.now()));
  const redirectTo = getAuthRedirectUrl();
  const authorizeUrl = new URL(`${AUTH_URL}/authorize`);
  authorizeUrl.searchParams.set("provider", "google");
  authorizeUrl.searchParams.set("redirect_to", redirectTo);
  // Supabase handles the OAuth exchange; no Google client secret belongs in this app.
  window.location.assign(authorizeUrl.toString());
}

export async function consumeAuthCallback() {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return false;
  const params = new URLSearchParams(hash);
  const accessToken = params.get("access_token");
  if (!accessToken) return false;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  // Keep the token out of the address bar after Supabase redirects back.
  window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);

  // Only send a notification for a completed Google OAuth flow, not email verification.
  const oauthStartedAt = Number(sessionStorage.getItem("tabletab:google-oauth-started-at") || 0);
  sessionStorage.removeItem("tabletab:google-oauth-started-at");
  if (oauthStartedAt && Date.now() - oauthStartedAt < 15 * 60 * 1000) {
    try {
      await request<{ sent: boolean }>("/auth-notification", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ oauthStartedAt }),
      });
    } catch (error) {
      // Email delivery must not prevent a successful sign-in. The server logs the failure.
      console.error("TableTab sign-in email notification could not be sent.", error);
    }
  }
  return true;
}

export interface DatabaseMenuItem {
  id: string; name: string; desc: string; price: number; badge: string; img: string; category: string; available?: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  sort_order: number;
}
export type DatabaseOrderStatus = "draft" | "new" | "preparing" | "ready" | "served" | "cancelled";
export interface DatabaseOrder {
  id: string; orderNumber?: string; propertyId: string; diningSessionId?: string; status: DatabaseOrderStatus;
  guests: number | null; items: Array<{ menuItemId: string; name: string; quantity: number; unitPrice: number; spiceLevel?: "mild" | "medium" | "hot" | null; note?: string | null }>;
  orderNote?: string | null; subtotal: number; tax: number; service: number; total: number; createdAt: string; updatedAt: string;
}

export function getAccessToken() { return localStorage.getItem(ACCESS_TOKEN_KEY); }
export function clearAccessToken() { localStorage.removeItem(ACCESS_TOKEN_KEY); }

async function request<T>(path: string, options?: RequestInit, publicRequest = false): Promise<T> {
  const token = getAccessToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token ?? publicAnonKey}`, apikey: publicAnonKey, "Content-Type": "application/json", ...options?.headers },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error ?? "Database request failed");
  return result;
}

export async function signUpCustomer(fullName: string, email: string, password: string, phone?: string) {
  const response = await fetch(`${AUTH_URL}/signup`, {
    method: "POST",
    headers: { apikey: publicAnonKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
      data: { full_name: fullName.trim(), phone: phone?.trim() || null, account_type: "customer" },
      options: { email_redirect_to: getAuthRedirectUrl() },
    }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error_description ?? result.msg ?? result.message ?? "Unable to create customer account");
  if (result.access_token) localStorage.setItem(ACCESS_TOKEN_KEY, result.access_token);
  return result as { access_token?: string; refresh_token?: string; user?: { id: string; email?: string }; session?: any };
}

export async function resendCustomerVerification(email: string) {
  const response = await fetch(`${AUTH_URL}/resend`, {
    method: "POST",
    headers: { apikey: publicAnonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "signup", email: email.trim().toLowerCase(), options: { email_redirect_to: getAuthRedirectUrl() } }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error_description ?? result.msg ?? result.message ?? "Unable to resend verification email");
  return result;
}

export async function signIn(email: string, password: string) {
  const response = await fetch(`${AUTH_URL}/token?grant_type=password`, {
    method: "POST", headers: { apikey: publicAnonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error_description ?? result.msg ?? "Invalid email or password");
  localStorage.setItem(ACCESS_TOKEN_KEY, result.access_token);
  return result as { access_token: string; refresh_token: string; user: { id: string; email?: string } };
}

export async function getCurrentUser() { return request<{ user: any; profile: any; memberships: any[] }>("/me"); }

export async function registerProperty(input: Record<string, unknown>) {
  return request<{ property: any; user: any }>("/register-property", { method: "POST", body: JSON.stringify(input) });
}

export async function getProperties() {
  const result = await request<{ properties: any[] }>("/properties");
  return result.properties;
}

export async function getMenu(propertyId: string) {
  const result = await request<{ menu: DatabaseMenuItem[] }>(`/menu/${propertyId}`, undefined, true);
  return result.menu;
}

export async function getMenuCategories(propertyId: string) {
  const result = await request<{ categories: MenuCategory[] }>(
    `/menu-categories/${encodeURIComponent(propertyId)}`
  );
  return result.categories;
}

export async function uploadMenuPhoto(propertyId: string, file: File): Promise<string> {
  const token = getAccessToken();
  if (!token) throw new Error("Please sign in again before uploading photos.");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Choose a JPG, PNG, or WebP image.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image must be 5 MB or smaller.");
  }

  const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
  const path = `${propertyId}/${crypto.randomUUID()}.${extension}`;
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(
    `https://${projectId}.supabase.co/storage/v1/object/menu-photos/${encodedPath}`,
    {
      method: "POST",
      headers: {
        apikey: publicAnonKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": file.type,
        "x-upsert": "false",
      },
      body: file,
    }
  );
  if (!response.ok) {
    const rawDetails = await response.text();
    let details = rawDetails;
    try {
      const parsed = JSON.parse(rawDetails);
      details = parsed.message ?? parsed.error ?? parsed.error_description ?? rawDetails;
    } catch {
      // Keep the plain-text response if Supabase did not return JSON.
    }
    console.error("Menu photo upload failed:", response.status, rawDetails);
    throw new Error(`Photo upload failed (${response.status}): ${details || "Unknown Supabase Storage error"}`);
  }
  return `https://${projectId}.supabase.co/storage/v1/object/public/menu-photos/${encodedPath}`;
}

export async function createMenuItem(
  propertyId: string,
  input: {
    name: string;
    description: string;
    price: number;
    categoryId: string;
    imageUrl: string;
    dietaryBadge: string;
  }
) {
  return request<{ item: DatabaseMenuItem }>(
    `/menu/${encodeURIComponent(propertyId)}`,
    { method: "POST", body: JSON.stringify(input) }
  );
}

export async function createDiningSession(tableToken: string, guestCount = 1) {
  const result = await request<{ session: any }>("/public/session", { method: "POST", body: JSON.stringify({ tableToken, guestCount }) }, true);
  return result.session;
}

export async function createOrder(input: {
  sessionToken: string;
  guests?: number;
  orderNote?: string;
  items: Array<{ menuItemId: string; quantity: number; spiceLevel?: string; note?: string }>;
}) {
  const result = await request<{ order: DatabaseOrder }>("/orders", { method: "POST", body: JSON.stringify(input) }, true);
  return result.order;
}

export async function getTables(propertyId: string) {
  const result = await request<{ tables: any[] }>(`/tables/${propertyId}`);
  return result.tables;
}

export async function getOrders(propertyId: string) {
  const result = await request<{ orders: DatabaseOrder[] }>(`/orders/${propertyId}`);
  return result.orders;
}
export async function getSessionOrders(sessionToken: string) {
  const result = await request<{ orders: DatabaseOrder[] }>(`/public/orders/${encodeURIComponent(sessionToken)}`, undefined, true);
  return result.orders;
}

export async function getOrder(propertyId: string, orderId: string) {
  const result = await request<{ order: DatabaseOrder }>(`/orders/${propertyId}/${orderId}`);
  return result.order;
}
export async function updateOrder(propertyId: string, orderId: string, updates: Partial<Pick<DatabaseOrder, "status">>) {
  const result = await request<{ order: DatabaseOrder }>(`/orders/${propertyId}/${orderId}`, { method: "PATCH", body: JSON.stringify(updates) });
  return result.order;
}
export async function createServiceRequest(sessionToken: string, type = "help", message?: string) {
  return request("/service-requests", { method: "POST", body: JSON.stringify({ sessionToken, type, message }) }, true);
}

export async function getPayments(propertyId: string) {
  const result = await request<{ payments: any[] }>(`/payments/${propertyId}`);
  return result.payments;
}

export async function getProperty(propertyId: string) {
  const result = await request<{ property: any }>(`/property/${propertyId}`);
  return result.property;
}
