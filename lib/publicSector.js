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
      /\b(mairie|mairies|commune|communes|collectivit(?:e|és)?|intercommunalit(?:e|és)?|m[ée]tropole|m[ée]tropoles|d[ée]partement|d[ée]partements|r[ée]gion|r[ée]gions|conseil municipal|conseil d[ée]partemental|conseil r[ée]gional|agglom[ée]ration)\b/i
    ]
  },
  {
    sector: "Santé publique",
    patterns: [
      /\b(sant[ée]|h[ôo]pital|h[ôo]pitaux|chu|chru|ars|ap-?hp|ehpad|centre hospitalier|clinique publique|[ée]tablissement de sant[ée])\b/i
    ]
  },
  {
    sector: "Éducation & recherche",
    patterns: [
      /\b(universit[ée]|universitaire|crous|acad[ée]mie|acad[ée]mies|lyc[ée]e|lyc[ée]es|coll[èe]ge|education nationale|enseignement sup[ée]rieur|laboratoire public|cnrs|inrae|inserm|[ée]cole)\b/i
    ]
  },
  {
    sector: "Intérieur & Justice",
    patterns: [
      /\b(pr[ée]fecture|pr[ée]fectures|int[ée]rieur|police|gendarmerie|tribunal|tribunaux|justice|procureur|cour d'appel|magistrat)\b/i
    ]
  },
  {
    sector: "Administration centrale & ministères",
    patterns: [
      /\b(minist[èe]re|minist[èe]res|gouvernement|secr[ée]tariat g[ée]n[ée]ral|administration centrale|direction g[ée]n[ée]rale|service de l['’]etat|service de l['’][ée]tat|agence nationale)\b/i
    ]
  },
  {
    sector: "Opérateurs publics & infrastructures critiques",
    patterns: [
      /\b(op[ée]rateur public|op[ée]rateurs publics|transport public|ratp|sncf|a[ée]roport|eau potable|assainissement|[ée]nergie|r[ée]seau [ée]lectrique|infrastructure critique|oiv|collecte des d[ée]chets)\b/i
    ]
  }
];

export function classifyPublicSector(title = "", description = "") {
  const text = `${title} ${description}`.trim();

  if (!text) {
    return "Public (transverse)";
  }

  for (const rule of SECTOR_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      return rule.sector;
    }
  }

  return "Public (transverse)";
}
