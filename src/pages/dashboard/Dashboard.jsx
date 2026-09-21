import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  UserCheck,
  UserX,
  Building2,
  Layers3,
  Tags,
  Boxes,
  ShieldCheck,
  Package,
  ShoppingCart,
  Receipt,
  Landmark,
  CircleDollarSign,
  CreditCard,
  UsersRound,
  Banknote,
  Hourglass,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ArrowUpRight,
  Plus,
  Clock,
  Wallet,
  Info,
} from "lucide-react";

import { usePermissions } from "@/hooks/usePermissions";

// Super Admin data
import { useGetUsersQuery } from "@/features/users/usersApi";
import { useGetBusinessesQuery } from "@/features/businesses/businessesApi";
import { useGetBusinessTypesQuery } from "@/features/businessTypes/businessTypesApi";
import { useGetBrandsQuery } from "@/features/brands/brandsApi";
import { useGetModelsQuery } from "@/features/models/modelsApi";

// Admin data
import { useGetManagersQuery } from "@/features/users/managerApi";

// Admin + Manager data
import { useGetAllSalesQuery } from "@/features/sales/saleApi";
import { useGetAllSaleItemsQuery } from "@/features/sales/saleItemApi";
import { useGetAllSalePaymentsQuery } from "@/features/sales/salePaymentApi";
import { useGetProductsQuery } from "@/features/products/productApi";
import { useGetCustomersQuery } from "@/features/customer/customerApi";
import { useGetCurrentCashRegisterQuery } from "@/features/cashRegister/cashRegisterApi";

/* =====================================================================
   THEME-AWARE TONES
   Every accent is a CSS variable, so the cards follow whichever theme
   (light / dark / role theme) is active. "brand" is the live theme
   colour; the rest are semantic colours that read well on both modes.
   Themes can override --dash-violet / --dash-cyan / --dash-pink.
===================================================================== */

const TONES = {
  brand: "var(--action-primary)",
  green: "var(--color-success, #16a34a)",
  blue: "var(--color-info, #2563eb)",
  amber: "var(--color-warning, #d97706)",
  red: "var(--color-danger, #dc2626)",
  violet: "var(--dash-violet, #8b5cf6)",
  cyan: "var(--dash-cyan, #0891b2)",
  pink: "var(--dash-pink, #db2777)",
};

const TONE_CYCLE = ["brand", "blue", "green", "violet", "amber", "cyan", "pink", "red"];

const tint = (tone, pct = 14) =>
  `color-mix(in srgb, ${TONES[tone] || TONES.brand} ${pct}%, transparent)`;

/* =====================================================================
   FORMATTERS & HELPERS
===================================================================== */

const NUM = new Intl.NumberFormat("en-PK");
const COMPACT = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const money = (v) => `Rs. ${NUM.format(Math.round(Number(v) || 0))}`;
const compact = (v) => COMPACT.format(Number(v) || 0);
const moneyFit = (v) =>
  Math.abs(Number(v) || 0) >= 1_000_000 ? `Rs. ${compact(v)}` : money(v);

const titleCase = (v = "") =>
  String(v)
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${x.getMonth() + 1}-${x.getDate()}`;
};
const monthKey = (v) => {
  const d = new Date(v);
  return `${d.getFullYear()}-${d.getMonth()}`;
};
const monthBuckets = (n = 6) => {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString("en-GB", { month: "short" }),
    };
  });
};

const ts = (obj, ...fields) => {
  for (const f of fields) {
    const v = obj?.[f];
    if (v) {
      const t = new Date(v).getTime();
      if (!Number.isNaN(t)) return t;
    }
  }
  return 0;
};

const fmtDateTime = (t) =>
  t
    ? new Date(t).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const fmtDate = (t) =>
  t
    ? new Date(t).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const hourLabel = (h) =>
  h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`;

const initials = (name = "") =>
  String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

const toneFor = (text = "") => {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return TONE_CYCLE[h % TONE_CYCLE.length];
};

// Accepts every response shape used across the app.
function toArray(res, ...keys) {
  if (Array.isArray(res)) return res;
  for (const k of keys) {
    if (Array.isArray(res?.[k])) return res[k];
    if (Array.isArray(res?.data?.[k])) return res.data[k];
  }
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

function countBy(list, getKey) {
  const map = new Map();
  list.forEach((item) => {
    const k = getKey(item);
    map.set(k, (map.get(k) || 0) + 1);
  });
  return map;
}

const topEntries = (map, limit = 6) =>
  [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }));

const pctChange = (cur, prev) => {
  if (!prev) return null;
  return ((cur - prev) / prev) * 100;
};

// --- sales helpers (mirrors the rules used on the Sales page) ---
const saleTotal = (s) => Number(s?.totalAmount ?? s?.grandTotal ?? s?.total ?? 0) || 0;
const salePaid = (s) => Number(s?.paidAmount ?? 0) || 0;
const saleDue = (s) => {
  if (s?.dueAmount !== undefined && s?.dueAmount !== null) return Number(s.dueAmount) || 0;
  return Math.max(0, saleTotal(s) - salePaid(s));
};
const saleStatus = (s) =>
  String(s?.status || s?.saleStatus || "completed").toLowerCase();
const salePayStatus = (s) => String(s?.paymentStatus || "unpaid").toLowerCase();
const saleTime = (s) => ts(s, "saleDate", "createdAt");
const customerName = (s) => {
  const c = s?.customer;
  if (!c) return "Walk-in Customer";
  if (typeof c === "string") return "Customer";
  return c.name || c.customerName || "Walk-in Customer";
};
const itemName = (it) => {
  const p = it?.product;
  if (p && typeof p === "object") {
    return p.name || p.productName || it?.productInventory?.name || "Unnamed product";
  }
  return it?.productName || it?.productInventory?.name || "Product";
};

const PAY_STATUS_TONE = {
  paid: "green",
  partially_paid: "amber",
  partial: "amber",
  unpaid: "red",
  refunded: "violet",
};
const USER_STATUS_TONE = {
  active: "green",
  pending: "amber",
  rejected: "red",
  suspended: "violet",
};
const METHOD_TONE = {
  cash: "green",
  bank: "blue",
  card: "violet",
  cheque: "amber",
  credit: "red",
  other: "cyan",
};

/* =====================================================================
   SMALL UI PIECES
===================================================================== */

