# Partimos — site public (Phase 1)

Plateforme de covoiturage interurbain à frais partagés au Panama. Ce dépôt
contient la **phase 1** du brief : le site public, le générateur de pages
corridor et la boucle de collecte de la demande. L'application (inscription,
réservation, messagerie) vient après, une fois la demande mesurée.

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # table de référence des prix (§7 du brief)
npm run build    # génère les 6 pages corridor + sitemap + robots
```

---

## Ce qui a été livré

| Route | État |
|---|---|
| `/` | Accueil complet, porté du HTML de référence |
| `/viajes` | Index des corridors |
| `/viajes/[slug]` | **6 pages corridor**, générées statiquement, revalidées toutes les heures |
| `/seguridad` | Vérification, notes, mode femmes, partage de position |
| `/publicar` | Landing conducteur + calculateur d'aporte |
| `/ayuda` | FAQ |
| `/terminos`, `/privacidad` | Mentions légales — **brouillon en attente de relecture d'avocat** |
| `/sitemap.xml`, `/robots.txt` | Générés depuis le référentiel des corridors |
| `POST /api/demanda` | Recherche infructueuse → `demand_signals` + `waitlist_signals` |

Mesuré sur le build de production (Lighthouse, mobile, CPU 4×) :

| | Accueil | Page corridor |
|---|---|---|
| Performance | 97 | 97 |
| Accessibilité | 100 | 100 |
| Bonnes pratiques | 100 | 100 |
| SEO | 100 | 100 |
| CLS | 0 | 0 |

`axe-core` (WCAG 2.1 AA + best-practices) : **0 violation** sur les 7 pages,
en 1440 px et en 390 px. Aucun débordement horizontal, aucune erreur console.

---

## Les six règles, et où elles sont appliquées

| Règle | Où elle vit |
|---|---|
| **R1** Le conducteur ne gagne jamais d'argent | `src/lib/pricing.ts` (affichage) + `CHECK price_within_cap` dans la base (autorité). Le test `pricing.test.ts` vérifie que le conducteur paie encore quelque chose sur **72 combinaisons** distance × sièges × véhicule. |
| **R2** La plateforme ne touche jamais l'argent | Aucun code de paiement. Aucune dépendance PSP. `service_fee_cents = 0`. |
| **R3** Le prix ne suit jamais la demande | `computePriceCap()` ne prend ni date, ni disponibilité, ni compteur en entrée. Un test le verrouille. |
| **R4** Le conducteur maîtrise son itinéraire | Aucun dispatch ; les points de prise en charge sont des données du corridor, présentées comme des propositions. |
| **R5** Aucune promesse de revenu | Vocabulaire tenu dans `src/lib/content.ts` : « recuperas », « aporte », « compartir gastos ». Jamais « gana dinero ». |
| **R6** Aucune photo de cédula stockée | Rien dans le code ne téléverse ni n'affiche de document. Le schéma ne prévoit aucune colonne pour ça. |

---

## Le calculateur donne exactement la table du §7

`npm test` compare le résultat au brief, au centime :

| Corridor | km | Plafond | Le conducteur paie encore |
|---|---|---|---|
| Coronado | 85 | 6,50 $ | 6,88 $ |
| Penonomé | 145 | 10,50 $ | 11,38 $ |
| Chitré | 250 | 17,50 $ | 19,25 $ |
| Las Tablas | 285 | 20,00 $ | 21,38 $ |
| David | 440 | 31,00 $ | 31,00 $ |

Cette table suppose un **péage moyen de 3,00 $**, comme le calculateur du
HTML de référence. Les pages corridor, elles, utilisent le péage réel de la
table `corridors` — c'est pour ça que Coronado y affiche 6,00 $ et non 6,50 $
(péage réel : 2,00 $). Si tu préfères un chiffre unique partout, il suffit
d'aligner `toll_cents` du corridor Coronado sur 300 dans le seed.

---

## Base de données

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/0001_schema.sql
psql "$SUPABASE_DB_URL" -f supabase/migrations/0002_waitlist.sql
```

`0001` est le `schema.sql` fourni, **appliqué tel quel, sans une ligne
modifiée**. `0002` ajoute la seule table dont le site public avait besoin et
qui n'existait pas : `waitlist_signals`, le numéro laissé pour être rappelé.

Elle est volontairement séparée de `demand_signals` : cette dernière est une
table d'analyse qu'on garde longtemps et qu'on lit en agrégat, alors qu'un
numéro de téléphone est une donnée personnelle avec sa propre durée de
conservation et son droit à l'effacement. Les fusionner ferait basculer toute
la table d'analyse dans le régime des données personnelles.

### Ce qui marche sans Supabase

Tout, sauf deux choses. Le site se construit, se déploie et rend ses six pages
corridor à partir du référentiel de `src/lib/corridors.ts`. Ce qui manque :

- la liste des **prochains départs réels** sur une page corridor reste vide ;
- `POST /api/demanda` répond **503**, et le formulaire affiche une erreur.

C'est un choix : promettre « te avisamos » sans pouvoir enregistrer le numéro
serait mentir à l'utilisateur. Renseigner `SUPABASE_SERVICE_ROLE_KEY` suffit à
tout activer, sans changement de code.

---

## Décisions de design

