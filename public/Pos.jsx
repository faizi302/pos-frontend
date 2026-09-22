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
  Tag,
  Trash2,
  UserPlus,
  UserRound,
  Wifi,
  X,
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
import CustomerForm from "../customer/CustomerForm";

/* =====================================================================
   CONFIG — Manual POS only (cash / card / JazzCash / Easypaisa / bank)
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

/** First product image URL from API shape: images[{ url }] or legacy image string */
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
   cash → paymentMethod "cash"
   others → paymentMethod matches backend enum, notes "Online (Label)"
===================================================================== */

// Sale.paymentMethod enum: cash | bank | card | cheque | online | credit | other
// SalePayment.paymentMethod enum: cash | bank | card | cheque | jazzcash | easypaisa | credit | other
// → wallets use saleMethod "online" on Sale, and specific method on SalePayment.
const PAYMENT_METHODS = [
  {
    id: "cash",
    label: "Cash",
    hint: "Collect at counter",
    kind: "cash",
    saleMethod: "cash",       // Sale model
    paymentMethod: "cash",    // SalePayment model
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



/* =====================================================================
   UI PRIMITIVES
===================================================================== */

function StatusBadge({ status }) {
  const map = {
    paid: ["Paid", "bg-[var(--color-success)]/12 text-[var(--color-success)]"],
    pending: ["Pending", "bg-[var(--color-warning)]/12 text-[var(--color-warning)]"],
    unpaid: ["Unpaid", "bg-[var(--color-danger)]/12 text-[var(--color-danger)]"],
    partial: ["Partial", "bg-[var(--color-info)]/12 text-[var(--color-info)]"],
  };
  const [label, cls] = map[status] || map.pending;
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
}

function QuantityControl({ quantity, onDecrease, onIncrease }) {
  return (
    <div className="inline-flex items-center overflow-hidden rounded-xl border border-primary bg-card">
      <button
        type="button"
        onClick={onDecrease}
        aria-label="Decrease"
        className="flex h-8 w-8 items-center justify-center text-secondary transition-colors hover:bg-surface hover:text-primary"
      >
        <Minus size={14} />
      </button>
      <span className="w-9 text-center text-sm font-semibold tabular-nums text-primary">{quantity}</span>
      <button
        type="button"
        onClick={onIncrease}
        aria-label="Increase"
        className="flex h-8 w-8 items-center justify-center text-secondary transition-colors hover:bg-surface hover:text-primary"
      >
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
  const Logo = method.logo;
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all disabled:opacity-50 ${
        active
          ? "border-brand bg-brand/8 ring-2 ring-brand/20"
          : "border-primary bg-card hover:border-brand/40 hover:bg-surface"
      }`}
    >
      <Logo />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-primary">{method.label}</span>
        <span className="block truncate text-[11px] text-secondary">{method.hint}</span>
      </span>
      {method.online && (
        <span className="hidden rounded-full bg-[var(--color-info)]/12 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-info)] sm:inline">
          Online
        </span>
      )}
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
          active ? "border-brand bg-brand text-white" : "border-primary"
        }`}
      >
        {active && <Check size={12} />}
      </span>
    </button>
  );
}

function ProductCard({ product, inventoryItems, onAdd }) {
  const active = inventoryItems.filter((i) => i.isActive !== false);
  const totalStock = active.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
  const prices = active.map((i) => Number(i.salePrice)).filter((p) => p > 0);
  const minPrice = prices.length ? Math.min(...prices) : Number(product.salePrice) || 0;
  const out = totalStock <= 0;
  const imageUrl = getProductImage(product);

  return (
    <button
      type="button"
      disabled={out}
      onClick={() => onAdd(product, inventoryItems)}
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-card text-left transition-all ${
        out
          ? "cursor-not-allowed border-primary opacity-55"
          : "border-primary hover:border-brand/50 hover:shadow-md hover:shadow-brand/5"
      }`}
    >
      <div className="relative flex h-28 items-center justify-center overflow-hidden bg-surface">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={getProductName(product)}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const fb = e.currentTarget.nextElementSibling;
              if (fb) fb.classList.remove("hidden");
            }}
          />
        ) : null}
        <Package
          className={`h-10 w-10 text-secondary/40 ${imageUrl ? "hidden" : ""}`}
        />
        <span
          className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${getStockTone(
            totalStock,
            product.minStock
          )}`}
        >
          {out ? "Out" : totalStock}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-primary">{getProductName(product)}</p>
        <p className="truncate text-[11px] text-secondary">
          {product.sku || "—"} · {getProductCategory(product)}
        </p>
        <p className="mt-auto pt-1 text-sm font-bold tabular-nums text-brand">{money(minPrice)}</p>
      </div>
    </button>
  );
}

