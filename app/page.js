import Parser from "rss-parser";
import sources from "../sources.json";
import ArticlesFeedClient from "./components/ArticlesFeedClient";

export const dynamic = "force-dynamic";

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

const THREAT_TYPES = [
  "Ransomware",
  "Exploitation de vulnérabilité",
  "Phishing / ingénierie sociale",
  "DDoS",
  "Espionnage / APT",
  "Supply chain",
  "Autre"
];

const PUBLIC_RULES = [
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
      /\b(universite|universitaire|crous|academie|academies|lycee|lycees|college|education nationale|enseignement superieur|laboratoire public|cnrs|inrae|inserm)\b/g
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

const THREAT_RULES = [
  {
    threatType: "Ransomware",
    patterns: [/\b(ransomware|rancongiciel|extorsion)\b/g]
  },
  {
    threatType: "Exploitation de vulnérabilité",
    patterns: [/\b(cve-\d{4}-\d+|zero day|0day|exploit|vulnerabilite)\b/g]
  },
  {
    threatType: "Phishing / ingénierie sociale",
    patterns: [/\b(phishing|hameconnage|spear phishing|smishing|vishing|ingenierie sociale)\b/g]
  },
  {
    threatType: "DDoS",
    patterns: [/\b(ddos|deni de service|attaque par saturation)\b/g]
  },
  {
    threatType: "Espionnage / APT",
    patterns: [/\b(apt\d*|espionnage|cyberespionnage|state-sponsored|groupe avance persistant)\b/g]
  },
  {
    threatType: "Supply chain",
    patterns: [/\b(supply chain|chaine d approvisionnement|attaque fournisseur|compromission fournisseur|dependance logicielle)\b/g]
  }
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

function scoreByRules(text, rules, fallbackKey, fallbackValue) {
  let best = 0;
  let current = fallbackValue;

  for (const rule of rules) {
    let score = 0;
    for (const pattern of rule.patterns) {
      const matches = text.match(pattern);
      if (matches) score += matches.length;
    }

    if (score > best) {
      best = score;
      current = rule[fallbackKey];
    }
  }

  return current;
}

function classifyPublicSubsector(title = "", description = "") {
  const text = normalizeText(`${title} ${description}`);
  if (!text) return "Public (transverse)";
  return scoreByRules(text, PUBLIC_RULES, "sector", "Public (transverse)");
}

function classifyThreatType(title = "") {
  const text = normalizeText(title);
  if (!text) return "Autre";
  return scoreByRules(text, THREAT_RULES, "threatType", "Autre");
}

function toISODate(item) {
  const raw = item.isoDate || item.pubDate || item.published || item.updated;
  const d = raw ? new Date(raw) : new Date();
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function extractDescription(item) {
  return item.contentSnippet || item.summary || item.content || "";
}

export default async function Page() {
  const results = await Promise.allSettled(
    sources.map(async (source) => {
      const feed = await parser.parseURL(source.url);

      return (feed.items || []).slice(0, 30).map((item) => {
        const title = item.title || "";
        const description = extractDescription(item);
        const publicSubsector = classifyPublicSubsector(title, description);

        return {
          source: source.name,
          sourceUrl: source.url,
          subcategory: source.subcategory,
          title,
          description,
          link: item.link || "",
          date: toISODate(item),
          publicSubsector,
          publicSector: publicSubsector,
          threatType: classifyThreatType(title)
        };
      }).filter((x) => x.title && x.link);
    })
  );

  const all = [];
  for (const result of results) {
    if (result.status === "fulfilled") all.push(...result.value);
  }

  const deduped = [];
  const seen = new Set();
  for (const article of all.sort((a, b) => (a.date < b.date ? 1 : -1))) {
    if (seen.has(article.link)) continue;
    seen.add(article.link);
    deduped.push(article);
  }

  return (
    <main style={{ fontFamily: "system-ui, Arial", margin: 24, maxWidth: 1100 }}>
      <h1>Veille cyber – Service public français</h1>
      <p>Articles récupérés : <strong>{deduped.length}</strong></p>
      <ArticlesFeedClient
        articles={deduped}
        subsectors={PUBLIC_SUBSECTORS}
        threatTypes={THREAT_TYPES}
      />
    </main>
  );
}
