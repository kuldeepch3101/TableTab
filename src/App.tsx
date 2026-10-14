import { useState, useMemo, useEffect } from "react";
import { createDiningSession, createOrder, createServiceRequest, getMenu, getSessionOrders } from "./lib/tabletabApi";

const assetPathPrefix = "/assets";

// The original Figma asset paths are kept for the rest of the UI, but the
// menu food photos are hosted remotely because the original image files are
// not present in this project. These URLs are temporary menu-photo fallbacks.
const imgHero = "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=85";
const imgButterChicken = "https://im.whatshot.in/img/2020/Jul/1-1595376176.png?cc=1&h=630&w=1200&wm=1";
const imgPaneerTikka = "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy%2Cf_auto%2Cq_auto%2Cw_300%2Ch_300%2Ce_grayscale%2Cc_fit/FOOD_CATALOG/IMAGES/CMS/2024/4/27/5d3b4547-f365-4dea-a29e-05a0c5f732f6_f39bf5ef-9b1b-4fd3-b7bd-afc25ae71605.jpg";
const imgChickenBiryani = "https://explorerest.sgp1.digitaloceanspaces.com/restaurant/14981/gallery/kitch-kashmiri-chai-gallery-7jpeg-3.jpeg";
const imgRoganJosh = "https://i0.wp.com/khyenchyen.net/wp-content/uploads/2022/06/Mutton-Rogan-Josh-by-PictureTheRecipe-1.jpg?resize=750%2C712&ssl=1";
const imgMasalaDosa = "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy%2Cf_auto%2Cq_auto%2Cw_366/RX_THUMBNAIL/IMAGES/VENDOR/2026/4/12/44def03d-76b6-4da2-95fc-b21781615b8d_1345067%20%281%29%20%281%29.jpg";
const imgSamosa = "https://img.onmanorama.com/content/dam/mm/en/food/features/images/2021/9/12/samosa.jpg/photos/4x3/photo.jpg";
const imgGarlicNaan = "https://154630363.cdn6.editmysite.com/uploads/1/5/4/6/154630363/LX2DJA7DAEGJRLN5YQOMJ7OP.png?optimize=medium&width=2400";
const imgMangoLassi = "https://static.wixstatic.com/media/1a22d3_2ad83af717dc43a28b10e23538a6e88c~mv2.png/v1/fill/w_969%2Ch_918%2Cal_c%2Cq_90/1a22d3_2ad83af717dc43a28b10e23538a6e88c~mv2.png";
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
type OrderStatus = "cart" | "placed" | "preparing" | "ready" | "served";
type BillStatus = "none" | "requested";
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

const DEFAULT_CATEGORIES = ["All"];

const TAX = 0.085;
const SERVICE = 0.05;

