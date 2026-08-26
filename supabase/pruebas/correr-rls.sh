#!/usr/bin/env bash
# =====================================================================
#  Éprouver la RLS de 0039 — ce que `anon` peut vraiment faire.
#
#  `anon` est le rôle de la clé publiable, celle qui part dans le paquet
#  téléchargé par le navigateur. Les essais se font DANS SA PEAU, donc ce
#  qui passe ici est ce que passerait n'importe qui avec l'adresse du
#  projet. La migration est chargée TELLE QUELLE.
#
#  Usage :  PGPORT=5433 ./correr-rls.sh
# =====================================================================
set -euo pipefail

aqui="$(cd "$(dirname "$0")" && pwd)"
: "${PGHOST:=/tmp}" "${PGPORT:=5432}" "${PGUSER:=postgres}" "${PGDATABASE:=rls_prueba}"
export PGHOST PGPORT PGUSER

psql -d postgres -q -c "drop database if exists $PGDATABASE;" -c "create database $PGDATABASE;"

for f in "$aqui/10-rls.sql" \
         "$aqui/../migrations/0039_la_rls_que_faltaba.sql" \
         "$aqui/11-pruebas-rls.sql"; do
  salida=$(psql -d "$PGDATABASE" -v ON_ERROR_STOP=1 -q -f "$f" 2>&1) && bien=1 || bien=0
  echo "$salida" | grep -E "ok |FALLA" || true
  if [ "$bien" -ne 1 ] || echo "$salida" | grep -q FALLA; then
    echo "— FALLÓ en $(basename "$f") —"; exit 1
  fi
done

echo "— todo verde —"
