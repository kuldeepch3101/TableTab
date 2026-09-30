import { useState, useMemo, useEffect } from "react";
import { createDiningSession, createOrder, createServiceRequest, getMenu, getSessionOrders } from "./lib/tabletabApi";

const assetPathPrefix = "/assets";
const imgHero = `${assetPathPrefix}/f7645.png`;
const imgButterChicken = `${assetPathPrefix}/menu-butter-chicken.jpg`;
const imgPaneerTikka = `${assetPathPrefix}/menu-paneer-tikka.jpg`;
const imgChickenBiryani = `${assetPathPrefix}/menu-chicken-biryani.jpg`;
const imgRoganJosh = `${assetPathPrefix}/menu-rogan-josh.jpg`;
const imgMasalaDosa = `${assetPathPrefix}/menu-masala-dosa.jpg`;
const imgSamosa = `${assetPathPrefix}/menu-samosa.jpg`;
const imgGarlicNaan = `${assetPathPrefix}/menu-garlic-naan.jpg`;
const imgMangoLassi = `${assetPathPrefix}/menu-mango-lassi.jpg`;
const imgCircleHelp = `${assetPathPrefix}/572f7.svg`;
const imgBell = `${assetPathPrefix}/f2ace.svg`;
const imgEllipse = `${assetPathPrefix}/55e96.svg`;
const imgEllipse1 = `${assetPathPrefix}/23810.svg`;
const imgPlus = `${assetPathPrefix}/a8bda.svg`;
const imgBell1 = `${assetPathPrefix}/403cf.svg`;
const imgArrowRight = `${assetPathPrefix}/90e93.svg`;
const imgReceiptText = `${assetPathPrefix}/d7d70.svg`;
const imgSearch = `${assetPathPrefix}/63df4.svg`;
const imgPlus1 = `${assetPathPrefix}/65c52.svg`;
const imgEllipse2 = `${assetPathPrefix}/0d1cf.svg`;
const imgEllipse3 = `${assetPathPrefix}/d2ad5.svg`;
const imgEllipse4 = `${assetPathPrefix}/041d8.svg`;
const imgEllipse5 = `${assetPathPrefix}/52e62.svg`;
const imgMinus = `${assetPathPrefix}/86878.svg`;
const imgPlus2 = `${assetPathPrefix}/80edd.svg`;
const imgChevronUp = `${assetPathPrefix}/5a414.svg`;
const imgChevronDown = `${assetPathPrefix}/d973f.svg`;
const imgMessageSquare = `${assetPathPrefix}/ddb1e.svg`;
const imgChevronRight = `${assetPathPrefix}/38a43.svg`;
const imgSend = `${assetPathPrefix}/ae0c5.svg`;
const imgEllipse6 = `${assetPathPrefix}/41282.svg`;
const imgEllipse7 = `${assetPathPrefix}/3b012.svg`;
const imgEllipse8 = `${assetPathPrefix}/28b0b.svg`;
const imgClock = `${assetPathPrefix}/9fe25.svg`;
const imgReceiptText1 = `${assetPathPrefix}/f4681.svg`;
const imgCheck = `${assetPathPrefix}/e3364.svg`;
const imgMail = `${assetPathPrefix}/3b64d.svg`;

type Tab = "menu" | "order" | "bill";
type OrderStatus = "cart" | "placed" | "preparing" | "served";
type BillStatus = "none" | "requested" | "settled";
type SpiceLevel = "mild" | "medium" | "hot";

interface MenuItem {
  id: string;
  name: string;
  desc: string;
  price: number;
  badge: string;
  img: string;
  category: string;
}

interface CartItem {
  item: MenuItem;
  qty: number;
  note?: string;
  spiceLevel?: SpiceLevel;
}

const MENU: MenuItem[] = [
  { id: "butter-chicken", name: "Butter chicken", desc: "Tandoori chicken, tomato makhani, fenugreek", price: 24, badge: "GF", img: imgButterChicken, category: "Popular" },
  { id: "paneer-tikka", name: "Paneer tikka", desc: "Charred peppers, red onion, mint chutney", price: 18, badge: "V", img: imgPaneerTikka, category: "Popular" },
  { id: "biryani", name: "Chicken dum biryani", desc: "Basmati rice, saffron, crispy onions, raita", price: 22, badge: "GF", img: imgChickenBiryani, category: "Mains" },
  { id: "rogan-josh", name: "Lamb rogan josh", desc: "Kashmiri chilli, cardamom, slow-cooked lamb", price: 27, badge: "GF", img: imgRoganJosh, category: "Mains" },
  { id: "dosa", name: "Masala dosa", desc: "Crisp rice crêpe, spiced potato, sambar", price: 16, badge: "V", img: imgMasalaDosa, category: "Mains" },
  { id: "samosa", name: "Vegetable samosa", desc: "Potato, peas, tamarind and mint chutneys", price: 10, badge: "V", img: imgSamosa, category: "Starters" },
  { id: "naan", name: "Garlic butter naan", desc: "Tandoor-baked bread, roasted garlic, coriander", price: 6, badge: "V", img: imgGarlicNaan, category: "Breads" },
  { id: "lassi", name: "Mango lassi", desc: "Alphonso mango, yoghurt, cardamom", price: 8, badge: "V", img: imgMangoLassi, category: "Drinks" },
];

const CATEGORIES = ["All", "Popular", "Starters", "Mains", "Breads", "Drinks"];

const TAX = 0.085;
const SERVICE = 0.05;

function calcTotals(cart: CartItem[]) {
  const subtotal = cart.reduce((s, c) => s + c.item.price * c.qty, 0);
  const tax = subtotal * TAX;
  const service = subtotal * SERVICE;
  return { subtotal, tax, service, total: subtotal + tax + service };
}

function fmt(n: number) { return `$${n.toFixed(2)}`; }

interface AppProps {
  hotel?: {
    id: string;
    name: string;
    cuisine: string;
  };
  table?: string;
}

