import Link from "next/link";
import entriesData from "../../data/entries.json";

export const dynamic = "force-static";

export default function MunicipalesPage() {
  const entries = (entriesData.entries || []).filter((e) => {
    const tags = (e.tags || []).map((t) => t.tag);
    return tags.includes("municipales") || tags.includes("desinformation_electorale") || e.type === "GUIDE";
  });

  return (
    <main style={{ fontFamily: "system-ui, Arial", margin: 24, maxWidth: 1000 }}>
      <h1>Municipales 2026 / Contexte électoral</h1>
      <p>Guides, alertes et signaux liés aux collectivités et à l’intégrité informationnelle.</p>
      <ul>
        {entries.map((entry) => (
          <li key={entry.id} style={{ marginBottom: 12 }}>
            <Link href={`/entries/${entry.id}`}>{entry.title}</Link>
            <div style={{ fontSize: 12, color: "#555" }}>{entry.source} · {entry.published_at}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
