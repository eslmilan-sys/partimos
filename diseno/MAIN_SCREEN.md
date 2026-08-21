# Écran principal — traspaso Claude Design

Fichiers déposés dans `diseno/` depuis le projet Claude Design
« # Partimos app UI mockups ». Référence de design, pas du code à copier.

## Fichiers

- **`Partimos App v6.dc.html` — LA BASE.** Décidé par l'utilisateur le
  21-08-2026 : « this is the base structure. copy it on everywhere. » Deux
  écrans dessinés en entier (Inicio et Resultados) plus une spécification
  écrite en dix sections — cadre, espacement, échelle typo, couleur, rayons,
  iconographie, contrôles et états, anatomie de la carte de voyage, structure
  d'écran — et neuf invariants. Chaque valeur du fichier est la valeur à
  implémenter, sans approximation. La structure de ces deux écrans est
  l'archétype de **tous** les écrans de l'app : fond clair `#F4F7F8`, halos
  radiaux discrets, encre bleu-sarcelle `#0A2731`, accent `#E1213B` réservé à
  quatre sens (destination, action primaire, rareté, direct), police Switzer.
  **Le champ rouge héros du traspaso antérieur est supprimé** — l'utilisateur
  l'a rejeté explicitement.
- `Partimos Main Screen.dc.html` — Le canevas d'itération qui a mené à v6 :
  dix tours de recherche (5 → 14) qui partent d'une passe de production sur la
  typographie et la hiérarchie des prix, traversent l'identité haute fidélité,
  l'onboarding, l'authentification et le flux « Publicar viaje », posent le
  Partimos Design System v1, puis couvrent le premier lancement, les états de
  production (skeleton, hors ligne, sans résultats), les écrans manquants
  (chats, notifications, profil, filtres, solicitudes côté conducteur) et
  finissent par une passe correctrice sur l'iconographie, la hiérarchie et les
  zones tactiles. **Toujours la référence pour les écrans que v6 ne dessine
  pas** — connexion (10c/11e), onboarding, publicar — mais là où les deux
  parlent du même élément, v6 fait foi.

## Conflits design ↔ produit, tranchés à l'implémentation

- v6 écrit « Reservar asiento » ; le registre du produit impose « puesto »,
  jamais « asiento ». L'app dit **« Reservar puesto »**.
- v6 écrit les prix `B/18` ; l'ancien traspaso disait `6 $`. L'app suit v6 :
  **`B/`** avec chiffres tabulaires.
- Les données d'exemple de v6 contiennent « Terminal David » ; `PRODUCT.md`
  interdit les terminaux de bus comme point de rendez-vous. Ce sont des données
  d'exemple — les points réels viennent de la base, et le conflit terminaux
  reste ouvert dans `CLAUDE.md`.

## Ce qui n'a pas été déposé, et pourquoi

- **Aucune image.** Ce canevas n'appelle aucun fichier image : pas de `<img>`,
  pas de `url(...)`, pas de base64. Les visuels y sont des réserves rayées
  (classe `.ph`). `diseno/assets/` est donc inchangé.
- **`support.js`** est déjà dans `diseno/` et le fichier du traspaso lui est
  identique à l'octet près. Rien à mettre à jour ; le `<script src="./support.js">`
  du canevas se résout sur celui qui est déjà là.
- **Les captures d'écran du lot d'export** (`uploads/`, 16 Mo) sont les images
  que l'utilisateur a collées dans la conversation de design. Aucun écran ne les
  appelle : elles restent dehors.
- **Un seul écran.** Le lot Claude Design ne contenait que ce `.dc.html`. Les
  cinq « Partimos App Hi-Fi - *.dc.html » déjà présents viennent d'un traspaso
  antérieur et ne sont pas touchés.
