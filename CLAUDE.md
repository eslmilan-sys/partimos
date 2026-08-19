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
| `diseno/` | Le traspaso de design : 58 écrans en HTML. **Référence, pas du code à copier.** |

Chaque intégration a son fichier dans `supabase/` : `DIDIT.md` (vérification
d'identité), `LUGARES.md` (géocodage), `PAGOS.md`, `LINKEDIN.md`. Ils disent ce
qui est branché, avec quelles clés et ce qui reste à faire. Lis celui qui te
concerne avant d'y toucher.

## Les règles

**1 · Jamais de compilé dans le dépôt.** Ni `out/`, ni `dist/`, ni un export
statique. Le déploiement se fait par CI. C'est en commitant du compilé que
l'ancien dépôt a fini avec trois copies du site et personne pour savoir
laquelle était vivante.

**2 · Les règles métier sont décidées, pas suggérées.** Le calcul de l'apport,
le plafond de la route, les quatre règles de remboursement et le modèle de
bagages sont dans `PRODUCT.md`. Si quelque chose semble devoir marcher
autrement, **dis-le avant de le changer**.

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

## Un seul langage visuel : celui de `diseno/`

**Décidé par l'utilisateur.** Le traspaso de `diseno/` est le langage de
**l'app ET du site**. Son système est dans `diseno/design_system/` — c'est la
référence, pas une inspiration.

Ce qu'il pose, et qui n'est pas négociable dans une surface :

- **Azul `#005293` possède les surfaces** : en-têtes, champs héros, barres,
  chrome sombre. **Rojo `#D21034` possède l'interaction** : boutons, liens,
  états actifs. **Le blanc les sépare — ils ne se touchent jamais.** Ce sont
  les deux couleurs du drapeau, réparties par métier.
- **Les neutres sont chauds**, jamais gris-bleu : `ink-*` tire sur le violet,
  les fonds sont `sand-*`.
- **L'erreur ne peut pas être « rouge »**, puisque le rouge est la marque :
  elle est `rojo-700` **avec une icône et un libellé**, et un bouton destructif
  est en contour, jamais plein.
- **Une seule famille typographique** pour tout — `"Helvetica Neue", Helvetica,
  "Inter Tight", Arial`. Pas de monospace : les heures, les prix et les plaques
  utilisent la police d'interface avec des chiffres tabulaires.
- Une échelle de tailles fixe, avec son interlignage et son crénage par
  palier : `--lh-body:1.45`, `--track-micro:0.1em`.

**La spécification complète est dans `diseno/SISTEMA.md`** : l'archétype
d'écran « Bandera », les neuf mécaniques signature, les règles du verre, la
typographie, l'espace, et les règles de langue — tutoiement, casse de phrase,
boutons verbe-en-tête de deux ou trois mots, pas d'emoji, **aucun point
d'exclamation dans le produit**. Lis-le avant de toucher à une surface.

**`DESIGN.md` décrit l'ancien système du site** — les planches d'ingénieur du
Canal, vert `#0a2b25`, refus des coins arrondis. Il est **remplacé**. On le
garde parce qu'il documente ce qui est encore en ligne dans `web/`, mais il ne
guide plus rien. Le site est à reprendre dans le langage de `diseno/`.

## Conflits ouverts, à trancher — ne pas « corriger » seul

**Les points de rendez-vous ne doivent jamais être des terminaux de bus.**
`PRODUCT.md` en fait une condition juridique. Or le traspaso dessine
« Albrook · bahía 4 » et « Chitré · Terminal », et la semence de
`supabase/siembra.sql` a mis six terminaux en production. **Le design et le
produit se contredisent, et la production suit le design.** À trancher avant
d'envoyer un lien à qui que ce soit.

**La formule et la table ne concordent pas.** `PRODUCT.md` écrit
`(km × taux du véhicule × 1,10 + péages) ÷ (sièges + 1)`. Le traspaso donne
Panamá → Chitré = 20,60 $ de coût, 7 $ de plafond, 6 $ d'apport — ce qui sort
d'un taux dérivé de la consommation (8 L/100 × 0,80 $/L = 6,4 c/km), et c'est
ce que calcule `app/src/dominio/aporte.ts`. Mais
`vehicle_categories.rate_per_km_cents` vaut 22/25/32 : avec ce taux, le même
trajet donnerait 17,94 $ d'apport. **Une des deux valeurs est fausse et
personne ne sait laquelle.**

## Divergences assumées entre le design et la production

Elles sont décidées, documentées, et il ne faut pas les « corriger » sans en
parler :

- **Le design dessine un SMS avec un code à 4 chiffres.** La production entre
  par **courriel et mot de passe** : aucun fournisseur de SMS n'est contracté
  et tous les comptes existants sont des comptes courriel.
- **`vehicle_categories.rate_per_km_cents`** (22/25/32) ne correspond pas à la
  formule décidée, qui part de la consommation et du prix de l'essence. La
  formule de `PRODUCT.md` fait foi ; cette table reste à corriger.
- **Il n'y a pas de table `notifications`.** Les avis du design existent comme
  type dans l'app, en attendant la migration.
