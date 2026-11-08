"use client";

// The app's own confirmation sheet and "… · Undo" bar (Specification Section 4.2)
import { createContext, useCallback, useEffect, useRef, useState } from "react";

type ShowUndo = (message: string, undo: () => Promise<void>) => void;
export const UndoContext = createContext<ShowUndo>(() => {});

// One "… · Undo" bar at a time, above the tab bar, for about five seconds
export function useUndoBar() {
  const [bar, setBar] = useState<{ message: string; undo?: () => Promise<void> } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const show = useCallback((message: string, undo?: () => Promise<void>, ms = 5000) => {
    clearTimeout(timer.current);
    setBar({ message, undo });
    timer.current = setTimeout(() => setBar(null), ms);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  const showUndo = useCallback<ShowUndo>((message, undo) => show(message, undo), [show]);
  const element = bar && (
    <div className="undo-bar" role="status">
      <span>{bar.message}</span>
      {bar.undo && (
        <button
          onClick={() => {
            const undo = bar.undo!;
            setBar(null);
            undo().catch(() => show("Couldn't undo. Please try again.", undefined, 3000));
          }}
        >
          Undo
        </button>
      )}
    </div>
  );
  return { showUndo, element };
}

// The app's own confirmation, used instead of the browser's prompt (which some browsers switch off)
export function ConfirmSheet({ title, body, detail, confirmLabel, cancelLabel = "Cancel", danger = true, onConfirm, onCancel }: {
  title: string;
  body?: React.ReactNode;
  detail?: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function confirm() {
    setBusy(true);
    setError("");
    try {
      await onConfirm();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <div className="confirm-backdrop" onClick={(ev) => { ev.stopPropagation(); if (!busy) onCancel(); }}>
      <div className="confirm-sheet" role="alertdialog" aria-modal="true" aria-label={title} onClick={(ev) => ev.stopPropagation()}>
        <h2>{title}</h2>
        {body && <div className="confirm-body">{body}</div>}
        {detail}
        {error && <p className="error">{error}</p>}
        <div className="confirm-actions">
          <button className={`btn ${danger ? "btn-red" : "btn-primary"}`} disabled={busy} onClick={confirm}>{busy ? "Please wait…" : confirmLabel}</button>
          <button className="btn btn-ghost" disabled={busy} onClick={onCancel}>{cancelLabel}</button>
        </div>
      </div>
    </div>
  );
}
