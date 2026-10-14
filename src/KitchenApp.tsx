import { useState, useEffect, useCallback } from "react";
import { getOrders, updateOrder } from "./lib/tabletabApi";

const assetPathPrefix = "/assets";
const imgLiveDot = `${assetPathPrefix}/23810.svg`;
const imgChefHat = `${assetPathPrefix}/72498.svg`;
const imgSlidersHorizontal = `${assetPathPrefix}/dc4a4.svg`;
const imgChevronDown = `${assetPathPrefix}/de4f6.svg`;
const imgVolume2 = `${assetPathPrefix}/cf0e5.svg`;
const imgIndicator = `${assetPathPrefix}/8c8de.svg`;
const imgStatusMarker = `${assetPathPrefix}/a8892.svg`;
const imgStatusMarker1 = `${assetPathPrefix}/0c1ad.svg`;
const imgStatusMarker2 = `${assetPathPrefix}/2fe32.svg`;
const imgIndicator1 = `${assetPathPrefix}/4dfba.svg`;
const imgIndicator2 = `${assetPathPrefix}/28b0b.svg`;
const imgIndicator3 = `${assetPathPrefix}/0d1cf.svg`;
const imgTriangleAlert = `${assetPathPrefix}/1ecea.svg`;
const imgTriangleAlert1 = `${assetPathPrefix}/0ea0b.svg`;
const imgFlame = `${assetPathPrefix}/8ea9f.svg`;
const imgEllipsis = `${assetPathPrefix}/73058.svg`;
const imgMessageSquare = `${assetPathPrefix}/877ff.svg`;
const imgMessageSquare2 = `${assetPathPrefix}/9e3e5.svg`;
const imgCheck = `${assetPathPrefix}/5467c.svg`;
const imgPrinter = `${assetPathPrefix}/25c04.svg`;

type Lane = "new" | "preparing" | "ready" | "completed";

interface TicketItem {
  text: string;
  modifier?: string;
  modifierStyle?: "red" | "muted";
}

interface Ticket {
  id: string;
  table: string;
  guests: number;
  orderNumber: string;
  time: string;
  elapsed: number; // seconds
  items: TicketItem[];
  note?: { type: "alert" | "info"; text: string };
  lane: Lane;
  late?: boolean;
}

