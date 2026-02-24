# Cyber veille public FR

## Architecture (résumé)
- **Ingestion worker** (`npm run ingest`) : récupère CERT-FR, Cybermalveillance et watcher PDF SGDSN/Viginum.
- **Normalisation** : toutes les entrées sont converties vers un schéma unifié (type, identifiants, confiance, tags, pertinence secteur public).
- **Stockage** :
  - cache JSON pour l'app : `data/entries.json`
  - option PostgreSQL (via `DATABASE_URL`) avec migration SQL (`db/migrations/001_init.sql`).
- **UI Next.js** :
  - `/` : flux avec filtres (source, type, tags/threat, sévérité, pertinence)
  - `/municipales-2026` : focus électoral/ingérences
  - `/entries/[id]` : détail d’entrée
  - `/api/entries?format=json|csv` : export analyste

## Lancer
```bash
npm install
npm run ingest
npm run dev
```

## Ajouter une source (connecteur)
1. Ouvrir `ingestion/connectors/sources.js`.
2. Ajouter un objet source:
```js
{
  id: "media-x",
  name: "Media X",
  type: "ARTICLE",
  mode: "rss",
  url: "https://example.com/feed"
}
```
3. Pour une source HTML spécifique, créer un parser dans `ingestion/parsers/` et l’appeler depuis `ingestion/pipeline.js`.
4. Vérifier les tags/règles dans `ingestion/lib/tagging.js`.
5. Exécuter `npm run ingest` puis valider dans `data/entries.json`.

## Alerting
- Webhook optionnel via `ALERT_WEBHOOK_URL`.
- Règles actuelles : tag collectivité/élections, ou sévérité critique.
- Anti-spam : hash historisé dans `data/alerts-state.json`.

## Observabilité
- Logs JSON structurés dans la sortie worker (`scripts/ingest.js`).
- Métriques minimales stockées dans `data/entries.json` (`ingested_total`, `deduped_total`, `errors`).
