# 05 · Ce que personne n'a encore tranché

Quatre questions. Aucune n'est technique : ce sont des **décisions de
produit**, et elles bloquent des choses concrètes. Elles sont listées ici pour
que ni toi, ni ton associé, ni Claude ne les « corrige » chacun de son côté.

---

## 1 · Le taux au kilomètre — la formule et la table se contredisent

**Le fait.** `PRODUCT.md` pose la formule
`(km × taux du véhicule × 1,10 + péages) ÷ (sièges + 1)`, avec un taux dérivé
de la consommation : 8 L/100 km × 0,80 $/L = **6,4 centimes/km**. C'est ce que
calcule le code (`app/src/dominio/aporte.ts`), et ça donne Panamá → Chitré à
**6 $** d'aporte.

Mais la table `vehicle_categories.rate_per_km_cents` contient **22 / 25 / 32**.
Avec ces valeurs-là, le même trajet donnerait **17,94 $**.

**Ce que ça bloque.** Le prix affiché. C'est-à-dire le produit.

**Ce qu'il faut décider.** Laquelle des deux est juste. Trois pistes :
6,4 c/km est le **carburant seul** ; 22–32 c/km ressemble à un **coût de
possession complet** (carburant + usure + assurance + dépréciation) ; le
`× 1,10` de la formule suggère qu'on voulait le carburant *plus* une petite
usure. Si c'est le carburant qui fait foi, la table est à corriger ; si c'est
le coût complet, c'est la formule et tous les exemples de la doc.

> ⚠️ Point d'attention juridique : plus le taux est haut, plus le plafond est
> haut, et plus le conducteur s'approche de rentrer dans ses frais. La règle
> nº 1 tient tant que le `+ 1` reste — mais un taux gonflé est exactement ce
> qu'un régulateur regarderait.

---

## 2 · Le facteur de route — 1,3 ou 1,65 ?

**Le fait.** Pour un trajet en route libre (origine et destination écrites au
clavier, hors corridor préétabli), on ne connaît que la **distance à vol
d'oiseau** entre deux points. On la multiplie par un facteur pour approcher la
distance réelle par la route.

Panamá → Chitré : **151 km à vol d'oiseau**, **250 km par la route**. Soit un
facteur réel de **1,65** sur ce corridor-là. Un facteur générique de 1,3 —
courant ailleurs dans le monde — sous-estimerait ici de 35 %.

**Ce que ça bloque.** L'ouverture des trajets en route libre. Un facteur trop
bas rend le plafond trop bas, et le conducteur paie plus que sa part.

**Ce qu'il faut décider.** Un facteur unique (et lequel), ou un facteur par
corridor mesuré sur les six corridors connus. La deuxième option est plus
juste et pas beaucoup plus chère.

---

## 3 · Les terminaux de bus — le produit et le design se contredisent

**Le fait.** `PRODUCT.md` écrit : « le point de rendez-vous n'est jamais un
terminal de bus », et en fait une **condition juridique** — se poster à un
terminal, c'est se présenter comme un transporteur.

Or le design dessine « Albrook · bahía 4 » et « Chitré · Terminal », et la
semence de la base a mis **six terminaux en production**. Autrement dit : le
design et le produit se contredisent, **et la production suit le design**.

**Ce que ça bloque.** L'envoi du lien de test à qui que ce soit. C'est écrit
noir sur blanc dans `CLAUDE.md`.

**Ce qu'il faut décider.** Soit on retire les terminaux (de la base, du design
et des données de démonstration), soit on assume qu'ils sont acceptables et on
retire la règle de `PRODUCT.md` — après avis d'un avocat panaméen. **Ce qu'on
ne peut pas faire, c'est laisser les deux textes coexister.**

---

## 4 · Le taux de la tarifa de servicio — 2,5/5 % ou 5/8 % ?

**Le fait.** `supabase/PAGOS.md` décide **2,5 %** sur Yappy et **5 %** sur
carte, avec un raisonnement de coût : Yappy commerçant coûte ~1 %, un
processeur carte ~3,5–4 %, la marge du service est la même (~1,5 point) et le
canal recommandé est aussi le moins cher pour le passager.

Mais la base de données impose **5 % / 8 %** (migration `0018_tarifa_5_8`).

**Ce que ça bloque.** Rien pour l'instant — le paiement en ligne n'est pas
branché. Mais ça bloquera le jour où il le sera, et la contrainte est déjà
écrite dans la base.

**Ce qu'il faut décider.** Le taux réel, une fois les coûts des prestataires
confirmés par un devis, pas par une estimation. Et faire valider la structure
entière par un avocat panaméen **avant le premier encaissement** : c'est le
point où « on ne touche jamais l'argent » devient une phrase à défendre.

---

## Ce qui n'est pas une décision ouverte

Pour éviter de rouvrir ce qui est clos :

- **Les six règles non négociables.** Tranchées. Voir `02-PRODUIT.md`.
- **Le Sistema v6.** Tranché le 21-08-2026. Le champ rouge héros est mort.
- **Le nom et le pin.** Fixes.
- **La règle du point** (sans coordonnées, pas de lieu). Tranchée le
  24-08-2026.
- **La règle des deux personnes** pour rendre public un lieu écrit par un
  utilisateur. Tranchée.
- **Passer le dépôt en privé.** Décidé : *après* la phase de test entre
  proches, pas avant.
