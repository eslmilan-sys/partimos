#!/usr/bin/env node
/**
 * ARMA `supabase/TODO-EN-UNO.sql` — el archivo que se pega en el panel.
 *
 * Las migraciones de `supabase/migrations/` son HISTÓRICAS: se aplican
 * una vez, en orden, y no se tocan. Pero el archivo que una persona pega
 * a mano en el SQL Editor tiene otra vida: se pega dos veces, se corta
 * a la mitad, se relanza después de un error. Si no es idempotente, el
 * segundo intento muere con «type ya existe» — que es exactamente lo que
 * pasó.
 *
 * Este generador reescribe el paquete para que se pueda relanzar
 * siempre, sin tocar las migraciones originales:
 *
 *   CREATE TYPE          → DO $$ … EXCEPTION WHEN duplicate_object $$
 *   CREATE TABLE         → CREATE TABLE IF NOT EXISTS
 *   CREATE [UNIQUE] INDEX→ … IF NOT EXISTS
 *   CREATE POLICY        → DROP POLICY IF EXISTS antes
 *   CREATE TRIGGER       → DROP TRIGGER IF EXISTS antes
 *   CREATE VIEW          → CREATE OR REPLACE VIEW
 *   CREATE FUNCTION      → CREATE OR REPLACE FUNCTION
 *   ADD COLUMN           → ADD COLUMN IF NOT EXISTS
 *   ADD CONSTRAINT       → se salta si ya está (DO … duplicate_object)
 *   INSERT (semillas)    → ON CONFLICT DO NOTHING
 *
 * Se verifica corriéndolo DOS VECES seguidas sobre la misma base: la
 * segunda no debe dar ni un error.
 */

import { readFile, readdir, writeFile } from "node:fs/promises";

const DIR = new URL("../supabase/migrations/", import.meta.url);
const OUT = new URL("../supabase/TODO-EN-UNO.sql", import.meta.url);

/** CREATE TYPE x AS ENUM (…); → bloque que tolera que ya exista. */
function guardTypes(sql) {
  return sql.replace(
    /^(CREATE TYPE\s+[\s\S]*?;)\s*$/gim,
    (block) =>
      `DO $idem$ BEGIN\n${block
        .split("\n")
        .map((l) => `  ${l}`)
        .join("\n")}\nEXCEPTION WHEN duplicate_object THEN NULL; END $idem$;`,
  );
}

/** ALTER TABLE … ADD CONSTRAINT … ; → tolera que ya exista. */
function guardConstraints(sql) {
  return sql.replace(
    /^(ALTER TABLE[^;]*?ADD CONSTRAINT[\s\S]*?;)\s*$/gim,
    (block) =>
      `DO $idem$ BEGIN\n${block
        .split("\n")
        .map((l) => `  ${l}`)
        .join("\n")}\nEXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END $idem$;`,
  );
}

/** CREATE POLICY x ON t … → se borra antes, para poder redefinirla. */
function guardPolicies(sql) {
  return sql.replace(
    /^(\s*)CREATE POLICY\s+("?[\w-]+"?)\s+ON\s+([\w.]+)/gim,
    (_m, indent, name, table) =>
      `${indent}DROP POLICY IF EXISTS ${name} ON ${table};\n${indent}CREATE POLICY ${name} ON ${table}`,
  );
}

/** CREATE [CONSTRAINT] TRIGGER x … ON t → idem. La tabla viene en la
 *  línea siguiente, y `CONSTRAINT` en medio: los dos casos existen. */
