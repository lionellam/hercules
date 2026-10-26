"use client";

import { useState } from "react";

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
  onDelete?: () => Promise<void>;
  disabled?: boolean;
};

export default function ReviewCard({ title, initial, categories, rawInput, onSave, onCancel, cancelLabel, onDelete, disabled }: Props) {
  const [amount, setAmount] = useState(initial.amount == null ? "" : initial.amount.toFixed(2));
  const [categoryId, setCategoryId] = useState(initial.category_id);
  const [merchant, setMerchant] = useState(initial.merchant ?? "");
  const [date, setDate] = useState(initial.date);
  const [remarks, setRemarks] = useState(initial.remarks ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
      currency: initial.currency,
      category_id: categoryId,
      merchant: merchant.trim() || null,
      date,
      remarks: remarks.trim() || null,
    };
    const edited =
      fields.amount !== initial.amount ||
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
        <span>{initial.currency}</span>
        <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" aria-label="Amount" />
      </div>
      <div className="field">
        <label htmlFor="f-cat">Category</label>
        <select id="f-cat" value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="f-merchant">Merchant</label>
        <input id="f-merchant" value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="—" maxLength={200} />
      </div>
      <div className="field">
        <label htmlFor="f-date">Date</label>
        <input id="f-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="f-remarks">Remarks</label>
        <input id="f-remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional" maxLength={1000} />
      </div>
      {error && <p className="error">{error}</p>}
      <div className="actions">
        <div>
          {onDelete && (
            <button className="btn btn-danger" disabled={busy || disabled} onClick={() => run(onDelete)}>Delete</button>
          )}
        </div>
        <div className="right">
          <button className="btn btn-ghost" disabled={busy} onClick={onCancel}>{cancelLabel}</button>
          <button className="btn btn-primary" disabled={busy || disabled || !date} onClick={save}>{busy ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}
