import "server-only";
import { z } from "zod";
import { query } from "./db";

export const DAILY_PARSE_LIMIT = 100;
export const MAX_CATEGORIES = 50;

export type Category = { id: number; name: string; is_other: boolean; monthly_budget: number | null };

export type Expense = {
  id: number;
  raw_input: string;
  amount: number;
  currency: string;
  category_id: number;
  category: string;
  merchant: string | null;
  date: string;
  remarks: string | null;
  was_edited: boolean;
};

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
export const MONTH = /^\d{4}-\d{2}$/;

export const expenseInput = z.object({
  amount: z.number().positive().max(10_000_000),
  currency: z.string().regex(/^[A-Z]{3}$/),
  category_id: z.number().int(),
  merchant: z.string().trim().max(200).nullable(),
  date: z.string().regex(ISO_DATE),
  remarks: z.string().trim().max(1000).nullable(),
  was_edited: z.boolean(),
});

export const categoryInput = z.object({
  name: z.string().trim().min(1).max(50).regex(/^[^\r\n]+$/),
  monthly_budget: z.number().positive().max(10_000_000).nullable(),
});

// "Other" always sorts last; the Log screen falls back to the last category
export function getCategories(userId: string) {
  return query<Category>(
    `SELECT id, name, is_other, monthly_budget FROM categories
     WHERE user_id = $1 AND is_active ORDER BY is_other, sort_order, name`,
    [userId],
  );
}

// Returns null if the name is taken (ignoring case) or the user has reached the category limit.
export async function createCategory(userId: string, input: z.infer<typeof categoryInput>) {
  const rows = await query<{ id: number }>(
    `INSERT INTO categories (user_id, name, is_default, monthly_budget, sort_order)
     SELECT $1::uuid, $2::text, FALSE, $3::numeric,
            COALESCE((SELECT MAX(sort_order) FROM categories WHERE user_id = $1::uuid), 0) + 1
     WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id = $1::uuid AND lower(name) = lower($2::text))
       AND (SELECT COUNT(*) FROM categories WHERE user_id = $1::uuid AND is_active) < $4
     ON CONFLICT DO NOTHING RETURNING id`,
    [userId, input.name, input.monthly_budget, MAX_CATEGORIES],
  );
  return rows[0]?.id ?? null;
}

// "Other" keeps its name because the parser falls back to it by name; its budget can still change.
// Returns false if the category isn't found or the new name is taken (ignoring case).
export async function updateCategory(userId: string, id: number, input: z.infer<typeof categoryInput>) {
  const rows = await query(
    `UPDATE categories c SET name = CASE WHEN c.is_other THEN c.name ELSE $3::text END, monthly_budget = $4::numeric
     WHERE c.id = $1 AND c.user_id = $2 AND c.is_active
       AND (c.is_other OR NOT EXISTS (
         SELECT 1 FROM categories o WHERE o.user_id = $2 AND lower(o.name) = lower($3::text) AND o.id <> $1
       ))
     RETURNING c.id`,
    [id, userId, input.name, input.monthly_budget],
  );
  return rows.length > 0;
}

async function ownsCategory(userId: string, categoryId: number) {
  const rows = await query("SELECT 1 FROM categories WHERE id = $1 AND user_id = $2 AND is_active", [
    categoryId,
    userId,
  ]);
  return rows.length > 0;
}

function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  return [`${month}-01`, `${next}-01`];
}

export function listExpenses(userId: string, month: string) {
  const [start, end] = monthRange(month);
  return query<Expense>(
    `SELECT e.id, e.raw_input, e.amount, e.currency, e.category_id, c.name AS category,
            e.merchant, e.date, e.remarks, e.was_edited
     FROM expenses e JOIN categories c ON c.id = e.category_id
     WHERE e.user_id = $1 AND e.deleted_at IS NULL AND e.date >= $2 AND e.date < $3
     ORDER BY e.date DESC, e.created_at DESC`,
    [userId, start, end],
  );
}

export function monthSummary(userId: string, month: string) {
  const [start, end] = monthRange(month);
  return query<{ category: string; total: number; count: number; budget: number | null }>(
    `SELECT c.name AS category, SUM(e.amount)::numeric(12,2) AS total, COUNT(*)::int AS count, c.monthly_budget AS budget
     FROM expenses e JOIN categories c ON c.id = e.category_id
     WHERE e.user_id = $1 AND e.deleted_at IS NULL AND e.date >= $2 AND e.date < $3
     GROUP BY c.name, c.monthly_budget ORDER BY total DESC`,
    [userId, start, end],
  );
}

export async function createExpense(userId: string, rawInput: string, input: z.infer<typeof expenseInput>) {
  if (!(await ownsCategory(userId, input.category_id))) return null;
  const rows = await query<{ id: number }>(
    `INSERT INTO expenses (user_id, raw_input, amount, currency, category_id, merchant, date, remarks, was_edited)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [userId, rawInput, input.amount, input.currency, input.category_id, input.merchant || null, input.date, input.remarks || null, input.was_edited],
  );
  return rows[0].id;
}

export async function updateExpense(userId: string, id: number, input: z.infer<typeof expenseInput>) {
  if (!(await ownsCategory(userId, input.category_id))) return false;
  const rows = await query(
    `UPDATE expenses SET amount = $3, currency = $4, category_id = $5, merchant = $6, date = $7, remarks = $8,
            was_edited = was_edited OR $9, updated_at = now()
     WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING id`,
    [id, userId, input.amount, input.currency, input.category_id, input.merchant || null, input.date, input.remarks || null, input.was_edited],
  );
  return rows.length > 0;
}

export async function softDeleteExpense(userId: string, id: number) {
  const rows = await query(
    "UPDATE expenses SET deleted_at = now() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING id",
    [id, userId],
  );
  return rows.length > 0;
}

// Records the attempt and returns false once the user has hit today's limit (rolling 24 hours).
export async function claimParse(userId: string) {
  const rows = await query<{ n: number }>(
    "SELECT COUNT(*)::int AS n FROM parse_events WHERE user_id = $1 AND created_at > now() - interval '24 hours'",
    [userId],
  );
  if (rows[0].n >= DAILY_PARSE_LIMIT) return false;
  await query("INSERT INTO parse_events (user_id) VALUES ($1)", [userId]);
  return true;
}
