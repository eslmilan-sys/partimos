#!/usr/bin/env bash
# ARRANCA LA BASE DE LUGARES — un solo comando.
#
# Lo único que hace falta traer: el proyecto Supabase ya creado y sus
# claves. Todo lo demás lo hace este script: la extensión PostGIS, la
# tabla, los índices, la descarga del extracto de OpenStreetMap y la
# importación.
#
#   bash scripts/setup-lugares.sh
#
# Se puede correr dos veces sin romper nada: la migración es idempotente
# y la importación actualiza en vez de duplicar.

set -euo pipefail
cd "$(dirname "$0")/.."

say() { printf "\n\033[1m%s\033[0m\n" "$1"; }
die() { printf "\n\033[31m%s\033[0m\n" "$1" >&2; exit 1; }

# ── 1. Lo que tienes que traer ───────────────────────────────────────
# Se leen de .env.local si están ahí, si no del entorno.
[ -f .env.local ] && set -a && . ./.env.local && set +a

: "${SUPABASE_PROJECT_REF:?Falta SUPABASE_PROJECT_REF (está en la URL del panel: https://supabase.com/dashboard/project/AQUI)}"
: "${SUPABASE_DB_PASSWORD:?Falta SUPABASE_DB_PASSWORD (la que pusiste al crear el proyecto)}"
: "${SUPABASE_SECRET_KEY:=${SUPABASE_SERVICE_ROLE_KEY:-}}"
[ -n "$SUPABASE_SECRET_KEY" ] || die "Falta SUPABASE_SECRET_KEY (panel → Project Settings → API Keys → secret). En proyectos viejos se llama SUPABASE_SERVICE_ROLE_KEY."
export SUPABASE_SECRET_KEY
: "${SUPABASE_URL:=${NEXT_PUBLIC_SUPABASE_URL:-}}"
[ -n "$SUPABASE_URL" ] || die "Falta SUPABASE_URL (panel → Project Settings → API → Project URL)."
export SUPABASE_URL

# ── 2. Herramientas ──────────────────────────────────────────────────
command -v osmium >/dev/null || die \
  "Falta osmium-tool.
   macOS:  brew install osmium-tool
   Ubuntu: sudo apt install osmium-tool"

command -v npx >/dev/null || die "Falta Node (npx)."

# ── 3. Los centros de las ciudades servidas ──────────────────────────
if [ ! -f scripts/city-centers.json ]; then
  say "Generando scripts/city-centers.json…"
  npx tsx -e "import('./src/lib/corridors.ts').then(m=>console.log(JSON.stringify(
    m.ALL_CITIES.map(c=>({slug:c.slug,lat:c.lat,lng:c.lng})))))" \
    > scripts/city-centers.json
fi
printf "· %s ciudades servidas\n" "$(node -e "console.log(require('./scripts/city-centers.json').length)")"

# ── 4. La tabla ──────────────────────────────────────────────────────
say "Aplicando las migraciones…"
npx supabase link --project-ref "$SUPABASE_PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"
npx supabase db push

# ── 5. Los lugares ───────────────────────────────────────────────────
say "Importando los lugares de Panamá (OpenStreetMap)…"
say "La descarga son ~60 MB: la primera vez tarda unos minutos."
node scripts/import-places.mjs

say "Listo."
cat <<'FIN'
Lo que queda por hacer a mano:
  1. Poner NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en
     partimos/.env.local para que el sitio use la base.
  2. Dejar visible la atribución «© OpenStreetMap contributors» donde se
     muestren los resultados. Es condición de la licencia ODbL.
FIN
