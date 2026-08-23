-- =====================================================================
--  MIGRATION 0033 — Où ça se trouve vraiment, et comment on l'appelle.
--
--  Deux manques que la recherche d'adresse a réellement, au Panama :
--
--  1. ON NE SAIT PAS SITUER. `places` dit « Multiplaza » et rattache à une
--     des 32 villes desservies. Mais un Panaméen situe par province,
--     district et corregimiento — c'est comme ça qu'on distingue les deux
--     « Santa Rosa », et c'est l'information que la liste de résultats doit
--     afficher sous le nom.
--
--  2. ON NE CONNAÎT QU'UN SEUL NOM. « PH Torre Mistral », « Torre Mistral »
--     et « torre mistral » sont le même immeuble ; « Aeropuerto de Tocumen »
--     s'appelle aussi « Tocumen » et « PTY ». Un seul champ `name` ne peut
--     pas porter ça.
--
--  ── LA DÉCISION D'ARCHITECTURE : UNE TABLE, PAS TROIS ──
--
--  Trois tables (provinces / districts / corregimientos) forceraient les
--  cinq comarcas indigènes dans la case « province », ce qu'elles ne sont
--  pas — et deux d'entre elles (Madungandí, Wargandí) se situent au niveau
--  d'un corregimiento, pas d'une province. Une table unique avec un niveau
--  déclaré et un parent dit la réalité sans la tordre, et n'oblige personne
--  à faire trois jointures pour écrire « Boquete, Chiriquí ».
--
--  ── CE QU'ON NE FAIT PAS ──
--
--  Aucune donnée n'est écrite ici. Les provinces, districts et
--  corregimientos du Panama ne s'inventent pas : ils arrivent par
--  `scripts/importar-lugares.mjs`, depuis OpenStreetMap, où ils sont
--  cartographiés en `boundary=administrative` aux niveaux 4, 6 et 8. Les
--  alias non plus ne s'inventent pas : ils viennent des étiquettes
--  `alt_name`, `short_name` et `official_name` du même relevé.
-- =====================================================================

set search_path = public, extensions;

-- ---------------------------------------------------------------------
--  1. La géographie administrative
-- ---------------------------------------------------------------------

create table if not exists admin_areas (
  id            uuid primary key default gen_random_uuid(),

  -- Le niveau est déclaré, pas déduit d'une place dans une hiérarchie de
  -- tables. C'est ce qui permet à une comarca d'être ce qu'elle est.
  nivel         text not null check (nivel in ('provincia', 'comarca', 'distrito', 'corregimiento')),

  -- Null pour un premier niveau. Une comarca peut être parent d'un
  -- district OU d'un corregimiento : les cinq comarcas ne sont pas toutes
  -- au même rang, et la table ne prétend pas le contraire.
  parent_id     uuid references admin_areas (id) on delete restrict,

  name          text not null,
  -- Sans accents et en minuscules : c'est la clé de recherche, `name`
  -- reste le nom qu'on affiche.
  normalized_name text not null,

  country_code  char(2) not null default 'PA' check (country_code = 'PA'),

  -- D'où ça vient, pour pouvoir réimporter sans dupliquer.
  source        text not null default 'osm',
  source_id     text,

  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique (source, source_id)
);

comment on table admin_areas is
  'Provinces, comarcas, districts et corregimientos du Panama. Une seule table à niveau déclaré : les comarcas ne sont pas des provinces et ne sont pas toutes au même rang. Peuplée par l''import OSM, jamais à la main.';

create index if not exists admin_areas_padre on admin_areas (parent_id);
create index if not exists admin_areas_nivel on admin_areas (nivel) where active;
create index if not exists admin_areas_nombre_trgm
  on admin_areas using gin (normalized_name gin_trgm_ops);

/**
 * UN PARENT DOIT ÊTRE D'UN RANG SUPÉRIEUR.
 *
 * Une contrainte CHECK ne peut pas interroger une autre ligne, donc c'est
 * un trigger. Il refuse l'impossible — un district sous un corregimiento,
 * une province avec un parent — sans imposer une hiérarchie plus rigide
 * que le pays.
 */
create or replace function admin_area_padre_coherente()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  nivel_padre text;
begin
  if new.parent_id is null then
    if new.nivel in ('distrito', 'corregimiento') then
      raise exception 'Un % no puede existir sin su área madre.', new.nivel;
    end if;
    return new;
  end if;

  if new.nivel in ('provincia', 'comarca') then
    raise exception 'Una % es de primer nivel: no lleva área madre.', new.nivel;
  end if;

  select nivel into nivel_padre from admin_areas where id = new.parent_id;
  if nivel_padre is null then
    raise exception 'El área madre no existe.';
  end if;

  -- Un district pend d'une province ou d'une comarca ; un corregimiento
  -- d'un district ou, pour deux comarcas, directement d'elle.
  if new.nivel = 'distrito' and nivel_padre not in ('provincia', 'comarca') then
    raise exception 'Un distrito pende de una provincia o de una comarca, no de un %.', nivel_padre;
  end if;
  if new.nivel = 'corregimiento' and nivel_padre not in ('distrito', 'comarca') then
    raise exception 'Un corregimiento pende de un distrito o de una comarca, no de un %.', nivel_padre;
  end if;

  return new;
end $$;

drop trigger if exists trg_admin_area_padre on admin_areas;
create trigger trg_admin_area_padre
  before insert or update of nivel, parent_id on admin_areas
  for each row execute function admin_area_padre_coherente();

alter table admin_areas enable row level security;

-- La géographie du pays est publique : la chercher ne demande pas de compte.
drop policy if exists admin_areas_read on admin_areas;
create policy admin_areas_read on admin_areas for select using (active);

