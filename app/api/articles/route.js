import Parser from "rss-parser";
import sources from "../../../sources.json";
import { classifyPublicSector } from "../../../lib/publicSector";

const parser = new Parser({
  timeout: 15000
});

function toISODate(item) {
  const raw = item.isoDate || item.pubDate || item.published || item.updated;
  const d = raw ? new Date(raw) : new Date();
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function extractDescription(item) {
  return item.contentSnippet || item.summary || item.content || "";
}

export async function GET() {
  const all = [];

  const results = await Promise.allSettled(
    sources.map(async (s) => {
      const feed = await parser.parseURL(s.url);
      const items = (feed.items || []).slice(0, 30).map((it) => {
        const description = extractDescription(it);

        return {
          source: s.name,
          sourceUrl: s.url,
          subcategory: s.subcategory,
          title: it.title || "",
          link: it.link || "",
          description,
          date: toISODate(it),
          publicSector: classifyPublicSector(it.title || "", description)
        };
      });

      return items.filter((x) => x.title && x.link);
    })
  );

  for (const r of results) {
    if (r.status === "fulfilled") all.push(...r.value);
  }

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
