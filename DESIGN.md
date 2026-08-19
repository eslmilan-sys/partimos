# Design — « La lámina »

<!-- Écrit APRÈS la construction, depuis le monde réellement bâti. Un
     règlement écrit avant le build se fait défendre contre la réalité au lieu
     de la décrire. Ce qui suit est constaté dans le code, pas souhaité. -->

Graine de direction : `40d25342` · contrat complet dans `src/app/layout.tsx`,
émis en commentaire HTML dans le markup livré.

## La thèse

**Le prix est une mesure, pas une promesse.**

Le mécanisme de Partimos est qu'un montant sort d'une distance réelle. Une
planche d'ingénieur existe pour exactement ça : rendre une quantité
vérifiable. Sa grammaire entière — stations, lignes de cote, cartouche,
nomenclature, hachures — sert à prouver un nombre.

Le monde choisi est celui des planches du Canal de Panamá. Pas le cliché du
bleu de calque ni le vélin beige : les matières saturées de ce monde-là, le
vert-limon du lac Gatún et l'ocre-rouge de la terre excavée de la Culebra.

**Ce que ce système refuse**, explicitement : le hero à champ de recherche posé
sur une photo, la grille de cartes identiques icône + titre + texte, le
sur-titre en capitales au-dessus d'un titre, le dégradé de marque sur du
texte, et les coins arrondis en général.

## Les deux registres

Une seule grammaire, deux tirages — comme dans le métier, où la planche de
présentation est sombre et imprimée, et le tirage de travail est clair et
annoté.

| | Planche `.plate` | Tirage de travail (défaut) |
|---|---|---|
| Fond | `plate-900` `#0a2b25` | `plate-50` `#eef5f2` |
| Texte principal | `plate-100` — 12,3:1 | `plate-950` — 13,7:1 |
| Texte secondaire | `plate-300` — 7,0:1 | `plate-600` — 6,3:1 |
| Clé | `ochre-400` — 5,0:1 | `ochre-600` — 5,3:1 |
| Sert à | accueil, bandeau, ce qui convainc | recherche, trajet, publication |

L'arbitrage est celui du mode : une surface qui doit convaincre a le droit
d'être expressive, une surface où l'on travaille ne l'a pas. Le tirage clair
porte donc tout ce qui est tâche.

## Couleur

Stratégie **engagée** : une couleur saturée porte 30 à 60 % de la surface.
Le vert de planche possède les régions entières ; il n'est jamais un accent
posé sur du neutre.

- **Rampe `plate-*`**, 11 valeurs de `#041916` à `#eef5f2`. Elle porte tout
  sauf la clé.
- **Rampe `ochre-*`**, 6 valeurs. **La clé.** Elle ne marque que deux choses :
  l'action principale, et la quantité mesurée dont on parle. Nulle part
  ailleurs.
- **`signal` `#f2b705`** — le jaune des portes d'écluse, avertissement seul.
- **`danger` `#9a1f16`** — rouge d'oxyde, erreur seule. Tenu à distance de
  l'ocre pour qu'un refus ne se lise jamais comme une clé.

**Règle dure :** `plate-500` (4,18:1 sur le tirage) ne passe qu'en grand
corps. Filets et grands chiffres uniquement, jamais de texte courant. C'est la
seule valeur de la palette qui ne se pose pas librement — l'oublier a produit
la dernière violation AA de cette refonte.

## Typographie

Deux fontes, et le partage entre elles est fonctionnel, pas décoratif.

- **Archivo** (variable, axe de largeur 62–125) porte tout le texte. Les
  titres et le lettrage de cartouche sont **dilatés à 112 %** — l'inverse du
  réflexe habituel des interfaces, qui resserrent. C'est ce qui rend le
  système reconnaissable au premier coup d'œil, et c'est la discipline d'une
  planche : un seul alphabet, décliné en largeur et en corps.
- **Martian Mono**, classe `.cote`, **uniquement là où il y a une mesure** :
  kilomètres, cotes, montants, heures, stations, distances. Le monospace n'est
  pas ici un costume « technique » — c'est la fonte des quantités. Un libellé
  ordinaire en mono est un bug de ce système.

