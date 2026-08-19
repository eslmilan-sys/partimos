-- 0013 — NUESTRA PROPIA BASE DE LUGARES
--
-- Por qué existe
-- ==============
-- Hoy el buscador de direcciones llama a un geocodificador externo en cada
-- tecla: es lento, se corta sin señal, cuesta por petición y — sobre todo —
-- no encuentra lo que la gente escribe de verdad en Panamá («PH Torre
-- Mistral», «la bomba de Divisa», «entrada de Villa Lucre»). Además, sus
-- términos NO permiten guardar los resultados: Google prohíbe almacenar
-- todo salvo el place_id, y Mapbox solo tolera una caché temporal. O sea:
-- no se puede «bajar Google y guardarlo».
--
-- Lo que sí se puede, y es lo que hace esta tabla:
--   1. OpenStreetMap (extracto de Panamá, Geofabrik) — licencia ODbL:
--      libre de copiar, transformar y servir, con atribución «© OpenStreetMap
--      contributors» y share-alike sobre la base derivada.
--   2. Overture Maps (places) — licencia CDLA-Permissive 2.0, aún más
--      libre; sus buildings vienen de OSM y siguen ODbL.
--   3. LO NUESTRO: cada punto exacto que un usuario escribe y confirma
--      entra aquí. Es la parte que ningún proveedor tiene — el PH, la
--      bomba, la entrada de la barriada. Con el tiempo es el activo real.
--
-- El geocodificador externo queda de RESPALDO para lo que no tengamos,
-- no de motor principal.

-- Supabase instala las extensiones en el esquema `extensions`; un
-- Postgres nuevo las pone en `public`. Nombrar `public.unaccent(...)` a
-- mano rompía en el primer caso. Se resuelve por search_path — un
-- esquema que no existe se ignora sin error, así que la misma línea vale
-- para los dos mundos.
set search_path = public, extensions;

create extension if not exists postgis;
create extension if not exists pg_trgm;
create extension if not exists unaccent;

-- Idempotente: pegar el archivo dos veces no debe reventar.
do $$ begin
  create type place_source as enum ('osm', 'overture', 'usuario', 'catalogo');
exception when duplicate_object then null;
end $$;

create table if not exists places (
  id bigserial primary key,
  -- Nombre tal como la gente lo dice. Sin normalizar de más: «PH Torre
  -- Mistral» se busca como «torre mistral» gracias al índice trigrama.
  name text not null,
  -- Categoría cruda del origen (amenity=fuel, building=apartments…).
  kind text,
  -- La ciudad se referencia por su PAR (país, slug): en `cities` la clave
  -- única es (country_code, slug), no el slug solo — el mismo 'santiago'
  -- existe en varios países y la plataforma ya mira hacia Venezuela.
  country_code char(2) not null default 'PA',
  city_slug text not null,
  -- Dirección legible, si el origen la trae.
  address text,
  geom geography (point, 4326) not null,
  source place_source not null,
  -- id en el origen (node/123456, overture GERS id) — para reimportar sin
  -- duplicar.
  source_id text,
  -- Cuántas veces se ha usado de verdad como punto de recogida. Es el
  -- ranking honesto: lo que la gente usa sube, no lo que pagó por subir.
  used_count integer not null default 0,
  -- Los puntos de usuario esperan confirmación antes de salir en público.
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  unique (source, source_id),
  foreign key (country_code, city_slug) references cities (country_code, slug)
);

-- `unaccent()` se declara STABLE, y Postgres no acepta funciones que no
-- sean IMMUTABLE dentro de un índice. La envoltura de abajo es el patrón
-- estándar: mismo texto → mismo resultado, siempre.
create or replace function inmutable_unaccent (text)
returns text
language sql
immutable
parallel safe
strict
set search_path = public, extensions
as $$ select unaccent('unaccent', $1) $$;

-- Búsqueda por texto: trigramas sobre el nombre sin acentos. Es lo que
-- hace que «torre mistral», «Torre Mistral» y «PH torre mistral» caigan
-- en el mismo sitio.
create index if not exists places_name_trgm
  on places using gin (inmutable_unaccent (name) gin_trgm_ops);
create index if not exists places_city on places (country_code, city_slug);
create index if not exists places_geom on places using gist (geom);

alter table places enable row level security;

-- Leer es público: buscar una dirección no necesita cuenta.
drop policy if exists places_read on places;
create policy places_read on places for select using (is_public);

-- Escribir: solo usuarios conectados, y solo puntos suyos («usuario»).
-- Nadie inyecta lugares 'osm' desde el navegador.
drop policy if exists places_insert_own on places;
create policy places_insert_own on places for insert to authenticated
  with check (source = 'usuario');

/**
 * BUSCAR UN LUGAR — una sola llamada, ordenada por cercanía y uso.
 *
 * `near` es la ciudad donde el usuario está buscando: dos «Super 99» a
 * 200 km no compiten, gana el de su ciudad. Sin `near`, ordena por uso.
 */
create or replace function search_places(
  q text,
  near_city text default null,
  max_results integer default 8
)
returns table (
  id bigint,
  name text,
  kind text,
  city_slug text,
  address text,
  lat double precision,
  lng double precision,
  source place_source
)
language sql
stable
set search_path = public, extensions
as $$
  select
    p.id,
    p.name,
    p.kind,
    p.city_slug,
    p.address,
    st_y (p.geom::geometry) as lat,
    st_x (p.geom::geometry) as lng,
    p.source
  from places p
  where p.is_public
    and (near_city is null or p.city_slug = near_city
         or similarity (inmutable_unaccent (p.name), inmutable_unaccent (q)) > 0.45)
    and inmutable_unaccent (p.name) ilike '%' || inmutable_unaccent (q) || '%'
  order by
    (p.city_slug = coalesce(near_city, p.city_slug)) desc,
    similarity (inmutable_unaccent (p.name), inmutable_unaccent (q)) desc,
    p.used_count desc
  limit greatest(1, least(max_results, 20));
$$;

/**
 * APUNTAR QUE UN LUGAR SE USÓ.
 *
 * Se llama cuando una reserva se confirma con ese punto — no cuando se
 * teclea. Lo que sube el ranking es el uso real, no la curiosidad.
 */
create or replace function bump_place(place_id bigint)
returns void
language sql
volatile
set search_path = public, extensions
as $$
  update places set used_count = used_count + 1 where id = place_id;
$$;

comment on table places is
  'Lugares buscables. Origen OSM (ODbL, atribución obligatoria en la app), Overture (CDLA-Permissive) y puntos escritos por los usuarios. Ver scripts/import-places.mjs.';
