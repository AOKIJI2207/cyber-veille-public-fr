const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const { parseFeed } = require("./parsers/rss");
const { parseCertfrPage } = require("./parsers/certfr");
const { normalizeText, hashContent, toDate } = require("./lib/text");
const { collectTags, computeRelevancePublicSector } = require("./lib/tagging");
const { computeConfidenceScore } = require("./lib/confidence");
const { upsertEntry } = require("./lib/db");
const SOURCES = require("./connectors/sources");

const THREAT_RULES = [
  { type: "ransomware", pattern: /\b(ransomware|rancongiciel|extorsion)\b/g },
  { type: "ddos", pattern: /\b(ddos|deni de service)\b/g },
  { type: "phishing", pattern: /\b(phishing|hameconnage|ingenierie sociale)\b/g },
  { type: "fuite de donnees", pattern: /\b(fuite de donnees|exfiltration|breach)\b/g },
  { type: "compromission", pattern: /\b(compromission|intrusion|malware)\b/g },
  { type: "ingerence/desinformation", pattern: /\b(desinformation|deepfake|ingerence)\b/g }
];

function inferAttackSurface(text) {
  const t = normalizeText(text);
  const surfaces = [];
  if (/\b(vpn|ssl vpn)\b/.test(t)) surfaces.push("VPN");
  if (/\b(email|messagerie|smtp|microsoft 365|o365)\b/.test(t)) surfaces.push("email");
  if (/\b(web|cms|site web|http|apache|nginx)\b/.test(t)) surfaces.push("web");
  if (/\b(active directory|ad|ldap)\b/.test(t)) surfaces.push("AD");
  return Array.from(new Set(surfaces));
}

function inferThreatTags(text) {
  const t = normalizeText(text);
  const tags = [];
  for (const rule of THREAT_RULES) {
    if (rule.pattern.test(t)) tags.push(rule.type);
  }
  return tags;
}

