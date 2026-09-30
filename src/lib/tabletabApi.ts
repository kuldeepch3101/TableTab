import { projectId, publicAnonKey } from "../../utils/supabase/info";

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1e98025`;
const AUTH_URL = `https://${projectId}.supabase.co/auth/v1`;
const ACCESS_TOKEN_KEY = "tabletab:access-token";

// Set VITE_AUTH_REDIRECT_URL to your deployed TableTaap URL in production.
// During local development, the current origin is used as a safe fallback.
export function getAuthRedirectUrl() {
  return (import.meta.env.VITE_AUTH_REDIRECT_URL || window.location.origin).replace(/\/$/, "");
}

export function consumeAuthCallback() {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return false;
  const params = new URLSearchParams(hash);
  const accessToken = params.get("access_token");
  if (!accessToken) return false;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  // Keep the token out of the address bar after Supabase verifies the email.
  window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
  return true;
}

export interface DatabaseMenuItem {
  id: string; name: string; desc: string; price: number; badge: string; img: string; category: string; available?: boolean;
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
