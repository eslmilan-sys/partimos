# Partimos

Covoiturage interurbain à frais partagés, au Panama. Ce dépôt contient **tout** :
le site, l'application, la base et le design. Un seul endroit, une seule vérité.

**Lis ce fichier en entier avant d'écrire une ligne.** Puis `PRODUCT.md` pour
les règles métier, et `DESIGN.md` pour ce qui a été constaté dans le code.

## Où est quoi

| Dossier | Ce que c'est |
|---|---|
| `web/` | Le site public. Next.js, export statique. |
| `app/` | L'application. Expo — un seul code pour le navigateur et le téléphone. |
| `supabase/` | Les 21 migrations, les politiques RLS, les fonctions Edge, la semence. |
| `diseno/` | Le design : `Partimos App v6.dc.html` est LA base, le canevas et les 58 écrans Hi-Fi l'entourent. **Référence, pas du code à copier.** |

Chaque intégration a son fichier dans `supabase/` : `DIDIT.md` (vérification
d'identité), `LUGARES.md` (géocodage), `PAGOS.md`, `LINKEDIN.md`. Ils disent ce
qui est branché, avec quelles clés et ce qui reste à faire. Lis celui qui te
concerne avant d'y toucher.

Les deux entrées du calcul du prix ont aussi le leur : **`CONSUMO.md`** (le
carburant, les cinq catégories de véhicule, les modèles) et **`PEAJES.md`**
(le barème et la règle du péage de référence). À lire avant de toucher à
`app/src/dominio/aporte.ts`.

## Les règles

**1 · Jamais de compilé dans le dépôt.** Ni `out/`, ni `dist/`, ni un export
statique. Le déploiement se fait par CI. C'est en commitant du compilé que
l'ancien dépôt a fini avec trois copies du site et personne pour savoir
laquelle était vivante.

**2 · Les règles métier sont décidées, pas suggérées.** Le calcul de l'apport,
le plafond de la route et les quatre règles de remboursement sont dans
`PRODUCT.md`. Si quelque chose semble devoir marcher autrement, **dis-le avant
de le changer**. *(Le modèle de bagages, lui, a été retranché le 25-08-2026 —
voir plus bas.)*

**3 · Le design est une référence, pas une source.** Les `.dc.html` de
`diseno/` s'ouvrent dans un navigateur et se recréent dans la pile du dossier
concerné. On ne copie pas leur HTML.

**4 · Les clés publiques sont publiques exprès.** `web/.env.production`
l'explique en détail. Ce qui protège les données, ce sont les politiques RLS,
pas le secret d'une chaîne compilée dans le bundle. La clé `service_role` n'a
jamais rien à faire côté client.

**5 · Les données simulées ont la forme exacte des tables.** L'app garde une
source simulée (`app/src/servicios/_fuente/simulado`) et une source réelle,
avec un contrat vérifié par le compilateur. On ne montre jamais de fausses
données à un écran sans qu'elles aient la forme des vraies.

## L'objectif en cours

**Envoyer un lien de test à des collègues** pour qu'ils éprouvent chaque
fonctionnalité : les boutons, les textes, les filtres, les calculs,
l'inscription, la connexion. Tant que ce n'est pas possible, c'est la priorité.

Ce qui reste à faire pour y arriver est dans `app/README.md`, section « Ce qui
manque ». Ne pas ouvrir d'autres chantiers avant.

## Les six règles non négociables

Elles sont détaillées dans `PRODUCT.md` et ce sont des **conditions de survie
juridique**, pas des préférences. Résumé, pour qu'aucune session ne les
enfreigne par distraction :

1. **Le conducteur ne gagne jamais d'argent.** Le `+ 1` du diviseur — le
   conducteur paie sa part — ne se retire pas. La base l'impose avec
   `CHECK price_within_cap`.
2. **La plateforme ne touche jamais l'argent.** Ni carte, ni séquestre, ni
   commission. Le paiement est de la main à la main, en espèces ou par Yappy.
3. **Le prix ne suit jamais la demande.** Pas de surge, pas de hausse au
   Carnaval. Le calcul ne prend en entrée ni date ni disponibilité.
4. **Le conducteur maîtrise son itinéraire.** Le passager propose un point, le
   conducteur accepte ou refuse. Jamais de dispatch.
5. **Aucune promesse de revenu.** « gana dinero », « ingresos », « ganancias »
   sont proscrits dans l'interface et le marketing. *(Les nier explicitement —
   « nadie gana dinero con esto » — est le propos inverse et reste permis.)*
