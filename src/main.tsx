import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import KitchenApp from './KitchenApp'
import AdminApp from './AdminApp'
import LoginScreen, { type AuthResult, getHotels } from './LoginScreen'
import { clearAccessToken, consumeAuthCallback, getCurrentUser } from './lib/tabletabApi'
import './index.css'

type StaffView = 'admin' | 'kitchen';

function Root() {
  const [auth, setAuth] = useState<AuthResult | null>(null);
  const [staffView, setStaffView] = useState<StaffView>('admin');
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    // Supabase email verification redirects back with an access token in the URL hash.
    // Consume it before restoring the authenticated user.
    (async () => {
      await consumeAuthCallback();
      return getCurrentUser();
    })()
      .then(me => {
        const email = me.user?.email ?? me.profile?.email ?? "";
        if (me.memberships?.length) {
          setAuth({ role: "staff", hotel: me.memberships[0].property_id, email });
        } else if (localStorage.getItem("tabletab:access-token")) {
          // OAuth/customer accounts may not have a staff property membership.
          // Keep the authenticated customer in the app; QR context is handled below.
          setAuth({ role: "customer", email });
        }
      })
      .catch(() => {})
      .finally(() => setRestoring(false));
  }, []);

  function handleLogout() { clearAccessToken(); setAuth(null); }

  // Table QR codes use links such as /?hotel=saffron&token=...
  // The QR identifies the table/session; the customer still signs in before
  // entering the customer app.
  if (restoring) return <div className="min-h-screen w-full bg-[#f3f0ea] flex items-center justify-center text-[#575b54] font-['Inter:Regular'] text-sm">Loading your TableTab account…</div>;

  const params = new URLSearchParams(window.location.search);
  const scannedHotelId = params.get('hotel')?.trim() ?? '';
  const scannedToken = params.get('token')?.trim() ?? "";
  const scannedHotel = getHotels().find(h => h.id === scannedHotelId) ?? (scannedToken && scannedHotelId ? {
    id: scannedHotelId,
    name: "TableTab",
    organization: "",
    cuisine: "Restaurant dining",
    tables: 0,
    domain: "",
    color: "#b44b2a",
  } : undefined);
  const scannedTableValue = params.get('table')?.trim() ?? '';
  const scannedTable = /^(?:[1-9]|[1-9]\d)$/.test(scannedTableValue)
    ? scannedTableValue.padStart(2, '0')
    : null;

  const hasQrContext = Boolean(scannedHotel && (scannedTable || scannedToken));

  // A QR scan always enters the customer authentication flow. This also
  // prevents an already-signed-in staff account from accidentally opening
  // the staff dashboard when a customer QR is scanned on the same browser.
  if (hasQrContext && auth?.role !== "customer") {
    return <LoginScreen onLogin={r => setAuth(r)} customerOnly qrHotel={scannedHotel} />;
  }

  if (hasQrContext && auth?.role === "customer") {
    return <App hotel={scannedHotel} table={scannedTable || undefined} />;
  }

  if (!auth) return <LoginScreen onLogin={r => setAuth(r)} />;

  // OAuth customers without a table QR choose the restaurant after signing in.
  if (auth.role === "customer" && !auth.hotel && !hasQrContext) {
    return <LoginScreen onLogin={r => setAuth(r)} initialCustomerEmail={auth.email} />;
  }

  // Staff memberships store the real Supabase property UUID. The demo
  // hotel list uses slugs such as "saffron", so keep the UUID as the
  // propertyId passed to Admin/Kitchen instead of dropping it.
  const hotel = getHotels().find(h => h.id === auth.hotel) ?? (
    auth.hotel
      ? {
          id: auth.hotel,
          name: "TableTab Restaurant",
          organization: "",
          cuisine: "Restaurant dining",
          tables: 0,
          domain: "",
          color: "#b44b2a",
        }
      : undefined
  );

  // ── Customer ──────────────────────────────────────────────────
  if (auth.role === 'customer') {
    return (
      <>
        <App hotel={hotel} />
        <div style={{
          position: 'fixed', bottom: 18, right: 18, zIndex: 9999,
          display: 'flex', gap: 8, alignItems: 'center',
          background: 'rgba(30,34,32,0.90)', padding: '6px 12px',
          borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
        }}>
          {hotel && <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'sans-serif', fontSize: 11 }}>{hotel.name}</p>}
          {hotel && <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.15)' }} />}
          <button onClick={handleLogout} style={{ background: 'transparent', color: 'rgba(255,255,255,0.5)', border: 'none', fontFamily: 'sans-serif', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Sign out</button>
        </div>
      </>
    );
  }

  // ── Staff ─────────────────────────────────────────────────────
  return (
    <>
      <div style={{
        position: 'fixed', bottom: 18, right: 18, zIndex: 9999,
        display: 'flex', gap: 6, alignItems: 'center',
        background: 'rgba(30,34,32,0.92)', padding: '6px 8px',
        borderRadius: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}>
        {hotel && <p style={{ color: 'rgba(255,255,255,0.42)', fontFamily: 'sans-serif', fontSize: 10, fontWeight: 600, paddingLeft: 4, paddingRight: 2, letterSpacing: '0.03em', textTransform: 'uppercase' }}>{hotel.name}</p>}
        <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.15)', margin: '0 2px' }} />
        {(['admin', 'kitchen'] as StaffView[]).map(v => (
          <button key={v} onClick={() => setStaffView(v)} style={{
            background: staffView === v ? '#b44b2a' : 'transparent',
            color: staffView === v ? '#fff' : 'rgba(255,255,255,0.6)',
            border: 'none', borderRadius: 8, padding: '5px 12px',
            fontFamily: 'sans-serif', fontSize: 11, fontWeight: 700,
            cursor: 'pointer', letterSpacing: '0.03em', transition: 'all 0.15s',
            textTransform: 'capitalize',
          }}>{v === 'admin' ? 'Admin' : 'Kitchen'}</button>
        ))}
        <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.15)', margin: '0 2px' }} />
        <button onClick={handleLogout} style={{ background: 'transparent', color: 'rgba(255,255,255,0.4)', border: 'none', fontFamily: 'sans-serif', fontSize: 11, fontWeight: 600, cursor: 'pointer', paddingRight: 4 }}>Sign out</button>
      </div>

      {staffView === 'admin'   && <AdminApp propertyId={hotel?.id} />}
      {staffView === 'kitchen' && <KitchenApp propertyId={hotel?.id} />}
    </>
  );
}

declare global {
  interface Window {
    __ttRoot?: ReactDOM.Root;
  }
}

type RootContainer = HTMLElement & {
  __ttRoot?: ReactDOM.Root;
};

const container = document.getElementById('root') as RootContainer;

// Keep the actual Root instance on both the DOM node and window. The DOM
// fiber marker only tells us that a root exists; it cannot be used to call
// render and caused createRoot to run again during some HMR executions.
const root = container.__ttRoot ?? window.__ttRoot ?? ReactDOM.createRoot(container);
container.__ttRoot = root;
window.__ttRoot = root;

root.render(<React.StrictMode><Root /></React.StrictMode>);

if (import.meta.hot) import.meta.hot.accept();

