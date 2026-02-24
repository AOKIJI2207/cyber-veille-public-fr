let PoolCtor = null;

function getPoolCtor() {
  if (PoolCtor !== null) return PoolCtor;
  try {
    ({ Pool: PoolCtor } = require("pg"));
  } catch {
    PoolCtor = undefined;
  }
  return PoolCtor;
}

const DATABASE_URL = process.env.DATABASE_URL;
let pool = null;

function getPool() {
  const Pool = getPoolCtor();
  if (!DATABASE_URL || !Pool) return null;
  if (!pool) pool = new Pool({ connectionString: DATABASE_URL });
  return pool;
}

async function upsertEntry(entry) {
  const p = getPool();
  if (!p) return;

  await p.query(
    `INSERT INTO entries (
      id, entry_type, title, summary, published_at, fetched_at, url, canonical_url,
      certfr_id, cve_list, vendors, products, secteurs, territoire, attack_surface,
      confidence_score, status, relevance_public_sector, severity, content_hash
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,
      $9,$10,$11,$12,$13,$14,$15,
      $16,$17,$18,$19,$20
    ) ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      summary = EXCLUDED.summary,
      updated_at = NOW()`,
    [
      entry.id,
      entry.type,
      entry.title,
      entry.summary,
      entry.published_at,
      entry.fetched_at,
      entry.url,
      entry.canonical_url,
      entry.identifiers.certfr_id,
      JSON.stringify(entry.identifiers.cve_list || []),
      JSON.stringify(entry.entities.vendors || []),
      JSON.stringify(entry.entities.products || []),
      JSON.stringify(entry.entities.secteurs || []),
      entry.entities.territoire || "France",
      JSON.stringify(entry.attack_surface || []),
      entry.confidence_score,
      entry.status,
      entry.relevance_public_sector,
      entry.severity,
      entry.content_hash
    ]
  );
}

module.exports = { upsertEntry };
