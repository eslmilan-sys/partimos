# Écran principal — traspaso Claude Design

Fichiers déposés dans `diseno/` depuis le projet Claude Design
« # Partimos app UI mockups ». Référence de design, pas du code à copier.

## Fichiers

- `Partimos Main Screen.dc.html` — Le canevas d'itération de l'écran principal : dix tours de recherche (5 → 14) qui partent d'une passe de production sur la typographie et la hiérarchie des prix, traversent l'identité haute fidélité, l'onboarding, l'authentification et le flux « Publicar viaje », posent le Partimos Design System v1, puis couvrent le premier lancement, les états de production (skeleton, hors ligne, sans résultats), les écrans manquants (chats, notifications, profil, filtres, solicitudes côté conducteur) et finissent par une passe correctrice sur l'iconographie, la hiérarchie et les zones tactiles pour Inicio, Resultados et Chats.

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
