# Partimos

Covoiturage interurbain à frais partagés, au Panama.

```
web/        le site public          Next.js, export statique
app/        l'application           Expo — navigateur et téléphone
supabase/   la base                 21 migrations, RLS, fonctions Edge
diseno/     le traspaso de design   58 écrans, référence
```

Chaque dossier a son README. Les règles qui valent pour tout le dépôt sont dans
`CLAUDE.md` ; les règles métier dans `PRODUCT.md`.

## Démarrer

```bash
cd web && npm install && npm run dev     # le site, sur localhost:3000
cd app && npm install && npx expo start  # l'app : QR à scanner avec Expo Go
```

## Ce qui est branché

| | état |
|---|---|
| Base de données | Supabase, 21 migrations, politiques RLS écrites |
| Vérification d'identité | Didit — `didit-start` et `didit-webhook` déployées |
| Géocodage | LocationIQ + Mapbox, fusionnés dans `geosearch.ts` |
| Paiement | voir `supabase/PAGOS.md` |
