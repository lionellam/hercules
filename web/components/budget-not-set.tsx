"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Category } from "@/lib/types";

// Below a category without a budget, on Summary this month and on Log's Today by category (Specification 4.1 and 4.9):
// the whole line opens a bubble saying where budgets are set, with a link that opens the category's Edit category card
// over the screen (Architecture decisions 44 and 46)
export function BudgetNotSet({ category, onSet }: { category: Category; onSet: () => void }) {
  // Where the bubble's arrow sits (under the "i"), measured when the line is tapped; null while closed
  const [arrowAt, setArrowAt] = useState<number | null>(null);
  const open = arrowAt != null;
  const tipId = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const icon = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (ev: PointerEvent) => {
      if (!wrap.current?.contains(ev.target as Node)) setArrowAt(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <div className="no-budget" ref={wrap}>
      <button
        type="button"
        className={`no-budget-line${open ? " on" : ""}`}
        aria-expanded={open}
        aria-controls={tipId}
        onClick={() => setArrowAt(open ? null : (icon.current?.offsetLeft ?? 0) + 3)}
      >
        Budget not set for this category
        <span className="no-budget-i" ref={icon} aria-hidden="true">i</span>
      </button>
      {open && (
        <div className="ni-tip" id={tipId} role="tooltip" style={{ "--arrow": `${arrowAt}px` } as React.CSSProperties}>
          The budget for this category can be set in Settings › Categories &amp; budgets.
          <button
            type="button"
            className="no-budget-link"
            onClick={() => {
              setArrowAt(null);
              onSet();
            }}
          >
            Set a budget for {category.name}
          </button>
        </div>
      )}
    </div>
  );
}
