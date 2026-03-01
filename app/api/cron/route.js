import { runIngestionJob } from "../../../lib/ingestion/job.mjs";

export const runtime = "nodejs";

function isAuthorized(request) {
  const secret = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET;
  if (!secret) return false;

  const authorization = request.headers.get("authorization") || "";
  return authorization === `Bearer ${secret}`;
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const result = await runIngestionJob();

  return Response.json({
    success: true,
    durationMs: Date.now() - startedAt,
    metrics: result.metrics
  });
}
