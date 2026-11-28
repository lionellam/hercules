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

// Today's spending by category on the Log screen, each budgeted category measured against today's budget
// (Specification 4.9, Architecture decision 46). Today's budget = (budget − spent this month before today) ÷ days left,
// counting today; it uses spending before today only, so it stays the same all day. Amounts are in whole cents.
export type TodayState = "ok" | "warn" | "over" | "none" | "retired";
export type TodayRow = { id: number; category: string; count: number; total: number; allowance: number | null; state: TodayState };

export function todayRows(expenses: Expense[], categories: Category[], today: string, days: number): TodayRow[] {
  const daysLeft = days - Number(today.slice(8)) + 1;
  const byId = new Map<number, { name: string; count: number; todayC: number; beforeC: number }>();
  for (const e of expenses) {
    if (e.date > today) continue;
    const r = byId.get(e.category_id) ?? { name: e.category, count: 0, todayC: 0, beforeC: 0 };
    if (e.date === today) {
      r.count += 1;
      r.todayC += cents(e.amount);
    } else r.beforeC += cents(e.amount);
    byId.set(e.category_id, r);
  }
  const rows: TodayRow[] = [];
  for (const [id, r] of byId) {
    if (r.count === 0) continue;
    const c = categories.find((x) => x.id === id);
    const base = { id, category: r.name, count: r.count, total: r.todayC / 100 };
    if (!c) rows.push({ ...base, allowance: null, state: "retired" });
    else if (c.monthly_budget == null) rows.push({ ...base, allowance: null, state: "none" });
    else {
      const budgetC = cents(c.monthly_budget);
      const allowanceC = Math.max(0, Math.round((budgetC - r.beforeC) / daysLeft));
      const state = r.beforeC + r.todayC > budgetC ? "over" : r.todayC > allowanceC ? "warn" : "ok";
      rows.push({ ...base, allowance: allowanceC / 100, state });
    }
  }
  return rows.sort((a, b) => b.total - a.total);
}
