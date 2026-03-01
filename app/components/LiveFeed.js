"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const POLL_INTERVAL_MS = 60_000;

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  return date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

export default function LiveFeed({ initialEntries }) {
  const [entries, setEntries] = useState(initialEntries);
  const [lastSyncAt, setLastSyncAt] = useState(new Date().toISOString());
  const lastSyncRef = useRef(lastSyncAt);

  useEffect(() => {
    lastSyncRef.current = lastSyncAt;
  }, [lastSyncAt]);

  useEffect(() => {
    let cancelled = false;

    async function refreshFeed() {
      const since = encodeURIComponent(lastSyncRef.current);
      const response = await fetch(`/api/feed?since=${since}&limit=100`, { cache: "no-store" });
      if (!response.ok || cancelled) return;

      const data = await response.json();
      if (Array.isArray(data.entries) && data.entries.length > 0) {
        setEntries((prev) => {
          const seen = new Set(prev.map((entry) => entry.id));
          const merged = [...data.entries.filter((entry) => !seen.has(entry.id)), ...prev];
          return merged.sort((a, b) => (a.published_at < b.published_at ? 1 : -1)).slice(0, 200);
        });
      }

      setLastSyncAt(new Date().toISOString());
    }

    const timer = setInterval(() => {
      refreshFeed().catch((error) => console.error("[live-feed] refresh failed", error));
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const countText = useMemo(() => `${entries.length} articles`, [entries.length]);

  return (
    <>
      <p>
        Articles en base : <strong>{countText}</strong> · rafraîchissement automatique toutes les 60s.
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        {entries.map((it) => (
          <article key={it.id} style={{ background: "white", padding: 14, borderRadius: 12 }}>
            <div style={{ fontSize: 12, color: "#555" }}>{formatDate(it.published_at)}</div>
            <h2 style={{ fontSize: 16 }}>
              <a href={it.canonical_url} target="_blank" rel="noreferrer">
                {it.title}
              </a>
            </h2>
            <div style={{ fontSize: 13 }}>
              Source : <strong>{it.source_name}</strong>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
