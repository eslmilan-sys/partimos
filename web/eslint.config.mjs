import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Compétences tierces vendues depuis leurs dépôts d'origine. Les linter
    // avec les règles de ce projet n'a aucun sens : on ne les modifie pas, et
    // leurs 9 erreurs feraient échouer une CI sur du code qui n'est pas le
    // nôtre. Elles ne font pas partie de l'application non plus — rien dans
    // src/ ne les importe.
    ".claude/skills/**",
    // Fonctions Edge Supabase : du Deno (imports npm:, Deno.serve). Les
    // règles Next/Node ne s'y appliquent pas — c'est un autre runtime.
    "supabase/functions/**",
  ]),
]);

export default eslintConfig;
