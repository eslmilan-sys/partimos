# Les péages

> Relevé le 24-08-2026 depuis `ena.com.pa`. Complète `CONSUMO.md` : les péages
> entrent dans le coût du trajet, donc dans le plafond de l'aporte.
>
> ```
> coût = essence × 1,10 + péages
> ```

---

## ⚠️ Deux choses appelées « corredor », et ce n'est pas la même

C'est le piège de ce dossier, et il vaut mieux le lire deux fois.

| Le mot | Ce que ça désigne | Où ça vit |
|---|---|---|
| **Corredor** (Panama) | Une autoroute urbaine à péage **dans** Ciudad de Panamá : Norte, Este, Sur. Opérées par ENA. | Ce fichier. |
| **Corridor** (Partimos) | Une **paire de villes** — Panamá–Chitré — avec sa page, ses paramètres de prix, ses six exemplaires. | La table `corridors`, `PRODUCT.md`. |

Une session qui cherche « les péages des six corridors » et tombe sur ENA
mettra les péages urbains de la capitale dans un trajet Panamá → David.
**Ce ne sont pas les mêmes routes.**

---

## Ce que ce relevé donne — les corredores urbains, Clase A

La Clase A est la classe des voitures particulières. Montants en balboas, par
passage à la caseta indiquée.

### Corredor Norte

| # | Caseta | B/ |
|---|---|---|
| 1 | Ascanio Villalaz (entrada) — desde Albrook | 0,90 |
| 2 | Ascanio Villalaz (salida) — hacia Albrook | 0,90 |
| 3 | Martín Sosa (entrada y salida) | 0,90 |
| 4 | Juan Pablo II (entrada) — hacia Tinajitas | 0,50 |
| 5 | El Dorado (salida) | 0,25 |
| 6 | La Amistad (entrada rumbo a Albrook) | 0,25 |
| 7 | Patacón (entrada y salida) | 0,75 |
| 8 | Madden (hacia y desde Albrook) | **2,50** |
| 9 | Madden (hacia y desde Tinajitas) | 2,00 |
| 10 | Tinajitas (entrada y salida) | 1,50 |
| 11 | Transístmica (entrada y salida) | 0,50 |
| 12 | Villa Lucre (entrada y salida) | 1,25 |
| 13 | Brisas del Golf (entrada y salida) — desde y hacia Albrook | 1,25 |

### Corredor Este

| # | Caseta | B/ |
|---|---|---|
| 14 | Las Lajas (desde y hacia Gonzalillo) | 1,25 |
| 15 | Villalobos | 1,35 |
| 16 | Rana de Oro | 1,35 |
| 17 | C. Panamericana | 1,50 |

### Corredor Sur

| # | Caseta | B/ |
|---|---|---|
| 18 | Atlapa principal (ambos sentidos) | 1,40 |
| 19 | Vía Israel A y B (hacia y desde Paitilla) | 0,60 |
| 20 | Atlapa A y B (hacia y desde Tocumen) | 1,25 |
| 21 | Costa del Este A y B | 0,50 |
| 22 | Chanis A y B (Hipódromo) | 0,50 |
| 23 | Ciudad Radial principal (ambos sentidos) | 1,25 |
| 24 | Ciudad Radial A y B (hacia y desde Paitilla) | 0,75 |
| 25 | Ciudad Radial A y B (hacia y desde Tocumen) | 0,55 |
| 26 | Metropark A y B | 0,75 |
| 28 | Punta Pacífica A (desde Cinta Costera) | 0,35 |

**Trois réserves sur ce relevé**, à lever avant de s'en servir pour un prix
montré à quelqu'un :

- **La ligne 27 manque.** La capture passe de 26 à 28. Il y a une caseta qu'on
  n'a pas.
- **Il n'y a pas de date.** ENA révise ses tarifs ; un relevé sans date ne se
  défend pas devant quelqu'un qui conteste un prix. Il faut la version datée.
- **Seule la Clase A est lisible**, la capture est coupée à droite. C'est la
  bonne classe pour une voiture — mais **il reste à vérifier de quel côté
  tombe un pick-up** (Hilux, Ranger, D-Max). S'ils sont en Clase B, la
  catégorie 4×4 de `CONSUMO.md` a un péage différent des quatre autres.

---

## Ce que ce relevé ne donne PAS — et c'est ce qu'il nous faut

Nos six corridors sont interurbains. Ils sortent de la capitale et prennent
l'Interamericana. **Aucun ne se calcule avec le tableau ci-dessus seul.**

Ce qui manque, dans l'ordre d'importance :

1. **L'Autopista Panamá – Arraiján – La Chorrera.** C'est *la* sortie ouest,
   celle que prend tout trajet vers Chitré, Las Tablas, Santiago, Penonomé,
   Coronado et David. Sans son tarif, aucun de nos corridors ne se chiffre.
2. **Le péage du Puente Centenario**, s'il y en a un et s'il est distinct.
3. **Les péages éventuels sur l'Interamericana** au-delà de La Chorrera.
4. **La sortie nord**, pour un futur corridor vers Colón.

> Je ne les invente pas et je ne les déduis pas des chiffres urbains : un
> péage supposé entre directement dans le plafond, et un plafond faux est
> exactement le genre d'erreur qui coûte le statut juridique du produit.

---

## La décision de modélisation : un péage de référence par corridor

Un même trajet Panamá → Chitré ne paie pas la même chose selon l'endroit où le
conducteur entre et sort du corredor urbain. Deux voitures peuvent différer
d'un dollar et demi sur exactement le même parcours.

**On ne suit pas le trajet réel du conducteur.** On retient **un péage de
référence par corridor** : celui de l'itinéraire habituel entre les deux
villes. Trois raisons :

- **Le plafond est celui de la route, pas celui du carro.** C'est déjà la
  règle pour le véhicule (le sedán de référence, `OCUPACION_DE_REFERENCIA`).
  Les péages suivent la même logique, sinon deux trajets identiques
  afficheraient deux prix, et le passager ne pourrait plus comparer.
- **Le conducteur ne connaît pas ses péages à l'avance** et n'a pas à les
  saisir. Un formulaire qui demande « par quelle caseta sors-tu ? » ne sera
  jamais rempli honnêtement.
- **Un supplément au péage réel serait un tarif**, et un tarif est du
  transport. Même raisonnement que pour le détour, qui ne se facture jamais en
  supplément — il change la distance, donc le coût, donc le plafond.

Concrètement : `price_rules.toll_cents` porte le péage de référence du
corridor, et `trips.snap_toll_cents` en fige la valeur au moment de la
publication — c'est la preuve, pas un paramètre.

---

## Ce qu'il reste à faire

| | |
|---|---|
| ⛔ | Relever le tarif de **l'Autopista Arraiján – La Chorrera**, daté. |
| ⛔ | Récupérer la **ligne 27** et la **date** du barème ENA. |
| ⛔ | Vérifier la **classe des pick-ups** (A ou B). |
| ⛔ | Fixer le **péage de référence des six corridors** à partir de l'itinéraire réel. |
| ⏳ | Alimenter `price_rules.toll_cents` — même migration que `CONSUMO.md`. |

Tant que la première ligne n'est pas faite, le « 3,00 $ de péage » des
exemples de `aporte.ts` et de la documentation reste **un chiffre de travail**,
pas un relevé.
