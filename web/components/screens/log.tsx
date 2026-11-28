"use client";

import { useRef, useState } from "react";
import { api, expensesUrl, fmt, useCached, type ApiCache } from "@/lib/client";
import { daysInMonth, localToday } from "@/lib/dates";
import { todayRows } from "@/lib/pace";
import type { Category, Expense } from "@/lib/types";
import { ConfirmSheet, useLeave } from "../confirm";
import { NotIncluded, useHomeCurrency, useMoney } from "../currency";
import { EditSheet, ExpenseRow } from "../expense-sheet";
import { SkeletonBar, SkeletonRows, SlowNote } from "../loading";
import ReviewCard, { type Fields } from "../review-card";
import { useExperiment } from "../experiments";
import { BudgetNotSet } from "../budget-not-set";
import { CategorySheet } from "./categories";

// Today's spending by category, each budgeted category against today's budget (Specification 4.9, Architecture decision 46).
// Default currency only, as in Summary; `expenses` is this month's, so spending before today sets today's budget.
function TodayByCategory({ expenses, categories, today, onSet }: { expenses: Expense[]; categories: Category[]; today: string; onSet: (c: Category) => void }) {
  const rows = todayRows(expenses, categories, today, daysInMonth(today.slice(0, 7)));

  return (
    <>
      {/* No total here: it would repeat "Spent today" under the text box */}
      <p className="recent-h">TODAY BY CATEGORY</p>
      {rows.map((r) => {
        const unbudgeted = r.state === "none" ? categories.find((c) => c.id === r.id) : undefined;
        const measured = r.allowance != null && (r.state === "ok" || r.state === "warn");
        return (
          <div className="cat" key={r.id}>
            <div className="cat-top">
              <span>
                {r.category}
                <span className="n">{r.count}</span>
              </span>
              <span className="cat-amt">
                <strong>{fmt(r.total)}</strong>
                {measured && <span className="of">of {fmt(r.allowance!)}</span>}
              </span>
            </div>
            {(measured || r.state === "over") && (
              <div className="track">
                <div
                  className={r.state === "over" ? "fill over" : r.state === "warn" ? "fill warn" : "fill"}
                  style={{ width: `${r.state === "ok" && r.allowance ? Math.min(r.total / r.allowance, 1) * 100 : 100}%` }}
                />
              </div>
            )}
            {r.state === "warn" && <p className="day-note warn"><WarnMark />Daily budget exceeded</p>}
            {r.state === "over" && <p className="day-note over"><WarnMark />Monthly budget exceeded</p>}
            {unbudgeted && <BudgetNotSet category={unbudgeted} onSet={() => onSet(unbudgeted)} />}
          </div>
        );
      })}
    </>
  );
}

// The "!" before an exceeded note: a filled circle in the note's colour. Screen readers skip it; the note says the same
function WarnMark() {
  return (
    <span className="warn-mark" aria-hidden="true">
      <span>!</span>
    </span>
  );
}

export default function LogScreen({
  categories,
  online,
  cache,
  onSaved,
  text,
  setText,
}: {
  categories: Category[];
  online: boolean;
  cache: ApiCache;
  onSaved: () => void;
  text: string;
  setText: (t: string) => void;
}) {
  const money = useMoney();
  const [parsed, setParsed] = useState<{ raw: string; fields: Fields } | null>(null);
  const [reviewDirty, setReviewDirty] = useState(false);
  const [askDiscard, setAskDiscard] = useState(false);
  // Closing the review sheet slides it away before it is removed (Specification 4.2)
  const [reviewLeaving, leaveReview] = useLeave();
  const closeReview = () => leaveReview(() => setParsed(null));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [editing, setEditing] = useState<Expense | null>(null);
  // The Edit category card, opened from a "Budget not set" line under Today by category (Specification 4.9)
  const [budgeting, setBudgeting] = useState<Category | null>(null);
  const box = useRef<HTMLTextAreaElement>(null);
  const todayKey = localToday();
  const monthRows = useCached<Expense[]>(cache, expensesUrl(todayKey.slice(0, 7)));
  const todays = monthRows?.filter((r) => r.date === todayKey) ?? [];
  // Spent today and Today by category count the default currency only (Specification 4.6)
  const home = useHomeCurrency();
  const todaysHome = todays.filter((e) => e.currency === home);
  const monthHome = monthRows?.filter((e) => e.currency === home) ?? [];

  // Intelligent Merchant Selection, if switched on on this device (Architecture decision 40)
  const knownMerchants = useExperiment("known-merchants");

  async function parse() {
    setBusy(true);
    setError("");
    try {
      const raw = text.trim();
      const r = await api<Fields & { category_id: number | null }>("/api/parse", {
        method: "POST",
        body: JSON.stringify({ text: raw, today: localToday(), ...(knownMerchants && { knownMerchants: true }) }),
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
    closeReview();
    setText("");
    setToast("Saved");
    setTimeout(() => setToast(""), 1600);
    onSaved();
  }

  // Discard and tapping outside the review sheet do the same, asking first if a detail was changed
  const requestDiscard = () => (reviewDirty ? setAskDiscard(true) : closeReview());

  const today = new Date().toLocaleDateString("en-SG", { weekday: "long", day: "numeric", month: "long" });

  return (
    <section className="screen pinned-screen">
      <div className="pinned-top">
        <div className="greet">
          <p className="sub">{today}</p>
          <h1>Log an expense</h1>
        </div>
        {!online && <p className="offline">You&apos;re offline. Parsing of expenses is not available. Please try again later.</p>}
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
          {/* A placeholder until this month's expenses first arrive */}
          {monthRows ? <strong>{money(todaysHome.reduce((sum, e) => sum + e.amount, 0))}</strong> : <SkeletonBar width={62} height={16} />}
        </p>
        <NotIncluded items={todays} />
        {error && <p className="error">{error}</p>}
        {toast && <p className="toast">{toast}</p>}
      </div>
      {parsed && (
        <div className={`sheet-backdrop${reviewLeaving ? " leaving" : ""}`} onClick={requestDiscard}>
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
          onConfirm={closeReview}
          onCancel={() => setAskDiscard(false)}
        />
      )}
      <div className="columns">
        <div>
          <p className="recent-h">TODAY</p>
          {/* "Nothing logged yet today." only once that's known to be true */}
          {!monthRows ? (
            <>
              <SkeletonRows count={3} />
              <SlowNote />
            </>
          ) : todays.length ? (
            todays.map((e) => <ExpenseRow key={e.id} e={e} onClick={() => setEditing(e)} />)
          ) : (
            <p className="sub">Nothing logged yet today.</p>
          )}
        </div>
        {/* Shown only when today has spending in the default currency, which is all it counts */}
        {todaysHome.length > 0 && (
          <div>
            <TodayByCategory expenses={monthHome} categories={categories} today={todayKey} onSet={setBudgeting} />
          </div>
        )}
      </div>
      {editing && <EditSheet expense={editing} categories={categories} online={online} onClose={() => setEditing(null)} onChanged={onSaved} />}
      {budgeting && <CategorySheet category={budgeting} retired={[]} online={online} onClose={() => setBudgeting(null)} onChanged={onSaved} />}
    </section>
  );
}
