import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Banknote,
  Check,
  CheckCircle2,
  Landmark,
  Loader2,
  Minus,
  Package,
  Percent,
  Plus,
  Printer,
  RotateCcw,
  Search,
  ShoppingBag,
  Smartphone,
  Tag,
  Trash2,
  UserPlus,
  UserRound,
  Wifi,
  X,
  Hash,
} from "lucide-react";

import { selectCurrentUser } from "../../features/auth/authSlice";
import { getApiErrorMessage } from "../../utils/apiError";
import { API_BASE_URL } from "../../config/api";

import { useGetProductsQuery } from "../../features/products/productApi";
import { useGetProductInventoryQuery } from "../../features/products/productInventoryApi";
import {
  useGetInventoryUnitsByProductInventoryQuery,
} from "../../features/products/inventoryUnitApi";
import { useGetCategoriesQuery } from "../../features/category/categoryApi";
import {
  useGetCustomersQuery,
  useCreateCustomerMutation,
} from "../../features/customer/customerApi";
import { useGetCurrentCashRegisterQuery } from "../../features/cashRegister/cashRegisterApi";
import {
  useCreateSaleMutation,
} from "../../features/sales/saleApi";
import { useCreateSaleItemMutation } from "../../features/sales/saleItemApi";
import { useCreateSalePaymentMutation } from "../../features/sales/salePaymentApi";
import CustomerForm from "../customer/CustomerForm";

/* =====================================================================
   CONFIG
===================================================================== */

const CURRENCY = "PKR";
const PREFS_KEY = "pos_receipt_prefs";
const PRINTERS_KEY = "pos_tcp_printers";
const DEFAULT_PRINTER_KEY = "pos_default_printer";
const PRINT_URL = `${API_BASE_URL}/printer/print`;

/* =====================================================================
   HELPERS
===================================================================== */

const money = (v) =>
  `Rs ${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 2 }).format(Number(v) || 0)}`;

const roundMoney = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;

