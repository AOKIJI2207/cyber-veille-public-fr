import entriesData from "../../../data/entries.json";

export async function GET() {
  const items = (entriesData.entries || []).map((e) => ({
    source: e.source,
    sourceUrl: e.url,
    subcategory: e.type,
    title: e.title,
    link: e.url,
    description: e.summary,
    date: e.published_at,
    publicSector: e.entities?.secteurs?.[0] || "Public (transverse)",
    threatType: e.tags?.find((t) => t.tagType === "menace")?.tag || "Autre",
    confidenceScore: e.confidence_score,
    severity: e.severity
  }));

  return Response.json({
    generatedAt: entriesData.generatedAt || new Date().toISOString(),
    count: items.length,
    items: items.slice(0, 250)
  });
}
