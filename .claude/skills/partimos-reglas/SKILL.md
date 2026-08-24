---
name: partimos-reglas
description: Les règles non négociables de Partimos et les invariants du calcul de l'aporte. À charger AVANT d'écrire ou de modifier quoi que ce soit qui touche au prix, aux sièges, aux annulations, à l'identité ou aux textes de l'interface. Se déclenche sur — aporte, precio, tope, plafond, cap, price, siège, seat, puesto, détour, desvío, segment, parada, annulation, cancelación, cédula, KYC, vérification, wording d'un libellé en espagnol.
---

# Partimos — ce qui ne se négocie pas

Ce projet a une contrainte inhabituelle : **la moitié de ses règles produit sont
des conditions de survie juridique**, pas des préférences. Elles séparent le
covoiturage à frais partagés du transport rémunéré non autorisé. Aucune ne se
contourne, même temporairement, même en développement, même « juste pour la
démo ».

Si une demande entre en conflit avec l'une d'elles, **dis-le en une phrase,
propose la version conforme qui produit le même effet, et construis celle-là.**
Ne l'implémente pas en silence, et ne refuse pas non plus en bloc.

## Les six règles

**R1 — Le conducteur ne gagne jamais d'argent.**
L'aporte par siège est plafonné par
`(km × litres-aux-100 ÷ 100 × prix du litre × 1,10 + péages) ÷ (occupants + 1)`.

**Le coût part de la consommation réelle, jamais d'un « taux au kilomètre ».**
Tranché le 24-08-2026 (`supabase/CONSUMO.md`). Un taux de 22–32 c/km est un
coût de possession complet — dépréciation, assurance, entretien — que le
conducteur paie voiture vide ou pleine ; le lui faire rembourser par ses
passagers lui rapporterait 27 $ sur un Panamá → Chitré, et R1 tomberait sans
que la formule ait l'air fausse. **R1 ne se juge pas sur la formule, elle se
juge sur le billet dans la poche.** Le `× 1,10` couvre l'usure et n'est jamais
remplacé par de la dépréciation. Cinq catégories portent la consommation :
compacto 6,5 · sedán 7,5 · SUV 9,5 · 4×4 12,0 · híbrido 4,5 L/100 km.
Le prix du carburant est une donnée datée relevée sur la publication
officielle panaméenne, jamais une constante du code. Les péages sont un
**péage de référence par corridor** (`supabase/PEAJES.md`), pas le trajet réel
du conducteur — sinon deux voitures afficheraient deux prix pour la même route.
Le `+1` est le conducteur : il paie sa part. Voiture pleine, il ne récupère
jamais 100 % de son coût. Retirer le `+1` casse tout le modèle.
Autorité finale : la contrainte `CHECK price_within_cap` en base, pas le code
applicatif.

**R2 — La plateforme ne touche jamais l'aporte du conducteur.**
(Amendée le 2026-08-12 par décision du propriétaire, deux fois.) Le paiement
EN LIGNE existe comme OPTION du passager, avec trois canaux présentés dans
CET ORDRE : Yappy dans l'app (recommandé), tarjeta dans l'app, efectivo en
dernier. La tarifa de servicio est FIXE PAR CANAL — 5 % Yappy, 8 %
tarjeta, 0 efectivo — parce qu'elle suit le coût du canal (Yappy commerçant
~1 %, processeur carte ~3,5–4 %), jamais la demande. Elle rémunère le
service digital de réservation (cobro protégé, comprobante, remboursements),
jamais le transport. Trois invariants inviolables : le conducteur reçoit son
aporte COMPLET (la tarifa est en sus, jamais déduite) ; payer en EFECTIVO
(ou Yappy directo au conducteur) reste toujours disponible et gratuit ;
aucun pourcentage ne varie avec la demande, la date ou la rareté. Autorité :
contraintes `fee_only_in_app` (0009) et `fee_is_fixed_pct` par canal (0010).
Ne jamais : déduire la tarifa de l'aporte, la rendre obligatoire, ou la
faire varier autrement que par canal.