-- Personne n'écrit depuis le client. L'import passe par la clé de service.

-- ---------------------------------------------------------------------
--  2. Les autres noms d'un même lieu
-- ---------------------------------------------------------------------

create table if not exists place_aliases (
  id            bigserial primary key,
  place_id      bigint not null references places (id) on delete cascade,
  alias         text not null,
  normalized_alias text not null,
  source        place_source not null,
  created_at    timestamptz not null default now(),

  -- Le même autre-nom ne s'écrit qu'une fois par lieu.
  unique (place_id, normalized_alias)
);

comment on table place_aliases is
  'Les autres noms d''un lieu : abréviations, orthographes sans accent, noms officiels ou courants. Viennent des étiquettes OSM (alt_name, short_name, official_name) ou de ce que les gens ont tapé. Jamais inventés.';

create index if not exists place_aliases_trgm
  on place_aliases using gin (normalized_alias gin_trgm_ops);
create index if not exists place_aliases_lugar on place_aliases (place_id);

alter table place_aliases enable row level security;

-- Un alias se lit si et seulement si SON lieu se lit. Sans ce lien, un
-- alias serait une fuite : le nom d'un lieu retiré du public.
drop policy if exists place_aliases_read on place_aliases;
create policy place_aliases_read on place_aliases for select using (
  exists (select 1 from places p where p.id = place_id and p.is_public)
);

-- ---------------------------------------------------------------------
--  3. Un lieu sait dans quel corregimiento il tombe
-- ---------------------------------------------------------------------

alter table places
  add column if not exists admin_area_id uuid references admin_areas (id) on delete set null;

comment on column places.admin_area_id is
  'Le corregimiento — ou le district à défaut — où tombe le point. Sert à écrire le contexte sous le nom : « Punta Pacífica, San Francisco, Panamá ».';

create index if not exists places_admin_area on places (admin_area_id);

-- ---------------------------------------------------------------------
--  4. La recherche apprend les alias, le contexte, et refuse le vide
-- ---------------------------------------------------------------------

/**
 * LE CONTEXTE ÉCRIT, remonté jusqu'au premier niveau.
 *
 * « Punta Pacífica, San Francisco, Panamá » — du plus fin au plus large,
 * comme on le dit. Récursif parce que la profondeur varie : un
 * corregimiento de comarca n'a que deux ancêtres, pas trois.
 */
create or replace function contexto_administrativo(area uuid)
returns text
language sql
stable
set search_path = public
as $$
  with recursive subida as (
    select a.id, a.name, a.parent_id, 1 as paso
      from admin_areas a where a.id = area and a.active
    union all
    select p.id, p.name, p.parent_id, s.paso + 1
      from admin_areas p join subida s on p.id = s.parent_id
     where p.active and s.paso < 5
  )
  select string_agg(name, ', ' order by paso) from subida;
$$;

-- Le type de retour change : Postgres n'accepte pas un `create or replace`
-- dans ce cas, il faut retirer l'ancienne d'abord.
drop function if exists search_places (text, text, integer);

/**
 * CHERCHER UN LIEU — par son nom, par un de ses autres noms, et situé.
 *
 * Ce qui change depuis 0013 :
 *   · les alias comptent autant que le nom ;
 *   · le résultat porte son contexte administratif écrit ;
 *   · une requête vide, blanche, trop courte ou trop longue ne descend
 *     plus dans la table. Sans cette garde, `ilike '%%'` rendait la table
 *     entière triée par usage — une énumération, et un balayage cher.
 *
 * Le classement, du plus fort au plus faible : ce qui commence par ce
 * qu'on a tapé, puis la ressemblance, puis la ville cherchée, puis l'usage
 * réel. L'usage arrive en dernier exprès : il départage deux résultats
 * également bons, il n'en promeut pas un mauvais.
 */
create or replace function search_places (
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
  source place_source,
  contexto text
)
language sql
stable
set search_path = public, extensions
as $$
  with pedido as (
    select
      inmutable_unaccent (btrim(coalesce(q, ''))) as texto,
      length(btrim(coalesce(q, ''))) as largo
  ),
  candidatos as (
    select
      p.id,
      -- La meilleure ressemblance entre le nom et n'importe quel alias.
      greatest(
        similarity (inmutable_unaccent (p.name), d.texto),
        coalesce(max(similarity (a.normalized_alias, d.texto)), 0)
      ) as parecido,
      bool_or(
        inmutable_unaccent (p.name) like d.texto || '%'
        or a.normalized_alias like d.texto || '%'
      ) as empieza_por
    from places p
    cross join pedido d
    left join place_aliases a on a.place_id = p.id
    where d.largo between 2 and 120
      and p.is_public
      and (
        inmutable_unaccent (p.name) like '%' || d.texto || '%'
        or a.normalized_alias like '%' || d.texto || '%'
      )
    group by p.id, p.name, d.texto
  )
  select
    p.id,
    p.name,
    p.kind,
    p.city_slug,
    p.address,
    st_y (p.geom::geometry) as lat,
    st_x (p.geom::geometry) as lng,
    p.source,
    contexto_administrativo (p.admin_area_id) as contexto
  from candidatos c
  join places p on p.id = c.id
  order by
    c.empieza_por desc,
    (near_city is not null and p.city_slug = near_city) desc,
    c.parecido desc,
    p.used_count desc,
    p.name
  limit greatest(1, least(coalesce(max_results, 8), 20));
$$;

comment on function search_places (text, text, integer) is
  'Cherche un lieu par son nom ou un de ses alias, sans accents, et rend son contexte administratif. Refuse une requête de moins de 2 ou de plus de 120 caractères.';
