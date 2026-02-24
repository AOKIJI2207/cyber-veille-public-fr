CREATE TABLE IF NOT EXISTS sources (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  base_url TEXT NOT NULL,
  trust_tier SMALLINT NOT NULL DEFAULT 50,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY,
  source_id INTEGER REFERENCES sources(id),
  entry_type TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ NOT NULL,
  url TEXT NOT NULL,
  canonical_url TEXT NOT NULL,
  certfr_id TEXT,
  cve_list JSONB NOT NULL DEFAULT '[]'::jsonb,
  vendors JSONB NOT NULL DEFAULT '[]'::jsonb,
  products JSONB NOT NULL DEFAULT '[]'::jsonb,
  secteurs JSONB NOT NULL DEFAULT '[]'::jsonb,
  territoire TEXT NOT NULL DEFAULT 'France',
  attack_surface JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence_score SMALLINT NOT NULL,
  status TEXT,
  relevance_public_sector NUMERIC(3,2) NOT NULL DEFAULT 0,
  severity TEXT,
  content_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(canonical_url, content_hash)
);

CREATE TABLE IF NOT EXISTS entry_raw (
  entry_id UUID PRIMARY KEY REFERENCES entries(id) ON DELETE CASCADE,
  raw_payload JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS entry_tags (
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  tag_type TEXT NOT NULL,
  PRIMARY KEY(entry_id, tag)
);

CREATE TABLE IF NOT EXISTS cves (
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
  cve TEXT NOT NULL,
  PRIMARY KEY(entry_id, cve)
);

CREATE TABLE IF NOT EXISTS iocs (
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
  indicator TEXT NOT NULL,
  indicator_type TEXT,
  PRIMARY KEY(entry_id, indicator)
);
