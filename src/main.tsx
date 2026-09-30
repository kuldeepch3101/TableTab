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
    consumeAuthCallback();
    getCurrentUser()
      .then(me => {
        const email = me.user?.email ?? me.profile?.email ?? "";
        if (me.memberships?.length) setAuth({ role: "staff", hotel: me.memberships[0].property_id, email });
      })
      .catch(() => {})
      .finally(() => setRestoring(false));
  }, []);

  function handleLogout() { clearAccessToken(); setAuth(null); }

  // Table QR codes use links such as /?hotel=saffron&table=12. A valid
  // scanned link opens the customer menu immediately—no login required.
  if (restoring) return <div className="min-h-screen w-full bg-[#f3f0ea] flex items-center justify-center text-[#575b54] font-['Inter:Regular'] text-sm">Loading your TableTab account…</div>;

  const params = new URLSearchParams(window.location.search);
  const scannedHotel = getHotels().find(h => h.id === params.get('hotel'));
  const scannedTableValue = params.get('table')?.trim() ?? '';
  const scannedToken = params.get('token')?.trim() ?? "";
  const scannedTable = /^(?:[1-9]|[1-9]\d)$/.test(scannedTableValue)
    ? scannedTableValue.padStart(2, '0')
    : null;

  if (scannedHotel && (scannedTable || scannedToken) && !auth) {
    return <LoginScreen onLogin={r => setAuth(r)} customerOnly qrHotel={scannedHotel} />;
  }

  if (scannedHotel && (scannedTable || scannedToken) && auth?.role === "customer") {
    return <App hotel={scannedHotel} table={scannedTable || undefined} />;
  }

  if (!auth) return <LoginScreen onLogin={r => setAuth(r)} />;

  const hotel = getHotels().find(h => h.id === auth.hotel);

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
