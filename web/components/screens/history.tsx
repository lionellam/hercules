"use client";

import { useState } from "react";
import { expensesUrl, useCached, type ApiCache } from "@/lib/client";
import { dayLabel, monthKey, monthLabel } from "@/lib/dates";
import type { Category, Expense } from "@/lib/types";
import { EditSheet, ExpenseRow } from "../expense-sheet";
import ThemeToggle from "../theme-toggle";

export default function HistoryScreen({ categories, online, cache, onChanged }: { categories: Category[]; online: boolean; cache: ApiCache; onChanged: () => void }) {
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
              {header && <div className="day">{dayLabel(e.date)}</div>}
              <ExpenseRow e={e} onClick={() => setEditing(e)} />
            </div>
          );
        })
      )}
      {editing && <EditSheet expense={editing} categories={categories} online={online} onClose={() => setEditing(null)} onChanged={onChanged} />}
    </section>
  );
}