function useElementWidth(initial = 640) {
  const ref = useRef(null);
  const [width, setWidth] = useState(initial);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    setWidth(Math.max(260, Math.floor(el.getBoundingClientRect().width)));
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(([entry]) => {
      setWidth(Math.max(260, Math.floor(entry.contentRect.width)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, width];
}

function Sk({ className = "" }) {
  return <div className={`animate-pulse rounded-md bg-muted-action ${className}`} />;
}

function Pill({ tone = "brand", children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${className}`}
      style={{ background: tint(tone, 15), color: TONES[tone] }}
    >
      {children}
    </span>
  );
}

function EmptyMini({ text = "Nothing to show yet" }) {
  return (
    <div className="flex h-full min-h-[120px] items-center justify-center rounded-xl border border-dashed border-secondary px-4 py-6 text-center text-xs text-secondary">
      {text}
    </div>
  );
}

function Panel({ title, subtitle, action, children, className = "", delay = 0 }) {
  return (
    <section
      className={`animate-fade-up rounded-2xl border border-secondary bg-card p-4 sm:p-5 ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-primary">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-secondary">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

function PanelLink({ to, children }) {
  return (
    <Link
      to={to}
      className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-[var(--action-primary)] transition-colors hover:bg-brand/10"
    >
      {children}
      <ArrowUpRight className="h-3.5 w-3.5" />
    </Link>
  );
}

function Sparkline({ values = [], tone = "brand" }) {
  const uid = useId().replace(/:/g, "");
  if (!values.length || values.every((v) => !v)) return null;
  const w = 96;
  const h = 36;
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? w / (values.length - 1) : w;
  const pts = values.map((v, i) => [i * step, h - 3 - (v / max) * (h - 8)]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-9 w-24 shrink-0" aria-hidden="true">
      <defs>
        <linearGradient id={`sp-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={TONES[tone]} stopOpacity="0.35" />
          <stop offset="100%" stopColor={TONES[tone]} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sp-${uid})`} />
      <path d={line} fill="none" stroke={TONES[tone]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DeltaPill({ value }) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <Pill tone={up ? "green" : "red"}>
      <Icon className="h-3 w-3" />
      {Math.abs(value).toFixed(value >= 100 ? 0 : 1)}%
    </Pill>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "brand",
  loading,
  spark,
  delta,
  to,
  delay = 0,
  attention = false,
}) {
  const card = (
    <div
      className="group relative h-full animate-fade-up overflow-hidden rounded-2xl border border-secondary bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-5"
      style={{
        animationDelay: `${delay}ms`,
        backgroundImage: `radial-gradient(120% 100% at 100% 0%, ${tint(tone, 16)}, transparent 62%)`,
        boxShadow: attention ? `0 0 0 1.5px ${tint(tone, 55)}` : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: tint(tone, 18), color: TONES[tone] }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <DeltaPill value={delta} />
      </div>

      <p className="mt-4 text-[13px] text-secondary">{label}</p>

      <div className="mt-1 flex items-end justify-between gap-2">
        {loading ? (
          <Sk className="h-8 w-24" />
        ) : (
          <p className="min-w-0 truncate text-2xl font-semibold tabular-nums tracking-tight text-primary">
            {value}
          </p>
        )}
        {!loading && spark && <Sparkline values={spark} tone={tone} />}
      </div>

      {hint && !loading && <p className="mt-1 truncate text-xs text-secondary">{hint}</p>}
    </div>
  );

  return to ? (
    <Link to={to} className="block h-full rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--action-primary)]">
      {card}
    </Link>
  ) : (
    card
  );
}

/* ---------------------------- CHARTS ---------------------------- */

function niceMax(v) {
  if (!v || v <= 0) return 4;
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  const step = [1, 1.2, 1.6, 2, 2.4, 3, 4, 5, 6, 8, 10].find((s) => n <= s) || 10;
  return step * pow;
}

function AreaChart({
  labels,
  series,
  height = 250,
  formatY = compact,
  formatTip = (v) => NUM.format(v),
  emptyText = "No activity in this period",
}) {
  const uid = useId().replace(/:/g, "");
  const [ref, width] = useElementWidth();
  const [hover, setHover] = useState(null);

  const padL = 46;
  const padR = 14;
  const padT = 12;
  const padB = 26;
  const innerW = Math.max(width - padL - padR, 10);
  const innerH = height - padT - padB;
  const n = labels.length;
  const rawMax = Math.max(0, ...series.flatMap((s) => s.values));
  const max = niceMax(rawMax);

  const x = (i) => padL + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v) => padT + innerH - (v / max) * innerH;

  const linePath = (vals) =>
    vals
      .map((v, i) => {
        if (i === 0) return `M${x(0)},${y(v)}`;
        const cx = (x(i - 1) + x(i)) / 2;
        return `C${cx},${y(vals[i - 1])} ${cx},${y(v)} ${x(i)},${y(v)}`;
      })
      .join(" ");

  const labelStep = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(innerW / 70))));

  function handleMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = e.clientX - rect.left - padL;
    const idx = Math.round((rel / innerW) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, idx)));
  }

  return (
    <div
      ref={ref}
      className="relative w-full touch-pan-y select-none"
      onPointerMove={handleMove}
      onPointerLeave={() => setHover(null)}
    >
      <svg width={width} height={height} role="img" aria-label="Trend chart">
        <defs>
          {series.map((s, i) => (
            <linearGradient key={s.name} id={`ac-${uid}-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={TONES[s.tone]} stopOpacity="0.3" />
              <stop offset="100%" stopColor={TONES[s.tone]} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {[0, 1, 2, 3, 4].map((t) => {
          const v = (max * t) / 4;
          return (
            <g key={t}>
              <line
                x1={padL}
                x2={width - padR}
                y1={y(v)}
                y2={y(v)}
                stroke="var(--border-secondary-color)"
                strokeDasharray={t === 0 ? undefined : "3 4"}
              />
              <text x={padL - 8} y={y(v) + 4} textAnchor="end" fontSize="10.5" fill="var(--text-secondary-color)">
                {formatY(v)}
              </text>
            </g>
          );
        })}

        {labels.map((l, i) =>
          i % labelStep === 0 ? (
            <text key={`${l}-${i}`} x={x(i)} y={height - 7} textAnchor="middle" fontSize="10.5" fill="var(--text-secondary-color)">
              {l}
            </text>
          ) : null
        )}

        {series.map((s, i) => (
          <g key={s.name}>
            <path
              d={`${linePath(s.values)} L${x(n - 1)},${padT + innerH} L${x(0)},${padT + innerH} Z`}
              fill={`url(#ac-${uid}-${i})`}
            />
            <path d={linePath(s.values)} fill="none" stroke={TONES[s.tone]} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ))}

        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + innerH} stroke="var(--border-primary-color)" />
            {series.map((s) => (
              <circle key={s.name} cx={x(hover)} cy={y(s.values[hover])} r="4.5" fill="var(--ui-secondary)" stroke={TONES[s.tone]} strokeWidth="2.5" />
            ))}
          </g>
        )}
      </svg>

      {rawMax === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-6 text-xs text-secondary">
          {emptyText}
        </div>
      )}

      {hover !== null && (
        <div
          className="pointer-events-none absolute z-10 min-w-[130px] rounded-xl border border-secondary bg-card px-3 py-2 shadow-xl"
          style={{
            top: 8,
            left: x(hover),
            transform: `translateX(${x(hover) > width / 2 ? "calc(-100% - 12px)" : "12px"})`,
          }}
        >
          <p className="mb-1 text-[11px] font-medium text-secondary">{labels[hover]}</p>
          {series.map((s) => (
            <p key={s.name} className="flex items-center justify-between gap-4 text-xs text-primary">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: TONES[s.tone] }} />
                {s.name}
              </span>
              <span className="font-semibold tabular-nums">{formatTip(s.values[hover])}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function BarColumns({ data, tone = "brand", height = 190, labelEvery = 1, format = (v) => NUM.format(v), highlightLast = false }) {
  const max = Math.max(...data.map((d) => d.value), 0);
  if (!data.length || max === 0) return <EmptyMini text="No activity yet" />;

  return (
    <div>
      <div className="flex items-end gap-1 sm:gap-1.5" style={{ height }}>
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          const isLast = highlightLast && i === data.length - 1;
          return (
            <div key={`${d.label}-${i}`} className="group relative flex h-full flex-1 items-end">
              <div
                className="w-full rounded-t-md transition-all duration-200 group-hover:opacity-100"
                style={{
                  height: `${Math.max(pct, d.value > 0 ? 3 : 0.8)}%`,
                  background: TONES[tone],
                  opacity: d.value === 0 ? 0.25 : isLast ? 1 : 0.78,
                }}
              />
              <span className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-[var(--text-primary-color)] px-2 py-1 text-[11px] font-medium text-[var(--ui-secondary)] opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {d.label}: {format(d.value)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1 sm:gap-1.5">
        {data.map((d, i) => (
          <span key={`${d.label}-l-${i}`} className="flex-1 truncate text-center text-[10px] text-secondary">
            {i % labelEvery === 0 ? d.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function Donut({ segments, centerValue, centerLabel, format = (v) => NUM.format(v) }) {
  const active = segments.filter((s) => s.value > 0);
  const total = active.reduce((a, s) => a + s.value, 0);
  if (!total) return <EmptyMini text="No data yet" />;

  const r = 54;
  const c = 2 * Math.PI * r;
  let acc = 0;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" role="img" aria-label="Distribution chart">
          <circle cx="70" cy="70" r={r} fill="none" stroke="var(--border-secondary-color)" strokeWidth="16" />
          {active.map((s) => {
            const len = (s.value / total) * c;
            const gap = active.length > 1 ? Math.min(3, len * 0.25) : 0;
            const el = (
              <circle
                key={s.label}
                cx="70"
                cy="70"
                r={r}
                fill="none"
                stroke={TONES[s.tone]}
                strokeWidth="16"
                strokeDasharray={`${Math.max(len - gap, 0)} ${c}`}
                strokeDashoffset={-acc}
              />
            );
            acc += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold tabular-nums text-primary">{centerValue ?? format(total)}</span>
          {centerLabel && <span className="text-[11px] text-secondary">{centerLabel}</span>}
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-2">
        {active.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex min-w-0 items-center gap-2 text-primary">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: TONES[s.tone] }} />
              <span className="truncate">{s.label}</span>
            </span>
            <span className="shrink-0 tabular-nums text-secondary">
              <span className="font-semibold text-primary">{format(s.value)}</span> · {Math.round((s.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HBars({ items, tone = "brand", format = (v) => NUM.format(v) }) {
  const max = Math.max(...items.map((i) => i.value), 0);
  if (!items.length || max === 0) return <EmptyMini text="No data yet" />;
  return (
    <ul className="space-y-3.5">
      {items.map((it, idx) => {
        const t = it.tone || tone;
        return (
          <li key={`${it.label}-${idx}`}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-xs">
              <span className="truncate font-medium text-primary">{it.label}</span>
              <span className="shrink-0 tabular-nums text-secondary">
                <span className="font-semibold text-primary">{format(it.value)}</span>
                {it.sub ? ` · ${it.sub}` : ""}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted-action">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max((it.value / max) * 100, 3)}%`,
                  background: `linear-gradient(90deg, ${tint(t, 65)}, ${TONES[t]})`,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function RangeTabs({ value, onChange, options }) {
  return (
    <div className="inline-flex rounded-xl border border-secondary bg-card p-0.5" role="tablist" aria-label="Date range">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="tab"
          aria-selected={value === o}
          onClick={() => onChange(o)}
          className={`rounded-[10px] px-3 py-1.5 text-xs font-medium transition-colors ${
            value === o ? "bg-brand text-white shadow-sm" : "text-secondary hover:text-primary"
          }`}
        >
          {o}d
        </button>
      ))}
    </div>
  );
}

function Legend({ items }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {items.map((i) => (
        <span key={i.name} className="flex items-center gap-1.5 text-xs text-secondary">
          <span className="h-2 w-2 rounded-full" style={{ background: TONES[i.tone] }} />
          {i.name}
        </span>
      ))}
    </div>
  );
}

function Avatar({ name, tone }) {
  const t = tone || toneFor(name);
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
      style={{ background: tint(t, 18), color: TONES[t] }}
    >
      {initials(name)}
    </div>
  );
}

function ListRow({ title, sub, right, tone, avatarName }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <Avatar name={avatarName || title} tone={tone} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-primary">{title}</p>
        {sub && <p className="truncate text-xs text-secondary">{sub}</p>}
      </div>
      {right && <div className="shrink-0 text-right">{right}</div>}
    </li>
  );
}

function QuickActions({ items }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((a, i) => (
        <Link
          key={a.to + a.label}
          to={a.to}
          className="group flex animate-fade-up items-center gap-3 rounded-xl border border-secondary bg-card px-3 py-2.5 transition-all hover:-translate-y-0.5 hover:shadow-md"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: tint(a.tone, 16), color: TONES[a.tone] }}
          >
            <a.icon className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-primary">{a.label}</span>
          <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-secondary opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>
      ))}
    </div>
  );
}

/* ------------------------ ROLE WIDGETS ------------------------ */

function RegisterCard({ register, loading, unavailable }) {
  const isOpen = Boolean(register) && (register.status ? String(register.status).toLowerCase() === "open" : true);

  const opening = Number(register?.openingBalance) || 0;
  const cashSales = Number(register?.cashSales) || 0;
  const cashIn = Number(register?.cashIn) || 0;
  const cashOut = Number(register?.cashOut) || 0;
  const expenses = Number(register?.cashExpenses) || 0;
  const refunds = Number(register?.cashRefunds) || 0;
  const expected =
    register?.expectedClosingBalance !== undefined && register?.expectedClosingBalance !== null
      ? Number(register.expectedClosingBalance) || 0
      : opening + cashSales + cashIn - cashOut - expenses - refunds;

  const rows = [
    { label: "Opening", value: opening, tone: "blue" },
    { label: "Cash sales", value: cashSales, tone: "green" },
    { label: "Cash in", value: cashIn, tone: "cyan" },
    { label: "Cash out", value: cashOut, tone: "amber" },
    { label: "Expenses", value: expenses, tone: "red" },
    { label: "Refunds", value: refunds, tone: "violet" },
  ];

  return (
    <Panel
      title="Cash register"
      subtitle={isOpen ? `${register?.registerNumber || "Current shift"} · opened ${fmtDateTime(ts(register, "openedAt"))}` : "Shift status"}
      action={<PanelLink to="/cash-register">Manage</PanelLink>}
      className="h-full"
      delay={120}
    >
      {loading ? (
        <div className="space-y-3">
          <Sk className="h-10 w-40" />
          <Sk className="h-24 w-full" />
        </div>
      ) : isOpen ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-secondary">Expected in drawer</p>
              <p className="text-2xl font-semibold tabular-nums tracking-tight text-primary">{money(expected)}</p>
            </div>
            <Pill tone="green">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: TONES.green }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: TONES.green }} />
              </span>
              Open
            </Pill>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {rows.map((r) => (
              <div key={r.label} className="rounded-xl px-3 py-2" style={{ background: tint(r.tone, 10) }}>
                <p className="text-[11px] text-secondary">{r.label}</p>
                <p className="text-sm font-semibold tabular-nums" style={{ color: TONES[r.tone] }}>
                  {money(r.value)}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: tint("amber", 16), color: TONES.amber }}>
            <Landmark className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">{unavailable ? "Register unavailable" : "No register is open"}</p>
            <p className="mt-0.5 text-xs text-secondary">
              {unavailable ? "We couldn't load the register right now." : "Open a register to start tracking cash for this shift."}
            </p>
          </div>
          {!unavailable && (
            <Link to="/cash-register" className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-hover">
              <Plus className="h-3.5 w-3.5" /> Open register
            </Link>
          )}
        </div>
      )}
    </Panel>
  );
}

function RecentSales({ sales, loading, delay = 0 }) {
  return (
    <Panel
      title="Recent sales"
      subtitle="Latest transactions"
      action={<PanelLink to="/sales">View all</PanelLink>}
      className="h-full"
      delay={delay}
    >
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Sk key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : sales.length === 0 ? (
        <EmptyMini text="No sales yet — they'll appear here as soon as you make one." />
      ) : (
        <ul className="divide-y divide-[var(--border-secondary-color)]">
          {sales.map((s) => {
            const ps = salePayStatus(s);
            const cancelled = ["cancelled", "draft"].includes(saleStatus(s));
            return (
              <ListRow
                key={s._id || s.saleNumber}
                title={s.saleNumber || "Sale"}
                sub={`${customerName(s)} · ${fmtDateTime(saleTime(s))}`}
                avatarName={customerName(s)}
                right={
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-sm font-semibold tabular-nums text-primary ${cancelled ? "line-through opacity-60" : ""}`}>
                      {money(saleTotal(s))}
                    </span>
                    <Pill tone={cancelled ? "red" : PAY_STATUS_TONE[ps] || "cyan"}>
                      {cancelled ? titleCase(saleStatus(s)) : titleCase(ps)}
                    </Pill>
                  </div>
                }
              />
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function TeamCard({ managers, loading }) {
  const active = managers.filter((m) => String(m.status).toLowerCase() === "active").length;
  const pending = managers.filter((m) => String(m.status).toLowerCase() === "pending").length;
  const list = [...managers].sort((a, b) => ts(b, "createdAt") - ts(a, "createdAt")).slice(0, 4);

  return (
    <Panel
      title="Your team"
      subtitle="Managers under your business"
      action={<PanelLink to="/users">Manage</PanelLink>}
      className="h-full"
      delay={160}
    >
      {loading ? (
        <Sk className="h-32 w-full" />
      ) : managers.length === 0 ? (
        <EmptyMini text="No managers yet. Add one to share the workload." />
      ) : (
        <>
          <div className="mb-3 flex gap-2">
            <Pill tone="green">{active} active</Pill>
            {pending > 0 && <Pill tone="amber">{pending} pending</Pill>}
            <Pill tone="brand">{managers.length} total</Pill>
          </div>
          <ul className="divide-y divide-[var(--border-secondary-color)]">
            {list.map((m) => {
              const st = String(m.status || "unknown").toLowerCase();
              return (
                <ListRow
                  key={m._id}
                  title={m.name}
                  sub={m.email}
                  right={<Pill tone={USER_STATUS_TONE[st] || "cyan"}>{titleCase(st)}</Pill>}
                />
              );
            })}
          </ul>
        </>
      )}
    </Panel>
  );
}

/* =====================================================================
   DASHBOARD
===================================================================== */

export default function Dashboard() {
  const { user, role, can, isSuperAdmin } = usePermissions();

  const isSA = Boolean(isSuperAdmin) || role === "super-admin";
  const isAdmin = !isSA && role === "admin";
  const isManager = !isSA && role === "manager";
  const allow = (...perms) => perms.some((p) => can(p));

  const [rangeDays, setRangeDays] = useState(isManager ? 7 : 30);
  const rangeOptions = isManager ? [7, 14, 30] : [7, 30, 90];

  // ---------- what this role is allowed to load ----------
  const en = {
    businesses: isSA,
    types: isSA,
    brands: isSA,
    models: isSA,
    admins: isSA,
    managers: isAdmin,
    sales: (isAdmin || isManager) && allow("sales.read"),
    items: (isAdmin || isManager) && allow("sale-items.read"),
    payments: (isAdmin || isManager) && allow("sale-payments.read"),
    products: (isAdmin || isManager) && allow("products.read"),
    customers: (isAdmin || isManager) && allow("customers.read"),
    register: isAdmin || isManager,
  };

  // ---------- Super Admin queries ----------
  const usersQ = useGetUsersQuery(undefined, { skip: !en.admins });
  const businessesQ = useGetBusinessesQuery(undefined, { skip: !en.businesses });
  const typesQ = useGetBusinessTypesQuery(undefined, { skip: !en.types });
  const brandsQ = useGetBrandsQuery(undefined, { skip: !en.brands });
  const modelsQ = useGetModelsQuery({}, { skip: !en.models });

  // ---------- Admin queries ----------
  const managersQ = useGetManagersQuery(undefined, { skip: !en.managers });

  // ---------- Admin + Manager queries ----------
  const salesQ = useGetAllSalesQuery({ page: 1, limit: 100 }, { skip: !en.sales });
  const itemsQ = useGetAllSaleItemsQuery({ page: 1, limit: 100 }, { skip: !en.items });
  const paymentsQ = useGetAllSalePaymentsQuery({ page: 1, limit: 100 }, { skip: !en.payments });
  const productsQ = useGetProductsQuery({}, { skip: !en.products });
  const customersQ = useGetCustomersQuery({ page: 1, limit: 100 }, { skip: !en.customers });
  const registerQ = useGetCurrentCashRegisterQuery(undefined, { skip: !en.register });

  const allQueries = [
    [usersQ, en.admins],
    [businessesQ, en.businesses],
    [typesQ, en.types],
    [brandsQ, en.brands],
    [modelsQ, en.models],
    [managersQ, en.managers],
    [salesQ, en.sales],
    [itemsQ, en.items],
    [paymentsQ, en.payments],
    [productsQ, en.products],
    [customersQ, en.customers],
    [registerQ, en.register],
  ];
  const refreshing = allQueries.some(([q, on]) => on && q.isFetching);

  function refreshAll() {
    allQueries.forEach(([q, on]) => {
      if (on) {
        try {
          q.refetch();
        } catch {
          /* query not started yet */
        }
      }
    });
  }

  /* ---------------------- SUPER ADMIN ANALYTICS ---------------------- */

  const platform = useMemo(() => {
    if (!isSA) return null;

    const admins = toArray(usersQ.data, "users");
    const businesses = toArray(businessesQ.data, "businesses");
    const types = toArray(typesQ.data, "businessTypes");
    const brands = toArray(brandsQ.data, "brands");
    const models = toArray(modelsQ.data, "models");

    const statusOf = (a) => String(a?.status || "unknown").toLowerCase();
    const adminStatus = countBy(admins, statusOf);

    const buckets = monthBuckets(6);
    const perMonth = (arr) =>
      buckets.map((b) => arr.filter((x) => x?.createdAt && monthKey(x.createdAt) === b.key).length);

    const byNewest = (arr) => [...arr].sort((a, b) => ts(b, "createdAt") - ts(a, "createdAt"));

    return {
      admins,
      businesses,
      types,
      brands,
      models,
      activeAdmins: adminStatus.get("active") || 0,
      pendingAdmins: adminStatus.get("pending") || 0,
      blockedAdmins: (adminStatus.get("rejected") || 0) + (adminStatus.get("suspended") || 0),
      activeBusinesses: businesses.filter((b) => b.isActive).length,
      adminStatusSegments: ["active", "pending", "suspended", "rejected"].map((s) => ({
        label: titleCase(s),
        value: adminStatus.get(s) || 0,
        tone: USER_STATUS_TONE[s],
      })),
      businessSegments: [
        { label: "Active", value: businesses.filter((b) => b.isActive).length, tone: "green" },
        { label: "Inactive", value: businesses.filter((b) => !b.isActive).length, tone: "red" },
      ],
      growth: {
        labels: buckets.map((b) => b.label),
        businesses: perMonth(businesses),
        admins: perMonth(admins),
      },
      typesPerBusiness: topEntries(countBy(types, (t) => t?.business?.name || "Unassigned")),
      modelsPerBrand: topEntries(countBy(models, (m) => m?.brand?.name || "Unassigned")),
      adminsPerBusiness: topEntries(countBy(admins, (a) => a?.business?.name || "Unassigned")),
      pendingList: byNewest(admins.filter((a) => statusOf(a) === "pending")).slice(0, 5),
      recentBusinesses: byNewest(businesses).slice(0, 5),
      recentAdmins: byNewest(admins).slice(0, 5),
    };
  }, [isSA, usersQ.data, businessesQ.data, typesQ.data, brandsQ.data, modelsQ.data]);

  /* ---------------------- SALES ANALYTICS (Admin / Manager) ---------------------- */

  const sales = useMemo(
    () => toArray(salesQ.data, "sales").slice().sort((a, b) => saleTime(b) - saleTime(a)),
    [salesQ.data]
  );
  const salesTotalCount = salesQ.data?.data?.pagination?.total ?? salesQ.data?.pagination?.total ?? sales.length;
  const salesTruncated = salesTotalCount > sales.length;

  const analytics = useMemo(() => {
    if (!(isAdmin || isManager)) return null;

    const valid = sales.filter((s) => !["cancelled", "draft"].includes(saleStatus(s)));
    const today = startOfDay(new Date());
    const from = addDays(today, -(rangeDays - 1));
    const prevFrom = addDays(from, -rangeDays);
    const yesterday = addDays(today, -1);

    const daily = new Map();
    valid.forEach((s) => {
      const t = saleTime(s);
      if (!t) return;
      const k = dayKey(t);
      const rec = daily.get(k) || { revenue: 0, collected: 0, count: 0 };
      rec.revenue += saleTotal(s);
      rec.collected += salePaid(s);
      rec.count += 1;
      daily.set(k, rec);
    });

    const oldest = sales.length ? saleTime(sales[sales.length - 1]) : 0;
    const coversPrev = !salesTruncated || (oldest && oldest <= prevFrom.getTime());
    const coversYesterday = !salesTruncated || (oldest && oldest <= yesterday.getTime());

    const days = Array.from({ length: rangeDays }, (_, i) => {
      const d = addDays(from, i);
      const rec = daily.get(dayKey(d)) || { revenue: 0, collected: 0, count: 0 };
      return {
        label: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
        ...rec,
      };
    });

    const inRange = valid.filter((s) => saleTime(s) >= from.getTime());
    const inPrev = valid.filter((s) => saleTime(s) >= prevFrom.getTime() && saleTime(s) < from.getTime());
    const sum = (arr, fn) => arr.reduce((a, s) => a + fn(s), 0);

    const range = { revenue: sum(inRange, saleTotal), collected: sum(inRange, salePaid), count: inRange.length };
    const prev = { revenue: sum(inPrev, saleTotal), count: inPrev.length };

    const todayRec = daily.get(dayKey(today)) || { revenue: 0, collected: 0, count: 0 };
    const yRec = daily.get(dayKey(yesterday)) || { revenue: 0, collected: 0, count: 0 };

    const hours = Array.from({ length: 24 }, (_, h) => ({ label: hourLabel(h), value: 0 }));
    valid.forEach((s) => {
      const t = saleTime(s);
      if (t && dayKey(t) === dayKey(today)) hours[new Date(t).getHours()].value += 1;
    });

    const dueSales = valid.filter((s) => saleDue(s) > 0 && !["refunded"].includes(salePayStatus(s)));
    const dues = sum(dueSales, saleDue);

    const payStatus = countBy(inRange, salePayStatus);
    const payStatusSegments = ["paid", "partially_paid", "unpaid", "refunded"].map((k) => ({
      label: titleCase(k),
      value: payStatus.get(k) || 0,
      tone: PAY_STATUS_TONE[k],
    }));

    const custMap = new Map();
    inRange.forEach((s) => {
      const name = customerName(s);
      if (name === "Walk-in Customer" || name === "Customer") return;
      const rec = custMap.get(name) || { value: 0, count: 0 };
      rec.value += saleTotal(s);
      rec.count += 1;
      custMap.set(name, rec);
    });
    const topCustomers = [...custMap.entries()]
      .sort((a, b) => b[1].value - a[1].value)
      .slice(0, 5)
      .map(([label, r]) => ({ label, value: r.value, sub: `${r.count} order${r.count > 1 ? "s" : ""}` }));

    return {
      today,
      days,
      range,
      prev,
      todayRec,
      yRec,
      hours,
      dues,
      dueCount: dueSales.length,
      payStatusSegments,
      topCustomers,
      deltaRevenue: coversPrev ? pctChange(range.revenue, prev.revenue) : null,
      deltaCount: coversPrev ? pctChange(range.count, prev.count) : null,
      deltaToday: coversYesterday ? pctChange(todayRec.revenue, yRec.revenue) : null,
      deltaTodayCount: coversYesterday ? pctChange(todayRec.count, yRec.count) : null,
    };
  }, [isAdmin, isManager, sales, salesTruncated, rangeDays]);

  const topProducts = useMemo(() => {
    const items = toArray(itemsQ.data, "saleItems");
    const from = addDays(startOfDay(new Date()), -(rangeDays - 1)).getTime();
    const map = new Map();
    items.forEach((it) => {
      const t = ts(it, "createdAt");
      if (t && t < from) return;
      const name = itemName(it);
      const qty = Number(it?.quantity) || 0;
      const line = Number(it?.lineTotal ?? qty * (Number(it?.salePrice) || 0)) || 0;
      const rec = map.get(name) || { value: 0, qty: 0 };
      rec.value += line;
      rec.qty += qty;
      map.set(name, rec);
    });
    return [...map.entries()]
      .sort((a, b) => b[1].value - a[1].value)
      .slice(0, 6)
      .map(([label, r]) => ({ label, value: r.value, sub: `${NUM.format(r.qty)} sold` }));
  }, [itemsQ.data, rangeDays]);

  const paymentMethods = useMemo(() => {
    const list = toArray(paymentsQ.data, "payments", "salePayments");
    const from = addDays(startOfDay(new Date()), -(rangeDays - 1)).getTime();
    const map = new Map();
    list.forEach((p) => {
      const st = String(p?.status || "completed").toLowerCase();
      if (["failed", "cancelled", "pending"].includes(st)) return;
      const t = ts(p, "paymentDate", "createdAt");
      if (t && t < from) return;
      const m = String(p?.paymentMethod || "other").toLowerCase();
      map.set(m, (map.get(m) || 0) + (Number(p?.amount) || 0));
    });
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([m, value], i) => ({
        label: titleCase(m),
        value,
        tone: METHOD_TONE[m] || TONE_CYCLE[i % TONE_CYCLE.length],
      }));
  }, [paymentsQ.data, rangeDays]);

  const catalog = useMemo(() => {
    const products = toArray(productsQ.data, "products");
    const active = products.filter((p) => p?.isActive !== false).length;
    const categories = topEntries(countBy(products, (p) => p?.category?.name || "Uncategorized"), 5).map((c, i) => ({
      ...c,
      tone: TONE_CYCLE[i % TONE_CYCLE.length],
    }));
    return { total: products.length, active, categories };
  }, [productsQ.data]);

  const customers = useMemo(() => {
    const list = toArray(customersQ.data, "customers");
    const total = customersQ.data?.pagination?.total ?? list.length;
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    return { total, newThisMonth: list.filter((c) => ts(c, "createdAt") >= monthStart).length };
  }, [customersQ.data]);

  const managers = useMemo(() => toArray(managersQ.data, "managers"), [managersQ.data]);
  const register = registerQ.data || null;

  /* ---------------------- HEADER ---------------------- */

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] || "there";
  const dateText = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  let summary = "Here's how your workspace is doing.";
  if (isSA && platform) {
    summary =
      platform.pendingAdmins > 0
        ? `${platform.pendingAdmins} admin account${platform.pendingAdmins > 1 ? "s are" : " is"} waiting for your approval.`
        : `${platform.businesses.length} business${platform.businesses.length === 1 ? "" : "es"} and ${platform.admins.length} admin account${platform.admins.length === 1 ? "" : "s"} on the platform. Nothing needs approval right now.`;
  } else if (analytics && en.sales) {
    summary = `Today: ${analytics.todayRec.count} order${analytics.todayRec.count === 1 ? "" : "s"} · ${money(analytics.todayRec.revenue)} in sales.`;
  }

  const roleLabel = isSA ? "Super Admin" : isAdmin ? "Business Owner" : isManager ? "Manager" : "Member";
  const roleTone = isSA ? "violet" : isAdmin ? "brand" : "cyan";
  const scopeText = [user?.business?.name, user?.businessType?.name].filter(Boolean).join(" · ");

  const quickActions = isSA
    ? [
        { to: "/businesses", label: "Businesses", icon: Building2, tone: "blue" },
        { to: "/business-types", label: "Business types", icon: Layers3, tone: "violet" },
        { to: "/brands", label: "Brands", icon: Tags, tone: "pink" },
        { to: "/models", label: "Models", icon: Boxes, tone: "cyan" },
        { to: "/users", label: "Admin accounts", icon: Users, tone: "brand" },
        { to: "/roles", label: "Roles", icon: ShieldCheck, tone: "green" },
      ]
    : isAdmin
      ? [
          { to: "/pos", label: "Open POS", icon: ShoppingCart, tone: "brand" },
          { to: "/sales", label: "Sales", icon: Receipt, tone: "green" },
          { to: "/products", label: "Products", icon: Package, tone: "pink" },
          { to: "/customers", label: "Customers", icon: UsersRound, tone: "cyan" },
          { to: "/cash-register", label: "Cash register", icon: Landmark, tone: "amber" },
          { to: "/users", label: "Managers", icon: Users, tone: "violet" },
        ]
      : [
          { to: "/pos", label: "Start selling", icon: ShoppingCart, tone: "brand" },
          { to: "/sales", label: "Sales", icon: Receipt, tone: "green" },
          { to: "/customers", label: "Customers", icon: UsersRound, tone: "cyan" },
          { to: "/cash-register", label: "Cash register", icon: Landmark, tone: "amber" },
          { to: "/sale-payments", label: "Payments", icon: CreditCard, tone: "violet" },
          { to: "/products", label: "Products", icon: Package, tone: "pink" },
        ];

  const registerOpen =
    Boolean(register) && (register.status ? String(register.status).toLowerCase() === "open" : true);

  const registerExpected = registerOpen
    ? register.expectedClosingBalance ??
      (Number(register.openingBalance) || 0) +
        (Number(register.cashSales) || 0) +
        (Number(register.cashIn) || 0) -
        (Number(register.cashOut) || 0) -
        (Number(register.cashExpenses) || 0) -
        (Number(register.cashRefunds) || 0)
    : null;

  /* ---------------------- KPI DEFINITIONS PER ROLE ---------------------- */

  const salesLoading = salesQ.isLoading;
  const avg = (rev, n) => (n ? rev / n : 0);

  let kpis = [];

  if (isSA && platform) {
    kpis = [
      { icon: Building2, label: "Businesses", value: platform.businesses.length, hint: `${platform.activeBusinesses} active`, tone: "blue", loading: businessesQ.isLoading, to: "/businesses" },
      { icon: Layers3, label: "Business types", value: platform.types.length, hint: "Across all businesses", tone: "violet", loading: typesQ.isLoading, to: "/business-types" },
      { icon: Tags, label: "Brands", value: platform.brands.length, hint: "Registered brands", tone: "pink", loading: brandsQ.isLoading, to: "/brands" },
      { icon: Boxes, label: "Models", value: platform.models.length, hint: "Product models", tone: "cyan", loading: modelsQ.isLoading, to: "/models" },
      { icon: Users, label: "Admin accounts", value: platform.admins.length, hint: "Business owners", tone: "brand", loading: usersQ.isLoading, to: "/users" },
      { icon: UserCheck, label: "Active admins", value: platform.activeAdmins, hint: platform.admins.length ? `${Math.round((platform.activeAdmins / platform.admins.length) * 100)}% of all admins` : "—", tone: "green", loading: usersQ.isLoading },
      { icon: Hourglass, label: "Pending approval", value: platform.pendingAdmins, hint: platform.pendingAdmins ? "Needs your review" : "All caught up", tone: "amber", loading: usersQ.isLoading, to: "/users", attention: platform.pendingAdmins > 0 },
      { icon: UserX, label: "Suspended / rejected", value: platform.blockedAdmins, hint: "Blocked accounts", tone: "red", loading: usersQ.isLoading, to: "/users" },
    ];
  } else if (isAdmin && analytics) {
    kpis = [
      en.sales && { icon: CircleDollarSign, label: `Revenue (${rangeDays}d)`, value: moneyFit(analytics.range.revenue), hint: `${money(analytics.range.collected)} collected`, tone: "green", loading: salesLoading, spark: analytics.days.map((d) => d.revenue), delta: analytics.deltaRevenue, to: "/sales" },
      en.sales && { icon: Wallet, label: "Today's revenue", value: moneyFit(analytics.todayRec.revenue), hint: `${analytics.todayRec.count} order${analytics.todayRec.count === 1 ? "" : "s"} today`, tone: "brand", loading: salesLoading, delta: analytics.deltaToday, to: "/sales" },
      en.sales && { icon: Receipt, label: `Orders (${rangeDays}d)`, value: NUM.format(analytics.range.count), hint: "Completed & active sales", tone: "blue", loading: salesLoading, spark: analytics.days.map((d) => d.count), delta: analytics.deltaCount, to: "/sales" },
      en.sales && { icon: Banknote, label: "Avg. order value", value: moneyFit(avg(analytics.range.revenue, analytics.range.count)), hint: `Last ${rangeDays} days`, tone: "violet", loading: salesLoading },
      en.sales && { icon: Hourglass, label: "Outstanding dues", value: moneyFit(analytics.dues), hint: `${analytics.dueCount} sale${analytics.dueCount === 1 ? "" : "s"} with balance`, tone: "red", loading: salesLoading, to: "/sales" },
      en.customers && { icon: UsersRound, label: "Customers", value: NUM.format(customers.total), hint: `${customers.newThisMonth} new this month`, tone: "cyan", loading: customersQ.isLoading, to: "/customers" },
      en.products && { icon: Package, label: "Active products", value: NUM.format(catalog.active), hint: `${catalog.total} in catalog`, tone: "pink", loading: productsQ.isLoading, to: "/products" },
      en.managers && { icon: Users, label: "Managers", value: NUM.format(managers.length), hint: `${managers.filter((m) => String(m.status).toLowerCase() === "active").length} active`, tone: "amber", loading: managersQ.isLoading, to: "/users" },
    ].filter(Boolean);
  } else if (isManager && analytics) {
    kpis = [
      en.sales && { icon: Wallet, label: "Today's revenue", value: moneyFit(analytics.todayRec.revenue), hint: "vs. yesterday", tone: "brand", loading: salesLoading, delta: analytics.deltaToday, to: "/sales" },
      en.sales && { icon: Receipt, label: "Today's orders", value: NUM.format(analytics.todayRec.count), hint: `${analytics.yRec.count} yesterday`, tone: "blue", loading: salesLoading, delta: analytics.deltaTodayCount, to: "/sales" },
      en.sales && { icon: Banknote, label: "Avg. ticket today", value: moneyFit(avg(analytics.todayRec.revenue, analytics.todayRec.count)), hint: "Per order", tone: "violet", loading: salesLoading },
      en.sales && { icon: CircleDollarSign, label: "Collected today", value: moneyFit(analytics.todayRec.collected), hint: "Payments received", tone: "green", loading: salesLoading },
      en.sales && { icon: Hourglass, label: "Outstanding dues", value: moneyFit(analytics.dues), hint: `${analytics.dueCount} to collect`, tone: "red", loading: salesLoading, to: "/sales" },
      { icon: Landmark, label: "Register balance", value: registerExpected === null ? "Closed" : moneyFit(registerExpected), hint: registerExpected === null ? "Open a register to start" : "Expected in drawer", tone: "cyan", loading: registerQ.isLoading, to: "/cash-register" },
      en.customers && { icon: UsersRound, label: "Customers", value: NUM.format(customers.total), hint: `${customers.newThisMonth} new this month`, tone: "pink", loading: customersQ.isLoading, to: "/customers" },
      en.products && { icon: Package, label: "Active products", value: NUM.format(catalog.active), hint: `${catalog.total} in catalog`, tone: "amber", loading: productsQ.isLoading, to: "/products" },
    ].filter(Boolean);
  }

  const registerUnavailable = registerQ.isError && registerQ.error?.status !== 404;

  /* ---------------------- RENDER ---------------------- */

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 pb-10">
      {/* ================= HEADER ================= */}
      <div className="animate-fade-up flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Pill tone={roleTone}>{roleLabel}</Pill>
            {scopeText && !isSA && <span className="truncate text-xs text-secondary">{scopeText}</span>}
            <span className="flex items-center gap-1 text-xs text-secondary">
              <Clock className="h-3 w-3" /> {dateText}
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-primary">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-secondary">{summary}</p>
        </div>

        <div className="flex items-center gap-2">
          {(isAdmin || isManager) && en.sales && (
            <RangeTabs value={rangeDays} onChange={setRangeDays} options={rangeOptions} />
          )}
          <button
            type="button"
            onClick={refreshAll}
            disabled={refreshing}
            aria-label="Refresh dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-secondary bg-card px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-muted-action disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ================= QUICK ACTIONS (all roles) ================= */}
      <QuickActions items={quickActions} />

      {/* ================= KPI CARDS ================= */}
      {kpis.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((k, i) => (
            <StatCard key={k.label} delay={i * 45} {...k} />
          ))}
        </div>
      ) : (
        !isSA && (
          <Panel>
            <EmptyMini text="Your role doesn't have access to any dashboard metrics yet. Ask your administrator to grant read permissions." />
          </Panel>
        )
      )}

      {(isAdmin || isManager) && en.sales && salesTruncated && (
        <p className="flex items-start gap-2 rounded-xl border border-secondary bg-card px-3 py-2 text-xs text-secondary">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Charts and totals use your latest {sales.length} of {salesTotalCount} sales. Older sales aren't included in these figures.
        </p>
      )}

      {/* =====================================================
          SUPER ADMIN VIEW — platform-wide
      ===================================================== */}
      {isSA && platform && (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Panel
              title="Platform growth"
              subtitle="New businesses and admin accounts, last 6 months"
              action={<Legend items={[{ name: "Businesses", tone: "blue" }, { name: "Admins", tone: "brand" }]} />}
              className="xl:col-span-2"
              delay={80}
            >
              <AreaChart
                labels={platform.growth.labels}
                series={[
                  { name: "Businesses", tone: "blue", values: platform.growth.businesses },
                  { name: "Admins", tone: "brand", values: platform.growth.admins },
                ]}
                formatY={(v) => NUM.format(Math.round(v))}
                emptyText="No accounts created in the last 6 months"
              />
            </Panel>

            <Panel title="Admin accounts by status" subtitle="Approval pipeline" delay={120}>
              <Donut segments={platform.adminStatusSegments} centerValue={platform.admins.length} centerLabel="admins" />
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
            <Panel title="Businesses" subtitle="Active vs inactive" delay={140}>
              <Donut segments={platform.businessSegments} centerValue={platform.businesses.length} centerLabel="total" />
            </Panel>
            <Panel title="Types per business" subtitle="Top 6 businesses" delay={160}>
              <HBars items={platform.typesPerBusiness} tone="violet" />
            </Panel>
            <Panel title="Models per brand" subtitle="Top 6 brands" delay={180}>
              <HBars items={platform.modelsPerBrand} tone="cyan" />
            </Panel>
            <Panel title="Admins per business" subtitle="Top 6 businesses" delay={200}>
              <HBars items={platform.adminsPerBusiness} tone="brand" />
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Panel
              title="Needs approval"
              subtitle="Admin accounts waiting for review"
              action={<PanelLink to="/users">Review</PanelLink>}
              delay={220}
            >
              {usersQ.isLoading ? (
                <Sk className="h-32 w-full" />
              ) : platform.pendingList.length === 0 ? (
                <EmptyMini text="No pending approvals. You're all caught up." />
              ) : (
                <ul className="divide-y divide-[var(--border-secondary-color)]">
                  {platform.pendingList.map((a) => (
                    <ListRow
                      key={a._id}
                      title={a.name}
                      sub={a.business?.name || a.email}
                      right={<Pill tone="amber">Pending</Pill>}
                    />
                  ))}
                </ul>
              )}
            </Panel>

            <Panel
              title="Recently added businesses"
              action={<PanelLink to="/businesses">View all</PanelLink>}
              delay={240}
            >
              {businessesQ.isLoading ? (
                <Sk className="h-32 w-full" />
              ) : platform.recentBusinesses.length === 0 ? (
                <EmptyMini text="No businesses yet." />
              ) : (
                <ul className="divide-y divide-[var(--border-secondary-color)]">
                  {platform.recentBusinesses.map((b) => (
                    <ListRow
                      key={b._id}
                      title={b.name}
                      sub={`Added ${fmtDate(ts(b, "createdAt"))}`}
                      right={<Pill tone={b.isActive ? "green" : "red"}>{b.isActive ? "Active" : "Inactive"}</Pill>}
                    />
                  ))}
                </ul>
              )}
            </Panel>

            <Panel
              title="Recently added admins"
              action={<PanelLink to="/users">View all</PanelLink>}
              delay={260}
            >
              {usersQ.isLoading ? (
                <Sk className="h-32 w-full" />
              ) : platform.recentAdmins.length === 0 ? (
                <EmptyMini text="No admin accounts yet." />
              ) : (
                <ul className="divide-y divide-[var(--border-secondary-color)]">
                  {platform.recentAdmins.map((a) => {
                    const st = String(a.status || "unknown").toLowerCase();
                    return (
                      <ListRow
                        key={a._id}
                        title={a.name}
                        sub={a.business?.name || a.email}
                        right={<Pill tone={USER_STATUS_TONE[st] || "cyan"}>{titleCase(st)}</Pill>}
                      />
                    );
                  })}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}

      {/* =====================================================
          ADMIN VIEW — business owner
      ===================================================== */}
      {isAdmin && analytics && (
        <>
          {en.sales && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <Panel
                title="Revenue vs collected"
                subtitle={`Daily, last ${rangeDays} days`}
                action={<Legend items={[{ name: "Revenue", tone: "green" }, { name: "Collected", tone: "brand" }]} />}
                className="xl:col-span-2"
                delay={80}
              >
                {salesLoading ? (
                  <Sk className="h-[250px] w-full" />
                ) : (
                  <AreaChart
                    labels={analytics.days.map((d) => d.label)}
                    series={[
                      { name: "Revenue", tone: "green", values: analytics.days.map((d) => d.revenue) },
                      { name: "Collected", tone: "brand", values: analytics.days.map((d) => d.collected) },
                    ]}
                    formatY={(v) => compact(v)}
                    formatTip={money}
                  />
                )}
              </Panel>

              <Panel title="Sales by payment status" subtitle={`Last ${rangeDays} days`} delay={120}>
                <Donut segments={analytics.payStatusSegments} centerValue={analytics.range.count} centerLabel="orders" />
              </Panel>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {en.items && (
              <Panel title="Top products" subtitle={`By revenue, last ${rangeDays} days`} action={<PanelLink to="/sale-items">Details</PanelLink>} delay={140}>
                {itemsQ.isLoading ? <Sk className="h-40 w-full" /> : <HBars items={topProducts} tone="pink" format={moneyFit} />}
              </Panel>
            )}
            {en.sales && (
              <Panel title="Top customers" subtitle={`By spend, last ${rangeDays} days`} action={<PanelLink to="/customers">Customers</PanelLink>} delay={160}>
                {salesLoading ? <Sk className="h-40 w-full" /> : <HBars items={analytics.topCustomers} tone="cyan" format={moneyFit} />}
              </Panel>
            )}
            {en.payments && (
              <Panel title="Payment methods" subtitle={`Money received, last ${rangeDays} days`} delay={180}>
                {paymentsQ.isLoading ? (
                  <Sk className="h-40 w-full" />
                ) : (
                  <Donut segments={paymentMethods} centerValue={moneyFit(paymentMethods.reduce((a, p) => a + p.value, 0))} centerLabel="received" format={moneyFit} />
                )}
              </Panel>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {en.sales && (
              <div className="xl:col-span-2">
                <RecentSales sales={sales.slice(0, 6)} loading={salesLoading} delay={200} />
              </div>
            )}
            <RegisterCard register={register} loading={registerQ.isLoading} unavailable={registerUnavailable} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <TeamCard managers={managers} loading={managersQ.isLoading} />
            {en.products && (
              <Panel title="Catalog by category" subtitle="Products per category" action={<PanelLink to="/categories">Categories</PanelLink>} className="h-full" delay={200}>
                {productsQ.isLoading ? <Sk className="h-40 w-full" /> : <Donut segments={catalog.categories} centerValue={catalog.total} centerLabel="products" />}
              </Panel>
            )}
            {en.sales && (
              <Panel title="Orders per day" subtitle={`Last ${Math.min(rangeDays, 14)} days`} className="h-full" delay={220}>
                <BarColumns
                  data={analytics.days.slice(-Math.min(rangeDays, 14)).map((d) => ({ label: d.label, value: d.count }))}
                  tone="blue"
                  labelEvery={2}
                  highlightLast
                />
              </Panel>
            )}
          </div>
        </>
      )}

      {/* =====================================================
          MANAGER VIEW — day-to-day operations
      ===================================================== */}
      {isManager && analytics && (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {en.sales && (
              <Panel title="Today's orders by hour" subtitle="Your busiest times today" className="xl:col-span-2" delay={80}>
                {salesLoading ? <Sk className="h-[210px] w-full" /> : <BarColumns data={analytics.hours} tone="brand" labelEvery={3} height={200} />}
              </Panel>
            )}
            <RegisterCard register={register} loading={registerQ.isLoading} unavailable={registerUnavailable} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {en.sales && (
              <Panel
                title="Sales trend"
                subtitle={`Daily revenue, last ${rangeDays} days`}
                action={<Legend items={[{ name: "Revenue", tone: "green" }, { name: "Collected", tone: "brand" }]} />}
                className="xl:col-span-2"
                delay={120}
              >
                {salesLoading ? (
                  <Sk className="h-[250px] w-full" />
                ) : (
                  <AreaChart
                    labels={analytics.days.map((d) => d.label)}
                    series={[
                      { name: "Revenue", tone: "green", values: analytics.days.map((d) => d.revenue) },
                      { name: "Collected", tone: "brand", values: analytics.days.map((d) => d.collected) },
                    ]}
                    formatY={(v) => compact(v)}
                    formatTip={money}
                  />
                )}
              </Panel>
            )}
            {en.payments && (
              <Panel title="Payment methods" subtitle={`Money received, last ${rangeDays} days`} delay={140}>
                {paymentsQ.isLoading ? (
                  <Sk className="h-40 w-full" />
                ) : (
                  <Donut segments={paymentMethods} centerValue={moneyFit(paymentMethods.reduce((a, p) => a + p.value, 0))} centerLabel="received" format={moneyFit} />
                )}
              </Panel>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {en.sales && (
              <div className="xl:col-span-2">
                <RecentSales sales={sales.slice(0, 6)} loading={salesLoading} delay={160} />
              </div>
            )}
            {en.items && (
              <Panel title="Best sellers" subtitle={`By revenue, last ${rangeDays} days`} action={<PanelLink to="/sale-items">Details</PanelLink>} className="h-full" delay={180}>
                {itemsQ.isLoading ? <Sk className="h-40 w-full" /> : <HBars items={topProducts} tone="pink" format={moneyFit} />}
              </Panel>
            )}
          </div>
        </>
      )}
    </div>
  );
}