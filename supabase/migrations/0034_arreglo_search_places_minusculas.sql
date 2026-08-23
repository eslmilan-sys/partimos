-- =====================================================================
--  MIGRATION 0034 — La recherche ignore la casse, pour de bon.
--
--  LE BUG. 0033 comparait avec `like`, qui distingue les majuscules, en
--  s'appuyant sur `inmutable_unaccent` — qui enlève les accents mais ne
--  touche pas à la casse. Résultat : « multiplaza » ne trouvait pas
--  « Multiplaza Pacific », et toute requête en minuscules ratait tout nom
--  capitalisé, c'est-à-dire à peu près tous. La 0013 utilisait `ilike` ;
--  le passage à `like` a perdu l'insensibilité en chemin.
--
--  LE REMÈDE. La même fonction, à un détail près : les deux côtés de
--  chaque comparaison passent par `lower()`. Les alias étaient déjà
--  stockés en minuscules (`normalized_alias`) ; c'est le texte demandé et
--  le nom du lieu qui ne l'étaient pas. Le classement, les gardes de
--  longueur et le contexte administratif ne bougent pas.
--
--  (Déjà appliquée sur le projet sous ce même nom le 2026-08-23, au moment
--  où le bug a été trouvé ; ce fichier la met dans l'historique du dépôt.)
-- =====================================================================

set search_path = public, extensions;

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
      lower(inmutable_unaccent (btrim(coalesce(q, '')))) as texto,
      length(btrim(coalesce(q, ''))) as largo
  ),
  candidatos as (
    select
      p.id,
      -- La meilleure ressemblance entre le nom et n'importe quel alias.
      greatest(
        similarity (lower(inmutable_unaccent (p.name)), d.texto),
        coalesce(max(similarity (a.normalized_alias, d.texto)), 0)
      ) as parecido,
      bool_or(
        lower(inmutable_unaccent (p.name)) like d.texto || '%'
        or a.normalized_alias like d.texto || '%'
      ) as empieza_por
    from places p
    cross join pedido d
    left join place_aliases a on a.place_id = p.id
    where d.largo between 2 and 120
      and p.is_public
      and (
        lower(inmutable_unaccent (p.name)) like '%' || d.texto || '%'
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
  'Cherche un lieu par son nom ou un de ses alias, sans accents ni casse, et rend son contexte administratif. Refuse une requête de moins de 2 ou de plus de 120 caractères.';
