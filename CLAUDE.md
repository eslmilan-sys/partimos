# Partimos

Covoiturage interurbain à frais partagés, au Panama. Ce dépôt contient **tout** :
le site, l'application, la base et le design. Un seul endroit, une seule vérité.

**Lis ce fichier en entier avant d'écrire une ligne.** Puis `PRODUCT.md` pour
les règles métier, et `DESIGN.md` pour ce qui a été constaté dans le code.

Et si tu viens **passer l'app au peigne fin** — chaque bouton, les deux
parcours de bout en bout : `REVISION.md`. Il donne les écrans dans l'ordre où
on les traverse, ce qu'on cherche, et ce qui est déjà connu pour ne pas le
rouvrir comme si c'était neuf.

Pour ce qui empêche le **produit** de marcher — la liquidité, le silence hors
de l'app, la rencontre, la semence — : `AUDITORIA.md`. Quatre problèmes de
fond, quatre petits, chacun avec le fichier où le vérifier.

## Où est quoi

| Dossier | Ce que c'est |
|---|---|
| `web/` | Le site public. Next.js, export statique. |
| `app/` | L'application. Expo — un seul code pour le navigateur et le téléphone. |
| `supabase/` | Les 21 migrations, les politiques RLS, les fonctions Edge, la semence. |
| `diseno/` | Le design : `Partimos App v6.dc.html` est LA base, le canevas et les 58 écrans Hi-Fi l'entourent. **Référence, pas du code à copier.** |
| `herramientas/` | Les sondes qui mesurent l'app dans un vrai navigateur — contraste, cibles, cartes sans padding — et le script qui dessine la flèche manquante dans Switzer. Voir son README. |

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

**~~L'apport s'arrondit au dollar~~ — TRANCHÉ LE 01-09-2026 : il ne s'arrondit
plus du tout.** Le propriétaire, la capture devant lui : *« why we redondean
like this? all pay exact the same brother »*. Sur un Panamá → Chitré de 29,19 $
partagé à trois, le partage juste vaut 9,73 ; l'arrondi au dollar inférieur
le descendait à 9 et **le conducteur mettait 11,19 contre 9 pour chacun de ses
passagers**. La correction du 30-08 — arrondir vers le bas au lieu du haut —
avait retourné l'inégalité sans la supprimer.

