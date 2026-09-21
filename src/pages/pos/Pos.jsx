import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Banknote,
  Calculator,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Landmark,
  Loader2,
  Minus,
  Package,
  Pause,
  Percent,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Trash2,
  UserPlus,
  UserRound,
  Wifi,
  X,
  XCircle,
} from "lucide-react";

import { selectCurrentUser } from "../../features/auth/authSlice";
import { getApiErrorMessage } from "../../utils/apiError";
import { API_BASE_URL } from "../../config/api";
import { useGetProductsQuery } from "../../features/products/productApi";
import { useGetProductInventoryQuery } from "../../features/products/productInventoryApi";
import { useGetCategoriesQuery } from "../../features/category/categoryApi";
import {
  useGetCustomersQuery,
  useCreateCustomerMutation,
} from "../../features/customer/customerApi";
import { useGetCurrentCashRegisterQuery } from "../../features/cashRegister/cashRegisterApi";
import {
  useCreateSaleMutation,
  useUpdateSaleMutation,
} from "../../features/sales/saleApi";
import { useCreateSaleItemMutation } from "../../features/sales/saleItemApi";
import { useCreateSalePaymentMutation } from "../../features/sales/salePaymentApi";
import {
  useCreatePaymentMutation,
  useCapturePaymentMutation,
  useCancelPaymentMutation,
  useLazyGetPaymentStatusQuery,
} from "../../features/payments/paymentApi";
import CustomerForm from "../customer/CustomerForm";

/* =====================================================================
   CONFIG
===================================================================== */

const CURRENCY = "PKR";

// Currency: the backend converts PKR -> USD for PayPal by itself. The POS only
// sends { saleId, amount } and the backend builds the return / cancel URLs.

// Which methods are wired to a REAL backend gateway (create -> approve ->
// capture -> status). Only PayPal exists in the backend today.
// When you add JazzCash / EasyPaisa / Card to the backend with the same
// endpoints (POST /payment/create accepting `gateway`, GET /payment/:id,
// POST /payment/:id/capture), just flip the flag to true — the whole live
// flow below (pop-up, auto status polling, capture, receipt) already works.
const LIVE_GATEWAYS = {
  paypal: true,
  card: false,
  jazzcash: false,
  easypaisa: false,
};

const POLL_MS = 3000;
const PENDING_KEY = "pos_gateway_pending";
const PREFS_KEY = "pos_receipt_prefs";
const CHANNEL = "pos-gateway";
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
const getProductSku = (p) => p?.sku || "—";
const getProductBrand = (p) => nameOf(p?.brand);
const getProductCategory = (p) => nameOf(p?.category, "Uncategorized");

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
        /* storage unavailable */
      }
      return next;
    });
  return [prefs, update];
}

const inputCls =
  "w-full rounded-xl border border-primary bg-card px-3 py-2.5 text-sm text-primary outline-none transition placeholder:text-secondary focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:opacity-60";

/* =====================================================================
   BRAND LOGOS (simplified inline marks — swap in official brand assets
   from each provider's brand kit for production)
===================================================================== */

function LogoBox({ children, wide = false }) {
  return (
    <span
      className={`flex h-10 shrink-0 items-center justify-center rounded-lg border border-black/10 bg-white px-2 shadow-sm ${wide ? "w-24" : "w-16"
        }`}
    >
      {children}
    </span>
  );
}

