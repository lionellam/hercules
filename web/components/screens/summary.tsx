"use client";

import { useState } from "react";
import { signOutAction } from "@/app/actions";
import { expensesUrl, fmt, summaryUrl, useCached, type ApiCache } from "@/lib/client";
import { daysInMonth, localToday, monthKey, monthLabel, shortDay } from "@/lib/dates";
import { cents, paceRows, type PaceRow } from "@/lib/pace";
import type { Category, Expense, SummaryRow } from "@/lib/types";
import { BurnUp, PaceNote } from "../pace";
import SpendPie from "../spend-pie";
import ThemeToggle from "../theme-toggle";

export default function SummaryScreen({ email, cache, categories }: { email: string; cache: ApiCache; categories: Category[] }) {
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const month = monthKey(offset);
  const prevMonth = monthKey(offset - 1);
  const isCurrent = offset === 0;
  const today = localToday();
  const day = Number(today.slice(8));
  const days = daysInMonth(monthKey(0));
  const summaryRows = useCached<SummaryRow[]>(cache, isCurrent ? null : summaryUrl(month));
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
