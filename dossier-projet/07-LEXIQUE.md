# 07 · Lexique

Les mots qui reviennent dans le produit, le code et les conversations. Utile
pour Claude autant que pour un nouveau venu.

## Les mots du produit (espagnol du Panama)

| Mot | Ce que c'est |
|---|---|
| **aporte** | La participation aux frais que paie un passager. **Jamais** « prix » ni « tarif » : ces deux mots-là décrivent du transport vendu. |
| **cupo** / **puesto** | Une place dans la voiture. On dit « puesto », jamais « asiento ». |
| **carro** | La voiture. Jamais « coche » — c'est de l'espagnol d'Espagne. |
| **tope** | Le plafond de l'aporte, calculé. Le mécanisme central du produit. Toujours calculé avec le **sedán de référence** : qui conduit un 4×4 ne facture pas sa camionnette au passager. |
| **galón** | Le Panama vend le carburant **au gallon**, pas au litre, et c'est au gallon que le prix officiel est publié. 1 gallon US = 3,785 L. |
| **recuperas** | Ce que fait le conducteur : il récupère une part de ses frais. Le verbe autorisé. |
| **compartir gastos** | Le nom de ce qu'on fait. La formule juridiquement exacte. |
| **corredor** (corridor) | Une paire de villes = une page = un jeu de paramètres de prix. Six ouverts. |
| **ruta libre** | Un trajet dont l'origine et la destination sont écrites au clavier, hors corridor. |
| **tarifa de servicio** | Le supplément prévu sur une réservation payée en ligne. Rémunère le service numérique, jamais le transport. |
| **Yappy** | Le paiement mobile panaméen, adossé aux banques locales. Omniprésent au Panama. |
| **B/** | Le balboa. Parité fixe 1:1 avec le dollar américain, qui circule aussi. S'écrit `B/18`. |

### Les mots interdits

**« gana dinero », « ingresos », « ganancias »** — nulle part : interface,
marketing, courriels, publicités. Voir la règle nº 5 de `02-PRODUIT.md`.

---

## Les mots du Panama

| Mot | Ce que c'est |
|---|---|
| **PH** | *Propiedad Horizontal*. C'est comme ça qu'on nomme un immeuble résidentiel au Panama : « PH Torre Mistral ». Un Panaméen donne son adresse comme ça, pas par numéro de rue. |
| **corregimiento** | La plus petite division administrative. C'est le niveau auquel on situe vraiment un lieu : « Punta Pacífica, San Francisco, Panamá ». |
| **distrito** | Au-dessus du corregimiento. |
| **provincia** | Dix au Panama. |
| **comarca** | Territoire indigène autonome. Il y en a cinq, **et elles ne sont pas toutes au même rang** : deux (Madungandí, Wargandí) se situent au niveau d'un corregimiento, pas d'une province. C'est pour ça que la base a **une seule table** de zones administratives avec un niveau déclaré, plutôt que trois tables imbriquées. |
| **Albrook** | Le grand terminal de bus de Ciudad de Panamá. Le concurrent réel, et un point de rendez-vous problématique (voir `05-DECISIONS-OUVERTES.md`). |
| **la bomba** | La station-service. « la bomba de Divisa » est un point de rendez-vous courant et introuvable dans n'importe quel géocodeur. |
| **la entrada** | L'entrée d'un quartier ou d'une barriada. Même remarque. |
| **Divisa** | Le carrefour où la route de l'intérieur se sépare vers la péninsule d'Azuero. Tout le monde s'y arrête. |
| **Interamericana** | La route qui traverse le pays. L'axe de presque tous les corridors. |

---

## Les mots de la technique

| Mot | Ce que c'est |
|---|---|
| **RLS** | *Row Level Security*. Des règles écrites dans PostgreSQL qui décident ligne par ligne qui lit et qui écrit. **C'est la seule frontière de sécurité du produit** — il n'y a pas de serveur applicatif. |
| **SECURITY DEFINER** | Une fonction de base de données qui s'exécute avec les droits de son propriétaire, pas de l'appelant. Sert à faire une seule chose que le client n'a pas le droit de faire — et rien d'autre. |
| **Supabase** | PostgreSQL hébergé + authentification + fonctions Edge. Notre base. |
| **Expo / React Native** | Ce qui permet d'écrire l'app **une fois** et de la publier sur le web, iOS et Android. |
| **EAS Build** | Le service qui compile le `.ipa` et l'`.apk` depuis le dépôt. |
| **OpenStreetMap / ODbL** | La carte libre et sa licence. Elle **autorise** de copier et de conserver, avec attribution — contrairement à Google, dont les conditions interdisent de stocker les résultats. C'est toute la raison pour laquelle notre base de lieux peut exister. |
| **Overpass** | L'API qui permet d'extraire un morceau d'OpenStreetMap par requête. |
| **pg_trgm** | L'extension PostgreSQL qui rend la recherche floue possible : « torre mistral » trouve « PH Torre Mistral ». |
| **PostGIS** | L'extension qui stocke des points géographiques et calcule des distances. |
| **Sistema v6** | Le langage visuel en vigueur depuis le 21-08-2026. Voir `04-MARQUE.md`. |
| **lienzo** | Le fond d'écran du système v6 : `#F4F7F8`. |
| **tinta** (encre) | La couleur principale, `#0A2731`, qui sert de texte **et** de surface sombre. |

---

## Les noms de fichiers qu'on cite tout le temps

| Fichier | Ce qu'il contient |
|---|---|
| `CLAUDE.md` | Les consignes de travail sur le dépôt et **la liste des conflits ouverts**. Lu au début de chaque session. |
| `PRODUCT.md` | Les règles métier. Fait foi. |
| `diseno/Partimos App v6.dc.html` | La référence visuelle. Fait foi. |
| `app/src/ui/tokens.ts` | Le portage en code de v6, chaque valeur commentée avec sa raison. |
| `app/src/dominio/aporte.ts` | Le calcul de l'aporte et du plafond. |
| `supabase/CONSUMO.md` | Le carburant, les cinq catégories de véhicule, la liste des modèles. Ferme la question du taux au kilomètre. |
| `supabase/migrations/` | L'histoire complète de la base, une décision par fichier. |
| `supabase/LUGARES.md` | Comment marche la recherche d'adresses, et pourquoi pas Google. |
| `supabase/PAGOS.md` | Le paiement en ligne — décidé, pas branché. |
| `supabase/DIDIT.md` | La vérification d'identité — décidée, pas branchée. |
