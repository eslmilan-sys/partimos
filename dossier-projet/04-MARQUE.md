# 04 · La marque

> La référence vivante est `diseno/Partimos App v6.dc.html` (le « Sistema v6 »,
> décidé le 21-08-2026) et son portage en code, `app/src/ui/tokens.ts`, où
> chaque valeur est commentée avec sa raison d'être.

## Ce qui est fixe, et ce qui ne l'est pas

**Fixe :** le nom **Partimos** et le logo (**le pin**).

**Ouvert :** tout le reste du langage visuel. Le système actuel est le
troisième — un vert « Canal », puis un bleu/rouge drapeau, aujourd'hui v6. On
garde les deux anciens dans le dépôt parce qu'ils documentent ce qui a existé ;
**ils ne guident plus rien.**

---

## Les couleurs

### L'encre — un bleu-sarcelle, en six pas

C'est la couleur principale de la marque. Elle sert **à la fois** de texte et
de surface sombre : le bouton « Publicar », le chip « Filtros », le biseau du
téléphone.

| Rôle | Hex | Emploi exact |
|---|---|---|
| **Ink 1** | `#0A2731` | Texte primaire **et** surface sombre. La couleur de marque. |
| Ink 1b | `#123F4D` | L'extrémité claire du dégradé du bouton Publicar (160°). |
| **Ink 2** | `#2A4B55` | Corps secondaire, noms de lieux, étiquettes de contrôle. |
| **Ink 3** | `#5A757E` | Titres de section, méta, la ligne de confiance. |
| **Ink 4** | `#7C959D` | Unités (« B/ »), méta tertiaire, sourcils de champ. |
| **Ink 5** | `#93A8AE` | Texte épuisé / désactivé. |
| **Ink 6** | `#B0C1C6` | Tirets, chevrons, rails éteints. **Jamais du texte à lire.** |

Deux gris d'icône, hors tableau mais présents à chaque écran :
`#6C8A93` pour une icône au repos, `#3E5D67` pour une icône d'en-tête.

### Le rouge — quatre sens, et aucun décoratif

C'est **l'invariant nº 4 du système**, et c'est le plus facile à enfreindre par
distraction. Le rouge veut dire exactement quatre choses :

1. **la destination** d'un trajet,
2. **l'action primaire** (le bouton qui engage),
3. **la faible disponibilité** (« pocos cupos »),
4. **« en vivo »**.

Rien d'autre. Un ornement rouge est un bug.

| Profondeur | Hex | Emploi exact |
|---|---|---|
| **Rojo 500** | `#E1213B` | **Agit** : bouton primaire, marqueur de destination, point en vivo. |
| Rojo 600 | `#A6122A` | L'état pressé du bouton primaire. |
| **Rojo 700** | `#C11730` | Accent **de texte** sur blanc : liens, « Llega », onglet actif. |
| **Rojo 800** | `#B01128` | Accent **dans un chip teinté** : « pocos cupos », « Mejor opción ». |
| Rojo 100 | `#FCE9EC` | La teinte — `rgba(225,33,59,.10)` aplatie sur blanc. |

**Un prix n'est jamais rouge.** Un prix ne se presse pas.

### Les surfaces

| Rôle | Hex |
|---|---|
| Cartes et feuilles | `#FFFFFF` |
| **Sol d'écran (le « lienzo »)** | `#F4F7F8` |
| Derrière le téléphone (canevas de design seulement) | `#E9EEEF` |

**Le champ rouge héros n'existe plus.** Il a été rejeté explicitement. Tout
écran s'ouvre sur le lienzo `#F4F7F8`, avec pour seule atmosphère **deux halos
radiaux ténus** — sarcelle en haut à gauche, rouge en haut à droite — et aucun
des deux n'intercepte un contenu.

### Les traits et les lavis

Écrits en encre avec alpha, pour tenir sur blanc comme sur lienzo :

```
bord subtil      rgba(10,39,49,.08)
bord par défaut  rgba(10,39,49,.11)
séparateur       rgba(10,39,49,.07)   ← 1 px, pleine largeur dans une carte
lavis pressé     rgba(10,39,49,.06)   ← « ink wash à 6 % »
```

