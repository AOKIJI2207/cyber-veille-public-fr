import { fetchSectorArticles } from "../../../lib/articles";

export async function GET() {
  const items = await fetchSectorArticles(30);

  return Response.json({
    generatedAt: new Date().toISOString(),
    count: items.length,
    items: items.slice(0, 250)
  });
}
