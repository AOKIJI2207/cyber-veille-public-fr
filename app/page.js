import ArticlesFeedClient from "./components/ArticlesFeedClient";
import { fetchSectorArticles } from "../lib/articles";

export const dynamic = "force-dynamic";

export default async function Page() {
  const articles = await fetchSectorArticles(20);

  return (
    <main style={{ fontFamily: "system-ui, Arial", margin: 24, maxWidth: 1000 }}>
      <h1>Veille cyber – Service public français</h1>
      <p>Articles récupérés : <strong>{articles.length}</strong></p>
      <ArticlesFeedClient articles={articles} />
    </main>
  );
}
