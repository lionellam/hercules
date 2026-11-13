"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { expensesUrl, fmt, summaryUrl, useCached, type ApiCache } from "@/lib/client";
import { daysInMonth, localToday, monthKey, monthLabel, shortDay } from "@/lib/dates";
import { cents, paceRows, type PaceRow } from "@/lib/pace";
import type { Category, Expense, SummaryRow } from "@/lib/types";
import { BurnUp, PaceNote } from "../pace";
import SpendPie from "../spend-pie";
import { NotIncluded, useHomeCurrency, useMoney } from "../currency";

// The iPhone home-screen app (navigator.standalone) can't return from a download, so there the CSV goes
// through the share sheet instead (Specification 4.5). Elsewhere the normal download is used.
function sharesFiles() {
  const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (!standalone || typeof navigator.canShare !== "function") return false;
  try {
    return navigator.canShare({ files: [new File([""], "check.csv", { type: "text/csv" })] });
  } catch {
    return false;
  }
}
const noSubscribe = () => () => {};

// CSV files prepared for the share sheet, kept while the app is open (a sign-out reloads the page, which clears them).
// Keyed by month and the app's change counter, so any change in the app means a fresh file next time.
const preparedFiles = new Map<string, File>();
const preparing = new Set<string>();
const MAX_PREPARED = 6;

export default function SummaryScreen({ cache, categories }: { cache: ApiCache; categories: Category[] }) {
  const money = useMoney();
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const [downloadNote, setDownloadNote] = useState("");
  const shareMode = useSyncExternalStore(noSubscribe, sharesFiles, () => false);
  const month = monthKey(offset);
  const isCurrent = offset === 0;
  const today = localToday();
  const day = Number(today.slice(8));
  const days = daysInMonth(monthKey(0));
  const summaryRows = useCached<SummaryRow[]>(cache, isCurrent ? null : summaryUrl(month));
  const currentExpenses = useCached<Expense[]>(cache, expensesUrl(monthKey(0)));
  // Totals, bars, pace and the pie count the default currency only; the rest is listed as not included (Specification 4.6)
  const home = useHomeCurrency();
  const homeExpenses = currentExpenses?.filter((e) => e.currency === home);
  const rows: (SummaryRow | PaceRow)[] | undefined = isCurrent
    ? homeExpenses && paceRows(homeExpenses, categories, days)
    : summaryRows?.filter((r) => (r.currency ?? home) === home);
  const notIncluded = (isCurrent ? currentExpenses : summaryRows) ?? [];
  const spentRows = rows?.filter((r) => r.total > 0);

  const total = rows?.reduce((s, r) => s + r.total, 0) ?? 0;
  const max = Math.max(...(rows ?? []).map((r) => r.total), 0) || 1;

  // For the share sheet, the file must be ready the moment CSV is tapped, so it's fetched in advance:
  // once per month shown, and again only after a change made in the app (Specification 4.5)
  const fileKey = `${month}:${cache.version}`;
  useEffect(() => {
    if (!shareMode || preparedFiles.has(fileKey) || preparing.has(fileKey)) return;
    preparing.add(fileKey);
    fetch(`/api/expenses/export?month=${month}`)
      .then((res) => (res.ok ? res.blob() : Promise.reject(new Error("export failed"))))
      .then((blob) => {
        preparedFiles.set(fileKey, new File([blob], `hercules-expenses-${month}.csv`, { type: "text/csv" }));
        // Keep only the most recent few
        while (preparedFiles.size > MAX_PREPARED) preparedFiles.delete(preparedFiles.keys().next().value!);
      })
      .catch(() => {})
      .finally(() => preparing.delete(fileKey));
  }, [shareMode, fileKey, month]);

  function downloadCsv(ev: React.MouseEvent) {
    if (!shareMode) {
      setDownloadNote(`Downloading hercules-expenses-${month}.csv`);
      return;
    }
    ev.preventDefault();
    const file = preparedFiles.get(fileKey);
    if (!file) {
      setDownloadNote("Preparing the file. Try again in a moment.");
      return;
    }
    navigator.share({ files: [file], title: `Hercules expenses, ${monthLabel(month)}` }).catch((err: unknown) => {
      // Closing the share sheet without choosing isn't an error
      if ((err as Error)?.name !== "AbortError") setDownloadNote("Couldn't open the share sheet. Please try again.");
    });
  }

  // The download message goes away after a few seconds
  useEffect(() => {
    if (!downloadNote) return;
    const t = setTimeout(() => setDownloadNote(""), 3000);
    return () => clearTimeout(t);
  }, [downloadNote]);

  function showMonth(to: number) {
    setOffset(to);
    setOpen(null);
    // Otherwise the other month opens partway down
    window.scrollTo({ top: 0 });
  }

  return (
    <section className="screen pinned-screen">
      <div className="pinned-top">
        <h1>Summary</h1>
        <div className="seg">
          <button className={offset === 0 ? "on" : ""} onClick={() => showMonth(0)}>{monthLabel(monthKey(0), { month: "long" })}</button>
          <button className={offset === -1 ? "on" : ""} onClick={() => showMonth(-1)}>{monthLabel(monthKey(-1), { month: "long" })}</button>
        </div>
        {/* The total stays in view with the month switcher while the categories scroll (Specification step 8) */}
        <div className="total">
          <div className="total-row">
            <div>
              <div className="sub">{offset === 0 ? "Spent so far this month" : `Spent in ${monthLabel(month)}`}</div>
              <div className="big">{money(total)}</div>
            </div>
            {/* Downloads the month shown as a CSV file (Specification 4.5) */}
            <a
              className="csv-button"
              href={`/api/expenses/export?month=${month}`}
              download={`hercules-expenses-${month}.csv`}
              onClick={downloadCsv}
              aria-label={`Download ${monthLabel(month)} expenses as a CSV file`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
              </svg>
              CSV
            </a>
          </div>
          {isCurrent && (
            <div className="dayline">
              <b>Day {day} of {days}</b> · {shortDay(monthKey(0), day)}
            </div>
          )}
          <NotIncluded items={notIncluded} />
        </div>
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
      {downloadNote && (
        <div className="undo-bar" role="status">
          <span>{downloadNote}</span>
        </div>
      )}
    </section>
  );
}
