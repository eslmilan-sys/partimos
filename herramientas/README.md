# Sondes

Neuf scripts qui **mesurent** l'app dans un vrai navigateur, plus un qui
répare la police. Ils ne remplacent pas de regarder l'écran : ils trouvent ce
que l'œil ne voit pas.

## Les faire tourner

Il faut le serveur de développement et un Chromium :

```bash
cd app && BROWSER=none npx expo start --web --port 8085   # dans un terminal
```

Puis, depuis `herramientas/` :

```bash
node auditar.mjs "(pasajero)" "(pasajero)/resultados" "(cuenta)/cuenta"
node graves.mjs  "(ayuda)" "(conductor)/tope"
node relleno.mjs "(conductor)/carro"
node tapado.mjs  "(conductor)/panel"
node barrido.mjs "(pasajero)/viaje"        # + captures dans tiros/

node publicar-tiros.mjs                    # l'assistant, une capture par étape
node publicar-hojas.mjs                    # l'heure et les sièges, qu'il faut ouvrir
node publicar-auditar.mjs                  # contraste et cibles À CHAQUE étape
```

Les trois derniers ne prennent pas de route : ils **traversent** l'assistant
de publication. `publicar-tiros.mjs` accepte deux villes en arguments
(`node publicar-tiros.mjs "Ciudad de Panamá" David`).

Sans argument ils ne font rien : on leur passe les routes à regarder. La
liste complète des routes sort de `find app/app -name '*.tsx'`.

La première fois :

```bash
cd herramientas && npm install
```

Ils lancent le Chromium de l'environnement — `/opt/pw-browsers/chromium`,
avec `--no-proxy-server`. Si le binaire est ailleurs, c'est la seule ligne à
changer dans chaque fichier (`executablePath`).

`barrido.mjs` écrit ses captures dans `herramientas/tiros/`, qui n'est pas
versionné.

| Script | Ce qu'il trouve |
|---|---|
| `auditar.mjs` | contraste réel, cibles sous 44 px, texte tronqué |
| `graves.mjs` | texte quasi invisible (moins de 2:1) |
| `relleno.mjs` | cartes sans padding |
| `tapado.mjs` | contenu coupé par une barre fixe |
| `barrido.mjs` | captures + `button` dans `button`, débordement |
| `publicar-tiros.mjs` | une capture par étape de `(conductor)/publicar` |
| `publicar-hojas.mjs` | le sélecteur d'heure ouvert, et les sièges qu'on retire |
| `publicar-auditar.mjs` | `auditar.mjs`, mais aux huit étapes de l'assistant |
| `repaso-tiro.mjs` | l'écran de relecture, avec un commentaire écrit |
| `panel-tiro.mjs` | le panneau du conducteur et le profil, fenêtre par fenêtre |

**Pourquoi trois de plus pour un seul écran.** `auditar.mjs` charge une route
et mesure ce qu'il voit ; les étapes 2 à 8 de `publicar` n'existent qu'après
des clics, donc elles n'étaient mesurées par personne. Deux cibles sous
44 px y dormaient.

**Le faux positif qui reste** : au pas `carro`, le contraste des chiffres écrits
dans les sièges sort à 1:1. Le fond du texte est un `<rect>` SVG **derrière**
le bouton, pas un parent CSS ; la sonde remonte les parents et trouve le
blanc de la carte. En vrai c'est du blanc sur `ink900`, à 15:1.

## Et la police

`flecha-en-la-fuente.py` dessine « → » dans les quatre graisses de Switzer,
que le sous-ensemble auto-hébergé ne contient pas. Il se lance à la main,
son résultat est versionné, et il sert de patron pour tout autre glyphe
manquant :

```bash
pip install fonttools brotli
python3 herramientas/flecha-en-la-fuente.py
```

Pour savoir ce qui manque avant d'écrire un caractère non-ASCII :

```python
from fontTools.ttLib import TTFont
cmap = TTFont('app/public/fuentes/Switzer-600.woff2').getBestCmap()
print(ord('→') in cmap)
```
