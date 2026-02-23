export const PUBLIC_SECTORS = [
  "Collectivités territoriales",
  "Santé publique",
  "Éducation & recherche",
  "Intérieur & Justice",
  "Administration centrale & ministères",
  "Opérateurs publics & infrastructures critiques",
  "Public (transverse)"
];

const SECTOR_RULES = [
  {
    sector: "Collectivités territoriales",
    patterns: [
      /\b(mairie|mairies|commune|communes|collectivite|collectivites|intercommunalite|intercommunalites|metropole|metropoles|departement|departements|region|regions|conseil municipal|conseil departemental|conseil regional|agglomeration)\b/,
      /\b(ville de|hotel de ville)\b/
    ]
  },
  {
    sector: "Santé publique",
    patterns: [
      /\b(sante|hopital|hopitaux|chu|chru|ars|ap-?hp|ehpad|centre hospitalier|etablissement de sante|groupement hospitalier)\b/
    ]
  },
  {
    sector: "Éducation & recherche",
    patterns: [
      /\b(universite|universitaire|crous|academie|academies|lycee|lycees|college|education nationale|enseignement superieur|laboratoire public|cnrs|inrae|inserm|ecole)\b/
    ]
  },
  {
    sector: "Intérieur & Justice",
    patterns: [
      /\b(prefecture|prefectures|ministere de l interieur|interieur|police|gendarmerie|tribunal|tribunaux|justice|procureur|cour d appel|magistrat)\b/
    ]
  },
  {
    sector: "Administration centrale & ministères",
    patterns: [
      /\b(ministere|ministeres|gouvernement|secretariat general|administration centrale|direction generale|service de l etat|agence nationale|haut fonctionnaire)\b/
    ]
  },
  {
    sector: "Opérateurs publics & infrastructures critiques",
    patterns: [
      /\b(operateur public|operateurs publics|transport public|ratp|sncf|aeroport|eau potable|assainissement|energie publique|reseau electrique|infrastructure critique|oiv|service public industriel)\b/
    ]
  }
];

function normalizeText(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/[’']/g, " ")
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function classifyPublicSector(title = "", description = "") {
  const normalized = normalizeText(`${title} ${description}`);

  if (!normalized) {
    return "Public (transverse)";
  }

  let bestSector = "Public (transverse)";
  let bestScore = 0;

  for (const rule of SECTOR_RULES) {
    let score = 0;

    for (const pattern of rule.patterns) {
      const matches = normalized.match(new RegExp(pattern.source, "g"));
      if (matches) {
        score += matches.length;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestSector = rule.sector;
    }
  }

  return bestSector;
}
