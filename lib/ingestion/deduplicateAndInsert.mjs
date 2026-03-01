import { withTransaction } from "./db.mjs";

function chunkArray(items, chunkSize) {
  const chunks = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

export async function deduplicateAndInsert(entries) {
  if (!entries.length) return { insertedCount: 0, updatedCount: 0 };

  let insertedCount = 0;
  let updatedCount = 0;

  await withTransaction(async (client) => {
    const chunks = chunkArray(entries, 200);

    for (const chunk of chunks) {
      const values = [];
      const placeholders = chunk
        .map((entry, index) => {
          const offset = index * 9;
          values.push(
            entry.source_id,
            entry.title,
            entry.summary,
            entry.content,
            entry.canonical_url,
            entry.guid,
            entry.published_at,
            entry.fetched_at,
            entry.content_hash
          );

          return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9})`;
        })
        .join(", ");

      const inserted = await client.query(
        `INSERT INTO entries (
          source_id,
          title,
          summary,
          content,
          canonical_url,
          guid,
          published_at,
          fetched_at,
          content_hash
        ) VALUES ${placeholders}
        ON CONFLICT DO NOTHING
        RETURNING id`,
        values
      );

      insertedCount += inserted.rowCount;

      const refreshed = await client.query(
        `UPDATE entries AS e
         SET title = v.title,
             summary = v.summary,
             content = v.content,
             updated_at = NOW(),
             fetched_at = v.fetched_at
         FROM (VALUES ${placeholders}) AS v(source_id, title, summary, content, canonical_url, guid, published_at, fetched_at, content_hash)
         WHERE (
           (e.canonical_url IS NOT NULL AND e.canonical_url = v.canonical_url)
           OR (e.guid IS NOT NULL AND e.guid = v.guid)
           OR e.content_hash = v.content_hash
         )
           AND e.updated_at < NOW() - INTERVAL '1 minute'`,
        values
      );

      updatedCount += refreshed.rowCount;
    }
  });

  return { insertedCount, updatedCount };
}
