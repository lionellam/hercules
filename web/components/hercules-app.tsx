"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { signOutAction } from "@/app/actions";
import ReviewCard, { type Fields } from "./review-card";
import ThemeToggle from "./theme-toggle";

type Category = { id: number; name: string; is_other: boolean; monthly_budget: number | null };
type Expense = Fields & { id: number; amount: number; raw_input: string; category: string; was_edited: boolean };
type SummaryRow = { category: string; total: number; count: number; budget?: number | null };
type Tab = "log" | "history" | "summary" | "categories";

const pad = (n: number) => String(n).padStart(2, "0");
const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const monthKey = (offset: number) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};
const monthLabel = (key: string, opts: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" }) =>
  new Date(`${key}-01T00:00:00`).toLocaleDateString("en-SG", opts);
const fmt = (n: number) => n.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } });
  if (res.status === 401) {
    window.location.href = "/signin";
    throw new Error("Not signed in");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data as T;
}

function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}

const expensesUrl = (month: string) => `/api/expenses?month=${month}`;
const summaryUrl = (month: string) => `/api/summary?month=${month}`;

// Holds API responses in memory only, so they are gone once the app closes or the user signs out
function useApiCache() {
  const [data, setData] = useState<Record<string, unknown>>({});
  // The newest request for each URL still in flight; older responses are ignored so they can't overwrite newer data
  const pending = useRef(new Map<string, object>());

  const load = useCallback((url: string, force = false) => {
    if (!force && pending.current.has(url)) return;
    const request = {};
    pending.current.set(url, request);
    const isNewest = () => pending.current.get(url) === request;
    api<unknown>(url)
      .then((result) => {
        if (isNewest()) setData((d) => ({ ...d, [url]: result }));
      })
      .catch(() => {
        // Keep what's already showing; every cached endpoint returns a list
        if (isNewest()) setData((d) => (url in d ? d : { ...d, [url]: [] }));
      })
      .finally(() => {
        if (isNewest()) pending.current.delete(url);
      });
  }, []);

  const reloadAll = () => {
    for (const url of new Set([...Object.keys(data), ...pending.current.keys()])) load(url, true);
  };

  return { data, load, reloadAll };
}
type ApiCache = ReturnType<typeof useApiCache>;

// Returns the last-loaded response straight away, and fetches a fresh copy each time a screen opens
function useCached<T>({ data, load }: ApiCache, url: string) {
  useEffect(() => load(url), [load, url]);
  return data[url] as T | undefined;
}

export default function HerculesApp({ email }: { email: string }) {
  const [tab, setTab] = useState<Tab>("log");
  const cache = useApiCache();
  const categories = useCached<Category[]>(cache, "/api/categories") ?? [];
  const { load } = cache;
  const online = useOnline();

  useEffect(() => {
    // Load the other tabs' default views up front so they open instantly
    load(expensesUrl(monthKey(0)));
    load(summaryUrl(monthKey(0)));
    load(summaryUrl(monthKey(-1)));
  }, [load]);

  return (
    <main className="app">
      {tab === "log" && <LogScreen categories={categories} online={online} cache={cache} onSaved={cache.reloadAll} />}
      {tab === "history" && <HistoryScreen categories={categories} online={online} cache={cache} onChanged={cache.reloadAll} />}
      {tab === "summary" && <SummaryScreen email={email} cache={cache} categories={categories} />}
      {tab === "categories" && <CategoriesScreen categories={categories} online={online} onChanged={cache.reloadAll} />}
      <nav className="tabs">
        <TabButton id="log" tab={tab} setTab={setTab} label="Log" path="M12 5v14M5 12h14" />
        <TabButton id="history" tab={tab} setTab={setTab} label="History" path="M4 6h16M4 12h16M4 18h10" />
        <TabButton id="summary" tab={tab} setTab={setTab} label="Summary" path="M6 20V10M12 20V4M18 20v-6" />
        <TabButton id="categories" tab={tab} setTab={setTab} label="Categories" path="M4 5h7l9 9-6 6-9-9V5zM8 9h.01" />
      </nav>
    </main>
  );
}

function TabButton({ id, tab, setTab, label, path }: { id: Tab; tab: Tab; setTab: (t: Tab) => void; label: string; path: string }) {
  return (
    <button className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d={path} />
      </svg>
      {label}
    </button>
  );
}

