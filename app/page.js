import Parser from "rss-parser";
import sources from "../sources.json";

export const dynamic = "force-dynamic";

const parser = new Parser({ timeout: 15000 });

function toISODate(item) {
  const raw = item.isoDate || item.pubDate;
  const d = raw ? new Date(raw) : new Date();
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export default async function Page() {
  const results = await Promise.allSettled(
    sources.map(async (s) => {
      const feed = await parser.parseURL(s.url);
      return (feed.items || []).slice(0, 20).map((it) => ({
        source: s.name,
        subcategory: s.subcategory,
        title: it.title || "",
        link: it.link || "",
        date: toISODate(it)
      })).filter(x => x.title && x.link);
    })
  );

  const all = [];
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

  return (
    <main style={{ fontFamily: "system-ui, Arial", margin: 24, maxWidth: 1000 }}>
      <h1>Veille cyber – Service public français</h1>
      <p>Articles récupérés : <strong>{deduped.length}</strong></p>

      <div style={{ display: "grid", gap: 12 }}>
        {deduped.slice(0, 100).map((it) => (
          <article key={it.link} style={{ background: "white", padding: 14, borderRadius: 12 }}>
            <div style={{ fontSize: 12, color: "#555" }}>
              {it.subcategory} · {it.date}
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