const pickList = (data, ...keys) => {
  if (Array.isArray(data)) return data;
  for (const k of keys) {
    if (Array.isArray(data?.[k])) return data[k];
    if (Array.isArray(data?.data?.[k])) return data.data[k];
  }
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const pickEntity = (res, ...keys) => {
  for (const k of keys) {
    if (res?.[k] && !Array.isArray(res[k])) return res[k];
    if (res?.data?.[k] && !Array.isArray(res.data[k])) return res.data[k];
  }
  if (res?.data && typeof res.data === "object" && !Array.isArray(res.data)) return res.data;
  return res || null;
};

const nameOf = (v, fallback = "—") =>
  !v ? fallback : typeof v === "object" ? v.name || fallback : v;

const getProductName = (p) => p?.name || "Unknown product";
const getProductBrand = (p) => nameOf(p?.brand);
const getProductCategory = (p) => nameOf(p?.category, "Uncategorized");

const getProductImage = (p) => {
  if (!p) return null;
  if (typeof p.image === "string" && p.image) return p.image;
  if (p.image?.url) return p.image.url;
  const list = Array.isArray(p.images) ? p.images : [];
  for (const img of list) {
    if (typeof img === "string" && img) return img;
    if (img?.url) return img.url;
  }
  return null;
};

const initialsOf = (name = "") =>
  String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("") || "?";

const variantLabel = (inv) =>
  [inv?.color, inv?.size].filter(Boolean).join(" / ") || "Standard";

function getStockTone(qty, min = 0) {
  const q = Number(qty) || 0;
  if (q <= 0) return "text-[var(--color-danger)] bg-[var(--color-danger)]/10";
  if (q <= (Number(min) || 0)) return "text-[var(--color-warning)] bg-[var(--color-warning)]/10";
  return "text-[var(--color-success)] bg-[var(--color-success)]/10";
}

function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function usePrefs() {
  const [prefs, setPrefs] = useState(() => {
    const base = { paper: "80", autoPrint: false };
    try {
      return { ...base, ...JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") };
    } catch {
      return base;
    }
  });
  const update = (patch) =>
    setPrefs((p) => {
      const next = { ...p, ...patch };
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  return [prefs, update];
}

const inputCls =
  "w-full rounded-xl border border-primary bg-card px-3 py-2.5 text-sm text-primary outline-none transition placeholder:text-secondary focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:opacity-60";

/* =====================================================================
   BRAND MARKS
===================================================================== */

function LogoBox({ children, wide = false }) {
  return (
    <span
      className={`flex h-10 shrink-0 items-center justify-center rounded-lg border border-black/10 bg-white px-2 shadow-sm ${
        wide ? "w-24" : "w-16"
      }`}
    >
      {children}
    </span>
  );
}

const VisaMark = () => (
  <svg viewBox="0 0 60 20" className="h-4 w-auto" aria-label="Visa">
    <text
      x="30"
      y="16"
      textAnchor="middle"
      fontFamily="Arial Black, Arial, sans-serif"
      fontWeight="900"
      fontStyle="italic"
      fontSize="19"
      fill="#1A1F71"
    >
      VISA
    </text>
  </svg>
);

function MastercardMark() {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 40 24" className="h-5 w-auto" aria-label="Mastercard">
      <defs>
        <clipPath id={id}>
          <circle cx="15" cy="12" r="10" />
        </clipPath>
      </defs>
      <circle cx="15" cy="12" r="10" fill="#EB001B" />
      <circle cx="25" cy="12" r="10" fill="#F79E1B" />
      <circle cx="25" cy="12" r="10" fill="#FF5F00" clipPath={`url(#${id})`} />
    </svg>
  );
}

const JazzCashMark = () => (
  <svg viewBox="0 0 80 20" className="h-4 w-auto" aria-label="JazzCash">
    <text x="40" y="15" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="15">
      <tspan fill="#D9282D">Jazz</tspan>
      <tspan fill="#F5A800">Cash</tspan>
    </text>
  </svg>
);

const EasyPaisaMark = () => (
  <svg viewBox="0 0 90 20" className="h-4 w-auto" aria-label="Easypaisa">
    <text x="45" y="15" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="15">
      <tspan fill="#0B7A3B">easy</tspan>
      <tspan fill="#37B34A">paisa</tspan>
    </text>
  </svg>
);

const CardLogos = () => (
  <span className="flex items-center gap-1.5">
    <VisaMark />
    <MastercardMark />
  </span>
);

/* =====================================================================
   PAYMENT METHODS
===================================================================== */

const PAYMENT_METHODS = [
  {
    id: "cash",
    label: "Cash",
    hint: "Collect at counter",
    kind: "cash",
    saleMethod: "cash",
    paymentMethod: "cash",
    online: false,
    logo: () => (
      <LogoBox>
        <Banknote className="h-5 w-5 text-[#16a34a]" />
      </LogoBox>
    ),
  },
  {
    id: "jazzcash",
    label: "JazzCash",
    hint: "Online wallet",
    kind: "online",
    saleMethod: "online",
    paymentMethod: "jazzcash",
    online: true,
    logo: () => (
      <LogoBox wide>
        <JazzCashMark />
      </LogoBox>
    ),
  },
  {
    id: "easypaisa",
    label: "Easypaisa",
    hint: "Online wallet",
    kind: "online",
    saleMethod: "online",
    paymentMethod: "easypaisa",
    online: true,
    logo: () => (
      <LogoBox wide>
        <EasyPaisaMark />
      </LogoBox>
    ),
  },
  {
    id: "card",
    label: "Card",
    hint: "Debit / credit terminal",
    kind: "online",
    saleMethod: "card",
    paymentMethod: "card",
    online: true,
    logo: () => (
      <LogoBox wide>
        <CardLogos />
      </LogoBox>
    ),
  },
  {
    id: "bank",
    label: "Bank Transfer",
    hint: "IBFT / Raast",
    kind: "online",
    saleMethod: "bank",
    paymentMethod: "bank",
    online: true,
    logo: () => (
      <LogoBox>
        <Landmark className="h-5 w-5 text-[#1d4ed8]" />
      </LogoBox>
    ),
  },
];

/* =====================================================================
   RECEIPT BUILDERS
===================================================================== */

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const STATUS_TEXT = { paid: "PAID", pending: "PENDING", unpaid: "UNPAID", partial: "PARTIALLY PAID" };

function buildReceiptHtml(r, paper = "80") {
  const small = paper === "58";
  const line = (l, v, cls = "") => `<div class="row ${cls}"><span>${esc(l)}</span><span>${esc(v)}</span></div>`;

  const items = r.items
    .map((i) => {
      const meta = [
        i.category,
        i.variant && i.variant !== "Standard" ? i.variant : "",
        i.sku ? `SKU ${i.sku}` : "",
        i.imei ? `IMEI ${i.imei}` : "",
        i.serialNumber ? `S/N ${i.serialNumber}` : "",
      ]
        .filter(Boolean)
        .join(" • ");

      const hasDiscount = Number(i.discountAmount || 0) > 0;

      return `<div class="item">
        <div class="nm">${esc(i.name)}</div>
        ${meta ? `<div class="sub">${esc(meta)}</div>` : ""}
        <div class="row">
          <span>${esc(i.quantity)} x ${esc(money(i.originalPrice || i.price))}</span>
          <span>${esc(money(i.quantity * (i.originalPrice || i.price)))}</span>
        </div>
        ${hasDiscount ? `<div class="row" style="color:#555;font-size:10px"><span>Discount (${i.discountPercent || 0}%)</span><span>- ${esc(money(i.discountAmount))}</span></div>` : ""}
        ${hasDiscount ? `<div class="row"><span></span><span>${esc(money(i.quantity * i.price))}</span></div>` : ""}
      </div>`;
    })
    .join("");

  const qty = r.items.reduce((s, i) => s + Number(i.quantity), 0);
  const p = r.payment;
  const b = r.business || {};

  return `<!doctype html><html><head><meta charset="utf-8"><title>Receipt ${esc(r.saleNumber)}</title>
<style>
@page{size:${small ? 58 : 80}mm auto;margin:0}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#fff;color:#000}
body{width:${small ? 58 : 80}mm;padding:3mm ${small ? 2 : 3}mm 6mm;font-family:"Courier New",ui-monospace,monospace;font-size:${small ? 10 : 11.5}px;line-height:1.35}
.c{text-align:center}.b{font-weight:700}
.biz{font-size:${small ? 13 : 15}px;font-weight:700;text-transform:uppercase}
.muted{color:#333;font-size:${small ? 9 : 10.5}px}
.hr{border-top:1px dashed #000;margin:6px 0}
.row{display:flex;justify-content:space-between;gap:8px}
.row span:last-child{text-align:right;white-space:nowrap}
.item{margin-bottom:6px}.nm{font-weight:700;word-break:break-word}.sub{color:#333;font-size:${small ? 9 : 10.5}px;word-break:break-word}
.total{font-size:${small ? 12 : 14}px;font-weight:700;margin-top:2px}
.badge{display:inline-block;border:1.5px solid #000;padding:1px 8px;font-weight:700;letter-spacing:.5px;margin-top:4px}
.logo{max-width:48px;max-height:48px;margin:0 auto 4px;display:block}
</style></head><body>
<div class="c">
${b.logo ? `<img class="logo" src="${esc(b.logo)}" alt="Logo" />` : ""}
<div class="biz">${esc(b.name || "Sale Receipt")}</div>
${b.type ? `<div class="muted">${esc(b.type)}</div>` : ""}
${b.address ? `<div class="muted">${esc(b.address)}</div>` : ""}
<div class="b" style="margin-top:4px">SALE RECEIPT</div></div>
<div class="hr"></div>
${line("Receipt #", r.saleNumber)}
${line("Date", new Date(r.date).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }))}
${r.cashier ? line("Cashier", r.cashier) : ""}
${r.register ? line("Register", r.register) : ""}
${line("Customer", r.customer?.name || "Walk-in Customer")}
${r.customer?.phone ? line("Phone", r.customer.phone) : ""}
<div class="hr"></div>
${items}
<div class="hr"></div>
${line("Items / Qty", `${r.items.length} / ${qty}`)}
${line("Subtotal", money(r.subtotal))}
${r.discount > 0 ? line("Discount", `- ${money(r.discount)}`) : ""}
${r.tax > 0 ? line("Tax", money(r.tax)) : ""}
${line("TOTAL", money(r.total), "total")}
<div class="hr"></div>
${line("Payment", p.label)}
${p.gatewayCharge ? line("Gateway charge", p.gatewayCharge) : ""}
${p.reference ? line("Ref / TID", p.reference) : ""}
${p.walletNumber ? line("Wallet #", p.walletNumber) : ""}
${line("Paid", money(p.paid))}
${p.received > p.paid ? line("Received", money(p.received)) : ""}
${p.change > 0 ? line("Change", money(p.change)) : ""}
${p.status !== "paid" ? line("Balance due", money(Math.max(0, r.total - p.paid))) : ""}
<div class="c"><span class="badge">${esc(STATUS_TEXT[p.status] || "PAID")}</span></div>
<div class="hr"></div>
<div class="c b">Thank you for shopping with us!</div>
<div class="c muted">Please keep this receipt for returns.</div>
${b.phone ? `<div class="c muted" style="margin-top:6px;font-weight:700">Help Line: ${esc(b.phone)}</div>` : ""}
</body></html>`;
}

function printHtml(html) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, { position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0" });
  iframe.onload = () => {
    const w = iframe.contentWindow;
    if (!w) return;
    w.focus();
    setTimeout(() => w.print(), 150);
  };
  iframe.srcdoc = html;
  document.body.appendChild(iframe);
  setTimeout(() => iframe.remove(), 60000);
}

/* =====================================================================
   THERMAL PRINTER (ESC/POS)
===================================================================== */

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

const toAscii = (s) =>
  String(s ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e]/g, "?");

function wrapText(text, width) {
  const lines = [];
  let cur = "";
  toAscii(text)
    .split(/\s+/)
    .filter(Boolean)
    .forEach((w) => {
      let word = w;
      while (word.length > width) {
        if (cur) {
          lines.push(cur);
          cur = "";
        }
        lines.push(word.slice(0, width));
        word = word.slice(width);
      }
      if (!word) return;
      if (!cur) cur = word;
      else if ((cur + " " + word).length <= width) cur += " " + word;
      else {
        lines.push(cur);
        cur = word;
      }
    });
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

function twoCol(left, right, cols) {
  const r = toAscii(right);
  const parts = wrapText(left, Math.max(cols - r.length - 1, 4));
  return parts.map((l, i) => (i === parts.length - 1 ? l.padEnd(Math.max(cols - r.length, l.length)) + r : l));
}

function buildEscPos(r, { cols = 48, cut = true, drawer = false } = {}) {
  const out = [];
  const raw = (...b) => out.push(...b);
  const ln = (s = "") => {
    for (const ch of toAscii(s)) out.push(ch.charCodeAt(0));
    out.push(LF);
  };
  const align = (n) => raw(ESC, 0x61, n);
  const bold = (on) => raw(ESC, 0x45, on ? 1 : 0);
  const size = (n) => raw(GS, 0x21, n);
  const rule = () => ln("-".repeat(cols));
  const rows = (l, v) => twoCol(l, v, cols).forEach((x) => ln(x));
  const b = r.business || {};
  const p = r.payment;

  raw(ESC, 0x40);
  if (drawer) raw(ESC, 0x70, 0x00, 0x19, 0xfa);

  align(1);
  bold(true);
  size(0x11);
  wrapText((b.name || "Sale Receipt").toUpperCase(), Math.floor(cols / 2)).forEach((l) => ln(l));
  size(0x00);
  bold(false);
  [b.type, b.address].filter(Boolean).forEach((t) => wrapText(t, cols).forEach((l) => ln(l)));
  bold(true);
  ln("SALE RECEIPT");
  bold(false);
  align(0);
  rule();

  rows("Receipt #", r.saleNumber);
  rows("Date", new Date(r.date).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }));
  if (r.cashier) rows("Cashier", r.cashier);
  if (r.register) rows("Register", r.register);
  rows("Customer", r.customer?.name || "Walk-in Customer");
  if (r.customer?.phone) rows("Phone", r.customer.phone);
  rule();

  r.items.forEach((i) => {
    bold(true);
    wrapText(i.name, cols).forEach((l) => ln(l));
    bold(false);
    const meta = [
      i.category,
      i.variant && i.variant !== "Standard" ? i.variant : "",
      i.sku ? `SKU ${i.sku}` : "",
      i.imei ? `IMEI ${i.imei}` : "",
      i.serialNumber ? `S/N ${i.serialNumber}` : "",
    ]
      .filter(Boolean)
      .join(" | ");
    if (meta) wrapText(meta, cols).forEach((l) => ln(l));

    const original = Number(i.originalPrice || i.price);
    rows(`${i.quantity} x ${money(original)}`, money(i.quantity * original));

    if (Number(i.discountAmount || 0) > 0) {
      rows(`Discount (${i.discountPercent || 0}%)`, `- ${money(i.discountAmount)}`);
      rows("", money(i.quantity * i.price));
    }
  });
  rule();

  rows("Items / Qty", `${r.items.length} / ${r.items.reduce((s, i) => s + Number(i.quantity), 0)}`);
  rows("Subtotal", money(r.subtotal));
  if (r.discount > 0) rows("Discount", `- ${money(r.discount)}`);
  if (r.tax > 0) rows("Tax", money(r.tax));
  bold(true);
  size(0x01);
  rows("TOTAL", money(r.total));
  size(0x00);
  bold(false);
  rule();

  rows("Payment", p.label);
  if (p.gatewayCharge) rows("Gateway charge", p.gatewayCharge);
  if (p.reference) rows("Ref / TID", p.reference);
  if (p.walletNumber) rows("Wallet #", p.walletNumber);
  rows("Paid", money(p.paid));
  if (p.received > p.paid) rows("Received", money(p.received));
  if (p.change > 0) rows("Change", money(p.change));
  if (p.status !== "paid") rows("Balance due", money(Math.max(0, r.total - p.paid)));

  align(1);
  bold(true);
  ln(`** ${STATUS_TEXT[p.status] || "PAID"} **`);
  bold(false);
  rule();
  bold(true);
  ln("Thank you for shopping with us!");
  bold(false);
  ln("Please keep this receipt for returns.");

  // ===== HELP LINE (Manager / Admin phone) =====
  if (b.phone) {
    ln("");
    bold(true);
    ln(`Help Line: ${b.phone}`);
    bold(false);
  }

  align(0);
  raw(LF, LF, LF);
  if (cut) raw(GS, 0x56, 0x42, 0x00);

  return Uint8Array.from(out);
}

function bytesToBase64(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

async function sendToTcpPrinter(printer, bytes) {
  const payload = { host: printer.host, port: Number(printer.port) || 9100, data: bytesToBase64(bytes) };

  if (window.posPrinter?.printTcp) {
    await window.posPrinter.printTcp(payload);
    return;
  }

  const res = await fetch(PRINT_URL, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    throw new Error(json?.message || `Print service error (${res.status})`);
  }
}

function usePrinters() {
  const read = (key, fallback) => {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v ?? fallback;
    } catch {
      return fallback;
    }
  };
  const write = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable */
    }
  };

  const [printers, setPrinters] = useState(() => read(PRINTERS_KEY, []));
  const [defaultId, setDefaultId] = useState(() => read(DEFAULT_PRINTER_KEY, null));

  const addPrinter = (p) => {
    const id = `prn-${Date.now()}`;
    const next = [...printers, { ...p, id }];
    setPrinters(next);
    write(PRINTERS_KEY, next);
    if (!defaultId) {
      setDefaultId(id);
      write(DEFAULT_PRINTER_KEY, id);
    }
  };
  const removePrinter = (id) => {
    const next = printers.filter((p) => p.id !== id);
    setPrinters(next);
    write(PRINTERS_KEY, next);
    if (defaultId === id) {
      setDefaultId(null);
      write(DEFAULT_PRINTER_KEY, null);
    }
  };
  const setDefaultPrinter = (id) => {
    setDefaultId(id);
    write(DEFAULT_PRINTER_KEY, id);
  };

  return { printers, defaultId, addPrinter, removePrinter, setDefaultPrinter };
}

