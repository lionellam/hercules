"use client";

// The default currency on the screens (Specification 4.6): who uses it, the Currency page and the review card's picker
import { createContext, useContext, useEffect, useId, useRef, useState } from "react";
import { api, fmt } from "@/lib/client";
import { CURRENCIES, DEFAULT_CURRENCY, DOLLARS, otherCurrencies } from "@/lib/currencies";
import { ConfirmSheet } from "./confirm";

// The person's default currency, for lists and budget labels
export const HomeCurrency = createContext(DEFAULT_CURRENCY);
export const useHomeCurrency = () => useContext(HomeCurrency);

// Totals in the default currency: "$12.50" for a dollar currency, otherwise its code, like "MYR 12.50" (Specification 4.6)
export function moneyIn(home: string) {
  return (n: number) => (DOLLARS.has(home) ? `$${fmt(n)}` : `${home} ${fmt(n)}`);
}
export const useMoney = () => moneyIn(useHomeCurrency());

// The line under a total listing spending in other currencies, which the total leaves out; nothing when there is none.
// Its "?" opens a short explanation, closed by tapping the "?" again or anywhere else (Specification 4.6)
export function NotIncluded({ items }: { items: { currency?: string; amount?: number; total?: number }[] }) {
  const home = useHomeCurrency();
  const others = otherCurrencies(items, home);
  // Where the bubble's arrow sits, measured from the "?" when it is tapped; null while closed
  const [arrowAt, setArrowAt] = useState<number | null>(null);
  const open = arrowAt != null;
  const tipId = useId();
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (ev: PointerEvent) => {
      if (!wrap.current?.contains(ev.target as Node)) setArrowAt(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  if (!others.length) return null;
  return (
    <div className="not-included" ref={wrap}>
      <span>Not included: {others.map((o) => `${o.code} ${fmt(o.total)}`).join(" · ")}</span>
      <button
        type="button"
        className={`ni-help${open ? " on" : ""}`}
        aria-label="Why aren't these included?"
        aria-expanded={open}
        aria-controls={tipId}
        onClick={(ev) => setArrowAt(open ? null : ev.currentTarget.offsetLeft + 9)}
      >
        <span aria-hidden="true">?</span>
      </button>
      {open && (
        // The arrow points at the "?", wherever the line ends
        <p className="ni-tip" id={tipId} role="tooltip" style={{ "--arrow": `${arrowAt}px` } as React.CSSProperties}>
          Your default currency is {home}. Expenses in other currencies are not included.
        </p>
      )}
    </div>
  );
}

export const SETTINGS_URL = "/api/settings";
export type Settings = { default_currency: string };

// The Currency page opened from Settings: tapping a currency saves it straight away
export function CurrencyPage({ online, onBack, onSaved }: { online: boolean; onBack: () => void; onSaved: (code: string) => void }) {
  const current = useHomeCurrency();
  const [chosen, setChosen] = useState(current);
  const [asking, setAsking] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Saving happens only after the confirmation sheet; its own error shows there if it fails
  async function switchTo(code: string) {
    await api(SETTINGS_URL, { method: "PATCH", body: JSON.stringify({ default_currency: code }) });
    setChosen(code);
    setAsking(null);
    setError("");
    onSaved(code);
  }

  return (
    <section className="screen pinned-screen">
      <div className="pinned-top">
        <button className="back-link" onClick={onBack}>‹ Settings</button>
        <h1>Currency</h1>
        <p className="sub">Used when what you type doesn&apos;t name a currency. Totals and budgets count only this currency.</p>
      </div>
      {error && <p className="error">{error}</p>}
      <ul className="currency-list">
        {CURRENCIES.map((c) => (
          <li key={c.code}>
            <button className={c.code === chosen ? "on" : ""} disabled={!online} onClick={() => c.code !== chosen && setAsking(c.code)} aria-pressed={c.code === chosen}>
              <span className="code">{c.code}</span>
              <span className="nm">{c.name}</span>
              {c.code === chosen && <span className="ck" aria-hidden="true">✓</span>}
            </button>
          </li>
        ))}
      </ul>
      {asking && (
        <ConfirmSheet
          title={`Switch to ${asking}?`}
          body={
            <>
              <p>Totals, budgets and pace will count only expenses in {asking}. Expenses in other currencies, including your {chosen} ones, aren&apos;t converted: they&apos;ll be shown as not included.</p>
              <p>Your budgets keep their amounts, now read as {asking}. You can switch back at any time.</p>
            </>
          }
          confirmLabel={`Switch to ${asking}`}
          danger={false}
          onConfirm={() => switchTo(asking)}
          onCancel={() => setAsking(null)}
        />
      )}
    </section>
  );
}

// The code beside the amount on the review card, opening the phone's own list
export function CurrencySelect({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const listed = CURRENCIES.some((c) => c.code === value);
  return (
    <label className="currency-pick">
      <span aria-hidden="true">{value} ▾</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Currency">
        {/* An expense already in a currency outside the list keeps it as a choice */}
        {!listed && <option value={value}>{value}</option>}
        {CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>{c.code} · {c.name}</option>
        ))}
      </select>
    </label>
  );
}
