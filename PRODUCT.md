# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primaires — les passagers.** Des gens qui se déplacent entre Ciudad de Panamá
et l'intérieur du pays : Chitré, Las Tablas, David, Santiago, Penonomé,
Coronado. Le mouvement est très concentré — vendredi après-midi vers
l'intérieur, dimanche midi vers la capitale, et massivement pendant les
festivals et le Carnaval. Aujourd'hui ils prennent le bus depuis Albrook
(bon marché, horaire fixe, terminal à terminal) ou demandent dans des groupes
WhatsApp. Ils cherchent sur leur téléphone, souvent en 4G, souvent en
déplacement.

**Secondaires — les conducteurs.** Des particuliers qui font déjà le trajet
dans leur propre voiture avec des sièges vides. Ils ne cherchent pas la
catégorie : personne ne tape « compartir gastos de mi viaje a Santiago ». Ils
n'ont aucune intention de recherche, ce qui rend leur acquisition payante et
non cumulative. Ils sont atteints à travers la demande des passagers, pas à
côté d'elle.

## Product Purpose

Coordonner des trajets interurbains à frais partagés au Panama : mettre en
relation quelqu'un qui a des sièges vides avec quelqu'un qui va au même
endroit, et plafonner l'aporte pour que le conducteur ne gagne jamais
d'argent.

Le succès n'est pas la réservation : c'est le trajet qui a **réellement eu
lieu**. Comme le paiement se fait hors plateforme, la seule preuve dont
dispose Partimos est ce que les deux parties confirment.

## Positioning

Le mécanisme qu'un concurrent ne peut pas copier honnêtement est le
**plafond calculé**. L'aporte par siège est borné par

    (km × taux du véhicule × 1,10 + péages) ÷ (sièges + 1)

où le `+ 1` est le conducteur : il paie sa part. Carro plein, il ne récupère
jamais 100 % de son coût. La contrainte est appliquée par la base de données
(`CHECK price_within_cap`), pas par une page de conditions.

C'est ce qui sépare le covoiturage à frais partagés du transport rémunéré non
autorisé. Un concurrent qui laisse le conducteur fixer son prix vend du
transport et lui faut un permis qu'il n'a pas.

## Operating Context

- **Le paiement est hors plateforme.** Espèces ou Yappy, de la main du
  passager à celle du conducteur, le jour du trajet. Aucune carte, aucun
  séquestre, aucune commission.
- **La coordination finit dans WhatsApp** aujourd'hui. C'est le comportement
  réel, pas une lacune à corriger de force.
- **Les trajets se publient sur le tard**, deux à trois jours à l'avance.
- **Le corridor est l'unité de pilotage** : une paire de villes = une page =
  un jeu de paramètres de prix. Six corridors ouverts.
- **Les trajets se découpent en segments.** Un trajet qui déclare ses villes
  de passage dessert n(n+1)/2 paires, avec un inventaire de sièges par
  tronçon. Une place vendue jusqu'à Santiago se libère après Santiago.
- **Le point de rendez-vous n'est jamais un terminal de bus** — c'est une
  condition juridique, pas une préférence.

## Capabilities and Constraints

Six règles non négociables, conditions de survie juridique :

1. **Le conducteur ne gagne jamais d'argent.** Le `+ 1` du diviseur ne se
   retire pas.
2. **La plateforme ne touche jamais l'argent.** Ni carte, ni séquestre, ni
   commission.
3. **Le prix ne suit jamais la demande.** Le calcul ne prend en entrée ni
   date, ni disponibilité, ni compteur. Aucun surge, aucune hausse au
   Carnaval.
4. **Le conducteur maîtrise son itinéraire.** Il pose ses points de passage ;
   le passager propose, il accepte ou refuse. Jamais de dispatch.
5. **Aucune promesse de revenu.** « gana dinero », « ingresos », « ganancias »
   sont interdits partout, interface et marketing compris.
6. **Aucune photo ni numéro de cédula stockés.** Vérification par prestataire
   externe ; on conserve le résultat et la référence du dossier.