function ExpenseRow({ e, onClick }: { e: Expense; onClick?: () => void }) {
  return (
    <button className="item" onClick={onClick}>
      <div>
        <div className="m">{e.merchant || e.raw_input}</div>
        <div className="c">
          {e.category}
          {e.was_edited && <span className="edited">edited</span>}
        </div>
      </div>
      <div className="a">
        {e.currency !== "SGD" && `${e.currency} `}
        {fmt(e.amount)}
      </div>
    </button>
  );
}

function EditSheet({ expense, categories, online, onClose, onChanged }: { expense: Expense; categories: Category[]; online: boolean; onClose: () => void; onChanged: () => void }) {
  async function save(fields: Fields, edited: boolean) {
    await api(`/api/expenses/${expense.id}`, { method: "PATCH", body: JSON.stringify({ ...fields, was_edited: edited }) });
    onClose();
    onChanged();
  }

  async function remove() {
    if (!confirm("Delete this expense?")) return;
    await api(`/api/expenses/${expense.id}`, { method: "DELETE" });
    onClose();
    onChanged();
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(ev) => ev.stopPropagation()}>
        <ReviewCard
          title="Edit expense"
          rawInput={expense.raw_input}
          initial={expense}
          categories={categories}
          onSave={save}
          onCancel={onClose}
          cancelLabel="Cancel"
          onDelete={remove}
          disabled={!online}
        />
      </div>
    </div>
  );
}

