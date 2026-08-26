#!/usr/bin/env bash
# =====================================================================
#  Éprouver 0040 — les avis s'écrivent-ils tout seuls, et qui les lit ?
#
#  La migration est chargée TELLE QUELLE sur des tables recréées avec
#  leurs vraies colonnes, puis une réservation vit sa vie entière et on
#  vérifie l'avis que chaque pas doit écrire — et ce qu'un lecteur peut
#  et ne peut pas en faire.
#
#  Usage :  PGPORT=5433 ./correr-avisos.sh
# =====================================================================
set -euo pipefail

aqui="$(cd "$(dirname "$0")" && pwd)"
: "${PGHOST:=/tmp}" "${PGPORT:=5432}" "${PGUSER:=postgres}" "${PGDATABASE:=avisos_prueba}"
export PGHOST PGPORT PGUSER

psql -d postgres -q -c "drop database if exists $PGDATABASE;" -c "create database $PGDATABASE;"

salida=$(psql -d "$PGDATABASE" -v ON_ERROR_STOP=1 -q -f "$aqui/12-avisos.sql" 2>&1) && bien=1 || bien=0
echo "$salida" | grep -E "ok |FALLA" || true
if [ "$bien" -ne 1 ] || echo "$salida" | grep -q FALLA; then
  echo "— FALLÓ —"; exit 1
fi

echo "— todo verde —"
