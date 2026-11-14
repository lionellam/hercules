"use client";

import { useRef, useState } from "react";
import { api, expensesUrl, fmt, useCached, type ApiCache } from "@/lib/client";
import { localToday } from "@/lib/dates";
import type { Category, Expense, SummaryRow } from "@/lib/types";
import { ConfirmSheet } from "../confirm";
import { NotIncluded, useHomeCurrency, useMoney } from "../currency";
import { EditSheet, ExpenseRow } from "../expense-sheet";
import ReviewCard, { type Fields } from "../review-card";

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
  const max = rows[0]?.total || 1;

  return (
    <>
      {/* No total here: it would repeat "Spent today" under the text box */}
      <p className="recent-h">TODAY BY CATEGORY</p>
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
  const money = useMoney();
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<{ raw: string; fields: Fields } | null>(null);
  const [reviewDirty, setReviewDirty] = useState(false);
  const [askDiscard, setAskDiscard] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [editing, setEditing] = useState<Expense | null>(null);
  const box = useRef<HTMLTextAreaElement>(null);
  const todayKey = localToday();
  const monthRows = useCached<Expense[]>(cache, expensesUrl(todayKey.slice(0, 7)));
  const todays = monthRows?.filter((r) => r.date === todayKey) ?? [];
  // Spent today and Today by category count the default currency only (Specification 4.6)
  const home = useHomeCurrency();
  const todaysHome = todays.filter((e) => e.currency === home);

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

  // Discard and tapping outside the review sheet do the same, asking first if a detail was changed
  const requestDiscard = () => (reviewDirty ? setAskDiscard(true) : setParsed(null));

  const today = new Date().toLocaleDateString("en-SG", { weekday: "long", day: "numeric", month: "long" });

  return (
    <section className="screen pinned-screen">
      <div className="pinned-top">
        <div className="greet">
          <p className="sub">{today}</p>
          <h1>Log an expense</h1>
        </div>
        {!online && <p className="offline">You&apos;re offline. Your text is kept — parse it when you&apos;re back online.</p>}
        <div className="input-wrap">
          <textarea
            ref={box}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Lunch at LJS for $4.50 yesterday"
            maxLength={500}
            aria-label="Expense to log"
          />
          {text && (
            <button
              className="text-clear"
              onClick={() => {
                setText("");
                box.current?.focus();
              }}
              aria-label="Clear text"
            >
              <span aria-hidden="true">×</span>
            </button>
          )}
          <div className="row-end">
            <button className="btn btn-primary" disabled={!text.trim() || busy || !online || !!parsed} onClick={parse}>
              {busy ? "Parsing…" : "Parse"}
            </button>
          </div>
        </div>
        <p className="today-total">
          <span>Spent today</span>
          <strong>{monthRows ? money(todaysHome.reduce((sum, e) => sum + e.amount, 0)) : "—"}</strong>
        </p>
        <NotIncluded items={todays} />
        {error && <p className="error">{error}</p>}
        {toast && <p className="toast">{toast}</p>}
      </div>
      {parsed && (
        <div className="sheet-backdrop" onClick={requestDiscard}>
          <div className="sheet" onClick={(ev) => ev.stopPropagation()}>
            <ReviewCard
              title="Review before saving"
              rawInput={parsed.raw}
              initial={parsed.fields}
              categories={categories}
              onSave={save}
              onCancel={requestDiscard}
              cancelLabel="Discard"
              disabled={!online}
              onDirtyChange={setReviewDirty}
              afterParse
            />
          </div>
        </div>
      )}
      {askDiscard && (
        <ConfirmSheet
          title="Discard your edits?"
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
        {/* Shown only when today has spending in the default currency, which is all it counts */}
        {todaysHome.length > 0 && (
          <div>
            <TodayByCategory expenses={todaysHome} />
          </div>
        )}
      </div>
      {editing && <EditSheet expense={editing} categories={categories} online={online} onClose={() => setEditing(null)} onChanged={onSaved} />}
    </section>
  );
}
