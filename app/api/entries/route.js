import entriesData from "../../../data/entries.json";

function toCsv(rows) {
  const headers = ["id", "source", "type", "title", "published_at", "url", "confidence_score", "severity"];
  const body = rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")).join("\n");
  return `${headers.join(",")}\n${body}`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "json";
  const minConfidence = Number(searchParams.get("minConfidence") || 0);

  const entries = (entriesData.entries || []).filter((e) => (e.confidence_score || 0) >= minConfidence);

  if (format === "csv") {
    return new Response(toCsv(entries), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": "attachment; filename=entries.csv"
      }
    });
  }

  return Response.json({ count: entries.length, items: entries });
}
