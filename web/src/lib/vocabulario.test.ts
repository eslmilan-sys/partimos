/**
 * LES MOTS QUE PARTIMOS N'ÉCRIT PAS.
 *
 * Deux interdits posés par le propriétaire, mot pour mot : jamais
 * « gratis », jamais « Sin tarifa de reserva ». Ce ne sont pas des goûts
 * de rédaction — ce sont des promesses commerciales que le produit ne
 * tient pas et qu'il n'a aucune envie de tenir. Ce qu'on annonce à la
 * place, c'est ce qui est vrai : trois façons de payer, et c'est tout.
 *
 * Pourquoi un test plutôt qu'une relecture : ces mots sont revenus trois
 * fois, chaque fois de bonne foi, dans une phrase écrite ailleurs. Une
 * règle qu'on doit se rappeler n'est pas une règle. Celle-ci casse le
 * build.
 *
 * Le test lit les SOURCES, pas le rendu : une chaîne interpolée, une
 * traduction, un attribut `alt` — tout passe par un fichier de `src/`.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(fileURLToPath(new URL(".", import.meta.url)), "..");

/** Les mots bannis, avec la raison — elle s'affiche dans l'échec, pour
 *  que celui qui casse le test sache quoi écrire à la place. */
const PROHIBIDO: { patron: RegExp; porque: string }[] = [
  {
    patron: /\bgratis\b/i,
    porque:
      "Partimos ne dit jamais « gratis ». On nomme les trois façons de payer : Yappy, tarjeta o efectivo.",
  },
  {
    patron: /sin\s+tarifa\s+de\s+reserva/i,
    porque:
      "« Sin tarifa de reserva » est interdit : on montre les trois options de paiement, sans commenter les frais.",
  },
];

function fuentes(dir: string, acc: string[] = []): string[] {
  for (const entrada of readdirSync(dir)) {
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) {
      fuentes(ruta, acc);
      continue;
    }
    if (!/\.(tsx?|css)$/.test(entrada)) continue;
    /* Le test s'exclut lui-même : il CONTIENT les mots interdits, c'est
       son travail. */
    if (entrada.endsWith(".test.ts") || entrada.endsWith(".test.tsx")) continue;
    acc.push(ruta);
  }
  return acc;
}

for (const { patron, porque } of PROHIBIDO) {
  test(`aucune source n'écrit ${patron.source}`, () => {
    const culpables: string[] = [];
    for (const ruta of fuentes(RAIZ)) {
      const texto = readFileSync(ruta, "utf8");
      texto.split("\n").forEach((linea, i) => {
        if (patron.test(linea)) {
          culpables.push(`${relative(RAIZ, ruta)}:${i + 1} — ${linea.trim()}`);
        }
      });
    }
    assert.deepEqual(culpables, [], `${porque}\n\n${culpables.join("\n")}`);
  });
}
