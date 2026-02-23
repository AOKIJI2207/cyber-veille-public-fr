export const dynamic = "force-dynamic";

async function getData() {
  const base =
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

  const res = await fetch(`${base}/api/articles`, {
    cache: "no-store"
  });

  if (!res.ok) {
    throw new Error("Erreur API");
  }

  return res.json();
}

export default async function Page() {
  const data = await getData();
  const items = data.items || [];

  return (
    <main style={{ fontFamily: "system-ui, Arial", margin: 24, maxWidth: 1000 }}>
      <h1>Veille cyber – Service public français</h1>
      <p>
        Dernière génération : <strong>{data.generatedAt}</strong> · Articles : <strong>{data.count}</strong>
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        {items.slice(0, 100).map((it) => (
          <article key={it.link} style={{ background: "white", padding: 14, borderRadius: 12 }}>
            <div style={{ fontSize: 12, color: "#555" }}>
              {it.publicSubsector} · {it.subcategory}
            </div>
            <h2 style={{ fontSize: 16 }}>
              <a href={it.link} target="_blank" rel="noreferrer">
                {it.title}
              </a>
            </h2>
            <div style={{ fontSize: 13 }}>
              Source : <strong>{it.source}</strong>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