Autres contraintes confirmées :

- Un détour ne se facture jamais comme supplément. Il **change la distance**,
  donc le coût, donc le plafond calculé par la même formule. L'écart est porté
  par le passager qui l'a demandé, et s'exprime en kilomètres, jamais en
  dollars.
- Maximum 4 points de prise en charge par trajet.
- Les annulations sont asymétriques : aucune pénalité financière au conducteur
  (ce serait une relation commerciale avec la plateforme) ; la sanction est
  réputationnelle.
- Les textes d'interface restent dans le dépôt, jamais dans un CMS externe.
- Aucune table `balance` mutable : les soldes se calculent.
- Le SEO est le canal principal. Concevoir d'abord pour le mobile natif serait
  une erreur de canal.
- Le site doit rendre sans Supabase : aucune page ne dépend d'un service tiers
  pour s'afficher.

## Brand Commitments

- **Le nom « Partimos » et le logo (le pin) sont fixes.** Confirmé par
  l'utilisateur.
- **Tout le reste du langage visuel est ouvert** — palette, typographie,
  composition, densité. Confirmé par l'utilisateur : le vert/bleu actuel et le
  dégradé de marque ne sont pas des engagements.
- **Registre de langue :** espagnol du Panama, tutoiement. « carro » et non
  « coche », « puesto » et non « asiento ». Pas d'émojis dans l'interface.
- **Vocabulaire imposé :** on écrit « recuperas », « aporte », « compartir
  gastos ». Jamais « gana dinero », « ingresos », « ganancias ».

## Evidence on Hand

Réel :

- Deux photographies authentiques, référencées dans `src/lib/photos.ts`
  (`carroLleno`, `panamaCity`).
- Les six corridors, leurs distances, péages, durées et prix de bus de
  référence, repris de l'amorçage de `schema.sql`.
- Les coordonnées géographiques réelles des sept villes.

**Absences que le travail futur ne doit pas combler par invention :**

- Aucun utilisateur réel, aucun témoignage, aucune citation.
- Aucun compteur réel de trajets, d'inscrits ou de conducteurs.
- Aucune photo de conducteur, aucun visage.
- Aucune couverture presse, aucun partenariat.
- Les trajets affichés sont des données de démonstration déterministes, et
  l'interface le dit tant que `NEXT_PUBLIC_SUPABASE_URL` n'est pas renseignée.
  Retirer cette mention serait un mensonge, pas une maquette.
- Les prix de bus servent de comparaison éditoriale, jamais de base de tarif.

## Product Principles

1. **Le plafond est le produit.** Toute surface qui montre un montant doit
   pouvoir montrer d'où il sort. Le calcul visible est l'argument, pas une
   note de bas de page.
2. **La demande est le carburant de l'offre.** Une recherche vide n'est pas un
   échec, c'est un signal à retourner aux conducteurs. C'est le seul canal
   d'acquisition d'offre qui ne se paie pas à l'unité.
3. **Le trajet se mesure, il ne se suppose pas.** Le paiement étant hors
   plateforme, la clôture mutuelle est l'instrument de mesure du produit, pas
   une fonctionnalité de confort.
4. **La survie juridique passe avant la conversion.** Tout mot ou mécanisme
   qui se lit comme du transport rémunéré est retiré, même s'il convertit
   mieux.
5. **Le corridor est la porte d'entrée, pas l'accueil.** L'essentiel du trafic
   arrive par une recherche de trajet précise. La page de corridor doit tenir
   seule.

## Accessibility & Inclusion

- WCAG 2.1 niveau AA tenu et vérifié automatiquement (axe-core) sur les pages
  livrées. Aucune violation A/AA acceptée en l'état.
- Public sur Android d'entrée et de milieu de gamme, en données mobiles : la
  performance est ici une question d'accessibilité, pas de confort.
- Cibles tactiles et navigation clavier vérifiées ; l'interface doit rester
  utilisable à une main, en déplacement.
