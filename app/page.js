import entriesData from "../data/entries.json";
import ArticlesFeedClient from "./components/ArticlesFeedClient";

export const dynamic = "force-static";

function normalizeUiEntry(entry) {
  return {
    id: entry.id,
    source: entry.source,
    subcategory: entry.type,
    title: entry.title,
    description: entry.summary,
    link: entry.url,
    date: entry.published_at,
    publicSubsector: (entry.entities?.secteurs?.[0] || "Public (transverse)").replaceAll("_", " "),
    publicSector: (entry.entities?.secteurs?.[0] || "Public (transverse)").replaceAll("_", " "),
    threatType: entry.tags?.find((t) => t.tagType === "menace")?.tag || "Autre",
    confidenceScore: entry.confidence_score,
    severity: entry.severity,
    tags: entry.tags || [],
    relevance_public_sector: entry.relevance_public_sector || 0
  };
}

export default function FluxPage() {
  const rawEntries = Array.isArray(entriesData.entries) ? entriesData.entries : [];
  const articles = rawEntries.map(normalizeUiEntry);

  const subsectors = Array.from(new Set(articles.map((a) => a.publicSubsector))).sort();
  const threatTypes = Array.from(new Set(articles.map((a) => a.threatType))).sort();

  return (
    <main style={{ fontFamily: "system-ui, Arial", margin: 24, maxWidth: 1200 }}>
      <h1>Flux de veille cyber – secteur public FR</h1>
      <p>
        Entrées: <strong>{articles.length}</strong> · Généré: {entriesData.generatedAt || "N/A"}
      </p>
      <ArticlesFeedClient articles={articles} subsectors={subsectors} threatTypes={threatTypes} />
    </main>
  );
}