**R3 — Le prix ne suit jamais la demande.**
`computePriceCap()` ne prend en entrée ni date, ni disponibilité, ni compteur.
Aucune tarification dynamique, aucune hausse au Carnaval, aucun surge sur le
dernier siège.

**R4 — Le conducteur maîtrise son itinéraire.**
Il pose ses points de passage ; le passager choisit ou propose, il accepte ou
refuse. Jamais de dispatch, jamais d'itinéraire imposé.

**R5 — Aucune promesse de revenu.**
Interdits partout — interface, marketing, libellés : « gana dinero »,
« ingresos », « ganancias ». On écrit « recuperas », « aporte »,
« compartir gastos ».

**R6 — Aucune photo de cédula stockée.**
La vérification passe par un prestataire externe. On conserve le résultat et la
référence du dossier. Jamais l'image, jamais le numéro.

## Le piège qui revient tout le temps : le « supplément »

Quelqu'un demandera de facturer la prise en charge à domicile. **Non.** Un
service de ramassage tarifé est du transport commercial.

La version conforme produit le même effet : le détour **change la distance**,
donc le coût réel, donc le plafond calculé par la même formule. L'écart est
porté par le passager qui l'a demandé — jamais par le conducteur, sinon il perd
de l'argent à rendre service et cesse d'accepter.

L'affichage dit « ton point ajoute 8,4 km », jamais « recogida a domicilio :
+2 $ ». Même montant, nature juridique opposée.

Garde-fous : refus au-delà de +15 % de kilométrage ou +15 minutes ; au-delà de
10 minutes de décalage à l'arrivée, les passagers déjà réservés sont prévenus
et peuvent annuler sans frais.

## Segments et arrêts intermédiaires

Un trajet qui déclare ses villes de passage dessert n(n+1)/2 paires. Deux
invariants, testés dans `src/lib/segments.test.ts` :

1. **Le prix est celui du segment**, pas du trajet entier. Même formule, appliquée
   aux kilomètres réellement occupés, `+1` compris. Découper un trajet ne doit
   jamais le rendre plus cher que d'une traite.
2. **Les sièges sont un inventaire par tronçon.** Une place vendue Panamá →
   Santiago se libère après Santiago. C'est le **tronçon le plus chargé** du
   segment demandé qui commande — sommer les réservations, ou ne regarder que le
   tronçon de départ, laisse passer une surréservation en plein milieu.

## Annulations — asymétriques par construction

Passager : 100 % au-delà de 24 h ; l'aporte remboursé entre 24 h et 2 h ; 50 %
retenu en deçà. Plus deux annulations sans conséquence par semestre, sans
justification demandée.

Conducteur : le passager est **toujours** intégralement remboursé, plus 20 % en
crédit si le préavis est inférieur à 6 h. **Jamais de pénalité financière au
conducteur** — ce serait une relation commerciale entre la plateforme et lui.
La sanction est réputationnelle : trois annulations tardives sur 90 jours
bloquent la publication.

La retenue n'est versée au conducteur que si le siège n'est pas revendu
(`cancellations.seat_resold`), sinon il serait payé deux fois.

## À ne jamais faire

- Déduire quoi que ce soit de l'aporte du conducteur, ou rendre le paiement en ligne obligatoire
- Retirer le `+1` du diviseur
- Faire varier le prix selon la demande ou la rareté
- Stocker des images de cédula
- Écrire « gana dinero » où que ce soit
- Utiliser un terminal de bus comme point de rendez-vous
- Autoriser plus de 4 points de prise en charge par trajet
- Mettre les textes de l'interface dans un CMS externe
- Créer une table `balance` mutable — les soldes se calculent
- Concevoir d'abord pour le mobile natif : le SEO est le canal principal

## Vérifier avant de livrer

```bash
npm test      # table de référence du §7 + invariants des segments
npm run lint
npm run build
```

Les tests de `pricing.test.ts` reproduisent la table du brief **au centime**.
S'ils cassent après une modification du calcul, c'est la modification qui est
fausse, pas le test.

## Registre de langue

Espagnol du Panama, tutoiement. « carro » et non « coche », « puesto » et non
« asiento ». Pas d'émojis dans l'interface — icônes SVG au trait, 1,9 px.