### Les deux états qui ne sont pas la marque

Le rouge ayant ses quatre sens comptés, « fait » et « en attente » vivent
dehors :

| État | Fond | Encre |
|---|---|---|
| Fait | `#E7F4EE` | `#0B5C3B` |
| En attente | `#FBF0D8` | `#8A6413` |

---

## La typographie

**Switzer**, une grotesque, auto-hébergée (`app/public/fuentes/`). Derrière,
dans l'ordre : Helvetica Neue, puis Inter Tight.

**Pas de monospace.** Tout nombre comparable — heures, aportes, durées, notes
— prend des **chiffres tabulaires** (invariant nº 9). C'est ce qui fait qu'une
colonne de prix s'aligne à l'œil.

### L'argent s'écrit `B/18`

Le préfixe balboa dans son propre corps — **12 / poids 500** — posé sur la
ligne de base du chiffre — **22 / poids 600**. Un seul endroit du code
formate un montant : `app/src/ui/dinero.tsx`.

---

## La géométrie

**Rayons, à assignation fixe** — un rayon n'est pas un goût, c'est un rôle :

| Valeur | Ce que ça arrondit |
|---|---|
| 8 | Un élément imbriqué |
| 11 / 13 | Les chips |
| 14 | Une cellule d'icône |
| 16 | Un contrôle dans une carte |
| 18 | Un bouton pleine largeur |
| 24 | Une carte |

**Hauteurs de contrôle :** 32 · 38 · 44 · 48 · 52 · 54.

**Espacement :** 4 · 8 · 10 · 12 · 16 · 20. **20 est le plus grand vide de
l'écran** — au-delà, c'est que la structure est fausse.

**États pressés :** un bouton descend à `.97`, une carte à `.985`, une cellule
prend le lavis d'encre à 6 %. Toujours 120 ms, ease-out.

---

## Les neuf invariants

Ce sont les règles qu'une pantalla ne peut pas enfreindre. Les cinq qui se
perdent le plus souvent :

1. **La direction s'écrit deux fois, toujours** — le couple de sourcils
   `SALE` / `LLEGA`, **et** le rail « anneau creux → pointe de flèche rouge ».
   Un séparateur neutre entre deux noms de lieux n'est **jamais** acceptable.
2. **Un lieu vit sous SA propre heure.**
3. **Une arrivée après minuit porte « +1 día »**, sans exception.
4. **Le rouge n'a que ses quatre sens.** (Ci-dessus.)
8. **Les étiquettes de champ sont des verbes à la première personne** —
   « Salgo de », « Voy a ». Jamais « Origen » / « Destino ».

Les autres : une liste dit son compte et son sujet, lus de la recherche
elle-même (5) ; les filtres appliqués se voient et se retirent là où ils
agissent (6) ; une affirmation porte sa raison (7) ; les chiffres comparables
sont tabulaires (9).

---

## La langue

**Espagnol du Panama, tutoiement.**

- « **carro** », jamais « coche ».
- « **puesto** », jamais « asiento ».
- **Casse de phrase** partout. Pas de MAJUSCULES décoratives.
- **Les boutons commencent par un verbe.**
- **Pas d'emoji dans l'interface.**
- **Aucun point d'exclamation dans le produit.** Aucun.

### Le vocabulaire imposé

| On écrit | On n'écrit jamais |
|---|---|
| recuperas | gana dinero |
| aporte | ingresos |
| compartir gastos | ganancias |

Ce n'est pas une préférence de ton : c'est la règle nº 5 du produit, et c'est
juridique (voir `02-PRODUIT.md`).

---

## Le résumé qu'on peut donner à un graphiste

> Encre bleu-sarcelle `#0A2731` sur fond `#F4F7F8`. Un seul accent, rouge
> `#E1213B`, réservé à quatre significations et jamais décoratif. Switzer,
> chiffres tabulaires. Cartes blanches à rayon 24, boutons à rayon 18,
> espacements par pas de 4 et jamais plus de 20. Aucun emoji, aucun point
> d'exclamation, tout en casse de phrase, espagnol du Panama au tutoiement.
