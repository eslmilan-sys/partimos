# Ce qui empêche cette app de marcher

Relevé du 30-08-2026, écrit après avoir traversé les deux parcours et mesuré
les écrans. **Ce ne sont pas des défauts d'écran** — ceux-là sont dans
`REVISION.md` et se corrigent au fil de l'eau. Ce sont les quatre choses qui
décident si le produit fonctionne dans la vraie vie, et quatre plus petites
qui coûtent peu et se voient tout de suite.

Chacune est vérifiable dans le code : le fichier est cité.

---

## Les quatre grandes

### 1. Le signal de la demande est recueilli, puis jeté

Une recherche sans résultat propose **« Avísame si alguien publica »**. Le
bouton marche : `guardarRutaBuscada` (`src/servicios/rutas.ts`) écrit une
ligne dans `routines` avec `avisar: true`. Et c'est tout.

- **Personne ne lit jamais cette table.** `publicarViaje` ne la consulte pas ;
  aucun avis n'est jamais envoyé. Le passager a appuyé sur un bouton qui
  promet quelque chose que rien n'exécute.
- **Aucun écran conducteur ne la montre.** Le conducteur ne saura jamais que
  trois personnes cherchent Panamá → David vendredi. Le site le promet
  pourtant mot pour mot : *« hay gente buscando ese mismo viaje ahora
  mismo »*. `PRODUCT.md` aussi : *« une recherche vide n'est pas un échec,
  c'est un signal »*.

C'est **le** problème d'une place de marché à deux côtés : sans offre, chaque
recherche est vide ; sans demande visible, personne ne publie. Le seul levier
d'amorçage que le produit possède est branché d'un côté et débranché de
l'autre.

**Ce que ça vaut de faire :** publier un trajet notifie les routines qui
correspondent ; et l'écran `publicar` s'ouvre sur *« 3 personas buscan esta
ruta este viernes »*. Deux lectures d'une table déjà remplie.

### 2. L'app est muette quand elle est fermée

Aucun push, aucun mail, aucun SMS. Il manque un cron et un canal
(`REVISION.md`, limites assumées). Or **tous les moments qui comptent ont un
chronomètre** :

- une demande de place expire en **4 h** (`HORAS_PARA_RESPONDER`) ; le
  conducteur qui n'ouvre pas l'app perd le passager sans jamais l'avoir su ;
- le point de rendez-vous se règle par chat, la veille ou le matin même ;
- l'annulation gratuite bascule à **2 h** du départ.

Une app de covoiturage est un objet de coordination. Celle-ci suppose que les
deux personnes l'ouvrent au bon moment, d'elles-mêmes. Tant que c'est le cas,
chaque autre amélioration se joue sur un terrain qui ne tient pas.

**Ce que ça vaut de faire :** l'e-mail transactionnel avant le push — il ne
demande ni store, ni permission, ni certificat. Les quatre moments sont déjà
définis (`dominio/avisar.ts`).

### 3. Le moment de la rencontre n'est pas modélisé

C'est le pic d'anxiété du produit : **monter dans la voiture d'un inconnu, au
bon coin de rue, à la bonne minute.** L'app connaît le trajet à la minute
près et ne sait rien de ces quatre-vingt-dix secondes.

- Pas de carte : le point de ramassage est **du texte libre**, assumé (aucun
  fournisseur contracté).
- La négociation du point exact est renvoyée **dans le chat**, non structuré.
- Il n'existe aucun « je suis arrivé / je te vois » : les codes d'embarquement
  se tapent une fois que la rencontre a déjà eu lieu.

Combiné au point 2, un passager sur le mauvais trottoir n'a aucun recours :
il ne peut ni voir, ni signaler, ni être prévenu.

**Ce que ça vaut de faire, sans carte :** transformer le point convenu en
**objet** — le conducteur propose, le passager accepte, et l'accord s'affiche
en haut du trajet des deux côtés, avec un « ya salí » et un « ya llegué al
punto » horodatés. Le chat garde la conversation ; l'app garde la décision.

### 4. Les données que tout le monde voit contredisent l'identité du produit