`aporteCalculado` divise maintenant **au centime** (`alCentavoAbajo`) : tout le
monde met le même chiffre, et ce qui ne se divise pas — un à quatre centimes —
reste chez celui qui conduit. La garantie du 30-08 tient toujours (il ne met
jamais moins qu'un passager), et un second invariant la resserre : *la
différence est de centimes, jamais de dollars* (`aporte.test.ts`).

Ce que ça coûte : la décision du Sistema v6 « l'apport ne montre pas de
centimes ». On l'assume — aucune règle de style ne vaut deux dollars d'écart
visible entre quatre personnes du même carro. Les conséquences en interface :
la règle de `5c` et le compteur des tronçons travaillent en **centimes par pas
de 25** (le quarter est la pièce la plus courante du pays, donc on descend par
chiffres payables en liquide), et leur maximum est ta part exacte.

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
- **Publier se fait en étapes (27-08-2026, sur les captures BlaBlaCar du
  propriétaire).** Un écran, une décision, dans l'ordre où l'on pense un
  trajet : route → paradas → jour → heure → carro et places → apport →
  apport depuis chaque parada → conditions → commentaire → repaso. Une
  date de départ dans le passé se refuse **à l'étape de l'heure**, là où
  ça se répare, pas en bandeau rouge à la fin.
- **Le carro dit ce qu'il a, et où l'on s'assoit (0045).**
  `vehicles.has_ac` / `has_usb` — du carro, pas du trajet : l'air ne
  s'installe pas le vendredi. `trips.seats_front` / `seats_back` : « máx.
  2 personas atrás » n'est pas une case de plus, c'est avoir mis 2
  derrière. Les deux sont **nuls** dans ce qui était publié avant ; on
  n'invente pas le passé.
- **« Solo mujeres » n'est offert qu'aux conductrices.** L'étiquette
  promet une voiture où toutes les personnes à bord sont des femmes, et
  qui la cherche la cherche pour ça. Avec un homme au volant la promesse
  ne tient pas, donc l'interrupteur n'existe pas. Sans savoir le genre,
  on ne l'offre pas non plus.
- **L'apport depuis une parada a SON propre plafond (0045).** BlaBlaCar
  laisse fixer le prix de chaque tronçon librement ; nous non. Même
  formule sur les kilomètres de CE tronçon, même `+1`, et
  `trip_segment_prices` porte la contrainte `trip_segment_within_cap` —
  la base le dit, pas le code. Sans ça, découper un trajet en morceaux
  serait la porte de derrière pour facturer quatre fois le coût.
  `app/src/dominio/tramos.ts`, avec le test « découper n'encherit
  jamais ».
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
- **Mis viajes : une seule liste, et c'est ce qui vient (28-08-2026).**
  L'écran avait deux sélecteurs l'un sur l'autre — « Voy de pasajero /
  Conduzco » et « Próximos / Historial ». Quatre cases, deux touches pour
  atteindre n'importe laquelle, et avec trois ou quatre trajets dans le
  compte, presque toutes se voyaient vides : un sélecteur qui coupe en
  quatre ce qui tient entier sur un écran coûte une touche et cache les
  trois quarts. Maintenant **une liste chronologique des deux côtés**, et
  **chaque ligne dit de quel côté du volant on est** — le même
  renseignement que donnait le sélecteur, dit dans le trajet plutôt
  qu'exigé avant de rien voir. L'historique n'y est plus : il vit dans le
  profil (« Lo que has recuperado → Ver histórico »).
- **Un vide ne mérite pas une carte (28-08-2026).** Deux écrans en
  avaient une, en trait discontinu, avec icône, paragraphe et bouton :
  la moitié d'un écran pour dire qu'il n'y a rien — et le bouton
  (« Buscar un viaje ») est déjà dans la barre du bas, à un doigt. Mis
  viajes garde une ligne de texte, la bandeja rien du tout (l'exemple
  au-dessus, étiqueté EJEMPLO, dit déjà que rien n'est à soi).
- **Un `Text` bleu n'est pas un bouton.** « Escribir », juste après avoir
  accepté quelqu'un, était un `<Text>` peint en bleu : la couleur d'un
  lien, la forme d'un lien, et rien derrière. C'était le pire endroit
  possible — juste après l'acceptation, il y a justement quelque chose à
  se dire (où, à quelle heure). Il ouvre le fil, et « Ya van contigo » a
  reçu le sien aussi.
- **Une note nulle n'est pas zéro.** Depuis que la note est nulle sous
  trois avis, quatre écrans mentaient : `rep.calificacion?.toFixed(1)`
  écrivait « undefined · 12 viajes » sur la fiche de qui demande une
  place, et `(driver_rating ?? 0).toFixed(1)` inventait un **0,0** —
  pire, parce que ça se lit comme une vraie mauvaise note. Sans note on
  dit ce qu'on sait : le nombre de trajets.
- **Une vérification obtenue bat un balayage postérieur (28-08-2026).**
  `identity_verifications` garde une ligne par tentative Didit, et le
  client prenait **celle au `updated_at` le plus récent**. Sur les
  vraies données ça donne l'inverse de la vérité : deux sessions
  abandonnées des 15 et 16 août, passées à `expired` par un balayage les
  22 et 23, gagnaient sur la vérification obtenue le 17. L'app disait
  « Pendiente » et proposait « Verificar mi cédula » à quelqu'un que
  Didit, interrogé au même instant, donnait pour `already_verified`. Ce
  n'était pas un défaut d'affichage : **cette fonction décide qui peut
  publier**. La règle vit maintenant dans
  `app/src/dominio/verificacion.ts` avec ses tests, dont un bâti sur les
  lignes réelles copiées de la base : `status = 'expired'` est de la
  SESSION (« cet essai n'est pas allé au bout »), pas du document — ce
  qui périme vraiment a sa colonne, `expires_at`. Donc une vérification
  obtenue et non périmée **par date** l'emporte sur toute tentative
  ultérieure qui n'a rien donné. Et si Didit répond `already_verified`,
  l'écran le croit : de la vérification, le prestataire est l'autorité
  (c'est tout le propos de R6).
- **Les puestos cherchés suivent jusqu'à la réservation (28-08-2026).**
  `pedirPuesto` avait `const puestos = 1` en dur. On cherchait
  « 2 pasajeros », la recherche filtrait correctement les trajets à deux
  places libres, on entrait, et il sortait UNE réservation d'une place —
  l'autre personne restait dehors sans que rien ne le dise. Le nombre
  voyage maintenant recherche → fiche → `reservar`, avec un ± borné par
  les places réellement libres et un total qui suit (`B/20 · 2 × B/10`).
- **Sale et arrive dans le MÊME bloc (28-08-2026).** L'heure d'arrivée
  vivait dans une autre carte plus bas — « Directo · llega 10:00
  aprox. » — pendant qu'en haut on lisait « 06:30 · 3 h 30 ». Deux blocs
  pour un même fait, en deux formats. Maintenant « 06:30 → 10:00 » avec
  « Ciudad de Panamá → Chitré » juste dessous : chaque lieu sous SON
  heure, ce qui est l'invariant 2 du système.
- **La note est une moyenne RÉTRÉCIE, pas une moyenne (28-08-2026).**
  `driver_ratings` faisait `AVG(rating)` sans minimum ni fenêtre. Sur un
  marché où quelqu'un a trois trajets et pas trois cents, ça casse : une
  mauvaise note ruine un débutant (avec deux avis, un 1 fait passer de
  5,0 à 3,0), un 5,0 d'un avis se lit comme un 5,0 de quarante, et rien
  ne s'oublie jamais. La formule est maintenant
  `(5 × 4,6 + Σ notes) / (5 + n)` — cinq avis imaginaires à la moyenne de
  la plateforme, que les vrais déplacent — sur une **fenêtre des
  cinquante derniers**. **Sous trois avis la note est nulle** et on
  affiche ce qu'on sait : le nombre de trajets. C'est l'invariant 7 (une
  affirmation porte sa raison) poussé jusqu'au bout — « 4,9 » d'un seul
  avis est un chiffre sans sujet. `app/src/dominio/notas.ts` et la
  migration 0046 portent la **même** formule ; si l'une change, l'autre
  aussi. La moyenne 4,6 est une constante tant qu'il n'y a pas de
  données — surtout pas calculée à la volée, sinon la note de quelqu'un
  bouge sans que cette personne ait rien fait.
  **Même formule des deux côtés** : ici il n'y a pas un fournisseur et un
  client, il y a deux personnes qui partagent un coût. Ce qui change,
  c'est les axes (manejo et carro ne veulent rien dire pour un passager),
  pas le calcul. **Toujours pas d'axe prix** (0007) : le plafond est la
  règle de la plateforme, pas un mérite du conducteur — le noter
  ramènerait la pression tarifaire par la porte de derrière (R3). Et la
  note n'ordonne pas les résultats et ne touche pas à l'apport : personne
  ne gagne d'argent (R1), donc elle ne peut pas être un levier de revenu.
- **« 34 viajes » n'est pas « 34 avis ».** La fiche du trajet écrivait
  « 4,8 (34 viajes) » et la parenthèse se lit comme *d'où sort cette
  note* — alors qu'elle sort de douze avis, parce que noter n'est pas
  obligatoire. Elle dit maintenant « 4,8 · 12 opiniones ». Et la virgule
  décimale vient d'un seul endroit (`enTexto`) : `toFixed(1)` était semé
  dans cinq écrans et écrivait « 4.8 » en espagnol.
- **Un `<button>` dans un `<button>` (28-08-2026).** En rendant la ligne
  « Ya van contigo » cliquable, le bouton « Escribir » s'est retrouvé
  dedans : HTML l'interdit, React l'affiche en encadré rouge, et selon le
  navigateur le bouton intérieur cesse de répondre. Deux boutons frères
  maintenant. Les douze écrans ont été balayés avec
  `document.querySelectorAll('button button')` — c'était le seul.
- **La note allait dans un seul sens (28-08-2026).** « Même formule des
  deux côtés » n'avait rien derrière : l'avis `califica_tu` n'était
  dérivé que pour le passager, donc **personne ne notait jamais un
  passager** et aucun ne pouvait avoir de note ; l'écran ne passait pas
  `yo`, donc ouvert par le conducteur il écrivait l'avis au nom du
  passager ; et les raccourcis étaient ceux du conducteur, toujours.
  `app/src/dominio/ejes.ts` : trois axes valent des deux côtés
  (puntualidad, trato, encuentro), deux sont réservés à qui conduit
  (manejo, carro), et le passager est jugé dans sa propre voix
  (« Estaba a la hora », pas « Puntual »). Le côté se déduisait par un
  ternaire permissif qui donnait « passager » pour quiconque n'était pas
  le passager — y compris un tiers ; les deux parties sont nommées et qui
  n'en est pas une ne note pas.
- **Deux avis manquaient, trouvés en comparant avec Uber (28-08-2026).**
  Une demande qui **expire sans réponse** — le passager attendait une
  réponse qui ne viendrait plus, c'était le trou le plus cher — et un
  **passager qui annule**, dont le conducteur n'était jamais informé
  alors que la place redevient libre et qu'il peut encore la remplir. Les
  deux sont dérivés des faits existants, sans migration. Ce qui reste
  volontairement absent : « le conducteur arrive » et le suivi en direct
  — sans géolocalisation ce serait un mensonge — et toute promotion (R5).
- **Le point de ramassage est du TEXTE (28-08-2026).** « Ver el punto de
  recogida » ouvrait `ya-mapa` : une carte **dessinée** — aucun
  fournisseur de cartes n'est contracté — avec des pastilles de voitures
  dessus, la barre d'onglets qui tombait au milieu de la page, et pas un
  mot du point qu'on venait regarder. Une fausse carte, au moment précis
  où quelqu'un est dans la rue à chercher une voiture. Ce qu'il faut là
  c'est **où, à quelle heure et avec qui**, en gros et sans rien
  d'autre : `app/(pasajero)/punto.tsx`. Une vraie carte, le jour où elle
  existe, se met **en dessous** — elle ne remplace pas ça. `ya-mapa` a
  été supprimé : ses seuls liens étaient ces deux-là.
- **Une affirmation se lit, elle ne se clique pas.** « Conductores con
  cédula verificada » était un bouton qui ouvrait Ayuda, sans en avoir
  l'air — ni chevron, ni couleur de lien — donc on ne le découvrait
  qu'en le touchant par accident. C'est l'invariant 7 (une affirmation
  porte sa raison), pas une porte.
- **La ville dite à l'inscription se récupère toute seule.** Elle part
  dans `options.data` et c'est le déclencheur de la 0044 qui la copie
  dans `profiles`. **Si la 0044 n'est pas appliquée** — elles se posent à
  la main — le profil reste sans ville et l'accueil la redemande, alors
  que la réponse est toujours là, dans les métadonnées du compte.
  `miCiudad` va la chercher là et l'écrit dans le profil : la réparation
  est définitive et marche 0044 posée ou non.
- **La licence passe par Didit, comme la cédula (0047 puis 0048,
  28-08-2026).** Au Panama elle expire sans prévenir, et conduire avec
  une licence périmée met le passager sans recours — l'assurance ne
  couvre pas. Elle a d'abord été faite comme une **date tapée** par le
  conducteur ; le propriétaire a confirmé qu'elle passe par Didit, et il
  a raison : dès que cette date **décide** quelque chose — ici, si tu
  peux publier — une date qu'on se donne à soi-même n'est plus une
  preuve. Qui l'a périmée tape 2035 et continue. Un contrôle que le
  contrôlé remplit ne contrôle rien.
  Elle vit donc dans `identity_verifications` avec
  `document_type = 'DL'` et la date dans `expires_at` — des colonnes qui
  existaient depuis la 0001, et un chemin que `didit-start` sait déjà
  demander (`kind: 'licencia'`). La 0048 **retire** la colonne de la
  0047 : deux colonnes pour la même chose est l'erreur qu'on a corrigée
  le plus souvent ici.
  **R6 tient, avec un ajout assumé** : du document reviennent le verdict
  et **une date**. Ni image, ni numéro, ni nom. Une date n'identifie
  personne, et sans elle la règle ne peut pas exister.
  Les règles restent dans `app/src/dominio/licencia.ts` : trente jours
  d'avis, périmée on ne publie plus de trajets neufs mais **ce qui est
  publié tient**, et **sans date rien n'est bloqué** — tant que le flux
  licence de Didit n'est pas contracté, personne ne peut la vérifier, et
  bloquer sur une chose impossible à faire, c'est fermer la porte et
  jeter la clé. Elle passe **après** la cédula dans l'ordre : une cédula
  se règle en minutes, une licence en semaines.
  **Ce qui manque, et qui est côté compte** : le workflow licence chez
  Didit et son secret `DIDIT_WORKFLOW_LICENCIA`. Sans lui `didit-start`
  répond `sin_flujo_licencia`, et l'app le dit au lieu d'envoyer les gens
  dans le parcours non lié — où ils feraient la vérification pour rien.
  **Et le nom du champ de la date dans la décision Didit n'est pas
  confirmé** : le webhook essaie les chemins documentés et prend la
  première vraie date. À réduire à un seul dès la première décision
  réelle.
- **Deux endroits, deux choses (28-08-2026, tranché après l'avoir vu
  fait à l'envers pendant un jour).** L'onglet du bas est **Chats** :
  des conversations, rien d'autre, et sa pastille compte les messages
  qu'on t'a écrits et que tu n'as pas ouverts. La cloche de l'accueil,
  en haut à droite, est la **bandeja** : ce qui s'est passé. La veille
  les deux avaient été fusionnés en un seul onglet ; sur le téléphone ça
  ne marche pas — qui va à la barre du bas y va pour parler à quelqu'un,
  et tombait sur une liste d'événements où il fallait chercher la
  conversation. Qu'un message apparaisse aux deux endroits — pastille
  ici, avis dans la cloche — est voulu et demandé : la cloche compte ce
  qui est arrivé, l'onglet ce qu'il reste à répondre.
- **Une demande meurt par DEUX horloges (28-08-2026).** On pouvait
  **accepter une demande de place sur un trajet déjà parti** : l'écran
  la montrait en attente — ses quatre heures couraient encore — et le
  service la confirmait sans jamais regarder l'heure de départ. Résultat
  : une réservation `confirmed` sur un trajet d'hier, un apport retenu
  pour un trajet que personne ne fera, et un passager listé dans « Ya
  van contigo » d'une voiture déjà rentrée. La règle est dans
  `app/src/dominio/solicitud.ts` avec ses tests : **c'est la première
  des deux échéances qui l'emporte** — les quatre heures du conducteur
  ou le départ. Le service refuse, et l'écran n'offre plus les boutons
  du tout : il écrit pourquoi à leur place. Un bouton qui ne sert qu'à
  donner une erreur ne devrait pas être là.
- **Ouvrir un fil, c'est le lire (27-08-2026).** La pastille « non lu » se
  déduisait de « le dernier message n'est pas de moi », donc ouvrir le fil
  ne changeait rien et elle restait allumée pour toujours. Maintenant
  `marcarHiloLeido` écrit `read_at` — la seule colonne que la politique
  laisse toucher (`grant update (read_at)`, 0021) — et tout le reste s'en
  déduit : le compte du fil, la pastille de l'onglet Chats, et l'avis.
  **La pastille de Chats se compte dans `ui/Pestanas.tsx` et nulle part
  ailleurs** : elle était posée par chaque écran, c'est-à-dire par un seul,
  et avec le mauvais chiffre — celui de la cloche (avis) donné à l'onglet
  des messages.
- **Un message non lu EST un avis, et il n'a pas de ligne (27-08-2026).**
  `kind: 'mensaje_nuevo'` est **dérivé** de `messages.read_at`
  (`dominio/avisar.ts`), pas écrit par un trigger : une ligne serait une
  deuxième vérité sur la même chose et il faudrait l'effacer à l'ouverture
  du fil. **Un avis par FIL**, pas par message (règle 3 du traspaso), avec
  ce qui a été dit et le bouton « Responder ». Il s'éteint tout seul quand
  le fil est ouvert.
- **Annuler vit où vit la réservation (27-08-2026).** L'écran `14a`
  existait depuis longtemps, complet — la conséquence avant le bouton —
  mais on n'y arrivait que par Ayuda, c'est-à-dire par l'endroit qu'on
  cherche quand on ne trouve plus. Il y a maintenant « Cancelar mi puesto »
  au bas de la fiche du trajet, et il **n'apparaît pas** quand ça ne sert
  plus à rien : `sePuedeCancelar` (place vivante, pas encore montée, départ
  pas passé). Un bouton qui ne fait rien est pire que pas de bouton.
- **Ayuda est là où le problème arrive (27-08-2026, tranché par le
  propriétaire).** Pas sur l'accueil : dans le chat (une icône dans
  l'en-tête) et sur la fiche du trajet, **et seulement si on y a une
  place**. Ce n'est pas la tira de trois promesses supprimée le 27-08 —
  celle-là décorait avant de réserver ; ceci sort après.
- **Ajustes ne garde que ce qui se règle (27-08-2026).** Le groupe
  « Avisos » est parti : « Mis avisos » ouvrait la boîte, à un doigt de la
  cloche de l'accueil, et « Rutas guardadas » sont des trajets — elles
  vivent dans Mis viajes. Avec eux « Cómo aportas » (doublon de « Cómo se
  aporta » de Tu cuenta) et les deux interrupteurs « Solo mujeres » /
  « Compartir mi llegada », qui n'allumaient rien.
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

## La passe du 29-08-2026 — typographie, contraste, doigt, structure

Une journée entière sur la forme, écran par écran, **mesurée dans le
navigateur et pas jugée à l'œil**. Ce qui suit est décidé : ne pas le
défaire sans en parler.

### La flèche n'était pas de Switzer

Le sous-ensemble auto-hébergé (385 glyphes) **ne contient pas U+2192**, et
l'app écrit la direction avec cette flèche à vingt-cinq endroits —
« CIUDAD DE PANAMÁ → LAS TABLAS » est l'en-tête de la moitié du produit. Le
navigateur allait la chercher dans Helvetica : trait fin, autre chasse,
autre graisse, au milieu d'une ligne de Switzer 600.

Fontshare n'est pas joignable depuis l'environnement, donc **la flèche est
dessinée** : `herramientas/flecha-en-la-fuente.py`, avec les mesures de la
police elle-même et de chaque graisse (l'épaisseur du trait d'union, l'axe
du « + », la pointe à 45°). Le script se lance à la main et son résultat
est versionné ; il n'est pas dans le build.

Deux autres caractères manquaient et sont devenus des icônes : « ★ » (déjà
`Estrella`, qui servait ailleurs pour la même note) et « ⌫ » (`Borrar`).

**Avant d'écrire un caractère non-ASCII dans une interface, vérifier qu'il
est dans la police** — le script dit comment.

### L'échelle d'encre allait à l'envers

`ink500` valait `#5A757E` et `ink600` `#7C959D` : le 500 **plus foncé** que
le 600. Dans une échelle d'encre le nombre le plus grand est le plus
foncé — c'est tout ce que ces noms veulent dire. Personne ne les
choisissait par le nombre : on choisissait à l'œil, et les deux mêmes gris
sortaient intervertis d'un écran à l'autre.

Corrigé en changeant **les noms** aux 298 endroits qui les utilisent : ce
pas-là n'a pas bougé un pixel. Les valeurs ont été corrigées ensuite, et
pour une autre raison.

### Le gris secondaire ne se lisait pas

`#7C959D` contraste **2,94:1** sur le lienzo, et le minimum pour un petit
texte est 4,5:1. Il portait la moitié du texte secondaire de l'app. Un gris
à 2,9:1 se lit sur un écran de bureau dans le noir et disparaît sur un
téléphone au soleil, qui est là où ça sert.

Les rapports actuels, sur `sand100` :

    ink900 14,5  ink800 10,6  ink700 8,7
    ink600  5,7  ink500  4,6  ink400 2,3  ink300 1,7

**En dessous de `ink400`, aucun texte qu'il faut lire.** `inkIcono`
(3,69:1) est la teinte d'une **forme**, pas d'un texte : les rótulos
d'onglet et « 3 cupos » en sortaient.

Avec ça, six titres d'écran étaient **blancs sur le lienzo clair** (1,08:1,
invisibles) — restes du champ rouge héros retiré, dont l'écran partagé
`NoEsta` (donc tous les vides de l'app) et le **B/10 à 58 px** de `tope`,
qui est la donnée pour laquelle cet écran existe. Et dans `destino`, où la
bande rouge survit, l'inverse : ses trois lignes étaient restées en encre
de fond clair, à 1,05:1 sur le rouge.

### 44 px, c'est un doigt

Apple et Material disent la même chose. Le ± existait en **trois tailles**
(40 dans `controles`, 34 dans `reservar`, qui avait sa propre copie du même
contrôle) ; « Ver quién es », « Filtros », « Ver histórico » étaient sous la
barre. Un seul ± maintenant, à 44, et `reservar` n'a plus de copie.

### Ce qui se répétait

Un même fait dit deux ou trois fois sur un écran est le défaut le plus
fréquent de ce dépôt. Retirés le 29-08 : l'apport deux fois sur la fiche du
trajet, « sin verificar » trois fois sur le profil, la cloche sur deux
onglets racines, « sin viajes » deux fois sur les résultats, le tope deux
fois sur `puestos`, « Mi perfil público » à l'intérieur du profil.

### Les décisions de structure

- **Une seule cloche, sur Inicio.** La bandeja (ce qui s'est passé) est en
  haut à droite de l'accueil ; l'onglet Chats du bas est les conversations,
  et sa pastille se compte dans `ui/Pestanas.tsx` **et nulle part ailleurs**.
- **Mis viajes ne montre que ce qui vient.** « Quién pide puesto » est
  parti : on administre UN trajet, par sa fiche, pas l'idée de conduire.
  « Rutas guardadas » y reste, à mi-voix.
- **Le profil est une seule page, et c'est le profil public.** Les onglets
  « Sobre ti / Cuenta » ont disparu : ils coupaient en deux ce qui tient
  entier, et cachaient Ajustes et Ayuda derrière une touche. En haut ce que
  l'autre voit, dessous ce qu'on a récupéré, dessous ce qu'on peut toucher.
- **Ayuda et « Cómo te cuidamos » faisaient l'inverse de leur nom.** La
  première s'appelait « ¿Qué pasó? » et était un constat d'incident sans une
  ligne de « comment on fait » ni un courriel ; la seconde s'ouvrait sur un
  bouton 911 pleine largeur. Corrigées : `COMO_SE_HACE` dans
  `servicios/ayuda.ts` (sept réponses), le courriel `CORREO` écrit **à un
  seul endroit**, et le 911 descendu à la fin de la page qu'il ouvrait.
  **`hola@partimos.app` n'existe pas encore : la boîte est à créer.**
- **Une recherche sans un seul trajet** — ni ce jour ni aucun de la tira —
  cache les chips (on ne filtre pas zéro) et la tira (sept tirets ne sont
  pas un calendrier), et le vide porte les trois portes : autre date,
  préviens-moi, **« ¿Lo manejas tú? »**. La dernière est la réponse honnête
  d'une place de marché vide, et elle ne promet rien (R5).
- **Le style d'une carte porte son propre padding.** `carro.tsx` avait un
  `tarjeta` sans padding, complété par un second style à chaque usage : la
  carte qui l'oubliait sortait collée à ses bords. Un style qu'il faut
  accompagner d'un autre pour ne pas casser est un style que quelqu'un
  utilisera seul.
- **Le rótulo d'une carte n'est jamais plus petit que ses lignes.**

### Comment on mesure ça

Les sondes sont dans `herramientas/` et se lancent contre
`npx expo start --web` : contraste réel (fond composé, pas le token),
cibles sous 44 px, texte tronqué, cartes sans padding, contenu coupé par
une barre fixe, et `button` dans `button`. **Les relancer avant de dire
qu'un écran va bien** — quatre défauts sur cinq de cette journée ne se
voyaient pas à l'œil.

## La passe du 30-08-2026 — publier comme BlaBlaCar, et l'argent qui arrive

Sept points, tous partis de captures du téléphone. Ce qu'il faut en retenir
avant de « corriger » quoi que ce soit ici :

### Les paradas d'une route libre ne dépendent plus de l'écran

`prepararPublicacion` recevait le couple `libre` **que l'écran voulait bien
lui passer** : `publicar.tsx` ne l'envoie que quand son état `ruta` est vide,
et cet état est posé par un *autre* effet du même rendu. Le temps d'un
peinture, la route affichée et la route calculée pouvaient différer — et si
c'est cet appel-là qui gagnait la course de promesses, l'écran disait
« Ciudad de Panamá → Las Tablas » et dessous « no conocemos ninguna ciudad
entre las dos ». **Non reproductible en local**, ce qui est exactement ce qui
rend le motif dangereux.

`paradasQueSeOfrecen` prend maintenant **les deux points déjà résolus** — les
mêmes qui ont servi à mesurer les kilomètres, les mêmes dont les noms sont
dans l'en-tête. Il n'y a plus de chemin par lequel l'en-tête dise une paire
et les arrêts se calculent sur une autre. Et `dondeCae` complète les
coordonnées depuis le catalogue quand la ville arrive avec `lat: null`.

### Trois contrôles neufs, dans `src/ui/`

| | |
|---|---|
| `ElegirHora.tsx` | Les 24 heures en grille de six, les quarts dessous. **Les heures pleines seules, c'était mentir d'une demi-heure.** Ce qui est passé sort éteint, comme les jours passés du calendrier. |
| `CarroConPuestos.tsx` | La voiture vue de dessus, en SVG. On touche un siège pour l'offrir, et **ce que ce siège rapporte est écrit dedans**. Remplace deux steppers « Adelante ± / Atrás ± » qui comptaient sans montrer. Le siège du volant ne s'offre jamais : il a son volant et son « Tú ». |
| `Regula.tsx` | La règle du prix. Le plancher, le plafond de la route et la marque du suggéré, d'un coup d'œil ; les ± restent aux deux bouts, parce qu'un doigt n'attrape pas un dollar exact sur 280 px. **Pas de zone rouge, contrairement à BlaBlaCar** : ici le bout droit est le tope et on ne peut pas le dépasser (R1). |

Les deux couches de `CarroConPuestos` — le SVG qui dessine, les `Pressable`
qui touchent — **lisent la même géométrie** (`VOLANTE`, `COPILOTO`, `BANCO`).
Si elles se séparaient, le toucher tomberait à côté du siège.

### Les mots

- La pastille de l'apport disait « calculado » et « lo pusiste tú ». Le
  premier est le participe d'une machine, le second fait de *poner* un verbe
  de prix. Maintenant **« sugerido »** et **« lo cambiaste »**. « Tope de la
  ruta » reste : c'est le nom propre d'une chose qui a son écran.

### `(conductor)/aportes` : ce qui arrive, avant ce qui est arrivé

La carte Yappy en bas de l'historique ne disait ni combien ni quand — une
marque de banque posée là sans raison. Elle porte maintenant **l'envoi
réellement en attente** (`proximoEnvio`, qui était calculé et que personne ne
lisait) : la somme, la semaine couverte, le lundi où il part. Et surtout la
phrase qui manquait partout : **seul ce qui a été payé dans l'app passe par
là** ; l'espèce et le Yappy direct sont déjà dans la poche. Sans elle, un
conducteur payé en liquide attend un lundi qui ne viendra pas.

L'historique porte enfin **la date de chaque trajet**.

### Ce qui reste, et qui n'est pas de cette passe

Le rond « Atrás » fait 40×40 sur **tous** les écrans — le seul défaut de
cible que les sondes trouvent encore. C'est un choix de `circulo` répété
partout : le changer est une passe à lui seul.

`herramientas/publicar-tiros.mjs`, `publicar-hojas.mjs` et
`publicar-auditar.mjs` traversent l'assistant étape par étape ; `auditar.mjs`
ne voit que la première, puisque les suivantes n'existent qu'après des clics.

## La passe du 30-08-2026 (soir) — l'argent, et le repaso

### R1 était contournable, et l'arrondi penchait du mauvais côté

Le propriétaire, capture à l'appui : **« si tout le monde met 7, pourquoi
moi je paie 4,86 ? »**. C'était vrai, et ce n'était pas un cas particulier.

`aporteCalculado` arrondissait le partage **vers le haut**. Or si `a =
⌈C/(N+1)⌉`, ce qui reste au conducteur est `C − N·a`, qui est **toujours**
inférieur ou égal à la part juste — donc toujours inférieur à ce que met
chaque passager. Même le trajet de référence du fichier l'avait : 5,19 pour
lui contre 6,00 pour chacun d'eux. Arrondi **vers le bas**, l'inégalité se
retourne et reste retournée : les centimes qui ne se divisent pas sont pour
celui qui conduit.

Et pire, trouvé en tirant le fil : **le tope de la route se calcule sur
TROIS places de référence** (`OCUPACION_DE_REFERENCIA`). Une voiture qui en
offre quatre pouvait le demander sur les quatre — 4 × 11 = 44 $ sur un
trajet de 32,86 $. Le conducteur gagnait 11 $. R1 cassée, atteignable en
deux gestes sur le curseur, et `loQuePonesDeTuBolsillo` la masquait avec un
`Math.max(0, …)`. Le plafond est maintenant le partage juste ; le tope de la
route ne peut que le baisser. C'est mot pour mot ce que promet le site :
« puedes pedir menos, nunca más ».

Le plancher de 3 $ ne remonte plus l'apport non plus : sur un Coronado à
11,50 $ avec quatre places, il faisait récupérer 12 $.

**Deux invariants tiennent ça maintenant**, balayés sur toutes les formes
(`dominio/aporte.test.ts`) : le conducteur ne met jamais moins qu'un
passager, et voiture pleine au maximum il ne récupère jamais le trajet
entier.

### Le repaso, refait

Trois défauts vus sur la même capture, plus le mot de la fin :

- **Le commentaire n'apparaissait pas.** L'écran qui existe pour tout relire
  avant de s'engager était le seul à ne pas montrer la seule chose que le
  conducteur écrit avec ses mots.
- **La puce d'arrivée n'était pas au bout de la ligne.** La ligne était un
  `View` absolu avec `top: 10, bottom: 22` — deux nombres à l'œil contre une
  hauteur de ligne qui dépend de la typographie. Chaque parada dessine
  maintenant le brin qui descend vers la suivante, et **la dernière n'en
  dessine aucun** : ça ne peut plus dépasser.
- **« Un carré blanc cassé posé sur un dégradé. Pourquoi ? »** Il avait
  raison et il n'y avait pas de réponse : une `Bandera` (le champ rouge avec
  le dessin de la destination) et par-dessus une `hoja` à coins arrondis
  remontée de 30 px, **de la même couleur que la page**. Le procédé ne se lit
  que si la feuille est d'une autre couleur ; ici il ne restait qu'un bord
  arrondi coupant un dégradé sans raison. Et sur le fond : c'est le pas NEUF
  de l'assistant, pas la fiche d'une destination à vendre. Même en-tête que
  les huit autres, ni feuille ni bandeau.

L'écran est désormais **une seule surface** avec des filets entre ses
parties — un document qu'on lit de haut en bas avant de le signer — et
l'argent y est dit **comme un partage** : entre combien, combien chacun.
Deux chiffres côte à côte, celui du conducteur plus gros que celui des
passagers. La question ne peut plus se poser.

### « Abordar · teclear los códigos » était écrit du mauvais siège

*Abordar*, c'est ce que fait le passager. Celui qui lit le panneau ne monte
dans rien : il ramasse des gens et tape ce qu'ils lui montrent. Et la ligne
sortait **toujours**, même sur un trajet où personne n'avait réservé — elle
menait à un écran qui répondait « El viaje está cerrado. Cada aporte ya salió
hacia ti » sur un trajet où personne n'est jamais monté.

`ViajePublicado` porte maintenant `porSubir`, `porBajar` et `aBordo`
(`servicios/panel.ts`, une seule fonction pour les deux sources), et la ligne
dit le moment où on est : **« ¿Recogiste a alguien? · Teclea el código que te
enseña · falta 1 de 3 »**, puis **« ¿Alguien se bajó? »** quand tout le monde
est monté, puis rien quand le trajet est fermé. Elle est aussi sur les
trajets déjà partis, ce que le commentaire de « Ya salieron » promettait
depuis le 27-08 sans que ce soit vrai.

### La passe du 31-08-2026 — l'heure par défaut, et « pourquoi 11 ? »

**L'assistant se bloquait tous les jours à partir de 6 h 01.** `publicar`
partait sur `dia = aujourd'hui` et `hora = '06:00'`, deux constantes : passé
six heures du matin, le départ tombait dans le passé et « Continuar »
s'éteignait au quatrième pas avec *« La salida no puede quedar en el
pasado »*. Trouvé en essayant de reproduire autre chose à 9 h. L'heure sort
maintenant de l'horloge — le quart d'heure suivant avec une heure de marge —
et bascule à demain 6 h quand la journée ne suffit plus
(`cuandoSalePorDefecto`).

**« ¿Por qué si son 30 $ pagan 11? »** — la question du propriétaire avec
l'écran devant lui, et l'écran ne la traitait pas. Deux phrases se
contredisaient : « se reparte entre 2 » puis un plafond qui n'est pas un
partage ; et « el aporte se redondea al dólar de abajo » alors que de 16,43 à
11 il n'y a pas un arrondi mais un tope. Le recuadro disait *« es el tope de
esta ruta : B/11 »*, ce qui est circulaire — c'est 11 parce que c'est le
plafond, et le plafond est 11.

Les deux cas disent maintenant leur propre raison, et le recuadro fait la
comparaison que le conducteur fait de tête : *« Entre 2 saldría a B/14,70
cada uno, pero el tope de esta ruta es B/10,00 por puesto y no sube porque
queden pocos puestos »*. À retenir : **le tope ne mord plus que sur un seul
siège offert** — au-delà, c'est le partage juste qui plafonne (30-08).

Et le libellé droit de la règle disait « Tu parte B/11 » : c'est le maximum
demandable, pas sa part à lui — qui vaut 21,86 sur le même écran. Un nombre
donné pour un autre, juste à côté du vrai.

### La maquette du profil — 31-08-2026

Le propriétaire a envoyé une maquette de `(cuenta)/cuenta` et demandé de
l'appliquer telle quelle. C'est fait : avatar large avec son insigne de
vérification, nom + pastille verte, ville, **carte de statistiques en encre**
(trajets · note · cédula) séparée par deux filets, rótulo « Mi cuenta », liste
à icônes avec sous-titre et valeur, bloc de partage, déconnexion à voix basse.
Ajustes est monté dans **l'engrenage en haut à droite**.

**Trois choses de la maquette n'ont pas été copiées, et ce sont des
décisions :**

1. **Le bloc « Resumen de tu aporte · 35 kg de CO₂ » est parti** — demandé
   dans le même message. On n'a ni la donnée ni de quoi la calculer
   honnêtement.
2. **« Invita y gana · Gana B/.2,00 por cada amigo que viaje » ne peut pas
   s'écrire.** R5 interdit « gana dinero » dans l'interface, et ici ce n'était
   pas une façon de parler : c'était un paiement au parrainage, qui ferait de
   chaque utilisateur le commissionnaire d'une plateforme qui ne prend pas de
   commission. Le bloc garde sa place et son poids et dit ce qui est vrai :
   **partage l'app et son lien**.
3. **Le bouton « scanner » n'existe pas.** Il n'y a rien à scanner dans ce
   produit, et un contrôle mort est le premier défaut de la liste de
   `REVISION.md`.

Et une ligne que la maquette ne porte pas mais qui reste : **« Ayuda y
contacto »**. Sans elle il n'y a aucune porte vers l'aide depuis le profil.

**Le vert vient du système** (`hechoFondo`/`hechoTinta`, la paire de « fait »),
pas d'un `verde50` inventé pour l'occasion : un deuxième vert pour le même
état, ce sont deux verts qui finissent par diverger.

L'argent — « Lo que has recuperado » — était une carte à part au-dessus de la
liste ; il est maintenant **une ligne avec son chiffre à droite**, à la place
qu'occupait le CO₂. Même destination, un renglón au lieu d'une carte.

### Le profil, deuxième passe : l'inventaire avant le dessin — 31-08-2026

Le propriétaire, après avoir vu la maquette appliquée : *« le vrai problème
c'est l'architecture de l'information, pas le visuel. Trop d'entrées qui
représentent le même concept, et certaines sont déjà dans la barre du bas. »*
Il avait raison, et c'est le diagnostic qui a guidé toute la passe.

**Le profil est un centre de contrôle personnel, pas un second menu.**
Sept lignes sont devenues **quatre** : Verificación · Mi carro · Aportes y
pagos · Seguridad. Ce qui est parti, et où :

| Ligne | Décision | Où |
|---|---|---|
| Mis viajes | supprimée | l'onglet **Viajes** de la barre du bas |
| Lo que te han aportado | fusionnée | **Aportes y pagos** |
| Cómo se aporta | fusionnée | dedans, en bas de l'écran |
| Ayuda y contacto | déplacée | **Ajustes → Ayuda** |
| Cerrar sesión | supprimée | elle était déjà dans Ajustes |

**Nouveau : `(cuenta)/editar`** — s'ouvre en touchant la cabecera du profil,
pas par une ligne de plus. Nom, initiale du nom de famille, présentation,
ville ; le téléphone se montre et ne se touche pas (il est vérifié). Pas de
champ photo : il n'y a pas encore où la téléverser, et une ligne qui ne
garde rien est un contrôle mort.

**« Verificado » veut dire cédula ET licence.** Avec la cédula seule on
voyage comme passager ; pour emmener quelqu'un il faut la licence. `Cuenta`
porte `licenciaAlDia`, et `(conductor)/cedula` montre les **deux** états.

**L'écran de la cédula** : son titre était une phrase — « Tu cédula se
verifica fuera de aquí » — mise en 26 px sur deux lignes. Un titre nomme
l'écran ; la phrase est descendue en sous-titre et le titre est
« Verificación ». Et **plus de bouton rouge quand tout est fait** : « Ver el
estado otra vez » n'allait nulle part (« why would I want to see status
again? »). Quand la cédula est là mais pas la licence, le bouton dit
« Verificar mi licencia ».

**Ajustes** : « Lo que cambia lo que ves al buscar » ne voulait rien dire —
une phrase construite à l'envers qu'il faut lire deux fois pour ne pas la
comprendre. Trois groupes deviennent quatre : Viaje · Cuenta · Ayuda ·
déconnexion.

**Et le partage.** « Invita y gana » a disparu pour de bon : il n'y a pas de
programme de parrainage, donc on n'en promet pas un. C'est **« Invita a tus
amigos »**, sans fond de couleur et tout en bas — une action de croissance
secondaire, pas la conclusion du profil.

Reste ouvert, et c'est une bonne idée du propriétaire : **le profil devrait
s'adapter au rôle**. « Mi carro » ne dit rien à quelqu'un qui ne fait que
réserver des places. Aujourd'hui la ligne est toujours là, avec « Añadir mi
carro » quand il n'y en a pas.

### « All pay exact the same », et Ajustes qui n'avait rien à régler — 01-09-2026

Quatre demandes dans un message, trois écrans touchés.

**1 · L'engrenage d'Ajustes est parti, et Ajustes avec lui.** *« On top right
delete ajustes those should be in menu. Delete de rueda. Be smart for this
menu. »* En ouvrant l'écran pour déménager ses lignes dans le profil, il est
apparu qu'**aucune ne lui appartenait** : « Mi carro » et « Verificación » sont
deux des quatre lignes du profil, « Mis datos » est sa cabecera, « Cómo se
aporta » vit dans « Aportes y pagos », « Cómo te cuidamos » est la ligne
Seguridad. Restaient « Cómo se hacen las cosas » et « Cerrar sesión ».

`(cuenta)/ajustes.tsx` est supprimé, `ajustes()` aussi. Le profil porte
maintenant **deux listes courtes** — *Mi cuenta* (Verificación · Mi carro ·
Aportes y pagos · Seguridad) et *Ayuda* (Cómo funciona Partimos) — puis le
partage, puis la déconnexion tout en bas. `(ayuda)/reembolso` allait chercher
le moyen de paiement en fouillant les groupes d'Ajustes ; il demande
maintenant `cuenta()`, où la donnée vit.

Au passage : « Seguridad · Contactos de confianza · SOS » promettait des
contacts de confiance qui n'existent pas. La ligne dit ce qu'il y a derrière —
*« Cómo te cuidamos y el 911 »*.

**2 · Le partage au centime.** Voir plus haut, « L'apport s'arrondit au
dollar » : tranché, il ne s'arrondit plus. `alCentavoAbajo` remplace
`aDolarAbajo`, la règle de `5c` et le compteur des tronçons passent en
centimes par pas de 25, et les textes qui disaient *« el aporte se redondea al
dólar de abajo, y la diferencia la pones tú »* disent maintenant l'inverse,
qui est devenu vrai : *« Todos ponen lo mismo »*. Sur l'écran de relecture,
les deux chiffres côte à côte sont désormais B/6,18 et B/6,22.

**3 · Le panneau du conducteur, reconstruit.** *« This viajes publicados page
is lacking a lot of design. We need to understand the best information
clearly. »* Il dessinait **trois cartes différentes pour la même chose** —
feuille blanche pour aujourd'hui, carte pour les suivants, la même carte pour
les partis — et aucune ne répondait entièrement à la question qui amène un
conducteur ici. Il y a maintenant **une seule carte**, cinq renglones toujours
au même endroit : *cuándo · dónde · quién va · cuánto · qué hago ahora*.

Ce qui manquait et qui y est :

- **Les places se voient** — des sièges dessinés, encre pour l'occupé, gris
  pour le libre. C'était une ligne de texte de 13 px, et c'est le chiffre
  qu'on regarde en premier.
- **L'argent sur toutes les cartes.** La grande, celle du trajet qui part dans
  deux heures, ne montrait l'apport **nulle part**.
- **Les demandes de place montent en tête de page**, comptées sur tous les
  trajets et avec ce qui reste vraiment à la première (`expiraLaPrimera`) : le
  libellé disait « expiran en 4 h » en dur, c'est-à-dire la durée de la
  fenêtre et pas ce qu'il en reste.
- **Un résumé d'une ligne** sous le titre, **les trajets partis éteints**, et
  **un vide qui se touche** (le bouton Publicar au lieu d'une phrase grise).
- Les heures ne sont plus écrites deux fois : `20:56 → 00:26 · 3 h 30` en
  tête, et le rail garde les lieux.

### Publicar : la vraie adresse, la van de sept places, trois arrêts — 01-09-2026

**1 · Les deux extrémités en gris clair, et le formulaire qui n'arrive plus
rempli.** Demandé ainsi : *« faut que quand il publicar tu dois mettre depart
et arrivee avec faible opacité pour inciter à ce qu'ils mettent la vraie
adresse »*. Les champs vides montrent maintenant un exemple — *Calle 50, Bella
Vista* / *Parque Unión, Chitré* — en `ink500` (pas `ink400` : à 22 px il
tombait sous le 3:1), plus une ligne qui dit pourquoi : *« Escribe el punto
exacto —una calle, una gasolinera, un parque—, no sólo la ciudad. Es donde te
van a esperar. »* Aucun des deux exemples n'est un terminal de bus ;
`PRODUCT.md` les interdit comme point de rendez-vous et un exemple est une
consigne déguisée.

**Mais le placeholder ne servait à rien tant que les champs n'étaient jamais
vides.** Un `useEffect` remplissait les deux avec **le premier corridor de la
liste** — Ciudad de Panamá → Chitré, pour tout le monde, à chaque ouverture.
D'où le vrai défaut : on passait l'étape 1 sans y toucher et le trajet
partait publié au niveau de la ville, sans point précis. L'autoremplissage est
parti (et `lugarDeCiudad` avec lui). Conséquence technique : `datos` vient de
`prepararPublicacion`, qui exige les deux extrémités, donc l'écran tournait
en squelette pour toujours ; il y a maintenant **un premier écran qui se
dessine sans `datos`**, et les deux champs vivent dans un seul composant
`CamposDeRuta` partagé par cet écran et l'étape « ruta » de l'assistant.

**2 · « C'est 4 puestos, pas 5 ».** Le sélecteur de voiture écrivait
`${v.seats_total} puestos` et la carte `${seats_total} plazas` : cinq places
pour une voiture qui en offre quatre — la cinquième est celle du volant, et
elle ne s'offre jamais. Les deux disent maintenant les puestos offrables,
c'est-à-dire ce que le dessin juste en dessous laisse toucher.

**3 · La troisième rangée.** Le catalogue savait déjà qu'un Rush ou un
Outlander offrent six places, mais `MAXIMO_ATRAS` valait 3 et le dessin
n'avait qu'une banquette : impossible d'offrir sa troisième rangée. Le domaine
porte maintenant `ASIENTOS_POR_BANCO = 3` et `MAXIMO_BANCOS = 2`, donc
`MAXIMO_ATRAS = 6` ; `CarroConPuestos` calcule son plan à partir du nombre de
sièges arrière — chaque banquette se centre toute seule et la carrosserie
s'allonge avec elle. `seats_back` reste **une seule colonne** (personne ne
réserve « la troisième rangée » ; on demande une place à l'arrière), donc la
migration **0049** se contente d'élargir le CHECK de la 0045 de `0..3` à
`0..6`. Et la deuxième voiture d'Andrés, un RAV4 que le catalogue ne connaît
pas, devient un **Toyota Rush de sept places** : sans van dans le simulé, la
troisième rangée n'était visible nulle part dans la démo.

Une conséquence sur les mots : `comodidadDeAtras` se tait au-delà de trois à
l'arrière. « Máx. 2 personas atrás » parle d'une banquette ; sur deux rangées
la phrase serait fausse.

**4 · Tous les arrêts de la route, sans plafond.** Premier jet : passer
`MAX_INTERMEDIAS` de 2 à 3, en s'appuyant sur la ligne « maximum 4 points de
prise en charge » de `PRODUCT.md`. Le propriétaire a corrigé la règle
elle-même : *« it's the paradas one driver can do through his whole travel —
he can do all. Not limited to three. Rewrite product. »* Il a raison, et la
ligne confondait deux choses : **une ville sur la route n'est pas un
détour**. Descendre à Chitré en passant par Penonomé, c'est la route ; s'y
arrêter cinq minutes n'ajoute pas un kilomètre. Le risque juridique est dans
le *ramassage* — un point qui sort de la route —, et il est déjà borné
ailleurs (+15 % de km, +15 min, écart porté par le passager qui l'a demandé).
Le vrai garde-fou est **géométrique, pas numérique** : `enElCamino.ts`
n'offre que ce qui est sur le chemin. `PRODUCT.md` est réécrit, le plafond
retiré partout, et `dominio/paradas.ts` — créé une heure plus tôt — supprimé.

**Deux défauts que la levée du plafond a rendus visibles, et qui étaient là
avant :**

- `publicarViaje` avait un `.slice(0, 2)` silencieux, et `repaso` un autre :
  l'écran pouvait laisser choisir plus d'arrêts, seuls deux atteignaient la
  base et l'écran de relecture en montrait deux.
- **Quatre villes affichées à la même heure.** `paradasEnElCamino` bornait la
  fraction du trajet à 1, donc tout ce qui tombe à la fin — ou après la
  destination — sortait avec la même fraction, donc la même heure de passage :
  sur un Panamá → Chitré, Guararé, Los Santos, Las Tablas et Parita toutes à
  02:40. La fraction n'est plus bornée, et `ParadaOfrecida.minutos` vaut
  **null** au-delà de 100 % : ces arrêts s'affichent **sans heure**, avec une
  ligne qui dit pourquoi. On continue de les offrir — les retirer emportait le
  carrefour de Divisa, qui avance de 103 % —, mais on n'invente plus l'heure.
  `trip_stops.scheduled_at` accepte NULL depuis la 0001, donc rien à migrer.

### Quatre écrans repris avec les captures du téléphone — 01-09-2026 (soir)

**1 · Le point de prise en charge devient une OPTION, et le défaut est le
point du conducteur.** *« De base je dois aller au point d'où il part. Puis en
bas, option. Avec calcul en fonction de la distance depuis le point de
départ. »* L'écran `7a` ouvrait avec un champ de recherche **déjà rempli** —
« Vía Argentina, Riba Smith », écrit en dur dans le code — et un rail qui
affichait toujours « Tu punto · +4 min », ces quatre minutes étant elles aussi
une constante. Deux données inventées sur l'écran où l'on convient de l'endroit
où quelqu'un attendra à cinq heures du matin ; et toutes les réservations
naissaient donc en demandant un détour que personne n'avait demandé
(`proposed_point` était toujours rempli).

Maintenant : un seul point, le sien, avec *« Es de donde sale Andrés. Llegas
ahí y listo »*. Dessous, en voix basse, **« Pedir otro punto de recogida »**.
Quand on en choisit un, `dominio/desvio.ts` calcule ce qu'il coûte —
`cuantoAlarga(salida, ton point, destination)` × les kilomètres du trajet — et
l'écran dit *« Tu punto alarga el viaje 7,0 km. La gasolina de esos kilómetros
la pones tú : B/0,71 »*, avec le total recalculé et une sortie pour l'enlever.
Au-delà de **+15 % de kilométrage** (`PRODUCT.md`) le bouton s'éteint et
l'écran explique pourquoi.

C'est la règle du détour appliquée à la lettre : jamais un supplément pour un
service de ramassage — le trajet **s'allonge**, donc il coûte plus d'essence,
et cette essence est portée par qui a demandé le détour, avec la même formule
et pas un centime de plus. (Premier jet : compter l'aller-retour au point, sans
regarder où l'on va — un point à trois kilomètres sortait à seize minutes de
détour et se faisait refuser, alors que c'est la prise en charge la plus
banale qui soit.)

**2 · « Mis viajes » ne montrait rien.** *« I published travels… but when I
click mis viajes from menu bottom it doesn't show anything. »* Vrai : l'écran
n'affichait que ce qui vient, et avec tous les trajets passés il répondait
« todavía no tienes viajes por delante » et rien d'autre. La note en tête du
fichier défendait ça — « l'historique vit dans le profil » — mais ça laisse un
onglet racine qui ne montre RIEN de ce qu'on a. Il y a maintenant **« Ya
pasaron »**, en lignes compactes et atténuées, des deux côtés du volant ; et un
trajet qu'on a conduit y ouvre **le panneau**, la même porte que « Administrar
viaje », pour qu'il n'y ait plus deux écrans avec la même liste.

**3 · L'heure : une molette, plus une grille.** *« Attached calendar and button
is not well designed. Act like a pro of ui apps and design. I like it simple
yet like Apple. »* C'était vingt-quatre cases plus quatre pastilles — vingt-huit
contrôles pour répondre à une question de deux chiffres, et ça se lisait comme
un calendrier cassé (d'où le mot). Choisir une heure, ce n'est pas trancher
entre vingt-quatre options : c'est déplacer un nombre sur une droite. Deux
molettes qui tournent au doigt, la bande de sélection immobile au centre, les
lignes qui s'éteignent vers les bords, et **les minutes de cinq en cinq** (en
grille il fallait des quarts ; sur une molette ça ne coûte rien). `snapToInterval`
devient `scroll-snap` en RN-Web, donc le repos tombe toujours sur une ligne
exacte.

**4 · La voiture, un tiers plus petite.** *« Design of the car is too big and
really not good looking. »* Elle faisait 220 × 326 à 260 px de large — la
moitié de l'écran pour un dessin qui accompagne — et surtout elle portait le
montant **écrit quatre fois**, le même à chaque siège, en 19 px : c'est ça qui
l'obligeait à être énorme. Le remplissage sombre suffit à dire qu'un siège est
offert ; le montant se dit **une fois dessous, avec sa multiplication** —
*« 4 puestos × B/12,02 · recuperas B/48,08 »* —, qui est exactement la question
qu'on se pose en touchant les sièges. Proportions de voiture (176 × 262),
sièges plus petits, roues et rétroviseurs à l'échelle.

### La banda recomendada, los tramos en una hoja, y una frase que mentía — 01-09-2026

**« Why is chauffeur paying more? It's equal! »** — capture à l'appui :
`Cada pasajero B/16 · Tú B/17,10` sur un trajet de B/49,10 à trois, sous la
phrase *« todos ponen lo mismo »*. Reproduit au centime : le plafond ne mordait
pas, **le conducteur avait descendu le curseur de 36 centimes** (B/16,36 →
B/16), et l'écran de relecture ne le disait pas. `publicar` a trois phrases —
le plafond mord / tu demandes moins que ta part / le partage propre — et
`repaso` n'en avait que deux. La troisième y est, avec l'écart chiffré et la
sortie : *« Súbelo al máximo si quieres que todos pongan lo mismo »*.

**« Je mets un prix (Partimos donne une fourchette) mais on peut mettre 10 %
de plus. »** Les 10 % vers le HAUT ne sont pas possibles, et ce n'est pas un
choix de design : R1 plafonne l'aporte à `coût / (occupants + 1)` et cette
division **est** le plafond ; au-dessus, voiture pleine, on s'approche du coût
entier, c'est-à-dire de la frontière entre partager des frais et vendre un
billet. (Le 10 % qui existe est déjà dedans : `MARGEN_DESVIO_PCT`, qui grossit
le coût avant de le partager.)

Ce qui manquait, et que BlaBlaCar montre bien, c'est **la fourchette** : là-bas
« Precio recomendado : 23 € – 25 € · tendrás pasajeros enseguida ». Ici il n'y
avait qu'un maximum, et un maximum ne recommande rien — il dit où est le mur.
`rangoRecomendado` va donc de 90 % du partage jusqu'au partage : dix pour cent
de marge, du côté que la loi permet. La bande est peinte en vert sur le
curseur, avec sa pastille et *« A este aporte se llena el carro »*.

**Les prix des villes de passage passent d'une étape à une ligne.** C'était
`¿Y quien sube en el camino?`, une page entière de l'assistant avec un
compteur par arrêt — alors que ces montants sortent déjà calculés de leurs
kilomètres et que l'écran ne sert qu'à les baisser. BlaBlaCar en fait une ligne
sous le prix (« Precios para las ciudades de paso › ») qui ouvre une feuille :
c'est fait, l'assistant passe de 9 étapes à 8, et la ligne est là où l'on
regarde déjà l'argent.
