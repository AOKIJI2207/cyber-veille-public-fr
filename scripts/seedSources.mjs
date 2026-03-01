import sources from "../sources.json" assert { type: "json" };
import { query } from "../lib/ingestion/db.mjs";

function inferType(url) {
  if (url.includes("atom")) return "atom";
  if (url.includes("feed") || url.includes("rss")) return "rss";
  return "html";
}

async function seed() {
  for (const source of sources) {
    await query(
      `INSERT INTO sources (name, url, type, is_active)
       VALUES ($1, $2, $3, TRUE)
       ON CONFLICT (url) DO UPDATE SET
         name = EXCLUDED.name,
         type = EXCLUDED.type,
         updated_at = NOW()`,
      [source.name, source.url, inferType(source.url)]
    );
  }

  console.log(`Seed completed (${sources.length} sources).`);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
