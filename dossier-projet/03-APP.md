# 03 · L'app et la technique

## Les trois adresses

| Adresse | Ce que c'est |
|---|---|
| <https://eslmilan-sys.github.io/partimos/> | La **portada** — le site public, le SEO. |
| <https://eslmilan-sys.github.io/partimos/app/> | La **vraie app**, branchée sur la vraie base. |
| <https://eslmilan-sys.github.io/partimos/demo/> | La **démo simulée** — données factices, aucun compte requis. |

C'est **le lien `/demo/`** qu'on donne à quelqu'un qui veut juste regarder :
il ne demande pas d'inscription et ne peut rien casser. Le lien `/app/`
suppose un compte et une base qui répond.

Les trois sont publiées par CI à chaque `push` sur `main`
(`.github/workflows/app.yml`). **Rien de compilé n'est jamais commité** — la
règle nº 1 du dépôt, née d'un ancien dépôt qui avait fini avec trois copies du
site sans savoir laquelle était vivante.

## Un seul dépôt

<https://github.com/eslmilan-sys/partimos> — public pour l'instant, à passer
en privé après la phase de test entre proches.

| Dossier | Ce que c'est |
|---|---|
| `web/` | Le site public. **Next.js 16**, React 19, export statique. 15 pages. |
| `app/` | L'application. **Expo SDK 57 / React Native 0.86**, TypeScript, expo-router. 55 écrans. |
| `supabase/` | 34 migrations, les politiques RLS, les fonctions Edge, la semence. |
| `diseno/` | Le design. `Partimos App v6.dc.html` est LA référence. |
| `scripts/` | L'import des lieux depuis OpenStreetMap. |
| `dossier-projet/` | Ce dossier-ci. |

**Un seul code pour le navigateur et le téléphone.** Le même projet Expo
s'exporte en site statique (ce sont les liens ci-dessus) et se compile en
`.ipa` / `.apk` (EAS Build, configuré dans `app/eas.json`).

## La base : Supabase / PostgreSQL 17

Hébergée à `ca-central-1`. Extensions : PostGIS (les points géographiques),
`pg_trgm` (la recherche floue), `unaccent`.

**Il n'y a pas de serveur applicatif.** Le navigateur parle directement à la
base. Ce qui protège les données, ce sont donc les **politiques RLS** (Row
Level Security) — des règles écrites dans la base qui disent, ligne par ligne,
qui a le droit de lire et d'écrire quoi. Voir `06-DONNEES-ET-SECURITE.md`.

Conséquence à comprendre une fois pour toutes : **la clé publique dans le
bundle est publique exprès.** Elle ne donne accès à rien que les politiques
n'autorisent déjà. La clé `service_role`, elle, n'a jamais rien à faire côté
client.

## La recherche d'adresses — le morceau le plus travaillé

Le problème panaméen : personne ne dit une adresse. On dit « PH Torre
Mistral », « la bomba de Divisa », « la entrada de Villa Lucre ». Google ne
peut pas combler le trou — **ses conditions interdisent de conserver ses
résultats**, donc on ne peut pas s'en construire une base. Mapbox ne tolère
qu'un cache temporaire. OpenStreetMap, lui, est sous licence ODbL : libre de
copier, transformer et servir, avec attribution.

D'où l'architecture, en trois couches :

1. **Notre propre table `places`** — ~5 000 points importés d'OpenStreetMap,
   66 lieux panaméens écrits à la main, plus leurs alias (« PTY » et
   « Tocumen » mènent au même aéroport). Chaque lieu porte son **contexte
   administratif** : « Punta Pacífica, San Francisco, Panamá ».
2. **Les lieux que les gens écrivent eux-mêmes.** C'est la partie qu'aucun
   fournisseur n'a. Un point écrit entre **invisible aux autres** ; il devient
   public quand une **deuxième personne distincte** s'en sert. Deux personnes
   qui se donnent le même rendez-vous, c'est un lieu ; une personne qui se le
   donne dix fois, c'est une habitude.
3. **Un fournisseur externe en secours**, appelé **seulement** si notre base
   rend moins de trois résultats.

**La règle du point (décidée le 24-08-2026) : sans coordonnées, pas de lieu.**
Un nom tapé au clavier qui ne correspond à rien de connu n'entre pas au
catalogue — on n'a pas d'adresse, et il n'y a pas de carte pour poser un
point. Lui prêter le centre de sa ville serait une coordonnée inventée, et
elle entrerait dans le calcul de la distance comme si elle était juste. Le
texte libre continue de vivre dans `trips.origin_label`, où il sert au trajet
sans que tout le pays le cherche.

## Ce qui est vérifié

- **51 tests** sur les règles métier de l'app (`npm test` dans `app/`) —
  le calcul de l'aporte, le nommage des lieux, le stockage sécurisé des
  sessions.
- **36 tests SQL** sur la recherche de lieux, exécutés sur les vrais fichiers
  de migration : insensibilité aux accents et à la casse, alias, contexte
  administratif, garde-fous de longueur, classement, la règle des deux
  personnes, la règle du point.
- **Vérification en navigateur réel** (Playwright) à chaque jalon, à 390 px
  de large — la taille d'un téléphone.
- `tsc --noEmit` propre.

## Ce qui manque avant d'aller plus loin

1. **Des écrans savent encore qui ils montrent en dur.** Une partie des
   écrans porte l'identifiant du parcours de démonstration écrit dans le code.
   Trois motifs à remplacer : « qui je suis » vient de la session, « quel
   trajet » et « quelle réservation » du paramètre de route.
2. **Le paiement en ligne n'est pas branché.** Décidé, documenté
   (`supabase/PAGOS.md`), pas implémenté.
3. **La vérification d'identité n'est pas branchée.** Idem
   (`supabase/DIDIT.md`) — il faut un compte Didit et ses clés.
4. **Les magasins d'applications.** `app/eas.json` définit trois profils de
   compilation (`revision` pour un auditeur, avec données simulées ;
   `prueba` ; `tiendas`). Il manque les comptes développeur Apple et Google,
   et l'empreinte du certificat de signature pour les liens vérifiés Android.

## Comment on travaille avec Claude sur ce dépôt

`CLAUDE.md`, à la racine, est lu au début de chaque session. Il pose cinq
règles — dont « jamais de compilé dans le dépôt » et « les règles métier sont
décidées, pas suggérées » — et surtout il **liste les conflits ouverts** pour
qu'aucune session ne les « corrige » toute seule. C'est le fichier à tenir à
jour en premier quand une décision est prise.
