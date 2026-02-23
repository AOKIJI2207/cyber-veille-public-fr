import articlesData from "../../../data/articles.json";

export async function GET() {
  const items = Array.isArray(articlesData.items) ? articlesData.items : [];

  return Response.json({
    generatedAt: articlesData.generatedAt || new Date().toISOString(),
    count: items.length,
    items: items.slice(0, 250)
  });
}
