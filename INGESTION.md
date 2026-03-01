# Architecture d'ingestion (Node.js + PostgreSQL)

## Pipeline
1. `scripts/scheduler.mjs` lance un job toutes les 5 minutes (`node-cron`).
2. `fetchSources()` récupère les sources actives, limite la concurrence, applique timeout/retry/backoff, robots.txt, ETag/Last-Modified.
3. `parseAndNormalize()` convertit RSS/Atom/HTML en format unique d'entrée.
4. `deduplicateAndInsert()` fait un bulk insert avec `ON CONFLICT DO NOTHING`, puis met à jour `updated_at` pour les entrées déjà existantes.
5. Le front appelle `/api/feed` toutes les 60 secondes (polling) pour afficher rapidement les nouveautés.

## Objectifs de latence
- Ordonnancement : `*/5 * * * *` (max 5 minutes entre deux passages).
- Exécution cible : < 60 secondes.
- Affichage : front poll toutes les 60 secondes.

## Cron (exemple système)
```cron
*/5 * * * * cd /workspace/cyber-veille-public-fr && /usr/bin/node scripts/scheduler.mjs >> /var/log/cyber-veille-ingestion.log 2>&1
```

## Variables d'environnement
- `DATABASE_URL=postgres://...`
- `PG_POOL_SIZE=10`
- `INGEST_CONCURRENCY=8`
