"use client";

import { useContext, useState } from "react";
import { api, fmt, useCached, type ApiCache } from "@/lib/client";
import type { Category } from "@/lib/types";
import { ConfirmSheet, UndoContext } from "../confirm";
import { useHomeCurrency } from "../currency";
import { useMoney } from "../currency";

function CategorySheet({ category, retired, online, onClose, onChanged }: { category: Category | null; retired: Category[]; online: boolean; onClose: () => void; onChanged: () => void }) {
  const home = useHomeCurrency();
  const money = useMoney();
  const [name, setName] = useState(category?.name ?? "");
  const [budget, setBudget] = useState(category?.monthly_budget?.toFixed(2) ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Adding a retired category's name restores that category
  const match = category ? undefined : retired.find((c) => c.name.toLowerCase() === name.trim().toLowerCase());
  const showUndo = useContext(UndoContext);
  const [asking, setAsking] = useState<"retire" | "discard" | null>(null);
  const dirty = name !== (category?.name ?? "") || budget !== (category?.monthly_budget?.toFixed(2) ?? "");
  const requestClose = () => (busy ? undefined : dirty ? setAsking("discard") : onClose());

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await action();
      onClose();
      onChanged();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  function save() {
    const value = Number(budget);
    if (budget.trim() && (!Number.isFinite(value) || value <= 0)) {
      setError("Enter a budget above zero, or leave it blank.");
      return;
    }
    const body = JSON.stringify({ name, monthly_budget: budget.trim() ? Math.round(value * 100) / 100 : null });
    run(() => (category ? api(`/api/categories/${category.id}`, { method: "PATCH", body }) : api("/api/categories", { method: "POST", body })));
  }

  async function retire() {
    if (!category) return;
    await api(`/api/categories/${category.id}`, { method: "DELETE" });
    onClose();
    onChanged();
    showUndo(`${category.name} retired`, async () => {
      await api(`/api/categories/${category.id}/restore`, { method: "POST" });
      onChanged();
    });
  }

  return (
    <div className="sheet-backdrop" onClick={requestClose}>
      <div className="sheet" onClick={(ev) => ev.stopPropagation()}>
        <div className="card">
          <div className="card-title">{category ? "Edit category" : "Add category"}</div>
          <div className="field">
            <label htmlFor="c-name">Name</label>
            <input id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pets" maxLength={50} disabled={category?.is_other} />
          </div>
          <div className="field">
            <label htmlFor="c-budget">Monthly budget ({home})</label>
            <input id="c-budget" inputMode="decimal" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Optional" />
          </div>
          {category?.is_other && <p className="sub">The built-in &quot;Other&quot; category can&apos;t be renamed or retired.</p>}
          {match && (
            <p className="sub">
              &quot;{match.name}&quot; was retired. Saving restores it, with its past expenses,{" "}
              {budget.trim() ? "and applies this budget." : "without a budget."}
            </p>
          )}
          {error && <p className="error">{error}</p>}
          <div className="actions">
            <div>
              {category && !category.is_other && (
                <button className="btn btn-danger" disabled={busy || !online} onClick={() => setAsking("retire")}>Retire</button>
              )}
            </div>
            <div className="right">
              <button className="btn btn-ghost" disabled={busy} onClick={requestClose}>Cancel</button>
              <button className="btn btn-primary" disabled={busy || !online || !name.trim()} onClick={save}>
                {busy ? "Saving…" : match ? "Restore" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {asking === "retire" && category && (
        <ConfirmSheet
          title={`Retire ${category.name}?`}
          body={
            <>
              <p>It won&apos;t be offered for new expenses. Past expenses keep this category, and you can restore it any time from Categories.</p>
              {category.monthly_budget != null && (
                <p>Its {money(category.monthly_budget)} budget stops being tracked. Spending already logged this month stays in Summary.</p>
              )}
            </>
          }
          confirmLabel="Retire category"
          onConfirm={retire}
          onCancel={() => setAsking(null)}
        />
      )}
      {asking === "discard" && (
        <ConfirmSheet
          title="Discard changes?"
          body={`Your changes to this category won't be saved.`}
          confirmLabel="Discard changes"
          cancelLabel="Keep editing"
          onConfirm={onClose}
          onCancel={() => setAsking(null)}
        />
      )}
    </div>
  );
}

export default function CategoriesScreen({ categories, online, cache, onChanged, onBack }: { categories: Category[]; online: boolean; cache: ApiCache; onChanged: () => void; onBack: () => void }) {
  const home = useHomeCurrency();
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const retired = useCached<Category[]>(cache, "/api/categories?retired=1") ?? [];
  const [showRetired, setShowRetired] = useState(false);
  const [restoreError, setRestoreError] = useState("");

  async function restore(c: Category) {
    setRestoreError("");
    try {
      await api(`/api/categories/${c.id}/restore`, { method: "POST" });
      onChanged();
    } catch (e) {
      setRestoreError((e as Error).message);
    }
  }

  return (
    <section className="screen pinned-screen">
      <div className="pinned-top">
        <button className="back-link" onClick={onBack}>‹ Settings</button>
        <h1>Categories &amp; budgets</h1>
        <p className="sub">Monthly budgets are optional and in {home}.</p>
        <div className="row-start">
          <button className="btn btn-primary" disabled={!online} onClick={() => setEditing("new")}>Add category</button>
        </div>
      </div>
      {categories.length === 0 ? (
        <p className="sub empty">Loading…</p>
      ) : (
        categories.map((c) => (
          <button className="item" key={c.id} onClick={() => setEditing(c)}>
            <div>
              <div className="m">{c.name}</div>
            </div>
            {c.monthly_budget == null ? <div className="c">No budget</div> : <div className="a">{fmt(c.monthly_budget)}</div>}
          </button>
        ))
      )}
      {retired.length > 0 && (
        <>
          <button className="retired-toggle" aria-expanded={showRetired} onClick={() => setShowRetired(!showRetired)}>
            <span>Retired ({retired.length})</span>
            <span>{showRetired ? "Hide" : "Show"}</span>
          </button>
          {showRetired && (
            <>
              {retired.map((c) => (
                <div className="item retired" key={c.id}>
                  <div>
                    <div className="m">{c.name}</div>
                    <div className="c">{c.monthly_budget == null ? "No budget" : `Budget ${fmt(c.monthly_budget)}`}</div>
                  </div>
                  <button className="btn btn-small" disabled={!online} onClick={() => restore(c)}>Restore</button>
                </div>
              ))}
              {restoreError && <p className="error">{restoreError}</p>}
              <p className="sub retired-note">Retired categories aren&apos;t offered for new expenses. Past expenses keep them.</p>
            </>
          )}
        </>
      )}
      {editing && (
        <CategorySheet category={editing === "new" ? null : editing} retired={retired} online={online} onClose={() => setEditing(null)} onChanged={onChanged} />
      )}
    </section>
  );
}
