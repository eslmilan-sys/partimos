#!/usr/bin/env bash
# =====================================================================
#  Éprouver la recherche de lieux sans toucher à la production.
#
#  Les fichiers 0033 à 0036 sont chargés TELS QUELS : ce qui est testé est
#  le code qui part en production, pas une copie. Ce qui est simulé, c'est
#  seulement PostGIS — absent d'un Postgres nu — et aucun des 36 tests ne
#  porte sur une distance.
#
#  Usage :  ./correr.sh            (Postgres local, port 5432)
#           PGPORT=5433 ./correr.sh
# =====================================================================
set -euo pipefail

aqui="$(cd "$(dirname "$0")" && pwd)"
migraciones="$aqui/.."
: "${PGHOST:=/tmp}" "${PGPORT:=5432}" "${PGUSER:=postgres}" "${PGDATABASE:=partimos_prueba}"
export PGHOST PGPORT PGUSER

psql -d postgres -q -c "drop database if exists $PGDATABASE;" -c "create database $PGDATABASE;"

correr () { psql -d "$PGDATABASE" -v ON_ERROR_STOP=1 -q -f "$1" >/dev/null; }

correr "$aqui/00-banco.sql"
for m in 0033_donde_queda_de_verdad 0034_arreglo_search_places_minusculas \
         0035_los_lugares_de_la_gente 0036_sin_punto_no_hay_lugar \
         0037_ph_es_opcional; do
  correr "$migraciones/migrations/$m.sql"
done
correr "$aqui/01-datos.sql"

psql -d "$PGDATABASE" -q -f "$aqui/02-pruebas.sql" | grep -E 'OK|FALLA|pasan|-----|[0-9]+ \|'

fallan=$(psql -d "$PGDATABASE" -tAc "select count(*) from resultado where not paso")
[ "$fallan" = "0" ] || { echo "→ $fallan prueba(s) fallan."; exit 1; }
echo "→ todo pasa."
