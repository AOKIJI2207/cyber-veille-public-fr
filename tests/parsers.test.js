const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { parseCertfrPage } = require("../ingestion/parsers/certfr");
const { parseFeedXml } = require("../ingestion/parsers/rss");

const root = process.cwd();

test("parseCertfrPage extracts CERT id / CVE / status / severity", async () => {
  const html = await fs.readFile(path.join(root, "fixtures", "certfr-alert.html"), "utf8");
  const parsed = parseCertfrPage(html);

  assert.equal(parsed.certfrId, "CERTFR-2026-ALE-001");
  assert.equal(parsed.status, "en_cours");
  assert.equal(parsed.severity, "critique");
  assert.deepEqual(parsed.cveList, ["CVE-2026-12345", "CVE-2026-99999"]);
  assert.ok(parsed.products.length >= 1);
});

test("parseFeedXml parses RSS item", async () => {
  const xml = await fs.readFile(path.join(root, "fixtures", "sample-rss.xml"), "utf8");
  const items = await parseFeedXml(xml);

  assert.equal(items.length, 1);
  assert.equal(items[0].title, "Incident ransomware dans une mairie");
  assert.equal(items[0].link, "https://example.org/item-1");
});
