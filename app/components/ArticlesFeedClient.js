"use client";

import { useMemo, useState } from "react";
import { PUBLIC_SECTORS } from "../../lib/publicSector";

const badgeColors = {
  "Collectivités territoriales": "#e0f2fe",
  "Santé publique": "#dcfce7",
  "Éducation & recherche": "#fef9c3",
  "Intérieur & Justice": "#fee2e2",
  "Administration centrale & ministères": "#ede9fe",
  "Opérateurs publics & infrastructures critiques": "#ffe4e6",
  "Public (transverse)": "#e5e7eb"
};

export default function ArticlesFeedClient({ articles }) {
  const [selectedSector, setSelectedSector] = useState("Tous");

  const filteredArticles = useMemo(() => {
    if (selectedSector === "Tous") {
      return articles;
    }

    return articles.filter((article) => article.publicSector === selectedSector);
  }, [articles, selectedSector]);

  return (
    <>
      <div style={{ marginBottom: 16, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <label htmlFor="sector-filter"><strong>Filtrer par secteur :</strong></label>
        <select
          id="sector-filter"
          value={selectedSector}
          onChange={(event) => setSelectedSector(event.target.value)}
          style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #cbd5e1", background: "white" }}
        >
          <option value="Tous">Tous</option>
          {PUBLIC_SECTORS.map((sector) => (
            <option key={sector} value={sector}>{sector}</option>
          ))}
        </select>
        <span style={{ fontSize: 13, color: "#334155" }}>
          {filteredArticles.length} article(s)
        </span>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {filteredArticles.slice(0, 100).map((it) => (
          <article key={it.link} style={{ background: "white", padding: 14, borderRadius: 12, border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
              <div style={{ fontSize: 12, color: "#555" }}>
                {it.subcategory} · {it.date}
              </div>
              <span
                style={{
                  fontSize: 12,
                  padding: "4px 8px",
                  borderRadius: 999,
                  background: badgeColors[it.publicSector] || badgeColors["Public (transverse)"],
                  border: "1px solid #cbd5e1"
                }}
              >
                {it.publicSector}
              </span>
            </div>
            <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>
              <a href={it.link} target="_blank" rel="noreferrer">
                {it.title}
              </a>
            </h2>
            <div style={{ fontSize: 13 }}>
              Source : <strong>{it.source}</strong>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