/* =====================================================================
   MAIN POS COMPONENT
===================================================================== */

export default function Pos() {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();

  // ---------- Data ----------
  const { data: productsRes, isLoading: productsLoading } = useGetProductsQuery({
    page: 1,
    limit: 500,
    isActive: true,
  });

  const { data: inventoryRes, isLoading: inventoryLoading } = useGetProductInventoryQuery({
    page: 1,
    limit: 1000,
  });

  const { data: categoriesRes } = useGetCategoriesQuery({ page: 1, limit: 100 });
  const { data: cashRegisterRes } = useGetCurrentCashRegisterQuery();

  const [createSale] = useCreateSaleMutation();
  const [createSaleItem] = useCreateSaleItemMutation();
  const [createSalePayment] = useCreateSalePaymentMutation();
  const [createCustomer, { isLoading: creatingCustomer }] = useCreateCustomerMutation();

  // ---------- Normalize ----------
  const products = useMemo(() => pickList(productsRes, "products"), [productsRes]);
  const inventories = useMemo(() => pickList(inventoryRes, "inventory"), [inventoryRes]);
  const categories = useMemo(() => pickList(categoriesRes, "categories"), [categoriesRes]);

  // Map productId → inventories
  const inventoryByProduct = useMemo(() => {
    const map = {};
    inventories.forEach((inv) => {
      const pid = inv.product?._id || inv.product;
      if (!pid) return;
      if (!map[pid]) map[pid] = [];
      map[pid].push(inv);
    });
    return map;
  }, [inventories]);

  // ---------- State ----------
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 250);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [discountValue, setDiscountValue] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [taxRate, setTaxRate] = useState("");

  // Modals
  const [showVariant, setShowVariant] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedInventoryItems, setSelectedInventoryItems] = useState([]);

  const [showImeiPicker, setShowImeiPicker] = useState(false);
  const [imeiTarget, setImeiTarget] = useState(null);
  const [availableUnits, setAvailableUnits] = useState([]);

  const [showCustomer, setShowCustomer] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showAdjust, setShowAdjust] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showPrinters, setShowPrinters] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSale, setLastSale] = useState(null);

  const [prefs, updatePrefs] = usePrefs();
  const { printers, defaultId, addPrinter, removePrinter, setDefaultPrinter } = usePrinters();

  // ---------- Customers ----------
  const { data: customersRes } = useGetCustomersQuery({
    search: customerSearch.trim() || undefined,
    page: 1,
    limit: 30,
  });
  const customerResults = useMemo(() => pickList(customersRes, "customers"), [customersRes]);

  // ---------- Filtered products ----------
  const filteredProducts = useMemo(() => {
    let list = products;
    if (categoryFilter) {
      list = list.filter((p) => {
        const catId = p.category?._id || p.category;
        return String(catId) === String(categoryFilter);
      });
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.barcode?.toLowerCase().includes(q) ||
          getProductBrand(p).toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, categoryFilter, debouncedSearch]);

  // ---------- Cart calculations ----------
  const cartItemCount = cart.reduce((s, i) => s + Number(i.quantity), 0);

  // Subtotal = sum of (quantity * final price after inventory discount)
  const subtotal = useMemo(
    () => cart.reduce((s, i) => s + Number(i.quantity) * Number(i.price), 0),
    [cart]
  );

  // Extra cart-level discount
  const extraDiscountAmount = useMemo(() => {
    const val = Number(discountValue) || 0;
    if (discountType === "percentage") return roundMoney((subtotal * val) / 100);
    return roundMoney(val);
  }, [subtotal, discountValue, discountType]);

  // Tax (from cart-level tax rate or from items)
  const taxAmount = useMemo(() => {
    const rate = Number(taxRate) || 0;
    return roundMoney(((subtotal - extraDiscountAmount) * rate) / 100);
  }, [subtotal, extraDiscountAmount, taxRate]);

  const grandTotal = useMemo(
    () => roundMoney(subtotal - extraDiscountAmount + taxAmount),
    [subtotal, extraDiscountAmount, taxAmount]
  );

  // ---------- Add to cart helpers ----------
  const addToCart = useCallback((product, inventory, unit = null) => {
    const originalPrice = Number(inventory?.salePrice ?? 0);
    const discountPercent = Number(inventory?.discount ?? 0); // e.g. 10
    const taxPercent = Number(inventory?.tax ?? 0);

    // Calculate discounted price
    const discountAmountPerUnit = roundMoney((originalPrice * discountPercent) / 100);
    const finalPrice = roundMoney(originalPrice - discountAmountPerUnit);

    // For serial products, quantity is always 1 and unit is unique
    if (product.trackSerial && unit) {
      const exists = cart.some((c) => c.unitId === unit._id);
      if (exists) {
        toast.error("This IMEI is already in the cart");
        return;
      }
      setCart((prev) => [
        ...prev,
        {
          id: `${product._id}-${inventory._id}-${unit._id}`,
          productId: product._id,
          inventoryId: inventory._id,
          unitId: unit._id,
          name: getProductName(product),
          sku: product.sku,
          category: getProductCategory(product),
          variant: variantLabel(inventory),
          image: getProductImage(product),
          originalPrice,          // 1000
          price: finalPrice,      // 900
          discountPercent,        // 10
          discountAmount: discountAmountPerUnit, // 100
          taxPercent,
          quantity: 1,
          imei: unit.imei,
          serialNumber: unit.serialNumber || null,
          trackSerial: true,
          maxQty: 1,
        },
      ]);
      toast.success("Added to cart");
      return;
    }

    // Non-serial
    const key = `${product._id}-${inventory._id}`;
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.id === key);
      if (idx >= 0) {
        const next = [...prev];
        const max = Number(inventory.quantity) || 999;
        if (next[idx].quantity >= max) {
          toast.error("Not enough stock");
          return prev;
        }
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [
        ...prev,
        {
          id: key,
          productId: product._id,
          inventoryId: inventory._id,
          unitId: null,
          name: getProductName(product),
          sku: product.sku,
          category: getProductCategory(product),
          variant: variantLabel(inventory),
          image: getProductImage(product),
          originalPrice,
          price: finalPrice,
          discountPercent,
          discountAmount: discountAmountPerUnit,
          taxPercent,
          quantity: 1,
          imei: null,
          serialNumber: null,
          trackSerial: false,
          maxQty: Number(inventory.quantity) || 999,
        },
      ];
    });
    toast.success("Added to cart");
  }, [cart]);

  // ---------- Product click ----------
  const handleProductClick = (product) => {
    const invs = inventoryByProduct[product._id] || [];
    if (invs.length === 0) {
      toast.error("No inventory available for this product");
      return;
    }

    if (invs.length === 1 && !product.trackSerial && !product.hasVariants) {
      addToCart(product, invs[0]);
      return;
    }

    setSelectedProduct(product);
    setSelectedInventoryItems(invs);
    setShowVariant(true);
  };

  // ---------- After selecting variant ----------
  const handleVariantSelect = async (inventory) => {
    const product = selectedProduct;
    setShowVariant(false);

    if (product.trackSerial) {
      setImeiTarget({ product, inventory });
      setShowImeiPicker(true);
      return;
    }

    addToCart(product, inventory);
  };

  // ---------- IMEI Picker data ----------
  const {
    data: unitsRes,
    isLoading: unitsLoading,
  } = useGetInventoryUnitsByProductInventoryQuery(imeiTarget?.inventory?._id, {
    skip: !imeiTarget?.inventory?._id || !showImeiPicker,
  });

  useEffect(() => {
    if (showImeiPicker && unitsRes) {
      const list = Array.isArray(unitsRes)
        ? unitsRes
        : Array.isArray(unitsRes?.data)
        ? unitsRes.data
        : Array.isArray(unitsRes?.units)
        ? unitsRes.units
        : [];
      setAvailableUnits(list.filter((u) => u.isActive !== false));
    }
  }, [unitsRes, showImeiPicker]);

  const handleImeiSelect = (unit) => {
    if (!imeiTarget) return;
    addToCart(imeiTarget.product, imeiTarget.inventory, unit);
    setShowImeiPicker(false);
    setImeiTarget(null);
    setAvailableUnits([]);
  };

  // ---------- Cart quantity ----------
  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item;
          if (item.trackSerial) return item;
          const next = item.quantity + delta;
          if (next < 1) return null;
          if (next > item.maxQty) {
            toast.error("Not enough stock");
            return item;
          }
          return { ...item, quantity: next };
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setCustomer(null);
    setDiscountValue("");
    setTaxRate("");
  };

  // ---------- Customer ----------
  const handleCreateCustomer = async (payload) => {
    try {
      const res = await createCustomer(payload).unwrap();
      const created = pickEntity(res, "customer") || res;
      setCustomer(created);
      setShowNewCustomer(false);
      toast.success("Customer created");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  // ---------- Payment ----------
  const activeMethod = PAYMENT_METHODS.find((m) => m.id === paymentMethod) || PAYMENT_METHODS[0];
  const isCash = activeMethod.kind === "cash";
  const numericPaid = Number(paidAmount) || 0;
  const changeAmount = isCash ? Math.max(0, numericPaid - grandTotal) : 0;
  const remainingAmount = Math.max(0, grandTotal - numericPaid);

  const selectMethod = (id) => {
    setPaymentMethod(id);
    if (id === "cash") setPaidAmount(String(Math.ceil(grandTotal)));
    else setPaidAmount(String(grandTotal));
  };

  const openPayment = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setPaymentMethod("cash");
    setPaidAmount(String(Math.ceil(grandTotal)));
    setShowPayment(true);
  };

  const closePayment = () => {
    if (isProcessing) return;
    setShowPayment(false);
  };

  // ---------- Complete Sale ----------
  const completeSale = async () => {
    if (isProcessing) return;
    if (cart.length === 0) return;

    if (isCash && numericPaid < grandTotal) {
      toast.error("Received amount is less than total");
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Create Sale
      const salePayload = {
        customer: customer?._id || null,
        paymentMethod: activeMethod.saleMethod,
        subtotal,
        discount: extraDiscountAmount,
        tax: taxAmount,
        totalAmount: grandTotal,
        paidAmount: isCash ? Math.min(numericPaid, grandTotal) : grandTotal,
      };

      const saleRes = await createSale(salePayload).unwrap();
      const sale = pickEntity(saleRes, "sale") || saleRes;
      const saleId = sale._id;

      // 2. Create Sale Items
      for (const item of cart) {
        await createSaleItem({
          sale: saleId,
          product: item.productId,
          productInventory: item.inventoryId,
          inventoryUnit: item.unitId || null,
          imei: item.imei || null,
          quantity: item.quantity,
          salePrice: item.price,                 // final price after discount
          discount: item.discountAmount * item.quantity, // total discount amount for this line
          tax: 0, // or calculate if needed
        }).unwrap();
      }

      // 3. Create Payment
      await createSalePayment({
        sale: saleId,
        amount: isCash ? Math.min(numericPaid, grandTotal) : grandTotal,
        paymentMethod: activeMethod.paymentMethod,
        notes: activeMethod.online ? `Online (${activeMethod.label})` : null,
      }).unwrap();

      // ===== RECEIPT DATA =====
      // Logo = Admin's logo
      // Help Line = Current logged-in user's phone (Manager or Admin)
      const isManager = user?.role?.slug === "manager";

      const receiptRecord = {
        saleNumber: sale.saleNumber || sale._id,
        date: sale.saleDate || sale.createdAt || new Date(),
        business: {
          name: user?.business?.name || user?.createdBy?.business?.name || "POS",
          type: user?.businessType?.name || user?.createdBy?.businessType?.name || "",
          address: user?.address || user?.createdBy?.address || "",
          // LOGO → Always Admin's logo
          logo: isManager
            ? user?.createdBy?.logo?.url || null
            : user?.logo?.url || null,
          // HELP LINE → Current logged-in user's phone
          phone: user?.phone || "",
        },
        cashier: user?.name,
        register: cashRegisterRes?.registerNumber || null,
        customer: customer
          ? { name: customer.name, phone: customer.phone }
          : null,
        items: cart.map((i) => ({
          name: i.name,
          category: i.category,
          variant: i.variant,
          sku: i.sku,
          imei: i.imei,
          serialNumber: i.serialNumber,
          quantity: i.quantity,
          originalPrice: i.originalPrice,
          price: i.price,
          discountPercent: i.discountPercent,
          discountAmount: i.discountAmount * i.quantity,
        })),
        subtotal,
        discount: extraDiscountAmount,
        tax: taxAmount,
        total: grandTotal,
        payment: {
          label: activeMethod.online
            ? `Online (${activeMethod.label})`
            : activeMethod.label,
          paid: isCash ? Math.min(numericPaid, grandTotal) : grandTotal,
          received: isCash ? numericPaid : grandTotal,
          change: changeAmount,
          status: "paid",
        },
      };

      setLastSale(receiptRecord);
      setShowPayment(false);
      setShowReceipt(true);
      clearCart();

      if (prefs.autoPrint) {
        printReceipt(receiptRecord);
      }

      toast.success("Sale completed successfully");
    } catch (err) {
      console.error(err);
      toast.error(getApiErrorMessage(err) || "Failed to complete sale");
    } finally {
      setIsProcessing(false);
    }
  };

  // ---------- Print ----------
  const activePrinter = printers.find((p) => p.id === defaultId);

  const printReceipt = async (record) => {
    try {
      if (activePrinter) {
        const bytes = buildEscPos(record, { cols: 48 });
        await sendToTcpPrinter(activePrinter, bytes);
        toast.success("Sent to thermal printer");
      } else {
        const html = buildReceiptHtml(record, prefs.paper);
        printHtml(html);
      }
    } catch (err) {
      toast.error(err?.message || "Print failed");
      const html = buildReceiptHtml(record, prefs.paper);
      printHtml(html);
    }
  };

  const receiptHtml = lastSale ? buildReceiptHtml(lastSale, prefs.paper) : "";

  // ---------- Quick cash buttons ----------
  const quickCash = [500, 1000, 2000, 5000, Math.ceil(grandTotal)];

  // ---------- Render ----------
  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col bg-surface lg:flex-row">
      {/* ===================== LEFT: PRODUCTS ===================== */}
      <div className="flex min-h-0 flex-1 flex-col border-r border-secondary">
        {/* Search + Categories */}
        <div className="shrink-0 space-y-3 border-b border-secondary bg-card p-3 sm:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, SKU, barcode..."
              className={`${inputCls} pl-10`}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setCategoryFilter("")}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                !categoryFilter
                  ? "bg-brand text-white"
                  : "bg-muted-action text-secondary hover:bg-muted-action-hover"
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c._id}
                type="button"
                onClick={() => setCategoryFilter(c._id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  categoryFilter === c._id
                    ? "bg-brand text-white"
                    : "bg-muted-action text-secondary hover:bg-muted-action-hover"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
          {productsLoading || inventoryLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-brand" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-secondary">
              <Package className="mb-2 h-10 w-10" />
              <p className="text-sm">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {filteredProducts.map((product) => {
                const invs = inventoryByProduct[product._id] || [];
                const totalQty = invs.reduce((s, i) => s + Number(i.quantity || 0), 0);
                const minPrice = invs.length
                  ? Math.min(...invs.map((i) => {
                      const original = Number(i.salePrice || 0);
                      const disc = Number(i.discount || 0);
                      return roundMoney(original - (original * disc) / 100);
                    }))
                  : 0;
                const img = getProductImage(product);

                return (
                  <button
                    key={product._id}
                    type="button"
                    onClick={() => handleProductClick(product)}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-primary bg-card text-left shadow-sm transition hover:border-brand hover:shadow-md"
                  >
                    <div className="relative aspect-square bg-surface">
                      {img ? (
                        <img
                          src={img}
                          alt={product.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-10 w-10 text-secondary" />
                        </div>
                      )}
                      {product.trackSerial && (
                        <span className="absolute left-2 top-2 rounded-md bg-brand/90 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          IMEI
                        </span>
                      )}
                      <span
                        className={`absolute bottom-2 right-2 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${getStockTone(
                          totalQty
                        )}`}
                      >
                        {totalQty}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-2.5">
                      <p className="line-clamp-2 text-xs font-semibold text-primary">
                        {getProductName(product)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-secondary">
                        {getProductBrand(product)}
                      </p>
                      <p className="mt-auto pt-1.5 text-sm font-bold text-brand">
                        {minPrice > 0 ? money(minPrice) : "—"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===================== RIGHT: CART ===================== */}
      <div className="flex w-full shrink-0 flex-col border-t border-secondary bg-card lg:w-[380px] lg:border-l lg:border-t-0 xl:w-[420px]">
        {/* Customer */}
        <div className="flex items-center gap-3 border-b border-secondary p-3">
          <button
            type="button"
            onClick={() => setShowCustomer(true)}
            className="flex flex-1 items-center gap-3 rounded-xl border border-primary bg-surface px-3 py-2.5 text-left transition hover:border-brand"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand">
              {customer ? (
                <span className="text-xs font-bold">{initialsOf(customer.name)}</span>
              ) : (
                <UserRound size={18} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-primary">
                {customer?.name || "Walk-in Customer"}
              </p>
              <p className="truncate text-xs text-secondary">
                {customer?.phone || "Tap to select customer"}
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCustomer(false);
              setShowNewCustomer(true);
            }}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary text-secondary transition hover:bg-muted-action hover:text-primary"
            title="Add customer"
          >
            <UserPlus size={18} />
          </button>
        </div>

        {/* Cart items */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-6 text-secondary">
              <ShoppingBag className="mb-3 h-12 w-12 opacity-40" />
              <p className="text-sm font-medium">Cart is empty</p>
              <p className="mt-1 text-xs">Tap a product to add</p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--border-secondary-color)]">
              {cart.map((item) => (
                <li key={item.id} className="flex gap-3 p-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-primary bg-surface">
                    {item.image ? (
                      <img src={item.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package size={18} className="text-secondary" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-primary">{item.name}</p>
                    <p className="text-[11px] text-secondary">
                      {item.variant}
                      {item.imei && (
                        <span className="ml-1 inline-flex items-center gap-0.5 text-brand">
                          <Smartphone size={10} />
                          {item.imei}
                        </span>
                      )}
                    </p>

                    {/* Price display with discount */}
                    <div className="mt-1 flex items-center gap-2">
                      {item.discountPercent > 0 ? (
                        <>
                          <span className="text-xs text-secondary line-through">
                            {money(item.originalPrice)}
                          </span>
                          <span className="text-sm font-bold text-brand">
                            {money(item.price)}
                          </span>
                          <span className="rounded bg-[var(--color-success)]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-success)]">
                            -{item.discountPercent}%
                          </span>
                        </>
                      ) : (
                        <span className="text-sm font-bold text-brand">
                          {money(item.price)}
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 flex items-center justify-between">
                      {item.trackSerial ? (
                        <span className="text-xs text-secondary">Qty 1</span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateQty(item.id, -1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary text-secondary hover:bg-muted-action"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQty(item.id, 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary text-secondary hover:bg-muted-action"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="self-start rounded-lg p-1.5 text-secondary hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Totals + Actions */}
        <div className="shrink-0 space-y-3 border-t border-secondary p-3">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-secondary">Subtotal</span>
              <span className="font-medium text-primary">{money(subtotal)}</span>
            </div>
            {extraDiscountAmount > 0 && (
              <div className="flex justify-between text-[var(--color-success)]">
                <span>Extra Discount</span>
                <span>− {money(extraDiscountAmount)}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-secondary">Tax</span>
                <span className="font-medium text-primary">{money(taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-secondary pt-2 text-base font-bold">
              <span>Total</span>
              <span className="text-brand">{money(grandTotal)}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setShowAdjust(true)}
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-primary text-xs font-semibold text-secondary hover:bg-muted-action"
            >
              <Percent size={14} />
              Adjust
            </button>
            <button
              type="button"
              onClick={clearCart}
              disabled={cart.length === 0}
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-primary text-xs font-semibold text-secondary hover:bg-muted-action disabled:opacity-40"
            >
              <RotateCcw size={14} />
              Clear
            </button>
            <button
              type="button"
              onClick={() => setShowPrinters(true)}
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-primary text-xs font-semibold text-secondary hover:bg-muted-action"
            >
              <Printer size={14} />
              Print
            </button>
          </div>

          <button
            type="button"
            onClick={openPayment}
            disabled={cart.length === 0}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-bold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check size={18} />
            Charge {money(grandTotal)}
          </button>
        </div>
      </div>

      {/* ===================== MODALS ===================== */}

      {/* VARIANT PICKER */}
      {showVariant && selectedProduct && (
        <Modal title={selectedProduct.name} onClose={() => setShowVariant(false)} width="max-w-md">
          <div className="space-y-2 p-4">
            {selectedInventoryItems.map((inv) => {
              const original = Number(inv.salePrice || 0);
              const disc = Number(inv.discount || 0);
              const finalPrice = roundMoney(original - (original * disc) / 100);

              return (
                <button
                  key={inv._id}
                  type="button"
                  onClick={() => handleVariantSelect(inv)}
                  className="flex w-full items-center justify-between rounded-xl border border-primary p-3 text-left transition-colors hover:bg-surface"
                >
                  <div>
                    <p className="text-sm font-semibold">{variantLabel(inv)}</p>
                    <p className="text-[11px] text-secondary">
                      {Number(inv.quantity)} in stock
                      {disc > 0 && ` · ${disc}% off`}
                    </p>
                  </div>
                  <div className="text-right">
                    {disc > 0 && (
                      <p className="text-xs text-secondary line-through">{money(original)}</p>
                    )}
                    <p className="text-sm font-bold text-brand">{money(finalPrice)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </Modal>
      )}

      {/* IMEI PICKER */}
      {showImeiPicker && imeiTarget && (
        <Modal
          title={`Select IMEI — ${imeiTarget.product.name}`}
          onClose={() => {
            setShowImeiPicker(false);
            setImeiTarget(null);
          }}
          width="max-w-md"
        >
          <div className="space-y-2 p-4">
            {unitsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-brand" />
              </div>
            ) : availableUnits.length === 0 ? (
              <p className="py-8 text-center text-sm text-secondary">
                No available IMEIs for this variant.
              </p>
            ) : (
              availableUnits.map((unit) => (
                <button
                  key={unit._id}
                  type="button"
                  onClick={() => handleImeiSelect(unit)}
                  className="flex w-full items-center gap-3 rounded-xl border border-primary p-3 text-left transition hover:bg-surface"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <Smartphone size={18} />
                  </div>
                  <div>
                    <p className="font-mono text-sm font-semibold text-primary">{unit.imei}</p>
                    {unit.serialNumber && (
                      <p className="text-xs text-secondary">S/N: {unit.serialNumber}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </Modal>
      )}

      {/* CUSTOMER SELECT */}
      {showCustomer && (
        <Modal
          title="Select customer"
          onClose={() => setShowCustomer(false)}
          width="max-w-md"
          footer={
            <button
              type="button"
              onClick={() => {
                setShowCustomer(false);
                setShowNewCustomer(true);
              }}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white hover:bg-brand-hover"
            >
              <UserPlus size={16} /> Add new customer
            </button>
          }
        >
          <div className="space-y-3 p-4">
            <input
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Search name, phone or email…"
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => {
                setCustomer(null);
                setShowCustomer(false);
              }}
              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                !customer ? "border-brand bg-brand/8" : "border-primary hover:bg-surface"
              }`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted-action text-secondary">
                <UserRound size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold">Walk-in Customer</p>
                <p className="text-xs text-secondary">No customer details</p>
              </div>
            </button>
            {customerResults.map((c) => (
              <button
                key={c._id}
                type="button"
                onClick={() => {
                  setCustomer(c);
                  setShowCustomer(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                  customer?._id === c._id ? "border-brand bg-brand/8" : "border-primary hover:bg-surface"
                }`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                  {initialsOf(c.name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{c.name}</p>
                  <p className="truncate text-xs text-secondary">
                    {c.phone || c.email || "No contact info"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {showNewCustomer && (
        <Modal
          title="Add new customer"
          onClose={() => setShowNewCustomer(false)}
          width="max-w-2xl"
          z="z-[60]"
        >
          <div className="p-5">
            <CustomerForm
              onSubmit={handleCreateCustomer}
              onCancel={() => setShowNewCustomer(false)}
              submitting={creatingCustomer}
            />
          </div>
        </Modal>
      )}

      {/* DISCOUNT & TAX */}
      {showAdjust && (
        <Modal
          title="Extra Discount & Tax"
          onClose={() => setShowAdjust(false)}
          width="max-w-md"
          footer={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setDiscountValue("");
                  setTaxRate("");
                  setShowAdjust(false);
                }}
                className="h-11 flex-1 rounded-xl border border-primary text-sm font-semibold hover:bg-surface"
              >
                Remove all
              </button>
              <button
                type="button"
                onClick={() => setShowAdjust(false)}
                className="h-11 flex-1 rounded-xl bg-brand text-sm font-semibold text-white hover:bg-brand-hover"
              >
                Apply
              </button>
            </div>
          }
        >
          <div className="space-y-4 p-5">
            <div>
              <p className="mb-1.5 text-xs font-semibold text-secondary">Extra Discount</p>
              <div className="mb-2 grid grid-cols-2 gap-2 rounded-xl bg-muted-action p-1">
                {[
                  ["percentage", "Percentage %"],
                  ["fixed", "Fixed amount"],
                ].map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setDiscountType(v)}
                    className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
                      discountType === v ? "bg-card text-primary shadow-sm" : "text-secondary"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="0"
                inputMode="decimal"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === "percentage" ? "e.g. 10" : "e.g. 500"}
                className={inputCls}
              />
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold text-secondary">Tax rate (%)</p>
              <input
                type="number"
                min="0"
                max="100"
                inputMode="decimal"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="e.g. 5"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5 rounded-xl bg-surface p-3">
              <SummaryRow label="Subtotal" value={money(subtotal)} />
              <SummaryRow label="Extra Discount" value={`− ${money(extraDiscountAmount)}`} />
              <SummaryRow label="Tax" value={money(taxAmount)} />
              <SummaryRow strong label="New total" value={money(grandTotal)} />
            </div>
          </div>
        </Modal>
      )}

      {/* PAYMENT */}
      {showPayment && (
        <Modal
          title="Complete payment"
          width="max-w-3xl"
          onClose={closePayment}
          footer={
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closePayment}
                disabled={isProcessing}
                className="h-11 rounded-xl border border-primary px-6 text-sm font-semibold hover:bg-surface disabled:opacity-50 sm:w-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={completeSale}
                disabled={isProcessing || (isCash && numericPaid < grandTotal)}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-8 text-sm font-bold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-56"
              >
                {isProcessing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                {isProcessing ? "Processing…" : "Complete sale"}
              </button>
            </div>
          }
        >
          <div className="border-b border-secondary bg-surface px-5 py-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs text-secondary">Amount due</p>
                <p className="text-3xl font-extrabold tracking-tight tabular-nums">
                  {money(grandTotal)}
                </p>
              </div>
              <div className="text-right text-xs text-secondary">
                <p className="font-semibold text-primary">
                  {customer?.name || "Walk-in Customer"}
                </p>
                <p>{cartItemCount} items</p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 p-5 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <p className="mb-2 text-xs font-semibold text-secondary">Payment method</p>
              <div className="space-y-2">
                {PAYMENT_METHODS.map((m) => (
                  <MethodTile
                    key={m.id}
                    method={m}
                    active={paymentMethod === m.id}
                    onSelect={() => selectMethod(m.id)}
                    disabled={isProcessing}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4 lg:col-span-3">
              {isCash ? (
                <div className="space-y-3 rounded-2xl border border-primary bg-surface p-4">
                  <label className="block text-sm font-semibold" htmlFor="pos-received">
                    Amount received
                  </label>
                  <input
                    id="pos-received"
                    autoFocus
                    type="number"
                    min="0"
                    inputMode="decimal"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder="0"
                    className={`${inputCls} h-12 text-lg font-semibold`}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPaidAmount(String(Math.ceil(grandTotal)))}
                      className="rounded-lg border border-primary bg-card px-3 py-1.5 text-xs font-semibold hover:border-brand"
                    >
                      Exact
                    </button>
                    {quickCash
                      .filter((v) => v !== Math.ceil(grandTotal))
                      .map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setPaidAmount(String(v))}
                          className="rounded-lg border border-primary bg-card px-3 py-1.5 text-xs font-semibold hover:border-brand"
                        >
                          {money(v)}
                        </button>
                      ))}
                  </div>
                  <div className="space-y-1.5 border-t border-secondary pt-3">
                    <SummaryRow
                      label="Remaining"
                      value={money(remainingAmount)}
                      tone={remainingAmount > 0 ? "text-[var(--color-danger)]" : "text-primary"}
                    />
                    <SummaryRow
                      label="Change to return"
                      value={money(changeAmount)}
                      tone="text-[var(--color-success)]"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 rounded-2xl border border-primary bg-surface p-4">
                  <p className="text-sm font-semibold text-primary">
                    Online — {activeMethod.label}
                  </p>
                  <p className="text-sm text-secondary">
                    Confirm the customer paid <b className="text-primary">{money(grandTotal)}</b>{" "}
                    via {activeMethod.label}, then press <b>Complete sale</b>.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* RECEIPT */}
      {showReceipt && lastSale && (
        <Modal
          title="Sale completed"
          width="max-w-2xl"
          onClose={() => setShowReceipt(false)}
          footer={
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => printReceipt(lastSale)}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-primary text-sm font-semibold hover:bg-surface"
              >
                <Printer size={16} /> Print receipt
              </button>
              <button
                type="button"
                onClick={() => setShowReceipt(false)}
                className="h-11 flex-1 rounded-xl bg-brand text-sm font-bold text-white hover:bg-brand-hover"
              >
                New sale
              </button>
            </div>
          }
        >
          <div className="grid gap-5 p-5 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-success)]/12 text-[var(--color-success)]">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="text-lg font-bold">Payment successful</h3>
                <p className="text-xs text-secondary">Sale {lastSale.saleNumber}</p>
              </div>

              <div className="space-y-1.5 rounded-2xl border border-primary bg-surface p-4">
                <SummaryRow label="Customer" value={lastSale.customer?.name || "Walk-in Customer"} />
                <SummaryRow label="Payment" value={lastSale.payment.label} />
                <SummaryRow
                  label="Items"
                  value={lastSale.items.reduce((s, i) => s + Number(i.quantity), 0)}
                />
                <div className="border-t border-secondary pt-2">
                  <SummaryRow strong label="Sale total" value={money(lastSale.total)} />
                </div>
              </div>
            </div>

            <div className="flex justify-center rounded-2xl bg-muted-action p-3">
              <iframe
                title="Receipt preview"
                srcDoc={receiptHtml}
                className="rounded-md bg-white shadow-lg"
                style={{
                  width: prefs.paper === "58" ? "58mm" : "80mm",
                  height: 460,
                  border: 0,
                }}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* PRINTERS */}
      {showPrinters && (
        <Modal title="Printers" onClose={() => setShowPrinters(false)} width="max-w-md">
          <div className="space-y-4 p-5">
            <p className="text-sm text-secondary">
              Default: {activePrinter ? `${activePrinter.name}` : "Browser print dialog"}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["80", "80 mm"],
                ["58", "58 mm"],
              ].map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => updatePrefs({ paper: v })}
                  className={`rounded-lg py-2 text-xs font-semibold ${
                    prefs.paper === v ? "bg-brand text-white" : "bg-muted-action text-secondary"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <label className="flex items-center justify-between text-sm">
              <span>Auto-print after sale</span>
              <input
                type="checkbox"
                checked={prefs.autoPrint}
                onChange={(e) => updatePrefs({ autoPrint: e.target.checked })}
                className="h-4 w-4 accent-[var(--action-primary)]"
              />
            </label>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* =====================================================================
   SMALL UI COMPONENTS
===================================================================== */

function Modal({ title, onClose, children, width = "max-w-lg", footer, z = "z-50" }) {
  return (
    <div className={`fixed inset-0 ${z} flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4`}>
      <div className={`flex max-h-[calc(100dvh-2rem)] w-full ${width} flex-col overflow-hidden rounded-2xl border border-primary bg-card shadow-2xl`}>
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-secondary px-4 py-4 sm:px-5">
          <h2 className="text-lg font-bold text-primary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-secondary transition hover:bg-muted-action hover:text-primary"
          >
            <X size={20} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && (
          <div className="shrink-0 border-t border-secondary p-4">{footer}</div>
        )}
      </div>
    </div>
  );
}

function MethodTile({ method, active, onSelect, disabled }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
        active ? "border-brand bg-brand/8" : "border-primary hover:bg-surface"
      } disabled:opacity-50`}
    >
      {method.logo()}
      <div>
        <p className="text-sm font-semibold text-primary">{method.label}</p>
        <p className="text-xs text-secondary">{method.hint}</p>
      </div>
      {active && <Check className="ml-auto h-5 w-5 text-brand" />}
    </button>
  );
}

function SummaryRow({ label, value, strong, tone }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className={strong ? "font-semibold text-primary" : "text-secondary"}>{label}</span>
      <span className={`font-mono ${strong ? "font-semibold text-primary" : ""} ${tone || "text-primary"}`}>
        {value}
      </span>
    </div>
  );
}