# Architecture d'ingestion (Vercel serverless + PostgreSQL)

## Pipeline
1. Vercel Cron appelle `GET /api/cron` toutes les 5 minutes (`vercel.json`).
2. La route `app/api/cron/route.js` vérifie `Authorization: Bearer <CRON_SECRET>`.
3. `runIngestionJob()` orchestre:
   - `fetchSources()` (concurrence limitée, timeout 10s, retry exponentiel, robots.txt, ETag/Last-Modified)
   - `parseAndNormalize()`
   - `deduplicateAndInsert()` (bulk insert + `ON CONFLICT DO NOTHING` + refresh `updated_at`)
4. Le feed est servi via `GET /api/feed` depuis PostgreSQL.

## Contraintes serverless
- Aucun process long
- Aucun scheduler Node local
- Exécution déclenchée uniquement par Vercel Cron

## Variables d'environnement
- `DATABASE_URL=postgres://...`
- `PG_POOL_SIZE=10`
- `INGEST_CONCURRENCY=8`
- `CRON_SECRET=...` (ou `VERCEL_CRON_SECRET`)
- `NEXT_PUBLIC_SITE_URL=https://votre-domaine`

## Déploiement
1. Ajouter les variables d'environnement sur Vercel.
2. Déployer la branche (`vercel.json` active le cron `*/5 * * * *`).
3. Tester manuellement:
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" https://<domaine>/api/cron
   ```
