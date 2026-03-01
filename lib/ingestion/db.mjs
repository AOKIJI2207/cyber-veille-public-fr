import { Pool } from "pg";

const globalForPg = globalThis;

const pool = globalForPg.__cyberVeillePool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.PG_POOL_SIZE ?? 10)
});

if (!globalForPg.__cyberVeillePool) {
  globalForPg.__cyberVeillePool = pool;
}

export async function query(text, params = []) {
  return pool.query(text, params);
}

export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
