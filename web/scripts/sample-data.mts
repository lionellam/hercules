// Sample expenses for trying the app locally. Local database only.
// Usage: npm run sample -- add <email> | remove <email>
// Rows are tagged with source_ref 'sample:<n>', so "remove" deletes only them and
// "add" can be re-run safely. September and October are filled in full; the
// current month gets a realistic run up to today.
import pg from "pg";

const [command, rawEmail] = process.argv.slice(2);
const email = rawEmail?.trim().toLowerCase();
if (!["add", "remove"].includes(command) || !email) {
  console.log("Usage: npm run sample -- add <email> | remove <email>");
  process.exit(1);
}

const host = new URL(process.env.DATABASE_URL ?? "postgres://missing").hostname;
if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(host)) {
  console.log(`Refusing to run: DATABASE_URL points at ${host}, not the local database.`);
  process.exit(1);
}

type Row = { date: string; category: string; amount: number; merchant: string | null; raw: string };

// Small seeded random generator, so the same sample is produced every time.
let seed = 20260901;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
const money = (lo: number, hi: number) => Math.round((lo + rand() * (hi - lo)) * 10) / 10;

const meals = [
  ["Toast Box", "kaya toast set"], ["Ya Kun", "breakfast"], ["hawker centre", "chicken rice"],
  ["hawker centre", "fishball noodles"], ["Kopitiam", "lunch"], ["Subway", "lunch"],
  ["Din Tai Fung", "dinner"], ["Starbucks", "latte"], ["Koi", "bubble tea"], ["McDonald's", "dinner"],
] as const;
const groceries = ["NTUC FairPrice", "Cold Storage", "Sheng Siong", "Giant"];
const fun = [["Shaw Theatres", "movie"], ["Netflix", "subscription"], ["Spotify", "subscription"], ["Teo Heng KTV", "karaoke"]] as const;
const shops = [["Uniqlo", "Clothes"], ["Shopee", "Shopping"], ["Lazada", "Shopping"], ["IKEA", "Household"], ["Daiso", "Household"]] as const;

