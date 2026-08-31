# Passer l'app au peigne fin

Ce fichier est fait pour **une session qui vient tout vérifier** : chaque
bouton, chaque texte, et les deux parcours de bout en bout — celui qui
cherche une place et celui qui conduit.

Et si tu viens **chercher ce qui empêche l'app de marcher** plutôt que ce
qui est cassé sur un écran : `AUDITORIA.md`. Quatre problèmes de fond,
quatre petits, chacun avec le fichier où le vérifier.

Lire `CLAUDE.md` d'abord. Les six règles non négociables et les divergences
assumées y sont : **beaucoup de choses qui ont l'air d'un défaut sont des
décisions**, et la section du 29-08-2026 dit lesquelles.

---

## Où regarder

| | |
|---|---|
| Démo simulée | <https://eslmilan-sys.github.io/partimos/demo/> |
| Contre la vraie base | <https://eslmilan-sys.github.io/partimos/app/> |
| En local | `cd app && BROWSER=none npx expo start --web --port 8085` |

Les deux exports sortent du même code ; ce qui change est
`EXPO_PUBLIC_FUENTE` (`simulado` ou `supabase`). **La démo simulée est celle
qui montre les parcours complets** : contre la vraie base, les écrans qui ont
encore un identifiant de démonstration écrit en dur sortent vides (voir
`app/README.md`, « Ce qui manque », point 1).

Comptes de test contre la vraie base : `supabase/cuentas_de_prueba.sql`.

**Sur téléphone, recharger de force** : la police a changé et Safari la garde.

---

## Ce qu'on cherche

Dans cet ordre, parce que c'est l'ordre du coût :

1. **Un bouton qui ne fait rien.** Le pire défaut de ce dépôt, trouvé cinq
   fois : un `<Text>` peint en bleu, un cercle gris sans rien derrière, une
   phrase avec une icône qui a l'air d'une ligne cliquable.
2. **Un bouton qui fait autre chose que ce qu'il dit.** « Escribirle a una
   persona » dans l'aide ouvrait le chat avec le conducteur ; « Seguridad y
   verificación » ouvrait le formulaire de plainte.
3. **Un chiffre qui ne correspond pas à ce qu'on voit à côté.** La bandeja
   comptait 2 et affichait 3 lignes ; la pastille disait « 1 puesto » écrit
   en dur.
4. **Un cul-de-sac.** Un écran sans retour (`puestos` n'en avait pas), un
   vide sans rien à faire, une erreur sans issue.
5. **Un même fait dit deux fois** sur le même écran.
6. **La forme** — mais avec les sondes de `herramientas/`, pas à l'œil :
   quatre défauts sur cinq du 29-08 ne se voyaient pas.

Et à chaque écran, la question de fond : **est-ce que le rótulo de l'écran
promet ce que l'écran fait ?** C'est ce qui a fait tomber `ayuda`,
`seguridad`, `puestos` et `cuenta`.

---

## Le parcours du passager

De haut en bas, avec la route de chaque écran. Ce qu'il faut voir marcher
est entre parenthèses.

1. `(cuenta)/apertura` → `(cuenta)/registro` ou `(cuenta)/entrar`
   (l'inscription demande la ville à la 4ᵉ étape ; elle ne bloque pas si on
   ne répond pas)
2. `(pasajero)` — l'accueil (les deux champs, l'inversion, le jour, les
   passagers, la cloche en haut à droite, les routes populaires, les départs
   depuis chez soi)
3. `(pasajero)/resultados` — **trois états à voir séparément** : avec des
   trajets ; « ce jour non mais jeudi oui » ; et **aucun trajet aucun jour**
   (là, ni chips ni tira, et le vide porte trois portes dont « ¿Lo manejas
   tú? »). Plus les filtres, l'ordre, la tira de jours, « Otra fecha »
