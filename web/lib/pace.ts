// Spending pace maths for the current month on Summary (Specification Section 4.1)
import type { Category, Expense, SummaryRow } from "./types";

export type PaceRow = SummaryRow & { id: number; daily: number[] };

export const expectedBy = (budget: number, day: number, days: number) => (budget * day) / days;
export const cents = (n: number) => Math.round(n * 100);

// Current month rows built from the expense list, so totals, bars and pace always agree.
// daily[d] holds each day's spend in cents. Only categories with spending are listed, to keep Summary short.
export function paceRows(expenses: Expense[], categories: Category[], days: number): PaceRow[] {
  const byId = new Map<number, PaceRow>();
  const row = (id: number, name: string) => {
    let r = byId.get(id);
    if (!r) {
      r = { id, category: name, total: 0, count: 0, budget: null, daily: Array(days + 1).fill(0) };
      byId.set(id, r);
    }
    return r;
  };
  for (const e of expenses) {
    const r = row(e.category_id, e.category);
    r.daily[Number(e.date.slice(8))] += Math.round(e.amount * 100);
    r.count += 1;
  }
  for (const c of categories) {
    const r = byId.get(c.id);
    if (r) r.budget = c.monthly_budget;
  }
  for (const r of byId.values()) r.total = r.daily.reduce((sum, v) => sum + v, 0) / 100;
  return [...byId.values()].sort((a, b) => b.total - a.total);
}
