const fs = require("node:fs/promises");
const path = require("node:path");
const Parser = require("rss-parser");
const sources = require("./sources.json");

const parser = new Parser({ timeout: 15000 });

const PUBLIC_SUBSECTORS = [
  "Collectivités territoriales",
  "Santé publique",
  "Éducation & recherche",
  "Intérieur & Justice",
  "Administration centrale & ministères",
  "Opérateurs publics & infrastructures critiques",
  "Public (transverse)"
];

const publicRules = [
  {
    sector: "Collectivités territoriales",
    patterns: [
      /\b(mairie|mairies|commune|communes|collectivit(?:e|es)?|intercommunalit(?:e|es)?|metropole|metropoles|departement|departements|region|regions|agglomeration)\b/g
    ]
  },
  {
    sector: "Santé publique",
    patterns: [
      /\b(sante|hopital|hopitaux|chu|chru|ars|ehpad|etablissement de sante|centre hospitalier)\b/g
    ]
  },
  {
    sector: "Éducation & recherche",
    patterns: [
      /\b(universite|universitaire|crous|academie|academies|lycee|lycees|college|education|enseignement superieur|laboratoire public|cnrs|inrae|inserm)\b/g
    ]
  },
  {
    sector: "Intérieur & Justice",
    patterns: [
      /\b(prefecture|prefectures|interieur|police|gendarmerie|tribunal|tribunaux|justice|procureur|cour d appel)\b/g
    ]
  },
  {
    sector: "Administration centrale & ministères",
    patterns: [
      /\b(ministere|ministeres|gouvernement|administration centrale|direction generale|service de l etat|agence nationale)\b/g
    ]
  },
  {
    sector: "Opérateurs publics & infrastructures critiques",
    patterns: [
      /\b(operateur public|operateurs publics|transport public|ratp|sncf|eau potable|assainissement|energie publique|reseau electrique|infrastructure critique|oiv)\b/g
    ]
  }
];

const threatRules = [
  { type: "Ransomware", patterns: [/\b(ransomware|rancongiciel|double extorsion)\b/g] },
  { type: "Phishing", patterns: [/\b(phishing|hameconnage|spear phishing|smishing|vishing)\b/g] },
  { type: "DDoS", patterns: [/\b(ddos|deni de service|attaque par saturation)\b/g] },
  { type: "Exploitation de vulnérabilité", patterns: [/\b(cve-\d{4}-\d+|vulnerabilite|0day|zero day|exploit)\b/g] },
  { type: "Fuite de données", patterns: [/\b(fuite de donnees|exfiltration|vol de donnees|data leak|breach)\b/g] },
  { type: "Compromission", patterns: [/\b(compromission|intrusion|acces non autorise|malware|cheval de troie|backdoor)\b/g] }
];

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/[’']/g, " ")
    .replace(/[^a-zA-Z0-9\s:/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function scoreByRules(text, rules, fallback) {
  let winner = fallback;
  let best = 0;

  for (const rule of rules) {
    let score = 0;
    for (const pattern of rule.patterns) {
      const matches = text.match(pattern);
      if (matches) score += matches.length;
    }

    if (score > best) {
      best = score;
      winner = rule.sector || rule.type;
    }
  }

  return winner;
}

function classifyPublicSubsector(title = "", description = "") {
  const text = normalizeText(`${title} ${description}`);
  if (!text) return "Public (transverse)";
  return scoreByRules(text, publicRules, "Public (transverse)");
}

function classifyThreatType(title = "", description = "") {
  const text = normalizeText(`${title} ${description}`);
  if (!text) return "Autre menace";
  return scoreByRules(text, threatRules, "Autre menace");
}

function toISODate(item) {
  const raw = item.isoDate || item.pubDate || item.published || item.updated;
  const d = raw ? new Date(raw) : new Date();
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function extractDescription(item) {
  return item.contentSnippet || item.summary || item.content || "";
}

async function generate() {
  const settled = await Promise.allSettled(
    sources.map(async (source) => {
      const feed = await parser.parseURL(source.url);
      return (feed.items || []).slice(0, 40).map((item) => {
        const description = extractDescription(item);
        const publicSubsector = classifyPublicSubsector(item.title || "", description);
        const threatType = classifyThreatType(item.title || "", description);

        return {
          source: source.name,
          sourceUrl: source.url,
          subcategory: source.subcategory,
          title: item.title || "",
          link: item.link || "",
          description,
          date: toISODate(item),
          threatType,
          publicSubsector,
          publicSector: publicSubsector
        };
      }).filter((x) => x.title && x.link);
    })
  );

  const all = [];
  for (const result of settled) {
    if (result.status === "fulfilled") {
      all.push(...result.value);
    }
  }

  const seen = new Set();
  const items = [];

  for (const article of all.sort((a, b) => (a.date < b.date ? 1 : -1))) {
    if (seen.has(article.link)) continue;
    seen.add(article.link);
    items.push(article);
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    count: items.length,
    sectors: PUBLIC_SUBSECTORS,
    items
  };

  const output = path.join(process.cwd(), "data", "articles.json");
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(`Generated ${items.length} articles in data/articles.json`);
}

generate().catch((error) => {
  console.error("Failed to generate articles JSON:", error);
  process.exit(1);
});
