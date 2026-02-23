import Parser from "rss-parser";
import sources from "../../../sources.json";

const parser = new Parser({
  timeout: 15000
});

function toISODate(item) {
  const raw = item.isoDate || item.pubDate || item.published || item.updated;
  const d = raw ? new Date(raw) : new Date();
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function classifyPublicSubsector(title = "") {
  const t = title.toLowerCase();
  if (/(mairie|commune|communauté|métropole|département|région|collectivité|intercommunal)/.test(t)) return "Collectivités";
  if (/(hôpital|chu|chru|ars|santé|clinique)/.test(t)) return "Santé publique";
  if (/(universit|crous|lycée|académie|ministère de l'éducation|éducation|recherche)/.test(t)) return "Éducation & recherche";
  if (/(préfecture|intérieur|gendarmerie|police|justice|tribunal)/.test(t)) return "Intérieur / Justice";
  if (/(ministère|gouvernement|direction|agence|opérateur)/.test(t)) return "Administration / opérateurs";
  return "Public (transverse)";
}

export async function GET() {
  const all = [];

  // Fetch en parallèle (limité simple)
  const results = await Promise.allSettled(
    sources.map(async (s) => {
      const feed = await parser.parseURL(s.url);
      const items = (feed.items || []).slice(0, 30).map((it) => ({
        source: s.name,
        sourceUrl: s.url,
        subcategory: s.subcategory,
        publicSubsector: classifyPublicSubsector(it.title || ""),
        title: it.title || "",
        link: it.link || "",
        date: toISODate(it)
      }));
      return items.filter(x => x.title && x.link);
    })
  );

  for (const r of results) {
    if (r.status === "fulfilled") all.push(...r.value);
  }

  // Dédoublonnage par lien
  const seen = new Set();
  const deduped = [];
  for (const it of all.sort((a, b) => (a.date < b.date ? 1 : -1))) {
    if (seen.has(it.link)) continue;
    seen.add(it.link);
    deduped.push(it);
  }

  return Response.json({
    generatedAt: new Date().toISOString(),
    count: deduped.length,
    items: deduped.slice(0, 250)
  });
}