Le HTML de référence a été porté, pas réinventé. Trois écarts assumés :

**La palette a été resserrée.** La maquette utilisait le bleu, le vert, le
corail, un jaune (#E9A616) et le dégradé comme couleurs d'information — les
icônes changeaient de couleur d'une carte à l'autre sans que ça veuille dire
quelque chose. Ici : **une rampe neutre** dérivée de l'asphalte porte ~90 % de
l'interface, **un seul accent** (le bleu, en deux jetons dont un qui passe AA
sur blanc), le **vert redevient une couleur de marque** — logo, paradas du
ruban, dégradé — et ne signifie plus « validé », et le **corail est réservé
aux erreurs**. Les icônes héritent de `currentColor`. Le résultat est plus
calme et fait ressortir la seule chose qui compte sur cette page : les prix.

**Le dégradé n'est plus un fond de bouton.** L'action principale est de
l'encre — asphalte plein sur fond clair, blanc sur fond sombre. C'est le
contraste le plus élevé possible, et ça libère le bleu pour signaler ce qui
est cliquable ailleurs. Le dégradé apparaît au plus trois fois par page.

**Les polices sont auto-hébergées** par `next/font` au lieu d'être chargées
depuis Google Fonts. Deux allers-retours DNS + TLS disparaissent du chemin
critique, et l'ajustement des métriques de la police de repli ramène le CLS
à 0.

Le reste est conforme : rayons 13–15 px, ombres douces, `tabular-nums` sur
tous les montants, aucun émoji, et le ruban d'asphalte avec ses paradas
traverse bien la page (au-dessus de 1160 px, où la gouttière existe).

---

## Structure

```
src/
  app/                    routes, sitemap, robots, API
  components/
    site/                 Nav, Footer, Section, Logo, gabarit légal
    home/                 sections de l'accueil
    ui/                   Button, Icon
    Calculadora.tsx       calculateur d'aporte (client)
    AvisameForm.tsx       préinscription (client)
    StickyCta.tsx         barre d'action mobile (client)
  lib/
    pricing.ts            Formule A, en centimes entiers
    pricing.test.ts       table de référence du §7
    corridors.ts          référentiel + repli hors ligne
    content.ts            textes UI et mentions légales
    supabase.ts           accès tolérant à l'absence de configuration
    site.ts               URL canoniques
supabase/migrations/      0001 = schema.sql fourni, 0002 = liste d'attente
```

Seuls quatre composants sont côté client. Tout le reste est rendu sur le
serveur : c'est ce qui rend le contenu indexable et garde le JS sous les
150 Ko.

---

## Démonstration cliquable (GitHub Pages)

En ligne : **https://eslmilan-sys.github.io/test/partimos/**

Pages sert la racine de `main`, déjà occupée par le site DOL Method.
Partimos vit donc dans son propre dossier — les deux cohabitent, la racine
reste au site DOL.

Pour régénérer et republier :

```bash
BASE_PATH=/test/partimos \
  NEXT_PUBLIC_SITE_URL=https://eslmilan-sys.github.io/test/partimos \
  npm run build:static
# puis remplacer le dossier partimos/ à la racine de main par out/
```

Deux pièges, réglés une fois pour toutes :

- **`.nojekyll` à la racine de `main`.** Sans lui, Jekyll ignore les dossiers
  commençant par un underscore — donc tout `/_next/` — et le site sort sans
  styles ni polices.
- **`trailingSlash: true`.** Pages sert `/a/b/`, jamais `/a/b` : sans cette
  option, chaque lien interne tomberait sur un 404.

C'est une **démonstration**, pas le déploiement de production : sans serveur,
il n'y a pas de route d'API, donc le formulaire de préinscription annonce
qu'il s'agit d'un aperçu au lieu d'enregistrer le numéro. Le vrai déploiement
se fait sur Vercel, où la route fonctionne.

La branche `gh-pages` conserve un export équivalent servi à la racine, au cas
où tu bascules un jour la source de Pages.

---

## Ce qui reste — étapes ⛔ HUMAIN

Aucune ne peut être faite depuis le code :

1. **Acheter le domaine** (`partimos.com` / `.pa`), après vérification de la
   marque à la DIGERPI, classes 39 et 42. Puis renseigner
   `NEXT_PUBLIC_SITE_URL` — les canoniques et le sitemap le suivent.
2. **Créer le projet Supabase**, appliquer les deux migrations, relever les clés.
3. **Créer le compte Vercel** et connecter le dépôt.
4. **Ouvrir les comptes** KYC, SMS, Mapbox.
5. **Configurer l'email** du domaine (`hola@`, `privacidad@` sont déjà cités
   dans les pages).
6. **Consulter un avocat** en droit du transport panaméen — périmètre du
   covoiturage face à la Ley 14/1993, validation du taux au km et du diviseur
   `sièges + 1`, et surtout **la couverture d'assurance du conducteur**. Tant
   que ce n'est pas fait, `/terminos` et `/privacidad` affichent un bandeau
   « borrador pendiente de revisión » : il est dans
   `src/components/site/LegalPage.tsx`, à retirer une fois la relecture faite.

Le point 6 reste le risque non traité le plus sérieux du projet, et aucune
ligne de code ne peut le couvrir.