4. `(pasajero)/viaje` — la fiche (l'itinéraire, le conducteur, le carro,
   « Preguntar », « Cancelar mi puesto » qui n'apparaît que quand il sert)
5. `(pasajero)/reservar` — le point de ramassage, les puestos, les trois
   compteurs de bagages (le ± doit faire 44 px)
6. `(pasajero)/metodos` et `(pasajero)/metodo-nuevo`
7. `(pasajero)/aportar` → `(pasajero)/comprobante`
8. `(pasajero)/chat` et `(pasajero)/conversaciones` (ouvrir un fil doit
   éteindre sa pastille, et celle de l'onglet Chats)
9. `(pasajero)/codigo` — le code de montée, puis `(pasajero)/punto`
10. `(pasajero)/llegada` → `(pasajero)/ya` → `(pasajero)/calificar`
11. `(pasajero)/rutas`, `(pasajero)/salidas`, `(pasajero)/destino`,
    `(pasajero)/ruta`, `(pasajero)/perfil`, `(pasajero)/partimos`

## Le parcours du conducteur

1. `(conductor)/cedula` — la vérification (elle décide s'il peut publier)
2. `(conductor)/carro` — marque, modèle, année, couleur, plaque, licence,
   places, photo, et les deux interrupteurs du carro
3. `(conductor)/publicar` — **les huit étapes**, une par écran : route,
   paradas, jour, heure, carro et places, apport, apport par tronçon,
   conditions, commentaire. Vérifier que l'heure passée se refuse **à
   l'étape de l'heure**, et que les paradas sortent aussi en route libre.
   Depuis le 30-08 : l'heure a des **minutes** (grille de 24 heures + les
   quarts), le pas du carro est **une voiture 2D où l'on touche les
   sièges**, et l'apport a **une règle** au lieu d'un ±. Les trois sondes
   `herramientas/publicar-*.mjs` traversent l'assistant : `auditar.mjs` ne
   voit que la première étape
4. `(conductor)/repaso` → publié
5. `(conductor)/panel` — ses trajets publiés, « Editar », « Compartir »,
   « Publicar de nuevo »
6. `(conductor)/solicitudes` — accepter, refuser, le délai qui court, et
   qu'on **ne puisse pas accepter une demande sur un trajet déjà parti**
7. `(conductor)/solicitante` — la fiche de qui demande
8. `(conductor)/abordaje` — taper les codes
9. `(conductor)/aportes` — l'historique (avec la date de chaque trajet) et,
   au-dessus, **l'envoi Yappy qui est en attente** : la somme, la semaine
   couverte, le lundi où il part. Vérifier que la phrase « seul ce qui a été
   payé dans l'app passe par là » y est : sans elle, un conducteur payé en
   liquide attend un virement qui ne viendra jamais. Puis
   `(conductor)/tope`, `(conductor)/puestos`, `(conductor)/editar`

## Le reste

`(cuenta)/cuenta` (une seule page, pas d'onglets), `(cuenta)/ajustes`,
`(avisos)/avisos`, `(ayuda)` et ses six pages, `(conductor)/misviajes`,
`pantallas` (l'index de tous les écrans — utile pour n'en rater aucun).

---

## Ce qui est déjà connu

À ne pas rouvrir comme si c'était neuf.

**Côté compte, et bloquant :**

- Les migrations **0038 à 0048** ne sont pas appliquées. Elles se posent à
  la main dans le SQL Editor. L'app se répare seule si la 0044 manque, pas
  pour les autres.
- Le **workflow licence chez Didit** n'existe pas et
  `DIDIT_WORKFLOW_LICENCIA` n'est pas dans les secrets : `didit-start`
  répond `sin_flujo_licencia`.
- Le nom du champ de la date d'expiration dans la décision Didit n'est pas
  confirmé — le webhook essaie quatre chemins.
- **`hola@partimos.app` n'existe pas.** L'aide le propose.

**Décisions en attente du propriétaire :**

- Un axe « a payé ce qui était convenu » dans les notes. C'est le risque
  numéro un du paiement de la main à la main. Demande une colonne dans
  `reviews` et une décision sur les conséquences.
- **Les données de la semence se contredisent avec `PRODUCT.md`** : les
  trajets partent d'« Albrook · Terminal », et le produit interdit les
  terminaux comme point de rendez-vous. Et une recherche Panamá → Chitré
  rend un trajet dont le point de descente s'appelle « Santiago », à 80 km.

**Limites assumées, pas des défauts :**

- Pas de carte : aucun fournisseur n'est contracté. Le point de ramassage
  est du texte, exprès.
- `enElCamino` propose parfois une ville **juste après** la destination
  (Pedasí sur un Panamá → Las Tablas) : mesurer sur des lignes droites ne
  sait pas les séparer, et la retirer retirerait aussi les vrais
  croisements. Écrit en tête du fichier.
- Pas de push téléphone fermé : il manque un cron et un canal.
- Le bouton « Cuéntame », en bas à droite de l'écran, est l'outil de test :
  il se retire en enlevant une ligne de `_layout.tsx`.
- **Le rond « Atrás » fait 40×40 partout**, sous les 44 px du doigt. C'est
  le style `circulo`, répété sur tous les écrans : le corriger est une passe
  à lui seul, pas un défaut par écran. Inutile de le signaler 55 fois.
- Au pas `carro` de `publicar`, les sondes de contraste sortent « B/6 à
  1:1 » : le fond du chiffre est un `<rect>` SVG derrière le bouton, pas un
  parent CSS. C'est du blanc sur `ink900`, à 15:1.
- Les textes signalés « cortado » qui finissent en « … » ne sont pas des
  défauts : c'est `numberOfLines={1}`, voulu dans une liste.

---

## Avant de dire qu'un écran va bien

```bash
cd app && npx tsc --noEmit && npm test     # 171 tests
cd herramientas && node auditar.mjs "(la)/route"
```

Et si la revue change quelque chose : **la logique va dans
`app/src/dominio/`**, avec un test. C'est le seul endroit qui se teste sans
navigateur — `--experimental-strip-types` ne sait pas transformer du JSX,
donc rien de ce qui touche à `ui/*.tsx` n'est testable en ligne de commande.
