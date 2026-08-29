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
