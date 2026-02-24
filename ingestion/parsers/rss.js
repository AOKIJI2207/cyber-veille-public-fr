const Parser = require("rss-parser");
const parser = new Parser({ timeout: 15000 });

async function parseFeed(url) {
  const feed = await parser.parseURL(url);
  return feed.items || [];
}

async function parseFeedXml(xml) {
  const feed = await parser.parseString(xml);
  return feed.items || [];
}

module.exports = { parseFeed, parseFeedXml };
