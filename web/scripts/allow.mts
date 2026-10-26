// Usage: npm run allow -- add <email> | remove <email> | list
import pg from "pg";

const [command, rawEmail] = process.argv.slice(2);
const email = rawEmail?.trim().toLowerCase();
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  if (command === "add" && email) {
    await client.query("INSERT INTO allowed_emails (email) VALUES ($1) ON CONFLICT DO NOTHING", [email]);
    console.log(`Allowed: ${email}`);
  } else if (command === "remove" && email) {
    const res = await client.query("DELETE FROM allowed_emails WHERE email = $1", [email]);
    console.log(res.rowCount ? `Removed: ${email} (their data is kept)` : `${email} was not on the allow-list`);
  } else if (command === "list") {
    const { rows } = await client.query("SELECT email, added_at FROM allowed_emails ORDER BY added_at");
    if (!rows.length) console.log("The allow-list is empty.");
    for (const r of rows) console.log(`${r.email}  (added ${r.added_at.toISOString().slice(0, 10)})`);
  } else {
    console.log("Usage: npm run allow -- add <email> | remove <email> | list");
    process.exitCode = 1;
  }
} finally {
  await client.end();
}