// Totals are added without currency conversion, as in Summary
function TodayByCategory({ expenses }: { expenses: Expense[] }) {
  const byCategory = new Map<string, SummaryRow>();
  for (const e of expenses) {
    const row = byCategory.get(e.category) ?? { category: e.category, total: 0, count: 0 };
    row.total += e.amount;
    row.count += 1;
    byCategory.set(e.category, row);
  }
  const rows = [...byCategory.values()].sort((a, b) => b.total - a.total);
  const total = rows.reduce((s, r) => s + r.total, 0);
  const max = rows[0]?.total || 1;

  return (
    <>
      <p className="recent-h split">
        <span>TODAY BY CATEGORY</span>
        <span>${fmt(total)}</span>
      </p>
      {rows.map((r) => (
        <div className="cat" key={r.category}>
          <div className="cat-top">
            <span>
              {r.category}
              <span className="n">{r.count}</span>
            </span>
            <strong>{fmt(r.total)}</strong>
          </div>
          <div className="track">
            <div className="fill" style={{ width: `${(r.total / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </>
  );
}

function LogScreen({ categories, online, cache, onSaved }: { categories: Category[]; online: boolean; cache: ApiCache; onSaved: () => void }) {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<{ raw: string; fields: Fields } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [editing, setEditing] = useState<Expense | null>(null);
  const todayKey = localToday();
  const monthRows = useCached<Expense[]>(cache, expensesUrl(todayKey.slice(0, 7)));
  const todays = monthRows?.filter((r) => r.date === todayKey) ?? [];

  async function parse() {
    setBusy(true);
    setError("");
    try {
      const raw = text.trim();
      const r = await api<Fields & { category_id: number | null }>("/api/parse", {
        method: "POST",
        body: JSON.stringify({ text: raw, today: localToday() }),
      });
      setParsed({ raw, fields: { ...r, category_id: r.category_id ?? categories.at(-1)?.id ?? 0 } });
      // The review card sits at the top of the scrolling content, so it could otherwise open out of view
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function save(fields: Fields, edited: boolean) {
    if (!parsed) return;
    await api("/api/expenses", {
      method: "POST",
      body: JSON.stringify({ ...fields, raw_input: parsed.raw, was_edited: edited }),
    });
    setParsed(null);
    setText("");
    setToast("Saved");
    setTimeout(() => setToast(""), 1600);
    onSaved();
  }

  const today = new Date().toLocaleDateString("en-SG", { weekday: "long", day: "numeric", month: "long" });

  return (
    <section className="screen pinned-screen">
      <div className="pinned-top">
        <ThemeToggle />
        <div className="greet">
          <p className="sub">{today}</p>
          <h1>Log an expense</h1>
        </div>
        {!online && <p className="offline">You&apos;re offline. Your text is kept — parse it when you&apos;re back online.</p>}
        <div className="input-wrap">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Lunch at LJS for $4.50 yesterday"
            maxLength={500}
          />
          <div className="row-end">
            <button className="btn btn-primary" disabled={!text.trim() || busy || !online || !!parsed} onClick={parse}>
              {busy ? "Parsing…" : "Parse"}
            </button>
          </div>
        </div>
        <p className="today-total">
          <span>Spent today</span>
          <strong>{monthRows ? `$${fmt(todays.reduce((sum, e) => sum + e.amount, 0))}` : "—"}</strong>
        </p>
        {error && <p className="error">{error}</p>}
        {toast && <p className="toast">{toast}</p>}
      </div>
      {parsed && (
        <ReviewCard
          title="Review before saving"
          initial={parsed.fields}
          categories={categories}
          onSave={save}
          onCancel={() => setParsed(null)}
          cancelLabel="Discard"
          disabled={!online}
        />
      )}
      <div className="columns">
        <div>
          <p className="recent-h">TODAY</p>
          {todays.length ? todays.map((e) => <ExpenseRow key={e.id} e={e} onClick={() => setEditing(e)} />) : <p className="sub">Nothing logged yet today.</p>}
        </div>
        {todays.length > 0 && (
          <div>
            <TodayByCategory expenses={todays} />
          </div>
        )}
      </div>
      {editing && <EditSheet expense={editing} categories={categories} online={online} onClose={() => setEditing(null)} onChanged={onSaved} />}
    </section>
  );
}

function HistoryScreen({ categories, online, cache, onChanged }: { categories: Category[]; online: boolean; cache: ApiCache; onChanged: () => void }) {
  const [offset, setOffset] = useState(0);
  const [editing, setEditing] = useState<Expense | null>(null);
  const month = monthKey(offset);
  const rows = useCached<Expense[]>(cache, expensesUrl(month));

  function changeMonth(by: number) {
    setOffset(offset + by);
    // Otherwise the new month opens partway down its list
    window.scrollTo({ top: 0 });
  }

  let lastDay = "";
  return (
    <section className="screen pinned-screen">
      <div className="pinned-top">
        <ThemeToggle />
        <h1>History</h1>
        <div className="month-switch">
          <button onClick={() => changeMonth(-1)} aria-label="Previous month">‹</button>
          <strong>{monthLabel(month)}</strong>
          <button onClick={() => changeMonth(1)} disabled={offset >= 0} aria-label="Next month">›</button>
        </div>
      </div>
      {!rows ? (
        <p className="sub empty">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="sub empty">No expenses this month.</p>
      ) : (
        rows.map((e) => {
          const header = e.date !== lastDay;
          lastDay = e.date;
          return (
            <div key={e.id}>
              {header && (
                <div className="day">
                  {new Date(`${e.date}T00:00:00`).toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short" })}
                </div>
              )}
              <ExpenseRow e={e} onClick={() => setEditing(e)} />
            </div>
          );
        })
      )}
      {editing && <EditSheet expense={editing} categories={categories} online={online} onClose={() => setEditing(null)} onChanged={onChanged} />}
    </section>
  );
}

const MAX_SLICES = 6;

// Expects rows sorted largest first; beyond six slices, the smallest are grouped so each stays readable
function SpendPie({ rows }: { rows: SummaryRow[] }) {
  const total = rows.reduce((s, r) => s + r.total, 0);
  const shown = rows.length > MAX_SLICES ? rows.slice(0, MAX_SLICES - 1) : rows;
  const rest = rows.slice(shown.length);
  const slices = shown.map((r, i) => ({ name: r.category, total: r.total, color: `var(--pie-${i + 1})` }));
  if (rest.length) {
    slices.push({ name: `Everything else (${rest.length})`, total: rest.reduce((s, r) => s + r.total, 0), color: "var(--pie-rest)" });
  }
  const percent = (value: number) => {
    const p = (value / total) * 100;
    if (p < 1) return "<1%";
    return p > 99 && p < 100 ? ">99%" : `${Math.round(p)}%`;
  };
  const point = (fraction: number) => {
    const angle = 2 * Math.PI * fraction;
    return `${50 + 50 * Math.sin(angle)} ${50 - 50 * Math.cos(angle)}`;
  };

  return (
    <>
      <p className="recent-h">SHARE OF SPEND</p>
      <div className="pie">
        <svg viewBox="0 0 100 100" role="img" aria-label={slices.map((s) => `${s.name} ${percent(s.total)}`).join(", ")}>
          {slices.map((s, i) => {
            const start = slices.slice(0, i).reduce((sum, p) => sum + p.total, 0) / total;
            const fraction = s.total / total;
            const title = <title>{`${s.name}: $${fmt(s.total)} (${percent(s.total)})`}</title>;
            // An arc can't start and end at the same point, so a lone category is a plain circle
            if (slices.length === 1) {
              return (
                <circle key={s.name} cx="50" cy="50" r="50" fill={s.color}>
                  {title}
                </circle>
              );
            }
            const d = `M50 50 L${point(start)} A50 50 0 ${fraction > 0.5 ? 1 : 0} 1 ${point(start + fraction)} Z`;
            return (
              <path key={s.name} d={d} fill={s.color}>
                {title}
              </path>
            );
          })}
        </svg>
        <ul>
          {slices.map((s) => (
            <li key={s.name}>
              <span className="swatch" style={{ background: s.color }} />
              <span className="name">{s.name}</span>
              <span className="pct">{percent(s.total)}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

const daysInMonth = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m, 0).getDate();
};

type PaceRow = SummaryRow & { id: number; daily: number[] };

// Current month rows built from the expense list, so totals, bars and pace always agree.
// daily[d] holds each day's spend in cents; budgeted categories with no spending yet are included.
function paceRows(expenses: Expense[], categories: Category[], days: number): PaceRow[] {
  const byId = new Map<number, PaceRow>();
  const row = (id: number, name: string) => {
    let r = byId.get(id);
    if (!r) {
      r = { id, category: name, total: 0, count: 0, budget: null, daily: Array(days + 1).fill(0) };
      byId.set(id, r);
    }
    return r;
  };
  for (const e of expenses) {
    const r = row(e.category_id, e.category);
    r.daily[Number(e.date.slice(8))] += Math.round(e.amount * 100);
    r.count += 1;
  }
  for (const c of categories) if (c.monthly_budget != null) row(c.id, c.name).budget = c.monthly_budget;
  for (const r of byId.values()) r.total = r.daily.reduce((sum, v) => sum + v, 0) / 100;
  return [...byId.values()].sort((a, b) => b.total - a.total);
}

const expectedBy = (budget: number, day: number, days: number) => (budget * day) / days;
const cents = (n: number) => Math.round(n * 100);

function AlertIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="8" fill="currentColor" />
      <path d="M8 4v5" stroke="var(--bg)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="8" cy="11.8" r="1.1" fill="var(--bg)" />
    </svg>
  );
}

// "On pace" allows 5% of the budget either side of the amount expected by today
function PaceNote({ total, budget, day, days }: { total: number; budget: number; day: number; days: number }) {
  const left = budget - total;
  const leftText = day < days ? `$${fmt(left)} left, about $${fmt(left / (days - day))}/day` : `$${fmt(left)} left today`;
  if (cents(total) > cents(budget)) {
    return (
      <p className="pace bad">
        <AlertIcon />
        <b>Over budget by ${fmt(total - budget)}</b>
      </p>
    );
  }
  if (cents(total) === cents(budget)) return <p className="pace"><span><b>Budget used</b> · $0.00 left</span></p>;
  const diff = total - expectedBy(budget, day, days);
  if (Math.abs(diff) <= 0.05 * budget) return <p className="pace"><span><b>On pace</b> · {leftText}</span></p>;
  return (
    <p className="pace">
      <span>
        <b>${fmt(Math.abs(diff))} {diff > 0 ? "over" : "under"} pace</b> · {leftText}
      </span>
    </p>
  );
}

const shortDay = (month: string, day: number) =>
  new Date(`${month}-${String(day).padStart(2, "0")}T00:00:00`).toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short" });

// Running total against the budget spread evenly over the month
function BurnUp({ row, budget, month, day, days }: { row: PaceRow; budget: number; month: string; day: number; days: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 335, H = 172, m = { l: 44, r: 58, t: 18, b: 26 };
  const pw = W - m.l - m.r, ph = H - m.t - m.b;
  const cum = row.daily.reduce<number[]>((acc, v, i) => [...acc, (i ? acc[i - 1] : 0) + v], []).map((v) => v / 100);
  const spent = cum[day];
  const over = cents(row.total) > cents(budget);
  const top = Math.max(budget, row.total) * 1.1;
  const x = (d: number) => m.l + (d / days) * pw;
  const y = (v: number) => m.t + ph - (v / top) * ph;
  const ink = over ? "var(--bad)" : "var(--bar)";
  let step = `M${x(0)} ${y(0)}`;
  for (let d = 1; d <= day; d++) step += ` L${x(d)} ${y(cum[d - 1])} L${x(d)} ${y(cum[d])}`;
  const whole = (n: number) => fmt(n).replace(/\.00$/, "");
  const label = `${row.category}: $${fmt(spent)} spent by day ${day} of ${days}, $${fmt(expectedBy(budget, day, days))} expected by today against a $${fmt(budget)} monthly budget.`;

  function pick(clientX: number, el: Element) {
    const r = el.getBoundingClientRect();
    const px = ((clientX - r.left) / r.width) * W;
    setHover(Math.max(1, Math.min(day, Math.round(((px - m.l) / pw) * days))));
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const from = hover ?? day;
    setHover(Math.max(1, Math.min(day, from + (e.key === "ArrowRight" ? 1 : -1))));
  }

  const hv = hover == null ? null : { spent: cum[hover], expected: expectedBy(budget, hover, days) };
  const hoverDiff = hv ? hv.spent - hv.expected : 0;
  const spendDays = row.daily.map((v, d) => (v && d <= day ? d : 0)).filter(Boolean);

  return (
    <>
      <div className="chart">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={label}
          tabIndex={0}
          onPointerMove={(e) => pick(e.clientX, e.currentTarget)}
          onPointerDown={(e) => pick(e.clientX, e.currentTarget)}
          onPointerLeave={() => setHover(null)}
          onBlur={() => setHover(null)}
          onKeyDown={onKey}
        >
          <line x1={m.l} x2={x(days)} y1={y(0)} y2={y(0)} stroke="var(--muted)" strokeOpacity=".5" />
          <line x1={m.l} x2={x(days)} y1={y(budget)} y2={y(budget)} stroke="var(--muted)" strokeOpacity=".35" />
          <text x={x(days)} y={y(budget) - 5} textAnchor="end" fontSize="10.5" fill="var(--muted)">Budget {whole(budget)}</text>
          <line x1={x(0)} y1={y(0)} x2={x(days)} y2={y(budget)} stroke="var(--muted)" strokeWidth="1.5" strokeDasharray="4 3" />
          <line x1={x(day)} x2={x(day)} y1={m.t - 4} y2={y(0)} stroke="var(--muted)" strokeOpacity=".7" />
          <text x={x(day)} y={m.t - 7} textAnchor="middle" fontSize="10.5" fill="var(--muted)">Today</text>
          <path d={`${step} L${x(day)} ${y(0)} Z`} fill={ink} fillOpacity=".09" />
          <path d={step} fill="none" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          <text x={m.l - 7} y={y(0) + 3.5} textAnchor="end" fontSize="10.5" fill="var(--muted)">0</text>
          <text x={m.l - 7} y={y(budget) + 3.5} textAnchor="end" fontSize="10.5" fill="var(--muted)">{whole(budget)}</text>
          {[1, 10, 20, days].map((d) => (
            <text key={d} x={x(d)} y={y(0) + 16} textAnchor="middle" fontSize="10.5" fill="var(--muted)">
              {d === 1 ? shortDay(month, 1).replace(/^\w+,?\s*/, "") : d}
            </text>
          ))}
          {hover != null && hv && (
            <>
              <line x1={x(hover)} x2={x(hover)} y1={m.t} y2={y(0)} stroke="var(--text)" strokeOpacity=".55" />
              <circle cx={x(hover)} cy={y(hv.expected)} r="4" fill="var(--muted)" stroke="var(--surface)" strokeWidth="2" />
              <circle cx={x(hover)} cy={y(hv.spent)} r="4" fill={ink} stroke="var(--surface)" strokeWidth="2" />
            </>
          )}
          <circle cx={x(day)} cy={y(spent)} r="4.5" fill={ink} stroke="var(--surface)" strokeWidth="2" />
          <text x={x(day) + 9} y={y(spent) + (y(spent) < m.t + 12 ? 12 : -7)} fontSize="11.5" fontWeight="600" fill="var(--text)">
            ${fmt(spent)}
          </text>
        </svg>
        {hover != null && hv && (
          // Sits in the empty side of the plot so it doesn't cover the lines it describes
          <div className="tip" style={x(hover) > W / 2 ? { top: 22, left: "15%" } : { bottom: 34, right: "18%" }}>
            <div className="tip-day">{shortDay(month, hover)}</div>
            <div><span className="tip-k">Spent </span><b>${fmt(hv.spent)}</b></div>
            <div><span className="tip-k">Expected </span><b>${fmt(hv.expected)}</b></div>
            <div className="tip-k">
              {Math.abs(hoverDiff) <= 0.05 * budget ? "On pace" : `$${fmt(Math.abs(hoverDiff))} ${hoverDiff > 0 ? "over" : "under"} pace`}
            </div>
          </div>
        )}
      </div>
      <details className="daily">
        <summary>Daily figures</summary>
        {spendDays.length ? (
          <table>
            <thead>
              <tr><th>Day</th><th>Spent</th><th>Running total</th><th>Expected</th></tr>
            </thead>
            <tbody>
              {spendDays.map((d) => (
                <tr key={d}>
                  <td>{shortDay(month, d)}</td>
                  <td>{fmt(row.daily[d] / 100)}</td>
                  <td>{fmt(cum[d])}</td>
                  <td>{fmt(expectedBy(budget, d, days))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Nothing spent yet this month.</p>
        )}
      </details>
    </>
  );
}

function SummaryScreen({ email, cache, categories }: { email: string; cache: ApiCache; categories: Category[] }) {
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const month = monthKey(offset);
  const prevMonth = monthKey(offset - 1);
  const isCurrent = offset === 0;
  const today = localToday();
  const day = Number(today.slice(8));
  const days = daysInMonth(monthKey(0));
  const summaryRows = useCached<SummaryRow[]>(cache, summaryUrl(month));
  const currentExpenses = useCached<Expense[]>(cache, expensesUrl(monthKey(0)));
  const rows: (SummaryRow | PaceRow)[] | undefined = isCurrent
    ? currentExpenses && paceRows(currentExpenses, categories, days)
    : summaryRows;
  const prev = useCached<SummaryRow[]>(cache, summaryUrl(prevMonth));
  const spentRows = rows?.filter((r) => r.total > 0);

  const total = rows?.reduce((s, r) => s + r.total, 0) ?? 0;
  const prevTotal = prev?.reduce((s, r) => s + r.total, 0) ?? 0;
  const max = Math.max(...(rows ?? []).map((r) => r.total), 0) || 1;
  const diff = total - prevTotal;

  function showMonth(to: number) {
    setOffset(to);
    setOpen(null);
    // Otherwise the other month opens partway down
    window.scrollTo({ top: 0 });
  }

  return (
    <section className="screen pinned-screen">
      <div className="pinned-top">
        <ThemeToggle />
        <h1>Summary</h1>
        <div className="seg">
          <button className={offset === 0 ? "on" : ""} onClick={() => showMonth(0)}>{monthLabel(monthKey(0), { month: "long" })}</button>
          <button className={offset === -1 ? "on" : ""} onClick={() => showMonth(-1)}>{monthLabel(monthKey(-1), { month: "long" })}</button>
        </div>
      </div>
      <div className="total">
        <div className="sub">{offset === 0 ? "Spent so far this month" : `Spent in ${monthLabel(month)}`}</div>
        <div className="big">${fmt(total)}</div>
        {isCurrent && (
          <div className="dayline">
            <b>Day {day} of {days}</b> · {shortDay(monthKey(0), day)}
          </div>
        )}
        {!!prevTotal && (
          <div className="delta">
            {diff >= 0 ? "+" : "−"}${fmt(Math.abs(diff))} vs {monthLabel(prevMonth, { month: "long" })}
          </div>
        )}
      </div>
      <div className="columns">
        <div>
          {rows?.map((r) => {
            const budget = isCurrent ? (r.budget ?? null) : null;
            const pace = budget != null && "daily" in r ? r : null;
            const isOpen = pace != null && open === pace.id;
            // Against the budget where there is one; otherwise relative to the month's largest category
            const share = Math.min(r.total / (budget ?? max), 1);
            const body = (
              <>
                <div className="cat-top">
                  <span>
                    {r.category}
                    <span className="n">{r.count}</span>
                  </span>
                  <span className="cat-amt">
                    <strong>{fmt(r.total)}</strong>
                    {budget != null && <span className="of">of {fmt(budget)}</span>}
                    {pace && (
                      <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d={isOpen ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"} />
                      </svg>
                    )}
                  </span>
                </div>
                <div className="meter">
                  <div className="track">
                    <div className={budget != null && cents(r.total) > cents(budget) ? "fill over" : "fill"} style={{ width: `${share * 100}%` }} />
                  </div>
                  {pace && <div className="tick" style={{ left: `${Math.min(day / days, 1) * 100}%` }} />}
                </div>
                {pace && budget != null && <PaceNote total={r.total} budget={budget} day={day} days={days} />}
              </>
            );
            return pace && budget != null ? (
              <div className={isOpen ? "cat open" : "cat"} key={pace.id}>
                <button className="cat-toggle" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : pace.id)}>
                  {body}
                </button>
                {isOpen && <BurnUp row={pace} budget={budget} month={monthKey(0)} day={day} days={days} />}
              </div>
            ) : (
              <div className="cat" key={"id" in r ? r.id : r.category}>
                {body}
              </div>
            );
          })}
        </div>
        {spentRows && spentRows.length > 0 && (
          <div>
            <SpendPie rows={spentRows} />
          </div>
        )}
      </div>
      {rows?.length === 0 && <p className="sub empty">No expenses this month.</p>}
      <form className="signout" action={signOutAction}>
        <p>Signed in as {email}</p>
        <button type="submit">Sign out</button>
      </form>
    </section>
  );
}

function CategorySheet({ category, online, onClose, onChanged }: { category: Category | null; online: boolean; onClose: () => void; onChanged: () => void }) {
  const [name, setName] = useState(category?.name ?? "");
  const [budget, setBudget] = useState(category?.monthly_budget?.toFixed(2) ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    const value = Number(budget);
    if (budget.trim() && (!Number.isFinite(value) || value <= 0)) {
      setError("Enter a budget above zero, or leave it blank.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const body = JSON.stringify({ name, monthly_budget: budget.trim() ? Math.round(value * 100) / 100 : null });
      if (category) await api(`/api/categories/${category.id}`, { method: "PATCH", body });
      else await api("/api/categories", { method: "POST", body });
      onClose();
      onChanged();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(ev) => ev.stopPropagation()}>
        <div className="card">
          <div className="card-title">{category ? "Edit category" : "Add category"}</div>
          <div className="field">
            <label htmlFor="c-name">Name</label>
            <input id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pets" maxLength={50} disabled={category?.is_other} />
          </div>
          <div className="field">
            <label htmlFor="c-budget">Monthly budget (SGD)</label>
            <input id="c-budget" inputMode="decimal" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Optional" />
          </div>
          {category?.is_other && <p className="sub">The built-in &quot;Other&quot; category can&apos;t be renamed.</p>}
          {error && <p className="error">{error}</p>}
          <div className="actions">
            <div />
            <div className="right">
              <button className="btn btn-ghost" disabled={busy} onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" disabled={busy || !online || !name.trim()} onClick={save}>{busy ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoriesScreen({ categories, online, onChanged }: { categories: Category[]; online: boolean; onChanged: () => void }) {
  const [editing, setEditing] = useState<Category | "new" | null>(null);

  return (
    <section className="screen pinned-screen">
      <div className="pinned-top">
        <ThemeToggle />
        <h1>Categories</h1>
        <p className="sub">Monthly budgets are optional and in SGD.</p>
        <div className="row-start">
          <button className="btn btn-primary" disabled={!online} onClick={() => setEditing("new")}>Add category</button>
        </div>
      </div>
      {categories.length === 0 ? (
        <p className="sub empty">Loading…</p>
      ) : (
        categories.map((c) => (
          <button className="item" key={c.id} onClick={() => setEditing(c)}>
            <div>
              <div className="m">{c.name}</div>
            </div>
            {c.monthly_budget == null ? <div className="c">No budget</div> : <div className="a">{fmt(c.monthly_budget)}</div>}
          </button>
        ))
      )}
      {editing && <CategorySheet category={editing === "new" ? null : editing} online={online} onClose={() => setEditing(null)} onChanged={onChanged} />}
    </section>
  );
}