function getMenuImage(menuItem: any): string {
  const id = String(menuItem?.id ?? "").toLowerCase();
  const name = String(menuItem?.name ?? "").toLowerCase();
  const backendImage = String(menuItem?.img ?? "").trim();

  // Prefer a real URL from the database when one is configured. The seeded
  // project currently contains /assets/... paths, but those files are absent,
  // so map the seeded item to the matching remote photo instead.
  if (backendImage && /^https?:\/\//i.test(backendImage)) return backendImage;

  if (id.includes("butter-chicken") || name.includes("butter chicken")) return imgButterChicken;
  if (id.includes("paneer-tikka") || name.includes("paneer tikka")) return imgPaneerTikka;
  if (id.includes("biryani") || name.includes("biryani")) return imgChickenBiryani;
  if (id.includes("rogan-josh") || name.includes("rogan josh")) return imgRoganJosh;
  if (id === "dosa" || name.includes("masala dosa")) return imgMasalaDosa;
  if (id === "samosa" || name.includes("samosa")) return imgSamosa;
  if (id === "naan" || name.includes("naan")) return imgGarlicNaan;
  if (id === "lassi" || name.includes("lassi")) return imgMangoLassi;

  return imgHero;
}

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
  // Keep the UI menu empty until the restaurant menu is loaded from the backend.
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);

  // cart = items that have not been submitted yet.
  // orderedItems = items already submitted during this dining session.
  const [orderedItems, setOrderedItems] = useState<CartItem[]>([]);

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [backendOrderId, setBackendOrderId] = useState<string | null>(null);
  const [orderSubmitting, setOrderSubmitting] = useState(false);

  useEffect(() => {
    if (!hotel?.id) return;

    let cancelled = false;

    async function loadMenu() {
      setMenuLoading(true);
      setMenuError(null);

      try {
        const rows = await getMenu(hotel.id);

        if (cancelled) return;

        if (!Array.isArray(rows) || rows.length === 0) {
          throw new Error("No menu items were returned for this restaurant.");
        }

        const mappedMenu: MenuItem[] = rows
          .filter((m: any) => m?.id)
          .map((m: any) => ({
            // IMPORTANT: preserve the real backend menu-item ID.
            // createOrder() sends this value as order_items.menu_item_id.
            id: String(m.id),
            name: String(m.name ?? "Unnamed dish"),
            desc: String(m.desc ?? m.description ?? ""),
            price: Number(m.price ?? 0),
            badge: String(m.badge ?? ""),
            img: getMenuImage(m),
            category: String(m.category ?? "Mains"),
          }));

        if (mappedMenu.length === 0) {
          throw new Error("The restaurant menu contains no valid menu-item IDs.");
        }

        setMenu(mappedMenu);
        console.log("[TableTab] MENU LOADED FROM SUPABASE:", mappedMenu);
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Unable to load the restaurant menu.";
        setMenu([]);
        setMenuError(message);
        console.error("[TableTab] FAILED TO LOAD SUPABASE MENU:", error);
      } finally {
        if (!cancelled) setMenuLoading(false);
      }
    }

    loadMenu();

    return () => {
      cancelled = true;
    };
  }, [hotel?.id]);

  useEffect(() => {
    if (!hotel?.id) return;

    let cancelled = false;

    async function startDiningSession() {
      setSessionLoading(true);
      setSessionError(null);

      const token = new URLSearchParams(window.location.search).get("token")?.trim();
      console.log("[TableTab] QR TOKEN:", token || "<missing>");

      if (!token) {
        const message = "This customer session has no QR token. Scan the table QR code generated by Admin.";
        setSessionError(message);
        setSessionLoading(false);
        console.error("[TableTab] " + message);
        return;
      }

      try {
        const session = await createDiningSession(token, 1);

        if (cancelled) return;

        if (!session?.public_token) {
          throw new Error("The backend did not return a public dining session token.");
        }

        console.log("[TableTab] DINING SESSION CREATED:", session);
        setSessionToken(session.public_token);
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Unable to start the dining session.";
        setSessionError(message);
        console.error("[TableTab] DINING SESSION FAILED:", error);
      } finally {
        if (!cancelled) setSessionLoading(false);
      }
    }

    startDiningSession();

    return () => {
      cancelled = true;
    };
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
        const next: OrderStatus =
          latest.status === "new"
            ? "placed"
            : latest.status === "preparing"
            ? "preparing"
            : latest.status === "ready"
            ? "ready"
            : latest.status === "served"
            ? "served"
            : "cart";
        setOrderStatus(next);
      } catch (error) {
        if (!stopped) console.warn("Unable to sync order status", error);
      }
    };
    sync();
    const timer = window.setInterval(sync, 2500);
    return () => { stopped = true; window.clearInterval(timer); };
  }, [sessionToken]);

  const sessionStart = "—";
  const elapsed = "—";
  const venueName = hotel?.name ?? "Restaurant";
  const venueCuisine = hotel?.cuisine ?? "Restaurant dining";
  const tableNumber = table ? table.padStart(2, "0") : "—";
  const orderNumber = backendOrderId ? `#${backendOrderId.slice(0, 8)}` : "Not placed";
  const categories = useMemo(() => ["All", ...Array.from(new Set(menu.map(item => item.category).filter(Boolean)))], [menu]);

  const filtered = useMemo(() => {
    return menu.filter(m => {
      const matchCat = category === "All" || m.category === category;
      const matchSearch = search === "" || m.name.toLowerCase().includes(search.toLowerCase()) || m.desc.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [menu, category, search]);

  const allFiltered = useMemo(() => {
    if (search === "") return filtered;
    return menu.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.desc.toLowerCase().includes(search.toLowerCase()));
  }, [menu, search, filtered]);

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

  const sessionItems = [...orderedItems, ...cart];
  const totals = calcTotals(sessionItems);
  const cartTotals = calcTotals(cart);
  const totalItems = sessionItems.reduce((s, c) => s + c.qty, 0);
  const pendingItems = cart.reduce((s, c) => s + c.qty, 0);

  function mergeItems(existing: CartItem[], incoming: CartItem[]) {
    const merged = [...existing];

    for (const incomingItem of incoming) {
      const existingIndex = merged.findIndex(
        item =>
          item.item.id === incomingItem.item.id &&
          item.spiceLevel === incomingItem.spiceLevel &&
          item.note === incomingItem.note
      );

      if (existingIndex >= 0) {
        merged[existingIndex] = {
          ...merged[existingIndex],
          qty: merged[existingIndex].qty + incomingItem.qty,
        };
      } else {
        merged.push(incomingItem);
      }
    }

    return merged;
  }

  async function placeOrder() {
    if (cart.length === 0 || orderSubmitting) return;

    if (!sessionToken) {
      const message = sessionError || "Your table session is not active. Please scan the table QR code again.";
      console.error("[TableTab] Cannot place order:", message);
      alert(message);
      return;
    }

    if (menuError || menu.length === 0) {
      const message = menuError || "The restaurant menu is not available yet.";
      alert(message);
      return;
    }

    setOrderSubmitting(true);

    try {
      console.log("[TableTab] PLACING ORDER WITH SESSION:", sessionToken);
      console.log("[TableTab] ORDER ITEMS:", cart.map(c => ({
        menuItemId: c.item.id,
        quantity: c.qty,
        spiceLevel: c.spiceLevel,
        note: c.note,
      })));

      const order = await createOrder({
        sessionToken,
        guests: 1,
        orderNote: orderNote.trim() || undefined,
        items: cart.map(c => ({
          menuItemId: c.item.id,
          quantity: c.qty,
          spiceLevel: c.spiceLevel,
          note: c.note,
        })),
      });

      console.log("[TableTab] ORDER CREATED SUCCESSFULLY:", order);

      setBackendOrderId(order.id);
      setOrderedItems(prev => mergeItems(prev, cart));
      setCart([]);
      setOrderNote("");
      setShowNoteInput(false);
      setOrderStatus(order.status === "preparing" ? "preparing" : "placed");
      setTab("order");
    } catch (error) {
      console.error("[TableTab] ORDER CREATION FAILED:", error);
      alert(error instanceof Error ? error.message : "Unable to place order. Please try again.");
    } finally {
      setOrderSubmitting(false);
    }
  }

  async function requestBill() {
    if (!sessionToken) {
      alert(sessionError || "Your table session is not active. Please scan the table QR code again.");
      return;
    }

    try {
      await createServiceRequest(sessionToken, "bill");
      setBillStatus("requested");
      setTab("bill");
    } catch (error) {
      console.error("[TableTab] BILL REQUEST FAILED:", error);
      alert(error instanceof Error ? error.message : "Unable to request the bill. Please try again.");
    }
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
              <p className={`font-['Inter:Regular'] font-normal text-[12px] whitespace-nowrap ${sessionError ? "text-[#b44b2a]" : "text-[#32705a]"}`}>{sessionError ? "Table session needs attention" : sessionToken ? "Guest service online" : "Connecting to table…"}</p>
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
                        <p className="font-['Inter:Regular'] font-normal text-[#32705a] text-[12px] whitespace-nowrap">Menu and ordering</p>
                      </div>
                      <p className="font-['Inter:Regular'] font-normal text-[#575b54] text-[12px] whitespace-nowrap">Hours set by restaurant</p>
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

                {/* Backend connection status */}
                {(sessionLoading || sessionError || menuLoading || menuError) && (
                  <div className={`border border-solid flex flex-col gap-2 items-start p-4 rounded-[16px] w-full ${sessionError || menuError ? "bg-[#fff2ef] border-[#e4b8aa]" : "bg-[#fbf8f3] border-[#ded9d0]"}`}>
                    {sessionLoading && (
                      <p className="font-['Inter:Regular'] font-normal text-[#575b54] text-[12px]">Starting your table session…</p>
                    )}
                    {menuLoading && (
                      <p className="font-['Inter:Regular'] font-normal text-[#575b54] text-[12px]">Loading the restaurant menu…</p>
                    )}
                    {sessionError && (
                      <p className="font-['Inter:Regular'] font-normal text-[#b44b2a] text-[12px]">Table session: {sessionError}</p>
                    )}
                    {menuError && (
                      <p className="font-['Inter:Regular'] font-normal text-[#b44b2a] text-[12px]">Menu: {menuError}</p>
                    )}
                  </div>
                )}

                {/* Menu section */}
                <div className="bg-white border border-[#ded9d0] border-solid flex flex-col gap-[18px] items-start p-6 rounded-[24px] w-full">
                  <div className="flex items-end justify-between w-full">
                    <div>
                      <p className="font-['Inter:Bold'] font-bold text-[#b44b2a] text-[11px] uppercase tracking-[0.12em]">Tonight at {venueName}</p>
                      <p className="font-['DM_Sans:Regular'] font-normal text-[#20231f] text-[26px]" style={{ fontVariationSettings: '"opsz" 14' }}>Explore the menu</p>
                    </div>
                    <p className="font-['Inter:Regular'] font-normal text-[#8a8d86] text-[13px]">{menu.length} options</p>
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
                    {(categories.length ? categories : DEFAULT_CATEGORIES).map(cat => (
                      <button key={cat} onClick={() => { setCategory(cat); setSearch(""); }} className={`flex flex-col items-start px-[13px] py-[8px] rounded-full shrink-0 border border-solid transition-colors ${category === cat && search === "" ? "bg-[#252824] border-[#252824]" : "bg-white border-[#ded9d0] hover:border-[#aaa]"}`}>
                        <p className={`font-['Inter:Bold'] font-bold text-[12px] whitespace-nowrap ${category === cat && search === "" ? "text-white" : "text-[#575b54]"}`}>{cat}</p>
                      </button>
                    ))}
                  </div>
                  {menuLoading ? (
                    <p className="font-['Inter:Regular'] font-normal text-[#8a8d86] text-[14px] py-4 w-full text-center">Loading dishes…</p>
                  ) : menuError ? (
                    <p className="font-['Inter:Regular'] font-normal text-[#b44b2a] text-[14px] py-4 w-full text-center">The menu could not be loaded. Please refresh or scan the table QR again.</p>
                  ) : displayItems.length === 0 ? (
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
                {(orderStatus === "cart" || pendingItems > 0) && (
                  <div className="bg-white border border-[#ded9d0] border-solid flex flex-col gap-[18px] items-start p-6 rounded-[24px] w-full">
                    <div className="flex items-center justify-between w-full">
                      <p className="font-['DM_Sans:Regular'] font-normal text-[#20231f] text-[22px]" style={{ fontVariationSettings: '"opsz" 14' }}>Review your order</p>
                      {pendingItems > 0 && <button onClick={() => setCart([])} className="font-['Inter:Bold'] font-bold text-[#b44b2a] text-[13px] hover:opacity-70 transition-opacity">Clear</button>}
                    </div>
                    {pendingItems === 0 ? (
                      <div className="flex flex-col items-center gap-3 py-8 w-full">
                        <p className="font-['DM_Sans:Regular'] font-normal text-[#20231f] text-[18px]" style={{ fontVariationSettings: '"opsz" 14' }}>No new items waiting to be sent</p>
                        <p className="font-['Inter:Regular'] font-normal text-[#8a8d86] text-[13px]">Your submitted items remain below in order history.</p>
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

                        {orderedItems.length > 0 && (
                          <div className="bg-[#fbf8f3] border border-[#ded9d0] border-solid flex flex-col gap-[10px] items-start p-4 rounded-[12px] w-full">
                            <div className="flex items-center justify-between w-full">
                              <p className="font-['Inter:Extra_Bold'] font-extrabold text-[#20231f] text-[14px]">Already sent to kitchen</p>
                              <p className="font-['Inter:Regular'] font-normal text-[#575b54] text-[11px]">{orderedItems.reduce((sum, item) => sum + item.qty, 0)} items</p>
                            </div>
                            {orderedItems.map(c => (
                              <div key={`ordered-${c.item.id}-${c.spiceLevel}-${c.note ?? ""}`} className="flex gap-2 items-start text-[12px] w-full">
                                <p className="font-['Inter:Extra_Bold'] font-extrabold text-[#32705a] w-[24px]">{c.qty}×</p>
                                <div className="flex-1 min-w-0">
                                  <p className="font-['Inter:Regular'] font-normal text-[#20231f]">{c.item.name}</p>
                                  {c.spiceLevel && <p className="font-['Inter:Regular'] font-normal text-[#8a8d86] capitalize">{c.spiceLevel} spice</p>}
                                </div>
                                <p className="font-['Inter:Regular'] font-normal text-[#20231f] whitespace-nowrap">{fmt(c.item.price * c.qty)}</p>
                              </div>
                            ))}
                          </div>
                        )}

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
                          {[["Subtotal", fmt(cartTotals.subtotal)], ["Tax · 8.5%", fmt(cartTotals.tax)], ["Service charge · 5%", fmt(cartTotals.service)]].map(([label, value]) => (
                            <div key={label} className="flex font-['Inter:Regular'] font-normal items-start justify-between text-[13px] w-full">
                              <p className="text-[#575b54]">{label}</p>
                              <p className="text-[#20231f]">{value}</p>
                            </div>
                          ))}
                          <div className="h-px bg-[#ded9d0] w-full" />
                          <div className="flex items-start justify-between font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[18px] w-full">
                            <p style={{ fontVariationSettings: '"opsz" 14' }}>Total</p>
                            <p style={{ fontVariationSettings: '"opsz" 14' }}>{fmt(cartTotals.total)}</p>
                          </div>
                        </div>
                        <p className="font-['Inter:Regular'] font-normal leading-[1.4] text-[#8a8d86] text-[10px] text-center w-full">Only the new items above will be sent to the kitchen.</p>
                        <button onClick={placeOrder} disabled={orderSubmitting || !sessionToken || !!menuError || pendingItems === 0} className="bg-[#b44b2a] border border-[#b44b2a] border-solid flex gap-2 h-[46px] items-center justify-center px-4 rounded-[12px] w-full hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-50">
                          <div className="relative size-[17px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgSend} /></div>
                          <p className="font-['Inter:Regular'] font-normal text-[14px] text-white whitespace-nowrap">{orderSubmitting ? "Sending…" : `Place order · ${fmt(cartTotals.total)}`}</p>
                        </button>
                      </>
                    )}
                  </div>
                )}

                {(orderedItems.length > 0 || orderStatus === "placed" || orderStatus === "preparing" || orderStatus === "ready" || orderStatus === "served") && (
                  <>
                    {/* Tracking section */}
                    <div className="bg-white border border-[#ded9d0] border-solid flex flex-col gap-[18px] items-start p-6 rounded-[24px] w-full">
                      <div className="flex items-center justify-between w-full">
                        <p className="font-['DM_Sans:Regular'] font-normal text-[#20231f] text-[22px]" style={{ fontVariationSettings: '"opsz" 14' }}>Order {orderNumber}</p>
                        <div className="flex gap-[6px] items-center">
                          <div className="relative size-[8px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse1} /></div>
                          <p className="font-['Inter:Regular'] font-normal text-[#32705a] text-[12px] whitespace-nowrap">Status synced from kitchen</p>
                        </div>
                      </div>
                      <div className="bg-[#252824] flex flex-col gap-[10px] items-start p-[18px] rounded-[18px] w-full">
                        <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[26px] text-white w-full" style={{ fontVariationSettings: '"opsz" 14' }}>
                          {orderStatus === "placed" ? "Order received!" : orderStatus === "preparing" ? "The kitchen is preparing your order" : orderStatus === "ready" ? "Your order is ready" : orderStatus === "served" ? "Your order has been served" : "Order status"}
                        </p>
                        <p className="font-['Inter:Regular'] font-normal text-[13px] text-[rgba(255,255,255,0.72)] w-full">
                          {orderStatus === "placed" ? "Your order has been received by TableTab." : "Order progress updates when the kitchen changes the status."}
                        </p>
                      </div>
                      <div className="rounded-xl border border-[#ded9d0] bg-[#fbf8f3] p-4 w-full">
                        <p className="text-xs uppercase tracking-wide text-[#8a8d86]">Current database status</p>
                        <p className="mt-1 font-semibold capitalize text-[#20231f]">{orderStatus === "placed" ? "New" : orderStatus}</p>
                        <p className="mt-1 text-xs text-[#777b73]">This status updates from the restaurant order record. No estimated timestamps are shown until the backend stores them.</p>
                      </div>
                      <div className="bg-white border border-[#ded9d0] border-solid flex flex-col gap-[11px] items-start p-4 rounded-[12px] w-full">
                        <div className="flex items-start justify-between w-full">
                          <p className="font-['Inter:Extra_Bold'] font-extrabold text-[#20231f] text-[14px]">Your order</p>
                          <p className="font-['Inter:Regular'] font-normal text-[#575b54] text-[11px]">{totalItems} items</p>
                        </div>
                        {sessionItems.map(c => (
                          <div key={`tracking-${c.item.id}-${c.spiceLevel}-${c.note ?? ""}`} className="flex gap-2 items-start text-[12px] w-full">
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
                            <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[21px]" style={{ fontVariationSettings: '"opsz" 14' }}>Dining session</p>
                            <p className="font-['Inter:Regular'] font-normal text-[#575b54] text-[12px]">Opened {sessionStart} · 1 guest</p>
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
                            <p className="font-['Inter:Bold'] font-bold text-[#b06a16] text-[12px] whitespace-nowrap">{orderStatus === "served" ? "Served" : orderStatus === "preparing" ? "Preparing" : "Order received"}</p>
                          </div>
                          <div className="flex gap-[6px] items-center">
                            <div className="relative size-[8px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse1} /></div>
                            <p className="font-['Inter:Regular'] font-normal text-[#32705a] text-[12px] whitespace-nowrap">Live</p>
                          </div>
                        </div>
                        <div className="font-['Inter:Regular'] font-normal text-[#20231f] text-[13px] w-full">
                          {sessionItems.map(c => <p key={`activity-${c.item.id}-${c.spiceLevel}-${c.note ?? ""}`} className="leading-[1.55]">{c.qty}× {c.item.name}</p>)}
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
                </div>

                {billStatus === "requested" && (
                  <div className="bg-[#f9eacf] flex flex-col gap-2 items-center p-[18px] rounded-[18px] w-full">
                    <div className="bg-[#b06a16] flex flex-col items-center justify-center rounded-full size-[44px]">
                      <div className="relative size-[22px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgClock} /></div>
                    </div>
                    <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[21px] whitespace-nowrap" style={{ fontVariationSettings: '"opsz" 14' }}>Your bill is requested</p>
                    <p className="font-['Inter:Regular'] font-normal leading-[1.45] text-[#575b54] text-[12px] text-center w-full">Your bill request has been recorded. A team member will assist you shortly.</p>
                  </div>
                )}



                <div className="bg-white border border-[#ded9d0] border-solid flex flex-col gap-[11px] items-start p-4 rounded-[12px] w-full">
                  <div className="flex items-start justify-between w-full">
                    <p className="font-['Inter:Extra_Bold'] font-extrabold text-[#20231f] text-[14px]">Table {tableNumber} · {orderNumber}</p>
                    <p className="font-['Inter:Regular'] font-normal text-[#575b54] text-[11px]">1 guest</p>
                  </div>
                  {sessionItems.length === 0 ? (
                    <p className="font-['Inter:Regular'] font-normal text-[#8a8d86] text-[13px]">No items ordered yet.</p>
                  ) : (
                    sessionItems.map(c => (
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




              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