Chiffres tabulaires partout dans `.cote` : sans eux deux montants ne se
comparent pas d'une ligne à l'autre.

## Formes et matière

- **Aucun rayon.** `--radius-lg` et `--radius-xl` valent `0px`. Le seul objet
  rond de l'interface est le pin du logo, et c'est ce qui le fait lire comme
  une marque.
- **Aucune ombre pour simuler la profondeur.** La hiérarchie se fait au filet
  et au fond teinté. Une seule ombre subsiste, `--shadow-float`, pour ce qui
  flotte réellement au-dessus de la page (tiroir, dialogue).
- **`.grid-field`** — trame de calque à 48 px, filets à 26 % d'opacité. Elle
  donne l'échelle et montre que les éléments sont posés sur une grille. Le
  détecteur la signale en consultatif comme signature d'interface générée ; sa
  propre description en donne l'exception, « surfaces de canevas, carte, plan
  ou **mesure** ». C'en est une, et elle est conservée en connaissance de
  cause.
- **`.hatch`** — hachure à 45°. Sur une planche, une zone hachurée est une
  zone prise : c'est l'écriture de l'état « occupé », du tronçon complet au
  siège vendu.
- **`.cartouche`** — le rectangle encadré à filets internes. Il porte la
  formule du plafond sur l'accueil, et les métadonnées ailleurs.

## Mouvement

**Un seul geste authored sur la page : la cote qui se résout.**

Les lignes d'attache tombent, le trait s'ouvre depuis son centre
(`clip-path`, 520 ms, sortie exponentielle `cubic-bezier(0.16, 1, 0.3, 1)`),
puis le chiffre se pose (380 ms, 160 ms de retard). C'est ce que fait une
animation de dessin technique dans la vraie vie.

Tout part d'un **état déjà visible** : sans animation, la cote est là,
entière. Les apparitions de section utilisent `animation-timeline: view()`,
natif et sans JavaScript ; un élément déjà à l'écran est au-delà de sa plage
et s'affiche net. Sous `prefers-reduced-motion`, les timelines sont coupées,
pas seulement raccourcies — écraser une durée n'arrête pas une animation
pilotée par le défilement.

## Les surfaces que le navigateur dessine

Laissées par défaut, elles appartiennent au système d'exploitation et à aucun
système de design. Toutes thématisées ici : sélection (`ochre-400` sur
`plate-950`), anneau de focus (2 px `ochre-600`, `ochre-400` sur planche),
curseur de saisie, barre de défilement (`plate-300`, pouce cerné de 3 px),
décalage de soulignement (`0.22em`, épaisseur héritée de la fonte).

## L'objet signature

`src/components/plate/RouteProfile.tsx` — **le tracé de la Panaméricaine est
le champ de recherche.** On tire deux stations, le segment s'allume en ocre,
la cote se résout dessous avec le plafond des kilomètres sélectionnés.

Trois choses qui ne se négocient pas dans ce composant :

1. **Le glissement est un enrichissement.** Chaque station est un bouton
   atteignable au clavier avec son état pressé, et la cote résolue est
   annoncée dans une région vivante.
2. **Deux orientations, un seul chemin de rendu.** L'axe primaire porte les
   kilomètres, l'axe transverse porte la branche. Les deux sont rendues et
   l'affichage bascule en CSS : aucun calcul de largeur au chargement, donc
   aucun décalage de mise en page ni risque d'hydratation.
3. **En vertical, la cote reste muette.** 340 unités ne suffisent pas à
   écrire un chiffre sur le trait sans traverser les noms de stations ; la
   valeur part dans une note encadrée sous le dessin, ce que fait une planche
   quand une cote n'a pas la place.

## Ce qui reste de l'ancien monde

Honnêtement : les jetons ont été migrés partout, mais **toutes les surfaces
n'ont pas été recomposées**. Sont reconstruites dans la nouvelle grammaire —
accueil, barre de navigation, bandeau, tableau des corridors, boutons,
étiquettes, logo. Sont **migrées mais pas recomposées** — la page de trajet,
la publication, le compte, les pages légales, `Confianza` et `Historias`.
Elles sont cohérentes en couleur, en fonte et en forme, mais leur composition
appartient encore à l'ancienne architecture. C'est le prochain lot, pas une
finition.
