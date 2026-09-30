import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { getTables } from "./lib/tabletabApi";

const assetPathPrefix = "/assets";

// Icons
const imgLiveDot = `${assetPathPrefix}/23810.svg`;
const imgLiveDot1 = `${assetPathPrefix}/938d5.svg`;
const imgLayoutDashboard = `${assetPathPrefix}/63a64.svg`;
const imgLayoutDashboard1 = `${assetPathPrefix}/0d3c4.svg`;
const imgGrid3X3 = `${assetPathPrefix}/eb61e.svg`;
const imgGrid3X4 = `${assetPathPrefix}/54b93.svg`;
const imgReceiptText = `${assetPathPrefix}/a9314.svg`;
const imgReceiptText1 = `${assetPathPrefix}/2c7dc.svg`;
const imgReceiptText2 = `${assetPathPrefix}/5caa1.svg`;
const imgReceiptText3 = `${assetPathPrefix}/d58dc.svg`;
const imgUtensils = `${assetPathPrefix}/99821.svg`;
const imgCreditCard = `${assetPathPrefix}/e4bb7.svg`;
const imgCreditCard1 = `${assetPathPrefix}/c634b.svg`;
const imgSettings = `${assetPathPrefix}/6245d.svg`;
const imgSettings1 = `${assetPathPrefix}/b784f.svg`;
const imgChevronsUpDown = `${assetPathPrefix}/4b3a5.svg`;
const imgDownload = `${assetPathPrefix}/db202.svg`;
const imgDollarSign = `${assetPathPrefix}/8bbcd.svg`;
const imgTrendingUp = `${assetPathPrefix}/2dc8b.svg`;
const imgUsers = `${assetPathPrefix}/e5604.svg`;
const imgMarker = `${assetPathPrefix}/03645.svg`;
const imgMarker1 = `${assetPathPrefix}/8f041.svg`;
const imgMarker2 = `${assetPathPrefix}/9c822.svg`;
const imgPlus = `${assetPathPrefix}/e1d4d.svg`;
const imgPlus1 = `${assetPathPrefix}/40164.svg`;
const imgLayers = `${assetPathPrefix}/dbca7.svg`;
const imgChevronDown1 = `${assetPathPrefix}/eb069.svg`;
const imgStatusDot = `${assetPathPrefix}/4e98d.svg`;
const imgStatusDot1 = `${assetPathPrefix}/8312e.svg`;
const imgArrowRight = `${assetPathPrefix}/8694d.svg`;
const imgSearch = `${assetPathPrefix}/47e64.svg`;
const imgChevronDown2 = `${assetPathPrefix}/04638.svg`;
const imgChefHat1 = `${assetPathPrefix}/53ae9.svg`;
const imgUtensils1 = `${assetPathPrefix}/10df8.svg`;
const imgList = `${assetPathPrefix}/617c5.svg`;
const imgPencil = `${assetPathPrefix}/26144.svg`;
const imgCopy = `${assetPathPrefix}/0aea2.svg`;
const imgTrash2 = `${assetPathPrefix}/0b28f.svg`;
const imgIndicator4 = `${assetPathPrefix}/d2ad5.svg`;
const imgInfo = `${assetPathPrefix}/8acf7.svg`;
const imgCheck1 = `${assetPathPrefix}/9041a.svg`;
const imgChevronDown3 = `${assetPathPrefix}/f2582.svg`;
const imgGripVertical = `${assetPathPrefix}/eb339.svg`;
const imgPencil1 = `${assetPathPrefix}/020f8.svg`;
const imgTrash3 = `${assetPathPrefix}/5321f.svg`;
const imgUpload = `${assetPathPrefix}/7d9ec.svg`;
const imgToggle = `${assetPathPrefix}/2c690.svg`;
const imgToggle1 = `${assetPathPrefix}/1b6dc.svg`;
const imgBell = `${assetPathPrefix}/740a6.svg`;
const imgCheckCircle = `${assetPathPrefix}/75891.svg`;
const imgInfo1 = `${assetPathPrefix}/9e8fd.svg`;
const imgStatus = `${assetPathPrefix}/335c6.svg`;
const imgIndicator = `${assetPathPrefix}/8c8de.svg`;
const imgIndicator1 = `${assetPathPrefix}/4dfba.svg`;
const imgIndicator2 = `${assetPathPrefix}/28b0b.svg`;
const imgIndicator3 = `${assetPathPrefix}/0d1cf.svg`;
const imgStatusMarker = `${assetPathPrefix}/a8892.svg`;
const imgStatusMarker1 = `${assetPathPrefix}/0c1ad.svg`;

// Food images
const imgThumbnail = `${assetPathPrefix}/d6fbd.png`;
const imgThumbnail1 = `${assetPathPrefix}/b1610.png`;
const imgThumbnail2 = `${assetPathPrefix}/b0de1.png`;
const imgDishImage = `${assetPathPrefix}/2cdcb.png`;

type Screen = "overview" | "tables" | "orders" | "menu" | "menu-edit" | "billing" | "settings";

const NAV_ITEMS: { id: Screen; label: string; icon: string; count?: number }[] = [
  { id: "overview", label: "Overview", icon: imgLayoutDashboard },
  { id: "tables", label: "Tables", icon: imgGrid3X3 },
  { id: "orders", label: "Orders", icon: imgReceiptText, count: 8 },
  { id: "menu", label: "Menu", icon: imgUtensils },
  { id: "billing", label: "Billing", icon: imgCreditCard },
  { id: "settings", label: "Settings", icon: imgSettings },
];

const NAV_ICONS_ACTIVE: Record<Screen, string> = {
  overview: imgLayoutDashboard,
  tables: imgGrid3X4,
  orders: imgReceiptText3,
  menu: imgUtensils1,
  billing: imgCreditCard1,
  settings: imgSettings1,
  "menu-edit": imgUtensils1,
};

