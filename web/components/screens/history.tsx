"use client";

import { useState } from "react";
import { expensesUrl, fmt, useCached, type ApiCache } from "@/lib/client";
import { dayLabel, monthKey, monthLabel } from "@/lib/dates";
import type { Category, Expense } from "@/lib/types";
import { EditSheet, ExpenseRow } from "../expense-sheet";
import { NotIncluded, useHomeCurrency, useMoney } from "../currency";

// Every word must appear somewhere in the expense, in any order, ignoring capitals (Specification 4.3)
function matches(e: Expense, words: string[]) {
  const text = [e.merchant, e.raw_input, e.category, e.remarks, fmt(e.amount), e.amount.toFixed(2)].join(" ").toLowerCase();
  return words.every((w) => text.includes(w));
}

export default function HistoryScreen({ categories, online, cache, onChanged }: { categories: Category[]; online: boolean; cache: ApiCache; onChanged: () => void }) {
  const money = useMoney();
  const home = useHomeCurrency();
  const [offset, setOffset] = useState(0);
  const [editing, setEditing] = useState<Expense | null>(null);
  // Search applies to the month shown; it's cleared when the month changes, and when History closes
  const [query, setQuery] = useState("");
  const month = monthKey(offset);
  const rows = useCached<Expense[]>(cache, expensesUrl(month));
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const searching = words.length > 0;
  const shown = searching ? rows?.filter((e) => matches(e, words)) : rows;

  function changeMonth(by: number) {
    setOffset(offset + by);
    setQuery("");
    // Otherwise the new month opens partway down its list
    window.scrollTo({ top: 0 });
  }

  return (
    <section className="screen pinned-screen">
      <div className="pinned-top">
        <h1>History</h1>
        <div className="month-switch">
          <button onClick={() => changeMonth(-1)} aria-label="Previous month">‹</button>
          <strong>{monthLabel(month)}</strong>
          <button onClick={() => changeMonth(1)} disabled={offset >= 0} aria-label="Next month">›</button>
        </div>
        <div className="search-field">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" />
          </svg>
          <input
            id="history-search"
            type="text"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setQuery("")}
            placeholder="Search expenses"
            aria-label={`Search expenses in ${monthLabel(month)}`}
          />
          {query && (
            <button className="search-clear" onClick={() => setQuery("")} aria-label="Clear search">
              <span aria-hidden="true">×</span>
            </button>
          )}
        </div>
      </div>
      {!shown ? (
        <p className="sub empty">Loading…</p>
      ) : searching && shown.length === 0 ? (
        <div className="no-results">
          <b>No search results</b>
          <span>Nothing in {monthLabel(month)} matches &ldquo;{query.trim()}&rdquo;.</span>
        </div>
      ) : shown.length === 0 ? (
        <p className="sub empty">No expenses this month.</p>
      ) : (
        <>
          {searching && (
            <p className="search-count" role="status">
              <span>{shown.length} {shown.length === 1 ? "result" : "results"}</span>
              <b>{money(shown.filter((e) => e.currency === home).reduce((sum, e) => sum + e.amount, 0))}</b>
            </p>
          )}
          {searching && <NotIncluded items={shown} />}
          {shown.map((e, i) => {
            // A day heading before the first expense of each day
            const header = i === 0 || shown[i - 1].date !== e.date;
            return (
              <div key={e.id}>
                {header && <div className="day">{dayLabel(e.date)}</div>}
                <ExpenseRow e={e} onClick={() => setEditing(e)} highlight={searching ? words : undefined} />
              </div>
            );
          })}
        </>
      )}
      {editing && <EditSheet expense={editing} categories={categories} online={online} onClose={() => setEditing(null)} onChanged={onChanged} />}
    </section>
  );
}
