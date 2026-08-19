# Compétences du projet

Ces compétences sont **versionnées avec le code**. Elles s'appliquent donc à
toute session ouverte sur ce dépôt, pour n'importe qui — contrairement à un
plugin installé sur un compte, qui ne suit pas le projet.

| Compétence | Origine | Ce qu'elle apporte |
|---|---|---|
| `partimos-reglas` | maison | Les six règles non négociables du brief et les invariants du calcul de l'aporte. À charger avant toute modification touchant au prix, aux sièges, aux annulations ou à l'identité. |
| `impeccable` | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) (Apache 2.0) | Atelier de design complet : `critique`, `audit`, `polish`, `layout`, `typeset`, `animate`… Chaque commande a sa fiche dans `reference/`. |
| `ui-ux-pro-max` | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | Base de données interrogeable : 84 styles, 192 palettes, 74 paires typographiques, 98 règles d'UX, 25 types de graphiques. |
| `refactoring-ui` | [wondelai/skills](https://github.com/wondelai/skills) | Les principes de *Refactoring UI* — hiérarchie, espacement, couleur, profondeur. Markdown pur. |
| `web-design-engineer` | [ConardLi/garden-skills](https://github.com/ConardLi/garden-skills) | Ingénierie de pages web : structure, rythme, mise en œuvre. |
| 14 compétences de méthode | [obra/superpowers](https://github.com/obra/superpowers) (MIT) | Discipline d'ingénierie : `brainstorming`, `systematic-debugging`, `test-driven-development`, `verification-before-completion`, `writing-plans`, revue de code. |

## Trois choses à savoir

**`using-superpowers` porte un mandat de comportement très ferme** : elle exige
d'invoquer une compétence avant *toute* réponse, y compris une simple question
de clarification. C'est puissant pour un travail long et structuré, cérémonieux
pour un échange rapide. Si les réponses deviennent lourdes, c'est ce dossier-là
qu'il faut supprimer — les treize autres de la collection restent utiles seules.

**`.claude/skills/` est exclu du lint** (`eslint.config.mjs`). Ce sont des
dépôts tiers vendus tels quels : les passer sous les règles de ce projet
produisait neuf erreurs sur du code qu'on ne modifie pas, et aurait fait échouer
une CI pour rien. Rien dans `src/` ne les importe.


**`impeccable` embarque des scripts Node** (~17 000 lignes) : chargement de
contexte, détecteur de défauts, serveur d'édition en direct, hooks. Ils sont
vendus tels quels depuis le dépôt d'origine et n'ont pas été relus ligne à
ligne. Ils ne s'exécutent que si on les appelle explicitement. Le cœur de la
valeur est dans les fiches Markdown de `reference/`, qui fonctionnent sans eux.

**`gpt-image-2` n'a pas été installé.** La génération d'images y exige une
variable `OPENAI_API_KEY` ; sans elle, la compétence se dégrade en simple
conseiller de prompts. À reprendre depuis
[ConardLi/garden-skills](https://github.com/ConardLi/garden-skills) le jour où
une clé est disponible.

## Mettre à jour

Ces dossiers sont des copies figées, pas des sous-modules : `git pull` ne les
met pas à jour. Pour reprendre une version plus récente, recloner le dépôt
d'origine et remplacer le dossier concerné.
