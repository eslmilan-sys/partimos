-- =====================================================================
--  MIGRATION 0022 — CUALQUIER RUTA, Y EL LUGAR EXACTO DEL VIAJE
--
--  (Aplicada al proyecto de producción el 17/08/2026. Este archivo la
--  deja escrita en el repositorio, que es donde se lee la historia.)
--
--  Dos cosas que el esquema de origen no dejaba decir.
--
--  1. `trips.corridor_id` era NOT NULL. Un corredor es una pareja de
--     ciudades PREDEFINIDA — hay seis. Pero la app arma la ruta sola
--     para cualquier par de ciudades del país (ver lib/corridors.ts,
--     buildRoute): un viaje Penonomé → Soná es perfectamente válido y
--     no tiene corredor. Con la columna obligatoria, publicarlo era
--     imposible. Ahora el corredor es lo que siempre debió ser: una
--     ETIQUETA editorial cuando existe, no un requisito.
--
--  2. El viaje no sabía de DÓNDE sale exactamente. Guardaba dos ids de
--     ciudad; el conductor que escribe «Multiplaza» veía su viaje
--     anunciado como «Ciudad de Panamá». Es el mismo error que
--     lib/place.ts corrige del lado del navegador, y tenía que
--     corregirse también aquí: el nombre elegido se guarda tal cual, la
--     ciudad queda como contexto, y las coordenadas sirven para el
--     matching sin mostrarse nunca.
--
--  La restricción `trips_tiene_recorrido` cierra el hueco que abre el
--  punto 1: un viaje sin corredor DEBE traer sus dos etiquetas. Nunca
--  puede existir un viaje que no sepa a dónde va.
-- =====================================================================

alter table trips alter column corridor_id drop not null;

alter table trips
  add column if not exists origin_place_id      bigint references places(id),
  add column if not exists destination_place_id bigint references places(id),
  add column if not exists origin_label         text,
  add column if not exists destination_label    text,
  add column if not exists origin_lat           numeric(9,6),
  add column if not exists origin_lng           numeric(9,6),
  add column if not exists destination_lat      numeric(9,6),
  add column if not exists destination_lng      numeric(9,6);

alter table trips drop constraint if exists trips_tiene_recorrido;
alter table trips add constraint trips_tiene_recorrido check (
  corridor_id is not null
  or (origin_label is not null and destination_label is not null)
);

comment on column trips.corridor_id is
  'Corredor editorial cuando la pareja de ciudades es una de las predefinidas. NULL para una ruta armada sobre la red vial.';
comment on column trips.origin_label is
  'El lugar de salida TAL COMO lo escribió el conductor. Nunca se reemplaza por el nombre de la ciudad.';
comment on column trips.destination_label is
  'El lugar de llegada tal como lo escribió el conductor.';
