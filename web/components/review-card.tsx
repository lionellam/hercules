"use client";

import { useEffect, useRef, useState } from "react";
import { CurrencySelect } from "./currency";

// Drawn by the app so every device shows the same icons (Architecture decision 38)
const PencilIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);
const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
    <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
  </svg>
);

export type Fields = {
  amount: number | null;
  currency: string;
  category_id: number;
  merchant: string | null;
  date: string;
  remarks: string | null;
};

type Props = {
  title: string;
  initial: Fields;
  categories: { id: number; name: string }[];
  rawInput?: string;
  onSave: (fields: Fields & { amount: number }, edited: boolean) => Promise<void>;
  onCancel: () => void;
  cancelLabel: string;
  onDelete?: () => void;
  disabled?: boolean;
  // Called whenever the fields start or stop differing from `initial`
  onDirtyChange?: (dirty: boolean) => void;
  // The review sheet after Parse (Architecture decision 38): full-width Save expense and Discard
  afterParse?: boolean;
};

export default function ReviewCard({ title, initial, categories, rawInput, onSave, onCancel, cancelLabel, onDelete, disabled, onDirtyChange, afterParse }: Props) {
  const [amount, setAmount] = useState(initial.amount == null ? "" : initial.amount.toFixed(2));
  const [currency, setCurrency] = useState(initial.currency);
  const [categoryId, setCategoryId] = useState(initial.category_id);
  const [merchant, setMerchant] = useState(initial.merchant ?? "");
  const [date, setDate] = useState(initial.date);
  const [remarks, setRemarks] = useState(initial.remarks ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dateInput = useRef<HTMLInputElement>(null);
  // The browser's own date icon is hidden, so tapping the date or its icon opens the picker
  const openDatePicker = () => {
    try {
      dateInput.current?.showPicker();
    } catch {
      dateInput.current?.focus();
    }
  };
  const dirty =
    amount !== (initial.amount == null ? "" : initial.amount.toFixed(2)) ||
    currency !== initial.currency ||
    categoryId !== initial.category_id ||
    merchant !== (initial.merchant ?? "") ||
    date !== initial.date ||
    remarks !== (initial.remarks ?? "");
  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  function save() {
    const value = Number(amount);
    if (!amount.trim() || !Number.isFinite(value) || value <= 0) {
      setError("Please enter an amount.");
      return;
    }
    const fields = {
      amount: Math.round(value * 100) / 100,
      currency,
      category_id: categoryId,
      merchant: merchant.trim() || null,
      date,
      remarks: remarks.trim() || null,
    };
    const edited =
      fields.amount !== initial.amount ||
      fields.currency !== initial.currency ||
      fields.category_id !== initial.category_id ||
      fields.merchant !== (initial.merchant || null) ||
      fields.date !== initial.date ||
      fields.remarks !== (initial.remarks || null);
    run(() => onSave(fields, edited));
  }

  return (
    <div className="card">
      <div className="card-title">{title}</div>
      {rawInput && <p className="raw">“{rawInput}”</p>}
      <div className="amount-field">
        <CurrencySelect value={currency} onChange={setCurrency} />
        <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" aria-label="Amount" />
      </div>
      <div className="field">
        <label htmlFor="f-cat">Category</label>
        <select id="f-cat" value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <label htmlFor="f-cat" className="field-icon"><PencilIcon /></label>
      </div>
      <div className="field">
        <label htmlFor="f-merchant">Merchant</label>
        <input id="f-merchant" value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="—" maxLength={200} />
        <label htmlFor="f-merchant" className="field-icon"><PencilIcon /></label>
      </div>
      <div className="field">
        <label htmlFor="f-date">Date</label>
        <input ref={dateInput} id="f-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} onClick={openDatePicker} required />
        <span className="field-icon" onClick={openDatePicker}><CalendarIcon /></span>
      </div>
      <div className="field">
        <label htmlFor="f-remarks">Remarks</label>
        <input id="f-remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional" maxLength={1000} />
        <label htmlFor="f-remarks" className="field-icon"><PencilIcon /></label>
      </div>
      {error && <p className="error">{error}</p>}
      {afterParse ? (
        <div className="actions stacked">
          <button className="btn btn-primary btn-wide" disabled={busy || disabled || !date} onClick={save}>{busy ? "Saving…" : "Save expense"}</button>
          <button className="btn btn-ghost btn-wide" disabled={busy} onClick={onCancel}>{cancelLabel}</button>
        </div>
      ) : (
      <div className="actions">
        <div>
          {onDelete && (
            <button className="btn btn-danger" disabled={busy || disabled} onClick={onDelete}>Delete</button>
          )}
        </div>
        <div className="right">
          <button className="btn btn-ghost" disabled={busy} onClick={onCancel}>{cancelLabel}</button>
          <button className="btn btn-primary" disabled={busy || disabled || !date} onClick={save}>{busy ? "Saving…" : "Save"}</button>
        </div>
      </div>
      )}
    </div>
  );
}
