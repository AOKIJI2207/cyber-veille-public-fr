import { Pool } from "pg";

const globalForPg = globalThis as typeof globalThis & {
  __cyberVeillePool?: Pool;
};

const pool =
  globalForPg.__cyberVeillePool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.PG_POOL_SIZE ?? 10)
  });

if (!globalForPg.__cyberVeillePool) {
  globalForPg.__cyberVeillePool = pool;
}

export async function dbQuery(text: string, params: unknown[] = []) {
  return pool.query(text, params);
}
