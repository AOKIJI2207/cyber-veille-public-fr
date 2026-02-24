const { normalizeText } = require("./text");

const TAG_RULES = {
  menace: {
    ransomware: /\b(ransomware|rancongiciel|extorsion)\b/g,
    ddos: /\b(ddos|deni de service|saturation)\b/g,
    phishing: /\b(phishing|hameconnage|spear phishing|ingenierie sociale|smishing|vishing)\b/g,
    "fuite de donnees": /\b(fuite de donnees|data leak|exfiltration|breach)\b/g,
    compromission: /\b(compromission|intrusion|malware|backdoor|acces non autorise)\b/g,
    "ingerence/desinformation": /\b(desinformation|ingerence|manipulation de l info|deepfake|faux site)\b/g
  },
  cible: {
    mairie: /\b(mairie|mairies)\b/g,
    commune: /\b(commune|communes)\b/g,
    intercommunalite: /\b(intercommunalite|metropole|agglomeration)\b/g,
    prefecture: /\b(prefecture|prefectures)\b/g,
    service_public: /\b(service public|administration|collectivite)\b/g,
    ccas: /\b(ccas)\b/g
  },
  elections: {
    municipales: /\b(municipales|election municipale)\b/g,
    liste_electorale: /\b(liste electorale)\b/g,
    bureau_de_vote: /\b(bureau de vote)\b/g,
    campagne: /\b(campagne electorale|campagne)\b/g,
    desinformation_electorale: /\b(desinformation electorale|ingeren[ct]e electorale|deepfake electoral)\b/g
  }
};

function collectTags(title = "", summary = "") {
  const text = normalizeText(`${title} ${summary}`);
  const tags = [];

  for (const [tagType, rules] of Object.entries(TAG_RULES)) {
    for (const [tag, pattern] of Object.entries(rules)) {
      if (pattern.test(text)) tags.push({ tagType, tag });
    }
  }

  return tags;
}

function computeRelevancePublicSector(tags) {
  if (!tags.length) return 0;

  let score = 0;
  for (const t of tags) {
    if (t.tagType === "cible") score += 0.25;
    if (t.tagType === "elections") score += 0.35;
    if (t.tagType === "menace") score += 0.15;
  }

  return Math.min(1, Number(score.toFixed(2)));
}

module.exports = { collectTags, computeRelevancePublicSector };
