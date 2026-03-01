import LiveFeed from "./components/LiveFeed";
import { query } from "../lib/ingestion/db.mjs";

export const dynamic = "force-dynamic";

async function getInitialEntries() {
  const { rows } = await query(
    `SELECT
      e.id,
      e.title,
      e.summary,
      e.content,
      e.canonical_url,
      e.published_at,
      s.name AS source_name
     FROM entries e
     INNER JOIN sources s ON s.id = e.source_id
     ORDER BY e.published_at DESC
     LIMIT 100`
  );

  return rows;
}

export default async function Page() {
  const entries = await getInitialEntries();

  return (
    <main style={{ fontFamily: "system-ui, Arial", margin: 24, maxWidth: 1000 }}>
      <h1>Veille cyber – Service public français</h1>
      <p>
        Ingestion automatisée toutes les 5 minutes avec déduplication stricte et affichage quasi
        temps réel.
      </p>
      <LiveFeed initialEntries={entries} />
    </main>
  );
}
