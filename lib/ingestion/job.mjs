import { fetchSources } from "./fetchSources.mjs";
import { parseAndNormalize } from "./parseAndNormalize.mjs";
import { deduplicateAndInsert } from "./deduplicateAndInsert.mjs";

export async function runIngestionJob() {
  const startedAt = Date.now();
  const fetched = await fetchSources();

  const normalizedEntries = [];
  let skippedNotModified = 0;
  let failedSources = 0;
  const sourceErrors = [];

  for (const result of fetched.results) {
    if (result.skipped || result.status === 304) {
      if (result.status === 304) skippedNotModified += 1;
      continue;
    }

    if (result.failed) {
      failedSources += 1;
      sourceErrors.push({ source: result.source.name, error: result.error });
      continue;
    }

    try {
      const entries = await parseAndNormalize(result.source, result.payload);
      normalizedEntries.push(...entries);
    } catch (error) {
      failedSources += 1;
      sourceErrors.push({ source: result.source.name, error: error.message });
    }
  }

  const writeResult = await deduplicateAndInsert(normalizedEntries);

  const durationMs = Date.now() - startedAt;
  const metrics = {
    avg_fetch_duration: fetched.totalSources ? Math.round(fetched.durationMs / fetched.totalSources) : 0,
    new_entries_count: writeResult.insertedCount,
    failed_sources_count: failedSources,
    skipped_not_modified_count: skippedNotModified
  };

  const logPayload = {
    checkedSources: fetched.totalSources,
    normalizedEntries: normalizedEntries.length,
    newEntries: writeResult.insertedCount,
    updatedEntries: writeResult.updatedCount,
    durationMs,
    metrics,
    sourceErrors
  };

  console.info("[ingestion-job]", JSON.stringify(logPayload));

  return logPayload;
}
