
import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import KitchenApp from './KitchenApp'
import AdminApp from './AdminApp'
import LoginScreen, {
  type AuthResult,
  type Hotel,
} from './LoginScreen'
import {
  clearAccessToken,
  consumeAuthCallback,
  getCurrentUser,
  getProperties,
} from './lib/tabletabApi'
import './index.css'

type StaffView = 'admin' | 'kitchen';

function Root() {
  const [auth, setAuth] = useState<AuthResult | null>(null);
  const [staffView, setStaffView] = useState<StaffView>('admin');
  const [restoring, setRestoring] = useState(true);

  // Restaurant data fetched from Supabase
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hotelsLoading, setHotelsLoading] = useState(true);
  const [hotelsError, setHotelsError] = useState<string | null>(null);

  // Read QR parameters
  const params = new URLSearchParams(window.location.search);
  const scannedHotelId = params.get('hotel')?.trim() ?? '';
  const scannedToken = params.get('token')?.trim() ?? '';
  const scannedTableValue = params.get('table')?.trim() ?? '';

  const scannedTable = /^(?:[1-9]|[1-9]\d)$/.test(scannedTableValue)
    ? scannedTableValue.padStart(2, '0')
    : null;

  const hasQrContext = Boolean(
    scannedHotelId && (scannedTable || scannedToken)
  );

  // Load real restaurant records from Supabase
  useEffect(() => {
    let cancelled = false;

    async function loadHotels() {
      try {
        setHotelsLoading(true);
        setHotelsError(null);

        const properties = await getProperties();

        if (cancelled) return;

        const mappedHotels: Hotel[] = properties.map((h: any) => ({
          id: String(h.id),
          name: String(h.name ?? 'Restaurant'),
          organization: h.organization ?? '',
          cuisine: h.cuisine ?? 'Restaurant dining',
          tables: Number(h.table_count ?? 0),
          domain: h.email_domain ?? '',
          color: h.color ?? '#b44b2a',
          phone: h.phone,
          address: h.address,
        }));

        setHotels(mappedHotels);
      } catch (error) {
        if (cancelled) return;

        console.error(
          'Unable to load restaurant details from Supabase:',
          error
        );

        setHotelsError(
          error instanceof Error
            ? error.message
            : 'Unable to load restaurant details.'
        );
      } finally {
        if (!cancelled) {
          setHotelsLoading(false);
        }
      }
    }

    loadHotels();

    return () => {
      cancelled = true;
    };
  }, []);

  // Restore authenticated user
  useEffect(() => {
    (async () => {
      await consumeAuthCallback();
      return getCurrentUser();
    })()
      .then(me => {
        const email = me.user?.email ?? me.profile?.email ?? '';

        if (me.memberships?.length) {
          setAuth({
            role: 'staff',
            hotel: me.memberships[0].property_id,
            email,
          });
        } else if (localStorage.getItem('tabletab:access-token')) {
          setAuth({
            role: 'customer',
            email,
          });
        }
      })
      .catch(error => {
        console.error('Unable to restore user:', error);
      })
      .finally(() => setRestoring(false));
  }, []);

  function handleLogout() {
    clearAccessToken();
    setAuth(null);
  }

  // Find the scanned restaurant using its real Supabase ID
  const scannedHotel = hotels.find(
    h => h.id === scannedHotelId
  );

  // Find the logged-in user's restaurant
  const hotel = hotels.find(
    h => h.id === auth?.hotel
  ) ?? (
    auth?.hotel
      ? {
          id: auth.hotel,
          name: 'TableTab Restaurant',
          organization: '',
          cuisine: 'Restaurant dining',
          tables: 0,
          domain: '',
          color: '#b44b2a',
        }
      : undefined
  );

  // Wait for authentication restoration
  if (restoring) {
    return (
      <div className="min-h-screen w-full bg-[#f3f0ea] flex items-center justify-center text-[#575b54] font-['Inter:Regular'] text-sm">
        Loading your TableTab account…
      </div>
    );
  }

  // Wait for restaurant information before opening the QR flow
  if (hasQrContext && hotelsLoading) {
    return (
      <div className="min-h-screen w-full bg-[#f3f0ea] flex items-center justify-center text-[#575b54] font-['Inter:Regular'] text-sm">
        Loading restaurant details…
      </div>
    );
  }

  // Show an error if the QR restaurant cannot be found
  if (hasQrContext && !scannedHotel) {
    return (
      <div className="min-h-screen w-full bg-[#f3f0ea] flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-bold text-[#20231f]">
          Restaurant not found
        </p>
        <p className="text-sm text-[#575b54]">
          {hotelsError
            ? `Unable to load restaurant details: ${hotelsError}`
            : `No restaurant was found for ID: ${scannedHotelId}`}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-[#b44b2a] px-5 py-2 text-white text-sm font-semibold"
        >
          Try again
        </button>
      </div>
    );
  }

  // A QR scan always enters the customer authentication flow.
  if (hasQrContext && auth?.role !== 'customer') {
    return (
      <LoginScreen
        onLogin={r => setAuth(r)}
        customerOnly
        qrHotel={scannedHotel}
      />
    );
  }

  // Customer enters the restaurant through the scanned QR
  if (hasQrContext && auth?.role === 'customer') {
    return (
      <App
        hotel={scannedHotel}
        table={scannedTable || undefined}
      />
    );
  }

  if (!auth) {
    return <LoginScreen onLogin={r => setAuth(r)} />;
  }

  // OAuth customers without a QR choose a restaurant after signing in
  if (auth.role === 'customer' && !auth.hotel && !hasQrContext) {
    return (
      <LoginScreen
        onLogin={r => setAuth(r)}
        initialCustomerEmail={auth.email}
      />
    );
  }

  // Customer without QR
  if (auth.role === 'customer') {
    return (
      <>
        <App hotel={hotel} />

        <div style={{
          position: 'fixed',
          bottom: 18,
          right: 18,
          zIndex: 9999,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          background: 'rgba(30,34,32,0.90)',
          padding: '6px 12px',
          borderRadius: 12,
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
        }}>
          {hotel && (
            <p style={{
              color: 'rgba(255,255,255,0.5)',
              fontFamily: 'sans-serif',
              fontSize: 11,
            }}>
              {hotel.name}
            </p>
          )}

          {hotel && (
            <div style={{
              width: 1,
              height: 14,
              background: 'rgba(255,255,255,0.15)',
            }} />
          )}

          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              color: 'rgba(255,255,255,0.5)',
              border: 'none',
              fontFamily: 'sans-serif',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </>
    );
  }

  // Staff dashboard
  return (
    <>
      <div style={{
        position: 'fixed',
        bottom: 18,
        right: 18,
        zIndex: 9999,
        display: 'flex',
        gap: 6,
        alignItems: 'center',
        background: 'rgba(30,34,32,0.92)',
        padding: '6px 8px',
        borderRadius: 14,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}>
        {hotel && (
          <p style={{
            color: 'rgba(255,255,255,0.42)',
            fontFamily: 'sans-serif',
            fontSize: 10,
            fontWeight: 600,
            paddingLeft: 4,
            paddingRight: 2,
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
          }}>
            {hotel.name}
          </p>
        )}

        <div style={{
          width: 1,
          height: 14,
          background: 'rgba(255,255,255,0.15)',
          margin: '0 2px',
        }} />

        {(['admin', 'kitchen'] as StaffView[]).map(v => (
          <button
            key={v}
            onClick={() => setStaffView(v)}
            style={{
              background: staffView === v ? '#b44b2a' : 'transparent',
              color: staffView === v ? '#fff' : 'rgba(255,255,255,0.6)',
              border: 'none',
              borderRadius: 8,
              padding: '5px 12px',
              fontFamily: 'sans-serif',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.03em',
              transition: 'all 0.15s',
              textTransform: 'capitalize',
            }}
          >
            {v === 'admin' ? 'Admin' : 'Kitchen'}
          </button>
        ))}

        <div style={{
          width: 1,
          height: 14,
          background: 'rgba(255,255,255,0.15)',
          margin: '0 2px',
        }} />

        <button
          onClick={handleLogout}
          style={{
            background: 'transparent',
            color: 'rgba(255,255,255,0.4)',
            border: 'none',
            fontFamily: 'sans-serif',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            paddingRight: 4,
          }}
        >
          Sign out
        </button>
      </div>

      {staffView === 'admin' && (
        <AdminApp propertyId={hotel?.id} />
      )}

      {staffView === 'kitchen' && (
        <KitchenApp propertyId={hotel?.id} />
      )}
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

// Keep the actual Root instance on both the DOM node and window.
const root =
  container.__ttRoot ??
  window.__ttRoot ??
  ReactDOM.createRoot(container);

container.__ttRoot = root;
window.__ttRoot = root;

root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);

if (import.meta.hot) import.meta.hot.accept();
