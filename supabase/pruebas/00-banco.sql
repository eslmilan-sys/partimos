-- =====================================================================
--  BANC D'ESSAI — le strict nécessaire pour exécuter la VRAIE recherche.
--
--  Ce Postgres n'a pas PostGIS. On ne réécrit pas les migrations pour
--  autant : on pose sous elles un plancher qui a la même forme — un type
--  `geography` et les quatre fonctions `st_*` qu'elles appellent — et on
--  charge ensuite les fichiers 0033, 0034, 0035, 0036 TELS QUELS.
--
--  Ce qui est testé est donc le code qui part en production, pas une
--  copie. Ce qui est simulé, c'est la géométrie — et aucun des tests ne
--  porte sur une distance.
-- =====================================================================

create extension if not exists pg_trgm;
create extension if not exists unaccent;
create extension if not exists pgcrypto;

-- Les rôles Supabase, pour que les `grant` des migrations aient une cible.
do $$ begin create role anon; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated; exception when duplicate_object then null; end $$;

-- ── Le plancher géométrique ──────────────────────────────────────────
create domain geometry  as point;
create domain geography as point;

create or replace function st_makepoint (lng double precision, lat double precision)
returns geometry language sql immutable as $$ select point($1, $2)::geometry $$;

create or replace function st_setsrid (g geometry, srid integer)
returns geometry language sql immutable as $$ select $1 $$;

create or replace function st_x (g geometry) returns double precision
language sql immutable as $$ select ($1::point)[0] $$;

create or replace function st_y (g geometry) returns double precision
language sql immutable as $$ select ($1::point)[1] $$;

-- Un degré ≈ 111 320 m. Suffisant : aucun test ne juge une distance.
create or replace function st_dwithin (a geography, b geography, d double precision)
returns boolean language sql immutable as $$
  select ($1::point <-> $2::point) * 111320 <= $3
$$;

-- ── auth.uid(), pilotable depuis le test ─────────────────────────────
create schema if not exists auth;
create or replace function auth.uid () returns uuid
language sql stable as $$
  select nullif(current_setting('prueba.uid', true), '')::uuid
$$;

-- ── Les tables que 0033-0036 supposent déjà là ───────────────────────
create table cities (
  country_code char(2) not null default 'PA',
  slug         text    not null,
  name         text    not null,
  lat          double precision,
  lng          double precision,
  primary key (country_code, slug)
);
create unique index cities_slug on cities (slug);

create table profiles (id uuid primary key);

do $$ begin
  create type place_source as enum ('osm', 'overture', 'usuario', 'catalogo');
exception when duplicate_object then null; end $$;

create table places (
  id bigserial primary key,
  name text not null,
  kind text,
  country_code char(2) not null default 'PA',
  city_slug text not null,
  address text,
  geom geography not null,
  source place_source not null,
  source_id text,
  used_count integer not null default 0,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  unique (source, source_id),
  foreign key (country_code, city_slug) references cities (country_code, slug)
);

create or replace function inmutable_unaccent (text)
returns text language sql immutable parallel safe strict
set search_path = public, extensions
as $$ select unaccent('unaccent', $1) $$;

create index places_name_trgm
  on places using gin (inmutable_unaccent (name) gin_trgm_ops);
