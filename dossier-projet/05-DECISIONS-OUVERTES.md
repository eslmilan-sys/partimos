# 05 · Ce que personne n'a encore tranché

Trois questions. Aucune n'est technique : ce sont des **décisions de
produit**, et elles bloquent des choses concrètes. Elles sont listées ici pour
que ni toi, ni ton associé, ni Claude ne les « corrige » chacun de son côté.

---

## ✅ 1 · Le taux au kilomètre — **tranché le 24-08-2026**

C'est la **consommation** qui fait foi, pas un taux au kilomètre. La colonne
`vehicle_categories.rate_per_km_cents` (22/25/32) sort à la prochaine
migration.

L'argument, sur Panamá → Chitré avec 3 passagers : au taux au kilomètre, le
conducteur encaisse 53,82 $ pour 26,81 $ réellement dépensés — **27 $ de plus
qu'en partant**. Un taux de 22–32 c/km est un coût de possession complet
(dépréciation, assurance, entretien) qu'il paie voiture vide ou pleine.

Cinq catégories portent désormais la consommation — compacto 6,5 · sedán 7,5 ·
SUV 9,5 · 4×4 12,0 · híbrido 4,5 L/100 km — et le prix du carburant devient
une donnée datée. Détail complet, liste des modèles et ce qui reste à migrer :
`supabase/CONSUMO.md`.

**Ce qui reste ouvert derrière cette décision**, et qui retient la migration :

- **Les péages des six corridors.** Le barème des autoroutes urbaines de la
  capitale est relevé (`supabase/PEAJES.md`), mais il manque **l'Autopista
  Arraiján – La Chorrera** : c'est la sortie ouest, celle que prend *tout*
  trajet vers Chitré, Santiago, Penonomé, Coronado, Las Tablas et David. Sans
  elle, aucun de nos corridors ne se chiffre.
- **Le prix du carburant.** Le 1,27 $/L retenu vient d'un résumé Google, qui
  donne le même prix à l'essence et au diesel — ce qui n'est jamais le cas. À
  relever chez la Secretaría Nacional de Energía, séparément pour le 91, le 95
  et le diesel.

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

Mais **deux autres sources disent 5 % / 8 %** : la base de données (migration
`0018_tarifa_5_8`, contrainte `fee_is_fixed_pct`) et la fiche de règles du
projet (`.claude/skills/partimos-reglas`), qui est le fichier chargé avant
toute modification touchant au prix.

**Donc c'est deux contre un**, et le « un » est un document, pas un mécanisme.
Le plus probable est que 2,5/5 soit la décision d'origine et 5/8 une révision
que `PAGOS.md` n'a jamais enregistrée. À vérifier avant de trancher — mais
c'est `PAGOS.md` qu'il faut aligner, pas la base.

**Ce que ça bloque.** Rien pour l'instant — le paiement en ligne n'est pas
branché. Mais ça bloquera le jour où il le sera.

**Ce qu'il faut décider.** Le taux réel, une fois les coûts des prestataires
confirmés par un devis, pas par une estimation. Et faire valider la structure
entière par un avocat panaméen **avant le premier encaissement** : c'est le
point où « on ne touche jamais l'argent » devient une phrase à défendre.

Trois invariants ne bougent pas quel que soit le taux retenu : le conducteur
reçoit son aporte **complet** (la tarifa s'ajoute, elle ne se déduit jamais) ;
l'**espèce reste toujours disponible et gratuite** ; **aucun pourcentage ne
varie** avec la demande, la date ou la rareté.

---

## Ce qui n'est pas une décision ouverte

Pour éviter de rouvrir ce qui est clos :

- **Les six règles non négociables.** Tranchées. Voir `02-PRODUIT.md`.
- **La base du calcul de l'aporte** : la consommation, pas un taux au
  kilomètre. Tranchée le 24-08-2026. Voir `supabase/CONSUMO.md`.
- **Le Sistema v6.** Tranché le 21-08-2026. Le champ rouge héros est mort.
- **Le nom et le pin.** Fixes.
- **La règle du point** (sans coordonnées, pas de lieu). Tranchée le
  24-08-2026.
- **La règle des deux personnes** pour rendre public un lieu écrit par un
  utilisateur. Tranchée.
- **Passer le dépôt en privé.** Décidé : *après* la phase de test entre
  proches, pas avant.
