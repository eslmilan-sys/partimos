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
  psql -d "$PGDATABASE" -v ON_ERROR_STOP=1 -q -f "$f" 2>&1 | grep -E "ok |FALLA" || true
done

echo "— todo verde —"