6. **Aucune photo ni numéro de cédula stockés.** La vérification passe par
   Didit ; on ne garde que le verdict et la référence du dossier.

Deux contraintes qui s'oublient facilement : un détour ne se facture jamais en
supplément — il change la distance, donc le coût, donc le plafond, par la même
formule ; et **maximum 4 points de prise en charge par trajet**.

## Un seul langage visuel : le Sistema v6

**Décidé par l'utilisateur le 21-08-2026.** La référence est
**`diseno/Partimos App v6.dc.html`** : deux écrans dessinés en entier (Inicio,
Resultados), une spécification en dix sections — « chaque valeur est celle du
fichier, sans approximation » — et neuf invariants. Sa structure est
l'archétype de **tous** les écrans, de l'app ET du site. Le canevas
`diseno/Partimos Main Screen.dc.html` reste la référence des écrans que v6 ne
dessine pas (connexion en 10c, onboarding, publicar) ; là où les deux parlent
du même élément, **v6 fait foi**. Le portage vivant est
`app/src/ui/tokens.ts` — les valeurs y sont commentées avec leur raison.

Ce que v6 pose, et qui n'est pas négociable dans une surface :

- **Le champ rouge héros n'existe plus.** L'utilisateur l'a rejeté
  explicitement. Toute pantalla ouvre sur le lienzo `#F4F7F8`, avec deux
  halos radiaux ténus (sarcelle et rubor) comme seule atmosphère.
- **L'encre est bleu-sarcelle** : `#0A2731` et sa rampe en six pas au métier
  fixe (`#2A4B55` corps secondaire et lieux, `#5A757E` rótulos de section et
  meta, `#7C959D` unités et cejas, `#93A8AE` agotado, `#B0C1C6` traits —
  jamais du texte). L'encre est aussi la surface sombre : le chip Filtros, le
  bouton Publicar, le bisel.
- **Le rouge a exactement quatre sens** — destination, action primaire, faible
  disponibilité, « en vivo » — **et aucun décoratif** (invariant 4). Trois
  profondeurs : `#E1213B` agit, `#C11730` est le texte-accent sur blanc,
  `#B01128` l'accent dans un chip teinté. Un prix n'est pas rouge : un prix
  ne se presse pas.
- **La direction s'écrit deux fois, toujours** : le couple de cejas
  SALE / LLEGA et le raíl aro-creux → punta-de-flecha-roja. Un séparateur
  neutre entre deux noms de lieux n'est jamais acceptable (invariant 1). Un
  lieu vit sous SA propre heure (2). Une arrivée après minuit porte « +1 día »,
  sans exception (3).
- **La grotesque est Switzer**, auto-hébergée (`app/public/fuentes/`), avec
  Helvetica Neue et Inter Tight derrière. Pas de monospace : tout nombre
  comparable — heures, aportes, durées, notes — prend des **chiffres
  tabulaires** (invariant 9).
- **L'argent s'écrit `B/18`** — le préfixe balboa dans son propre corps
  (12/500) sur la ligne de base de la cifra (22/600). Un seul endroit formate :
  `app/src/ui/dinero.tsx`.
- Rayons à assignation fixe (8 imbriqué · 11/13 chips · 14 celda d'icône ·
  16 contrôle en carte · 18 bouton pleine largeur · 24 carte), hauteurs de
  contrôle 32/38/44/48/52/54, espacement 4/8/10/12/16/20 — **20 est le plus
  grand vide à l'écran**. États pulsés : boutons `.97`, cartes `.985`, celdas
  au lavado d'encre 6 %, 120 ms ease-out.
- **Les rótulos de champ sont des verbes à la première personne** — « Salgo
  de », « Voy a » (invariant 8). Une liste dit sa cuenta et son sujet, lue de
  la recherche même (5) ; les filtres appliqués se voient et se retirent où
  qu'ils agissent (6) ; une affirmation porte sa raison (7).

**Les règles de langue de `diseno/SISTEMA.md` restent en vigueur** —
tutoiement, casse de phrase, boutons verbe-en-tête, pas d'emoji, **aucun
point d'exclamation dans le produit** — mais son système visuel (azul/rojo du
drapeau, neutres chauds, champ héros) est **remplacé par v6**, comme
`DESIGN.md` (vert Canal) l'avait été avant lui. On garde les deux parce
qu'ils documentent ce qui a existé ; ils ne guident plus rien.

## Conflits ouverts, à trancher — ne pas « corriger » seul