function Sidebar({ screen, onNav }: { screen: Screen; onNav: (s: Screen) => void }) {
  const effectiveScreen = screen === "menu-edit" ? "menu" : screen;
  return (
    <div className="bg-[#1e2220] flex flex-col gap-[22px] h-full items-start pb-[18px] pt-[24px] px-[16px] shrink-0 w-[220px]">
      <div className="flex gap-[11px] items-center">
        <div className="bg-[#b44b2a] flex items-center justify-center rounded-[12px] size-[38px]">
          <p className="font-['DM_Sans:Regular'] font-normal text-[18px] text-white" style={{ fontVariationSettings: '"opsz" 14' }}>T</p>
        </div>
        <div className="flex flex-col gap-[2px] items-start">
          <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[18px] text-white" style={{ fontVariationSettings: '"opsz" 14' }}>TableTab</p>
          <p className="font-['Inter:Bold'] font-bold text-[9px] text-[rgba(255,255,255,0.45)] uppercase">Restaurant OS</p>
        </div>
      </div>
      <div className="bg-[#2a2f2d] border border-[rgba(255,255,255,0.08)] border-solid flex flex-col gap-[5px] items-start p-[12px] rounded-[12px] w-full">
        <p className="font-['Inter:Regular'] font-normal text-[12px] text-white">Saffron &amp; Ember</p>
        <div className="flex gap-[6px] items-center">
          <div className="relative size-[6px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLiveDot1} /></div>
          <p className="font-['Inter:Regular'] font-normal text-[10px] text-[rgba(255,255,255,0.56)]">Dinner service · Live</p>
        </div>
      </div>
      <div className="flex flex-col gap-[5px] items-start w-full">
        {NAV_ITEMS.map(item => {
          const active = effectiveScreen === item.id;
          return (
            <button key={item.id} onClick={() => onNav(item.id)} className={`flex gap-[10px] h-[42px] items-center px-[12px] rounded-[10px] w-full text-left transition-colors ${active ? "bg-[#b44b2a]" : "bg-[#252824] hover:bg-[#30342f]"}`}>
              <div className="relative size-[18px] shrink-0">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={active ? NAV_ICONS_ACTIVE[item.id] : item.icon} />
              </div>
              <p className={`font-['Inter:Regular'] font-normal text-[13px] flex-1 min-w-0 ${active ? "text-white" : "text-[rgba(255,255,255,0.72)] font-['Inter:Semi_Bold'] font-semibold"}`}>{item.label}</p>
              {item.count && (
                <div className={`flex h-[20px] items-center justify-center rounded-full w-[22px] ${active ? "bg-white" : "bg-[#30342f]"}`}>
                  <p className={`font-['Inter:Extra_Bold'] font-extrabold text-[10px] ${active ? "text-[#b44b2a]" : "text-white"}`}>{item.count}</p>
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex-1 min-h-0" />
      <div className="bg-[#2a2f2d] border border-[rgba(255,255,255,0.08)] border-solid flex flex-col gap-[8px] items-start p-[12px] rounded-[12px] w-full">
        <div className="flex gap-[6px] items-center">
          <div className="relative size-[8px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLiveDot} /></div>
          <p className="font-['Inter:Regular'] font-normal text-[12px] text-white">Systems healthy</p>
        </div>
        <p className="font-['Inter:Regular'] font-normal text-[10px] text-[rgba(255,255,255,0.45)]">Last sync · just now</p>
      </div>
      <div className="bg-[#2a2f2d] flex gap-[9px] items-center p-[10px] rounded-[12px] w-full">
        <div className="bg-[#f6e6df] flex items-center justify-center rounded-full size-[34px] shrink-0">
          <p className="font-['Inter:Extra_Bold'] font-extrabold text-[#87361f] text-[11px]">AR</p>
        </div>
        <div className="flex flex-1 flex-col gap-[2px] items-start min-w-0">
          <p className="font-['Inter:Regular'] font-normal text-[11px] text-white">Amelia Rhodes</p>
          <p className="font-['Inter:Regular'] font-normal text-[9px] text-[rgba(255,255,255,0.45)]">Owner · Saffron &amp; Ember</p>
        </div>
        <div className="relative shrink-0 size-[14px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgChevronsUpDown} /></div>
      </div>
    </div>
  );
}

function PageHeader({ title, subtitle, children }: { title: string; subtitle: string; children?: React.ReactNode }) {
  return (
    <div className="bg-white border-b border-[#ded9d0] border-solid flex h-[70px] items-center justify-between px-[26px] shrink-0 w-full">
      <div className="flex flex-col gap-[4px] items-start">
        <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[23px]" style={{ fontVariationSettings: '"opsz" 14' }}>{title}</p>
        <p className="font-['Inter:Regular'] font-normal text-[#575b54] text-[11px]">{subtitle}</p>
      </div>
      <div className="flex gap-[10px] items-center">{children}</div>
    </div>
  );
}

function LiveBadge({ label }: { label?: string }) {
  return (
    <div className="flex gap-[6px] items-center">
      <div className="relative size-[8px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLiveDot} /></div>
      <p className="font-['Inter:Regular'] font-normal text-[#32705a] text-[12px] whitespace-nowrap">{label ?? "Live · Synced just now"}</p>
    </div>
  );
}

function Btn({ label, icon, variant = "ghost", onClick }: { label: string; icon?: string; variant?: "ghost" | "primary"; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex gap-[8px] h-[40px] items-center justify-center px-[16px] rounded-[10px] transition-opacity hover:opacity-90 ${variant === "primary" ? "bg-[#b44b2a] text-white border border-[#b44b2a] border-solid" : "bg-[#fbf8f3] text-[#20231f] border border-[#ded9d0] border-solid"}`}>
      {icon && <div className="relative size-[17px] shrink-0"><img alt="" className="absolute block inset-0 max-w-none size-full" src={icon} /></div>}
      <p className="font-['Inter:Regular'] font-normal text-[14px] whitespace-nowrap">{label}</p>
    </button>
  );
}

/* ── OVERVIEW ───────────────────────────────────────────────────── */
const SALES_BARS = [36, 52, 43, 68, 58, 82, 74, 98, 88, 116, 103, 132];
const SALES_LABELS = ["11a", "12p", "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p", "10p"];
const MAX_BAR = 132;

function OverviewScreen() {
  return (
    <div className="flex flex-1 flex-col h-full overflow-y-auto">
      <PageHeader title="Good evening, Amelia" subtitle="Friday, Sep 28 · Dinner service opened at 5:00 PM">
        <LiveBadge />
        <Btn label="Export report" icon={imgDownload} />
      </PageHeader>
      <div className="flex flex-1 flex-col gap-[16px] items-start p-[22px] w-full">
        {/* Key metrics */}
        <div className="flex gap-[12px] items-start w-full">
          {[
            { label: "Net sales", value: "$4,286", sub: "↑ 12.4% vs last Fri", icon: imgDollarSign, bg: "bg-[#f6e6df]" },
            { label: "Orders", value: "64", sub: "↑ 8 orders today", icon: imgReceiptText1, bg: "bg-[#e1eef1]" },
            { label: "Average ticket", value: "$66.97", sub: "↑ $4.12 this week", icon: imgTrendingUp, bg: "bg-[#e2f0ea]" },
            { label: "Table utilization", value: "81%", sub: "18 of 22 occupied", icon: imgUsers, bg: "bg-[#f9eacf]" },
          ].map(m => (
            <div key={m.label} className="bg-white border border-[#ded9d0] border-solid flex flex-1 flex-col gap-[13px] items-start p-[18px] rounded-[14px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between w-full">
                <p className="font-['Inter:Regular'] font-normal text-[#575b54] text-[14px]">{m.label}</p>
                <div className={`${m.bg} flex items-center justify-center rounded-[8px] size-[34px]`}>
                  <div className="relative size-[17px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={m.icon} /></div>
                </div>
              </div>
              <p className="font-['DM_Sans:Regular'] font-normal text-[#20231f] text-[30px]" style={{ fontVariationSettings: '"opsz" 14' }}>{m.value}</p>
              <p className="font-['Inter:Regular'] font-normal text-[#32705a] text-[12px]">{m.sub}</p>
            </div>
          ))}
        </div>
        {/* Charts row */}
        <div className="flex gap-[14px] items-start w-full">
          <div className="bg-white border border-[#ded9d0] border-solid flex flex-1 flex-col gap-[14px] h-[280px] items-start p-[18px] rounded-[14px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.04)]">
            <div className="flex items-start justify-between w-full">
              <div className="flex flex-col gap-[3px] items-start">
                <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[17px]" style={{ fontVariationSettings: '"opsz" 14' }}>Sales trend</p>
                <p className="font-['Inter:Regular'] font-normal text-[#575b54] text-[10px]">Hourly gross sales · today</p>
              </div>
              <div className="bg-[#e2f0ea] flex gap-[6px] items-center px-[10px] py-[6px] rounded-full">
                <div className="relative size-[6px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIndicator3} /></div>
                <p className="font-['Inter:Bold'] font-bold text-[#32705a] text-[12px]">+12.4% vs last Fri</p>
              </div>
            </div>
            <div className="border-b border-[#ded9d0] border-solid flex flex-1 items-end w-full gap-[4px]">
              {SALES_BARS.map((h, i) => (
                <div key={i} className="flex flex-1 flex-col gap-[5px] items-center justify-end h-full">
                  <div className={`${h >= 98 ? "bg-[#b44b2a]" : "bg-[#f6e6df]"} max-w-[30px] rounded-t-[5px] w-full`} style={{ height: Math.round((h / MAX_BAR) * 150) }} />
                  <p className="font-['Inter:Regular'] font-normal text-[#8a8d86] text-[8px]">{SALES_LABELS[i]}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-[#ded9d0] border-solid flex flex-col gap-[15px] h-[280px] items-start p-[18px] rounded-[14px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.04)] shrink-0 w-[330px]">
            <div className="flex items-start justify-between w-full">
              <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[17px]" style={{ fontVariationSettings: '"opsz" 14' }}>Live orders</p>
              <div className="flex gap-[6px] items-center">
                <div className="relative size-[8px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLiveDot} /></div>
                <p className="font-['Inter:Regular'] font-normal text-[#32705a] text-[12px]">8 active</p>
              </div>
            </div>
            {[
              { label: "New", count: 3, fill: "bg-[#356a7a]", w: 105, marker: imgMarker },
              { label: "Preparing", count: 3, fill: "bg-[#b06a16]", w: 105, marker: imgMarker1 },
              { label: "Ready", count: 2, fill: "bg-[#32705a]", w: 68, marker: imgLiveDot },
            ].map(row => (
              <div key={row.label} className="flex flex-col gap-[7px] items-start w-full">
                <div className="flex items-start justify-between w-full">
                  <div className="flex gap-[8px] items-center">
                    <div className="relative size-[8px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={row.marker} /></div>
                    <p className="font-['Inter:Bold'] font-bold text-[#20231f] text-[12px]">{row.label}</p>
                  </div>
                  <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[16px]" style={{ fontVariationSettings: '"opsz" 14' }}>{row.count}</p>
                </div>
                <div className="bg-[#f0ece5] flex h-[7px] items-start rounded-full w-full">
                  <div className={`${row.fill} h-[7px] rounded-full`} style={{ width: `${Math.round((row.w / 294) * 100)}%` }} />
                </div>
              </div>
            ))}
            <div className="bg-[#f9eacf] flex items-start justify-between p-[11px] rounded-[8px] w-full">
              <p className="font-['Inter:Bold'] font-bold text-[#b06a16] text-[11px]">Avg. kitchen time</p>
              <p className="font-['Inter:Extra_Bold'] font-extrabold text-[#b06a16] text-[12px]">12m 42s</p>
            </div>
          </div>
        </div>
        {/* Lower row */}
        <div className="flex gap-[14px] items-start w-full">
          <div className="bg-white border border-[#ded9d0] border-solid flex flex-1 flex-col gap-[11px] items-start p-[18px] rounded-[14px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.04)]">
            <div className="flex items-start justify-between w-full">
              <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[17px]" style={{ fontVariationSettings: '"opsz" 14' }}>Recent activity</p>
              <p className="font-['Inter:Bold'] font-bold text-[#b44b2a] text-[11px] cursor-pointer">View all</p>
            </div>
            {[
              { dot: imgMarker2, title: "Order TT-1051 placed", sub: "Table 07 · $84.60", time: "Just now" },
              { dot: imgMarker1, title: "Bill requested", sub: "Table 12 · $77.18", time: "2 min" },
              { dot: imgLiveDot, title: "Order TT-1045 served", sub: "Table 15 · 24m 08s", time: "4 min" },
              { dot: imgMarker, title: "Table 06 settled", sub: "Visa · $126.44", time: "7 min" },
            ].map((a, i) => (
              <div key={i} className="flex gap-[10px] items-center w-full">
                <div className="relative size-[8px] shrink-0"><img alt="" className="absolute block inset-0 max-w-none size-full" src={a.dot} /></div>
                <div className="flex flex-1 flex-col gap-[2px] items-start min-w-0">
                  <p className="font-['Inter:Bold'] font-bold text-[#20231f] text-[12px]">{a.title}</p>
                  <p className="font-['Inter:Regular'] font-normal text-[#575b54] text-[10px]">{a.sub}</p>
                </div>
                <p className="font-['Inter:Regular'] font-normal text-[#8a8d86] text-[10px] shrink-0">{a.time}</p>
              </div>
            ))}
          </div>
          <div className="bg-[#1e2220] flex flex-col gap-[13px] items-start p-[18px] rounded-[14px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.04)] shrink-0 w-[330px]">
            <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[17px] text-white" style={{ fontVariationSettings: '"opsz" 14' }}>Service snapshot</p>
            {[["Occupied tables", "18 / 22"], ["Guests seated", "46"], ["Open bills", "14"], ["Requested bills", "3"]].map(([k, v]) => (
              <div key={k} className="flex items-start justify-between w-full">
                <p className="font-['Inter:Regular'] font-normal text-[11px] text-[rgba(255,255,255,0.56)]">{k}</p>
                <p className="font-['Inter:Extra_Bold'] font-extrabold text-[12px] text-white">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── TABLES ─────────────────────────────────────────────────────── */
type TableStatus = "occupied" | "available" | "reserved";
interface TableData { id: string; status: TableStatus; guests?: number; elapsed?: string; total?: string; server?: string; }
const TABLES: TableData[] = [
  { id: "T01", status: "available" }, { id: "T02", status: "occupied", guests: 2, elapsed: "42m", total: "$78.20", server: "Emma" },
  { id: "T03", status: "occupied", guests: 4, elapsed: "1h 12m", total: "$184.60", server: "Luis" },
  { id: "T04", status: "occupied", guests: 3, elapsed: "28m", total: "$92.40", server: "Emma" },
  { id: "T05", status: "occupied", guests: 2, elapsed: "54m", total: "$126.44", server: "Maya" },
  { id: "T06", status: "available" }, { id: "T07", status: "occupied", guests: 5, elapsed: "18m", total: "$84.60", server: "Luis" },
  { id: "T08", status: "reserved" }, { id: "T09", status: "occupied", guests: 3, elapsed: "1h 02m", total: "$148.00", server: "Emma" },
  { id: "T10", status: "occupied", guests: 2, elapsed: "36m", total: "$62.30", server: "Maya" },
  { id: "T11", status: "occupied", guests: 4, elapsed: "48m", total: "$178.90", server: "Luis" },
  { id: "T12", status: "occupied", guests: 3, elapsed: "22m", total: "$77.18", server: "Emma" },
  { id: "T13", status: "occupied", guests: 2, elapsed: "1h 18m", total: "$210.50", server: "Maya" },
  { id: "T14", status: "reserved" }, { id: "T15", status: "occupied", guests: 4, elapsed: "8m", total: "$32.80", server: "Luis" },
  { id: "T16", status: "occupied", guests: 2, elapsed: "1h 34m", total: "$264.20", server: "Emma" },
];

function TablesScreen({ onTableSelect, propertyId }: { onTableSelect: (t: TableData) => void; propertyId?: string }) {
  const [filter, setFilter] = useState<"all" | TableStatus>("all");
  const [selected, setSelected] = useState<TableData | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [qrTable, setQrTable] = useState("12");
  const [qrImage, setQrImage] = useState("");
  const [qrBaseUrl, setQrBaseUrl] = useState(`${window.location.origin}${window.location.pathname}`);
  const [serverTables, setServerTables] = useState<any[]>([]);
  useEffect(() => { if (propertyId) getTables(propertyId).then(setServerTables).catch(() => {}); }, [propertyId]);

  const filters = [["all", `All ${TABLES.length}`], ["occupied", `Occupied ${TABLES.filter(t => t.status === "occupied").length}`], ["available", `Available ${TABLES.filter(t => t.status === "available").length}`], ["reserved", `Reserved ${TABLES.filter(t => t.status === "reserved").length}`]] as const;

  function select(t: TableData) { setSelected(t); onTableSelect(t); }

  const visible = filter === "all" ? TABLES : TABLES.filter(t => t.status === filter);
  const qrToken = serverTables.find(t => String(Number(t.table_number)) === qrTable)?.qr_token;
  const qrLink = qrToken ? `${qrBaseUrl.replace(/\/+$/, "")}/?hotel=saffron&token=${qrToken}` : "";

  useEffect(() => {
    if (!showQr || !qrLink) return;
    QRCode.toDataURL(qrLink, {
      width: 560,
      margin: 2,
      color: { dark: "#20231f", light: "#ffffff" },
      errorCorrectionLevel: "H",
    }).then(setQrImage);
  }, [qrLink, showQr]);

  return (
    <div className="flex flex-1 flex-col h-full overflow-y-auto">
      <PageHeader title="Active tables" subtitle="18 occupied · 2 reserved · 2 available">
        <LiveBadge />
        <Btn label="Table QR codes" onClick={() => setShowQr(true)} />
        <Btn label="New walk-in" icon={imgPlus} variant="primary" />
      </PageHeader>
      <div className="flex flex-1 flex-col gap-[16px] items-start p-[22px] overflow-y-auto">
        <div className="flex items-start justify-between w-full">
          <div className="flex gap-[8px] items-start">
            {filters.map(([id, label]) => (
              <button key={id} onClick={() => setFilter(id)} className={`flex items-start px-[12px] py-[8px] rounded-full transition-colors ${filter === id ? "bg-[#252824] border border-[#252824] border-solid" : "bg-white border border-[#ded9d0] border-solid"}`}>
                <p className={`font-['Inter:Bold'] font-bold text-[11px] ${filter === id ? "text-white" : "text-[#575b54]"}`}>{label}</p>
              </button>
            ))}
          </div>
          <div className="flex gap-[7px] items-center">
            <div className="relative size-[16px] shrink-0"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLayers} /></div>
            <p className="font-['Inter:Bold'] font-bold text-[#20231f] text-[11px]">Main dining room</p>
            <div className="relative size-[14px] shrink-0"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgChevronDown1} /></div>
          </div>
        </div>
        <div className="flex flex-1 gap-[16px] items-start w-full">
          <div className="bg-[#eee9e1] flex flex-1 flex-col gap-[12px] items-start p-[18px] rounded-[14px] min-h-[400px]">
            <div className="flex items-start justify-between w-full">
              <p className="font-['Inter:Extra_Bold'] font-extrabold text-[#8a8d86] text-[10px] uppercase">Main dining · 16 tables</p>
              <div className="flex gap-[6px] items-center">
                <div className="relative size-[8px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLiveDot} /></div>
                <p className="font-['Inter:Regular'] font-normal text-[#32705a] text-[12px]">Floor live</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-[12px] items-start w-full">
              {visible.map(table => {
                const isOcc = table.status === "occupied";
                const isRes = table.status === "reserved";
                const isActive = selected?.id === table.id;
                return (
                  <div key={table.id} onClick={() => isOcc && select(table)} className={`flex flex-col h-[108px] items-start justify-between p-[13px] rounded-[12px] w-[154px] transition-colors ${isOcc ? "bg-white border cursor-pointer hover:border-[#b44b2a]" : isRes ? "bg-[#f9eacf] border border-[#e8b547]" : "bg-[#f0ece5] border border-[#ded9d0]"} ${isActive ? "border-2 border-[#b44b2a]" : "border-solid border-[#ded9d0]"}`}>
                    <div className="flex items-start justify-between w-full">
                      <p className="font-['DM_Sans:Regular'] font-normal text-[#20231f] text-[20px]" style={{ fontVariationSettings: '"opsz" 14' }}>{table.id}</p>
                      <div className="relative size-[8px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={isOcc ? imgStatusDot1 : imgStatusDot} /></div>
                    </div>
                    <p className="font-['Inter:Regular'] font-normal text-[#575b54] text-[11px]">{isOcc ? `${table.guests} guests` : isRes ? "Reserved" : "Available"}</p>
                    <div className="flex items-start justify-between w-full">
                      <p className="font-['Inter:Regular'] font-normal text-[#8a8d86] text-[10px]">{isOcc ? table.elapsed : "—"}</p>
                      <p className="font-['Inter:Bold'] font-bold text-[#20231f] text-[10px]">{isOcc ? table.total : ""}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {selected && (
            <div className="bg-white border border-[#ded9d0] border-solid flex flex-col gap-[14px] items-start p-[20px] rounded-[14px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.04)] shrink-0 w-[280px]">
              <div className="flex items-start justify-between w-full">
                <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[22px]" style={{ fontVariationSettings: '"opsz" 14' }}>{selected.id}</p>
                <div className="bg-[#f9eacf] flex gap-[6px] items-center px-[10px] py-[6px] rounded-full">
                  <div className="relative size-[6px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIndicator2} /></div>
                  <p className="font-['Inter:Bold'] font-bold text-[#b06a16] text-[11px]">Occupied</p>
                </div>
              </div>
              <div className="h-px bg-[#ded9d0] w-full" />
              <div className="flex flex-col gap-[10px] items-start w-full">
                {[["Guests", `${selected.guests}`], ["Elapsed", selected.elapsed!], ["Current total", selected.total!], ["Server", selected.server!]].map(([k, v]) => (
                  <div key={k} className="flex items-start justify-between w-full">
                    <p className="font-['Inter:Regular'] font-normal text-[#575b54] text-[12px]">{k}</p>
                    <p className="font-['Inter:Bold'] font-bold text-[#20231f] text-[12px]">{v}</p>
                  </div>
                ))}
              </div>
              <div className="h-px bg-[#ded9d0] w-full" />
              <button className="bg-[#b44b2a] border border-[#b44b2a] border-solid flex gap-[8px] h-[40px] items-center justify-center px-[16px] rounded-[10px] w-full">
                <div className="relative size-[16px] shrink-0"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgArrowRight} /></div>
                <p className="font-['Inter:Regular'] font-normal text-[14px] text-white">View orders</p>
              </button>
            </div>
          )}
        </div>
      </div>
      {showQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,22,19,0.66)] p-5 backdrop-blur-sm" onClick={() => setShowQr(false)}>
          <div className="flex w-full max-w-[720px] flex-col gap-5 rounded-[20px] border border-[#ded9d0] bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-['DM_Sans:ExtraBold'] text-[23px] font-extrabold text-[#20231f]">Table QR code</p>
                <p className="font-['Inter:Regular'] text-[12px] text-[#575b54]">Print and place this code on the selected table.</p>
              </div>
              <button onClick={() => setShowQr(false)} className="flex size-[38px] items-center justify-center rounded-full border border-[#ded9d0] text-[#575b54] hover:bg-[#fbf8f3]" aria-label="Close QR code">✕</button>
            </div>
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
              <div className="flex min-h-[260px] w-[260px] shrink-0 items-center justify-center rounded-[16px] border border-[#ded9d0] bg-white p-3">
                {qrImage && <img src={qrImage} alt={`QR code for table ${qrTable}`} className="size-full" />}
              </div>
              <div className="flex w-full flex-col gap-4">
                <label className="flex flex-col gap-2">
                  <span className="font-['Inter:Bold'] text-[12px] font-bold text-[#20231f]">Website address</span>
                  <input value={qrBaseUrl} onChange={e => setQrBaseUrl(e.target.value)} placeholder="http://192.168.1.20:8443" className="h-[44px] rounded-[10px] border border-[#ded9d0] bg-[#fbf8f3] px-3 font-['Inter:Regular'] text-[13px] text-[#20231f] outline-none focus:border-[#b44b2a]" />
                  {(qrBaseUrl.includes("localhost") || qrBaseUrl.includes("127.0.0.1")) && (
                    <span className="font-['Inter:Regular'] text-[11px] leading-[1.4] text-[#b06a16]">Replace localhost with your computer’s Wi-Fi IP address before downloading.</span>
                  )}
                </label>
                <label className="flex flex-col gap-2">
                  <span className="font-['Inter:Bold'] text-[12px] font-bold text-[#20231f]">Select table</span>
                  <select value={qrTable} onChange={e => setQrTable(e.target.value)} className="h-[44px] rounded-[10px] border border-[#ded9d0] bg-[#fbf8f3] px-3 font-['Inter:Regular'] text-[13px] text-[#20231f] outline-none focus:border-[#b44b2a]">
                    {TABLES.map(table => <option key={table.id} value={String(Number(table.id.slice(1)))}>{table.id}</option>)}
                  </select>
                </label>
                <div className="rounded-[12px] bg-[#f0ece5] p-3">
                  <p className="mb-1 font-['Inter:Bold'] text-[11px] font-bold text-[#575b54]">QR destination</p>
                  <p className="break-all font-['Inter:Regular'] text-[11px] leading-[1.5] text-[#20231f]">{qrLink}</p>
                </div>
                <p className="font-['Inter:Regular'] text-[11px] leading-[1.5] text-[#575b54]">When scanned, this opens the mobile menu for Table {qrTable.padStart(2, "0")} and identifies the customer’s hotel and table automatically.</p>
                <a href={qrImage} download={`saffron-ember-table-${qrTable.padStart(2, "0")}-qr.png`} className="flex h-[42px] items-center justify-center rounded-[10px] bg-[#b44b2a] px-4 font-['Inter:Regular'] text-[14px] text-white hover:opacity-90">Download QR code</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── ORDERS ─────────────────────────────────────────────────────── */
type OrderStatus = "new" | "preparing" | "ready" | "served";
interface Order { id: string; table: string; status: OrderStatus; items: string; guests: number; time: string; total: string; }
const ORDERS: Order[] = [
  { id: "TT-1051", table: "Table 07", status: "new", items: "Lamb kofta, Fattoush, Pita", guests: 5, time: "7:27 PM", total: "$84.60" },
  { id: "TT-1050", table: "Table 03", status: "new", items: "Sea bass, Charred carrots, Sparkling water", guests: 2, time: "7:24 PM", total: "$62.40" },
  { id: "TT-1049", table: "Bar 04", status: "new", items: "Ember spritz ×2, Marinated olives", guests: 2, time: "7:23 PM", total: "$34.80" },
  { id: "TT-1048", table: "Table 12", status: "preparing", items: "Wild mushroom rigatoni ×2", guests: 3, time: "7:18 PM", total: "$77.18" },
  { id: "TT-1046", table: "Table 09", status: "preparing", items: "Ember chicken, Crispy potatoes ×2, Broccolini", guests: 3, time: "7:12 PM", total: "$96.40" },
  { id: "TT-1047", table: "Table 18", status: "preparing", items: "Charred octopus ×2, Hummus, Fattoush", guests: 4, time: "7:15 PM", total: "$118.20" },
  { id: "TT-1045", table: "Table 15", status: "ready", items: "Lamb kofta, Sea bass, Pita ×2", guests: 4, time: "7:05 PM", total: "$112.00" },
  { id: "TT-1044", table: "Table 02", status: "ready", items: "Fattoush ×2, Charred carrots", guests: 2, time: "7:03 PM", total: "$54.80" },
];

const STATUS_BADGE: Record<OrderStatus, { bg: string; text: string; label: string; dot: string }> = {
  new: { bg: "bg-[#e1eef1]", text: "text-[#356a7a]", label: "New", dot: imgIndicator1 },
  preparing: { bg: "bg-[#f9eacf]", text: "text-[#b06a16]", label: "Preparing", dot: imgIndicator2 },
  ready: { bg: "bg-[#e2f0ea]", text: "text-[#32705a]", label: "Ready", dot: imgIndicator3 },
  served: { bg: "bg-[#f0ece5]", text: "text-[#575b54]", label: "Served", dot: imgStatusDot },
};

function OrdersScreen() {
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const visible = filter === "all" ? ORDERS : ORDERS.filter(o => o.status === filter);

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden">
      <PageHeader title="Orders" subtitle="8 active orders · dinner service">
        <LiveBadge />
        <Btn label="View closed orders" />
      </PageHeader>
      <div className="flex flex-1 gap-0 items-start min-h-0">
        {/* Orders list */}
        <div className="flex flex-1 flex-col gap-[14px] items-start overflow-y-auto p-[22px] h-full">
          {/* Filters */}
          <div className="flex gap-[8px] items-start shrink-0">
            {(["all", "new", "preparing", "ready", "served"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`flex items-start px-[12px] py-[8px] rounded-full transition-colors ${filter === f ? "bg-[#252824] border border-[#252824] border-solid" : "bg-white border border-[#ded9d0] border-solid"}`}>
                <p className={`font-['Inter:Bold'] font-bold text-[11px] capitalize ${filter === f ? "text-white" : "text-[#575b54]"}`}>{f === "all" ? `All ${ORDERS.length}` : f.charAt(0).toUpperCase() + f.slice(1)}</p>
              </button>
            ))}
          </div>
          {/* Table header */}
          <div className="bg-[#f0ece5] border border-[#ded9d0] border-solid flex gap-[12px] items-center px-[16px] py-[10px] rounded-[10px] w-full shrink-0">
            {["Order", "Table", "Status", "Items", "Time", "Total"].map((h, i) => (
              <p key={h} className={`font-['Inter:Extra_Bold'] font-extrabold text-[#8a8d86] text-[10px] uppercase ${i === 0 ? "w-[80px]" : i === 1 ? "w-[80px]" : i === 2 ? "w-[100px]" : i === 3 ? "flex-1" : i === 4 ? "w-[70px]" : "w-[70px] text-right"}`}>{h}</p>
            ))}
          </div>
          {visible.map(order => {
            const badge = STATUS_BADGE[order.status];
            const isSelected = selectedOrder?.id === order.id;
            return (
              <button key={order.id} onClick={() => setSelectedOrder(isSelected ? null : order)} className={`bg-white border flex gap-[12px] items-center px-[16px] py-[14px] rounded-[10px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.04)] w-full text-left transition-all ${isSelected ? "border-2 border-[#b44b2a]" : "border-[#ded9d0] border-solid hover:border-[#b44b2a]"}`}>
                <p className="font-['DM_Sans:Regular'] font-normal text-[#20231f] text-[15px] w-[80px] shrink-0" style={{ fontVariationSettings: '"opsz" 14' }}>{order.id}</p>
                <p className="font-['Inter:Bold'] font-bold text-[#575b54] text-[12px] w-[80px] shrink-0">{order.table}</p>
                <div className={`${badge.bg} flex gap-[6px] items-center px-[8px] py-[4px] rounded-full shrink-0 w-[100px]`}>
                  <div className="relative size-[6px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={badge.dot} /></div>
                  <p className={`font-['Inter:Bold'] font-bold text-[11px] ${badge.text}`}>{badge.label}</p>
                </div>
                <p className="font-['Inter:Regular'] font-normal text-[#20231f] text-[12px] flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{order.items}</p>
                <p className="font-['Inter:Regular'] font-normal text-[#575b54] text-[12px] w-[70px] shrink-0">{order.time}</p>
                <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[14px] w-[70px] shrink-0 text-right" style={{ fontVariationSettings: '"opsz" 14' }}>{order.total}</p>
              </button>
            );
          })}
        </div>
        {/* Order detail panel */}
        {selectedOrder && (
          <div className="bg-white border-l border-[#ded9d0] border-solid flex flex-col gap-[16px] items-start overflow-y-auto p-[22px] shrink-0 w-[300px] h-full">
            <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[20px]" style={{ fontVariationSettings: '"opsz" 14' }}>{selectedOrder.id}</p>
            <div className="h-px bg-[#ded9d0] w-full" />
            {[["Table", selectedOrder.table], ["Guests", `${selectedOrder.guests}`], ["Time", selectedOrder.time], ["Total", selectedOrder.total]].map(([k, v]) => (
              <div key={k} className="flex items-start justify-between w-full">
                <p className="font-['Inter:Regular'] font-normal text-[#575b54] text-[12px]">{k}</p>
                <p className="font-['Inter:Bold'] font-bold text-[#20231f] text-[12px]">{v}</p>
              </div>
            ))}
            <div className="h-px bg-[#ded9d0] w-full" />
            <p className="font-['Inter:Extra_Bold'] font-extrabold text-[#8a8d86] text-[10px] uppercase">Items</p>
            {selectedOrder.items.split(", ").map((it, i) => (
              <p key={i} className="font-['Inter:Regular'] font-normal text-[#20231f] text-[13px] w-full">{it}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── MENU ───────────────────────────────────────────────────────── */
interface MenuItem { id: string; name: string; category: string; price: string; status: "available" | "86d" | "seasonal"; img: string; }
const MENU_ITEMS: MenuItem[] = [
  { id: "1", name: "Wild mushroom rigatoni", category: "Mains", price: "$28.00", status: "available", img: imgThumbnail },
  { id: "2", name: "Sea bass en papillote", category: "Mains", price: "$34.00", status: "available", img: imgThumbnail1 },
  { id: "3", name: "Ember-roasted chicken", category: "Mains", price: "$31.00", status: "available", img: imgThumbnail2 },
  { id: "4", name: "Lamb kofta", category: "Small plates", price: "$18.00", status: "available", img: imgThumbnail },
  { id: "5", name: "Charred octopus", category: "Small plates", price: "$22.00", status: "seasonal", img: imgThumbnail1 },
  { id: "6", name: "Fattoush salad", category: "Small plates", price: "$14.00", status: "available", img: imgThumbnail2 },
  { id: "7", name: "Ember spritz", category: "Drinks", price: "$14.00", status: "available", img: imgThumbnail },
  { id: "8", name: "Marinated olives", category: "Small plates", price: "$9.00", status: "86d", img: imgThumbnail1 },
];
const MENU_STATUS_BADGE = {
  available: { bg: "bg-[#e2f0ea]", text: "text-[#32705a]", label: "Available" },
  seasonal: { bg: "bg-[#f9eacf]", text: "text-[#b06a16]", label: "Seasonal" },
  "86d": { bg: "bg-[#f8e1e1]", text: "text-[#b23a3a]", label: "86'd" },
};

function MenuScreen({ onEdit }: { onEdit: (item: MenuItem) => void }) {
  const [catFilter, setCatFilter] = useState("All");
  const cats = ["All", "Small plates", "Mains", "Drinks"];
  const visible = catFilter === "All" ? MENU_ITEMS : MENU_ITEMS.filter(m => m.category === catFilter);

  return (
    <div className="flex flex-1 flex-col h-full overflow-y-auto">
      <PageHeader title="Menu management" subtitle={`${MENU_ITEMS.length} items · last updated 2 hrs ago`}>
        <Btn label="Manage categories" />
        <Btn label="Add item" icon={imgPlus1} variant="primary" />
      </PageHeader>
      <div className="flex flex-1 flex-col gap-[16px] items-start overflow-y-auto p-[22px]">
        {/* Filters */}
        <div className="flex gap-[8px] items-start shrink-0">
          {cats.map(c => (
            <button key={c} onClick={() => setCatFilter(c)} className={`flex items-start px-[12px] py-[8px] rounded-full transition-colors ${catFilter === c ? "bg-[#252824] border border-[#252824] border-solid" : "bg-white border border-[#ded9d0] border-solid"}`}>
              <p className={`font-['Inter:Bold'] font-bold text-[11px] ${catFilter === c ? "text-white" : "text-[#575b54]"}`}>{c}</p>
            </button>
          ))}
        </div>
        {/* Table header */}
        <div className="bg-[#f0ece5] border border-[#ded9d0] border-solid flex gap-[12px] items-center px-[16px] py-[10px] rounded-[10px] w-full shrink-0">
          <div className="w-[48px] shrink-0" />
          <p className="font-['Inter:Extra_Bold'] font-extrabold text-[#8a8d86] text-[10px] uppercase flex-1">Item</p>
          <p className="font-['Inter:Extra_Bold'] font-extrabold text-[#8a8d86] text-[10px] uppercase w-[120px] shrink-0">Category</p>
          <p className="font-['Inter:Extra_Bold'] font-extrabold text-[#8a8d86] text-[10px] uppercase w-[80px] shrink-0">Status</p>
          <p className="font-['Inter:Extra_Bold'] font-extrabold text-[#8a8d86] text-[10px] uppercase w-[70px] shrink-0 text-right">Price</p>
          <div className="w-[80px] shrink-0" />
        </div>
        {visible.map(item => {
          const badge = MENU_STATUS_BADGE[item.status];
          return (
            <div key={item.id} className="bg-white border border-[#ded9d0] border-solid flex gap-[12px] items-center px-[16px] py-[12px] rounded-[10px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.04)] w-full">
              <img src={item.img} alt={item.name} className="rounded-[8px] size-[48px] object-cover shrink-0" />
              <div className="flex flex-1 flex-col gap-[3px] items-start min-w-0">
                <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[15px]" style={{ fontVariationSettings: '"opsz" 14' }}>{item.name}</p>
              </div>
              <p className="font-['Inter:Regular'] font-normal text-[#575b54] text-[12px] w-[120px] shrink-0">{item.category}</p>
              <div className={`${badge.bg} flex items-center px-[8px] py-[4px] rounded-full w-[80px] shrink-0`}>
                <p className={`font-['Inter:Bold'] font-bold text-[11px] ${badge.text}`}>{badge.label}</p>
              </div>
              <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[14px] w-[70px] shrink-0 text-right" style={{ fontVariationSettings: '"opsz" 14' }}>{item.price}</p>
              <div className="flex gap-[8px] items-center w-[80px] shrink-0 justify-end">
                <button onClick={() => onEdit(item)} className="flex items-center justify-center rounded-[6px] size-[32px] bg-[#f0ece5] hover:bg-[#ded9d0] transition-colors">
                  <div className="relative size-[14px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgPencil} /></div>
                </button>
                <button className="flex items-center justify-center rounded-[6px] size-[32px] bg-[#f0ece5] hover:bg-[#f8e1e1] transition-colors">
                  <div className="relative size-[14px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTrash2} /></div>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── MENU EDIT ───────────────────────────────────────────────────── */
function MenuEditScreen({ item, onBack }: { item: MenuItem | null; onBack: () => void }) {
  const [name, setName] = useState(item?.name ?? "");
  const [price, setPrice] = useState(item?.price?.replace("$", "") ?? "");
  const [desc, setDesc] = useState("Slow-braised pork belly, wild mushrooms, aged pecorino and fresh truffle oil.");
  const [category, setCategory] = useState(item?.category ?? "Mains");

  return (
    <div className="flex flex-1 flex-col h-full overflow-y-auto">
      <PageHeader title={item ? "Edit menu item" : "Add menu item"} subtitle={item ? `Editing ${item.name}` : "Create a new menu item"}>
        <button onClick={onBack} className="bg-[#fbf8f3] border border-[#ded9d0] border-solid flex h-[40px] items-center px-[16px] rounded-[10px]">
          <p className="font-['Inter:Regular'] font-normal text-[#20231f] text-[14px]">Discard changes</p>
        </button>
        <Btn label="Save item" variant="primary" onClick={onBack} />
      </PageHeader>
      <div className="flex flex-1 gap-[22px] items-start overflow-y-auto p-[22px]">
        {/* Image upload */}
        <div className="flex flex-col gap-[14px] items-start shrink-0 w-[260px]">
          <div className="bg-[#f0ece5] border-2 border-dashed border-[#ded9d0] flex flex-col gap-[10px] h-[200px] items-center justify-center rounded-[14px] w-full">
            {item ? (
              <img src={item.img} alt="" className="rounded-[12px] size-full object-cover" />
            ) : (
              <>
                <div className="relative size-[32px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgUpload} /></div>
                <p className="font-['Inter:Bold'] font-bold text-[#575b54] text-[12px] text-center">Drop image or click to upload</p>
              </>
            )}
          </div>
          <p className="font-['Inter:Regular'] font-normal text-[#8a8d86] text-[10px]">Recommended: 800×800px, JPG or PNG</p>
        </div>
        {/* Form fields */}
        <div className="flex flex-1 flex-col gap-[16px] items-start min-w-0">
          <div className="flex flex-col gap-[6px] items-start w-full">
            <label className="font-['Inter:Extra_Bold'] font-extrabold text-[#575b54] text-[11px] uppercase">Item name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="bg-white border border-[#ded9d0] border-solid flex h-[46px] items-center px-[14px] rounded-[10px] w-full font-['Inter:Regular'] font-normal text-[#20231f] text-[14px] outline-none focus:border-[#b44b2a]" />
          </div>
          <div className="flex flex-col gap-[6px] items-start w-full">
            <label className="font-['Inter:Extra_Bold'] font-extrabold text-[#575b54] text-[11px] uppercase">Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} className="bg-white border border-[#ded9d0] border-solid flex items-start p-[14px] rounded-[10px] w-full font-['Inter:Regular'] font-normal text-[#20231f] text-[14px] outline-none focus:border-[#b44b2a] resize-none h-[90px]" />
          </div>
          <div className="flex gap-[14px] items-start w-full">
            <div className="flex flex-1 flex-col gap-[6px] items-start">
              <label className="font-['Inter:Extra_Bold'] font-extrabold text-[#575b54] text-[11px] uppercase">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="bg-white border border-[#ded9d0] border-solid flex h-[46px] items-center px-[14px] rounded-[10px] w-full font-['Inter:Regular'] font-normal text-[#20231f] text-[14px] outline-none focus:border-[#b44b2a]">
                {["Small plates", "Mains", "Drinks", "Desserts"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-1 flex-col gap-[6px] items-start">
              <label className="font-['Inter:Extra_Bold'] font-extrabold text-[#575b54] text-[11px] uppercase">Price</label>
              <div className="bg-white border border-[#ded9d0] border-solid flex h-[46px] items-center px-[14px] rounded-[10px] w-full gap-[8px]">
                <p className="font-['Inter:Bold'] font-bold text-[#575b54] text-[14px]">$</p>
                <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="flex-1 font-['Inter:Regular'] font-normal text-[#20231f] text-[14px] outline-none" />
              </div>
            </div>
          </div>
          {/* Modifiers */}
          <div className="bg-white border border-[#ded9d0] border-solid flex flex-col gap-[12px] items-start p-[18px] rounded-[14px] w-full">
            <div className="flex items-start justify-between w-full">
              <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[16px]" style={{ fontVariationSettings: '"opsz" 14' }}>Modifiers</p>
              <button className="flex gap-[6px] items-center">
                <div className="relative size-[14px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgPlus1} /></div>
                <p className="font-['Inter:Bold'] font-bold text-[#b44b2a] text-[12px]">Add modifier</p>
              </button>
            </div>
            {["Classic pecorino", "No cheese", "Truffle oil add +$6"].map((mod, i) => (
              <div key={i} className="flex items-center justify-between w-full py-[8px] border-t border-[#ded9d0] border-solid">
                <div className="flex gap-[10px] items-center">
                  <div className="relative size-[14px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGripVertical} /></div>
                  <p className="font-['Inter:Regular'] font-normal text-[#20231f] text-[13px]">{mod}</p>
                </div>
                <div className="flex gap-[8px] items-center">
                  <button><div className="relative size-[14px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgPencil1} /></div></button>
                  <button><div className="relative size-[14px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTrash3} /></div></button>
                </div>
              </div>
            ))}
          </div>
          {/* Dietary tags */}
          <div className="bg-white border border-[#ded9d0] border-solid flex flex-col gap-[12px] items-start p-[18px] rounded-[14px] w-full">
            <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[16px]" style={{ fontVariationSettings: '"opsz" 14' }}>Dietary tags</p>
            <div className="flex flex-wrap gap-[8px]">
              {["Vegetarian", "Vegan", "Gluten-free", "Dairy-free", "Nut-free", "Halal"].map((tag, i) => (
                <button key={tag} className={`flex items-center px-[10px] py-[6px] rounded-full border text-[11px] font-['Inter:Bold'] font-bold transition-colors ${i < 2 ? "bg-[#252824] border-[#252824] border-solid text-white" : "bg-white border-[#ded9d0] border-solid text-[#575b54]"}`}>{tag}</button>
              ))}
            </div>
          </div>
        </div>
        {/* Preview & availability */}
        <div className="flex flex-col gap-[14px] items-start shrink-0 w-[220px]">
          <div className="bg-white border border-[#ded9d0] border-solid flex flex-col gap-[10px] items-start p-[14px] rounded-[14px] w-full">
            <p className="font-['Inter:Extra_Bold'] font-extrabold text-[#8a8d86] text-[10px] uppercase">Availability</p>
            {[["Available to order", true], ["Shown on digital menu", true], ["Allow modifications", true]].map(([label, on]) => (
              <div key={label as string} className="flex items-center justify-between w-full">
                <p className="font-['Inter:Regular'] font-normal text-[#20231f] text-[12px]">{label as string}</p>
                <div className="relative size-[32px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={on ? imgToggle : imgToggle1} /></div>
              </div>
            ))}
          </div>
          <div className="bg-[#f9eacf] flex flex-col gap-[6px] items-start p-[14px] rounded-[14px] w-full">
            <p className="font-['Inter:Extra_Bold'] font-extrabold text-[#b06a16] text-[10px] uppercase">Prepared food · 5:30 PM</p>
            <p className="font-['Inter:Bold'] font-bold text-[#20231f] text-[12px]">Stations: Pasta · Hot line</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── BILLING ─────────────────────────────────────────────────────── */
interface Bill { id: string; table: string; guests: number; status: "open" | "requested" | "settled"; total: string; time: string; }
const BILLS: Bill[] = [
  { id: "TT-1048", table: "Table 12", guests: 3, status: "requested", total: "$77.18", time: "7:26 PM" },
  { id: "TT-1046", table: "Table 09", guests: 3, status: "open", total: "$96.40", time: "7:12 PM" },
  { id: "TT-1051", table: "Table 07", guests: 5, status: "open", total: "$84.60", time: "7:27 PM" },
  { id: "TT-1045", table: "Table 15", guests: 4, status: "settled", total: "$112.00", time: "7:05 PM" },
  { id: "TT-1043", table: "Table 05", guests: 2, status: "settled", total: "$68.80", time: "7:03 PM" },
];
const BILL_STATUS = {
  open: { bg: "bg-[#e1eef1]", text: "text-[#356a7a]", label: "Open" },
  requested: { bg: "bg-[#f9eacf]", text: "text-[#b06a16]", label: "Requested" },
  settled: { bg: "bg-[#e2f0ea]", text: "text-[#32705a]", label: "Settled" },
};

function BillingScreen() {
  const [selectedBill, setSelectedBill] = useState<Bill>(BILLS[0]);

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden">
      <PageHeader title="Billing" subtitle="14 open bills · 3 requested · $1,126 outstanding">
        <Btn label="Export" icon={imgDownload} />
        <Btn label="Close out all" variant="primary" />
      </PageHeader>
      <div className="flex flex-1 gap-0 min-h-0">
        {/* Metrics + list */}
        <div className="flex flex-1 flex-col gap-[14px] items-start overflow-y-auto p-[22px]">
          <div className="flex gap-[12px] items-start w-full shrink-0">
            {[
              { label: "Outstanding", value: "$1,126", sub: "14 open bills", icon: imgDollarSign, bg: "bg-[#f6e6df]" },
              { label: "Requested", value: "3", sub: "Awaiting payment", icon: imgReceiptText2, bg: "bg-[#f9eacf]" },
              { label: "Revenue today", value: "$3,190", sub: "↑ 14% vs yesterday", icon: imgTrendingUp, bg: "bg-[#e2f0ea]" },
            ].map(m => (
              <div key={m.label} className="bg-white border border-[#ded9d0] border-solid flex flex-1 flex-col gap-[10px] items-start p-[16px] rounded-[14px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between w-full">
                  <p className="font-['Inter:Regular'] font-normal text-[#575b54] text-[13px]">{m.label}</p>
                  <div className={`${m.bg} flex items-center justify-center rounded-[8px] size-[30px]`}>
                    <div className="relative size-[15px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={m.icon} /></div>
                  </div>
                </div>
                <p className="font-['DM_Sans:Regular'] font-normal text-[#20231f] text-[26px]" style={{ fontVariationSettings: '"opsz" 14' }}>{m.value}</p>
                <p className="font-['Inter:Regular'] font-normal text-[#32705a] text-[11px]">{m.sub}</p>
              </div>
            ))}
          </div>
          {/* Bills list */}
          {BILLS.map(bill => {
            const badge = BILL_STATUS[bill.status];
            const isSelected = selectedBill?.id === bill.id;
            return (
              <button key={bill.id} onClick={() => setSelectedBill(bill)} className={`bg-white border flex gap-[12px] items-center px-[16px] py-[14px] rounded-[10px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.04)] w-full text-left transition-all ${isSelected ? "border-2 border-[#b44b2a]" : "border-[#ded9d0] border-solid hover:border-[#b44b2a]"}`}>
                <p className="font-['DM_Sans:Regular'] font-normal text-[#20231f] text-[15px] w-[80px] shrink-0" style={{ fontVariationSettings: '"opsz" 14' }}>{bill.id}</p>
                <p className="font-['Inter:Bold'] font-bold text-[#575b54] text-[12px] w-[80px] shrink-0">{bill.table}</p>
                <div className={`${badge.bg} flex gap-[6px] items-center px-[8px] py-[4px] rounded-full shrink-0`}>
                  <p className={`font-['Inter:Bold'] font-bold text-[11px] ${badge.text}`}>{badge.label}</p>
                </div>
                <p className="font-['Inter:Regular'] font-normal text-[#575b54] text-[12px] flex-1 shrink-0">{bill.guests} guests</p>
                <p className="font-['Inter:Regular'] font-normal text-[#575b54] text-[12px] w-[60px] shrink-0">{bill.time}</p>
                <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[14px] w-[70px] shrink-0 text-right" style={{ fontVariationSettings: '"opsz" 14' }}>{bill.total}</p>
              </button>
            );
          })}
        </div>
        {/* Bill detail */}
        {selectedBill && (
          <div className="bg-white border-l border-[#ded9d0] border-solid flex flex-col gap-[16px] items-start overflow-y-auto p-[22px] shrink-0 w-[300px] h-full">
            <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[20px]" style={{ fontVariationSettings: '"opsz" 14' }}>{selectedBill.id}</p>
            <div className={`${BILL_STATUS[selectedBill.status].bg} flex gap-[6px] items-center px-[10px] py-[6px] rounded-full`}>
              <p className={`font-['Inter:Bold'] font-bold text-[12px] ${BILL_STATUS[selectedBill.status].text}`}>{BILL_STATUS[selectedBill.status].label}</p>
            </div>
            <div className="h-px bg-[#ded9d0] w-full" />
            {[["Table", selectedBill.table], ["Guests", `${selectedBill.guests}`], ["Opened", selectedBill.time], ["Total", selectedBill.total]].map(([k, v]) => (
              <div key={k} className="flex items-start justify-between w-full">
                <p className="font-['Inter:Regular'] font-normal text-[#575b54] text-[12px]">{k}</p>
                <p className="font-['Inter:Bold'] font-bold text-[#20231f] text-[12px]">{v}</p>
              </div>
            ))}
            <div className="h-px bg-[#ded9d0] w-full" />
            {selectedBill.status === "requested" && (
              <button className="bg-[#b44b2a] border border-[#b44b2a] border-solid flex gap-[8px] h-[46px] items-center justify-center rounded-[12px] w-full">
                <div className="relative size-[17px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgCheckCircle} /></div>
                <p className="font-['Inter:Regular'] font-normal text-[14px] text-white">Mark as settled</p>
              </button>
            )}
            {selectedBill.status === "open" && (
              <button className="bg-[#fbf8f3] border border-[#ded9d0] border-solid flex gap-[8px] h-[46px] items-center justify-center rounded-[12px] w-full">
                <div className="relative size-[17px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgReceiptText1} /></div>
                <p className="font-['Inter:Regular'] font-normal text-[#20231f] text-[14px]">Request payment</p>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── SETTINGS ────────────────────────────────────────────────────── */
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className="relative shrink-0 size-[32px]">
      <img alt="" className="absolute block inset-0 max-w-none size-full" src={on ? imgToggle : imgToggle1} />
    </button>
  );
}

function SettingsScreen() {
  const [notifNewOrder, setNotifNewOrder] = useState(true);
  const [notifBill, setNotifBill] = useState(true);
  const [notifLate, setNotifLate] = useState(true);
  const [notifHelp, setNotifHelp] = useState(false);

  return (
    <div className="flex flex-1 flex-col h-full overflow-y-auto">
      <PageHeader title="Operations settings" subtitle="Service hours, tax, notifications and restaurant info">
        <LiveBadge label="Saffron & Ember · Live" />
        <Btn label="Save changes" variant="primary" />
      </PageHeader>
      <div className="flex flex-1 flex-col gap-[18px] items-start overflow-y-auto p-[22px]">
        <div className="flex gap-[18px] items-start w-full">
          {/* Service hours */}
          <div className="bg-white border border-[#ded9d0] border-solid flex flex-1 flex-col gap-[14px] items-start p-[20px] rounded-[14px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between w-full">
              <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[17px]" style={{ fontVariationSettings: '"opsz" 14' }}>Service hours</p>
              <div className="bg-[#e2f0ea] flex gap-[6px] items-center px-[10px] py-[5px] rounded-full">
                <div className="relative size-[6px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIndicator3} /></div>
                <p className="font-['Inter:Bold'] font-bold text-[#32705a] text-[11px]">Service live</p>
              </div>
            </div>
            {[["Lunch", "11:00 AM", "2:30 PM"], ["Dinner", "5:00 PM", "10:00 PM"]].map(([s, open, close]) => (
              <div key={s} className="flex gap-[12px] items-center w-full">
                <p className="font-['Inter:Bold'] font-bold text-[#575b54] text-[13px] w-[56px] shrink-0">{s}</p>
                <input defaultValue={open} className="bg-[#f8f6f1] border border-[#ded9d0] border-solid flex flex-1 h-[38px] items-center px-[12px] rounded-[8px] font-['Inter:Regular'] font-normal text-[#20231f] text-[13px] outline-none" />
                <p className="font-['Inter:Regular'] font-normal text-[#8a8d86] text-[12px] shrink-0">to</p>
                <input defaultValue={close} className="bg-[#f8f6f1] border border-[#ded9d0] border-solid flex flex-1 h-[38px] items-center px-[12px] rounded-[8px] font-['Inter:Regular'] font-normal text-[#20231f] text-[13px] outline-none" />
              </div>
            ))}
          </div>
          {/* Quick health */}
          <div className="bg-white border border-[#ded9d0] border-solid flex flex-col gap-[10px] items-start p-[20px] rounded-[14px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.04)] shrink-0 w-[260px]">
            <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[17px]" style={{ fontVariationSettings: '"opsz" 14' }}>System health</p>
            {[
              { label: "Order sync", ok: true }, { label: "Kitchen display", ok: true },
              { label: "Payment gateway", ok: true }, { label: "Reservation system", ok: false },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between w-full">
                <p className="font-['Inter:Regular'] font-normal text-[#20231f] text-[12px]">{item.label}</p>
                <div className={`flex gap-[5px] items-center px-[8px] py-[4px] rounded-full ${item.ok ? "bg-[#e2f0ea]" : "bg-[#f8e1e1]"}`}>
                  <div className="relative size-[6px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={item.ok ? imgIndicator3 : imgIndicator} /></div>
                  <p className={`font-['Inter:Bold'] font-bold text-[10px] ${item.ok ? "text-[#32705a]" : "text-[#b23a3a]"}`}>{item.ok ? "Connected" : "Offline"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Tax */}
        <div className="bg-white border border-[#ded9d0] border-solid flex flex-col gap-[14px] items-start p-[20px] rounded-[14px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.04)] w-full">
          <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[17px]" style={{ fontVariationSettings: '"opsz" 14' }}>Tax &amp; service charge</p>
          <div className="flex gap-[18px] items-start w-full">
            {[["Sales tax", "8.5%"], ["Service charge", "5%"]].map(([label, val]) => (
              <div key={label} className="flex flex-1 flex-col gap-[6px] items-start">
                <label className="font-['Inter:Extra_Bold'] font-extrabold text-[#575b54] text-[10px] uppercase">{label}</label>
                <input defaultValue={val} className="bg-[#f8f6f1] border border-[#ded9d0] border-solid flex h-[40px] items-center px-[12px] rounded-[8px] w-full font-['Inter:Regular'] font-normal text-[#20231f] text-[13px] outline-none" />
              </div>
            ))}
            <div className="flex flex-1 flex-col gap-[6px] items-start">
              <label className="font-['Inter:Extra_Bold'] font-extrabold text-[#575b54] text-[10px] uppercase">Tax description</label>
              <input defaultValue="Inc. tax on all items (EU)" className="bg-[#f8f6f1] border border-[#ded9d0] border-solid flex h-[40px] items-center px-[12px] rounded-[8px] w-full font-['Inter:Regular'] font-normal text-[#20231f] text-[13px] outline-none" />
            </div>
          </div>
        </div>
        {/* Notifications */}
        <div className="bg-white border border-[#ded9d0] border-solid flex flex-col gap-[14px] items-start p-[20px] rounded-[14px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.04)] w-full">
          <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[17px]" style={{ fontVariationSettings: '"opsz" 14' }}>Notification preferences</p>
          {[
            ["New order placed", notifNewOrder, () => setNotifNewOrder(v => !v)],
            ["Bill requested", notifBill, () => setNotifBill(v => !v)],
            ["Late order alert", notifLate, () => setNotifLate(v => !v)],
            ["Help requested by guest", notifHelp, () => setNotifHelp(v => !v)],
          ].map(([label, on, change]) => (
            <div key={label as string} className="flex items-center justify-between w-full py-[8px] border-t border-[#ded9d0] border-solid first:border-0 first:pt-0">
              <div className="flex gap-[10px] items-center">
                <div className="relative size-[16px]"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgBell} /></div>
                <p className="font-['Inter:Regular'] font-normal text-[#20231f] text-[13px]">{label as string}</p>
              </div>
              <Toggle on={on as boolean} onChange={change as () => void} />
            </div>
          ))}
        </div>
        {/* Restaurant info */}
        <div className="bg-white border border-[#ded9d0] border-solid flex flex-col gap-[14px] items-start p-[20px] rounded-[14px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.04)] w-full">
          <p className="font-['DM_Sans:ExtraBold'] font-extrabold text-[#20231f] text-[17px]" style={{ fontVariationSettings: '"opsz" 14' }}>Restaurant info</p>
          <div className="flex gap-[18px] items-start w-full flex-wrap">
            {[["Name", "Saffron & Ember"], ["Category", "Modern Mediterranean"], ["Phone", "+1 415 555 0124"], ["Email", "info@saffronember.com"], ["Address", "280 Bryant St, San Francisco, CA"]].map(([label, val]) => (
              <div key={label} className={`flex flex-col gap-[6px] items-start ${label === "Address" ? "flex-1 min-w-[200px]" : "shrink-0 w-[200px]"}`}>
                <label className="font-['Inter:Extra_Bold'] font-extrabold text-[#575b54] text-[10px] uppercase">{label}</label>
                <input defaultValue={val} className="bg-[#f8f6f1] border border-[#ded9d0] border-solid flex h-[40px] items-center px-[12px] rounded-[8px] w-full font-['Inter:Regular'] font-normal text-[#20231f] text-[13px] outline-none focus:border-[#b44b2a]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── ROOT ────────────────────────────────────────────────────────── */
export default function AdminApp({ propertyId }: { propertyId?: string }) {
  const [screen, setScreen] = useState<Screen>("overview");
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  function handleNav(s: Screen) {
    setScreen(s);
    if (s !== "menu") setEditingItem(null);
  }

  function handleEdit(item: MenuItem) {
    setEditingItem(item);
    setScreen("menu-edit");
  }

  return (
    <div className="min-h-screen w-full bg-[#f3f0ea] flex items-start justify-start">
      <div className="flex w-full min-h-screen">
        <Sidebar screen={screen} onNav={handleNav} />
        <div className="bg-[#f8f6f1] flex flex-1 flex-col h-screen overflow-hidden">
          {screen === "overview" && <OverviewScreen />}
          {screen === "tables" && <TablesScreen onTableSelect={() => {}} propertyId={propertyId} />}
          {screen === "orders" && <OrdersScreen />}
          {screen === "menu" && <MenuScreen onEdit={handleEdit} />}
          {screen === "menu-edit" && <MenuEditScreen item={editingItem} onBack={() => setScreen("menu")} />}
          {screen === "billing" && <BillingScreen />}
          {screen === "settings" && <SettingsScreen />}
        </div>
      </div>
    </div>
  );
}
