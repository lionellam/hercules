"use client";

// An expense in a list, and the sheet for editing or deleting it (used by Log and History)
import { useContext, useState } from "react";
import { api, fmt } from "@/lib/client";
import { dayMonth } from "@/lib/dates";
import type { Category, Expense } from "@/lib/types";
import { ConfirmSheet, UndoContext } from "./confirm";
import ReviewCard, { type Fields } from "./review-card";

// Wraps each occurrence of the search words in <mark>, ignoring capitals
function Highlight({ text, words }: { text: string; words?: string[] }) {
  if (!words?.length) return <>{text}</>;
  const pattern = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return <>{text.split(pattern).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part))}</>;
}

export function ExpenseRow({ e, onClick, highlight }: { e: Expense; onClick?: () => void; highlight?: string[] }) {
  return (
    <button className="item" onClick={onClick}>
      <div>
        <div className="m"><Highlight text={e.merchant || e.raw_input} words={highlight} /></div>
        <div className="c">
          <Highlight text={e.category} words={highlight} />
          {e.was_edited && <span className="edited">edited</span>}
        </div>
      </div>
      <div className="a">
        {e.currency !== "SGD" && `${e.currency} `}
        <Highlight text={fmt(e.amount)} words={highlight} />
      </div>
    </button>
  );
}

export function EditSheet({ expense, categories, online, onClose, onChanged }: { expense: Expense; categories: Category[]; online: boolean; onClose: () => void; onChanged: () => void }) {
  // An expense in a retired category can keep it; no other expense is offered a retired category
  const options =
    categories.length > 0 && !categories.some((c) => c.id === expense.category_id)
      ? [...categories, { id: expense.category_id, name: `${expense.category} (retired)` }]
      : categories;

  async function save(fields: Fields, edited: boolean) {
    await api(`/api/expenses/${expense.id}`, { method: "PATCH", body: JSON.stringify({ ...fields, was_edited: edited }) });
    onClose();
    onChanged();
  }

  const showUndo = useContext(UndoContext);
  const [dirty, setDirty] = useState(false);
  const [asking, setAsking] = useState<"delete" | "discard" | null>(null);
  const requestClose = () => (dirty ? setAsking("discard") : onClose());

  async function remove() {
    await api(`/api/expenses/${expense.id}`, { method: "DELETE" });
    onClose();
    onChanged();
    showUndo("Expense deleted", async () => {
      await api(`/api/expenses/${expense.id}/restore`, { method: "POST" });
      onChanged();
    });
  }

  return (
    <div className="sheet-backdrop" onClick={requestClose}>
      <div className="sheet" onClick={(ev) => ev.stopPropagation()}>
        <ReviewCard
          title="Edit expense"
          rawInput={expense.raw_input}
          initial={expense}
          categories={options}
          onSave={save}
          onCancel={requestClose}
          cancelLabel="Cancel"
          onDelete={() => setAsking("delete")}
          disabled={!online}
          onDirtyChange={setDirty}
        />
      </div>
      {asking === "delete" && (
        <ConfirmSheet
          title="Delete this expense?"
          body="It will be removed from History and Summary."
          detail={
            <div className="confirm-ref">
              <div>
                <div>{expense.merchant || expense.raw_input}</div>
                <div className="c">
                  {expense.category} · {dayMonth(expense.date)}
                </div>
              </div>
              <b>{fmt(expense.amount)}</b>
            </div>
          }
          confirmLabel="Delete expense"
          onConfirm={remove}
          onCancel={() => setAsking(null)}
        />
      )}
      {asking === "discard" && (
        <ConfirmSheet
          title="Discard changes?"
          body="Your changes to this expense won't be saved."
          confirmLabel="Discard changes"
          cancelLabel="Keep editing"
          onConfirm={onClose}
          onCancel={() => setAsking(null)}
        />
      )}
    </div>
  );
}