**Les points de rendez-vous ne doivent jamais être des terminaux de bus.**
`PRODUCT.md` en fait une condition juridique. Or le traspaso dessine
« Albrook · bahía 4 » et « Chitré · Terminal », et la semence de
`supabase/siembra.sql` a mis six terminaux en production. **Le design et le
produit se contredisent, et la production suit le design.** À trancher avant
d'envoyer un lien à qui que ce soit.

*(La formule et la table ne concordaient pas. **Tranché le 24-08-2026 : c'est
la consommation qui fait foi**, la colonne `rate_per_km_cents` est à retirer.
Voir `supabase/CONSUMO.md` — l'argument, les cinq catégories, la liste des
modèles et ce qui reste à migrer.)*

## Divergences assumées entre le design et la production

Elles sont décidées, documentées, et il ne faut pas les « corriger » sans en
parler :

- **Le design dessine un SMS avec un code à 4 chiffres.** La production entre
  par **courriel et mot de passe** : aucun fournisseur de SMS n'est contracté
  et tous les comptes existants sont des comptes courriel.
- **`vehicle_categories.rate_per_km_cents`** (22/25/32) est **périmée** : la
  formule part de la consommation et du prix de l'essence. La colonne sort à
  la prochaine migration, remplacée par `consumo_litros_100km` sur cinq
  catégories. `supabase/CONSUMO.md` porte la décision et les valeurs. Ne pas
  s'en servir en attendant : elle donne un aporte trois fois trop haut.
- **« Corredor » a deux sens et ils se confondent facilement.** Chez nous,
  c'est une **paire de villes** (table `corridors`). Au Panama, c'est une
  **autoroute urbaine à péage** de la capitale — Norte, Este, Sur, opérées par
  ENA. Une session qui cherche « les péages des six corridors » tombera sur
  ENA et mettra des péages de ville dans un trajet vers David. Le barème et la
  règle du péage de référence sont dans `supabase/PEAJES.md`.
- **Le prix du carburant côté app est à 1,27 $/L depuis le 24-08-2026**
  (`aporte.ts`), avec les consommations de `CONSUMO.md` (6,5/7,5/9,5). Le
  trajet de référence vaut désormais 29,19 / 10 / 8 — plus 20,60 / 7 / 6.
  Reste la migration : le prix doit devenir une ligne datée (`fuel_prices`),
  la colonne `rate_per_km_cents` doit sortir, et les catégories 4×4/híbrido
  doivent naître. Elle attend le péage de l'Autopista Arraiján–La Chorrera.
- **Toutes les routes se publient depuis le 24-08-2026** — « all routes
  shall be opened ». La route libre suit le même formulaire, kilomètres
  estimés par coordonnées × 1,65 (facteur MESURÉ sur Panamá–Chitré :
  151 km à vol d'oiseau, 250 par la route), péages inconnus à zéro. La
  recherche trouve ces trajets par leurs villes (miroir du LEFT JOIN 0031).
- **La table `notifications` existe depuis la 0040** (26-08-2026) : les avis
  s'écrivent par triggers sur `bookings`/`trips`, chacun lit les siens, et
  seul `read_at` se marque depuis le client. La bandeja de l'app JOINT ces
  lignes écrites aux avis **dérivés des faits** (`app/src/dominio/avisar.ts`) —
  le rappel de départ n'est pas un événement mais un état de l'horloge, et
  c'est la dérivation qui le porte. Dédoublonnage par (kind, booking_id).
  Ce qui manque encore : l'envoi push téléphone fermé (besoin d'un cron pour
  le rappel et d'un canal d'envoi).
- **Un seul code, et c'est celui de la montée (27-08-2026).** Il y en avait
  deux, tous deux tapés par le conducteur ; le second, à la descente,
  fermait la réservation et libérait l'apport. Deux défauts : le passager
  voyait le code d'arrivée **avant même d'être monté**, et si le conducteur
  ne tapait rien — maleta à la main, voiture en double file — la
  réservation restait ouverte pour toujours. Maintenant : le code de
  montée prouve que le trajet a eu lieu ; **la fermeture, c'est le
  passager qui la dit** (« todo bien »), et à défaut ça se ferme seul
  **24 h** après l'arrivée prévue. La règle est dans
  `app/src/dominio/cierre.ts`, avec ses tests ; le balayage se fait à la
  lecture (`cerrarLasVencidas`) faute de cron — le jour où il existe, on
  supprime le balayage et rien d'autre ne bouge. `bookings.arrival_code`
  devient vestigial : la colonne reste, on n'écrit plus dedans.
