"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export default function ArticlesFeedClient({ articles, subsectors = [], threatTypes = [] }) {
  const [source, setSource] = useState("Tous");
  const [entryType, setEntryType] = useState("Tous");
  const [subsector, setSubsector] = useState("Tous");
  const [threat, setThreat] = useState("Tous");
  const [severity, setSeverity] = useState("Tous");
  const [query, setQuery] = useState("");
  const [minRelevance, setMinRelevance] = useState(0);

  const sources = useMemo(() => Array.from(new Set(articles.map((a) => a.source))).sort(), [articles]);
  const types = useMemo(() => Array.from(new Set(articles.map((a) => a.subcategory))).sort(), [articles]);

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      if (source !== "Tous" && a.source !== source) return false;
      if (entryType !== "Tous" && a.subcategory !== entryType) return false;
      if (subsector !== "Tous" && a.publicSubsector !== subsector) return false;
      if (threat !== "Tous" && a.threatType !== threat) return false;
      if (severity !== "Tous" && (a.severity || "none") !== severity) return false;
      if ((a.relevance_public_sector || 0) < minRelevance) return false;

      const q = query.trim().toLowerCase();
      if (!q) return true;
      return `${a.title} ${a.description || ""} ${a.source}`.toLowerCase().includes(q);
    });
  }, [articles, source, entryType, subsector, threat, severity, query, minRelevance]);

  return (
    <>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: 16 }}>
        <select value={source} onChange={(e) => setSource(e.target.value)}><option>Tous</option>{sources.map((x) => <option key={x}>{x}</option>)}</select>
        <select value={entryType} onChange={(e) => setEntryType(e.target.value)}><option>Tous</option>{types.map((x) => <option key={x}>{x}</option>)}</select>
        <select value={subsector} onChange={(e) => setSubsector(e.target.value)}><option>Tous</option>{subsectors.map((x) => <option key={x}>{x}</option>)}</select>
        <select value={threat} onChange={(e) => setThreat(e.target.value)}><option>Tous</option>{threatTypes.map((x) => <option key={x}>{x}</option>)}</select>
        <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="Tous">Sévérité: toutes</option>
          <option value="critique">critique</option>
          <option value="haute">haute</option>
          <option value="moyenne">moyenne</option>
          <option value="faible">faible</option>
          <option value="none">N/A</option>
        </select>
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Recherche texte" />
      </div>

      <label style={{ display: "block", marginBottom: 12 }}>
        Pertinence secteur public min: {minRelevance}
        <input type="range" min="0" max="1" step="0.1" value={minRelevance} onChange={(e) => setMinRelevance(Number(e.target.value))} style={{ width: "100%" }} />
      </label>

      <p>{filtered.length} résultat(s)</p>

      <div style={{ display: "grid", gap: 12 }}>
        {filtered.slice(0, 150).map((a) => (
          <article key={a.id || a.link} style={{ background: "white", padding: 12, borderRadius: 10, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 12, color: "#555" }}>{a.source} · {a.subcategory} · {a.date}</div>
            <h3 style={{ margin: "6px 0" }}><Link href={`/entries/${a.id}`}>{a.title}</Link></h3>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", fontSize: 12 }}>
              <span style={{ border: "1px solid #cbd5e1", borderRadius: 999, padding: "2px 8px" }}>{a.publicSubsector}</span>
              <span style={{ border: "1px solid #cbd5e1", borderRadius: 999, padding: "2px 8px" }}>{a.threatType}</span>
              <span style={{ border: "1px solid #cbd5e1", borderRadius: 999, padding: "2px 8px" }}>Confiance {a.confidenceScore ?? "N/A"}</span>
              <span style={{ border: "1px solid #cbd5e1", borderRadius: 999, padding: "2px 8px" }}>Sévérité {a.severity || "N/A"}</span>
            </div>
            <p style={{ marginTop: 8 }}>{a.description}</p>
            <a href={a.link} target="_blank" rel="noreferrer">Source originale</a>
          </article>
        ))}
      </div>
    </>
  );
}