/* =====================================================================
   POS PAGE
===================================================================== */

export default function POS() {
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search);
  const [categoryId, setCategoryId] = useState("all");
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [lastSale, setLastSale] = useState(null);
  const [prefs, updatePrefs] = usePrefs();
  const { printers, defaultId, addPrinter, removePrinter, setDefaultPrinter } = usePrinters();

  const [showPayment, setShowPayment] = useState(false);
  const [showCustomer, setShowCustomer] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [showVariant, setShowVariant] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showPrinters, setShowPrinters] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedInventoryItems, setSelectedInventoryItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const searchRef = useRef(null);
  const draftRef = useRef(null);

  /* ---------------------------- DATA ---------------------------- */
  const {
    data: productsData,
    isLoading: productsLoading,
    refetch: refetchProducts,
  } = useGetProductsQuery({ search: debouncedSearch || undefined, limit: 100, isActive: true });
  const {
    data: inventoryData,
    isLoading: inventoryLoading,
    refetch: refetchInventory,
  } = useGetProductInventoryQuery({ page: 1, limit: 200 });
  const { data: categoriesData } = useGetCategoriesQuery({ limit: 100, isActive: true });
  const { data: customersData } = useGetCustomersQuery({ limit: 100, isActive: true });
  const {
    data: currentRegister,
    isLoading: registerLoading,
    refetch: refetchRegister,
  } = useGetCurrentCashRegisterQuery();

  const [createCustomer, { isLoading: creatingCustomer }] = useCreateCustomerMutation();
  const [createSale] = useCreateSaleMutation();
  const [updateSale] = useUpdateSaleMutation();
  const [createSaleItem] = useCreateSaleItemMutation();
  const [createSalePayment] = useCreateSalePaymentMutation();

  const products = useMemo(() => pickList(productsData, "products"), [productsData]);
  const inventoryList = useMemo(
    () => pickList(inventoryData, "inventory", "inventories"),
    [inventoryData]
  );
  const categories = useMemo(() => pickList(categoriesData, "categories"), [categoriesData]);
  const customers = useMemo(() => pickList(customersData, "customers"), [customersData]);

  const inventoryByProduct = useMemo(() => {
    const map = new Map();
    inventoryList.forEach((inv) => {
      const pid = String(inv.product?._id || inv.product || "");
      if (!pid) return;
      if (!map.has(pid)) map.set(pid, []);
      map.get(pid).push(inv);
    });
    return map;
  }, [inventoryList]);

  const filteredProducts = useMemo(() => {
    if (categoryId === "all") return products;
    return products.filter((p) => String(p.category?._id || p.category) === String(categoryId));
  }, [products, categoryId]);

  const customerResults = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers.slice(0, 12);
    return customers
      .filter(
        (c) =>
          String(c.name || "")
            .toLowerCase()
            .includes(q) ||
          String(c.phone || "").includes(q) ||
          String(c.email || "")
            .toLowerCase()
            .includes(q)
      )
      .slice(0, 12);
  }, [customers, customerSearch]);

  /* ---------------------------- TOTALS ---------------------------- */
  const subtotal = useMemo(
    () => roundMoney(cart.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0)),
    [cart]
  );
  const discountAmount = useMemo(() => {
    const v = Number(discountValue) || 0;
    if (v <= 0) return 0;
    if (discountType === "percentage") return roundMoney(Math.min(subtotal, (subtotal * v) / 100));
    return roundMoney(Math.min(subtotal, v));
  }, [discountValue, discountType, subtotal]);
  const taxableBase = roundMoney(Math.max(0, subtotal - discountAmount));
  const taxAmount = useMemo(() => {
    const rate = Number(taxRate) || 0;
    if (rate <= 0) return 0;
    return roundMoney((taxableBase * rate) / 100);
  }, [taxRate, taxableBase]);
  const grandTotal = roundMoney(taxableBase + taxAmount);
  const cartItemCount = cart.reduce((s, i) => s + Number(i.quantity), 0);
  const numericPaid = Math.max(0, roundMoney(Number(paidAmount) || 0));
  const changeAmount = Math.max(0, roundMoney(numericPaid - grandTotal));
  const remainingAmount = Math.max(0, roundMoney(grandTotal - numericPaid));
  const registerOpen = Boolean(currentRegister && currentRegister.status === "open");

  const cartSignature = useMemo(
    () =>
      `${customer?._id || "walkin"}|${cart
        .map((i) => `${i.cartKey}:${i.quantity}:${i.price}`)
        .join(",")}|${discountAmount}|${taxAmount}`,
    [customer, cart, discountAmount, taxAmount]
  );

  const activeMethod = PAYMENT_METHODS.find((m) => m.id === paymentMethod) || PAYMENT_METHODS[0];
  const isCash = activeMethod.kind === "cash";

  const quickCash = useMemo(() => {
    const r = grandTotal;
    return [
      ...new Set([
        r,
        Math.ceil(r / 500) * 500,
        Math.ceil(r / 1000) * 1000,
        Math.ceil(r / 5000) * 5000,
      ]),
    ]
      .filter((v) => v >= r && v > 0)
      .sort((a, b) => a - b)
      .slice(0, 4);
  }, [grandTotal]);

  /* -------------------------- CART ---------------------------- */
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
          image: getProductImage(product),
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
    setDiscountValue("");
    setTaxRate("");
    setCustomer(null);
    setCartOpen(false);
  };

  /** Cancel draft sale so backend can restore inventory units. */
  const cancelDraftSale = async () => {
    const draft = draftRef.current;
    if (!draft?.saleId) {
      draftRef.current = null;
      return;
    }
    try {
      await updateSale({ id: draft.saleId, status: "cancelled" }).unwrap();
    } catch (err) {
      console.warn("Could not cancel draft sale:", err);
    } finally {
      draftRef.current = null;
      refetchInventory().catch(() => {});
    }
  };

  const clearCart = async () => {
    if (!cart.length) return;
    await cancelDraftSale();
    resetCart();
    toast.success("Cart cleared.");
  };

  const openPayment = () => {
    if (!registerOpen) return toast.error("Please open the cash register first.");
    if (!cart.length) return toast.error("Add at least one product.");
    setPaidAmount(String(grandTotal));
    setShowPayment(true);
  };

  const closePayment = async () => {
    if (isProcessing) return;
    if (draftRef.current) await cancelDraftSale();
    setShowPayment(false);
  };

  const selectMethod = (id) => {
    setPaymentMethod(id);
    if (id === "cash") setPaidAmount(String(grandTotal));
  };

  const applyAdjustments = () => {
    const v = Number(discountValue) || 0;
    if (v < 0) return toast.error("Discount cannot be negative.");
    if (discountType === "percentage" && v > 100)
      return toast.error("Percentage discount cannot exceed 100%.");
    if (discountType === "fixed" && v > subtotal)
      return toast.error("Discount cannot exceed the subtotal.");
    if ((Number(taxRate) || 0) < 0 || Number(taxRate) > 100)
      return toast.error("Tax must be between 0 and 100%.");
    setShowAdjust(false);
  };

  const handleCreateCustomer = async (body) => {
    try {
      const res = await createCustomer(body).unwrap();
      const created = pickEntity(res, "customer");
      if (created?._id) setCustomer(created);
      toast.success("Customer created and selected.");
      setShowNewCustomer(false);
      setShowCustomer(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  /* ------------------- SALE PIPELINE ------------------- */
  const ensureDraftSale = async (backendMethod) => {
    if (draftRef.current && draftRef.current.signature === cartSignature) return draftRef.current;
    if (draftRef.current?.saleId) await cancelDraftSale();

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

    const lines = cart.map((i) => roundMoney(Number(i.price) * Number(i.quantity)));
    const cartSubtotal = roundMoney(lines.reduce((s, v) => s + v, 0));
    const taxableAmount = roundMoney(Math.max(0, cartSubtotal - discountAmount));
    let usedDiscount = 0;
    let usedTax = 0;

    for (let idx = 0; idx < cart.length; idx += 1) {
      const item = cart[idx];
      const last = idx === cart.length - 1;
      const dShare = last
        ? roundMoney(discountAmount - usedDiscount)
        : roundMoney(cartSubtotal > 0 ? (discountAmount * lines[idx]) / cartSubtotal : 0);
      usedDiscount = roundMoney(usedDiscount + dShare);
      const taxableLine = Math.max(0, lines[idx] - dShare);
      const tShare = last
        ? roundMoney(taxAmount - usedTax)
        : roundMoney(taxableAmount > 0 ? (taxAmount * taxableLine) / taxableAmount : 0);
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

    draftRef.current = {
      saleId,
      saleNumber: saleObj?.saleNumber || "",
      signature: cartSignature,
    };
    return draftRef.current;
  };

  const snapshot = () => ({
    cart: cart.map((i) => ({ ...i })),
    customer: customer
      ? { _id: customer._id, name: customer.name, phone: customer.phone }
      : null,
    subtotal,
    discount: discountAmount,
    tax: taxAmount,
    total: grandTotal,
  });

  const buildRecord = ({ snap, method, saleId, saleNumber, received, paid, change = 0 }) => ({
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
    customer: snap.customer
      ? { name: snap.customer.name, phone: snap.customer.phone }
      : null,
    items: snap.cart,
    subtotal: snap.subtotal,
    discount: snap.discount,
    tax: snap.tax,
    total: snap.total,
    payment: {
      label: method.online ? `Online (${method.label})` : method.label,
      methodId: method.id,
      received,
      paid,
      change,
      status: "paid",
    },
  });

  const activePrinter = printers.find((pr) => pr.id === defaultId) || null;

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
      toast.error(`${printer.name}: ${error.message}. Opening browser print dialog.`);
      printHtml(buildReceiptHtml(record, printer.paper || prefs.paper));
    }
  };

  const testPrinter = async (printer) => {
    try {
      await sendToTcpPrinter(
        printer,
        buildEscPos(buildTestRecord(user), {
          cols: printer.paper === "58" ? 32 : 48,
          cut: true,
        })
      );
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
    Promise.all([refetchInventory(), refetchProducts(), refetchRegister()]).catch(() => {});
    toast.success("Sale completed successfully.");
    if (prefs.autoPrint) setTimeout(() => printReceipt(record), 400);
  };

  /* ------------------ COMPLETE SALE (same flow for all methods) ------------------ */
  const completeSale = async () => {
    if (!cart.length) return toast.error("Cart is empty.");
    if (grandTotal <= 0) return toast.error("Sale total must be greater than zero.");
    if (isCash && numericPaid < grandTotal)
      return toast.error("Amount received is less than the total.");

    setIsProcessing(true);
    try {
      const paid = isCash ? roundMoney(Math.min(numericPaid, grandTotal)) : grandTotal;
      const snap = snapshot();
      const draft = await ensureDraftSale(activeMethod.saleMethod);

      // Cash stays "cash"; digital methods stored as their backend method
      // with notes marking them as Online (JazzCash) / Online (Easypaisa) / etc.
      const notes = activeMethod.online ? `Online (${activeMethod.label})` : "";

      await createSalePayment({
        sale: draft.saleId,
        customer: customer?._id || null,
        amount: paid,
        currency: CURRENCY,
        paymentMethod: activeMethod.paymentMethod,
        paymentDate: new Date().toISOString(),
        notes,
      }).unwrap();

      const updated = await updateSale({
        id: draft.saleId,
        status: "completed",
        paidAmount: paid,
        dueAmount: roundMoney(Math.max(0, grandTotal - paid)),
        paymentMethod: activeMethod.saleMethod,
      }).unwrap();

      const saleNumber = pickEntity(updated, "sale")?.saleNumber || draft.saleNumber;
      finishSale(
        buildRecord({
          snap,
          method: activeMethod,
          saleId: draft.saleId,
          saleNumber,
          received: isCash ? numericPaid : paid,
          paid,
          change: isCash ? changeAmount : 0,
        })
      );
    } catch (error) {
      console.error("Complete sale error:", error);
      toast.error(getApiErrorMessage(error));
      await cancelDraftSale();
    } finally {
      setIsProcessing(false);
    }
  };

  /* ------------------------- KEYBOARD ------------------------- */
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
    const exact = products.find(
      (p) =>
        String(p.barcode || "").toLowerCase() === term ||
        String(p.sku || "").toLowerCase() === term
    );
    if (exact) {
      handleProductClick(exact, inventoryByProduct.get(String(exact._id)) || []);
      setSearch("");
    }
  };

  /* ----------------------------- RENDER ----------------------------- */
  const isLoading = productsLoading || inventoryLoading || registerLoading;
  const receiptHtml = lastSale ? buildReceiptHtml(lastSale, prefs.paper) : "";

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface text-primary">
      {/* TOP BAR */}
      <header className="flex shrink-0 items-center gap-3 border-b border-secondary bg-card px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <ShoppingBag size={18} />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold leading-tight">Point of Sale</p>
            <p className="text-[11px] text-secondary">
              {registerOpen ? (
                <span className="text-[var(--color-success)]">
                  Register open · {currentRegister?.registerNumber || "—"}
                </span>
              ) : (
                <span className="text-[var(--color-danger)]">Register closed</span>
              )}
            </p>
          </div>
        </div>

        <div className="relative mx-auto max-w-xl flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKey}
            placeholder="Search products, SKU or barcode…  ( / )"
            className={`${inputCls} h-10 pl-9`}
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowPrinters(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary text-secondary hover:bg-surface hover:text-primary"
            aria-label="Printers"
          >
            <Printer size={15} />
          </button>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative flex h-9 items-center gap-1.5 rounded-xl bg-brand px-3 text-xs font-bold text-white hover:bg-brand-hover lg:hidden"
          >
            <ShoppingBag size={14} />
            {money(grandTotal)}
            {cartItemCount > 0 && (
              <span className="ml-0.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* PRODUCT GRID */}
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-secondary bg-card px-4 py-2.5">
            <button
              type="button"
              onClick={() => setCategoryId("all")}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                categoryId === "all"
                  ? "bg-brand text-white"
                  : "bg-muted-action text-secondary hover:text-primary"
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c._id}
                type="button"
                onClick={() => setCategoryId(c._id)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  categoryId === c._id
                    ? "bg-brand text-white"
                    : "bg-muted-action text-secondary hover:text-primary"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex h-48 items-center justify-center gap-2 text-secondary">
                <Loader2 className="animate-spin" size={20} /> Loading products…
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2 text-secondary">
                <Package size={32} className="opacity-40" />
                <p className="text-sm">No products found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {filteredProducts.map((p) => (
                  <ProductCard
                    key={p._id}
                    product={p}
                    inventoryItems={inventoryByProduct.get(String(p._id)) || []}
                    onAdd={handleProductClick}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CART PANEL */}
        <aside className="hidden w-[380px] shrink-0 flex-col border-l border-secondary bg-card lg:flex">
          <div className="border-b border-secondary p-3">
            <button
              type="button"
              onClick={() => setShowCustomer(true)}
              className="flex w-full items-center gap-3 rounded-2xl border border-primary bg-surface p-3 text-left transition-colors hover:border-brand/40"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                {customer ? initialsOf(customer.name) : <UserRound size={18} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {customer?.name || "Walk-in Customer"}
                </p>
                <p className="truncate text-xs text-secondary">
                  {customer?.phone || (customer ? "No phone" : "Tap to select customer")}
                </p>
              </div>
              <UserPlus size={16} className="text-secondary" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 py-12 text-secondary">
                <ShoppingBag size={28} className="opacity-30" />
                <p className="text-sm">Cart is empty</p>
                <p className="text-xs">Tap a product to add it</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {cart.map((item) => (
                  <li key={item.cartKey} className="rounded-xl border border-primary bg-surface p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-start gap-2.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted-action">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt=""
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <Package className="h-5 w-5 text-secondary/50" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{item.name}</p>
                          <p className="text-[11px] text-secondary">
                            {item.variant !== "Standard" ? `${item.variant} · ` : ""}
                            {money(item.price)} each
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.cartKey, 0)}
                        className="text-secondary hover:text-[var(--color-danger)]"
                        aria-label="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <QuantityControl
                        quantity={item.quantity}
                        onDecrease={() => updateQuantity(item.cartKey, item.quantity - 1)}
                        onIncrease={() => updateQuantity(item.cartKey, item.quantity + 1)}
                      />
                      <p className="text-sm font-bold tabular-nums">
                        {money(item.price * item.quantity)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-3 border-t border-secondary p-3">
            <div className="space-y-1.5 rounded-xl bg-surface p-3">
              <SummaryRow label="Subtotal" value={money(subtotal)} />
              <SummaryRow label="Discount" value={`− ${money(discountAmount)}`} />
              <SummaryRow label="Tax" value={money(taxAmount)} />
              <div className="border-t border-secondary pt-1.5">
                <SummaryRow strong label="Total" value={money(grandTotal)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowAdjust(true)}
                disabled={!cart.length}
                className="flex h-10 items-center justify-center gap-1 rounded-xl border border-primary text-xs font-semibold hover:bg-surface disabled:opacity-40"
              >
                <Percent size={13} /> Adjust
              </button>
              <button
                type="button"
                onClick={clearCart}
                disabled={!cart.length}
                className="flex h-10 items-center justify-center gap-1 rounded-xl border border-primary text-xs font-semibold hover:bg-surface disabled:opacity-40"
              >
                <RotateCcw size={13} /> Clear
              </button>
            </div>
            <button
              type="button"
              onClick={openPayment}
              disabled={!cart.length || !registerOpen || isProcessing}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              Charge {money(grandTotal)}
              <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold">F9</span>
            </button>
          </div>
        </aside>
      </div>

      {/* MOBILE CART */}
      {cartOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setCartOpen(false)}
            aria-label="Close cart"
          />
          <div className="relative ml-auto flex h-full w-full max-w-md flex-col bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-secondary px-4 py-3">
              <h3 className="font-bold">Cart · {cartItemCount} items</h3>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="rounded-lg p-1.5 hover:bg-surface"
              >
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {cart.length === 0 ? (
                <p className="py-12 text-center text-sm text-secondary">Cart is empty</p>
              ) : (
                <ul className="space-y-2">
                  {cart.map((item) => (
                    <li key={item.cartKey} className="rounded-xl border border-primary bg-surface p-3">
                      <div className="flex justify-between gap-2">
                        <p className="text-sm font-semibold">{item.name}</p>
                        <button type="button" onClick={() => updateQuantity(item.cartKey, 0)}>
                          <Trash2 size={14} className="text-secondary" />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <QuantityControl
                          quantity={item.quantity}
                          onDecrease={() => updateQuantity(item.cartKey, item.quantity - 1)}
                          onIncrease={() => updateQuantity(item.cartKey, item.quantity + 1)}
                        />
                        <p className="text-sm font-bold">{money(item.price * item.quantity)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="space-y-2 border-t border-secondary p-3">
              <SummaryRow strong label="Total" value={money(grandTotal)} />
              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  openPayment();
                }}
                disabled={!cart.length || !registerOpen}
                className="flex h-12 w-full items-center justify-center rounded-2xl bg-brand text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-50"
              >
                Charge {money(grandTotal)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VARIANT PICKER */}
      {showVariant && selectedProduct && (
        <Modal title={selectedProduct.name} onClose={() => setShowVariant(false)} width="max-w-md">
          <div className="space-y-2 p-4">
            {selectedInventoryItems.map((inv) => (
              <button
                key={inv._id}
                type="button"
                onClick={() => {
                  addToCart(selectedProduct, inv);
                  setShowVariant(false);
                }}
                className="flex w-full items-center justify-between rounded-xl border border-primary p-3 text-left transition-colors hover:bg-surface"
              >
                <div>
                  <p className="text-sm font-semibold">{variantLabel(inv)}</p>
                  <p className="text-[11px] text-secondary">
                    {Number(inv.quantity)} in stock
                    {inv.batchNumber ? ` · Batch ${inv.batchNumber}` : ""}
                  </p>
                </div>
                <p className="text-sm font-bold text-brand">
                  {money(inv.salePrice || selectedProduct.salePrice)}
                </p>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* CUSTOMER */}
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
            {customerResults.length === 0 && customerSearch && (
              <p className="py-6 text-center text-xs text-secondary">
                No customer matches “{customerSearch}”.
              </p>
            )}
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
          title="Discount & tax"
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
                onClick={applyAdjustments}
                className="h-11 flex-1 rounded-xl bg-brand text-sm font-semibold text-white hover:bg-brand-hover"
              >
                Apply
              </button>
            </div>
          }
        >
          <div className="space-y-4 p-5">
            <div>
              <p className="mb-1.5 text-xs font-semibold text-secondary">Discount</p>
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
              <SummaryRow label="Discount" value={`− ${money(discountAmount)}`} />
              <SummaryRow label="Tax" value={money(taxAmount)} />
              <SummaryRow strong label="New total" value={money(grandTotal)} />
            </div>
          </div>
        </Modal>
      )}

      {/* PAYMENT — select method & complete (no TID / phone / card fields) */}
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
                      tone={
                        remainingAmount > 0
                          ? "text-[var(--color-danger)]"
                          : "text-primary"
                      }
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
                    via {activeMethod.label}, then press <b>Complete sale</b>. No transaction ID
                    required.
                  </p>
                  <p className="rounded-lg bg-[var(--color-info)]/10 px-3 py-2 text-xs text-[var(--color-info)]">
                    This payment will be recorded as{" "}
                    <b>Online ({activeMethod.label})</b> with method{" "}
                    <b>{activeMethod.paymentMethod}</b>.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 rounded-2xl border border-primary p-3 text-xs">
                <div>
                  <p className="text-secondary">Customer</p>
                  <p className="truncate text-sm font-semibold">
                    {customer?.name || "Walk-in Customer"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-secondary">Method</p>
                  <p className="text-sm font-semibold">
                    {activeMethod.online
                      ? `Online (${activeMethod.label})`
                      : activeMethod.label}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* PRINTERS */}
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
                <StatusBadge status={lastSale.payment.status} />
                <p className="text-xs text-secondary">Sale {lastSale.saleNumber}</p>
              </div>

              <div className="space-y-1.5 rounded-2xl border border-primary bg-surface p-4">
                <SummaryRow
                  label="Customer"
                  value={lastSale.customer?.name || "Walk-in Customer"}
                />
                <SummaryRow label="Payment" value={lastSale.payment.label} />
                <SummaryRow
                  label="Items"
                  value={lastSale.items.reduce((s, i) => s + Number(i.quantity), 0)}
                />
                <div className="border-t border-secondary pt-2">
                  <SummaryRow strong label="Sale total" value={money(lastSale.total)} />
                </div>
                <SummaryRow label="Payment recorded" value={money(lastSale.payment.paid)} />
                {lastSale.payment.change > 0 && (
                  <SummaryRow
                    label="Change"
                    value={money(lastSale.payment.change)}
                    tone="text-[var(--color-success)]"
                  />
                )}
              </div>

              <div className="space-y-3 rounded-2xl border border-primary p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-secondary">Thermal printer</p>
                  <button
                    type="button"
                    onClick={() => setShowPrinters(true)}
                    className="text-xs font-semibold text-brand hover:underline"
                  >
                    Manage printers
                  </button>
                </div>
                <select
                  value={defaultId || "browser"}
                  onChange={(e) =>
                    setDefaultPrinter(e.target.value === "browser" ? null : e.target.value)
                  }
                  className={inputCls}
                >
                  <option value="browser">Browser print dialog</option>
                  {printers.map((pr) => (
                    <option key={pr.id} value={pr.id}>
                      {pr.name} — {pr.host}:{pr.port}
                    </option>
                  ))}
                </select>
                {!activePrinter && (
                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted-action p-1">
                    {[
                      ["80", "80 mm"],
                      ["58", "58 mm"],
                    ].map(([v, l]) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => updatePrefs({ paper: v })}
                        className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
                          prefs.paper === v
                            ? "bg-card text-primary shadow-sm"
                            : "text-secondary"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                )}
                <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
                  <span>Auto-print after every sale</span>
                  <input
                    type="checkbox"
                    checked={prefs.autoPrint}
                    onChange={(e) => updatePrefs({ autoPrint: e.target.checked })}
                    className="h-4 w-4 accent-[var(--action-primary)]"
                  />
                </label>
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
    </div>
  );
}
