const crypto = require("node:crypto");

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/[’']/g, " ")
    .replace(/[^a-zA-Z0-9\s:/._-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function hashContent(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function toDate(value) {
  const d = value ? new Date(value) : new Date();
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

module.exports = { normalizeText, hashContent, toDate };
