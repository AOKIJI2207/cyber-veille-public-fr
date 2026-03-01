import cron from "node-cron";
import { runIngestionJob } from "../lib/ingestion/job.mjs";

let running = false;

async function executeJob() {
  if (running) {
    console.warn("[scheduler] Skip: previous job still running");
    return;
  }

  running = true;
  const started = Date.now();
  try {
    const result = await runIngestionJob();
    const durationMs = Date.now() - started;
    if (durationMs > 60_000) {
      console.warn(`[scheduler] Job exceeded 60s target (${durationMs}ms)`);
    }
    console.log(`[scheduler] Done in ${durationMs}ms with ${result.newEntries} new entries`);
  } catch (error) {
    console.error("[scheduler] Job failed", error);
  } finally {
    running = false;
  }
}

cron.schedule("*/5 * * * *", executeJob, {
  timezone: "Europe/Paris"
});

console.log("[scheduler] Started. Running every 5 minutes.");
executeJob();
