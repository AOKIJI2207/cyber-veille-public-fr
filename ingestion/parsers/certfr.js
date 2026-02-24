const { normalizeText } = require("../lib/text");

function parseCertfrPage(html = "") {
  const text = html.replace(/\s+/g, " ");

  const idMatch = text.match(/CERTFR-\d{4}-(ALE|AVI)-\d+/i);
  const certfrId = idMatch ? idMatch[0].toUpperCase() : null;

  const cves = Array.from(new Set((text.match(/CVE-\d{4}-\d+/gi) || []).map((x) => x.toUpperCase())));

  const statusMatch = text.match(/(cl[oô]tur[ée]e?|en cours)/i);
  const status = statusMatch ? normalizeText(statusMatch[1]).replace(" ", "_") : null;

  const severityMatch = text.match(/(critique|haute|moyenne|faible)/i);
  const severity = severityMatch ? severityMatch[1].toLowerCase() : null;

  const docLinks = Array.from(text.matchAll(/href=["']([^"']+)["'][^>]*>\s*Documentation/gi)).map((m) => m[1]);

  const productsSection = text.match(/Produits? concern[ée]s?[:\s]*([^<]+)/i);
  const vendorsSection = text.match(/[ÉE]diteurs? concern[ée]s?[:\s]*([^<]+)/i);

  const products = productsSection ? productsSection[1].split(/[,;]+/).map((x) => x.trim()).filter(Boolean) : [];
  const vendors = vendorsSection ? vendorsSection[1].split(/[,;]+/).map((x) => x.trim()).filter(Boolean) : [];

  return {
    certfrId,
    cveList: cves,
    status,
    severity,
    documentationLinks: docLinks,
    products,
    vendors
  };
}

module.exports = { parseCertfrPage };
