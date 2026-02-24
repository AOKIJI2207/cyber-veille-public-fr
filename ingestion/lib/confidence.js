function computeConfidenceScore(sourceName = "", entryType = "ARTICLE") {
  const s = sourceName.toLowerCase();

  if (s.includes("cert-fr") || s.includes("anssi") || s.includes("sgdsn") || s.includes("viginum")) {
    return 95;
  }

  if (s.includes("cybermalveillance")) {
    return 88;
  }

  if (entryType.includes("GUIDE")) return 90;
  return 65;
}

module.exports = { computeConfidenceScore };
