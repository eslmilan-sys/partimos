# Le carburant, les véhicules et ce que ça coûte

> Décidé le 24-08-2026. Ce fichier ferme le conflit nº 1 de `CLAUDE.md` :
> « la formule et la table ne concordent pas ». **C'est la formule qui gagne**,
> et la colonne `rate_per_km_cents` est à retirer.

## La décision, et l'argument qui l'a tranchée

L'aporte se calcule à partir de **ce que le trajet consomme réellement** :

```
essence  = km × (litres/100 km du véhicule ÷ 100) × prix du litre
coût     = essence × 1,10 + péages
plafond  = coût ÷ (occupants + 1)
```

Pas à partir d'un « taux au kilomètre » de 22 à 32 centimes. Voici pourquoi,
en une seule ligne de calcul.

Panamá → Chitré, 250 km, 3 passagers, essence à 1,27 $/L :

| | Ce que le conducteur encaisse | Ce qui sort de sa poche | Écart |
|---|---|---|---|
| **Taux au km (25 c)** | 53,82 $ | 26,81 $ | **+ 27,01 $** |
| **Consommation (sedán)** | 24,00 $ | 26,81 $ | − 2,81 $ |

Un taux de 22–32 c/km est un **coût de possession complet** : dépréciation,
assurance, pneus, entretien. Des coûts réels — mais qu'il paie *de toute
façon*, voiture vide ou pleine. Les faire payer par les passagers, c'est leur
facturer ce qu'ils ne causent pas, et c'est comme ça que le conducteur rentre
chez lui avec vingt-sept dollars de plus qu'en partant.

**La règle nº 1 ne se juge pas sur la formule, elle se juge sur le billet dans
la poche.** C'est ce tableau-là qu'on présenterait à l'ATTT.

Le `× 1,10` est ce qui couvre l'usure. Il ne bouge pas, et il n'est pas
remplacé par de la dépréciation : c'est exactement la porte par laquelle les
vingt-sept dollars reviendraient.

---

## Le prix du carburant

**Ce n'est pas une constante du code, c'est une donnée datée.**

Le Panama régule les prix des carburants et les publie **au gallon**, par
arrêté, à intervalle régulier. On stocke donc **le prix au gallon tel qu'il
est publié** — pour que le chiffre de la base soit celui du bulletin officiel,
littéralement vérifiable par n'importe qui — et la conversion en litres se
fait dans le calcul (1 gallon US = 3,785411784 L).

| Valeur de travail | 24-08-2026 |
|---|---|
| Essence, au litre | **1,27 $** |
| Essence, au gallon | **≈ 4,82 $** |

> ⚠️ **Ces chiffres viennent d'un résumé Google, pas d'une source officielle.**
> Avant le premier prix affiché à un vrai passager, il faut les relever chez
> la Secretaría Nacional de Energía / ACODECO, **séparément par type** — 91,
> 95 et diesel n'ont pas le même prix, contrairement à ce que dit le résumé.
> Tant que ce n'est pas fait, le 1,27 $ est une hypothèse de travail.

**Ce que ça change par rapport à la doc précédente.** L'ancienne valeur était
0,80 $/L. Le vrai prix est 59 % plus haut, donc **tous les montants montent
d'environ un tiers** :

| Panamá → Chitré, sedán, 250 km, 3 $ de péage | À 0,80 $/L | À 1,27 $/L |
|---|---|---|
| Coût du trajet | 20,60 $ | **29,19 $** |
| Plafond de la route | 7 $ | **10 $** |
| Aporte proposé, 3 places | 6 $ | **8 $** |

À vérifier avant de publier quoi que ce soit : **le prix du bus sur le même
corridor**. À 8 $, l'aporte s'approche du billet de bus, et l'argument
« moins cher que le bus » ne tient peut-être plus. Ce n'est pas une raison de
baisser le calcul — ce serait mentir sur le coût — mais c'est une raison de
savoir ce qu'on vend.

