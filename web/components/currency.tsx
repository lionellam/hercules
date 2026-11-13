"use client";

// The default currency on the screens (Specification 4.6): who uses it, the Currency page and the review card's picker
import { createContext, useContext, useState } from "react";
import { api, fmt } from "@/lib/client";
import { CURRENCIES, DEFAULT_CURRENCY, DOLLARS } from "@/lib/currencies";

// The person's default currency, for lists and budget labels
export const HomeCurrency = createContext(DEFAULT_CURRENCY);
export const useHomeCurrency = () => useContext(HomeCurrency);

// Totals in the default currency: "$12.50" for a dollar currency, otherwise its code, like "MYR 12.50" (Specification 4.6)
export function moneyIn(home: string) {
  return (n: number) => (DOLLARS.has(home) ? `$${fmt(n)}` : `${home} ${fmt(n)}`);
}
export const useMoney = () => moneyIn(useHomeCurrency());

export const SETTINGS_URL = "/api/settings";
export type Settings = { default_currency: string };

// The Currency page opened from Settings: tapping a currency saves it straight away
export function CurrencyPage({ online, onBack, onSaved }: { online: boolean; onBack: () => void; onSaved: (code: string) => void }) {
  const current = useHomeCurrency();
  const [chosen, setChosen] = useState(current);
  const [error, setError] = useState("");

  async function choose(code: string) {
    if (code === chosen) return;
    const before = chosen;
    setChosen(code);
    setError("");
    try {
      await api(SETTINGS_URL, { method: "PATCH", body: JSON.stringify({ default_currency: code }) });
      onSaved(code);
    } catch (e) {
      setChosen(before);
      setError((e as Error).message);
    }
  }

  return (
    <section className="screen pinned-screen">
      <div className="pinned-top">
        <button className="back-link" onClick={onBack}>‹ Settings</button>
        <h1>Currency</h1>
        <p className="sub">Used when what you type doesn&apos;t name a currency. Changing it doesn&apos;t change past expenses.</p>
      </div>
      {error && <p className="error">{error}</p>}
      <ul className="currency-list">
        {CURRENCIES.map((c) => (
          <li key={c.code}>
            <button className={c.code === chosen ? "on" : ""} disabled={!online} onClick={() => choose(c.code)} aria-pressed={c.code === chosen}>
              <span className="code">{c.code}</span>
              <span className="nm">{c.name}</span>
              {c.code === chosen && <span className="ck" aria-hidden="true">✓</span>}
            </button>
          </li>
        ))}
      </ul>
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
