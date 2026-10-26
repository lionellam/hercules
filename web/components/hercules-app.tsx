"use client";

import { useCallback, useEffect, useState } from "react";
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

export default function HerculesApp({ email }: { email: string }) {
  const [tab, setTab] = useState<Tab>("log");
  const [categories, setCategories] = useState<Category[]>([]);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  const online = useOnline();

  useEffect(() => {
    api<Category[]>("/api/categories").then(setCategories).catch(() => {});
  }, []);

  return (
    <main className="app">
      {tab === "log" && <LogScreen categories={categories} online={online} version={version} onSaved={refresh} />}
      {tab === "history" && <HistoryScreen categories={categories} online={online} version={version} onChanged={refresh} />}
      {tab === "summary" && <SummaryScreen email={email} version={version} />}
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

function LogScreen({ categories, online, version, onSaved }: { categories: Category[]; online: boolean; version: number; onSaved: () => void }) {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<{ raw: string; fields: Fields } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [todays, setTodays] = useState<Expense[]>([]);

  useEffect(() => {
    const today = localToday();
    api<Expense[]>(`/api/expenses?month=${today.slice(0, 7)}`)
      .then((rows) => setTodays(rows.filter((r) => r.date === today)))
      .catch(() => {});
  }, [version]);

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
      {todays.length ? todays.map((e) => <ExpenseRow key={e.id} e={e} />) : <p className="sub">Nothing logged yet today.</p>}
    </section>
  );
}

function HistoryScreen({ categories, online, version, onChanged }: { categories: Category[]; online: boolean; version: number; onChanged: () => void }) {
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<Expense[] | null>(null);
  const [editing, setEditing] = useState<Expense | null>(null);
  const month = monthKey(offset);

  useEffect(() => {
    let live = true;
    api<Expense[]>(`/api/expenses?month=${month}`)
      .then((r) => live && setRows(r))
      .catch(() => live && setRows([]));
    return () => {
      live = false;
    };
  }, [month, version]);

  async function save(fields: Fields, edited: boolean) {
    if (!editing) return;
    await api(`/api/expenses/${editing.id}`, { method: "PATCH", body: JSON.stringify({ ...fields, was_edited: edited }) });
    setEditing(null);
    onChanged();
  }

  async function remove() {
    if (!editing || !confirm("Delete this expense?")) return;
    await api(`/api/expenses/${editing.id}`, { method: "DELETE" });
    setEditing(null);
    onChanged();
  }

  let lastDay = "";
  return (
    <section className="screen">
      <h1>History</h1>
      <div className="month-switch">
        <button onClick={() => setOffset(offset - 1)} aria-label="Previous month">‹</button>
        <strong>{monthLabel(month)}</strong>
        <button onClick={() => setOffset(offset + 1)} disabled={offset >= 0} aria-label="Next month">›</button>
      </div>
      {rows === null ? (
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
      {editing && (
        <div className="sheet-backdrop" onClick={() => setEditing(null)}>
          <div className="sheet" onClick={(ev) => ev.stopPropagation()}>
            <ReviewCard
              title="Edit expense"
              rawInput={editing.raw_input}
              initial={editing}
              categories={categories}
              onSave={save}
              onCancel={() => setEditing(null)}
              cancelLabel="Cancel"
              onDelete={remove}
              disabled={!online}
            />
          </div>
        </div>
      )}
    </section>
  );
}

function SummaryScreen({ email, version }: { email: string; version: number }) {
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<{ rows: SummaryRow[]; prevTotal: number } | null>(null);
  const month = monthKey(offset);
  const prevMonth = monthKey(offset - 1);

  useEffect(() => {
    let live = true;
    Promise.all([api<SummaryRow[]>(`/api/summary?month=${month}`), api<SummaryRow[]>(`/api/summary?month=${prevMonth}`)])
      .then(([rows, prev]) => live && setData({ rows, prevTotal: prev.reduce((s, r) => s + r.total, 0) }))
      .catch(() => live && setData({ rows: [], prevTotal: 0 }));
    return () => {
      live = false;
    };
  }, [month, prevMonth, version]);

  const total = data?.rows.reduce((s, r) => s + r.total, 0) ?? 0;
  const max = data?.rows[0]?.total || 1;
  const diff = total - (data?.prevTotal ?? 0);

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
        {!!data?.prevTotal && (
          <div className="delta">
            {diff >= 0 ? "+" : "−"}${fmt(Math.abs(diff))} vs {monthLabel(prevMonth, { month: "long" })}
          </div>
        )}
      </div>
      {data?.rows.map((r) => (
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
      {data && data.rows.length === 0 && <p className="sub empty">No expenses this month.</p>}
      <form className="signout" action={signOutAction}>
        <p>Signed in as {email}</p>
        <button type="submit">Sign out</button>
      </form>
    </section>
  );
}