function mapOrderToTicket(order: any): Ticket {
  const created = new Date(order.createdAt).getTime();
  const elapsed = Math.max(0, Math.floor((Date.now() - created) / 1000));
  const lane: Lane = order.status === "new" ? "new" : order.status === "preparing" ? "preparing" : order.status === "ready" ? "ready" : "completed";
  return {
    id: order.id,
    table: order.tableName || (order.tableNumber ? `Table ${String(order.tableNumber).padStart(2, "0")}` : "Table —"),
    guests: Number(order.guests ?? 0),
    orderNumber: order.orderNumber || `Order ${String(order.id).slice(0, 8)}`,
    time: new Date(order.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    elapsed,
    items: order.items.map((item: any) => ({
      text: `${item.quantity}× ${item.name}`,
      modifier: item.note || undefined,
      modifierStyle: item.note ? "muted" : undefined,
    })),
    note: order.orderNote ? { type: "info", text: order.orderNote } : undefined,
    lane,
    late: elapsed > 900,
  };
}

function fmtElapsed(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function ElapsedDisplay({ seconds, late }: { seconds: number; late?: boolean }) {
  const color = late ? "text-[#b23a3a]" : seconds > 900 ? "text-[#b23a3a]" : seconds > 600 ? "text-[#b06a16]" : "text-[#20231f]";
  return (
    <div className="flex flex-col gap-[2px] items-end">
      <p className={`font-['DM_Sans:Regular'] font-normal text-[18px] ${color}`} style={{ fontVariationSettings: '"opsz" 14' }}>{fmtElapsed(seconds)}</p>
      <p className="font-['Inter:Regular'] font-normal text-[#8a8d86] text-[9px] uppercase">elapsed</p>
    </div>
  );
}

function TicketNote({ note }: { note: NonNullable<Ticket["note"]> }) {
  const isAlert = note.type === "alert";
  return (
    <div className={`flex gap-[7px] items-start p-[9px] rounded-[8px] w-full ${isAlert ? "bg-[#f8e1e1]" : "bg-[#f9eacf]"}`}>
      <div className="relative shrink-0 size-[15px]">
        <img alt="" className="absolute block inset-0 max-w-none size-full" src={isAlert ? imgTriangleAlert : imgMessageSquare} />
      </div>
      <p className={`flex-1 font-['Inter:Regular'] font-normal leading-[1.35] text-[11px] min-w-0 ${isAlert ? "text-[#b23a3a]" : "text-[#b06a16]"}`}>{note.text}</p>
    </div>
  );
}

export default function KitchenApp({ propertyId }: { propertyId?: string }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [completedHistory, setCompletedHistory] = useState<Array<{ id: string; loc: string; time: string }>>([]);
  const [completedToday, setCompletedToday] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [clock, setClock] = useState(new Date());
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const loadOrders = useCallback(async () => {
    if (!propertyId) {
      setTickets([]);
      setCompletedHistory([]);
      setCompletedToday(0);
      setLoadError("Kitchen is not connected to a restaurant property.");
      setLoading(false);
      console.error("[TableTab][Kitchen] Missing propertyId");
      return;
    }

    try {
      console.log("[TableTab][Kitchen] Loading orders for property:", propertyId);
      const orders = await getOrders(propertyId);
      console.log("[TableTab][Kitchen] Orders received:", orders.length, orders);

      const mapped = orders.map(mapOrderToTicket);
      setTickets(mapped.filter(t => t.lane !== "completed"));
      const todayKey = new Date().toDateString();
      setCompletedToday(orders.filter((order: any) => ["served", "completed"].includes(order.status) && new Date(order.createdAt).toDateString() === todayKey).length);
      setCompletedHistory(
        mapped
          .filter(t => t.lane === "completed")
          .slice(0, 8)
          .map(t => ({ id: t.id, loc: t.table, time: `Served · order placed ${t.time}` }))
      );
      setSelectedId(current =>
        current && mapped.some(t => t.id === current && t.lane !== "completed")
          ? current
          : (mapped.find(t => t.lane === "preparing")?.id ??
            mapped.find(t => t.lane === "new")?.id ??
            null)
      );
      setLoadError(null);
      setLastSyncedAt(new Date());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load kitchen orders";
      console.error("[TableTab][Kitchen] Unable to sync orders:", error);
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    setLoading(true);
    loadOrders();
    const syncTimer = window.setInterval(loadOrders, 2500);
    const clockTimer = window.setInterval(() => setClock(new Date()), 1000);
    return () => { window.clearInterval(syncTimer); window.clearInterval(clockTimer); };
  }, [loadOrders]);

  const clockStr = clock.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  async function advance(id: string) {
    const current = tickets.find(t => t.id === id);
    if (!current || !propertyId) return;
    const nextStatus = current.lane === "new" ? "preparing" : current.lane === "preparing" ? "ready" : "served";
    try {
      await updateOrder(propertyId, id, { status: nextStatus as any });
      if (nextStatus === "served") setSelectedId(null);
      await loadOrders();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update kitchen order";
      console.error("[TableTab][Kitchen] Unable to update order:", error);
      setLoadError(message);
    }
  }

  const lane = (l: Lane) => tickets.filter(t => t.lane === l);
  const preparingTickets = lane("preparing");
  const selectedTicket = tickets.find(t => t.id === selectedId) ?? null;

  const lateCount = tickets.filter(t => t.elapsed > 900 && t.lane !== "completed").length;

  return (
    <div className="min-h-screen w-full bg-[#f3f0ea]">
      {/* Kitchen board screen */}
      <div className="flex flex-col w-full min-h-screen">
        {/* Header */}
        <div className="bg-[#252824] flex h-[76px] items-center justify-between px-6 w-full shrink-0">
          <div className="flex gap-[14px] items-center">
            <div className="bg-[#b44b2a] flex items-center justify-center rounded-[12px] size-[40px]">
              <div className="relative size-[22px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgChefHat} /></div>
            </div>
            <div className="flex flex-col gap-[2px] items-start">
              <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[19px] text-white" style={{ fontVariationSettings: '"opsz" 14' }}>TableTab</p>
              <p className="font-['Inter:Bold'] font-bold text-[11px] text-[rgba(255,255,255,0.6)] uppercase">Kitchen display</p>
            </div>
          </div>
          <div className="flex gap-[10px] items-center">
            <div className="bg-[#30342f] border border-[rgba(255,255,255,0.12)] flex gap-2 h-[40px] items-center px-[13px] rounded-[8px]" aria-label="Showing all restaurant orders">
              <div className="relative size-[16px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgSlidersHorizontal} /></div>
              <p className="font-['Inter:Bold'] font-bold text-[13px] text-white whitespace-nowrap">All orders</p>
            </div>
            <button onClick={() => setMuted(m => !m)} className={`flex items-center justify-center rounded-[8px] size-[40px] transition-colors ${muted ? "bg-[#b44b2a]" : "bg-[#30342f]"}`}>
              <div className="relative size-[18px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgVolume2} /></div>
            </button>
            <div className="bg-[#30342f] flex h-[40px] items-center px-[13px] rounded-[8px]">
              <div className="flex gap-[6px] items-center">
                <div className="relative size-[8px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLiveDot} /></div>
                <p className="font-['Inter:Regular'] font-normal text-[12px] text-white whitespace-nowrap">Live · {clock.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true })}</p>
              </div>
            </div>
            <div className="bg-white flex h-[40px] items-center px-[14px] rounded-[8px]">
              <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[16px] whitespace-nowrap" style={{ fontVariationSettings: '"opsz" 14' }}>{clockStr}</p>
            </div>
          </div>
        </div>

        {/* Workload summary bar */}
        <div className="bg-[#30342f] border-[rgba(255,255,255,0.08)] border-solid border-t flex h-[56px] items-center justify-between px-6 w-full shrink-0">
          <div className="flex gap-[22px] items-center">
            {[
              [String(tickets.length), "Open orders", false],
              [String(lane("new").length), "New", false],
              [String(lane("preparing").length), "Cooking", true],
              [String(lane("ready").length), "Ready", false],
              ["12:42", "Avg. ticket", false],
            ].map(([val, label, amber]) => (
              <div key={label as string} className="flex gap-2 items-baseline">
                <p className={`font-['DM_Sans:ExtraBold'] font-extrabold text-[18px] ${amber ? "text-[#f4c07a]" : "text-white"}`} style={{ fontVariationSettings: '"opsz" 14' }}>{val}</p>
                <p className="font-['Inter:Regular'] font-normal text-[11px] text-[rgba(255,255,255,0.56)] uppercase">{label}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-4 items-center">
            {lateCount > 0 && (
              <div className="bg-[#f8e1e1] flex gap-[6px] items-center px-[10px] py-[6px] rounded-full">
                <div className="relative size-[6px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIndicator} /></div>
                <p className="font-['Inter:Bold'] font-bold text-[#b23a3a] text-[12px] whitespace-nowrap">{lateCount} late order{lateCount > 1 ? "s" : ""}</p>
              </div>
            )}
            <p className="font-['Inter:Bold'] font-bold text-[12px] text-white whitespace-nowrap">Served orders placed today: {completedToday} →</p>
          </div>
        </div>

        {/* Board */}
        {loadError && (
          <div className="mx-[18px] mt-[14px] bg-[#f8e1e1] border border-[#e3b7b7] rounded-[12px] px-4 py-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-['Inter:Extra_Bold'] font-extrabold text-[#b23a3a] text-[12px] uppercase">Kitchen connection error</p>
              <p className="font-['Inter:Regular'] font-normal text-[#20231f] text-[13px] mt-1 break-words">{loadError}</p>
              <p className="font-['Inter:Regular'] font-normal text-[#8a8d86] text-[10px] mt-1 break-all">Property: {propertyId ?? "missing"}</p>
            </div>
            <button onClick={loadOrders} className="shrink-0 bg-[#b44b2a] text-white font-['Inter:Bold'] font-bold text-[12px] px-4 py-2 rounded-[8px]">Retry</button>
          </div>
        )}
        {loading && !loadError && (
          <div className="mx-[18px] mt-[14px] bg-white border border-[#ded9d0] rounded-[12px] px-4 py-3">
            <p className="font-['Inter:Regular'] text-[#575b54] text-[13px]">Loading kitchen orders…</p>
          </div>
        )}
        {!loading && !loadError && tickets.length === 0 && completedHistory.length === 0 && (
          <div className="mx-[18px] mt-[14px] bg-white border border-[#ded9d0] rounded-[12px] px-4 py-3 flex items-center justify-between gap-4">
            <div>
              <p className="font-['Inter:Bold'] font-bold text-[#20231f] text-[13px]">No orders yet</p>
              <p className="font-['Inter:Regular'] text-[#8a8d86] text-[11px] mt-1">New customer orders will appear here automatically.</p>
            </div>
            <p className="font-['Inter:Regular'] text-[#8a8d86] text-[10px] whitespace-nowrap">{lastSyncedAt ? `Synced ${lastSyncedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })}` : "Waiting for sync"}</p>
          </div>
        )}
        <div className="flex flex-1 gap-4 items-start p-[18px] w-full overflow-x-auto">
          {/* New lane */}
          <div className="bg-[#f0ece5] flex flex-1 flex-col gap-3 items-start min-w-[240px] p-[14px] rounded-[18px] self-stretch">
            <div className="flex h-[38px] items-center justify-between w-full">
              <div className="flex gap-2 items-center">
                <div className="relative size-[9px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgStatusMarker} /></div>
                <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[17px] whitespace-nowrap" style={{ fontVariationSettings: '"opsz" 14' }}>New</p>
              </div>
              <div className="bg-[#e1eef1] flex gap-[6px] items-center px-[10px] py-[6px] rounded-full">
                <div className="relative size-[6px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIndicator1} /></div>
                <p className="font-['Inter:Bold'] font-bold text-[#356a7a] text-[12px] whitespace-nowrap">{lane("new").length} waiting</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 items-start w-full">
              {lane("new").map(tk => (
                <div key={tk.id} className="bg-white border border-[#ded9d0] border-solid flex flex-col gap-[10px] items-start p-[15px] rounded-[12px] shadow-[0px_8px_24px_0px_rgba(43,38,31,0.08)] w-full cursor-pointer hover:border-[#b44b2a] transition-colors" onClick={() => setSelectedId(tk.id)}>
                  <div className="flex items-start justify-between w-full">
                    <div className="flex flex-col gap-[3px] items-start">
                      <p className="font-['DM_Sans:Regular'] font-normal text-[#20231f] text-[17px]" style={{ fontVariationSettings: '"opsz" 14' }}>{tk.orderNumber}</p>
                      <p className="font-['Inter:Bold'] font-bold text-[#575b54] text-[12px]">{tk.table} · {tk.time}</p>
                    </div>
                    <ElapsedDisplay seconds={tk.elapsed} late={tk.late} />
                  </div>
                  <div className="h-px bg-[#ded9d0] w-full" />
                  <div className="flex flex-col gap-[7px] items-start w-full">
                    {tk.items.map((it, i) => (
                      <p key={i} className={`font-['Inter:Regular'] font-normal leading-[1.35] text-[13px] w-full ${it.modifierStyle === "red" ? "font-semibold text-[#b23a3a]" : it.modifierStyle === "muted" ? "font-semibold text-[#575b54]" : "text-[#20231f]"}`}>{it.text}</p>
                    ))}
                  </div>
                  {tk.note && <TicketNote note={tk.note} />}
                  <div className="flex gap-2 items-start w-full">
                    <button onClick={e => { e.stopPropagation(); advance(tk.id); }} className="bg-[#252824] border border-[#252824] border-solid flex flex-1 gap-2 h-[46px] items-center justify-center min-w-0 px-4 rounded-[12px] hover:opacity-90 transition-opacity">
                      <div className="relative size-[17px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFlame} /></div>
                      <p className="font-['Inter:Regular'] font-normal text-[14px] text-white whitespace-nowrap">Start cooking</p>
                    </button>
                    <button className="bg-[#fbf8f3] border border-[#ded9d0] border-solid flex h-[46px] items-center justify-center rounded-[12px] w-[44px] hover:bg-white transition-colors">
                      <div className="relative size-[18px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipsis} /></div>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preparing lane */}
          <div className="bg-[#f0ece5] flex flex-1 flex-col gap-3 items-start min-w-[240px] p-[14px] rounded-[18px] self-stretch">
            <div className="flex h-[38px] items-center justify-between w-full">
              <div className="flex gap-2 items-center">
                <div className="relative size-[9px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgStatusMarker1} /></div>
                <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[17px] whitespace-nowrap" style={{ fontVariationSettings: '"opsz" 14' }}>Preparing</p>
              </div>
              <div className="bg-[#f9eacf] flex gap-[6px] items-center px-[10px] py-[6px] rounded-full">
                <div className="relative size-[6px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIndicator2} /></div>
                <p className="font-['Inter:Bold'] font-bold text-[#b06a16] text-[12px] whitespace-nowrap">{preparingTickets.length} cooking</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 items-start w-full">
              {preparingTickets.map(tk => (
                <div key={tk.id}
                  className={`flex flex-col gap-[10px] items-start p-[15px] rounded-[12px] shadow-[0px_8px_24px_0px_rgba(43,38,31,0.08)] w-full cursor-pointer transition-all ${selectedId === tk.id ? "bg-white border-2 border-[#b44b2a] border-solid" : tk.late ? "bg-white border-[3px] border-[#b23a3a] border-solid" : "bg-white border border-[#ded9d0] border-solid hover:border-[#b44b2a]"}`}
                  onClick={() => setSelectedId(tk.id)}>
                  <div className="flex items-start justify-between w-full">
                    <div className="flex flex-col gap-[3px] items-start">
                      <p className="font-['DM_Sans:Regular'] font-normal text-[#20231f] text-[17px]" style={{ fontVariationSettings: '"opsz" 14' }}>{tk.orderNumber}</p>
                      <p className="font-['Inter:Bold'] font-bold text-[#575b54] text-[12px]">{tk.table} · {tk.time}</p>
                    </div>
                    <ElapsedDisplay seconds={tk.elapsed} late={tk.late} />
                  </div>
                  <div className="h-px bg-[#ded9d0] w-full" />
                  <div className="flex flex-col gap-[7px] items-start w-full">
                    {tk.items.map((it, i) => (
                      <p key={i} className={`font-['Inter:Regular'] font-normal leading-[1.35] text-[13px] w-full ${it.modifierStyle === "red" ? "font-['Inter:Semi_Bold'] font-semibold text-[#b23a3a]" : it.modifierStyle === "muted" ? "font-['Inter:Semi_Bold'] font-semibold text-[#575b54]" : "text-[#20231f]"}`}>{it.text}</p>
                    ))}
                  </div>
                  {tk.note && <TicketNote note={tk.note} />}
                  <div className="flex gap-2 items-start w-full">
                    <button onClick={e => { e.stopPropagation(); advance(tk.id); }} className="bg-[#252824] border border-[#252824] border-solid flex flex-1 gap-2 h-[46px] items-center justify-center min-w-0 px-4 rounded-[12px] hover:opacity-90 transition-opacity">
                      <div className="relative size-[17px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgCheck} /></div>
                      <p className="font-['Inter:Regular'] font-normal text-[14px] text-white whitespace-nowrap">Mark ready</p>
                    </button>
                    <button className="bg-[#fbf8f3] border border-[#ded9d0] border-solid flex h-[46px] items-center justify-center rounded-[12px] w-[44px] hover:bg-white transition-colors">
                      <div className="relative size-[18px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipsis} /></div>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ready lane */}
          <div className="bg-[#f0ece5] flex flex-1 flex-col gap-3 items-start min-w-[240px] p-[14px] rounded-[18px] self-stretch">
            <div className="flex h-[38px] items-center justify-between w-full">
              <div className="flex gap-2 items-center">
                <div className="relative size-[9px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgStatusMarker2} /></div>
                <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[17px] whitespace-nowrap" style={{ fontVariationSettings: '"opsz" 14' }}>Ready</p>
              </div>
              <div className="bg-[#e2f0ea] flex gap-[6px] items-center px-[10px] py-[6px] rounded-full">
                <div className="relative size-[6px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIndicator3} /></div>
                <p className="font-['Inter:Bold'] font-bold text-[#32705a] text-[12px] whitespace-nowrap">{lane("ready").length} for runner</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 items-start w-full">
              {lane("ready").map(tk => (
                <div key={tk.id} className="bg-white border border-[#32705a] border-solid flex flex-col gap-[10px] items-start p-[15px] rounded-[12px] shadow-[0px_8px_24px_0px_rgba(43,38,31,0.08)] w-full cursor-pointer hover:border-[#b44b2a] transition-colors" onClick={() => setSelectedId(tk.id)}>
                  <div className="flex items-start justify-between w-full">
                    <div className="flex flex-col gap-[3px] items-start">
                      <p className="font-['DM_Sans:Regular'] font-normal text-[#20231f] text-[17px]" style={{ fontVariationSettings: '"opsz" 14' }}>{tk.orderNumber}</p>
                      <p className="font-['Inter:Bold'] font-bold text-[#575b54] text-[12px]">{tk.table} · {tk.time}</p>
                    </div>
                    <div className="flex flex-col gap-[2px] items-end">
                      <p className="font-['DM_Sans:Regular'] font-normal text-[#32705a] text-[18px]" style={{ fontVariationSettings: '"opsz" 14' }}>{fmtElapsed(tk.elapsed)}</p>
                      <p className="font-['Inter:Regular'] font-normal text-[#8a8d86] text-[9px] uppercase">elapsed</p>
                    </div>
                  </div>
                  <div className="h-px bg-[#ded9d0] w-full" />
                  <div className="flex flex-col gap-[7px] items-start w-full">
                    {tk.items.map((it, i) => (
                      <p key={i} className="font-['Inter:Regular'] font-normal leading-[1.35] text-[#20231f] text-[13px] w-full">{it.text}</p>
                    ))}
                  </div>
                  {tk.note && <TicketNote note={tk.note} />}
                  <div className="flex gap-2 items-start w-full">
                    <button onClick={e => { e.stopPropagation(); advance(tk.id); }} className="bg-[#b44b2a] border border-[#b44b2a] border-solid flex flex-1 gap-2 h-[46px] items-center justify-center min-w-0 px-4 rounded-[12px] hover:opacity-90 transition-opacity">
                      <div className="relative size-[17px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgCheck} /></div>
                      <p className="font-['Inter:Regular'] font-normal text-[14px] text-white whitespace-nowrap">Mark served</p>
                    </button>
                    <button className="bg-[#fbf8f3] border border-[#ded9d0] border-solid flex h-[46px] items-center justify-center rounded-[12px] w-[44px] hover:bg-white transition-colors">
                      <div className="relative size-[18px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipsis} /></div>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Completed history */}
          <div className="bg-[#252824] flex flex-col gap-3 items-start p-[14px] rounded-[18px] shrink-0 w-[200px] self-stretch">
            <div className="flex items-start justify-between w-full">
              <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[16px] text-white" style={{ fontVariationSettings: '"opsz" 14' }}>Completed</p>
              <p className="font-['Inter:Regular'] font-normal text-[11px] text-[rgba(255,255,255,0.56)]">{completedToday} orders placed today</p>
            </div>
            {completedHistory.slice(0, 5).map((c, i) => (
              <div key={c.id} className={`flex flex-col gap-1 items-start py-[10px] w-full ${i > 0 ? "border-t border-[rgba(255,255,255,0.1)] border-solid" : ""}`}>
                <p className="font-['Inter:Bold'] font-bold text-[12px] text-white w-full">{c.id} · {c.loc}</p>
                <p className="font-['Inter:Regular'] font-normal text-[10px] text-[rgba(255,255,255,0.45)]">{c.time}</p>
              </div>
            ))}
            <div className="bg-[#30342f] flex flex-col gap-[5px] items-start p-3 rounded-[8px] w-full">
              <p className="font-['Inter:Bold'] font-bold text-[10px] text-[rgba(255,255,255,0.45)] uppercase">Last 30 min</p>
              <p className="font-['DM_Sans:Regular'] font-normal text-[24px] text-white" style={{ fontVariationSettings: '"opsz" 14' }}>11 served</p>
              <p className="font-['Inter:Regular'] font-normal text-[#8ed3b7] text-[10px]">↑ 18% throughput</p>
            </div>
          </div>
        </div>

        {/* Expanded order detail panel (when a preparing ticket is selected) */}
        {selectedTicket && selectedTicket.lane === "preparing" && (
          <div className="border-t border-[#ded9d0] border-solid bg-[#f3f0ea] flex items-start w-full" style={{ minHeight: 420 }}>
            {/* Queue sidebar */}
            <div className="bg-[#f0ece5] border-[#ded9d0] border-r border-solid flex flex-col gap-3 items-start p-[18px] shrink-0 w-[300px] self-stretch overflow-y-auto">
              <div className="flex items-start justify-between w-full">
                <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[18px]" style={{ fontVariationSettings: '"opsz" 14' }}>Preparing · {preparingTickets.length}</p>
                <p className="font-['Inter:Bold'] font-bold text-[#b44b2a] text-[11px]">Oldest first</p>
              </div>
              {preparingTickets.map(tk => (
                <button key={tk.id} onClick={() => setSelectedId(tk.id)} className={`flex flex-col gap-2 items-start p-[14px] rounded-[12px] w-full text-left transition-all ${selectedId === tk.id ? "bg-white border-2 border-[#b44b2a] border-solid" : "bg-[rgba(255,255,255,0.54)] border border-[#ded9d0] border-solid hover:border-[#aaa]"}`}>
                  <div className="flex items-start justify-between w-full">
                    <p className="font-['DM_Sans:Regular'] font-normal text-[#20231f] text-[17px]" style={{ fontVariationSettings: '"opsz" 14' }}>{tk.orderNumber}</p>
                    <p className={`font-['DM_Sans:Regular'] font-normal text-[16px] ${tk.late || tk.elapsed > 900 ? "text-[#b23a3a]" : "text-[#20231f]"}`} style={{ fontVariationSettings: '"opsz" 14' }}>{fmtElapsed(tk.elapsed)}</p>
                  </div>
                  <p className="font-['Inter:Bold'] font-bold text-[#575b54] text-[12px]">{tk.table} · {tk.items.filter(i => !i.modifierStyle).length} lines</p>
                  <p className="font-['Inter:Regular'] font-normal text-[#20231f] text-[11px] w-full overflow-hidden text-ellipsis whitespace-nowrap">{tk.items.map(i => i.text).join(" · ")}</p>
                </button>
              ))}
            </div>

            {/* Expanded detail */}
            <div className="flex flex-1 flex-col gap-5 items-start min-w-0 p-7 overflow-y-auto">
              <div className="flex items-start justify-between w-full">
                <div className="flex flex-col gap-[6px] items-start">
                  <div className="flex gap-[10px] items-center">
                    <p className="font-['DM_Sans:Regular'] font-normal text-[#20231f] text-[30px]" style={{ fontVariationSettings: '"opsz" 14' }}>{selectedTicket.orderNumber}</p>
                    <div className="bg-[#f9eacf] flex gap-[6px] items-center px-[10px] py-[6px] rounded-full">
                      <div className="relative size-[6px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIndicator2} /></div>
                      <p className="font-['Inter:Bold'] font-bold text-[#b06a16] text-[12px] whitespace-nowrap capitalize">{selectedTicket.lane}</p>
                    </div>
                  </div>
                  <p className="font-['Inter:Bold'] font-bold text-[#575b54] text-[15px] whitespace-nowrap">{selectedTicket.table} · {selectedTicket.guests || 0} guests · ordered {selectedTicket.time}</p>
                </div>
                <div className="flex flex-col gap-[3px] items-end">
                  <p className={`font-['DM_Sans:Regular'] font-normal text-[34px] ${selectedTicket.elapsed > 900 ? "text-[#b23a3a]" : "text-[#b06a16]"}`} style={{ fontVariationSettings: '"opsz" 14' }}>{fmtElapsed(selectedTicket.elapsed)}</p>
                  <p className="font-['Inter:Bold'] font-bold text-[#8a8d86] text-[11px]">elapsed</p>
                </div>
              </div>

              <div className="flex gap-[18px] items-start w-full flex-wrap">
                {/* Items to prepare */}
                <div className="flex flex-1 flex-col gap-3 items-start min-w-[280px]">
                  <p className="font-['Inter:Extra_Bold'] font-extrabold text-[#8a8d86] text-[12px] uppercase">Items to prepare</p>
                  <div className="flex flex-col gap-3 items-start w-full">
                    {selectedTicket.items.map((it, i) => {
                      const quantity = it.text.match(/^\d+/)?.[0] ?? "1";
                      const itemName = it.text.replace(/^\d+×\s*/, "");
                      return (
                        <div key={`${selectedTicket.id}-${i}`} className="flex gap-4 items-start p-[18px] rounded-[12px] w-full bg-white border border-[#ded9d0] border-solid">
                          <div className="bg-[#252824] flex items-center justify-center rounded-[8px] size-[44px] shrink-0">
                            <p className="font-['DM_Sans:Regular'] font-normal text-[20px] text-white whitespace-nowrap">{quantity}×</p>
                          </div>
                          <div className="flex flex-1 flex-col gap-[6px] items-start min-w-0">
                            <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[20px]">{itemName}</p>
                            <p className="font-['Inter:Regular'] text-[13px] text-[#575b54]">{it.modifier || "No preparation note provided"}</p>
                          </div>
                          <span className="rounded-full bg-[#f0ece5] px-2 py-1 text-[11px] text-[#575b54]">Order item</span>
                        </div>
                      );
                    })}
                  </div>
                  {selectedTicket.note && (
                    <div className="bg-[#f8e1e1] flex gap-[10px] items-start p-4 rounded-[12px] w-full">
                      <div className="relative size-[21px] shrink-0"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTriangleAlert1} /></div>
                      <div className="flex flex-1 flex-col gap-1 items-start min-w-0">
                        <p className="font-['Inter:Extra_Bold'] font-extrabold text-[#b23a3a] text-[11px] uppercase">Guest dietary note</p>
                        <p className="font-['Inter:Bold'] font-bold leading-[1.45] text-[#20231f] text-[14px]">{selectedTicket.note.text}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Live database status; no fabricated event history or station assignment. */}
                <div className="flex flex-col gap-3 items-start shrink-0 w-[260px]">
                  <p className="font-['Inter:Extra_Bold'] font-extrabold text-[#8a8d86] text-[12px] uppercase">Live order details</p>
                  <div className="bg-white border border-[#ded9d0] border-solid flex flex-col gap-3 items-start p-4 rounded-[12px] w-full">
                    <div>
                      <p className="text-[10px] uppercase text-[#8a8d86]">Current status</p>
                      <p className="mt-1 font-semibold capitalize">{selectedTicket.lane}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-[#8a8d86]">Order created</p>
                      <p className="mt-1 text-sm">{selectedTicket.time}</p>
                    </div>
                    <p className="text-xs text-[#777b73]">Station assignment and status history are not stored in the current database schema.</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 items-start w-full flex-wrap">
                <button onClick={() => advance(selectedTicket.id)} className="bg-[#b44b2a] border border-[#b44b2a] border-solid flex flex-1 gap-2 h-[46px] items-center justify-center min-w-[160px] px-4 rounded-[12px] hover:opacity-90 transition-opacity">
                  <div className="relative size-[17px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgCheck} /></div>
                  <p className="font-['Inter:Regular'] font-normal text-[14px] text-white whitespace-nowrap">{selectedTicket.lane === "new" ? "Accept order" : selectedTicket.lane === "preparing" ? "Mark order ready" : "Mark served"}</p>
                </button>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