- **Le prix ne bouge pas quand on retire des puestos, et c'est R3.** Le
  partage entre occupants monte bien, mais le plafond de la ROUTE le
  coupe — il se calcule sur une occupation de référence, justement pour
  qu'offrir moins de places ne renchérisse pas la place. Sinon, offrir
  une seule place reviendrait à facturer le double : un supplément sur la
  dernière place. Ce qui manquait, c'est que l'écran le DISE : la
  pastille affichait « calculado » alors que le chiffre était le plafond.
  Corrigé dans `origenDelAporte` + `elTopeMuerde`.
- **La ville se demande À L'INSCRIPTION (0044, 27-08-2026).** Quatrième
  étape du formulaire, « ¿De dónde sales? », juste avant de créer le
  compte : elle part dans `options.data` et c'est le déclencheur
  `handle_new_user` qui l'écrit — après, il n'y aurait pas de session avec
  laquelle la sauver, la confirmation par courriel arrivant plus tard. Le
  déclencheur **ne croit pas** l'identifiant : il le vérifie contre
  `cities`, sinon nul. L'étape ne bloque pas la création : un compte
  qu'on ne peut pas finir d'ouvrir est pire qu'une donnée qui manque. La
  carte de l'accueil reste pour qui entre par Google ou Facebook et ne
  passe pas par ces étapes.
- **La ville de résidence sert enfin à quelque chose (0043, 27-08-2026).**
  `profiles.home_city_id` existait depuis le début et **aucun écran ne
  l'écrivait ni ne la lisait** : l'app supposait que tout le monde part de
  la capitale. On la demande maintenant depuis l'accueil — pas depuis
  l'inscription, parce que qui entre par Google ou Facebook ne passe pas
  par ses trois étapes — et elle sert à deux choses : le champ « Salgo de »
  démarre chez vous, et une section liste les trajets **déjà publiés** au
  départ de votre ville qui ont encore de la place. Ça n'invente rien ;
  ça évite d'avoir à chercher. Si la ville n'est pas au catalogue, la
  personne peut nous demander de l'ajouter : ça écrit dans
  `city_requests`, que **personne ne lit depuis le client** (pas de
  `select`, on la relève avec la clé de service). On n'a jamais laissé
  inventer une ville — une ville inventée, aucune recherche ne la trouve.
- **On peut écrire au conducteur SANS réserver, depuis la 0041**
  (26-08-2026, demandé par l'utilisateur). `messages.booking_id` devient
  nullable et un fil pend soit d'une réservation, soit d'un trajet —
  jamais des deux : le `CHECK messages_de_una_cosa` l'impose. La clé d'un
  fil de question est `(trip_id, con_id)`, `con_id` étant **celui qui
  demande** ; ses deux seules parties sont cette personne et le
  conducteur, pas les autres passagers du trajet. Le déclencheur
  `messages_hilo_coherente` interdit d'ouvrir un fil au nom d'un tiers
  **même avec la clé de service**. Demander ne réserve rien : ni place
  occupée, ni horloge des quatre heures démarrée. Banc d'essai :
  `supabase/pruebas/13-preguntar.sql` (11 vérifications).
- **Le bagage se décide à la demande, plus à la publication** (tranché par
  l'utilisateur le 25-08-2026). Le conducteur ne déclare plus rien à l'avance :
  le passager dit ce qu'il emporte — **rien, un sac, une valise** — et le
  conducteur voit ce mot dans la demande et accepte ou refuse, du même geste
  qu'il accepte la place. Trois options et pas une de plus : compter les
  valises était une comptabilité de coffre que personne n'allait tenir.
  **Corrigé le 27-08-2026 par l'utilisateur : on compte.** Trois classes —
  bolsos, maletas pequeñas, maletas grandes — avec un compteur 0…3 chacune
  (migration 0042, colonne `bookings.maletas_pequenas` + `CHECK
  bookings_equipaje_razonable`). L'argument de la veille ne voyait pas que
  deux valises ne sont pas une, et qu'un carry-on n'est pas un coffre
  entier : le nombre EST la donnée. La
  règle vit dans `app/src/dominio/equipaje.ts`, avec ses tests. `trips.accepts_luggage`
  devient vestigial (la colonne reste, plus personne ne la lit) ; les colonnes
  `bookings.mochilas` / `maletas` de la 0026 servent de pont, donc pas de
  migration. Le prix n'est pas touché : l'apport sort de l'essence et des
  péages, le bagage n'y entre ni ne se facture.
