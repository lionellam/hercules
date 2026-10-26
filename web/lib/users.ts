import "server-only";
import { pool, query } from "./db";

export const DEFAULT_CATEGORIES = [
  "Food & Dining",
  "Transport",
  "Groceries",
  "Entertainment",
  "Utilities",
  "Health & Medical",
  "Household",
  "Shopping",
  "Rent",
  "Clothes",
  "Education",
  "Professional Development",
  "Travel",
  "Other",
];

export function normaliseEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function isAllowed(email: string): Promise<boolean> {
  const rows = await query("SELECT 1 FROM allowed_emails WHERE email = $1", [normaliseEmail(email)]);
  return rows.length > 0;
}

// Creates the user and seeds their categories on first sign-in; returns the user id.
export async function upsertUser(email: string, googleId: string | null, displayName: string | null) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<{ id: string; inserted: boolean }>(
      `INSERT INTO users (email, google_id, display_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE
         SET google_id = COALESCE(EXCLUDED.google_id, users.google_id),
             display_name = COALESCE(EXCLUDED.display_name, users.display_name)
       RETURNING id, (xmax = 0) AS inserted`,
      [normaliseEmail(email), googleId, displayName],
    );
    const { id, inserted } = rows[0];
    if (inserted) {
      for (const [i, name] of DEFAULT_CATEGORIES.entries()) {
        await client.query(
          `INSERT INTO categories (user_id, name, is_other, sort_order) VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, name) DO NOTHING`,
          [id, name, name === "Other", i],
        );
      }
    }
    await client.query("COMMIT");
    return id;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function getActiveUser(id: string) {
  const rows = await query<{ id: string; email: string; display_name: string | null }>(
    "SELECT id, email, display_name FROM users WHERE id = $1 AND is_active",
    [id],
  );
  return rows[0] ?? null;
}
