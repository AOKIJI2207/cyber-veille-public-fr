async function getData() {
  // Sur Vercel, on peut appeler l'API interne en relatif
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/articles`, {
    // Evite le cache trop agressif côté build
    cache: "no-store"
  });
  return res.json();
}

export default async function Page() {
  const data = await getData();
  const items = data.items || [];

  return (
    <main style={{ fontFamily: "system-ui, Arial", margin: 24, maxWidth: 1000 }}>
      <h1 style={{ marginBottom: 6 }}>Veille cyber – Service public français</h1>
      <p style={{ color: "#444", marginTop: 0 }}>
        Dernière génération : <strong>{data.generatedAt}</strong> · Articles : <strong>{data.count}</strong>
      </p>

      <div style={{ margin: "18px 0 10px", padding: 12, background: "#fafafa", border: "1px solid #eee", borderRadius: 12 }}>
        <strong>Sous-secteurs</strong> : Collectivités · Santé publique · Éducation & recherche · Intérieur/Justice · Administration/opérateurs · Public (transverse)
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {items.slice(0, 120).map((it) => (
          <article key={it.link} style={{ background: "white", border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, color: "#555", fontSize: 12 }}>
              <span>{it.publicSubsector} · {it.subcategory}</span>
              <span>{it.date}</span>
            </div>
            <h2 style={{ fontSize: 16, margin: "10px 0 6px" }}>
              <a href={it.link} target="_blank" rel="noreferrer" style={{ color: "#111" }}>
                {it.title}
              </a>
            </h2>
            <div style={{ color: "#444", fontSize: 13 }}>
              Source : <strong>{it.source}</strong>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
