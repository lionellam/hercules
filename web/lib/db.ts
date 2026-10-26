import "server-only";
import { Pool, types } from "pg";

// Keep DATE as 'YYYY-MM-DD' (pg would otherwise shift it via the server's local timezone)
types.setTypeParser(1082, (v) => v);
// NUMERIC amounts as numbers; values are bounded to 2 decimal places
types.setTypeParser(1700, (v) => parseFloat(v));
// BIGSERIAL ids as numbers; they stay far below 2^53
types.setTypeParser(20, (v) => parseInt(v, 10));

const globalForPool = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPool.pgPool ??
  new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });

if (process.env.NODE_ENV !== "production") globalForPool.pgPool = pool;

export async function query<T>(text: string, params: unknown[] = []): Promise<T[]> {
  const res = await pool.query(text, params);
  return res.rows as T[];
}
