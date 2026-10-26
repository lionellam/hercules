// Applies db/schema.sql to DATABASE_URL. Safe to re-run.
import { readFileSync } from "node:fs";
import pg from "pg";

const sql = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query(sql);
  console.log("Schema applied.");
} finally {
  await client.end();
}
