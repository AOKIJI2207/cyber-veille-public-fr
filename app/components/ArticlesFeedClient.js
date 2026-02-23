"use client";

import { useMemo, useState } from "react";

const sectorBadgeColors = {
  "Collectivités territoriales": "#e0f2fe",
  "Santé publique": "#dcfce7",
  "Éducation & recherche": "#fef9c3",
  "Intérieur & Justice": "#fee2e2",
  "Administration centrale & ministères": "#ede9fe",
  "Opérateurs publics & infrastructures critiques": "#ffe4e6",
  "Public (transverse)": "#e5e7eb"
};

const threatBadgeColors = {
  Ransomware: "#fecaca",
  "Exploitation de vulnérabilité": "#fde68a",
  "Phishing / ingénierie sociale": "#ddd6fe",
  DDoS: "#bae6fd",
  "Espionnage / APT": "#bbf7d0",
  "Supply chain": "#fed7aa",
  Autre: "#e2e8f0"
};

export default function ArticlesFeedClient({ articles, subsectors = [], threatTypes = [] }) {
  const [selectedSubsector, setSelectedSubsector] = useState("Tous");
  const [selectedThreatType, setSelectedThreatType] = useState("Tous");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredArticles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return articles.filter((article) => {
      const sector = article.publicSubsector || article.publicSector || "Public (transverse)";
      const threatType = article.threatType || "Autre";
      const matchSector = selectedSubsector === "Tous" || sector === selectedSubsector;
      const matchThreat = selectedThreatType === "Tous" || threatType === selectedThreatType;
      const matchSearch = !query || `${article.title} ${article.description || ""} ${article.source}`.toLowerCase().includes(query);

      return matchSector && matchThreat && matchSearch;
    });
  }, [articles, searchQuery, selectedSubsector, selectedThreatType]);

  return (
    <>
      <div style={{ marginBottom: 16, display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <label style={{ display: "grid", gap: 6 }}>
          <strong>Filtrer par sous-secteur</strong>
          <select
            value={selectedSubsector}
            onChange={(event) => setSelectedSubsector(event.target.value)}
            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", background: "white" }}
          >
            <option value="Tous">Tous</option>
            {subsectors.map((sector) => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <strong>Filtrer par type d’attaque</strong>
          <select
            value={selectedThreatType}
            onChange={(event) => setSelectedThreatType(event.target.value)}
            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", background: "white" }}
          >
            <option value="Tous">Tous</option>
            {threatTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <strong>Recherche texte</strong>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Titre, description, source..."
            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", background: "white" }}
          />
        </label>
      </div>

      <p style={{ fontSize: 13, color: "#334155", marginBottom: 12 }}>
        {filteredArticles.length} article(s) correspondant aux filtres.
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        {filteredArticles.slice(0, 120).map((article) => {
          const sector = article.publicSubsector || article.publicSector || "Public (transverse)";
          const threatType = article.threatType || "Autre";

          return (
            <article key={article.link} style={{ background: "white", padding: 14, borderRadius: 12, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                <div style={{ fontSize: 12, color: "#555" }}>
                  {article.subcategory} · {article.date}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontSize: 12,
                      padding: "4px 8px",
                      borderRadius: 999,
                      background: sectorBadgeColors[sector] || sectorBadgeColors["Public (transverse)"],
                      border: "1px solid #cbd5e1"
                    }}
                  >
                    {sector}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      padding: "4px 8px",
                      borderRadius: 999,
                      background: threatBadgeColors[threatType] || threatBadgeColors.Autre,
                      border: "1px solid #cbd5e1"
                    }}
                  >
                    {threatType}
                  </span>
                </div>
              </div>
              <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>
                <a href={article.link} target="_blank" rel="noreferrer">
                  {article.title}
                </a>
              </h2>
              <div style={{ fontSize: 13 }}>
                Source : <strong>{article.source}</strong>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
