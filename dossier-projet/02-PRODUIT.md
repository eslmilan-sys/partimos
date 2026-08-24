# 02 · Le produit — les règles

> Ce fichier résume `PRODUCT.md` du dépôt. En cas de désaccord entre les deux,
> `PRODUCT.md` fait foi.

## Les six règles non négociables

Ce ne sont pas des préférences de design. Ce sont des **conditions de survie
juridique** : chacune est ce qui empêche de lire Partimos comme du transport
rémunéré non autorisé.

### 1 · Le conducteur ne gagne jamais d'argent

Le `+ 1` du diviseur — le conducteur paie sa part — **ne se retire pas**, pas
même « juste pour le lancement ». La base l'impose avec `CHECK
price_within_cap`.

### 2 · La plateforme ne touche jamais l'argent du trajet

Ni carte, ni séquestre, ni commission **sur le transport**. Le paiement va de
la main à la main, en espèces ou par Yappy. (La tarifa de servicio prévue
porte sur le service de réservation, pas sur le trajet, et le conducteur
touche son aporte complet — voir `01-PROJET.md`.)

### 3 · Le prix ne suit jamais la demande

Aucun surge, aucune hausse au Carnaval. Le calcul ne prend en entrée **ni
date, ni disponibilité, ni compteur**. C'est vérifiable en lisant la fonction :
si elle recevait une date, la règle serait déjà cassée.

### 4 · Le conducteur maîtrise son itinéraire

Il pose ses points de passage. Le passager **propose** un point ; le
conducteur accepte ou refuse. **Jamais de dispatch** — un algorithme qui
assigne une course, c'est une relation d'employeur.

### 5 · Aucune promesse de revenu

« gana dinero », « ingresos », « ganancias » sont **interdits partout** :
interface, marketing, courriels, publicités. On écrit « recuperas »,
« aporte », « compartir gastos ».

*(Nier explicitement — « nadie gana dinero con esto » — est le propos inverse
et reste permis.)*

### 6 · Aucune photo ni numéro de cédula stockés

La vérification d'identité passe par un prestataire externe (Didit) sur son
propre parcours. Partimos ne garde que **le verdict** et **la référence du
dossier**. Ni l'image du document, ni le selfie, ni le numéro.

## Le calcul de l'aporte

```
essence     = km × (litres/100 km du véhicule ÷ 100) × prix du litre
coût total  = essence × 1,10 + péages
plafond/pl. = coût total ÷ (occupants + 1)
```

- `1,10` couvre l'usure au-delà du carburant, et **rien d'autre**.
- `+ 1` : le conducteur est un passager de son propre trajet.
- La consommation vient de la catégorie du véhicule ; le prix du litre est une
  donnée datée, relevée sur la publication officielle panaméenne.

**Tranché le 24-08-2026 : le coût part de la consommation, jamais d'un taux au
kilomètre.** L'argument tient en une ligne — Panamá → Chitré, 3 passagers :

| | Le conducteur encaisse | Il a dépensé | Écart |
|---|---|---|---|
| Taux au km (25 c) | 53,82 $ | 26,81 $ | **+ 27,01 $** |
| Consommation (sedán) | 24,00 $ | 26,81 $ | − 2,81 $ |

Un taux de 22–32 c/km est un coût de possession complet — dépréciation,
assurance, entretien — que le conducteur paie voiture vide ou pleine. Le faire
rembourser par les passagers, c'est leur facturer ce qu'ils ne causent pas.
**La règle nº 1 ne se juge pas sur la formule, elle se juge sur le billet dans
la poche.**

Les cinq catégories, en litres aux 100 km : **compacto 6,5 · sedán 7,5 ·
SUV 9,5 · 4×4 12,0 · híbrido 4,5**. Le sedán est le véhicule de référence du
plafond : qui conduit un 4×4 a un coût plus haut, mais **ne facture pas sa
camionnette au passager**. Le détail et la liste des modèles sont dans
`supabase/CONSUMO.md`.

> ⚠️ Le prix du carburant en vigueur dans le code (0,80 $/L) est faux : le
> vrai prix panaméen tourne autour de **1,27 $/L**. Tous les montants affichés
> aujourd'hui sont donc environ un tiers trop bas — Panamá → Chitré passe d'un
> aporte de 6 $ à **8 $**. La correction est décidée, pas encore migrée.

**Le détour ne se facture jamais en supplément.** Il change la distance, donc
le coût, donc le plafond — par la même formule. L'écart s'exprime en
kilomètres, jamais en dollars. C'est important : un supplément au détour
serait un tarif, et un tarif est du transport.

## Les autres contraintes tenues

- **Maximum 4 points de prise en charge par trajet.**
- **Le point de rendez-vous n'est jamais un terminal de bus.** Condition
  juridique. *(Le design actuel dessine pourtant « Albrook · bahía 4 » —
  conflit ouvert, voir `05-DECISIONS-OUVERTES.md`.)*
- **Les annulations sont asymétriques.** Aucune pénalité financière au
  conducteur : ce serait une relation commerciale avec la plateforme. La
  sanction est réputationnelle.
- **Aucune table de solde mutable.** Les soldes se calculent à partir des
  mouvements ; on n'écrit jamais un chiffre qu'on ne peut pas reconstituer.
- **Les textes d'interface vivent dans le dépôt**, jamais dans un CMS externe.
- **Le site rend sans Supabase.** Aucune page publique ne dépend d'un service
  tiers pour s'afficher — c'est ce qui garde le SEO intact.

## L'unité de pilotage : le corridor

Une paire de villes = une page = un jeu de paramètres de prix. Six corridors
ouverts aujourd'hui.

Un trajet qui déclare ses villes de passage dessert **n(n+1)/2 paires**, avec
un inventaire de sièges **par tronçon** : une place vendue jusqu'à Santiago se
libère après Santiago. C'est ce qui fait qu'un trajet Panamá → David rend
aussi service à quelqu'un qui va de Penonomé à Santiago.

Depuis août 2026, un trajet peut aussi être en **route libre** : origine et
destination écrites au clavier, sans corridor préétabli.

## Les quatre principes qui tranchent les arbitrages

1. **Le plafond est le produit.** Toute surface qui montre un montant doit
   pouvoir montrer d'où il sort. Le calcul visible *est* l'argument, pas une
   note de bas de page.
2. **La demande est le carburant de l'offre.** Une recherche vide est un
   signal à retourner aux conducteurs — le seul canal d'acquisition d'offre
   qui ne se paie pas à l'unité.
3. **Le trajet se mesure, il ne se suppose pas.** La clôture mutuelle est
   l'instrument de mesure, pas un confort.
4. **La survie juridique passe avant la conversion.** Tout mot ou mécanisme
   qui se lit comme du transport rémunéré est retiré, **même s'il convertit
   mieux**.

## Ce qu'on ne comble jamais par invention

Le dépôt le note explicitement, et ça vaut aussi pour toute présentation
faite à un tiers :

- Aucun utilisateur réel, aucun témoignage, aucune citation.
- Aucun compteur réel de trajets, d'inscrits ou de conducteurs.
- Aucune photo de conducteur, aucun visage.
- Aucune couverture presse, aucun partenariat.
- Les trajets affichés dans la démo sont des données déterministes, et
  l'interface **le dit**. Retirer cette mention serait un mensonge, pas une
  maquette.
- Les prix de bus servent de comparaison éditoriale, **jamais** de base de
  tarif.
