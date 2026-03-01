import { query } from "./db.mjs";

const USER_AGENT = "CyberVeilleBot/1.0 (+https://example.org/bot)";
const FETCH_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createLimiter(limit) {
  let activeCount = 0;
  const queue = [];

  const next = () => {
    activeCount -= 1;
    if (queue.length > 0) {
      queue.shift()();
    }
  };

  return async (task) => {
    if (activeCount >= limit) {
      await new Promise((resolve) => queue.push(resolve));
    }

    activeCount += 1;
    try {
      return await task();
    } finally {
      next();
    }
  };
}

async function isRobotsAllowed(sourceUrl) {
  try {
    const parsed = new URL(sourceUrl);
    const robotsUrl = `${parsed.origin}/robots.txt`;
    const response = await fetch(robotsUrl, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(5_000)
    });

    if (!response.ok) return true;

    const body = await response.text();
    const lines = body.split(/\r?\n/);
    let userAgentMatched = false;

    for (const line of lines) {
      const clean = line.trim();
      if (!clean || clean.startsWith("#")) continue;
      const [directive, valueRaw] = clean.split(":", 2);
      if (!directive || !valueRaw) continue;

      const value = valueRaw.trim();
      if (/^User-agent$/i.test(directive)) {
        userAgentMatched = value === "*" || value.toLowerCase().includes("cyberveillebot");
      }

      if (userAgentMatched && /^Disallow$/i.test(directive) && value === "/") {
        return false;
      }
    }

    return true;
  } catch {
    return true;
  }
}

async function fetchWithRetry(source) {
  const headers = { "User-Agent": USER_AGENT };
  if (source.etag) headers["If-None-Match"] = source.etag;
  if (source.last_modified) headers["If-Modified-Since"] = source.last_modified;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(source.url, {
        headers,
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
      });

      if (response.status === 304) {
        return { sourceId: source.id, status: 304 };
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return {
        sourceId: source.id,
        status: response.status,
        payload: await response.text(),
        etag: response.headers.get("etag"),
        lastModified: response.headers.get("last-modified")
      };
    } catch (error) {
      if (attempt >= MAX_RETRIES) {
        throw error;
      }
      await delay(200 * 2 ** attempt);
    }
  }

  throw new Error("Unreachable retry state");
}

export async function fetchSources() {
  const { rows: sources } = await query(
    `SELECT id, name, url, type, etag, last_modified
     FROM sources
     WHERE is_active = TRUE
       AND (last_checked_at IS NULL OR last_checked_at <= NOW() - INTERVAL '5 minutes')
     ORDER BY id ASC`
  );

  const limiter = createLimiter(Number(process.env.INGEST_CONCURRENCY ?? 8));
  const startedAt = Date.now();

  const results = await Promise.all(
    sources.map((source) =>
      limiter(async () => {
        const robotsAllowed = await isRobotsAllowed(source.url);
        if (!robotsAllowed) {
          await query(
            `UPDATE sources
             SET robots_allowed = FALSE, last_checked_at = NOW(), updated_at = NOW()
             WHERE id = $1`,
            [source.id]
          );
          return { source, skipped: true, reason: "robots_disallow" };
        }

        try {
          const fetched = await fetchWithRetry(source);
          await query(
            `UPDATE sources
             SET robots_allowed = TRUE,
                 etag = COALESCE($2, etag),
                 last_modified = COALESCE($3, last_modified),
                 last_checked_at = NOW(),
                 updated_at = NOW()
             WHERE id = $1`,
            [source.id, fetched.etag ?? null, fetched.lastModified ?? null]
          );

          return { source, ...fetched };
        } catch (error) {
          await query(
            `UPDATE sources
             SET last_checked_at = NOW(), updated_at = NOW()
             WHERE id = $1`,
            [source.id]
          );

          return { source, failed: true, error: error.message };
        }
      })
    )
  );

  return {
    startedAt,
    durationMs: Date.now() - startedAt,
    totalSources: sources.length,
    results
  };
}
