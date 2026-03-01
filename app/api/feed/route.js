import { dbQuery } from "../../../lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") || 100), 200);
  const since = searchParams.get("since");

  const params = [];
  let whereClause = "";

  if (since) {
    params.push(since);
    whereClause = `WHERE e.created_at > $${params.length}::timestamptz`;
  }

  params.push(limit);

  const { rows } = await dbQuery(
    `SELECT
      e.id,
      e.title,
      e.summary,
      e.content,
      e.canonical_url,
      e.published_at,
      e.created_at,
      s.name AS source_name
     FROM entries e
     INNER JOIN sources s ON s.id = e.source_id
     ${whereClause}
     ORDER BY e.published_at DESC
     LIMIT $${params.length}`,
    params
  );

  return Response.json({ entries: rows });
}