**Une garde à ne pas oublier.** Le prix se met à jour **sur un calendrier**,
jamais au moment d'une recherche. Un aporte qui bouge à l'approche du Carnaval
ressemblera à du surge même si la cause est le baril, et la règle nº 3 se juge
sur l'apparence autant que sur le mécanisme.

---

## Les cinq catégories

Le conducteur choisit **son modèle**. Le modèle appartient à **une catégorie**.
C'est la catégorie qui porte la consommation utilisée dans le calcul.

**Pourquoi pas une consommation par modèle ?** Parce qu'il faudrait sourcer
une centaine de chiffres de consommation, et qu'aucun n'est vérifiable par
l'utilisateur. Cinq valeurs assumées et expliquées se défendent devant un
régulateur ; cent chiffres approximatifs, non. Le modèle sert à la
reconnaissance — « un Hilux », pas « un 4×4 » — et au bon rattachement.

| Catégorie | L/100 km | Ce que c'est |
|---|---|---|
| **Compacto** | **6,5** | Citadines et petites berlines. Picanto, Yaris, Rio. |
| **Sedán** | **7,5** | La berline familiale. Corolla, Sentra, Civic. **Le véhicule de référence du plafond.** |
| **SUV** | **9,5** | Crossovers et SUV deux roues motrices. CR-V, Tucson, Kicks. |
| **4×4** | **12,0** | Pick-ups et tout-terrain. Hilux, Prado, Ranger. |
| **Híbrido** | **4,5** | Hybrides essence-électrique. Prius, Corolla Hybrid, Niro. |

### Deux précisions qui comptent

**Ce sont des consommations sur route, pas en ville.** Un trajet interurbain
se fait sur l'Interamericana à vitesse stable : la voiture consomme moins
qu'en ville. Prendre le chiffre urbain gonflerait le coût, donc le plafond,
donc ce que le conducteur encaisse. **Dans le doute, on prend la valeur
basse** — l'erreur de ce côté-là coûte quelques centimes au conducteur ;
l'erreur de l'autre côté coûte le statut juridique du produit.

**Le plafond est celui de la route, pas celui du carro.** Le plafond se calcule
toujours avec le **sedán de référence** et 3 occupants payants. Quelqu'un qui
conduit un 4×4 a un coût plus élevé et un aporte calculé plus haut — mais il
ne peut pas facturer sa camionnette au passager. C'est déjà le comportement de
`OCUPACION_DE_REFERENCIA` dans `app/src/dominio/aporte.ts`, et ça ne change pas.

### Le conducteur peut ajuster

Il peut corriger la consommation de son véhicule, **entre 4 et 16 L/100 km**.
Sans bornes, quelqu'un déclare 30 et on a réinventé le prix libre.

---

## Les modèles

La liste sert à ce que le conducteur se reconnaisse, et à le rattacher à la
bonne catégorie sans qu'il ait à savoir ce qu'est un « crossover ». Elle
couvre ce qui roule vraiment au Panama. Elle n'a pas à être exhaustive : un
champ « otro » renvoie au choix direct de la catégorie.

### Compacto — 6,5 L/100 km

Chevrolet Spark · Chery QQ · Changan Alsvin · Honda Fit · Hyundai Accent ·
Hyundai Grand i10 · Kia Picanto · Kia Rio · Kia Soluto · Mazda 2 ·
Mitsubishi Mirage · Nissan March · Nissan Versa · Suzuki Alto ·
Suzuki Celerio · Suzuki Swift · Toyota Yaris · Volkswagen Gol

### Sedán — 7,5 L/100 km

Chery Arrizo · Chevrolet Cavalier · Chevrolet Optra · Honda Accord ·
Honda Civic · Hyundai Elantra · JAC J4 · Kia Cerato · Kia Forte ·
Mazda 3 · Mitsubishi Lancer · Nissan Altima · Nissan Sentra ·
Toyota Camry · Toyota Corolla · Volkswagen Jetta

### SUV — 9,5 L/100 km