`PRODUCT.md` interdit les **terminaux de bus** comme point de rendez-vous.
Ce n'est pas une préférence : c'est la ligne qui sépare *partager les frais
d'un trajet qu'on faisait déjà* de *fournir un service de transport*, et donc
la position juridique entière.

La semence — celle que voient tous les testeurs — publie « Albrook ·
Terminal », « Chitré · Parque Unión », « Albrook · bahía 4 ». La démo
**enseigne le comportement interdit** à chaque personne à qui on envoie le
lien. Et une recherche Panamá → Chitré rend un trajet dont le point de
descente s'appelle « Santiago », à 80 km : le premier réflexe d'un testeur
sera de ne plus croire les adresses.

Le produit et la donnée se contredisent, et c'est la donnée que les gens
lisent.

**Ce que ça vaut de faire :** réécrire la semence avec des points qui sont
des points (une sortie de ville, une station, un parc), et un contrôle qui
refuse un `origin_label` contenant « terminal ». Une heure de travail qui
protège la seule chose qu'on ne peut pas réparer après coup.

---

## Les quatre petites

### 5. Le rond « Atrás » fait 40 × 40 sur les 55 écrans

Sous les 44 px qu'Apple et Material demandent tous les deux, et c'est le
contrôle le plus pressé de l'app après le bouton principal. C'est **un seul
style** (`circulo`) recopié partout : une correction, tous les écrans.
Mesuré par `herramientas/auditar.mjs`, qui le sort sur chaque page.

### 6. Un compte calculé ailleurs que la liste qu'il compte

Le défaut le plus répété du dépôt — trois fois en trois jours :

- la pastille de la bandeja disait 2 avec 3 lignes à l'écran (29-08) ;
- le chip « Todos 1 » avec deux lignes en dessous (30-08) ;
- « 0 de 4 puestos ocupados » avec une ligne « Abordar » qui menait à un
  écran vide (30-08).

À chaque fois la même cause : **le nombre et la liste sont calculés à deux
endroits**. Un chiffre qui ne colle pas à ce qu'on voit à côté retire sa
crédibilité aux deux autres, qui eux sont justes.

**La règle à tenir :** un compte se dérive du tableau qui est rendu, jamais
d'une requête parallèle.

### 7. Le bouton de test « Cuéntame » part avec la démo

Il flotte en bas à droite et **recouvre du contenu réel** — sur les captures
du propriétaire, il mange « Acepta mascotas » et l'heure d'une conversation.
C'est l'outil de diagnostic, il se retire en enlevant une ligne de
`app/_layout.tsx`. Sur un lien envoyé à des collègues, c'est le premier
élément qu'ils voient et il n'est pas du produit.

### 8. Le mur de la vérification tombe au neuvième pas

L'assistant de publication laisse tout faire — route, arrêts, jour, heure,
voiture, apport — et c'est **au dernier écran** que « Repasar y publicar »
s'éteint : *falta verificar tu cédula*.

L'intention est bonne et documentée : ne pas demander les papiers avant
d'avoir montré à quoi ils servent. Mais telle quelle, la personne travaille
neuf écrans avant d'apprendre qu'elle ne pourra pas conclure. Une ligne
discrète au premier pas — *« podrás publicar en cuanto verifiques tu cédula,
toma un minuto »* — garde l'intention et supprime la surprise.

---

## Ce qui n'est pas dans cette liste, et pourquoi

- **L'absence de carte** est un choix assumé (aucun fournisseur contracté).
  Elle n'est citée qu'à travers sa conséquence, le point 3.
- **Les migrations 0038–0048 non appliquées**, le workflow permis manquant
  chez Didit et la boîte `hola@partimos.app` inexistante sont des tâches
  d'exploitation connues, déjà listées dans `REVISION.md`. Elles bloquent le
  lancement ; elles ne posent pas de question de conception.
- **L'arrondi de l'apport au dollar inférieur** coûte de l'argent au
  conducteur et attend un arbitrage du propriétaire : c'est écrit dans
  `CLAUDE.md`, section des conflits ouverts.
