# 01 · Le projet

## En une phrase

**Partimos met en relation quelqu'un qui a des sièges vides sur un trajet
interurbain au Panama avec quelqu'un qui va au même endroit, et plafonne la
participation pour que le conducteur ne gagne jamais d'argent.**

## Le problème, tel qu'il se vit

Panama a une géographie simple : une capitale, et l'intérieur du pays. Les
gens font l'aller-retour entre Ciudad de Panamá et Chitré, Las Tablas, David,
Santiago, Penonomé, Coronado. Le mouvement est **très concentré** — vendredi
après-midi vers l'intérieur, dimanche midi vers la capitale, et massivement
pendant les festivals et le Carnaval.

Aujourd'hui, deux options :

- **Le bus depuis Albrook.** Bon marché, horaire fixe, terminal à terminal.
  Il ne va pas là où tu vas ; il va où il va.
- **Les groupes WhatsApp.** C'est là que le covoiturage panaméen existe
  vraiment. Quelqu'un écrit « salgo mañana a Chitré, 2 puestos », et ça se
  règle dans le fil. Ça marche, mais ça ne se cherche pas, ça ne se filtre
  pas, ça n'a pas de mémoire, et personne ne sait qui monte dans la voiture.

Partimos ne remplace pas WhatsApp. Il donne à ce qui s'y passe déjà une
recherche, un prix qui se justifie, et une identité vérifiée.

## Qui

**Les passagers — le public premier.** Ils cherchent sur leur téléphone,
souvent en 4G, souvent déjà en déplacement. Ils ont une intention explicite :
« comment j'arrive à Santiago vendredi ». C'est cette intention qui rend
l'acquisition possible sans budget publicitaire.

**Les conducteurs — le public second, et le plus dur.** Ce sont des
particuliers qui font *déjà* le trajet, avec des sièges déjà vides. Ils ne
cherchent pas la catégorie : **personne ne tape « compartir gastos de mi
viaje a Santiago »**. Leur acquisition payante ne serait ni rentable ni
cumulative. On les atteint **à travers la demande des passagers**, pas à côté
d'elle : une recherche sans résultat n'est pas un échec, c'est un signal à
retourner aux conducteurs du corridor.

## Le mécanisme qu'on ne peut pas copier honnêtement

L'aporte par siège est **borné par un calcul**, pas laissé au conducteur :

```
essence = km × (litres/100 km du véhicule ÷ 100) × prix du litre
plafond = (essence × 1,10 + péages) ÷ (occupants + 1)
```

Le `+ 1` du diviseur, c'est le conducteur : **il paie sa part**. Voiture
pleine, il ne récupère jamais 100 % de son coût. Ce n'est pas une promesse
dans les conditions générales — c'est une contrainte de la base de données
(`CHECK price_within_cap`) : un trajet dont le prix dépasse le plafond ne
s'écrit pas.

Le calcul part de **ce que le trajet consomme réellement** — les litres de la
voiture, au prix du jour — et jamais d'un « taux au kilomètre ». La différence
n'est pas cosmétique : sur Panamá → Chitré, un taux au kilomètre ferait
rentrer le conducteur chez lui avec 27 $ de plus qu'en partant. Voir
`supabase/CONSUMO.md`.

C'est exactement ce qui sépare le **covoiturage à frais partagés** du
**transport rémunéré non autorisé**. Un concurrent qui laisse le conducteur
fixer son prix vend du transport, et il lui faut un permis qu'il n'a pas.

## Le modèle économique, dit franchement

Le trajet lui-même ne rapporte rien à Partimos. Le paiement va de la main du
passager à celle du conducteur, en espèces ou par Yappy, le jour du trajet.
**Aucune commission sur le transport.**

Ce qui est prévu — et pas encore branché — c'est une **tarifa de servicio**
sur la réservation en ligne : le passager paie un supplément s'il veut
réserver et payer dans l'app plutôt qu'en espèces. Elle rémunère le service
numérique de réservation, jamais le transport, et le conducteur reçoit son
aporte **complet** dans les trois cas. C'est le modèle BlaBlaCar.

> ⚠️ Le taux exact n'est pas tranché : la documentation dit 2,5 % (Yappy) /
> 5 % (carte), la base de données impose 5 % / 8 %. **Voir
> `05-DECISIONS-OUVERTES.md`.** Et cette structure doit être validée par un
> avocat panaméen avant le premier encaissement réel.

L'espèce reste toujours disponible et toujours gratuite. Si tout le monde
choisit l'espèce, Partimos ne gagne rien — c'est un risque assumé, parce que
l'alternative (rendre le paiement en ligne obligatoire) casserait la règle
qui protège juridiquement le produit.

## Le succès, tel qu'on le mesure

**Pas la réservation. Le trajet qui a réellement eu lieu.**

Comme l'argent ne passe pas par la plateforme, Partimos n'a aucune preuve
automatique qu'un trajet s'est fait. La seule preuve est la **clôture
mutuelle** : les deux parties confirment. C'est pour ça que ce n'est pas une
fonctionnalité de confort — c'est l'instrument de mesure du produit.

## Où on en est — 24 août 2026

**Ce qui existe et tourne :**

- Le site public (Next.js, export statique) — 15 pages.
- L'application (Expo / React Native) — 55 écrans, un seul code pour le web et
  le téléphone.
- La base (Supabase / PostgreSQL) — 34 migrations, sécurité par politiques
  RLS, 32 villes, la recherche de lieux et sa hiérarchie administrative.
- Un catalogue de lieux : ~5 000 points importés d'OpenStreetMap, 66 lieux
  panaméens écrits à la main, plus les alias.
- Trois adresses de test publiées (voir `03-APP.md`).

**Ce qui n'existe pas :**

- Aucun utilisateur réel, aucun trajet réel, aucun témoignage.
- Le paiement en ligne : décidé, documenté, **pas branché**.
- La vérification d'identité (Didit) : décidée, documentée, **pas branchée**.
- Les applications sur l'App Store et le Play Store : la configuration de
  compilation est prête (`app/eas.json`), les comptes développeur non.

**L'objectif immédiat :** envoyer un lien de test à des proches pour qu'ils
éprouvent chaque bouton, chaque texte, chaque calcul. Tant que ce n'est pas
fait, rien d'autre ne s'ouvre.

## Ce qui peut tuer le projet

Il vaut mieux l'écrire que de le découvrir.

1. **Un requalificatif juridique.** Si l'autorité panaméenne lit Partimos
   comme du transport rémunéré, tout s'arrête. C'est pour ça que les six
   règles de `02-PRODUIT.md` ne sont pas négociables, y compris quand elles
   convertissent moins bien.
2. **Le démarrage à froid côté conducteurs.** Sans voitures, la recherche est
   vide ; avec une recherche vide, pas de passagers. Le seul levier est la
   concentration : ouvrir peu de corridors, aux heures où le flux existe déjà.
3. **La fuite vers WhatsApp.** Une fois les deux personnes en contact, elles
   n'ont plus besoin de nous. C'est structurel, et le seul contrepoids est que
   le produit apporte quelque chose que le fil WhatsApp n'a pas : la
   vérification d'identité, le prix justifié, l'historique.
4. **Un incident de sécurité entre deux personnes.** Un seul suffit à définir
   la marque. D'où `06-DONNEES-ET-SECURITE.md`.
