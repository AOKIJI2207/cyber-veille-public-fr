export const dynamic = "force-dynamic";

async function getEntries() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/feed?limit=100`, { cache: "no-store" });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.entries || [];
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  return date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

export default async function Page() {
  const entries = await getEntries();

  return (
    <main style={{ fontFamily: "system-ui, Arial", margin: 24, maxWidth: 1000 }}>
      <h1>Veille cyber – Service public français</h1>
      <p>Feed alimenté par ingestion serverless (cron Vercel toutes les 5 minutes).</p>
      <p>
        Articles en base : <strong>{entries.length}</strong>
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        {entries.map((it) => (
          <article key={it.id} style={{ background: "white", padding: 14, borderRadius: 12 }}>
            <div style={{ fontSize: 12, color: "#555" }}>{formatDate(it.published_at)}</div>
            <h2 style={{ fontSize: 16 }}>
              <a href={it.canonical_url} target="_blank" rel="noreferrer">
                {it.title}
              </a>
            </h2>
            <div style={{ fontSize: 13 }}>
              Source : <strong>{it.source_name}</strong>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
