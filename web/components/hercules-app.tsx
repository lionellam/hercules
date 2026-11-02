"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { signOutAction } from "@/app/actions";
import ReviewCard, { type Fields } from "./review-card";

type Category = { id: number; name: string };
type Expense = Fields & { id: number; amount: number; raw_input: string; category: string; was_edited: boolean };
type SummaryRow = { category: string; total: number; count: number };
type Tab = "log" | "history" | "summary";

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
  const [categories, setCategories] = useState<Category[]>([]);
  const cache = useApiCache();
  const { load } = cache;
  const online = useOnline();

  useEffect(() => {
    api<Category[]>("/api/categories").then(setCategories).catch(() => {});
    // Load the other tabs' default views up front so they open instantly
    load(expensesUrl(monthKey(0)));
    load(summaryUrl(monthKey(0)));
    load(summaryUrl(monthKey(-1)));
  }, [load]);

  return (
    <main className="app">
      {tab === "log" && <LogScreen categories={categories} online={online} cache={cache} onSaved={cache.reloadAll} />}
      {tab === "history" && <HistoryScreen categories={categories} online={online} cache={cache} onChanged={cache.reloadAll} />}
      {tab === "summary" && <SummaryScreen email={email} cache={cache} />}
      <nav className="tabs">
        <TabButton id="log" tab={tab} setTab={setTab} label="Log" path="M12 5v14M5 12h14" />
        <TabButton id="history" tab={tab} setTab={setTab} label="History" path="M4 6h16M4 12h16M4 18h10" />
        <TabButton id="summary" tab={tab} setTab={setTab} label="Summary" path="M6 20V10M12 20V4M18 20v-6" />
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
    <section className="screen">
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
      {error && <p className="error">{error}</p>}
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
      <p className="toast">{toast}</p>
      <p className="recent-h">TODAY</p>
      {todays.length ? todays.map((e) => <ExpenseRow key={e.id} e={e} onClick={() => setEditing(e)} />) : <p className="sub">Nothing logged yet today.</p>}
      {todays.length > 0 && <TodayByCategory expenses={todays} />}
      {editing && <EditSheet expense={editing} categories={categories} online={online} onClose={() => setEditing(null)} onChanged={onSaved} />}
    </section>
  );
}

function HistoryScreen({ categories, online, cache, onChanged }: { categories: Category[]; online: boolean; cache: ApiCache; onChanged: () => void }) {
  const [offset, setOffset] = useState(0);
  const [editing, setEditing] = useState<Expense | null>(null);
  const month = monthKey(offset);
  const rows = useCached<Expense[]>(cache, expensesUrl(month));

  let lastDay = "";
  return (
    <section className="screen">
      <h1>History</h1>
      <div className="month-switch">
        <button onClick={() => setOffset(offset - 1)} aria-label="Previous month">‹</button>
        <strong>{monthLabel(month)}</strong>
        <button onClick={() => setOffset(offset + 1)} disabled={offset >= 0} aria-label="Next month">›</button>
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

function SummaryScreen({ email, cache }: { email: string; cache: ApiCache }) {
  const [offset, setOffset] = useState(0);
  const month = monthKey(offset);
  const prevMonth = monthKey(offset - 1);
  const rows = useCached<SummaryRow[]>(cache, summaryUrl(month));
  const prev = useCached<SummaryRow[]>(cache, summaryUrl(prevMonth));

  const total = rows?.reduce((s, r) => s + r.total, 0) ?? 0;
  const prevTotal = prev?.reduce((s, r) => s + r.total, 0) ?? 0;
  const max = rows?.[0]?.total || 1;
  const diff = total - prevTotal;

  return (
    <section className="screen">
      <h1>Summary</h1>
      <div className="seg">
        <button className={offset === 0 ? "on" : ""} onClick={() => setOffset(0)}>{monthLabel(monthKey(0), { month: "long" })}</button>
        <button className={offset === -1 ? "on" : ""} onClick={() => setOffset(-1)}>{monthLabel(monthKey(-1), { month: "long" })}</button>
      </div>
      <div className="total">
        <div className="sub">{offset === 0 ? "Spent so far this month" : `Spent in ${monthLabel(month)}`}</div>
        <div className="big">${fmt(total)}</div>
        {!!prevTotal && (
          <div className="delta">
            {diff >= 0 ? "+" : "−"}${fmt(Math.abs(diff))} vs {monthLabel(prevMonth, { month: "long" })}
          </div>
        )}
      </div>
      {rows?.map((r) => (
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
      {rows?.length === 0 && <p className="sub empty">No expenses this month.</p>}
      <form className="signout" action={signOutAction}>
        <p>Signed in as {email}</p>
        <button type="submit">Sign out</button>
      </form>
    </section>
  );
}