export default function App({ hotel, table }: AppProps) {
  const [tab, setTab] = useState<Tab>("menu");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("cart");
  const [billStatus, setBillStatus] = useState<BillStatus>("none");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [spiceLevel, setSpiceLevel] = useState<SpiceLevel>("medium");
  const [detailQty, setDetailQty] = useState(1);
  const [detailNote, setDetailNote] = useState("");
  const [addedItem, setAddedItem] = useState<string | null>(null);
  const [orderNote, setOrderNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [menu, setMenu] = useState<MenuItem[]>(MENU);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [backendOrderId, setBackendOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!hotel) return;
    getMenu(hotel.id).then(rows => setMenu(rows.map((m: any) => ({ id: m.id, name: m.name, desc: m.desc, price: m.price, badge: m.badge, img: m.img, category: m.category })))).catch(err => console.warn("Unable to load menu", err));
    const token = new URLSearchParams(window.location.search).get("token");
    if (token) createDiningSession(token, 2).then(session => setSessionToken(session.public_token)).catch(err => console.warn("Unable to start QR dining session", err));
  }, [hotel?.id]);

  useEffect(() => {
    if (!sessionToken) return;
    let stopped = false;
    const sync = async () => {
      try {
        const orders = await getSessionOrders(sessionToken);
        const latest = orders[0];
        if (!latest || stopped) return;
        setBackendOrderId(latest.id);
        const next = latest.status === "new" ? "placed" : latest.status === "preparing" ? "preparing" : latest.status === "ready" || latest.status === "served" ? "served" : latest.status === "cancelled" ? "cart" : "placed";
        setOrderStatus(next);
      } catch (error) {
        if (!stopped) console.warn("Unable to sync order status", error);
      }
    };
    sync();
    const timer = window.setInterval(sync, 2500);
    return () => { stopped = true; window.clearInterval(timer); };
  }, [sessionToken]);

  const sessionStart = "7:02 PM";
  const elapsed = "32 min";
  const venueName = hotel?.name ?? "Saffron & Ember";
  const venueCuisine = hotel?.cuisine ?? "Modern Indian dining";
  const tableNumber = (table ?? (hotel?.id === "grandpalms" ? "08" : "12")).padStart(2, "0");
  const orderNumber = hotel?.id === "grandpalms"
    ? `GP-${2078 + Number(tableNumber)}`
    : `TT-${1036 + Number(tableNumber)}`;

  const filtered = useMemo(() => {
    return menu.filter(m => {
      const matchCat = category === "All" || m.category === category;
      const matchSearch = search === "" || m.name.toLowerCase().includes(search.toLowerCase()) || m.desc.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [category, search]);

  const allFiltered = useMemo(() => {
    if (search === "") return filtered;
    return menu.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.desc.toLowerCase().includes(search.toLowerCase()));
  }, [search, filtered]);

  const displayItems = search !== "" ? allFiltered : filtered;

  function addToCart(item: MenuItem, qty: number, level?: SpiceLevel, note?: string) {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id && c.spiceLevel === level);
      if (existing) return prev.map(c => c.item.id === item.id && c.spiceLevel === level ? { ...c, qty: c.qty + qty, note: note || c.note } : c);
      return [...prev, { item, qty, spiceLevel: level, note: note || undefined }];
    });
    setAddedItem(`${qty}× ${item.name} added`);
    window.setTimeout(() => setAddedItem(null), 2200);
  }

  function updateQty(id: string, level: SpiceLevel | undefined, delta: number) {
    setCart(prev => prev.map(c => c.item.id === id && c.spiceLevel === level ? { ...c, qty: Math.max(1, c.qty + delta) } : c).filter(c => c.qty > 0));
  }

  function removeItem(id: string, level: SpiceLevel | undefined) {
    setCart(prev => prev.filter(c => !(c.item.id === id && c.spiceLevel === level)));
  }

  const totals = calcTotals(cart);
  const totalItems = cart.reduce((s, c) => s + c.qty, 0);

  async function placeOrder() {
    if (cart.length === 0) return;
    if (sessionToken) {
      try {
        const order = await createOrder({ sessionToken, guests: 2, orderNote, items: cart.map(c => ({ menuItemId: c.item.id, quantity: c.qty, spiceLevel: c.spiceLevel, note: c.note })) });
        setBackendOrderId(order.id);
      } catch (error) {
        console.error(error);
      }
    }
    setOrderStatus("placed");
    setTimeout(() => setOrderStatus("preparing"), 800);
    setTab("order");
  }

  async function requestBill() {
    if (sessionToken) {
      try { await createServiceRequest(sessionToken, "bill"); } catch (error) { console.error(error); }
    }
    setBillStatus("requested");
    setTab("bill");
  }

  function settleBill() {
    setBillStatus("settled");
  }

  const sidebarOrderTotal = fmt(totals.total);

  return (
    <div className="min-h-screen w-full bg-[#f3f0ea] p-2 sm:p-4 md:p-8 lg:p-12">
      {/* Help toast */}
      {helpVisible && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#252824] text-white rounded-[18px] p-5 shadow-2xl max-w-xs">
          <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[16px] mb-1" style={{ fontVariationSettings: '"opsz" 14' }}>Server notified</p>
          <p className="font-['Inter:Regular'] font-normal text-[13px] text-[rgba(255,255,255,0.72)]">Your server will be with you shortly.</p>
          <button onClick={() => setHelpVisible(false)} className="mt-3 font-['Inter:Bold'] font-bold text-[#f4c07a] text-[12px]">Dismiss</button>
        </div>
      )}
      {addedItem && (
        <div className="fixed right-4 top-4 z-[60] flex items-center gap-3 rounded-[14px] bg-[#252824] px-4 py-3 text-white shadow-2xl">
          <div className="flex size-[24px] items-center justify-center rounded-full bg-[#32705a]">
            <img alt="" className="size-[14px]" src={imgCheck} />
          </div>
          <div>
            <p className="font-['Inter:Bold'] text-[13px] font-bold">{addedItem}</p>
            <p className="font-['Inter:Regular'] text-[11px] text-[rgba(255,255,255,0.65)]">View it anytime in My order</p>
          </div>
        </div>
      )}

      <div className="bg-[#fbf8f3] border border-[#ded9d0] border-solid flex flex-col items-start overflow-clip rounded-[24px] w-full">
        {/* Top navigation */}
        <div className="bg-white border-[#ded9d0] border-b border-solid flex items-center justify-between px-6 py-[18px] w-full">
          <div className="flex gap-3 items-center">
            <div className="bg-[#b44b2a] flex items-center justify-center overflow-clip rounded-full shrink-0 size-[38px]">
              <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[18px] text-white" style={{ fontVariationSettings: '"opsz" 14' }}>{venueName.charAt(0)}</p>
            </div>
            <div className="flex flex-col gap-[2px] items-start">
              <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[20px]" style={{ fontVariationSettings: '"opsz" 14' }}>TableTab</p>
              <p className="font-['Inter:Regular'] font-normal text-[#575b54] text-[12px]">{venueName} · Table {tableNumber}</p>
            </div>
          </div>
          <div className="hidden md:flex font-['Inter:Bold'] font-bold gap-7 items-center text-[14px]">
            {(["menu", "order", "bill"] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`capitalize cursor-pointer transition-colors ${tab === t ? "text-[#b44b2a]" : "text-[#20231f] hover:text-[#b44b2a]"}`}>
                {t === "menu" ? "Menu" : t === "order" ? `My order${totalItems > 0 ? ` (${totalItems})` : ""}` : "Bill"}
              </button>
            ))}
          </div>
          <div className="flex gap-3 items-center">
            <button onClick={() => setHelpVisible(true)} className="bg-white border border-[#ded9d0] border-solid flex flex-col items-center justify-center overflow-clip rounded-[12px] size-[40px] hover:bg-[#fbf8f3] transition-colors">
              <div className="relative size-[19px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgCircleHelp} /></div>
            </button>
            <button onClick={() => setHelpVisible(true)} className="bg-white border border-[#ded9d0] border-solid flex flex-col items-center justify-center overflow-clip rounded-[12px] size-[40px] hover:bg-[#fbf8f3] transition-colors">
              <div className="relative size-[19px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgBell} /></div>
            </button>
          </div>
        </div>

        {/* Mobile tab bar */}
        <div className="md:hidden flex border-b border-[#ded9d0] w-full bg-white">
          {(["menu", "order", "bill"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 font-['Inter:Bold'] font-bold text-[13px] capitalize transition-colors border-b-2 ${tab === t ? "text-[#b44b2a] border-[#b44b2a]" : "text-[#575b54] border-transparent"}`}>
              {t === "order" ? `Order${totalItems > 0 ? ` (${totalItems})` : ""}` : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="flex flex-col lg:flex-row gap-8 items-start p-6 md:p-8 w-full">
          {/* Sidebar */}
          <div className="flex flex-col gap-4 items-start w-full lg:w-[280px] lg:shrink-0">
            <div className="bg-[#252824] flex flex-col gap-3 items-start p-[18px] rounded-[18px] w-full">
              <div className="flex items-center justify-between w-full">
                <div className="flex gap-2 items-center">
                  <div className="relative shrink-0 size-[7px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse} /></div>
                  <p className="font-['Inter:Regular'] font-normal text-[12px] text-white whitespace-nowrap">TABLE {tableNumber}</p>
                  <p className="font-['Inter:Regular'] font-normal text-[#8a8d86] text-[12px]">•</p>
                  <p className="font-['Inter:Regular'] font-normal text-[12px] text-white whitespace-nowrap">{orderNumber}</p>
                </div>
                <p className="font-['Inter:Bold'] font-bold text-[#f4c07a] text-[11px] whitespace-nowrap">DINING · {elapsed}</p>
              </div>
              <p className="font-['Inter:Regular'] font-normal leading-[1.45] text-[13px] text-[rgba(255,255,255,0.72)] w-full">
                Your order is synchronized with the kitchen and your server. Use the menu to add more items or request the bill when you are ready.
              </p>
            </div>
            <div className="bg-white border border-[#ded9d0] border-solid flex gap-2 items-center p-[14px] rounded-[12px] w-full">
              <div className="relative shrink-0 size-[8px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse1} /></div>
              <p className="font-['Inter:Regular'] font-normal text-[#32705a] text-[12px] whitespace-nowrap">Guest service online</p>
            </div>
            <div className="bg-white border border-[#ded9d0] border-solid flex flex-col gap-3 items-start p-[18px] rounded-[18px] w-full">
              <p className="font-['Inter:Extra_Bold'] font-extrabold text-[#20231f] text-[14px]">Order summary</p>
              {[["Items", String(totalItems)], ["Current total", totalItems > 0 ? sidebarOrderTotal : "—"], ["Elapsed", elapsed]].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between text-[13px] w-full">
                  <p className="font-['Inter:Regular'] font-normal text-[#575b54]">{label}</p>
                  <p className="font-['Inter:Extra_Bold'] font-extrabold text-[#20231f]">{value}</p>
                </div>
              ))}
            </div>
            <div className="bg-[#252824] flex flex-col gap-3 items-start p-[18px] rounded-[18px] w-full">
              <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[20px] text-white whitespace-nowrap" style={{ fontVariationSettings: '"opsz" 14' }}>Quick actions</p>
              <div className="flex gap-[10px] items-start w-full">
                <button onClick={() => setTab("menu")} className="bg-[#b44b2a] flex flex-col h-[46px] items-center justify-center rounded-[12px] flex-1 gap-1 hover:opacity-90 transition-opacity">
                  <div className="relative size-[17px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgPlus} /></div>
                  <p className="font-['Inter:Regular'] font-normal text-[14px] text-white whitespace-nowrap">Add more</p>
                </button>
                <button onClick={() => setHelpVisible(true)} className="bg-white border border-[#ded9d0] border-solid flex flex-col h-[46px] items-center justify-center rounded-[12px] flex-1 gap-1 hover:bg-[#fbf8f3] transition-colors">
                  <div className="relative size-[17px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgBell1} /></div>
                  <p className="font-['Inter:Regular'] font-normal text-[#20231f] text-[14px] whitespace-nowrap">Need help</p>
                </button>
              </div>
            </div>
          </div>

          {/* Main stage */}
          <div className="flex flex-1 flex-col gap-6 items-start min-w-0 w-full">

            {/* ── MENU TAB ── */}
            {tab === "menu" && (
              <>
                {/* Hero */}
                <div className="flex flex-col h-[260px] sm:h-[320px] items-start justify-between overflow-clip p-5 sm:p-8 relative rounded-[24px] w-full">
                  <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgHero} />
                  <div className="absolute bg-gradient-to-b from-[rgba(23,25,20,0.13)] inset-0 to-[rgba(23,25,20,0.85)]" />
                  <div className="flex items-center justify-between relative w-full">
                    <div className="flex gap-3 items-center">
                      <div className="bg-white flex flex-col items-center justify-center overflow-clip relative rounded-full size-[38px]">
                        <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#b44b2a] text-[18px]" style={{ fontVariationSettings: '"opsz" 14' }}>{venueName.charAt(0)}</p>
                      </div>
                      <div className="flex flex-col gap-[2px] items-start">
                        <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[24px] text-white" style={{ fontVariationSettings: '"opsz" 14' }}>{venueName}</p>
                        <p className="font-['Inter:Regular'] font-normal text-[13px] text-[rgba(255,255,255,0.85)]">Table {tableNumber} · {orderNumber}</p>
                      </div>
                    </div>
                    <div className="bg-[rgba(255,255,255,0.9)] flex items-start px-3 py-2 rounded-full">
                      <p className="font-['Inter:Extra_Bold'] font-extrabold text-[#20231f] text-[12px] whitespace-nowrap">TABLE {tableNumber}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-start relative">
                    <p className="font-['Inter:Bold'] font-bold text-[#f4c07a] text-[12px] uppercase whitespace-nowrap">WELCOME TO</p>
                    <p className="font-['DM_Sans:Regular'] font-normal leading-[1.1] text-[34px] text-white" style={{ fontVariationSettings: '"opsz" 14' }}>{venueName}</p>
                    <p className="font-['Inter:Regular'] font-normal leading-[1.45] text-[14px] text-[rgba(255,255,255,0.85)]">{venueCuisine} · Order straight from your table.</p>
                  </div>
                </div>

                {/* Welcome body */}
                <div className="bg-white border border-[#ded9d0] border-solid flex flex-col md:flex-row gap-6 items-start p-6 rounded-[24px] w-full">
                  <div className="flex flex-1 flex-col gap-[18px] items-start min-w-0">
                    <div className="bg-[#fbf8f3] border border-[#ded9d0] border-solid flex items-center justify-between p-[14px] rounded-[12px] w-full">
                      <div className="flex gap-[6px] items-center">
                        <div className="relative size-[8px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse1} /></div>
                        <p className="font-['Inter:Regular'] font-normal text-[#32705a] text-[12px] whitespace-nowrap">Service is live</p>
                      </div>
                      <p className="font-['Inter:Regular'] font-normal text-[#575b54] text-[12px] whitespace-nowrap">Kitchen until 10:30 PM</p>
                    </div>
                    <div className="flex flex-col gap-2 items-start w-full">
                      <p className="font-['DM_Sans:Regular'] font-normal text-[#20231f] text-[24px]" style={{ fontVariationSettings: '"opsz" 14' }}>Ready when you are</p>
                      <p className="font-['Inter:Regular'] font-normal leading-[1.5] text-[#575b54] text-[14px] w-full">Browse the menu, order at your pace, and follow every plate from kitchen to table.</p>
                    </div>
                    <div className="flex flex-wrap gap-3 items-start w-full">
                      <button onClick={() => setTab("menu")} className="bg-[#b44b2a] border border-[#b44b2a] border-solid flex gap-2 h-[46px] items-center justify-center px-4 rounded-[12px] hover:opacity-90 transition-opacity">
                        <div className="relative size-[17px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgArrowRight} /></div>
                        <p className="font-['Inter:Regular'] font-normal text-[14px] text-white whitespace-nowrap">Browse the menu</p>
                      </button>
                      <button onClick={() => setTab("order")} className="bg-[#fbf8f3] border border-[#ded9d0] border-solid flex gap-2 h-[46px] items-center justify-center px-4 rounded-[12px] hover:bg-white transition-colors">
                        <div className="relative size-[17px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgReceiptText} /></div>
                        <p className="font-['Inter:Regular'] font-normal text-[#20231f] text-[14px] whitespace-nowrap">View my order</p>
                      </button>
                      <button onClick={() => setHelpVisible(true)} className="bg-white border border-[#ded9d0] border-solid flex flex-col h-[46px] items-center justify-center rounded-[12px] w-[48px] hover:bg-[#fbf8f3] transition-colors">
                        <div className="relative size-[19px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgBell} /></div>
                      </button>
                    </div>
                  </div>
                  <div className="bg-[#fbf8f3] border border-[#ded9d0] border-solid flex flex-col gap-[14px] items-start p-5 rounded-[18px] w-full md:w-[260px] shrink-0">
                    <p className="font-['Inter:Extra_Bold'] font-extrabold text-[#20231f] text-[14px]">Dining session</p>
                    {[["Opened", sessionStart], ["Guests", "2"], ["Current total", totalItems > 0 ? sidebarOrderTotal : "—"], ["Elapsed", elapsed]].map(([label, value]) => (
                      <div key={label} className="flex items-start justify-between text-[13px] w-full">
                        <p className="font-['Inter:Regular'] font-normal text-[#575b54]">{label}</p>
                        <p className="font-['Inter:Extra_Bold'] font-extrabold text-[#20231f]">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Menu section */}
                <div className="bg-white border border-[#ded9d0] border-solid flex flex-col gap-[18px] items-start p-6 rounded-[24px] w-full">
                  <div className="flex items-end justify-between w-full">
                    <div>
                      <p className="font-['Inter:Bold'] font-bold text-[#b44b2a] text-[11px] uppercase tracking-[0.12em]">Tonight at {venueName}</p>
                      <p className="font-['DM_Sans:Regular'] font-normal text-[#20231f] text-[26px]" style={{ fontVariationSettings: '"opsz" 14' }}>Explore the menu</p>
                    </div>
                    <p className="font-['Inter:Regular'] font-normal text-[#8a8d86] text-[13px]">{MENU.length} options</p>
                  </div>
                  <div className="bg-white border border-[#ded9d0] border-solid flex gap-2 h-[44px] items-center px-[13px] rounded-[12px] w-full">
                    <div className="relative size-[17px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgSearch} /></div>
                    <input
                      className="flex-1 bg-transparent font-['Inter:Regular'] font-normal text-[#20231f] text-[13px] outline-none placeholder:text-[#8a8d86]"
                      placeholder="Search dishes, ingredients..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                    {search && <button onClick={() => setSearch("")} className="text-[#8a8d86] text-[12px] hover:text-[#20231f]">✕</button>}
                  </div>
                  <div className="flex gap-2 items-start overflow-x-auto w-full pb-1">
                    {CATEGORIES.map(cat => (
                      <button key={cat} onClick={() => { setCategory(cat); setSearch(""); }} className={`flex flex-col items-start px-[13px] py-[8px] rounded-full shrink-0 border border-solid transition-colors ${category === cat && search === "" ? "bg-[#252824] border-[#252824]" : "bg-white border-[#ded9d0] hover:border-[#aaa]"}`}>
                        <p className={`font-['Inter:Bold'] font-bold text-[12px] whitespace-nowrap ${category === cat && search === "" ? "text-white" : "text-[#575b54]"}`}>{cat}</p>
                      </button>
                    ))}
                  </div>
                  {displayItems.length === 0 ? (
                    <p className="font-['Inter:Regular'] font-normal text-[#8a8d86] text-[14px] py-4 w-full text-center">No dishes found.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
                      {displayItems.map(item => (
                        <div key={item.id} className="group bg-[#fbf8f3] border border-[#ded9d0] border-solid flex flex-col gap-[14px] items-start p-[14px] rounded-[16px] cursor-pointer hover:border-[#b44b2a] transition-colors" onClick={() => { setSelectedItem(item); setSpiceLevel("medium"); setDetailQty(1); setDetailNote(""); }}>
                          <div className="h-[180px] relative rounded-[12px] w-full overflow-hidden">
                            <img alt={item.name} className="absolute inset-0 max-w-none object-cover pointer-events-none size-full transition-transform duration-500 group-hover:scale-105" src={item.img} />
                          </div>
                          <div className="flex flex-col gap-[6px] items-start w-full">
                            <div className="flex items-center justify-between w-full">
                              <p className="flex-1 font-['DM_Sans:Regular'] font-normal text-[#20231f] text-[16px]" style={{ fontVariationSettings: '"opsz" 14' }}>{item.name}</p>
                              {item.badge && <p className="font-['Inter:Extra_Bold'] font-extrabold text-[#32705a] text-[10px] whitespace-nowrap ml-2">{item.badge}</p>}
                            </div>
                            <p className="font-['Inter:Regular'] font-normal leading-[1.4] text-[#575b54] text-[12px] w-full">{item.desc}</p>
                            <div className="flex items-end justify-between w-full">
                              <p className="font-['Inter:Regular'] font-normal text-[#20231f] text-[14px]">${item.price}</p>
                              <button onClick={e => { e.stopPropagation(); addToCart(item, 1, item.id === "biryani" ? "medium" : undefined); }} className="bg-[#b44b2a] flex flex-col items-center justify-center rounded-full size-[30px] hover:opacity-90 transition-opacity">
                                <div className="relative size-[16px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgPlus1} /></div>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Item detail section */}
                {selectedItem && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,22,19,0.66)] p-4 backdrop-blur-sm" onClick={() => setSelectedItem(null)}>
                  <div className="bg-white border border-[#ded9d0] border-solid flex max-h-[92vh] max-w-[860px] flex-col gap-[18px] items-start overflow-y-auto p-6 rounded-[24px] w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between gap-4 w-full">
                      <div>
                        <p className="font-['Inter:Bold'] font-bold text-[#b44b2a] text-[11px] uppercase">Customize your dish</p>
                        <p className="font-['DM_Sans:Regular'] font-normal text-[#20231f] text-[22px]" style={{ fontVariationSettings: '"opsz" 14' }}>{selectedItem.name}</p>
                      </div>
                      <button onClick={() => setSelectedItem(null)} className="flex size-[38px] items-center justify-center rounded-full border border-[#ded9d0] text-[#575b54] hover:bg-[#fbf8f3]" aria-label="Close item details">✕</button>
                    </div>
                    <div className="flex flex-col md:flex-row gap-6 items-start w-full">
                      <div className="bg-[#fbf8f3] border border-[#ded9d0] border-solid flex flex-col gap-4 items-start p-5 rounded-[18px] w-full md:w-[360px] shrink-0">
                        <div className="h-[220px] relative rounded-[12px] w-full overflow-hidden">
                          <img alt={selectedItem.name} className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={selectedItem.img} />
                        </div>
                        <div className="flex flex-col gap-[6px] items-start w-full">
                          <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[25px] w-full" style={{ fontVariationSettings: '"opsz" 14' }}>{selectedItem.name}</p>
                          <p className="font-['Inter:Regular'] font-normal leading-[1.45] text-[#575b54] text-[13px] w-full">{selectedItem.desc}</p>
                        </div>
                        <div className="flex gap-[7px] items-start flex-wrap">
                          {selectedItem.badge === "V" && (
                            <div className="bg-[#e2f0ea] flex gap-[6px] items-center px-[10px] py-[6px] rounded-full">
                              <div className="relative size-[6px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse2} /></div>
                              <p className="font-['Inter:Bold'] font-bold text-[#32705a] text-[12px] whitespace-nowrap">Vegetarian</p>
                            </div>
                          )}
                          {selectedItem.badge === "GF" && (
                            <div className="bg-[#e2f0ea] flex gap-[6px] items-center px-[10px] py-[6px] rounded-full">
                              <div className="relative size-[6px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse2} /></div>
                              <p className="font-['Inter:Bold'] font-bold text-[#32705a] text-[12px] whitespace-nowrap">Gluten-free</p>
                            </div>
                          )}
                          <div className="bg-[#f0ece5] flex gap-[6px] items-center px-[10px] py-[6px] rounded-full">
                            <div className="relative size-[6px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse3} /></div>
                            <p className="font-['Inter:Bold'] font-bold text-[#575b54] text-[12px] whitespace-nowrap">Ask us about allergens</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col gap-4 items-start min-w-0 w-full">
                        {selectedItem.id === "biryani" && (
                          <>
                            <div className="flex items-center justify-between w-full">
                              <p className="font-['Inter:Extra_Bold'] font-extrabold text-[#20231f] text-[14px]">Choose your spice level</p>
                              <p className="font-['Inter:Bold'] font-bold text-[#b44b2a] text-[11px]">REQUIRED</p>
                            </div>
                            {([["mild", "Mild"], ["medium", "Medium"], ["hot", "Hot"]] as [SpiceLevel, string][]).map(([val, label]) => (
                              <button key={val} onClick={() => setSpiceLevel(val)} className="flex gap-[10px] h-[42px] items-center w-full text-left">
                                <div className="relative size-[18px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={spiceLevel === val ? imgEllipse4 : imgEllipse5} /></div>
                                <p className="flex-1 font-['Inter:Regular'] font-normal text-[#20231f] text-[13px] min-w-0">{label}</p>
                              </button>
                            ))}
                          </>
                        )}
                        <div className="flex flex-col gap-[7px] items-start w-full">
                          <p className="font-['Inter:Regular'] font-normal text-[#20231f] text-[13px]">Special instructions</p>
                          <textarea
                            className="bg-[#fbf8f3] border border-[#ded9d0] border-solid font-['Inter:Regular'] font-normal p-3 rounded-[8px] text-[#20231f] text-[12px] w-full resize-none outline-none focus:border-[#b44b2a] transition-colors"
                            placeholder="E.g. allergy or preparation request"
                            rows={2}
                            value={detailNote}
                            onChange={e => setDetailNote(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-[10px] items-start w-full">
                          <div className="bg-[#fbf8f3] border border-[#ded9d0] border-solid flex h-[46px] items-center justify-between px-[10px] rounded-[12px] w-[112px]">
                            <button onClick={() => setDetailQty(q => Math.max(1, q - 1))} className="hover:opacity-70 transition-opacity">
                              <div className="relative size-[16px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgMinus} /></div>
                            </button>
                            <p className="font-['Inter:Extra_Bold'] font-extrabold text-[#20231f] text-[14px]">{detailQty}</p>
                            <button onClick={() => setDetailQty(q => q + 1)} className="hover:opacity-70 transition-opacity">
                              <div className="relative size-[16px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgPlus2} /></div>
                            </button>
                          </div>
                          <button
                            onClick={() => {
                              addToCart(selectedItem, detailQty, selectedItem.id === "biryani" ? spiceLevel : undefined, detailNote.trim());
                              setSelectedItem(null);
                              setTab("order");
                            }}
                            className="bg-[#b44b2a] border border-[#b44b2a] border-solid flex flex-1 h-[46px] items-center justify-center min-w-0 px-4 rounded-[12px] hover:opacity-90 transition-opacity"
                          >
                            <p className="font-['Inter:Regular'] font-normal text-[14px] text-white whitespace-nowrap">
                              Add · {fmt(selectedItem.price * detailQty)}
                            </p>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>
                )}
              </>
            )}

            {/* ── ORDER TAB ── */}
            {tab === "order" && (
              <>
                {orderStatus === "cart" && (
                  <div className="bg-white border border-[#ded9d0] border-solid flex flex-col gap-[18px] items-start p-6 rounded-[24px] w-full">
                    <div className="flex items-center justify-between w-full">
                      <p className="font-['DM_Sans:Regular'] font-normal text-[#20231f] text-[22px]" style={{ fontVariationSettings: '"opsz" 14' }}>Review your order</p>
                      {cart.length > 0 && <button onClick={() => setCart([])} className="font-['Inter:Bold'] font-bold text-[#b44b2a] text-[13px] hover:opacity-70 transition-opacity">Clear</button>}
                    </div>
                    {cart.length === 0 ? (
                      <div className="flex flex-col items-center gap-3 py-10 w-full">
                        <p className="font-['DM_Sans:Regular'] font-normal text-[#20231f] text-[18px]" style={{ fontVariationSettings: '"opsz" 14' }}>Your cart is empty</p>
                        <p className="font-['Inter:Regular'] font-normal text-[#8a8d86] text-[13px]">Browse the menu to add items</p>
                        <button onClick={() => setTab("menu")} className="mt-2 bg-[#b44b2a] flex gap-2 h-[46px] items-center justify-center px-6 rounded-[12px] hover:opacity-90 transition-opacity">
                          <div className="relative size-[17px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgArrowRight} /></div>
                          <p className="font-['Inter:Regular'] font-normal text-[14px] text-white whitespace-nowrap">Browse menu</p>
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="bg-white border border-[#ded9d0] border-solid flex flex-col gap-[11px] items-start p-4 rounded-[12px] w-full">
                          <div className="flex items-start justify-between w-full">
                            <p className="font-['Inter:Extra_Bold'] font-extrabold text-[#20231f] text-[14px]">{totalItems} item{totalItems !== 1 ? "s" : ""}</p>
                            <div className="flex gap-[6px] items-center">
                              <div className="relative size-[8px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse1} /></div>
                              <p className="font-['Inter:Regular'] font-normal text-[#32705a] text-[12px] whitespace-nowrap">Kitchen online</p>
                            </div>
                          </div>
                          {cart.map((c, i) => (
                            <div key={`${c.item.id}-${c.spiceLevel}`} className={`flex gap-3 items-center p-[14px] w-full ${i > 0 ? "border-[#ded9d0] border-solid border-t" : ""}`}>
                              <div className="flex flex-col gap-1 items-center w-[34px]">
                                <button onClick={() => updateQty(c.item.id, c.spiceLevel, 1)} className="hover:opacity-70 transition-opacity">
                                  <div className="relative size-[15px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgChevronUp} /></div>
                                </button>
                                <p className="font-['Inter:Extra_Bold'] font-extrabold text-[#20231f] text-[13px]">{c.qty}</p>
                                <button onClick={() => c.qty === 1 ? removeItem(c.item.id, c.spiceLevel) : updateQty(c.item.id, c.spiceLevel, -1)} className="hover:opacity-70 transition-opacity">
                                  <div className="relative size-[15px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgChevronDown} /></div>
                                </button>
                              </div>
                              <div className="flex flex-1 flex-col gap-1 items-start min-w-0">
                                <p className="font-['Inter:Regular'] font-normal text-[#20231f] text-[14px] w-full">{c.item.name}</p>
                                {c.spiceLevel && <p className="font-['Inter:Regular'] font-normal text-[#575b54] text-[11px] w-full capitalize">{c.spiceLevel} spice</p>}
                                {c.note && <p className="font-['Inter:Regular'] font-normal text-[#8a8d86] text-[11px] w-full">Note: {c.note}</p>}
                              </div>
                              <p className="font-['Inter:Bold'] font-bold text-[#20231f] text-[13px] whitespace-nowrap">{fmt(c.item.price * c.qty)}</p>
                            </div>
                          ))}
                        </div>
                        {showNoteInput ? (
                          <div className="bg-white border border-[#ded9d0] border-solid flex flex-col gap-2 p-3 rounded-[8px] w-full">
                            <textarea
                              className="font-['Inter:Regular'] font-normal text-[#20231f] text-[12px] w-full resize-none outline-none"
                              placeholder="Note for the whole order..."
                              rows={2}
                              value={orderNote}
                              onChange={e => setOrderNote(e.target.value)}
                              autoFocus
                            />
                            <button onClick={() => setShowNoteInput(false)} className="font-['Inter:Bold'] font-bold text-[#b44b2a] text-[12px] self-end">Done</button>
                          </div>
                        ) : (
                          <button onClick={() => setShowNoteInput(true)} className="bg-white border border-[#ded9d0] border-solid flex gap-[9px] items-center min-h-[48px] p-3 rounded-[8px] w-full hover:bg-[#fbf8f3] transition-colors">
                            <div className="relative size-[17px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgMessageSquare} /></div>
                            <p className="flex-1 font-['Inter:Regular'] font-normal text-[#575b54] text-[12px] min-w-0 text-left">{orderNote || "Add a note for the whole order"}</p>
                            <div className="relative size-[16px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgChevronRight} /></div>
                          </button>
                        )}
                        <div className="flex flex-col gap-[9px] items-start w-full">
                          {[["Subtotal", fmt(totals.subtotal)], ["Tax · 8.5%", fmt(totals.tax)], ["Service charge · 5%", fmt(totals.service)]].map(([label, value]) => (
                            <div key={label} className="flex font-['Inter:Regular'] font-normal items-start justify-between text-[13px] w-full">
                              <p className="text-[#575b54]">{label}</p>
                              <p className="text-[#20231f]">{value}</p>
                            </div>
                          ))}
                          <div className="h-px bg-[#ded9d0] w-full" />
                          <div className="flex items-start justify-between font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[18px] w-full">
                            <p style={{ fontVariationSettings: '"opsz" 14' }}>Total</p>
                            <p style={{ fontVariationSettings: '"opsz" 14' }}>{fmt(totals.total)}</p>
                          </div>
                        </div>
                        <p className="font-['Inter:Regular'] font-normal leading-[1.4] text-[#8a8d86] text-[10px] text-center w-full">By placing this order, it will be sent directly to the kitchen.</p>
                        <button onClick={placeOrder} className="bg-[#b44b2a] border border-[#b44b2a] border-solid flex gap-2 h-[46px] items-center justify-center px-4 rounded-[12px] w-full hover:opacity-90 transition-opacity">
                          <div className="relative size-[17px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgSend} /></div>
                          <p className="font-['Inter:Regular'] font-normal text-[14px] text-white whitespace-nowrap">Place order · {fmt(totals.total)}</p>
                        </button>
                      </>
                    )}
                  </div>
                )}

                {(orderStatus === "placed" || orderStatus === "preparing" || orderStatus === "served") && (
                  <>
                    {/* Tracking section */}
                    <div className="bg-white border border-[#ded9d0] border-solid flex flex-col gap-[18px] items-start p-6 rounded-[24px] w-full">
                      <div className="flex items-center justify-between w-full">
                        <p className="font-['DM_Sans:Regular'] font-normal text-[#20231f] text-[22px]" style={{ fontVariationSettings: '"opsz" 14' }}>Order {orderNumber}</p>
                        <div className="flex gap-[6px] items-center">
                          <div className="relative size-[8px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse1} /></div>
                          <p className="font-['Inter:Regular'] font-normal text-[#32705a] text-[12px] whitespace-nowrap">Live · updated 7:18 PM</p>
                        </div>
                      </div>
                      <div className="bg-[#252824] flex flex-col gap-[10px] items-start p-[18px] rounded-[18px] w-full">
                        <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[26px] text-white w-full" style={{ fontVariationSettings: '"opsz" 14' }}>
                          {orderStatus === "placed" ? "Order received!" : "The kitchen is preparing your order"}
                        </p>
                        <p className="font-['Inter:Regular'] font-normal text-[13px] text-[rgba(255,255,255,0.72)] w-full">
                          {orderStatus === "placed" ? "Sending to kitchen..." : "Estimated ready in 12-16 minutes"}
                        </p>
                      </div>
                      <div className="flex flex-col items-start w-full">
                        {[
                          { dot: imgEllipse6, label: "Confirmed", time: "7:14 PM", active: true, lineColor: "#32705a" },
                          { dot: imgEllipse6, label: "Preparing", time: "7:18 PM", active: orderStatus === "preparing" || orderStatus === "served", lineColor: "#ded9d0" },
                          { dot: imgEllipse7, label: "Ready", time: "About 7:34 PM", active: false, lineColor: "#ded9d0" },
                          { dot: imgEllipse7, label: "Served", time: "-", active: false, lineColor: null },
                        ].map((step) => (
                          <div key={step.label} className="flex gap-3 h-16 items-start w-full">
                            <div className="flex flex-col h-full items-center w-[22px]">
                              <div className="relative size-[18px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={step.dot} /></div>
                              {step.lineColor && <div className="flex-1 min-h-px w-[2px]" style={{ backgroundColor: step.lineColor }} />}
                            </div>
                            <div className="flex flex-1 items-start justify-between min-w-0">
                              <p className={`${step.active ? "font-['Inter:Regular'] font-normal text-[#20231f]" : "font-['Inter:Semi_Bold'] font-semibold text-[#8a8d86]"} text-[14px]`}>{step.label}</p>
                              <p className={`${step.active ? "font-['Inter:Regular'] font-normal text-[#575b54]" : "font-['Inter:Regular'] font-normal text-[#8a8d86]"} text-[12px] whitespace-nowrap`}>{step.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="bg-white border border-[#ded9d0] border-solid flex flex-col gap-[11px] items-start p-4 rounded-[12px] w-full">
                        <div className="flex items-start justify-between w-full">
                          <p className="font-['Inter:Extra_Bold'] font-extrabold text-[#20231f] text-[14px]">Your order</p>
                          <p className="font-['Inter:Regular'] font-normal text-[#575b54] text-[11px]">{totalItems} items</p>
                        </div>
                        {cart.map(c => (
                          <div key={`${c.item.id}-${c.spiceLevel}`} className="flex gap-2 items-start text-[12px] w-full">
                            <p className="font-['Inter:Extra_Bold'] font-extrabold text-[#b44b2a] w-[18px]">{c.qty}×</p>
                            <p className="flex-1 font-['Inter:Regular'] font-normal text-[#20231f] min-w-0">{c.item.name}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-[10px] items-start w-full">
                        <button onClick={() => setTab("menu")} className="bg-[#b44b2a] border border-[#b44b2a] border-solid flex flex-1 gap-2 h-[46px] items-center justify-center min-w-0 px-4 rounded-[12px] hover:opacity-90 transition-opacity">
                          <div className="relative size-[17px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgPlus} /></div>
                          <p className="font-['Inter:Regular'] font-normal text-[14px] text-white whitespace-nowrap">Add more items</p>
                        </button>
                        <button onClick={() => setHelpVisible(true)} className="bg-[#fbf8f3] border border-[#ded9d0] border-solid flex flex-1 gap-2 h-[46px] items-center justify-center min-w-0 px-4 rounded-[12px] hover:bg-white transition-colors">
                          <div className="relative size-[17px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgBell1} /></div>
                          <p className="font-['Inter:Regular'] font-normal text-[#20231f] text-[14px] whitespace-nowrap">Need help</p>
                        </button>
                      </div>
                    </div>

                    {/* Active table */}
                    <div className="bg-white border border-[#ded9d0] border-solid flex flex-col gap-[18px] items-start p-6 rounded-[24px] w-full">
                      <div className="flex items-center justify-between w-full">
                        <p className="font-['DM_Sans:Regular'] font-normal text-[#20231f] text-[22px]" style={{ fontVariationSettings: '"opsz" 14' }}>Your table</p>
                        <div className="flex gap-[6px] items-center">
                          <div className="relative size-[8px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse1} /></div>
                          <p className="font-['Inter:Regular'] font-normal text-[#32705a] text-[12px] whitespace-nowrap">Live</p>
                        </div>
                      </div>
                      <div className="bg-white border border-[#ded9d0] border-solid flex flex-col gap-3 items-start p-[18px] rounded-[18px] w-full">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex flex-col gap-1 items-start">
                            <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[21px]" style={{ fontVariationSettings: '"opsz" 14' }}>Dinner in progress</p>
                            <p className="font-['Inter:Regular'] font-normal text-[#575b54] text-[12px]">Opened {sessionStart} · 2 guests</p>
                          </div>
                          <div className="bg-[#e2f0ea] flex gap-[6px] items-center px-[10px] py-[6px] rounded-full">
                            <div className="relative size-[6px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse2} /></div>
                            <p className="font-['Inter:Bold'] font-bold text-[#32705a] text-[12px] whitespace-nowrap">Active</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-6">
                          {[["Ordered", `${totalItems} items`], ["Current total", fmt(totals.total)], ["Elapsed", elapsed]].map(([label, value]) => (
                            <div key={label} className="flex flex-col gap-1 items-center">
                              <p className="font-['Inter:Regular'] font-normal text-[#8a8d86] text-[10px]">{label}</p>
                              <p className="font-['Inter:Extra_Bold'] font-extrabold text-[#20231f] text-[13px]">{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[19px]" style={{ fontVariationSettings: '"opsz" 14' }}>Order activity</p>
                      <div className="bg-[#f9eacf] flex flex-col gap-[10px] items-start p-[15px] rounded-[12px] w-full">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex gap-[6px] items-center px-[10px] py-[6px]">
                            <div className="relative size-[6px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse8} /></div>
                            <p className="font-['Inter:Bold'] font-bold text-[#b06a16] text-[12px] whitespace-nowrap">Preparing · 8 min</p>
                          </div>
                          <div className="flex gap-[6px] items-center">
                            <div className="relative size-[8px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse1} /></div>
                            <p className="font-['Inter:Regular'] font-normal text-[#32705a] text-[12px] whitespace-nowrap">Live</p>
                          </div>
                        </div>
                        <div className="font-['Inter:Regular'] font-normal text-[#20231f] text-[13px] w-full">
                          {cart.map(c => <p key={`${c.item.id}-${c.spiceLevel}`} className="leading-[1.55]">{c.qty}× {c.item.name}</p>)}
                        </div>
                      </div>
                      <div className="bg-[#252824] flex flex-col gap-[10px] items-start p-[18px] rounded-[18px] w-full">
                        <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[20px] text-white" style={{ fontVariationSettings: '"opsz" 14' }}>Still hungry?</p>
                        <p className="font-['Inter:Regular'] font-normal leading-[1.45] text-[12px] text-[rgba(255,255,255,0.72)] w-full">Add another round to this table. New items go straight to the kitchen.</p>
                        <button onClick={() => setTab("menu")} className="bg-[#b44b2a] border border-[#b44b2a] border-solid flex gap-2 h-[46px] items-center justify-center px-4 rounded-[12px] w-full hover:opacity-90 transition-opacity">
                          <div className="relative size-[17px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgPlus} /></div>
                          <p className="font-['Inter:Regular'] font-normal text-[14px] text-white whitespace-nowrap">Browse menu</p>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* ── BILL TAB ── */}
            {tab === "bill" && (
              <div className="bg-white border border-[#ded9d0] border-solid flex flex-col gap-[18px] items-start p-6 rounded-[24px] w-full">
                <div className="flex items-center justify-between w-full">
                  <p className="font-['DM_Sans:Regular'] font-normal text-[#20231f] text-[22px]" style={{ fontVariationSettings: '"opsz" 14' }}>Your bill</p>
                  {billStatus === "none" && <p className="font-['Inter:Bold'] font-bold text-[#575b54] text-[11px]">UNPAID</p>}
                  {billStatus === "requested" && <p className="font-['Inter:Bold'] font-bold text-[#b06a16] text-[11px]">BILL REQUESTED</p>}
                  {billStatus === "settled" && <p className="font-['Inter:Bold'] font-bold text-[#8ed3b7] text-[11px]">SETTLED</p>}
                </div>

                {billStatus === "requested" && (
                  <div className="bg-[#f9eacf] flex flex-col gap-2 items-center p-[18px] rounded-[18px] w-full">
                    <div className="bg-[#b06a16] flex flex-col items-center justify-center rounded-full size-[44px]">
                      <div className="relative size-[22px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgClock} /></div>
                    </div>
                    <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[21px] whitespace-nowrap" style={{ fontVariationSettings: '"opsz" 14' }}>Your bill is requested</p>
                    <p className="font-['Inter:Regular'] font-normal leading-[1.45] text-[#575b54] text-[12px] text-center w-full">A team member was notified at 7:42 PM and will be with you shortly.</p>
                  </div>
                )}

                {billStatus === "settled" && (
                  <div className="bg-[#e2f0ea] flex flex-col gap-2 items-center p-[18px] rounded-[18px] w-full">
                    <div className="bg-[#32705a] flex flex-col items-center justify-center rounded-full size-[44px]">
                      <div className="relative size-[22px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgCheck} /></div>
                    </div>
                    <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[21px] whitespace-nowrap" style={{ fontVariationSettings: '"opsz" 14' }}>Paid - thank you</p>
                    <p className="font-['Inter:Regular'] font-normal leading-[1.45] text-[#575b54] text-[12px] text-center w-full">Visa •••• 1842 · Settled at 7:46 PM</p>
                  </div>
                )}

                <div className="bg-white border border-[#ded9d0] border-solid flex flex-col gap-[11px] items-start p-4 rounded-[12px] w-full">
                  <div className="flex items-start justify-between w-full">
                    <p className="font-['Inter:Extra_Bold'] font-extrabold text-[#20231f] text-[14px]">Table {tableNumber} · {orderNumber}</p>
                    <p className="font-['Inter:Regular'] font-normal text-[#575b54] text-[11px]">2 guests</p>
                  </div>
                  {cart.length === 0 ? (
                    <p className="font-['Inter:Regular'] font-normal text-[#8a8d86] text-[13px]">No items ordered yet.</p>
                  ) : (
                    cart.map(c => (
                      <div key={`${c.item.id}-${c.spiceLevel}`} className="flex font-['Inter:Regular'] font-normal gap-2 items-start text-[12px] w-full">
                        <p className="text-[#575b54] w-[20px]">{c.qty}×</p>
                        <p className="flex-1 text-[#20231f] min-w-0">{c.item.name}</p>
                        <p className="text-[#20231f] whitespace-nowrap">{fmt(c.item.price * c.qty)}</p>
                      </div>
                    ))
                  )}
                  <div className="h-px bg-[#ded9d0] w-full" />
                  {[["Subtotal", fmt(totals.subtotal)], ["Tax · 8.5%", fmt(totals.tax)], ["Service charge · 5%", fmt(totals.service)]].map(([label, value]) => (
                    <div key={label} className="flex font-['Inter:Regular'] font-normal items-start justify-between text-[12px] w-full">
                      <p className="text-[#575b54]">{label}</p>
                      <p className="text-[#20231f]">{value}</p>
                    </div>
                  ))}
                  <div className="flex font-['DM_Sans:ExtraBold'] font-extrabold items-start justify-between text-[#20231f] text-[19px] w-full">
                    <p style={{ fontVariationSettings: '"opsz" 14' }}>Total</p>
                    <p style={{ fontVariationSettings: '"opsz" 14' }}>{fmt(totals.total)}</p>
                  </div>
                </div>

                {billStatus === "none" && (
                  <>
                    <button onClick={requestBill} className="bg-[#b44b2a] border border-[#b44b2a] border-solid flex gap-2 h-[46px] items-center justify-center px-4 rounded-[12px] w-full hover:opacity-90 transition-opacity">
                      <div className="relative size-[17px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgReceiptText1} /></div>
                      <p className="font-['Inter:Regular'] font-normal text-[14px] text-white whitespace-nowrap">Request bill</p>
                    </button>
                    <p className="font-['Inter:Regular'] font-normal leading-[1.4] text-[#8a8d86] text-[11px] text-center w-full">Payment is completed with your server. Split payment available on request.</p>
                  </>
                )}

                {billStatus === "requested" && (
                  <button onClick={settleBill} className="bg-[#fbf8f3] border border-[#ded9d0] border-solid flex gap-2 h-[46px] items-center justify-center px-4 rounded-[12px] w-full hover:bg-white transition-colors">
                    <p className="font-['Inter:Regular'] font-normal text-[#20231f] text-[14px] whitespace-nowrap">Mark as paid (demo)</p>
                  </button>
                )}

                {billStatus === "settled" && (
                  <button className="bg-[#fbf8f3] border border-[#ded9d0] border-solid flex gap-2 h-[46px] items-center justify-center px-4 rounded-[12px] w-full hover:bg-white transition-colors">
                    <div className="relative size-[17px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgMail} /></div>
                    <p className="font-['Inter:Regular'] font-normal text-[#20231f] text-[14px] whitespace-nowrap">Email receipt</p>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
