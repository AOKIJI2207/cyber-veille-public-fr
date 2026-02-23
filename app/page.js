import ArticlesFeedClient from "./components/ArticlesFeedClient";
import articlesData from "../data/articles.json";

export const dynamic = "force-static";

export default function Page() {
  const articles = Array.isArray(articlesData.items) ? articlesData.items : [];

  return (
    <main style={{ fontFamily: "system-ui, Arial", margin: 24, maxWidth: 1000 }}>
      <h1>Veille cyber – Service public français</h1>
      <p>
        Articles récupérés : <strong>{articles.length}</strong>
        {" "}
        <span style={{ color: "#64748b", fontSize: 13 }}>
          (cache généré le {articlesData.generatedAt || "N/A"})
        </span>
      </p>
      <ArticlesFeedClient articles={articles} />
    </main>
  );
}