function fullMonth(year: number, month: number): Row[] {
  const days = new Date(year, month, 0).getDate();
  const ymd = (d: number) => `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const rows: Row[] = [];
  const add = (d: number, category: string, amount: number, merchant: string | null, raw: string) =>
    rows.push({ date: ymd(d), category, amount, merchant, raw });

  if (month !== 10) add(1, "Rent", 1800, null, "rent 1800");
  add(5, "Utilities", money(95, 140), "SP Group", "SP utilities bill");
  add(12, "Utilities", 42.8, "Singtel", "Singtel mobile bill");
  for (let d = 1; d <= days; d++) {
    const weekend = new Date(year, month - 1, d).getDay() % 6 === 0;
    for (let i = 0, n = weekend ? 2 : 1 + Math.floor(rand() * 2); i < n; i++) {
      const [m, what] = pick([...meals]);
      const amt = m === "Din Tai Fung" ? money(28, 55) : money(3.5, 16);
      add(d, "Food & Dining", amt, m, `${what} ${m} ${amt}`);
    }
    if (!weekend) { const a = money(1.5, 3.2); add(d, "Transport", a, "MRT", `mrt ${a}`); }
    if (rand() < 0.15) { const a = money(12, 28); add(d, "Transport", a, "Grab", `grab home ${a}`); }
    if (d % 7 === 3) { const g = pick(groceries), a = money(35, 85); add(d, "Groceries", a, g, `${g} groceries ${a}`); }
    if (rand() < 0.08) { const [m, what] = pick([...fun]); const a = money(10, 40); add(d, "Entertainment", a, m, `${what} ${a}`); }
    if (rand() < 0.07) { const [m, cat] = pick([...shops]); const a = money(15, 120); add(d, cat, a, m, `${m} ${a}`); }
  }
  add(18, "Health & Medical", 35, "Raffles Medical", "GP visit 35");
  add(22, "Professional Development", 29.9, "Udemy", "Udemy course 29.90");
  return rows;
}

// November 1–7: chosen so the Summary shows each pace state against the local budgets
// (Food & Dining a little over pace, Transport well over, Groceries on pace, Shopping under).
const november: Row[] = [
  { date: "2026-11-01", category: "Rent", amount: 1800, merchant: null, raw: "rent 1800" },
  { date: "2026-11-01", category: "Food & Dining", amount: 14.6, merchant: "hawker centre", raw: "brunch hawker 14.60" },
  { date: "2026-11-02", category: "Transport", amount: 24.5, merchant: "Grab", raw: "grab to airport 24.50" },
  { date: "2026-11-03", category: "Food & Dining", amount: 6.8, merchant: "Toast Box", raw: "toast box breakfast 6.80" },
  { date: "2026-11-03", category: "Transport", amount: 2.4, merchant: "MRT", raw: "mrt 2.40" },
  { date: "2026-11-03", category: "Utilities", amount: 118.35, merchant: "SP Group", raw: "SP bill 118.35" },
  { date: "2026-11-04", category: "Food & Dining", amount: 42.5, merchant: "Din Tai Fung", raw: "dinner din tai fung 42.50" },
  { date: "2026-11-04", category: "Transport", amount: 18.9, merchant: "Grab", raw: "grab home 18.90" },
  { date: "2026-11-05", category: "Shopping", amount: 64.9, merchant: "Shopee", raw: "shopee phone case and cable 64.90" },
  { date: "2026-11-05", category: "Transport", amount: 2.1, merchant: "MRT", raw: "mrt 2.10" },
  { date: "2026-11-06", category: "Groceries", amount: 22.4, merchant: "Sheng Siong", raw: "sheng siong 22.40" },
  { date: "2026-11-06", category: "Entertainment", amount: 15.98, merchant: "Netflix", raw: "netflix 15.98" },
  { date: "2026-11-06", category: "Transport", amount: 26.4, merchant: "Grab", raw: "grab late night 26.40" },
  { date: "2026-11-07", category: "Food & Dining", amount: 5.2, merchant: "Ya Kun", raw: "ya kun 5.20" },
];

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const user = await client.query<{ id: string }>("SELECT id FROM users WHERE email = $1", [email]);
  if (!user.rows.length) {
    console.log(`No account for ${email}. Sign in to the app once first, then re-run.`);
    process.exit(1);
  }
  const userId = user.rows[0].id;

  if (command === "remove") {
    const res = await client.query("DELETE FROM expenses WHERE user_id = $1 AND source_ref LIKE 'sample:%'", [userId]);
    console.log(`Removed ${res.rowCount} sample expenses. Your own entries are untouched.`);
  } else {
    const cats = await client.query<{ id: number; name: string }>("SELECT id, name FROM categories WHERE user_id = $1", [userId]);
    const ids = new Map(cats.rows.map((c) => [c.name, c.id]));
    const rows = [...fullMonth(2026, 9), ...fullMonth(2026, 10), ...november];
    let added = 0, skipped = 0;
    await client.query("BEGIN");
    for (const [i, r] of rows.entries()) {
      const categoryId = ids.get(r.category) ?? ids.get("Other");
      const res = await client.query(
        `INSERT INTO expenses (user_id, raw_input, amount, currency, category_id, merchant, date, created_at, source_ref)
         VALUES ($1, $2, $3, 'SGD', $4, $5, $6, ($6::date + time '12:00') AT TIME ZONE 'Asia/Singapore', $7)
         ON CONFLICT (user_id, source_ref) WHERE source_ref IS NOT NULL DO NOTHING`,
        [userId, r.raw, r.amount, categoryId, r.merchant, r.date, `sample:${i + 1}`],
      );
      if (res.rowCount) added++; else skipped++;
    }
    await client.query("COMMIT");
    console.log(`Added ${added} sample expenses (${skipped} already present). Remove them with: npm run sample -- remove ${email}`);
  }
} finally {
  await client.end();
}
