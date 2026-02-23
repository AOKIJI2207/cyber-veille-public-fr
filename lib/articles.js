import Parser from "rss-parser";
import sources from "../sources.json";
import { classifyPublicSector } from "./publicSector";

const parser = new Parser({ timeout: 15000 });

function toISODate(item) {
  const raw = item.isoDate || item.pubDate || item.published || item.updated;
  const d = raw ? new Date(raw) : new Date();
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function extractDescription(item) {
  return item.contentSnippet || item.summary || item.content || "";
}

export async function fetchSectorArticles(limitBySource = 20) {
  const results = await Promise.allSettled(
    sources.map(async (source) => {
      const feed = await parser.parseURL(source.url);
      return (feed.items || [])
        .slice(0, limitBySource)
        .map((item) => {
          const description = extractDescription(item);

          return {
            source: source.name,
            sourceUrl: source.url,
            subcategory: source.subcategory,
            title: item.title || "",
            link: item.link || "",
            description,
            date: toISODate(item),
            publicSector: classifyPublicSector(item.title || "", description)
          };
        })
        .filter((entry) => entry.title && entry.link);
    })
  );

  const all = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      all.push(...result.value);
    }
  }

  const seen = new Set();
  const deduped = [];

  for (const item of all.sort((a, b) => (a.date < b.date ? 1 : -1))) {
    if (seen.has(item.link)) {
      continue;
    }

    seen.add(item.link);
    deduped.push(item);
  }

  return deduped;
}