Chevrolet Tracker · Chery Tiggo · Ford Escape · Great Wall Haval H6 ·
Honda CR-V · Honda HR-V · Hyundai Creta · Hyundai Santa Fe ·
Hyundai Tucson · Kia Seltos · Kia Sportage · Mazda CX-5 · Mazda CX-30 ·
Mitsubishi Outlander · Nissan Kicks · Nissan X-Trail · Subaru Forester ·
Suzuki Vitara · Toyota Corolla Cross · Toyota RAV4 · Volkswagen Tiguan

### 4×4 — 12,0 L/100 km

Chevrolet Colorado · Chevrolet Silverado · Ford Explorer · Ford F-150 ·
Ford Ranger · Great Wall Poer · Isuzu D-Max · Jeep Wrangler ·
Mazda BT-50 · Mitsubishi L200 · Mitsubishi Montero · Nissan Frontier ·
Nissan Patrol · Suzuki Jimny · Toyota 4Runner · Toyota Fortuner ·
Toyota Hilux · Toyota Land Cruiser · Toyota Prado

### Híbrido — 4,5 L/100 km

Ford Escape Hybrid · Honda Insight · Hyundai Ioniq · Kia Niro ·
Toyota Camry Hybrid · Toyota Corolla Cross Hybrid · Toyota Corolla Hybrid ·
Toyota Prius · Toyota RAV4 Hybrid

---

## Deux cas que la liste ne couvre pas

**L'électrique.** BYD, et de plus en plus. Une voiture électrique ne consomme
pas de litres : la formule ne s'y applique pas telle quelle. Il faudrait un
prix du kWh et une consommation en kWh/100 km — c'est faisable, ce n'est pas
fait, et ce n'est pas urgent tant que le parc reste petit. **En attendant, un
conducteur électrique n'a pas de catégorie honnête.**

**Le van.** Hiace, Carnival, Odyssey. Ça compte pour du covoiturage — ce sont
les véhicules à 7 places. Mais un van transportant sept payants ressemble
beaucoup à un transport collectif, et c'est précisément la silhouette qu'on ne
veut pas avoir. **À trancher avec un avocat avant de l'ouvrir**, pas dans une
migration.

---

## Ce que ça change dans la base et le code

| Où | Quoi |
|---|---|
| `vehicle_categories` | `rate_per_km_cents` **retiré**, remplacé par `consumo_litros_100km numeric(4,1)`. Les cinq codes : `compacto`, `sedan`, `suv`, `4x4`, `hibrido`. |
| `fuel_prices` *(nouvelle)* | `fuel_type` (91/95/diesel), `precio_galon_centavos`, `vigente_desde`, `fuente`. Versionnée, jamais modifiée en place — comme `price_rules`. |
| `vehicle_models` *(nouvelle)* | `marca`, `modelo`, `category_code`. Alimente la liste de choix. |
| `vehicles` | Un `model_id` optionnel, et une consommation ajustée bornée 4–16. |
| `aporte.ts` | `CONSUMO_L_100KM` passe de 3 à 5 entrées ; `PRECIO_GASOLINA_CENTAVOS_POR_LITRO` **disparaît** — le prix arrive en paramètre depuis la base. |
| `trips.snap_rate_per_km_cents` | Reste : c'est une **preuve figée**, pas un paramètre. On y écrit le taux effectif calculé, pour pouvoir reconstituer un prix trois ans plus tard. |

Rien de tout ça n'est encore écrit. Ce fichier est la décision ; la migration
suit quand les péages réels des six corridors seront connus, parce qu'ils
entrent dans le même calcul et qu'on ne fait pas deux migrations pour une
formule. **Les péages ont leur propre fichier : `PEAJES.md`.**

Attention en le lisant : au Panama, « corredor » désigne une autoroute urbaine
à péage de la capitale (Norte, Este, Sur) ; chez nous, un corridor est une
**paire de villes**. Ce ne sont pas les mêmes routes, et confondre les deux
mettrait les péages urbains de Panamá dans un trajet vers David.
