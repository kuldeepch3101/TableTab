import { useEffect, useState, FormEvent } from "react";
import { getCurrentUser, getProperties, registerProperty, resendCustomerVerification, signIn, signUpCustomer, startGoogleSignIn } from "./lib/tabletabApi";

const assetPathPrefix = "/assets";
const imgChefHat = `${assetPathPrefix}/72498.svg`;
const imgLiveDot = `${assetPathPrefix}/23810.svg`;

export interface Hotel {
  id: string;
  name: string;
  organization: string;
  cuisine: string;
  tables: number;
  domain: string;
  color: string;
  ownerEmail?: string;
  phone?: string;
  address?: string;
}

// Restaurant records are loaded from Supabase; never use seeded mock venues here.
export function getHotels(): Hotel[] {
  return [];
}

export type HotelId   = string;
export type AuthRole  = "customer" | "staff";

export interface AuthResult {
  role:    AuthRole;
  hotel?:  HotelId;   // staff: auto-detected; customer: chosen on next screen
  email:   string;
}


// ── Hotel picker (customer only) ─────────────────────────────────
function HotelPicker({ email, onPick }: { email: string; onPick: (r: AuthResult) => void }) {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getProperties().then(rows => { setHotels(rows.map((h: any) => ({ id: h.id, name: h.name, organization: h.organization ?? "", cuisine: h.cuisine ?? "Restaurant dining", tables: Number(h.table_count ?? 0), domain: h.email_domain ?? "", color: h.color ?? "#b44b2a", phone: h.phone, address: h.address }))); }).catch(error => { console.error("Unable to load restaurant list from Supabase", error); setHotels([]); }).finally(() => setLoading(false)); }, []);
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#f3f0ea] p-6">
      <div className="flex flex-col gap-8 items-center w-full max-w-[480px]">
        <div className="flex flex-col gap-3 items-center text-center">
          <div className="bg-[#b44b2a] flex items-center justify-center rounded-[14px] size-[48px]">
            <div className="relative size-[26px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgChefHat} /></div>
          </div>
          <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[26px]" style={{ fontVariationSettings: '"opsz" 14' }}>Where are you dining?</p>
          <p className="font-['Inter:Regular'] font-normal text-[#575b54] text-[14px]">Select the venue you're visiting tonight.</p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          {(loading ? [] : hotels).map(hotel => (
            <button
              key={hotel.id}
              onClick={() => onPick({ role: "customer", hotel: hotel.id, email })}
              className="bg-white border border-[#ded9d0] border-solid flex gap-4 items-center p-5 rounded-[16px] shadow-[0px_2px_12px_rgba(0,0,0,0.06)] text-left w-full hover:border-[#b44b2a] transition-all group"
            >
              <div className="flex items-center justify-center rounded-[12px] size-[48px] shrink-0" style={{ background: `${hotel.color}20` }}>
                <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[20px]" style={{ color: hotel.color, fontVariationSettings: '"opsz" 14' }}>
                  {hotel.name.charAt(0)}
                </p>
              </div>
              <div className="flex flex-col gap-1 items-start flex-1 min-w-0">
                <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[18px]" style={{ fontVariationSettings: '"opsz" 14' }}>{hotel.name}</p>
                <div className="flex gap-2 items-center">
                  <div className="relative size-[7px] shrink-0"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLiveDot} /></div>
                  <p className="font-['Inter:Regular'] font-normal text-[#575b54] text-[13px]">{hotel.cuisine} · {hotel.tables} tables</p>
                </div>
              </div>
              <svg className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b44b2a" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          ))}
          {!loading && hotels.length === 0 && (
            <div className="rounded-xl border border-[#ded9d0] bg-white p-5 text-center">
              <p className="font-semibold text-[#20231f]">No restaurants available</p>
              <p className="mt-1 text-sm text-[#777b73]">Restaurants will appear here after they are registered and activated in TableTab.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RegisterCustomer({ onBack, onRegistered, qrHotel }: { onBack: () => void; onRegistered: (result: AuthResult) => void; qrHotel?: Hotel }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Please enter your full name.");
    if (!/\S+@\S+\.\S+/.test(form.email)) return setError("Enter a valid email address.");
    if (form.password.length < 8) return setError("Password must contain at least 8 characters.");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match.");
    setLoading(true);
    try {
      const result = await signUpCustomer(form.name, form.email, form.password, form.phone);
      if (result.access_token) {
        onRegistered({ role: "customer", hotel: qrHotel?.id, email: form.email.trim().toLowerCase() });
      } else {
        setMessage(`Account created. We sent a verification email to ${form.email.trim().toLowerCase()}. Open that email and click “Confirm your email” to activate your account.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create customer account.");
    } finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#f3f0ea] p-4 sm:p-6">
      <div className="w-full max-w-[520px] overflow-hidden rounded-[24px] border border-[#ded9d0] bg-white shadow-[0px_8px_32px_rgba(0,0,0,0.08)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#ded9d0] bg-[#252824] p-6 sm:p-8">
          <div>
            <p className="font-['Inter:Bold'] text-[11px] font-bold uppercase tracking-[0.12em] text-[#f4c07a]">Join TableTab</p>
            <p className="font-['DM_Sans:ExtraBold'] text-[25px] font-extrabold text-white">Create your customer account</p>
            <p className="mt-1 font-['Inter:Regular'] text-[13px] text-[rgba(255,255,255,0.65)]">Save your orders and keep your dining session connected across the restaurant.</p>
          </div>
          <button type="button" onClick={onBack} className="flex size-[38px] shrink-0 items-center justify-center rounded-full border border-[rgba(255,255,255,0.18)] text-white hover:bg-[rgba(255,255,255,0.08)]" aria-label="Back">✕</button>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-4 p-6 sm:p-8">
          {[['name','Full name','Aarav Sharma','text'],['email','Email','you@example.com','email'],['phone','Phone (optional)','+91 98765 43210','tel']].map(([key,label,placeholder,type]) => (
            <label key={key} className="flex flex-col gap-[7px]">
              <span className="font-['Inter:Bold'] text-[12px] font-bold text-[#20231f]">{label}</span>
              <input type={type} value={form[key as keyof typeof form]} onChange={e => { setForm(v => ({ ...v, [key]: e.target.value })); setError(""); }} placeholder={placeholder} autoComplete={key === 'email' ? 'email' : key === 'name' ? 'name' : 'tel'} className="h-[46px] rounded-[10px] border border-[#ded9d0] bg-[#faf9f7] px-[13px] font-['Inter:Regular'] text-[13px] text-[#20231f] outline-none focus:border-[#b44b2a] focus:bg-white" />
            </label>
          ))}
          <label className="flex flex-col gap-[7px]"><span className="font-['Inter:Bold'] text-[12px] font-bold text-[#20231f]">Password</span><input type="password" value={form.password} onChange={e => { setForm(v => ({ ...v, password: e.target.value })); setError(""); }} placeholder="At least 8 characters" autoComplete="new-password" className="h-[46px] rounded-[10px] border border-[#ded9d0] bg-[#faf9f7] px-[13px] font-['Inter:Regular'] text-[13px] text-[#20231f] outline-none focus:border-[#b44b2a] focus:bg-white" /></label>
          <label className="flex flex-col gap-[7px]"><span className="font-['Inter:Bold'] text-[12px] font-bold text-[#20231f]">Confirm password</span><input type="password" value={form.confirmPassword} onChange={e => { setForm(v => ({ ...v, confirmPassword: e.target.value })); setError(""); }} placeholder="Repeat password" autoComplete="new-password" className="h-[46px] rounded-[10px] border border-[#ded9d0] bg-[#faf9f7] px-[13px] font-['Inter:Regular'] text-[13px] text-[#20231f] outline-none focus:border-[#b44b2a] focus:bg-white" /></label>
          {message && <div className="rounded-[10px] border border-[#bbdccb] bg-[#e8f4ee] p-3 font-['Inter:Regular'] text-[12px] text-[#276348]">
            <p>{message}</p>
            <button type="button" disabled={resending} onClick={async () => {
              setResending(true); setError("");
              try { await resendCustomerVerification(form.email); setMessage("A new verification email has been sent. Check your inbox and spam folder."); }
              catch (err) { setError(err instanceof Error ? err.message : "Unable to resend verification email."); }
              finally { setResending(false); }
            }} className="mt-2 font-['Inter:Bold'] font-bold text-[#b44b2a] hover:underline disabled:opacity-50">{resending ? "Sending…" : "Resend verification email"}</button>
          </div>}
          {error && <p className="rounded-[10px] border border-[#fecaca] bg-[#fef2f2] p-3 font-['Inter:Regular'] text-[12px] text-[#dc2626]">{error}</p>}
          <button disabled={loading} type="submit" className="mt-1 flex h-[48px] items-center justify-center rounded-[12px] bg-[#b44b2a] px-6 font-['Inter:Bold'] text-[14px] font-bold text-white hover:opacity-90 disabled:opacity-50">{loading ? 'Creating account…' : 'Create customer account'}</button>
          {qrHotel && <p className="text-center font-['Inter:Regular'] text-[11px] text-[#8a8d86]">After signing in, you'll continue to {qrHotel.name}.</p>}
        </form>
      </div>
    </div>
  );
}

function RegisterProperty({ onBack, onRegister }: { onBack: () => void; onRegister: (result: AuthResult) => void }) {
  const [form, setForm] = useState({
    propertyName: "",
    organization: "",
    ownerName: "",
    email: "",
    phone: "",
    address: "",
    cuisine: "",
    tables: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  function update(field: keyof typeof form, value: string) {
    setForm(current => ({ ...current, [field]: value }));
    setError("");
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const email = form.email.trim().toLowerCase();
    const domain = email.split("@")[1] ?? "";
    const tableCount = Number(form.tables);
    if (!form.propertyName.trim() || !form.organization.trim() || !form.ownerName.trim()) return setError("Please complete the property and organization details.");
    if (!/\S+@\S+\.\S+/.test(email) || !domain) return setError("Enter a valid work email address.");
    if (!Number.isInteger(tableCount) || tableCount < 1 || tableCount > 500) return setError("Enter a table count between 1 and 500.");
    if (form.password.length < 8) return setError("Password must contain at least 8 characters.");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match.");
    try {
      const result = await registerProperty({ propertyName: form.propertyName, organization: form.organization, ownerName: form.ownerName, email, phone: form.phone, address: form.address, cuisine: form.cuisine, tables: tableCount, password: form.password });
      await signIn(email, form.password);
      onRegister({ role: "staff", hotel: result.property.id, email });
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to create property workspace."); }
  }

  const fields: Array<{ key: keyof typeof form; label: string; placeholder: string; type?: string; span?: boolean }> = [
    { key: "propertyName", label: "Property name", placeholder: "The Royal Orchid" },
    { key: "organization", label: "Organization", placeholder: "Orchid Hospitality Group" },
    { key: "ownerName", label: "Your full name", placeholder: "Aarav Sharma" },
    { key: "email", label: "Work email", placeholder: "owner@royalorchid.com", type: "email" },
    { key: "phone", label: "Phone", placeholder: "+1 415 555 0124", type: "tel" },
    { key: "tables", label: "Number of tables", placeholder: "24", type: "number" },
    { key: "cuisine", label: "Cuisine or concept", placeholder: "Modern Indian dining", span: true },
    { key: "address", label: "Property address", placeholder: "Street, city, state, postal code", span: true },
    { key: "password", label: "Create password", placeholder: "At least 8 characters", type: "password" },
    { key: "confirmPassword", label: "Confirm password", placeholder: "Repeat password", type: "password" },
  ];

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#f3f0ea] p-4 sm:p-6">
      <div className="w-full max-w-[760px] overflow-hidden rounded-[24px] border border-[#ded9d0] bg-white shadow-[0px_8px_32px_rgba(0,0,0,0.08)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#ded9d0] bg-[#252824] p-6 sm:p-8">
          <div className="flex gap-4">
            <div className="flex size-[48px] shrink-0 items-center justify-center rounded-[14px] bg-[#b44b2a]">
              <img alt="" className="size-[26px]" src={imgChefHat} />
            </div>
            <div>
              <p className="font-['Inter:Bold'] text-[11px] font-bold uppercase tracking-[0.12em] text-[#f4c07a]">Join TableTab</p>
              <p className="font-['DM_Sans:ExtraBold'] text-[25px] font-extrabold text-white">Register your property</p>
              <p className="mt-1 font-['Inter:Regular'] text-[13px] text-[rgba(255,255,255,0.65)]">Add your hotel or restaurant details manually to create a staff workspace.</p>
            </div>
          </div>
          <button type="button" onClick={onBack} className="flex size-[38px] shrink-0 items-center justify-center rounded-full border border-[rgba(255,255,255,0.18)] text-white hover:bg-[rgba(255,255,255,0.08)]" aria-label="Back to sign in">✕</button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-6 p-6 sm:p-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map(field => (
              <label key={field.key} className={`flex flex-col gap-[7px] ${field.span ? "sm:col-span-2" : ""}`}>
                <span className="font-['Inter:Bold'] text-[12px] font-bold text-[#20231f]">{field.label}</span>
                <input
                  type={field.type ?? "text"}
                  value={form[field.key]}
                  onChange={e => update(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  min={field.key === "tables" ? 1 : undefined}
                  max={field.key === "tables" ? 500 : undefined}
                  className="h-[46px] rounded-[10px] border border-[#ded9d0] bg-[#faf9f7] px-[13px] font-['Inter:Regular'] text-[13px] text-[#20231f] outline-none transition-colors placeholder:text-[#aaa9a5] focus:border-[#b44b2a] focus:bg-white"
                />
              </label>
            ))}
          </div>

          {error && <p className="rounded-[10px] border border-[#fecaca] bg-[#fef2f2] p-3 font-['Inter:Regular'] text-[12px] text-[#dc2626]">{error}</p>}

          <div className="flex flex-col-reverse items-center justify-between gap-3 border-t border-[#ede9e2] pt-5 sm:flex-row">
            <p className="font-['Inter:Regular'] text-[11px] text-[#8a8d86]">Property details are stored securely in your TableTab PostgreSQL workspace.</p>
            <button type="submit" className="flex h-[48px] w-full items-center justify-center rounded-[12px] bg-[#b44b2a] px-6 font-['Inter:Bold'] text-[14px] font-bold text-white hover:opacity-90 sm:w-auto">Create property workspace</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main login form ───────────────────────────────────────────────
interface Props { onLogin: (result: AuthResult) => void; customerOnly?: boolean; qrHotel?: Hotel; initialCustomerEmail?: string; }

export default function LoginScreen({ onLogin, customerOnly = false, qrHotel, initialCustomerEmail }: Props) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(initialCustomerEmail ?? null); // waiting for hotel pick
  const [showRegister, setShowRegister] = useState(false);
  const [showCustomerRegister, setShowCustomerRegister] = useState(false);

  function handleGoogleSignIn() {
    setError("");
    try {
      startGoogleSignIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start Google sign-in");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) return setError("Please enter your email.");
    if (!/\S+@\S+\.\S+/.test(email)) return setError("Please enter a valid email address.");
    if (!password.trim()) return setError("Please enter your password.");
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      const me = await getCurrentUser();
      if (me.memberships?.length && !customerOnly) {
        onLogin({ role: "staff", hotel: me.memberships[0].property_id, email: email.trim().toLowerCase() });
      } else {
        if (qrHotel) onLogin({ role: "customer", hotel: qrHotel.id, email: email.trim().toLowerCase() });
        else setPendingEmail(email.trim().toLowerCase());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally { setLoading(false); }
  }

  // Show hotel picker after customer auth
  if (showRegister) {
    return <RegisterProperty onBack={() => setShowRegister(false)} onRegister={onLogin} />;
  }

  if (showCustomerRegister) {
    return <RegisterCustomer qrHotel={qrHotel} onBack={() => setShowCustomerRegister(false)} onRegistered={onLogin} />;
  }

  if (pendingEmail) {
    return <HotelPicker email={pendingEmail} onPick={onLogin} />;
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#f3f0ea] p-6">
      <div className="flex flex-col gap-8 items-center w-full max-w-[400px]">

        {/* Brand */}
        <div className="flex flex-col gap-4 items-center">
          <div className="bg-[#b44b2a] flex items-center justify-center rounded-[16px] size-[56px] shadow-[0px_4px_16px_rgba(180,75,42,0.3)]">
            <div className="relative size-[30px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgChefHat} /></div>
          </div>
          <div className="flex flex-col gap-1 items-center">
            <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[26px]" style={{ fontVariationSettings: '"opsz" 14' }}>TableTab</p>
            <p className="font-['Inter:Regular'] font-normal text-[#8a8d86] text-[14px]">Sign in to continue</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#ded9d0] border-solid flex flex-col gap-5 items-start p-7 rounded-[20px] shadow-[0px_4px_24px_rgba(0,0,0,0.07)] w-full">

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-start w-full">

            {/* Email */}
            <div className="flex flex-col gap-[6px] items-start w-full">
              <label className="font-['Inter:Bold'] font-bold text-[#20231f] text-[13px]">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                placeholder="you@email.com"
                autoComplete="email"
                autoFocus
                className="bg-[#faf9f7] border border-[#ded9d0] border-solid h-[48px] outline-none px-[14px] rounded-[10px] text-[#20231f] text-[14px] font-['Inter:Regular'] font-normal w-full transition-colors focus:border-[#b44b2a] focus:bg-white placeholder:text-[#c0bbb3]"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-[6px] items-start w-full">
              <div className="flex items-center justify-between w-full">
                <label className="font-['Inter:Bold'] font-bold text-[#20231f] text-[13px]">Password</label>
                <button type="button" className="font-['Inter:Bold'] font-bold text-[#b44b2a] text-[12px] hover:opacity-70 transition-opacity">Forgot?</button>
              </div>
              <div className="relative w-full">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="bg-[#faf9f7] border border-[#ded9d0] border-solid h-[48px] outline-none px-[14px] pr-[44px] rounded-[10px] text-[#20231f] text-[14px] font-['Inter:Regular'] font-normal w-full transition-colors focus:border-[#b44b2a] focus:bg-white placeholder:text-[#c0bbb3]"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-[12px] top-1/2 -translate-y-1/2 text-[#aaa9a5] hover:text-[#575b54] transition-colors"
                >
                  {showPass
                    ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10 10 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9 9 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-[#fef2f2] border border-[#fecaca] border-solid flex gap-[8px] items-start p-[11px] rounded-[9px] w-full">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-[1px]"><circle cx="8" cy="8" r="6" stroke="#ef4444" strokeWidth="1.4"/><path d="M8 5v3M8 10.5v.5" stroke="#ef4444" strokeWidth="1.4" strokeLinecap="round"/></svg>
                <p className="font-['Inter:Regular'] font-normal text-[#dc2626] text-[12px] leading-[1.4]">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="bg-[#b44b2a] flex h-[50px] items-center justify-center rounded-[12px] text-white w-full transition-opacity hover:opacity-90 disabled:opacity-55 mt-1"
            >
              {loading
                ? <svg className="animate-spin size-[20px]" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="3"/><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                : <p className="font-['Inter:Bold'] font-bold text-[15px]">Continue</p>
              }
            </button>
          </form>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="flex h-[48px] w-full items-center justify-center gap-3 rounded-[12px] border border-[#ded9d0] bg-white text-[14px] font-semibold text-[#20231f] transition-colors hover:bg-[#faf9f7] disabled:opacity-60"
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" transform="translate(0 4)" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.95 46.98 31.8 46.98 24.55Z" />
              <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z" transform="translate(0 0)" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.44-4.88 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
            </svg>
            Continue with Google
          </button>

        </div>

        <div className="flex flex-col gap-2 items-center w-full">
          <p className="font-['Inter:Regular'] font-normal text-[#aaa9a5] text-[12px] text-center">
            New customer? <button onClick={() => setShowCustomerRegister(true)} className="font-['Inter:Bold'] font-bold text-[#b44b2a] hover:opacity-75 transition-opacity">Create an account</button>
          </p>
          {!customerOnly && <p className="font-['Inter:Regular'] font-normal text-[#aaa9a5] text-[12px] text-center">
            Business owner? <button onClick={() => setShowRegister(true)} className="font-['Inter:Bold'] font-bold text-[#b44b2a] hover:opacity-75 transition-opacity">Register your property</button>
          </p>}
        </div>


      </div>
    </div>
  );
}
