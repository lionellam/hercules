// One-off import of the Phase 1 CLI's SQLite expenses into a web app account.
// Usage: npm run import:cli -- <email> [path/to/expenses.db] [--dry-run]
// Re-running is safe: records already imported (matched by their CLI id) are skipped.
import { DatabaseSync } from "node:sqlite";
import pg from "pg";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const [rawEmail, dbPath = "../poc/data/expenses.db"] = args.filter((a) => a !== "--dry-run");
if (!rawEmail) {
  console.log("Usage: npm run import:cli -- <email> [path/to/expenses.db] [--dry-run]");
  process.exit(1);
}
const email = rawEmail.trim().toLowerCase();

type CliRow = {
  id: number;
  raw_input: string;
  amount: number;
  currency: string;
  category: string;
  merchant: string | null;
  date: string;
  remarks: string | null;
  was_edited: number;
  created_at: string;
};

const sqlite = new DatabaseSync(dbPath, { readOnly: true });
const rows = sqlite.prepare("SELECT * FROM expenses ORDER BY id").all() as unknown as CliRow[];
sqlite.close();

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  const user = await client.query<{ id: string }>("SELECT id FROM users WHERE email = $1", [email]);
  if (!user.rows.length) {
    console.log(`No account for ${email}. Sign in to the web app once first, then re-run.`);
    process.exit(1);
  }
  const userId = user.rows[0].id;

  const cats = await client.query<{ id: number; name: string }>("SELECT id, name FROM categories WHERE user_id = $1", [userId]);
  const categoryIds = new Map(cats.rows.map((c) => [c.name, c.id]));

  let imported = 0;
  let skipped = 0;
  const invalid: string[] = [];

  await client.query("BEGIN");
  for (const r of rows) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date) || !(r.amount > 0)) {
      invalid.push(`${r.date} | ${r.amount} | ${r.raw_input}`);
      continue;
    }
    const createdAt = new Date(r.created_at).toISOString();
    const sourceRef = `cli:${r.id}`;
    const exists = await client.query("SELECT 1 FROM expenses WHERE user_id = $1 AND source_ref = $2", [userId, sourceRef]);
    if (exists.rows.length) {
      skipped++;
      continue;
    }
    let categoryId = categoryIds.get(r.category);
    if (categoryId === undefined) {
      const created = await client.query<{ id: number }>(
        "INSERT INTO categories (user_id, name, is_default, sort_order) VALUES ($1, $2, FALSE, 100) RETURNING id",
        [userId, r.category],
      );
      categoryId = created.rows[0].id;
      categoryIds.set(r.category, categoryId);
      console.log(`Created category not in the default list: ${r.category}`);
    }
    await client.query(
      `INSERT INTO expenses (user_id, raw_input, amount, currency, category_id, merchant, date, remarks, was_edited, created_at, source_ref)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [userId, r.raw_input, r.amount, r.currency || "SGD", categoryId, r.merchant, r.date, r.remarks, !!r.was_edited, createdAt, sourceRef],
    );
    imported++;
  }
  await client.query(dryRun ? "ROLLBACK" : "COMMIT");

  console.log(`${dryRun ? "[dry run] Would import" : "Imported"} ${imported}, skipped ${skipped} already imported, ${invalid.length} invalid.`);
  for (const line of invalid) console.log(`  invalid: ${line}`);
} catch (e) {
  await client.query("ROLLBACK").catch(() => {});
  throw e;
} finally {
  await client.end();
}
