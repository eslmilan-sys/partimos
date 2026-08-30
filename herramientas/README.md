# Sondes

Cinq scripts qui **mesurent** l'app dans un vrai navigateur, plus un qui
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
```

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