const VisaMark = () => (
  <svg viewBox="0 0 60 20" className="h-4 w-auto" aria-label="Visa">
    <text x="30" y="16" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontStyle="italic" fontSize="19" fill="#1A1F71">
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

const PayPalMark = () => (
  <svg viewBox="0 0 72 20" className="h-4 w-auto" aria-label="PayPal">
    <text x="36" y="15" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="800" fontStyle="italic" fontSize="16">
      <tspan fill="#003087">Pay</tspan>
      <tspan fill="#009CDE">Pal</tspan>
    </text>
  </svg>
);

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
   mode: cash | terminal | wallet | manual | gateway
===================================================================== */

const PAYMENT_METHODS = [
  {
    id: "cash",
    label: "Cash",
    hint: "Collect cash at the counter",
    kind: "cash",
    backend: "cash",
    logo: () => (
      <LogoBox>
        <Banknote className="h-5 w-5 text-[#16a34a]" />
      </LogoBox>
    ),
  },
  {
    id: "card",
    label: "Debit / Credit Card",
    hint: "Visa & Mastercard",
    kind: "terminal",
    backend: "card",
    logo: () => (
      <LogoBox wide>
        <CardLogos />
      </LogoBox>
    ),
  },
  {
    id: "jazzcash",
    label: "JazzCash",
    hint: "Mobile wallet",
    kind: "wallet",
    backend: "other",
    logo: () => (
      <LogoBox wide>
        <JazzCashMark />
      </LogoBox>
    ),
  },
  {
    id: "easypaisa",
    label: "Easypaisa",
    hint: "Mobile wallet",
    kind: "wallet",
    backend: "other",
    logo: () => (
      <LogoBox wide>
        <EasyPaisaMark />
      </LogoBox>
    ),
  },
  {
    id: "paypal",
    label: "PayPal",
    hint: "Secure online checkout",
    kind: "gateway",
    backend: "online",
    logo: () => (
      <LogoBox wide>
        <PayPalMark />
      </LogoBox>
    ),
  },
  {
    id: "bank",
    label: "Bank Transfer",
    hint: "IBFT / Raast / deposit",
    kind: "manual",
    backend: "bank",
    logo: () => (
      <LogoBox>
        <Landmark className="h-5 w-5 text-[#1d4ed8]" />
      </LogoBox>
    ),
  },
];

const getMode = (m) => (LIVE_GATEWAYS[m.id] ? "gateway" : m.kind);

/* =====================================================================
   RECEIPT (thermal printer) — one HTML template used for both the
   on-screen preview and the real print job.
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
        i.batch ? `Batch ${i.batch}` : "",
      ]
        .filter(Boolean)
        .join(" • ");
      return `<div class="item">
        <div class="nm">${esc(i.name)}</div>
        ${meta ? `<div class="sub">${esc(meta)}</div>` : ""}
        <div class="row"><span>${esc(i.quantity)} x ${esc(money(i.price))}</span><span>${esc(money(i.quantity * i.price))}</span></div>
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
</style></head><body>
<div class="c"><div class="biz">${esc(b.name || "Sale Receipt")}</div>
${b.type ? `<div class="muted">${esc(b.type)}</div>` : ""}
${b.address ? `<div class="muted">${esc(b.address)}</div>` : ""}
${b.phone ? `<div class="muted">Tel: ${esc(b.phone)}</div>` : ""}
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
   THERMAL PRINTER — ESC/POS over TCP (network printers, port 9100)
   A browser cannot open raw TCP sockets, so the bytes are handed to a
   bridge: the Electron desktop app (window.posPrinter.printTcp) or your
   backend (POST /api/printer/print). If neither works, the browser print
   dialog is used as a fallback.
===================================================================== */

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;
const HOST_RE = /^(?:(?:\d{1,3}\.){3}\d{1,3}|[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?)$/;

// Most thermal printers only understand basic ASCII by default.
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
  const align = (n) => raw(ESC, 0x61, n); // 0 left, 1 center, 2 right
  const bold = (on) => raw(ESC, 0x45, on ? 1 : 0);
  const size = (n) => raw(GS, 0x21, n); // 0x00 normal, 0x01 tall, 0x11 big
  const rule = () => ln("-".repeat(cols));
  const rows = (l, v) => twoCol(l, v, cols).forEach((x) => ln(x));
  const b = r.business || {};
  const p = r.payment;

  raw(ESC, 0x40); // initialise
  if (drawer) raw(ESC, 0x70, 0x00, 0x19, 0xfa); // open cash drawer

  align(1);
  bold(true);
  size(0x11);
  wrapText((b.name || "Sale Receipt").toUpperCase(), Math.floor(cols / 2)).forEach((l) => ln(l));
  size(0x00);
  bold(false);
  [b.type, b.address, b.phone ? `Tel: ${b.phone}` : ""].filter(Boolean).forEach((t) => wrapText(t, cols).forEach((l) => ln(l)));
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
    const meta = [i.category, i.variant && i.variant !== "Standard" ? i.variant : "", i.sku ? `SKU ${i.sku}` : "", i.batch ? `Batch ${i.batch}` : ""]
      .filter(Boolean)
      .join(" | ");
    if (meta) wrapText(meta, cols).forEach((l) => ln(l));
    rows(`${i.quantity} x ${money(i.price)}`, money(i.quantity * i.price));
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
  align(0);
  raw(LF, LF, LF);
  if (cut) raw(GS, 0x56, 0x42, 0x00); // feed + partial cut

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

  // 1) Electron desktop app bridge
  if (window.posPrinter?.printTcp) {
    await window.posPrinter.printTcp(payload);
    return;
  }

  // 2) Backend bridge (Express opens the TCP socket to the printer)
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

const buildTestRecord = (user) => ({
  saleNumber: "TEST-0001",
  date: new Date(),
  business: { name: user?.business?.name || "POS Printer Test" },
  cashier: user?.name,
  customer: null,
  items: [{ name: "Test item", category: "Test", variant: "Standard", sku: "SKU-1", quantity: 2, price: 100 }],
  subtotal: 200,
  discount: 0,
  tax: 0,
  total: 200,
  payment: { label: "Cash", paid: 200, received: 200, change: 0, status: "paid" },
});

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

function PrintersModal({ printers, defaultId, onAdd, onRemove, onDefault, onTest, onClose }) {
  const blank = { name: "", host: "", port: "9100", paper: "80", drawer: false };
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const [testing, setTesting] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const submit = () => {
    const host = form.host.trim();
    const port = Number(form.port);
    if (!form.name.trim()) return setError("Enter a printer name.");
    if (!HOST_RE.test(host)) return setError("Enter a valid IP address or host name, e.g. 192.168.1.50.");
    if (!Number.isInteger(port) || port < 1 || port > 65535) return setError("Port must be 1–65535 (thermal printers normally use 9100).");
    onAdd({ name: form.name.trim(), host, port, paper: form.paper, drawer: form.drawer });
    setForm(blank);
    setError("");
  };

  const runTest = async (p) => {
    setTesting(p.id);
    await onTest(p);
    setTesting(null);
  };

  const rowCls = (on) => `flex items-center gap-3 rounded-xl border p-3 ${on ? "border-brand bg-brand/8" : "border-primary"}`;

  return (
    <Modal title="Receipt printers" width="max-w-2xl" onClose={onClose}>
      <div className="space-y-5 p-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-secondary">Saved printers</p>

          <button type="button" onClick={() => onDefault(null)} className={`${rowCls(!defaultId)} w-full text-left`}>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted-action text-secondary"><Printer size={16} /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">Browser print dialog</span>
              <span className="block text-xs text-secondary">Any printer installed in the operating system</span>
            </span>
            {!defaultId && <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-white">Default</span>}
          </button>

          {printers.map((p) => (
            <div key={p.id} className={rowCls(defaultId === p.id)}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand"><Wifi size={16} /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{p.name}</span>
                <span className="block truncate text-xs text-secondary">{p.host}:{p.port} • {p.paper} mm{p.drawer ? " • cash drawer" : ""}</span>
              </span>
              {defaultId === p.id ? (
                <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-white">Default</span>
              ) : (
                <button type="button" onClick={() => onDefault(p.id)} className="rounded-lg border border-primary px-2.5 py-1.5 text-xs font-semibold hover:bg-surface">Use</button>
              )}
              <button type="button" onClick={() => runTest(p)} disabled={testing === p.id} className="flex items-center gap-1 rounded-lg border border-primary px-2.5 py-1.5 text-xs font-semibold hover:bg-surface disabled:opacity-60">
                {testing === p.id ? <Loader2 size={12} className="animate-spin" /> : <Printer size={12} />} Test
              </button>
              <button type="button" onClick={() => onRemove(p.id)} aria-label={`Remove ${p.name}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-secondary hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>

        <div className="space-y-3 rounded-2xl border border-primary bg-surface p-4">
          <p className="text-sm font-semibold">Add network (TCP) printer</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={form.name} onChange={set("name")} placeholder="Name, e.g. Counter printer" className={inputCls} />
            <input value={form.host} onChange={set("host")} placeholder="IP address, e.g. 192.168.1.50" className={inputCls} />
            <input value={form.port} onChange={set("port")} inputMode="numeric" placeholder="Port (9100)" className={inputCls} />
            <select value={form.paper} onChange={set("paper")} className={inputCls}>
              <option value="80">80 mm paper (48 chars)</option>
              <option value="58">58 mm paper (32 chars)</option>
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={form.drawer} onChange={set("drawer")} className="h-4 w-4 accent-[var(--action-primary)]" />
            Open cash drawer on cash sales
          </label>
          {error && <p className="text-xs font-medium text-[var(--color-danger)]">{error}</p>}
          <button type="button" onClick={submit} className="flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover">
            <Plus size={15} /> Add printer
          </button>
          <p className="text-[11px] leading-relaxed text-secondary">
            Printing goes through the desktop app or your backend (<code>/api/printer/print</code>), which opens the TCP connection to the printer. Give the printer a fixed IP address and keep this computer on the same network.
          </p>
        </div>
      </div>
    </Modal>
  );
}

/* =====================================================================
   SMALL UI COMPONENTS
===================================================================== */

function Modal({ title, children, onClose, width = "max-w-lg", z = "z-50", footer }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={`fixed inset-0 ${z} flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-4`}>
      <div className={`flex max-h-[94vh] w-full ${width} flex-col overflow-hidden rounded-t-3xl border border-primary bg-card shadow-2xl sm:rounded-2xl`}>
        <div className="flex shrink-0 items-center justify-between border-b border-secondary px-5 py-4">
          <h2 className="text-base font-bold text-primary">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-surface hover:text-primary">
            <X size={17} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="shrink-0 border-t border-secondary bg-card px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    paid: ["Paid", "text-[var(--color-success)] bg-[var(--color-success)]/12"],
    pending: ["Pending", "text-[var(--color-warning)] bg-[var(--color-warning)]/12"],
    approved: ["Approved", "text-[var(--color-info)] bg-[var(--color-info)]/12"],
    unpaid: ["Unpaid", "text-[var(--color-danger)] bg-[var(--color-danger)]/12"],
    failed: ["Failed", "text-[var(--color-danger)] bg-[var(--color-danger)]/12"],
    cancelled: ["Cancelled", "text-secondary bg-muted-action"],
  };
  const [label, cls] = map[status] || map.pending;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cls}`}>{label}</span>;
}

function QuantityControl({ quantity, onDecrease, onIncrease }) {
  return (
    <div className="flex items-center rounded-xl border border-primary bg-card">
      <button type="button" onClick={onDecrease} aria-label="Decrease quantity" className="flex h-8 w-8 items-center justify-center rounded-l-xl text-secondary transition-colors hover:bg-surface hover:text-primary">
        <Minus size={14} />
      </button>
      <span className="w-9 text-center text-sm font-semibold tabular-nums text-primary">{quantity}</span>
      <button type="button" onClick={onIncrease} aria-label="Increase quantity" className="flex h-8 w-8 items-center justify-center rounded-r-xl text-secondary transition-colors hover:bg-surface hover:text-primary">
        <Plus size={14} />
      </button>
    </div>
  );
}

function SummaryRow({ label, value, strong, tone }) {
  return (
    <div className={`flex items-center justify-between ${strong ? "text-base font-bold" : "text-[13px]"}`}>
      <span className={strong ? "text-primary" : "text-secondary"}>{label}</span>
      <span className={`tabular-nums ${tone || "text-primary"} ${strong ? "" : "font-medium"}`}>{value}</span>
    </div>
  );
}

function MethodTile({ method, active, onSelect, disabled }) {
  const mode = getMode(method);
  const live = mode === "gateway";
  const Logo = method.logo;
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all disabled:opacity-50 ${active ? "border-brand bg-brand/8 ring-2 ring-brand/20" : "border-primary bg-card hover:border-brand/40 hover:bg-surface"
        }`}
    >
      <Logo />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-primary">{method.label}</span>
        <span className="block truncate text-[11px] text-secondary">{method.hint}</span>
      </span>
      {live && <span className="hidden rounded-full bg-[var(--color-success)]/12 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-success)] sm:inline">Live</span>}
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${active ? "border-brand bg-brand text-white" : "border-primary"}`}>
        {active && <Check size={12} />}
      </span>
    </button>
  );
}

function ProductCard({ product, inventoryItems, onAdd }) {
  const active = inventoryItems.filter((i) => i.isActive !== false);
  const totalStock = active.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
  const prices = active.map((i) => Number(i.salePrice)).filter((p) => p > 0);
  const min = prices.length ? Math.min(...prices) : Number(product.salePrice) || 0;
  const hasRange = prices.length > 1 && Math.max(...prices) > min;

  return (
    <button
      type="button"
      onClick={() => onAdd(product, inventoryItems)}
      disabled={totalStock <= 0}
      className="group flex flex-col overflow-hidden rounded-2xl border border-primary bg-card text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 disabled:hover:shadow-none"
    >
      <div className="relative flex h-24 items-center justify-center overflow-hidden border-b border-secondary bg-surface sm:h-28">
        {product?.images?.[0]?.url ? (
          <img src={product.images[0].url} alt={product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-base font-bold text-brand">{initialsOf(product.name)}</div>
        )}
        <span className="absolute left-2 top-2 max-w-[60%] truncate rounded-lg bg-card/90 px-2 py-0.5 text-[10px] font-semibold text-secondary shadow-sm backdrop-blur">{getProductBrand(product)}</span>
        <span className={`absolute right-2 top-2 rounded-lg px-2 py-0.5 text-[10px] font-semibold ${getStockTone(totalStock, active[0]?.minStock)}`}>{totalStock <= 0 ? "Out" : totalStock}</span>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="line-clamp-2 min-h-[2.5rem] text-[13px] font-semibold leading-tight text-primary sm:text-sm">{getProductName(product)}</p>
        <p className="mt-0.5 truncate text-[11px] text-secondary">{getProductCategory(product)}</p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2.5">
          <div className="min-w-0">
            {hasRange && <p className="text-[10px] text-secondary">From</p>}
            <p className="truncate text-sm font-bold text-primary sm:text-base">{money(min)}</p>
          </div>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-white transition-colors group-hover:bg-brand-hover">
            <Plus size={15} />
          </span>
        </div>
      </div>
    </button>
  );
}

/* Live gateway tracker — shows Pending -> Approved -> Paid automatically */
const TRACK_STEPS = ["Sale created", "Waiting for customer", "Payment verified", "Sale completed"];
const TRACK_INDEX = { creating: 0, waiting: 1, approved: 2, capturing: 2, finalizing: 3 };

function GatewayTracker({ gateway, method, total, onOpen, onCheck, onCancel, onRetry, onBack }) {
  const failed = gateway.phase === "failed" || gateway.phase === "cancelled";
  const current = TRACK_INDEX[gateway.phase] ?? 0;
  const badge = failed
    ? gateway.phase
    : gateway.phase === "finalizing"
      ? "paid"
      : gateway.phase === "approved" || gateway.phase === "capturing"
        ? "approved"
        : "pending";
  const Logo = method?.logo;

  return (
    <div className="space-y-5 p-5">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary bg-surface p-4">
        <div className="flex min-w-0 items-center gap-3">
          {Logo && <Logo />}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-primary">{method?.label} payment</p>
            <p className="text-xs text-secondary">
              {gateway.saleNumber ? `Sale ${gateway.saleNumber} • ` : ""}
              {money(total)}
              {gateway.gatewayAmount ? ` • Customer pays ${gateway.gatewayCurrency} ${Number(gateway.gatewayAmount).toFixed(2)}` : ""}
            </p>
          </div>
        </div>
        <StatusBadge status={badge} />
      </div>

      {failed ? (
        <div className="flex items-start gap-3 rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/8 p-4">
          <XCircle className="mt-0.5 shrink-0 text-[var(--color-danger)]" size={20} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary">{gateway.phase === "cancelled" ? "Payment cancelled" : "Payment not completed"}</p>
            <p className="mt-0.5 text-xs text-secondary">{gateway.message || "The customer did not complete the payment."}</p>
            <p className="mt-2 text-xs font-medium text-[var(--color-danger)]">Status: Unpaid — the sale is kept as a draft and no money was recorded.</p>
          </div>
        </div>
      ) : (
        <ol className="space-y-3">
          {TRACK_STEPS.map((label, i) => {
            const done = i < current;
            const active = i === current;
            return (
              <li key={label} className="flex items-center gap-3">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-[var(--color-success)] text-white" : active ? "bg-brand text-white" : "bg-muted-action text-secondary"}`}>
                  {done ? <Check size={14} /> : active ? <Loader2 size={14} className="animate-spin" /> : i + 1}
                </span>
                <span className={`text-sm ${active ? "font-semibold text-primary" : done ? "text-primary" : "text-secondary"}`}>{label}</span>
              </li>
            );
          })}
        </ol>
      )}

      {!failed && (
        <p className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-xs text-secondary">
          <Clock size={14} className="shrink-0" />
          {gateway.message || "Checking the payment status automatically every few seconds…"}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        {failed ? (
          <>
            <button type="button" onClick={onRetry} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover">
              <RotateCcw size={15} /> Try again
            </button>
            <button type="button" onClick={onBack} className="flex h-11 flex-1 items-center justify-center rounded-xl border border-primary bg-card text-sm font-semibold text-primary transition-colors hover:bg-surface">
              Choose another method
            </button>
          </>
        ) : (
          <>
            {gateway.approvalUrl && (
              <button type="button" onClick={onOpen} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-primary bg-card text-sm font-semibold text-primary transition-colors hover:bg-surface">
                <ExternalLink size={15} /> Open payment page
              </button>
            )}
            <button type="button" onClick={onCheck} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-primary bg-card text-sm font-semibold text-primary transition-colors hover:bg-surface">
              <RefreshCw size={15} /> Check status now
            </button>
            <button type="button" onClick={onCancel} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--color-danger)]/40 bg-card text-sm font-semibold text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)]/8">
              Cancel payment
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const IDLE = { phase: "idle" };
const ACTIVE_PHASES = ["creating", "waiting", "approved", "capturing", "finalizing"];

/* =====================================================================
   POS PAGE
===================================================================== */

export default function POS() {
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const [searchParams] = useSearchParams();
  const gatewayParam = searchParams.get("gateway");
  const returning = Boolean(gatewayParam);

  /* ---------------------------- STATE ---------------------------- */
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search);
  const [categoryId, setCategoryId] = useState("all");
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null); // null = Walk-in
  const [customerSearch, setCustomerSearch] = useState("");
  const [pendingCustomer, setPendingCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [reference, setReference] = useState("");
  const [walletNumber, setWalletNumber] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [heldOrders, setHeldOrders] = useState([]);
  const [lastSale, setLastSale] = useState(null);
  const [prefs, updatePrefs] = usePrefs();
  const { printers, defaultId, addPrinter, removePrinter, setDefaultPrinter } = usePrinters();
  const [showPrinters, setShowPrinters] = useState(false);

  const [showPayment, setShowPayment] = useState(false);
  const [showCustomer, setShowCustomer] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [showVariant, setShowVariant] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showHeld, setShowHeld] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedInventoryItems, setSelectedInventoryItems] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gateway, setGateway] = useState(IDLE);

  const searchRef = useRef(null);
  const gwRef = useRef(IDLE);
  const snapshotRef = useRef(null);
  const draftRef = useRef(null);
  const busyRef = useRef(false);
  const popupRef = useRef(null);
  const pollRef = useRef(() => { });
  gwRef.current = gateway;

  /* ---------------------------- QUERIES ---------------------------- */
  const { data: productsData, isLoading: productsLoading, isFetching: productsFetching, refetch: refetchProducts } =
    useGetProductsQuery({ search: debouncedSearch || undefined, limit: 100, isActive: true }, { skip: returning });
  const { data: inventoryData, isLoading: inventoryLoading, refetch: refetchInventory } =
    useGetProductInventoryQuery({ page: 1, limit: 200 }, { skip: returning });
  const { data: categoriesData } = useGetCategoriesQuery({ limit: 100, isActive: true }, { skip: returning });
  const { data: customersData } = useGetCustomersQuery({ limit: 100, isActive: true }, { skip: returning });
  const { data: currentRegister, isLoading: registerLoading, refetch: refetchRegister } =
    useGetCurrentCashRegisterQuery(undefined, { skip: returning });

  const [createSale] = useCreateSaleMutation();
  const [updateSale] = useUpdateSaleMutation();
  const [createSaleItem] = useCreateSaleItemMutation();
  const [createSalePayment] = useCreateSalePaymentMutation();
  const [createPayment] = useCreatePaymentMutation();
  const [capturePayment] = useCapturePaymentMutation();
  const [cancelPayment] = useCancelPaymentMutation();
  const [getPaymentStatus] = useLazyGetPaymentStatusQuery();
  const [createCustomer, { isLoading: creatingCustomer }] = useCreateCustomerMutation();

  /* ------------------------- NORMALISED DATA ------------------------- */
  const products = useMemo(() => pickList(productsData, "products"), [productsData]);
  const inventoryList = useMemo(() => pickList(inventoryData, "inventory"), [inventoryData]);
  const categories = useMemo(() => pickList(categoriesData, "categories"), [categoriesData]);
  const customers = useMemo(() => pickList(customersData, "customers"), [customersData]);

  const inventoryByProduct = useMemo(() => {
    const map = new Map();
    inventoryList.forEach((inv) => {
      const pid = inv.product?._id || inv.product || inv.productId;
      if (!pid) return;
      const key = String(pid);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(inv);
    });
    return map;
  }, [inventoryList]);

  const categoryCounts = useMemo(() => {
    const map = new Map();
    products.forEach((p) => {
      const id = String(p.category?._id || p.category || "");
      map.set(id, (map.get(id) || 0) + 1);
    });
    return map;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      if (p.isActive === false) return false;
      if (categoryId !== "all" && String(p.category?._id || p.category) !== String(categoryId)) return false;
      if (!term) return true;
      return [p.name, p.sku, p.barcode, getProductBrand(p)].some((v) => String(v || "").toLowerCase().includes(term));
    });
  }, [products, search, categoryId]);

  const customerResults = useMemo(() => {
    const term = customerSearch.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((c) => (c.name || "").toLowerCase().includes(term) || (c.phone || "").includes(term));
  }, [customers, customerSearch]);

  // Auto-select a customer that was just created but not returned by the API
  useEffect(() => {
    if (!pendingCustomer) return;
    const match = customers.find(
      (c) => c.name === pendingCustomer.name && (!pendingCustomer.phone || c.phone === pendingCustomer.phone)
    );
    if (match) {
      setCustomer(match);
      setPendingCustomer(null);
    }
  }, [customers, pendingCustomer]);

  /* ---------------------------- TOTALS ---------------------------- */
  const subtotal = useMemo(() => roundMoney(cart.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0)), [cart]);
  const discountAmount = useMemo(() => {
    const v = Number(discountValue) || 0;
    const d = discountType === "percentage" ? subtotal * (v / 100) : v;
    return roundMoney(Math.min(subtotal, Math.max(0, d)));
  }, [subtotal, discountType, discountValue]);
  const taxableAmount = Math.max(0, roundMoney(subtotal - discountAmount));
  const taxAmount = roundMoney(taxableAmount * ((Number(taxRate) || 0) / 100));
  const grandTotal = Math.max(0, roundMoney(subtotal - discountAmount + taxAmount));
  const numericPaid = Math.max(0, roundMoney(Number(paidAmount) || 0));
  const changeAmount = Math.max(0, roundMoney(numericPaid - grandTotal));
  const remainingAmount = Math.max(0, roundMoney(grandTotal - numericPaid));
  const cartItemCount = cart.reduce((s, i) => s + Number(i.quantity), 0);
  const registerOpen = Boolean(currentRegister && currentRegister.status === "open");

  const cartSignature = useMemo(
    () => `${customer?._id || "walkin"}|${cart.map((i) => `${i.cartKey}:${i.quantity}:${i.price}`).join(",")}|${discountAmount}|${taxAmount}`,
    [cart, customer, discountAmount, taxAmount]
  );

  const quickCash = useMemo(() => {
    const r = Math.ceil(grandTotal);
    return [...new Set([r, Math.ceil(r / 500) * 500, Math.ceil(r / 1000) * 1000, Math.ceil(r / 5000) * 5000])]
      .filter((v) => v >= r && v > 0)
      .sort((a, b) => a - b)
      .slice(0, 4);
  }, [grandTotal]);

  const activeMethod = PAYMENT_METHODS.find((m) => m.id === paymentMethod) || PAYMENT_METHODS[0];
  const mode = getMode(activeMethod);
  const gatewayMethod = PAYMENT_METHODS.find((m) => m.id === gateway.methodId);
  const gatewayBusy = ACTIVE_PHASES.includes(gateway.phase);

  /* -------------------------- CART ACTIONS -------------------------- */
  const addToCart = useCallback((product, inv) => {
    if (!inv) return toast.error("No inventory available for this product.");
    const available = Number(inv.quantity) || 0;
    if (available <= 0) return toast.error("This variant is out of stock.");

    const price = Number(inv.salePrice) || Number(product.salePrice) || 0;
    const cartKey = `${product._id}-${inv._id}`;

    setCart((prev) => {
      const idx = prev.findIndex((i) => i.cartKey === cartKey);
      if (idx !== -1) {
        if (prev[idx].quantity >= available) {
          toast.error(`Only ${available} units available.`);
          return prev;
        }
        const next = [...prev];
        next[idx] = { ...prev[idx], quantity: prev[idx].quantity + 1 };
        return next;
      }
      return [
        ...prev,
        {
          cartKey,
          productId: product._id,
          inventoryId: inv._id,
          name: product.name,
          sku: product.sku || inv.sku || "",
          batch: inv.batchNumber || "",
          brand: getProductBrand(product),
          category: getProductCategory(product),
          variant: variantLabel(inv),
          price,
          quantity: 1,
          availableStock: available,
        },
      ];
    });
  }, []);

  const handleProductClick = (product, items = []) => {
    const usable = items.filter((i) => i.isActive !== false && Number(i.quantity) > 0);
    if (!usable.length) return toast.error("This product is out of stock.");
    if (usable.length === 1 && !product.hasVariants) return addToCart(product, usable[0]);
    setSelectedProduct(product);
    setSelectedInventoryItems(usable);
    setSelectedVariant(usable[0]);
    setShowVariant(true);
  };

  const updateQuantity = (cartKey, qty) =>
    setCart((prev) => {
      const item = prev.find((i) => i.cartKey === cartKey);
      if (!item) return prev;
      if (qty <= 0) return prev.filter((i) => i.cartKey !== cartKey);
      if (qty > item.availableStock) {
        toast.error(`Only ${item.availableStock} units available.`);
        return prev;
      }
      return prev.map((i) => (i.cartKey === cartKey ? { ...i, quantity: qty } : i));
    });

  const resetCart = () => {
    setCart([]);
    setPaidAmount("");
    setReference("");
    setWalletNumber("");
    setDiscountValue("");
    setTaxRate("");
    setCustomer(null);
    setCartOpen(false);
  };

  const clearCart = () => {
    if (!cart.length) return;
    resetCart();
    draftRef.current = null;
    toast.success("Cart cleared.");
  };

  const holdOrder = () => {
    if (!cart.length) return toast.error("Cart is empty.");
    setHeldOrders((prev) => [
      ...prev,
      { id: `HOLD-${Date.now()}`, createdAt: new Date().toISOString(), customer, cart: [...cart], grandTotal, discountType, discountValue, taxRate },
    ]);
    resetCart();
    toast.success("Order placed on hold.");
  };

  const restoreOrder = (o) => {
    if (cart.length && !window.confirm("Replace the current cart with this held order?")) return;
    setCart(o.cart);
    setCustomer(o.customer || null);
    setDiscountType(o.discountType || "percentage");
    setDiscountValue(o.discountValue || "");
    setTaxRate(o.taxRate || "");
    setHeldOrders((prev) => prev.filter((h) => h.id !== o.id));
    setShowHeld(false);
    toast.success("Held order restored.");
  };

  const openPayment = () => {
    if (!registerOpen) return toast.error("Please open the cash register first.");
    if (!cart.length) return toast.error("Add at least one product.");
    setPaidAmount("");
    setShowPayment(true);
  };

  const selectMethod = (id) => {
    setPaymentMethod(id);
    setReference("");
    setWalletNumber("");
  };

  const applyAdjustments = () => {
    const v = Number(discountValue) || 0;
    if (v < 0) return toast.error("Discount cannot be negative.");
    if (discountType === "percentage" && v > 100) return toast.error("Percentage discount cannot exceed 100%.");
    if (discountType === "fixed" && v > subtotal) return toast.error("Discount cannot exceed the subtotal.");
    if ((Number(taxRate) || 0) < 0 || Number(taxRate) > 100) return toast.error("Tax must be between 0 and 100%.");
    setShowAdjust(false);
  };

  /* -------------------------- CUSTOMERS -------------------------- */
  const handleCreateCustomer = async (body) => {
    try {
      const res = await createCustomer(body).unwrap();
      const created = pickEntity(res, "customer");
      if (created?._id) setCustomer(created);
      else setPendingCustomer({ name: body.name, phone: body.phone });
      toast.success("Customer created and selected.");
      setShowNewCustomer(false);
      setShowCustomer(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  /* ------------------- SALE CREATION (shared) ------------------- */
  // Draft sale -> sale items. Re-used if the customer retries a payment for
  // the exact same cart, so failed/cancelled payments don't pile up drafts.
  const ensureDraftSale = async (backendMethod) => {
    if (draftRef.current && draftRef.current.signature === cartSignature) return draftRef.current;

    const saleResult = await createSale({
      customer: customer?._id || null,
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      totalAmount: grandTotal,
      paidAmount: 0,
      dueAmount: grandTotal,
      paymentMethod: backendMethod,
      status: "draft",
      notes: "",
    }).unwrap();

    const saleObj = pickEntity(saleResult, "sale");
    const saleId = saleObj?._id || saleResult?._id || saleResult?.id;
    if (!saleId) throw new Error("Sale was created but no sale ID was returned.");

    // SaleItem controller recalculates the sale from its lines, so sale-level
    // discount/tax are distributed across the lines (last line takes the rest).
    const lines = cart.map((i) => roundMoney(Number(i.price) * Number(i.quantity)));
    const cartSubtotal = roundMoney(lines.reduce((s, v) => s + v, 0));
    let usedDiscount = 0;
    let usedTax = 0;

    for (let idx = 0; idx < cart.length; idx += 1) {
      const item = cart[idx];
      const last = idx === cart.length - 1;
      const dShare = last ? roundMoney(discountAmount - usedDiscount) : roundMoney(cartSubtotal > 0 ? (discountAmount * lines[idx]) / cartSubtotal : 0);
      usedDiscount = roundMoney(usedDiscount + dShare);
      const taxableLine = Math.max(0, lines[idx] - dShare);
      const tShare = last ? roundMoney(taxAmount - usedTax) : roundMoney(taxableAmount > 0 ? (taxAmount * taxableLine) / taxableAmount : 0);
      usedTax = roundMoney(usedTax + tShare);

      await createSaleItem({
        sale: saleId,
        product: item.productId,
        productInventory: item.inventoryId,
        quantity: Number(item.quantity),
        salePrice: roundMoney(item.price),
        discount: Math.max(0, dShare),
        tax: Math.max(0, tShare),
      }).unwrap();
    }

    draftRef.current = { saleId, saleNumber: saleObj?.saleNumber || "", signature: cartSignature };
    return draftRef.current;
  };

  const buildRecord = ({ snap, method, saleId, saleNumber, reference: ref = "", walletNumber: wallet = "", received, paid, change = 0, status = "paid", gatewayCharge = "" }) => ({
    id: saleId,
    saleNumber: saleNumber || `#${String(saleId).slice(-8).toUpperCase()}`,
    date: new Date(),
    business: {
      name: user?.business?.name,
      type: user?.businessType?.name,
      address: user?.business?.address,
      phone: user?.business?.phone,
    },
    cashier: user?.name,
    register: currentRegister?.registerNumber,
    customer: snap.customer ? { name: snap.customer.name, phone: snap.customer.phone } : null,
    items: snap.cart,
    subtotal: snap.subtotal,
    discount: snap.discount,
    tax: snap.tax,
    total: snap.total,
    payment: { label: method.label, methodId: method.id, reference: ref, walletNumber: wallet, received, paid, change, status, gatewayCharge },
  });

  const snapshot = () => ({
    cart: cart.map((i) => ({ ...i })),
    customer: customer ? { _id: customer._id, name: customer.name, phone: customer.phone } : null,
    subtotal,
    discount: discountAmount,
    tax: taxAmount,
    total: grandTotal,
  });

  const activePrinter = printers.find((pr) => pr.id === defaultId) || null;

  // Prints on the chosen TCP thermal printer; falls back to the browser dialog.
  const printReceipt = async (record) => {
    const printer = activePrinter;
    if (!printer) {
      printHtml(buildReceiptHtml(record, prefs.paper));
      return;
    }
    try {
      await sendToTcpPrinter(
        printer,
        buildEscPos(record, {
          cols: printer.paper === "58" ? 32 : 48,
          cut: true,
          drawer: Boolean(printer.drawer) && record.payment.methodId === "cash",
        })
      );
      toast.success(`Receipt sent to ${printer.name}.`);
    } catch (error) {
      toast.error(`${printer.name}: ${error.message}. Opening the browser print dialog instead.`);
      printHtml(buildReceiptHtml(record, printer.paper || prefs.paper));
    }
  };

  const testPrinter = async (printer) => {
    try {
      await sendToTcpPrinter(printer, buildEscPos(buildTestRecord(user), { cols: printer.paper === "58" ? 32 : 48, cut: true }));
      toast.success(`Test page sent to ${printer.name}.`);
    } catch (error) {
      toast.error(`${printer.name}: ${error.message}`);
    }
  };

  const finishSale = (record) => {
    setLastSale(record);
    setShowPayment(false);
    setShowReceipt(true);
    resetCart();
    draftRef.current = null;
    Promise.all([refetchInventory(), refetchProducts(), refetchRegister()]).catch(() => { });
    toast.success("Sale completed successfully.");
    if (prefs.autoPrint) setTimeout(() => printReceipt(record), 400);
  };

  /* ------------------ MANUAL PAYMENTS (cash / card / wallet / bank) ------------------ */
  const completeManualSale = async () => {
    if (!cart.length) return toast.error("Add at least one product.");
    if (grandTotal <= 0) return toast.error("Sale total must be greater than zero.");
    if (mode === "cash" && numericPaid < grandTotal) return toast.error("Amount received is less than the total.");
    if (mode === "wallet" && reference.trim().length < 4) return toast.error(`Enter the ${activeMethod.label} transaction ID.`);

    setIsProcessing(true);
    try {
      const paid = mode === "cash" ? roundMoney(Math.min(numericPaid, grandTotal)) : grandTotal;
      const snap = snapshot();
      const draft = await ensureDraftSale(activeMethod.backend);

      await createSalePayment({
        sale: draft.saleId,
        customer: customer?._id || null,
        amount: paid,
        currency: CURRENCY,
        paymentMethod: activeMethod.backend,
        paymentDate: new Date().toISOString(),
        referenceNumber: reference.trim(),
        notes: mode === "wallet" ? `${activeMethod.label}${walletNumber ? ` from ${walletNumber}` : ""} • TID ${reference.trim()}` : "",
      }).unwrap();

      const updated = await updateSale({
        id: draft.saleId,
        status: "completed",
        paidAmount: paid,
        dueAmount: 0,
        paymentMethod: activeMethod.backend,
      }).unwrap();

      const saleNumber = pickEntity(updated, "sale")?.saleNumber || draft.saleNumber;
      finishSale(
        buildRecord({
          snap,
          method: activeMethod,
          saleId: draft.saleId,
          saleNumber,
          reference: reference.trim(),
          walletNumber: walletNumber.trim(),
          received: mode === "cash" ? numericPaid : paid,
          paid,
          change: mode === "cash" ? changeAmount : 0,
        })
      );
    } catch (error) {
      console.error("Complete sale error:", error);
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsProcessing(false);
    }
  };

  /* ------------------ LIVE GATEWAY PAYMENTS ------------------ */
  const persistPending = (gw, snap) => {
    try {
      sessionStorage.setItem(PENDING_KEY, JSON.stringify({ gateway: gw, snapshot: snap }));
    } catch {
      /* storage unavailable */
    }
  };
  const clearPending = () => {
    try {
      sessionStorage.removeItem(PENDING_KEY);
    } catch {
      /* storage unavailable */
    }
  };

  const openGatewayWindow = (url) => {
    const w = window.open(url, "pos_gateway", "width=520,height=740,menubar=no,toolbar=no");
    if (!w) {
      toast.error("Pop-up blocked. Use “Open payment page”.");
      return false;
    }
    popupRef.current = w;
    return true;
  };

  const startGatewayPayment = async (methodId) => {
    if (!cart.length) {
      setGateway(IDLE);
      return toast.error("Cart is empty. Start a new sale to retry this payment.");
    }
    if (grandTotal <= 0) return toast.error("Sale total must be greater than zero.");
    const method = PAYMENT_METHODS.find((m) => m.id === methodId);

    setIsProcessing(true);
    setGateway({ phase: "creating", methodId, message: "Creating the sale and payment…" });
    try {
      const draft = await ensureDraftSale("online");
      // The backend builds the return/cancel URLs and converts PKR -> USD for PayPal.
      const result = await createPayment({
        saleId: draft.saleId,
      }).unwrap();
      const pay = result?.payment || {};

      const paymentId = result?.payment?._id || result?.paymentId || result?._id;
      const approvalUrl =
        result?.approvalUrl || result?.redirectUrl || result?.links?.find((l) => l.rel === "approve")?.href;
      if (!paymentId || !approvalUrl) throw new Error(`${method?.label || "The gateway"} did not return a payment link.`);

      const snap = { ...snapshot(), methodId, saleId: draft.saleId, saleNumber: draft.saleNumber };
      snapshotRef.current = snap;
      const next = { phase: "waiting", methodId, saleId: draft.saleId, saleNumber: draft.saleNumber, paymentId, approvalUrl, gatewayAmount: pay.gatewayAmount ?? result?.gatewayAmount, gatewayCurrency: pay.gatewayCurrency ?? result?.gatewayCurrency, message: "Waiting for the customer to complete the payment…" };
      setGateway(next);
      persistPending(next, snap);
      openGatewayWindow(approvalUrl);
    } catch (error) {
      setGateway({ phase: "failed", methodId, message: getApiErrorMessage(error) });
    } finally {
      setIsProcessing(false);
    }
  };

  const finalizeGatewaySale = async (payment) => {
    const snap = snapshotRef.current;
    const gw = gwRef.current;
    if (!snap) return;
    setGateway((g) => ({ ...g, phase: "finalizing", message: "Payment received — completing the sale…" }));

    let saleNumber = gw.saleNumber;
    try {
      const updated = await updateSale({ id: gw.saleId, status: "completed", paidAmount: snap.total, dueAmount: 0, paymentMethod: "online" }).unwrap();
      saleNumber = pickEntity(updated, "sale")?.saleNumber || saleNumber;
    } catch (error) {
      toast.error(`Payment received, but the sale could not be finalised: ${getApiErrorMessage(error)}`);
    }

    const method = PAYMENT_METHODS.find((m) => m.id === snap.methodId) || PAYMENT_METHODS[4];
    const record = buildRecord({
      snap,
      method,
      saleId: gw.saleId,
      saleNumber,
      reference: payment?.transactionId || payment?.gatewayPaymentId || "",
      received: snap.total,
      paid: snap.total,
      gatewayCharge: gw.gatewayAmount ? `${gw.gatewayCurrency} ${Number(gw.gatewayAmount).toFixed(2)}` : "",
    });
    try {
      popupRef.current?.close();
    } catch {
      /* ignore */
    }
    clearPending();
    snapshotRef.current = null;
    setGateway(IDLE);
    finishSale(record);
  };

  const pollGateway = async () => {
    const gw = gwRef.current;
    if (!gw.paymentId || busyRef.current) return;
    busyRef.current = true;
    try {
      const res = await getPaymentStatus(gw.paymentId, false).unwrap();
      const payment = res?.payment || res;
      const local = String(payment?.status || "").toLowerCase();
      const remote = String(res?.paypalOrder?.status || res?.gatewayOrder?.status || payment?.gatewayStatus || "").toUpperCase();

      if (local === "completed") {
        await finalizeGatewaySale(payment);
      } else if (local === "failed" || local === "cancelled" || ["VOIDED", "CANCELLED", "DENIED", "APPROVAL_REVERSED"].includes(remote)) {
        clearPending();
        setGateway((g) => ({
          ...g,
          phase: local === "cancelled" || remote === "VOIDED" ? "cancelled" : "failed",
          message: "The payment was declined or cancelled by the customer.",
        }));
      } else if (remote === "APPROVED") {
        setGateway((g) => ({ ...g, phase: "capturing", message: "Customer approved — capturing the payment…" }));
        const cap = await capturePayment(gw.paymentId).unwrap();
        if (cap?.success || cap?.alreadyCompleted || cap?.payment?.status === "completed") {
          await finalizeGatewaySale(cap.payment || payment);
        } else if (cap?.pending) {
          setGateway((g) => ({ ...g, phase: "waiting", message: "Payment is pending confirmation from the provider…" }));
        } else {
          clearPending();
          setGateway((g) => ({ ...g, phase: "failed", message: "The payment could not be captured." }));
        }
      } else {
        setGateway((g) => (g.phase === "waiting" ? { ...g, message: "Waiting for the customer to complete the payment…" } : g));
      }
    } catch (error) {
      setGateway((g) => (ACTIVE_PHASES.includes(g.phase) ? { ...g, phase: g.phase === "capturing" ? "waiting" : g.phase, message: `Status check failed: ${getApiErrorMessage(error)}` } : g));
    } finally {
      busyRef.current = false;
    }
  };
  pollRef.current = pollGateway;

  const cancelGateway = async () => {
    const gw = gwRef.current;
    try {
      popupRef.current?.close();
    } catch {
      /* ignore */
    }
    if (gw.paymentId) {
      try {
        await cancelPayment(gw.paymentId).unwrap();
      } catch {
        /* already closed on the provider side */
      }
    }
    clearPending();
    snapshotRef.current = null;
    setGateway(IDLE);
    toast("Payment cancelled. The sale stays unpaid as a draft.");
  };

  const handleCompleteSale = () => {
    if (mode === "gateway") return startGatewayPayment(activeMethod.id);
    return completeManualSale();
  };

  /* ---------------------------- EFFECTS ---------------------------- */

  // Auto status polling while a gateway payment is open.
  useEffect(() => {
    if (!gateway.paymentId || !["waiting", "approved"].includes(gateway.phase)) return undefined;
    const id = setInterval(() => pollRef.current(), POLL_MS);
    pollRef.current();
    return () => clearInterval(id);
  }, [gateway.paymentId, gateway.phase]);

  // Instant check when the provider window reports back or the tab regains focus.
  useEffect(() => {
    if (returning) return undefined;
    let channel;
    try {
      channel = new BroadcastChannel(CHANNEL);
      channel.onmessage = () => pollRef.current();
    } catch {
      /* BroadcastChannel unsupported */
    }
    const onFocus = () => pollRef.current();
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      channel?.close();
    };
  }, [returning]);

  // Pop-up landed back on /pos?gateway=... -> tell the main window, then close.
  useEffect(() => {
    if (!returning) return;
    try {
      const ch = new BroadcastChannel(CHANNEL);
      ch.postMessage({ type: gatewayParam });
      ch.close();
    } catch {
      /* ignore */
    }
    if (window.opener) setTimeout(() => window.close(), 400);
    else navigate("/pos", { replace: true });
  }, [returning, gatewayParam, navigate]);

  // Resume a pending gateway payment after a reload / same-tab return.
  useEffect(() => {
    if (returning) return;
    try {
      const raw = sessionStorage.getItem(PENDING_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved?.gateway?.paymentId && saved?.snapshot) {
        snapshotRef.current = saved.snapshot;
        setGateway({ ...saved.gateway, phase: "waiting", message: "Resuming payment status check…" });
        setShowPayment(true);
      }
    } catch {
      /* ignore corrupted state */
    }
  }, [returning]);

  // Shortcuts: "/" focuses search, F9 opens payment.
  useEffect(() => {
    const onKey = (e) => {
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "F9") {
        e.preventDefault();
        openPayment();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const handleSearchKey = (e) => {
    if (e.key !== "Enter") return;
    const term = search.trim().toLowerCase();
    if (!term) return;
    const exact = products.find((p) => String(p.barcode || "").toLowerCase() === term || String(p.sku || "").toLowerCase() === term);
    if (exact) {
      handleProductClick(exact, inventoryByProduct.get(String(exact._id)) || []);
      setSearch("");
    }
  };

  /* ------------------------- POP-UP RETURN SCREEN ------------------------- */
  if (returning) {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3 bg-surface p-6 text-center">
        <CheckCircle2 className="text-[var(--color-success)]" size={40} />
        <p className="text-base font-semibold text-primary">{gatewayParam === "cancel" ? "Payment cancelled" : "Payment step complete"}</p>
        <p className="text-sm text-secondary">Returning to the POS… you can close this window.</p>
      </div>
    );
  }

  /* ----------------------------- RENDER ----------------------------- */
  const isLoading = productsLoading || inventoryLoading || registerLoading;
  const receiptHtml = lastSale ? buildReceiptHtml(lastSale, prefs.paper) : "";
  const actionLabel =
    mode === "gateway" ? `Continue to ${activeMethod.label}` : mode === "wallet" ? "Confirm payment" : "Complete sale";
  const showAllMethods = !gatewayBusy && gateway.phase !== "failed" && gateway.phase !== "cancelled";

  const customerCard = (
    <div className="flex items-center gap-3 rounded-2xl border border-primary bg-surface p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
        {customer ? initialsOf(customer.name) : <UserRound size={18} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-primary">{customer?.name || "Walk-in Customer"}</p>
        <p className="truncate text-xs text-secondary">{customer?.phone || (customer ? "No phone on file" : "No customer details")}</p>
      </div>
      <button type="button" onClick={() => setShowCustomer(true)} className="rounded-lg border border-primary bg-card px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-surface">
        Change
      </button>
      <button type="button" onClick={() => setShowNewCustomer(true)} aria-label="Add new customer" title="Add new customer" className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white transition-colors hover:bg-brand-hover">
        <UserPlus size={15} />
      </button>
    </div>
  );

  const cartPanel = (
    <aside className={`${cartOpen ? "fixed inset-0 z-40 flex" : "hidden"} min-h-0 flex-col bg-card lg:static lg:z-auto lg:flex lg:w-[400px] lg:shrink-0 lg:border-l lg:border-primary xl:w-[440px]`}>
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-secondary px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-primary">Current order</h2>
          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">{cartItemCount} items</span>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={holdOrder} disabled={!cart.length} className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-secondary transition-colors hover:bg-surface hover:text-primary disabled:opacity-40">
            <Pause size={14} /> Hold
          </button>
          <button type="button" onClick={clearCart} disabled={!cart.length} className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)]/10 disabled:opacity-40">
            <Trash2 size={14} /> Clear
          </button>
          <button type="button" onClick={() => setCartOpen(false)} aria-label="Close cart" className="flex h-8 w-8 items-center justify-center rounded-lg text-secondary hover:bg-surface lg:hidden">
            <X size={17} />
          </button>
        </div>
      </div>

      <div className="shrink-0 p-4 pb-2">{customerCard}</div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
        {cart.length === 0 ? (
          <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-primary p-6 text-center">
            <ShoppingBag className="text-secondary" size={30} />
            <p className="text-sm font-semibold text-primary">Cart is empty</p>
            <p className="text-xs text-secondary">Tap a product or scan a barcode to start a sale.</p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {cart.map((item) => (
              <li key={item.cartKey} className="rounded-2xl border border-secondary bg-surface p-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-xs font-bold text-brand">{initialsOf(item.name)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold leading-tight text-primary">{item.name}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-md bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                        <Tag size={10} /> {item.category}
                      </span>
                      {item.variant !== "Standard" && <span className="rounded-md bg-muted-action px-1.5 py-0.5 text-[10px] font-medium text-primary">{item.variant}</span>}
                      {item.sku && <span className="rounded-md bg-muted-action px-1.5 py-0.5 text-[10px] text-secondary">SKU {item.sku}</span>}
                    </div>
                    <p className="mt-1 text-[11px] text-secondary">{money(item.price)} each</p>
                  </div>
                  <button type="button" onClick={() => updateQuantity(item.cartKey, 0)} aria-label={`Remove ${item.name}`} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="mt-2.5 flex items-center justify-between">
                  <QuantityControl quantity={item.quantity} onDecrease={() => updateQuantity(item.cartKey, item.quantity - 1)} onIncrease={() => updateQuantity(item.cartKey, item.quantity + 1)} />
                  <p className="text-sm font-bold tabular-nums text-primary">{money(item.price * item.quantity)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="shrink-0 space-y-3 border-t border-secondary p-4">
        <button type="button" onClick={() => setShowAdjust(true)} className="flex w-full items-center justify-between rounded-xl border border-dashed border-primary px-3 py-2 text-xs font-semibold text-secondary transition-colors hover:border-brand hover:text-brand">
          <span className="flex items-center gap-2"><Percent size={14} /> Discount & tax</span>
          <ChevronRight size={14} />
        </button>
        <div className="space-y-1.5">
          <SummaryRow label="Subtotal" value={money(subtotal)} />
          {discountAmount > 0 && <SummaryRow label="Discount" value={`- ${money(discountAmount)}`} tone="text-[var(--color-success)]" />}
          {taxAmount > 0 && <SummaryRow label={`Tax (${Number(taxRate)}%)`} value={money(taxAmount)} />}
          <div className="border-t border-secondary pt-2"><SummaryRow strong label="Total" value={money(grandTotal)} /></div>
        </div>

        {!registerOpen && !registerLoading && (
          <button type="button" onClick={() => navigate("/cash-register")} className="flex w-full items-center gap-2 rounded-xl border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 px-3 py-2 text-left text-xs font-medium text-[var(--color-warning)]">
            <AlertTriangle size={14} className="shrink-0" /> Cash register is closed. Tap to open it before selling.
          </button>
        )}

        <button type="button" onClick={openPayment} disabled={!cart.length || !registerOpen} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50">
          <Banknote size={17} /> Charge {money(grandTotal)}
          <kbd className="ml-1 hidden rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold xl:inline">F9</kbd>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface text-primary">
      {/* ============================ HEADER ============================ */}
      <header className="shrink-0 border-b border-primary bg-card px-3 py-3 sm:px-4 lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-sm"><ShoppingBag size={19} /></div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight">Point of Sale</h1>
              <p className="truncate text-xs text-secondary">{user?.business?.name || "Your Business"} • {user?.name || "Cashier"}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {gatewayBusy && !showPayment && (
              <button type="button" onClick={() => setShowPayment(true)} className="flex h-9 items-center gap-2 rounded-lg border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 px-3 text-xs font-semibold text-[var(--color-warning)]">
                <Loader2 size={14} className="animate-spin" /> Payment pending
              </button>
            )}
            <button type="button" onClick={() => setShowHeld(true)} className="flex h-9 items-center gap-2 rounded-lg border border-primary bg-card px-3 text-xs font-semibold transition-colors hover:bg-surface">
              <Pause size={15} /> Held
              {heldOrders.length > 0 && <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] text-white">{heldOrders.length}</span>}
            </button>
            <button type="button" onClick={() => navigate("/cash-register")} className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold ${registerOpen ? "border-[var(--color-success)]/30 bg-[var(--color-success)]/10 text-[var(--color-success)]" : "border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 text-[var(--color-danger)]"}`}>
              <span className={`h-2 w-2 rounded-full ${registerOpen ? "bg-[var(--color-success)]" : "bg-[var(--color-danger)]"}`} />
              <Calculator size={14} className="hidden sm:block" /> Register {registerOpen ? "open" : "closed"}
            </button>
            <button type="button" onClick={() => setShowPrinters(true)} className="flex h-9 items-center gap-2 rounded-lg border border-primary bg-card px-3 text-xs font-semibold transition-colors hover:bg-surface">
              <Printer size={15} />
              <span className="hidden max-w-[120px] truncate sm:inline">{activePrinter ? activePrinter.name : "Printer"}</span>
            </button>
            <button type="button" onClick={() => { refetchProducts(); refetchInventory(); }} aria-label="Refresh products" className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary bg-card text-secondary transition-colors hover:bg-surface hover:text-primary">
              <RefreshCw size={15} className={productsFetching ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </header>

      {/* ============================ BODY ============================ */}
      <div className="flex min-h-0 flex-1">
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="shrink-0 space-y-3 p-3 sm:p-4 lg:px-6">
            <div className="relative">
              <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKey}
                placeholder="Search product, SKU or scan barcode…   ( / )"
                className={`${inputCls} h-11 pl-10 pr-10`}
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"><X size={16} /></button>
              )}
            </div>

            <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0">
              {[{ _id: "all", name: "All products" }, ...categories].map((c) => {
                const active = String(categoryId) === String(c._id);
                const count = c._id === "all" ? products.length : categoryCounts.get(String(c._id)) || 0;
                return (
                  <button key={c._id} type="button" onClick={() => setCategoryId(c._id)} className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${active ? "border-brand bg-brand text-white" : "border-primary bg-card text-secondary hover:border-brand/40 hover:text-primary"}`}>
                    {c.name}
                    <span className={`rounded-full px-1.5 text-[10px] ${active ? "bg-white/25" : "bg-muted-action"}`}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-28 sm:px-4 lg:px-6 lg:pb-6">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-56 animate-pulse rounded-2xl bg-muted-action" />)}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-primary p-8 text-center">
                <Package className="text-secondary" size={34} />
                <p className="text-sm font-semibold">No products found</p>
                <p className="text-xs text-secondary">Try a different search or category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {filteredProducts.map((p) => (
                  <ProductCard key={p._id} product={p} inventoryItems={inventoryByProduct.get(String(p._id)) || []} onAdd={handleProductClick} />
                ))}
              </div>
            )}
          </div>
        </section>

        {cartPanel}
      </div>

      {/* ===================== MOBILE CART BAR ===================== */}
      {!cartOpen && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-primary bg-card p-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] lg:hidden">
          <button type="button" onClick={() => setCartOpen(true)} className="flex h-12 w-full items-center justify-between rounded-xl bg-brand px-4 text-sm font-bold text-white">
            <span className="flex items-center gap-2"><ShoppingBag size={17} /> View cart · {cartItemCount} items</span>
            <span className="tabular-nums">{money(grandTotal)}</span>
          </button>
        </div>
      )}

      {/* ===================== VARIANT MODAL ===================== */}
      {showVariant && selectedProduct && (
        <Modal
          title="Select variant"
          onClose={() => { setShowVariant(false); setSelectedProduct(null); setSelectedVariant(null); }}
          footer={
            <button
              type="button"
              disabled={!selectedVariant}
              onClick={() => { addToCart(selectedProduct, selectedVariant); setShowVariant(false); setSelectedProduct(null); setSelectedVariant(null); }}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
            >
              <Plus size={16} /> Add to cart
            </button>
          }
        >
          <div className="space-y-4 p-5">
            <div className="flex items-center gap-3 rounded-xl border border-primary bg-surface p-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 font-bold text-brand">{initialsOf(selectedProduct.name)}</div>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold">{selectedProduct.name}</h3>
                <p className="truncate text-xs text-secondary">{getProductBrand(selectedProduct)} • {getProductCategory(selectedProduct)} • {getProductSku(selectedProduct)}</p>
              </div>
            </div>
            <div className="space-y-2">
              {selectedInventoryItems.map((inv) => {
                const on = selectedVariant?._id === inv._id;
                return (
                  <button key={inv._id} type="button" onClick={() => setSelectedVariant(inv)} className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all ${on ? "border-brand bg-brand/8 ring-2 ring-brand/20" : "border-primary bg-card hover:border-brand/40"}`}>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{variantLabel(inv)}</p>
                      <p className="text-[11px] text-secondary">{Number(inv.quantity)} in stock{inv.batchNumber ? ` • Batch ${inv.batchNumber}` : ""}</p>
                    </div>
                    <span className="text-sm font-bold tabular-nums">{money(inv.salePrice || selectedProduct.salePrice)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </Modal>
      )}

      {/* ===================== CUSTOMER MODAL ===================== */}
      {showCustomer && (
        <Modal title="Select customer" onClose={() => setShowCustomer(false)} width="max-w-md">
          <div className="space-y-3 p-5">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                <input autoFocus value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} placeholder="Search name or phone…" className={`${inputCls} pl-9`} />
              </div>
              <button type="button" onClick={() => setShowNewCustomer(true)} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-brand px-3.5 text-xs font-semibold text-white hover:bg-brand-hover">
                <UserPlus size={15} /> New
              </button>
            </div>
            <div className="max-h-[50vh] space-y-1.5 overflow-y-auto">
              <button type="button" onClick={() => { setCustomer(null); setShowCustomer(false); }} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${!customer ? "border-brand bg-brand/8" : "border-primary hover:bg-surface"}`}>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted-action text-secondary"><UserRound size={16} /></div>
                <div><p className="text-sm font-semibold">Walk-in Customer</p><p className="text-xs text-secondary">No customer details</p></div>
              </button>
              {customerResults.map((c) => (
                <button key={c._id} type="button" onClick={() => { setCustomer(c); setShowCustomer(false); }} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${customer?._id === c._id ? "border-brand bg-brand/8" : "border-primary hover:bg-surface"}`}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">{initialsOf(c.name)}</div>
                  <div className="min-w-0"><p className="truncate text-sm font-semibold">{c.name}</p><p className="truncate text-xs text-secondary">{c.phone || c.email || "No contact info"}</p></div>
                </button>
              ))}
              {customerResults.length === 0 && customerSearch && <p className="py-6 text-center text-xs text-secondary">No customer matches “{customerSearch}”.</p>}
            </div>
          </div>
        </Modal>
      )}

      {/* ===================== NEW CUSTOMER (inline form) ===================== */}
      {showNewCustomer && (
        <Modal title="Add new customer" onClose={() => setShowNewCustomer(false)} width="max-w-2xl" z="z-[60]">
          <div className="p-5">
            <CustomerForm onSubmit={handleCreateCustomer} onCancel={() => setShowNewCustomer(false)} submitting={creatingCustomer} />
          </div>
        </Modal>
      )}

      {/* ===================== DISCOUNT & TAX ===================== */}
      {showAdjust && (
        <Modal
          title="Discount & tax"
          onClose={() => setShowAdjust(false)}
          width="max-w-md"
          footer={
            <div className="flex gap-2">
              <button type="button" onClick={() => { setDiscountValue(""); setTaxRate(""); setShowAdjust(false); }} className="h-11 flex-1 rounded-xl border border-primary text-sm font-semibold hover:bg-surface">Remove all</button>
              <button type="button" onClick={applyAdjustments} className="h-11 flex-1 rounded-xl bg-brand text-sm font-semibold text-white hover:bg-brand-hover">Apply</button>
            </div>
          }
        >
          <div className="space-y-4 p-5">
            <div>
              <p className="mb-1.5 text-xs font-semibold text-secondary">Discount</p>
              <div className="mb-2 grid grid-cols-2 gap-2 rounded-xl bg-muted-action p-1">
                {[["percentage", "Percentage %"], ["fixed", "Fixed amount"]].map(([v, l]) => (
                  <button key={v} type="button" onClick={() => setDiscountType(v)} className={`rounded-lg py-2 text-xs font-semibold transition-colors ${discountType === v ? "bg-card text-primary shadow-sm" : "text-secondary"}`}>{l}</button>
                ))}
              </div>
              <input type="number" min="0" inputMode="decimal" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder={discountType === "percentage" ? "e.g. 10" : "e.g. 500"} className={inputCls} />
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold text-secondary">Tax rate (%)</p>
              <input type="number" min="0" max="100" inputMode="decimal" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} placeholder="e.g. 5" className={inputCls} />
            </div>
            <div className="space-y-1.5 rounded-xl bg-surface p-3">
              <SummaryRow label="Subtotal" value={money(subtotal)} />
              <SummaryRow label="Discount" value={`- ${money(discountAmount)}`} />
              <SummaryRow label="Tax" value={money(taxAmount)} />
              <SummaryRow strong label="New total" value={money(grandTotal)} />
            </div>
          </div>
        </Modal>
      )}

      {/* ===================== HELD ORDERS ===================== */}
      {showHeld && (
        <Modal title="Held orders" onClose={() => setShowHeld(false)}>
          <div className="space-y-2 p-5">
            {heldOrders.length === 0 ? (
              <p className="py-8 text-center text-sm text-secondary">No held orders.</p>
            ) : (
              heldOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3 rounded-xl border border-primary p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{o.customer?.name || "Walk-in Customer"}</p>
                    <p className="text-xs text-secondary">{o.cart.length} lines • {money(o.grandTotal)} • {new Date(o.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => restoreOrder(o)} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover">Restore</button>
                    <button type="button" onClick={() => setHeldOrders((p) => p.filter((h) => h.id !== o.id))} aria-label="Delete held order" className="rounded-lg border border-primary px-2 text-secondary hover:text-[var(--color-danger)]"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}

      {/* ===================== PAYMENT MODAL ===================== */}
      {showPayment && (
        <Modal
          title="Complete payment"
          width="max-w-4xl"
          onClose={() => setShowPayment(false)}
          footer={
            showAllMethods ? (
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setShowPayment(false)} disabled={isProcessing} className="h-11 rounded-xl border border-primary px-6 text-sm font-semibold hover:bg-surface disabled:opacity-50 sm:w-40">Cancel</button>
                <button
                  type="button"
                  onClick={handleCompleteSale}
                  disabled={isProcessing || (mode === "cash" && numericPaid < grandTotal) || (mode === "gateway" && !LIVE_GATEWAYS[activeMethod.id])}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-8 text-sm font-bold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-56"
                >
                  {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {isProcessing ? "Processing…" : actionLabel}
                </button>
              </div>
            ) : null
          }
        >
          <div className="border-b border-secondary bg-surface px-5 py-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs text-secondary">Amount due</p>
                <p className="text-3xl font-extrabold tracking-tight tabular-nums">{money(gatewayBusy ? snapshotRef.current?.total ?? grandTotal : grandTotal)}</p>
              </div>
              <div className="text-right text-xs text-secondary">
                <p className="font-semibold text-primary">{(snapshotRef.current?.customer || customer)?.name || "Walk-in Customer"}</p>
                <p>{cartItemCount || snapshotRef.current?.cart?.length || 0} items</p>
              </div>
            </div>
          </div>

          {!showAllMethods ? (
            <GatewayTracker
              gateway={gateway}
              method={gatewayMethod}
              total={snapshotRef.current?.total ?? grandTotal}
              onOpen={() => gateway.approvalUrl && (openGatewayWindow(gateway.approvalUrl) || window.location.assign(gateway.approvalUrl))}
              onCheck={() => pollRef.current()}
              onCancel={cancelGateway}
              onRetry={() => startGatewayPayment(gateway.methodId)}
              onBack={() => { clearPending(); setGateway(IDLE); }}
            />
          ) : (
            <div className="grid gap-5 p-5 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <p className="mb-2 text-xs font-semibold text-secondary">Select payment method</p>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map((m) => (
                    <MethodTile key={m.id} method={m} active={paymentMethod === m.id} onSelect={() => selectMethod(m.id)} disabled={isProcessing} />
                  ))}
                </div>
              </div>

              <div className="space-y-4 lg:col-span-3">
                {mode === "cash" && (
                  <div className="space-y-3 rounded-2xl border border-primary bg-surface p-4">
                    <label className="block text-sm font-semibold" htmlFor="pos-received">Amount received</label>
                    <input id="pos-received" autoFocus type="number" min="0" inputMode="decimal" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder="0" className={`${inputCls} h-12 text-lg font-semibold`} />
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => setPaidAmount(String(Math.ceil(grandTotal)))} className="rounded-lg border border-primary bg-card px-3 py-1.5 text-xs font-semibold hover:border-brand">Exact</button>
                      {quickCash.filter((v) => v !== Math.ceil(grandTotal)).map((v) => (
                        <button key={v} type="button" onClick={() => setPaidAmount(String(v))} className="rounded-lg border border-primary bg-card px-3 py-1.5 text-xs font-semibold hover:border-brand">{money(v)}</button>
                      ))}
                    </div>
                    <div className="space-y-1.5 border-t border-secondary pt-3">
                      <SummaryRow label="Remaining" value={money(remainingAmount)} tone={remainingAmount > 0 ? "text-[var(--color-danger)]" : "text-primary"} />
                      <SummaryRow label="Change to return" value={money(changeAmount)} tone="text-[var(--color-success)]" />
                    </div>
                  </div>
                )}

                {mode === "terminal" && (
                  <div className="space-y-3 rounded-2xl border border-primary bg-surface p-4">
                    <div className="flex items-center gap-2"><CardLogos /><span className="text-xs text-secondary">Charge {money(grandTotal)} on the card machine</span></div>
                    <label className="block text-sm font-semibold" htmlFor="pos-approval">Approval / slip number <span className="font-normal text-secondary">(optional)</span></label>
                    <input id="pos-approval" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. 482913" className={inputCls} />
                  </div>
                )}

                {mode === "wallet" && (
                  <div className="space-y-3 rounded-2xl border border-primary bg-surface p-4">
                    <p className="text-sm text-secondary">Ask the customer to send <b className="text-primary">{money(grandTotal)}</b> to your {activeMethod.label} merchant account, then enter the transaction ID from their confirmation.</p>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold" htmlFor="pos-tid">Transaction ID <span className="text-[var(--color-danger)]">*</span></label>
                      <input id="pos-tid" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. 3948573621" className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold" htmlFor="pos-wallet">Sender number <span className="font-normal text-secondary">(optional)</span></label>
                      <input id="pos-wallet" type="tel" value={walletNumber} onChange={(e) => setWalletNumber(e.target.value)} placeholder="03xx xxxxxxx" className={inputCls} />
                    </div>
                    <p className="flex items-start gap-2 rounded-lg bg-[var(--color-warning)]/10 px-3 py-2 text-xs text-[var(--color-warning)]">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                      Manual confirmation: the cashier verifies the transfer. Automatic {activeMethod.label} checkout turns on once its backend gateway is connected.
                    </p>
                  </div>
                )}

                {mode === "manual" && (
                  <div className="space-y-3 rounded-2xl border border-primary bg-surface p-4">
                    <label className="block text-sm font-semibold" htmlFor="pos-bank-ref">Transfer reference <span className="font-normal text-secondary">(optional)</span></label>
                    <input id="pos-bank-ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="IBFT / Raast reference" className={inputCls} />
                  </div>
                )}

                {mode === "gateway" && (
                  <div className="space-y-3 rounded-2xl border border-primary bg-surface p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck size={16} className="text-[var(--color-success)]" /> Secure online checkout</div>
                    <ul className="space-y-1.5 text-xs text-secondary">
                      <li>1. A secure {activeMethod.label} window opens for the customer.</li>
                      <li>2. Their payment is checked automatically — Pending → Approved → Paid.</li>
                      <li>3. The sale completes and the receipt is ready to print.</li>
                    </ul>
                    <div className="flex items-center gap-2 pt-1"><CardLogos /><span className="text-[11px] text-secondary">Cards can be used inside the checkout window where the provider supports it.</span></div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 rounded-2xl border border-primary p-3 text-xs">
                  <div><p className="text-secondary">Customer</p><p className="truncate text-sm font-semibold">{customer?.name || "Walk-in Customer"}</p></div>
                  <div className="text-right"><p className="text-secondary">Items</p><p className="text-sm font-semibold">{cartItemCount}</p></div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* ===================== PRINTERS MODAL ===================== */}
      {showPrinters && (
        <PrintersModal
          printers={printers}
          defaultId={defaultId}
          onAdd={addPrinter}
          onRemove={removePrinter}
          onDefault={setDefaultPrinter}
          onTest={testPrinter}
          onClose={() => setShowPrinters(false)}
        />
      )}

      {/* ===================== RECEIPT MODAL ===================== */}
      {showReceipt && lastSale && (
        <Modal
          title="Sale completed"
          width="max-w-2xl"
          onClose={() => setShowReceipt(false)}
          footer={
            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={() => printReceipt(lastSale)} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-primary text-sm font-semibold hover:bg-surface">
                <Printer size={16} /> Print receipt
              </button>
              <button type="button" onClick={() => setShowReceipt(false)} className="h-11 flex-1 rounded-xl bg-brand text-sm font-bold text-white hover:bg-brand-hover">New sale</button>
            </div>
          }
        >
          <div className="grid gap-5 p-5 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-success)]/12 text-[var(--color-success)]"><CheckCircle2 size={28} /></div>
                <h3 className="text-lg font-bold">Payment successful</h3>
                <StatusBadge status={lastSale.payment.status} />
                <p className="text-xs text-secondary">Sale {lastSale.saleNumber}</p>
              </div>

              <div className="space-y-1.5 rounded-2xl border border-primary bg-surface p-4">
                <SummaryRow label="Customer" value={lastSale.customer?.name || "Walk-in Customer"} />
                <SummaryRow label="Payment" value={lastSale.payment.label} />
                {lastSale.payment.reference && <SummaryRow label="Reference" value={lastSale.payment.reference} />}
                <SummaryRow label="Items" value={lastSale.items.reduce((s, i) => s + Number(i.quantity), 0)} />
                <div className="border-t border-secondary pt-2"><SummaryRow strong label="Sale total" value={money(lastSale.total)} /></div>
                <SummaryRow label="Payment recorded" value={money(lastSale.payment.paid)} />
                {lastSale.payment.change > 0 && <SummaryRow label="Change" value={money(lastSale.payment.change)} tone="text-[var(--color-success)]" />}
              </div>

              <div className="space-y-3 rounded-2xl border border-primary p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-secondary">Thermal printer</p>
                  <button type="button" onClick={() => setShowPrinters(true)} className="text-xs font-semibold text-brand hover:underline">Manage printers</button>
                </div>
                <select value={defaultId || "browser"} onChange={(e) => setDefaultPrinter(e.target.value === "browser" ? null : e.target.value)} className={inputCls}>
                  <option value="browser">Browser print dialog</option>
                  {printers.map((pr) => (
                    <option key={pr.id} value={pr.id}>{pr.name} — {pr.host}:{pr.port}</option>
                  ))}
                </select>
                {!activePrinter && (
                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted-action p-1">
                    {[["80", "80 mm"], ["58", "58 mm"]].map(([v, l]) => (
                      <button key={v} type="button" onClick={() => updatePrefs({ paper: v })} className={`rounded-lg py-2 text-xs font-semibold transition-colors ${prefs.paper === v ? "bg-card text-primary shadow-sm" : "text-secondary"}`}>{l}</button>
                    ))}
                  </div>
                )}
                <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
                  <span>Auto-print after every sale</span>
                  <input type="checkbox" checked={prefs.autoPrint} onChange={(e) => updatePrefs({ autoPrint: e.target.checked })} className="h-4 w-4 accent-[var(--action-primary)]" />
                </label>
              </div>
            </div>

            <div className="flex justify-center rounded-2xl bg-muted-action p-3">
              <iframe title="Receipt preview" srcDoc={receiptHtml} className="rounded-md bg-white shadow-lg" style={{ width: prefs.paper === "58" ? "58mm" : "80mm", height: 460, border: 0 }} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}