function guardTriggers(sql) {
  return sql.replace(
    /^(\s*)CREATE (CONSTRAINT )?TRIGGER\s+([\w"]+)([\s\S]*?)ON\s+([\w.]+)/gim,
    (_m, indent, constraint, name, middle, table) =>
      `${indent}DROP TRIGGER IF EXISTS ${name} ON ${table};\n` +
      `${indent}CREATE ${constraint ?? ""}TRIGGER ${name}${middle}ON ${table}`,
  );
}

/** Las semillas: insertarlas dos veces duplicaría filas. */
function guardSeeds(sql) {
  const rules = [
    [/INSERT INTO vehicle_categories([\s\S]*?);/i, "(code) DO NOTHING"],
    [/INSERT INTO price_rules([\s\S]*?);/i, "DO NOTHING"],
    [/INSERT INTO cities([\s\S]*?);/i, "(country_code, slug) DO NOTHING"],
    [/INSERT INTO corridors([\s\S]*?);/i, "(slug) DO NOTHING"],
    [/INSERT INTO cancellation_policies([\s\S]*?);/i, "DO NOTHING"],
  ];
  for (const [re, conflict] of rules) {
    sql = sql.replace(re, (block) => {
      if (/on conflict/i.test(block)) return block;
      return block.replace(/;\s*$/, `\nON CONFLICT ${conflict};`);
    });
  }
  return sql;
}

function idempotent(sql) {
  let out = sql;
  out = guardTypes(out);
  out = guardConstraints(out);
  out = out.replace(/^(\s*)CREATE TABLE (?!IF NOT EXISTS)/gim, "$1CREATE TABLE IF NOT EXISTS ");
  out = out.replace(
    /^(\s*)CREATE (UNIQUE )?INDEX (?!IF NOT EXISTS)/gim,
    (_m, indent, unique) => `${indent}CREATE ${unique ?? ""}INDEX IF NOT EXISTS `,
  );
  /* `CREATE OR REPLACE VIEW` no basta: en cuanto una vista gana o pierde
     una columna, Postgres responde «cannot drop columns from view». Se
     borra y se rehace. CASCADE es seguro aquí porque todas las vistas
     del paquete se vuelven a crear más abajo, en su orden. */
  out = out.replace(
    /^(\s*)CREATE (?:OR REPLACE )?VIEW\s+([\w."]+)/gim,
    (_m, indent, name) =>
      `${indent}DROP VIEW IF EXISTS ${name} CASCADE;\n${indent}CREATE VIEW ${name}`,
  );
  out = out.replace(/^(\s*)CREATE FUNCTION /gim, "$1CREATE OR REPLACE FUNCTION ");
  out = out.replace(/ADD COLUMN (?!IF NOT EXISTS)/gi, "ADD COLUMN IF NOT EXISTS ");
  out = guardPolicies(out);
  out = guardTriggers(out);
  out = guardSeeds(out);
  return out;
}

const files = (await readdir(DIR)).filter((f) => f.endsWith(".sql")).sort();
const parts = [
  `-- PARTIMOS — TODA LA BASE, DE UNA VEZ`,
  `--`,
  `-- Pégalo entero en: panel de Supabase → SQL Editor → New query → Run.`,
  `-- Son las ${files.length} migraciones en orden.`,
  `--`,
  `-- SE PUEDE RELANZAR. Si se corta a la mitad, si ya se aplicó, si se`,
  `-- pega dos veces: no pasa nada. Cada objeto se crea solo si falta.`,
  `--`,
  `-- Probado en las dos situaciones y DOS VECES seguidas: Postgres 16 +`,
  `-- PostGIS limpio, y una copia de las condiciones de Supabase (esquema`,
  `-- auth ajeno y bloqueado, extensiones en \`extensions\`).`,
  `--`,
  `-- Generado desde supabase/migrations/ por scripts/build-sql-unico.mjs.`,
  ``,
];

for (const file of files) {
  const sql = await readFile(new URL(file, DIR), "utf8");
  parts.push(
    `-- ═══════════════════════════════════════════════════════════`,
    `-- ${file}`,
    `-- ═══════════════════════════════════════════════════════════`,
    idempotent(sql),
    ``,
  );
}

await writeFile(OUT, parts.join("\n"));
console.log(
  `${files.length} migraciones → supabase/TODO-EN-UNO.sql (${parts.join("\n").split("\n").length} líneas)`,
);
