# 06 · Les données et la sécurité

Partimos met deux inconnus dans la même voiture. C'est le produit, et c'est
aussi tout le risque. Ce fichier dit ce qu'on garde, ce qu'on refuse de garder,
et ce qui protège le reste.

---

## Le point d'architecture qu'il faut comprendre

**Il n'y a pas de serveur applicatif.** Le téléphone parle directement à la
base de données. Il n'y a donc pas de couche intermédiaire où vérifier les
droits « au passage ».

Ce qui protège les données, ce sont les **politiques RLS** (Row Level
Security) — des règles écrites *dans* PostgreSQL qui décident, ligne par
ligne, qui peut lire et écrire quoi. Une politique RLS ne se contourne pas
depuis un client modifié : elle s'applique dans le moteur.

**Conséquence directe :** la clé publique compilée dans l'app est **publique
exprès**. Elle ne donne accès à rien que les politiques n'autorisent déjà.
C'est la clé `service_role` qui est le secret, et elle n'a jamais rien à faire
côté client — elle ne vit que dans les secrets de CI et dans les fonctions
Edge.

**Ce que ça implique en pratique :** toute nouvelle table est un trou tant que
sa politique n'est pas écrite. La discipline du dépôt est donc : *RLS activée
sur chaque table, et une table sans politique est fermée à tous* — sauf aux
fonctions `SECURITY DEFINER`, qui s'exécutent élevées avec un `search_path`
figé et des arguments validés.

---

## Ce qu'on ne stocke pas, jamais

**Aucune photo de document d'identité. Aucun numéro de cédula.** C'est la
règle nº 6 du produit. La vérification se fait chez **Didit**, sur son propre
parcours hébergé (document + selfie). Partimos reçoit **le verdict** et **la
référence du dossier**. Rien d'autre.

La raison est simple : une base de photos de cédulas panaméennes est une cible.
Le seul moyen de ne pas la perdre est de ne pas l'avoir.

---

## Les huit questions de sécurité qu'on se pose

Elles sont détaillées, en espagnol, dans le brief destiné à un auditeur
externe. Résumé de ce qu'on protège et comment :

### 1 · L'isolement entre utilisateurs

Chaque personne ne voit que ses propres trajets, réservations et messages. La
frontière est RLS, pas un `if` dans l'interface. Un profil public expose
strictement ce que le design montre : prénom, note, ancienneté, verdict de
vérification — pas le courriel, pas le téléphone.

### 2 · La localisation

C'est la donnée la plus sensible du produit : elle dit où quelqu'un habite et
à quelle heure il part. **La position en arrière-plan est explicitement
bloquée** dans la configuration de l'app (`ACCESS_BACKGROUND_LOCATION`). Un
point de rendez-vous n'est visible qu'aux personnes du trajet, et il est
choisi par la personne, jamais relevé automatiquement.

### 3 · L'identité : cédula, plaque et photo du carro

La cédula ne passe pas par nous (ci-dessus). **La plaque complète et la photo
du carro**, en revanche, sont une demande produit — c'est ce qui permet au
passager de reconnaître la voiture qui arrive, et c'est un vrai gain de
sécurité. La question ouverte est *à qui* et *à quel moment* elles s'affichent :
notre position est qu'une plaque complète ne se montre qu'aux passagers
**confirmés** du trajet, et pas dans la liste publique des résultats.

### 4 · L'argent

L'argent ne passe pas par la plateforme (règle nº 2). Quand le paiement en
ligne sera branché, il passera par un prestataire externe : **les secrets
vivent dans les fonctions Edge**, jamais dans le bundle, et la plateforme ne
détient jamais les fonds du trajet. La question qu'un auditeur pose toujours —
« si un tiers fait l'intégration, l'argent transite-t-il quand même chez
vous ? » — a une réponse qu'il faut pouvoir donner par écrit : non, le
prestataire encaisse et reverse, et le conducteur reçoit son aporte complet.

### 5 · Les comptes, les sessions et les clés

La session est stockée **chiffrée** sur le téléphone (`expo-secure-store`,
c'est-à-dire le Trousseau iOS et le Keystore Android). Détail qui compte : ce
stockage plafonne à 2 048 **octets** par entrée, et un caractère UTF-8 peut en
peser 4 — la session est donc découpée en morceaux de **500 caractères**, et
l'en-tête est écrit **en dernier**, pour qu'une écriture interrompue laisse la
session précédente intacte plutôt qu'une moitié de session.

### 6 · Ce qui est propre à iOS et Android

Les permissions sont déclarées en espagnol et au minimum nécessaire. Les liens
d'application sont **vérifiés** (App Links / Universal Links) pour qu'une
autre application ne puisse pas intercepter le lien de confirmation d'un
courriel.

### 7 · La Ley 81 (protection des données personnelles, Panama)

Elle s'applique. Les points qui nous concernent en premier : la finalité doit
être déclarée, le consentement doit être recueilli, la personne doit pouvoir
demander accès et suppression, et une violation doit être notifiée. Un
registre de traitement est à tenir — il n'existe pas encore.

### 8 · Si quelque chose tourne mal

Un canal de signalement, une capacité à bloquer un compte, et une trace
suffisante pour reconstituer ce qui s'est passé — sans conserver plus que
nécessaire. C'est le point le moins avancé aujourd'hui.

---

## Les décisions déjà prises, et pourquoi

**Le retour des testeurs s'écrit dans une table où personne ne peut lire.**
`anon` a le droit d'insérer un commentaire ; **il n'existe aucune politique de
lecture**. Écriture oui, lecture zéro. Un testeur ne peut donc pas lire les
retours des autres, même en bidouillant le client.

**Un lieu écrit par un utilisateur reste invisible jusqu'à ce qu'une deuxième
personne distincte s'en serve.** Le compte porte sur des *personnes*, pas des
usages : sinon quelqu'un qui publie dix trajets rendrait public son propre
texte, et la recherche de tout le pays afficherait ce qu'il a voulu écrire.
La promotion s'écrit dans une fonction `SECURITY DEFINER` — **aucune politique
RLS ne permet au client de rendre un lieu public**, et c'est ce qui rend la
règle incontournable plutôt que polie.

**Sans coordonnées, pas de lieu.** Un nom tapé qui ne correspond à rien de
connu n'entre pas au catalogue. Il continue de vivre dans le trajet, comme
texte, sans devenir une entrée que tout le pays cherchera.

**Le profil de compilation destiné à un auditeur tourne en données simulées.**
`app/eas.json` définit un profil `revision` avec `EXPO_PUBLIC_FUENTE=simulado` :
on peut faire auditer l'application **sans donner accès à une seule donnée
réelle**.

---

## Ce qui manque encore

- Le registre de traitement Ley 81.
- La politique de conservation : combien de temps on garde un trajet passé,
  un message, un retour de testeur.
- Le parcours de suppression de compte.
- Un avis d'avocat panaméen sur la structure de la tarifa de servicio.
- Le canal de signalement et la procédure de blocage d'un compte.
