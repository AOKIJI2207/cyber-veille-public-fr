CREATE TABLE IF NOT EXISTS sources (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('rss', 'atom', 'html')),
  last_checked_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  etag TEXT,
  last_modified TEXT,
  robots_allowed BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entries (
  id BIGSERIAL PRIMARY KEY,
  source_id BIGINT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  canonical_url TEXT,
  guid TEXT,
  published_at TIMESTAMPTZ NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  content_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS entries_canonical_url_uniq
  ON entries (canonical_url)
  WHERE canonical_url IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS entries_content_hash_uniq
  ON entries (content_hash);

CREATE UNIQUE INDEX IF NOT EXISTS entries_guid_uniq
  ON entries (guid)
  WHERE guid IS NOT NULL;

CREATE INDEX IF NOT EXISTS entries_published_at_desc_idx
  ON entries (published_at DESC);

CREATE INDEX IF NOT EXISTS entries_created_at_desc_idx
  ON entries (created_at DESC);

CREATE INDEX IF NOT EXISTS sources_is_active_idx
  ON sources (is_active)
  WHERE is_active = TRUE;
