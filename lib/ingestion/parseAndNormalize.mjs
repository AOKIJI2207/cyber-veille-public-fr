import Parser from "rss-parser";
import crypto from "node:crypto";

const parser = new Parser({ timeout: 10_000 });

function stripHtml(input = "") {
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeDate(rawDate) {
  const date = rawDate ? new Date(rawDate) : new Date();
  if (Number.isNaN(date.getTime())) return new Date();
  return date;
}

function makeHash({ title, publishedAt, sourceId }) {
  return crypto
    .createHash("sha256")
    .update(`${title}::${publishedAt.toISOString()}::${sourceId}`)
    .digest("hex");
}

function normalizeFeedItems(items, source) {
  return (items || [])
    .map((item) => {
      const publishedAt = normalizeDate(item.isoDate || item.pubDate || item.published || item.updated);
      const canonicalUrl = item.link?.trim() || null;
      const title = (item.title || "").trim();
      if (!title || !canonicalUrl) return null;

      return {
        source_id: source.id,
        title,
        summary: stripHtml(item.contentSnippet || item.summary || ""),
        content: item["content:encoded"] || item.content || null,
        canonical_url: canonicalUrl,
        guid: item.guid || item.id || null,
        published_at: publishedAt,
        fetched_at: new Date(),
        content_hash: makeHash({ title, publishedAt, sourceId: source.id })
      };
    })
    .filter(Boolean);
}

function parseHtmlEntries(html, source) {
  const articleRegex = /<article\b[\s\S]*?<\/article>/gi;
  const anchorRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i;
  const dateRegex = /datetime=["']([^"']+)["']/i;

  const articles = html.match(articleRegex) || [];
  return articles
    .map((article) => {
      const linkMatch = article.match(anchorRegex);
      if (!linkMatch) return null;

      const publishedAt = normalizeDate(article.match(dateRegex)?.[1]);
      const title = stripHtml(linkMatch[2] || "");
      if (!title) return null;

      const canonicalUrl = new URL(linkMatch[1], source.url).toString();
      return {
        source_id: source.id,
        title,
        summary: null,
        content: null,
        canonical_url: canonicalUrl,
        guid: null,
        published_at: publishedAt,
        fetched_at: new Date(),
        content_hash: makeHash({ title, publishedAt, sourceId: source.id })
      };
    })
    .filter(Boolean);
}

export async function parseAndNormalize(source, payload) {
  if (source.type === "html") {
    return parseHtmlEntries(payload, source);
  }

  const feed = await parser.parseString(payload);
  return normalizeFeedItems(feed.items, source);
}
