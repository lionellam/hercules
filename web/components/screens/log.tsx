"use client";

import { useState } from "react";
import { api, expensesUrl, fmt, useCached, type ApiCache } from "@/lib/client";
import { localToday } from "@/lib/dates";
import type { Category, Expense, SummaryRow } from "@/lib/types";
import { ConfirmSheet } from "../confirm";
import { EditSheet, ExpenseRow } from "../expense-sheet";
import ReviewCard, { type Fields } from "../review-card";
import ThemeToggle from "../theme-toggle";

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

export default function LogScreen({ categories, online, cache, onSaved }: { categories: Category[]; online: boolean; cache: ApiCache; onSaved: () => void }) {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<{ raw: string; fields: Fields } | null>(null);
  const [reviewDirty, setReviewDirty] = useState(false);
  const [askDiscard, setAskDiscard] = useState(false);
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
      setReviewDirty(false);
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
          onCancel={() => (reviewDirty ? setAskDiscard(true) : setParsed(null))}
          cancelLabel="Discard"
          disabled={!online}
          onDirtyChange={setReviewDirty}
        />
      )}
      {askDiscard && (
        <ConfirmSheet
          title="Discard your edits?"
          body="The changes you made to the parsed details will be lost. Your typed text stays in the box, so you can parse it again."
          confirmLabel="Discard"
          cancelLabel="Keep reviewing"
          onConfirm={() => {
            setAskDiscard(false);
            setParsed(null);
          }}
          onCancel={() => setAskDiscard(false)}
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
