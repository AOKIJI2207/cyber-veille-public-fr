import entriesData from "../../../data/entries.json";

export const dynamic = "force-static";

export default function EntryDetailPage({ params }) {
  const entry = (entriesData.entries || []).find((x) => x.id === params.id);

  if (!entry) {
    return <main style={{ margin: 24 }}>Entrée introuvable.</main>;
  }

  return (
    <main style={{ fontFamily: "system-ui, Arial", margin: 24, maxWidth: 1000 }}>
      <h1>{entry.title}</h1>
      <p style={{ color: "#475569" }}>{entry.summary}</p>
      <ul>
        <li><strong>Source:</strong> {entry.source}</li>
        <li><strong>URL:</strong> <a href={entry.url} target="_blank" rel="noreferrer">{entry.url}</a></li>
        <li><strong>Publié le:</strong> {entry.published_at}</li>
        <li><strong>Type:</strong> {entry.type}</li>
        <li><strong>Confiance:</strong> {entry.confidence_score}/100</li>
        <li><strong>Sévérité:</strong> {entry.severity || "N/A"}</li>
        <li><strong>Status:</strong> {entry.status || "N/A"}</li>
        <li><strong>CVE:</strong> {(entry.identifiers?.cve_list || []).join(", ") || "Aucune"}</li>
      </ul>
      <h3>Tags</h3>
      <ul>
        {(entry.tags || []).map((t, idx) => <li key={`${t.tag}-${idx}`}>{t.tagType}: {t.tag}</li>)}
      </ul>
    </main>
  );
}
