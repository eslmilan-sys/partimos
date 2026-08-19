/**
 * LES SUGGESTIONS DE LIEUX.
 *
 * Ce fichier existe à cause d'une phrase du propriétaire : « lorsque je
 * mets une lettre ça me propose un point qui commence avec cette
 * lettre ». C'était vrai — la recherche cherchait n'importe où dans le
 * nom, sans ordre. Ces tests verrouillent le nouvel ordre.
 */

import { strict as assert } from "node:assert";
import { test } from "node:test";
import { searchPlaces } from "./places.ts";

/* ── L'ordre des suggestions ──────────────────────────────────────────
   La critique du propriétaire, mot pour mot : « lorsque je mets une
   lettre ça me propose un point qui commence avec cette lettre ». Ce
   qui commence par ce qu'on tape passe donc devant ce qui le contient
   au milieu. */

test("une lettre suffit, et le préfixe passe devant", () => {
  const r = searchPlaces("m", 6).map((p) => p.name);
  assert.ok(r.length > 0, "une seule lettre doit déjà proposer");
  assert.ok(
    r[0].toLowerCase().startsWith("m"),
    `le premier résultat devrait commencer par M, reçu « ${r[0]} »`,
  );
});

test("« mu » propose Multiplaza avant Multicentro (Avenida Balboa)", () => {
  const r = searchPlaces("mu", 6).map((p) => p.name);
  assert.ok(r.includes("Multiplaza Pacific"));
  assert.ok(
    r.indexOf("Multiplaza Pacific") < r.indexOf("Multicentro (Avenida Balboa)") ||
      !r.includes("Multicentro (Avenida Balboa)"),
    "le nom le plus court et le plus proche passe devant",
  );
});

test("un mot au milieu compte quand même : « omar » trouve Parque Omar", () => {
  const r = searchPlaces("omar", 6).map((p) => p.name);
  assert.equal(r[0], "Parque Omar");
});

test("ce qui ne correspond à rien ne remonte rien", () => {
  assert.deepEqual(searchPlaces("zzzzq", 6), []);
});