async function fetchWithRetry(url, options = {}, retries = 2) {
  let lastError;
  for (let i = 0; i <= retries; i += 1) {
    try {
      const response = await fetch(url, { ...options, redirect: "follow" });
      if (!response.ok) throw new Error(`HTTP ${response.status} on ${url}`);
      return response;
    } catch (error) {
      lastError = error;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw lastError;
}

async function ingestPdfWatcher(source) {
  const outputDir = path.join(process.cwd(), "data");
  await fs.mkdir(outputDir, { recursive: true });

  const statePath = path.join(outputDir, "watchers.json");
  let state = {};
  try {
    state = JSON.parse(await fs.readFile(statePath, "utf8"));
  } catch {
    state = {};
  }

  const head = await fetchWithRetry(source.url, { method: "HEAD" });
  const etag = head.headers.get("etag") || null;
  const lastModified = head.headers.get("last-modified") || null;

  const body = await fetchWithRetry(source.url);
  const buffer = Buffer.from(await body.arrayBuffer());
  const hash = crypto.createHash("sha256").update(buffer).digest("hex");

  const previous = state[source.id] || {};
  const changed = previous.hash !== hash || previous.etag !== etag || previous.lastModified !== lastModified;

  state[source.id] = { hash, etag, lastModified, checkedAt: new Date().toISOString() };
  await fs.writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");

  if (!changed) return [];

  return [{
    id: crypto.randomUUID(),
    source: source.name,
    type: source.type,
    title: source.staticMeta.title,
    summary: source.staticMeta.summary,
    published_at: toDate(lastModified),
    fetched_at: new Date().toISOString(),
    url: source.url,
    canonical_url: source.url,
    identifiers: { certfr_id: null, cve_list: [] },
    entities: { vendors: [], products: [], secteurs: ["collectivités", "service public"], territoire: "France" },
    status: "active",
    severity: null,
    content_hash: hash,
    confidence_score: computeConfidenceScore(source.name, source.type),
    raw: { etag, lastModified, size: buffer.length },
    attack_surface: [],
    tags: [
      { tagType: "elections", tag: "municipales" },
      { tagType: "menace", tag: "ingerence/desinformation" }
    ],
    relevance_public_sector: 1
  }];
}

async function ingestRssSource(source) {
  const items = await parseFeed(source.url);

  const out = [];
  for (const item of items.slice(0, 40)) {
    const title = item.title || "";
    const summary = item.contentSnippet || item.summary || item.content || "";
    const url = item.link || source.url;
    const canonical = url.split("?")[0];

    const baseTags = collectTags(title, summary);
    const threatTags = inferThreatTags(`${title} ${summary}`).map((tag) => ({ tagType: "menace", tag }));
    const tags = [...baseTags, ...threatTags];

    let certDetails = { certfrId: null, cveList: [], status: null, severity: null, documentationLinks: [], products: [], vendors: [] };

    if (source.name.toLowerCase().includes("cert-fr") && url.includes("cert.ssi.gouv.fr")) {
      try {
        const html = await (await fetchWithRetry(url)).text();
        certDetails = parseCertfrPage(html);
      } catch (error) {
        console.warn(JSON.stringify({ level: "warn", msg: "CERT page parse failed", url, error: error.message }));
      }
    }

    const normalized = {
      id: crypto.randomUUID(),
      source: source.name,
      type: source.type,
      title,
      summary,
      published_at: toDate(item.isoDate || item.pubDate || item.published || item.updated),
      fetched_at: new Date().toISOString(),
      url,
      canonical_url: canonical,
      identifiers: {
        certfr_id: certDetails.certfrId,
        cve_list: certDetails.cveList || []
      },
      entities: {
        vendors: certDetails.vendors || [],
        products: certDetails.products || [],
        secteurs: tags.filter((t) => t.tagType === "cible").map((t) => t.tag),
        territoire: "France"
      },
      status: certDetails.status || "active",
      severity: certDetails.severity,
      confidence_score: computeConfidenceScore(source.name, source.type),
      content_hash: hashContent(`${title}|${summary}|${canonical}|${JSON.stringify(certDetails.cveList || [])}`),
      raw: item,
      attack_surface: inferAttackSurface(`${title} ${summary}`),
      tags,
      relevance_public_sector: computeRelevancePublicSector(tags)
    };

    out.push(normalized);
  }

  return out;
}

function dedupeEntries(entries) {
  const seen = new Set();
  const deduped = [];

  for (const e of entries.sort((a, b) => (a.published_at < b.published_at ? 1 : -1))) {
    const key = `${e.canonical_url}|${e.source}|${e.identifiers.certfr_id || ""}|${e.content_hash}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(e);
  }

  return deduped;
}

async function runAlerting(entries) {
  const webhook = process.env.ALERT_WEBHOOK_URL;
  if (!webhook) return;

  const outputDir = path.join(process.cwd(), "data");
  const statePath = path.join(outputDir, "alerts-state.json");
  let sent = {};

  try {
    sent = JSON.parse(await fs.readFile(statePath, "utf8"));
  } catch {
    sent = {};
  }

  const shouldAlert = entries.filter((e) => {
    const tags = e.tags.map((t) => t.tag);
    return tags.includes("municipales") || tags.includes("mairie") || (e.severity === "critique");
  });

  const fresh = shouldAlert.filter((e) => !sent[e.content_hash]);
  if (!fresh.length) return;

  const payload = {
    text: `Cyber veille: ${fresh.length} nouvelle(s) alerte(s)`,
    items: fresh.slice(0, 20).map((e) => ({ title: e.title, url: e.url, severity: e.severity, tags: e.tags }))
  };

  try {
    await fetchWithRetry(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    }, 1);

    for (const e of fresh) sent[e.content_hash] = new Date().toISOString();
    await fs.writeFile(statePath, `${JSON.stringify(sent, null, 2)}\n`, "utf8");
  } catch (error) {
    console.error(JSON.stringify({ level: "error", msg: "alert webhook failed", error: error.message }));
  }
}

async function runIngestion() {
  const logs = [];
  const collected = [];

  for (const source of SOURCES) {
    const start = Date.now();
    try {
      let entries = [];
      if (source.mode === "rss") entries = await ingestRssSource(source);
      if (source.mode === "pdf-watcher") entries = await ingestPdfWatcher(source);

      collected.push(...entries);
      logs.push({ source: source.id, status: "ok", count: entries.length, elapsedMs: Date.now() - start });
    } catch (error) {
      logs.push({ source: source.id, status: "error", error: error.message, elapsedMs: Date.now() - start });
    }
  }

  const deduped = dedupeEntries(collected);

  for (const entry of deduped) {
    await upsertEntry(entry);
  }

  const out = {
    generatedAt: new Date().toISOString(),
    metrics: {
      ingested_total: collected.length,
      deduped_total: deduped.length,
      errors: logs.filter((x) => x.status === "error").length
    },
    entries: deduped,
    logs
  };

  await fs.mkdir(path.join(process.cwd(), "data"), { recursive: true });
  await fs.writeFile(path.join(process.cwd(), "data", "entries.json"), `${JSON.stringify(out, null, 2)}\n`, "utf8");

  await runAlerting(deduped);

  return out;
}

module.exports = { runIngestion, dedupeEntries, ingestRssSource };
