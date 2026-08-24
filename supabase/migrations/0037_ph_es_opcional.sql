-- =====================================================================
--  MIGRATION 0037 — « PH » est optionnel.
--
--  LE CAS RÉEL. L'immeuble s'appelle « Metric » dans OSM, mais personne
--  au Panama ne l'écrit comme ça : on tape « PH Metric », parce qu'un
--  immeuble résidentiel EST un PH (propiedad horizontal) et que c'est
--  comme ça qu'on le dit. La recherche exigeait que le texte tapé soit
--  contenu dans le nom : « ph metric » ne trouvait pas « Metric ».
--
--  LE REMÈDE. Quand la requête commence par « ph  », on cherche AUSSI le
--  reste sans ce préfixe. Ce n'est pas une donnée inventée — c'est de la
--  normalisation de requête, au même titre que les accents et la casse.
--  L'inverse marchait déjà : « torre mistral » trouve « PH Torre
--  Mistral », le nom contenant le texte tapé.
--
--  Rien d'autre ne bouge : mêmes gardes de longueur, même classement,
--  même contexte administratif.
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
  -- Le même texte, débarrassé d'un « ph » de tête s'il y en a un et qu'il
  -- reste au moins deux caractères derrière. Null sinon : pas de deuxième
  -- recherche pour rien.
  pedido2 as (
    select
      texto,
      largo,
      case
        when texto like 'ph %' and largo >= 5 then btrim(substr(texto, 3))
        else null
      end as texto_sin_ph
    from pedido
  ),
  candidatos as (
    select
      p.id,
      greatest(
        similarity (lower(inmutable_unaccent (p.name)), d.texto),
        coalesce(similarity (lower(inmutable_unaccent (p.name)), d.texto_sin_ph), 0),
        coalesce(max(similarity (a.normalized_alias, d.texto)), 0),
        coalesce(max(similarity (a.normalized_alias, d.texto_sin_ph)), 0)
      ) as parecido,
      bool_or(
        lower(inmutable_unaccent (p.name)) like d.texto || '%'
        or a.normalized_alias like d.texto || '%'
        or (d.texto_sin_ph is not null and (
          lower(inmutable_unaccent (p.name)) like d.texto_sin_ph || '%'
          or a.normalized_alias like d.texto_sin_ph || '%'
        ))
      ) as empieza_por
    from places p
    cross join pedido2 d
    left join place_aliases a on a.place_id = p.id
    where d.largo between 2 and 120
      and p.is_public
      and (
        lower(inmutable_unaccent (p.name)) like '%' || d.texto || '%'
        or a.normalized_alias like '%' || d.texto || '%'
        or (d.texto_sin_ph is not null and (
          lower(inmutable_unaccent (p.name)) like '%' || d.texto_sin_ph || '%'
          or a.normalized_alias like '%' || d.texto_sin_ph || '%'
        ))
      )
    group by p.id, p.name, d.texto, d.texto_sin_ph
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
  'Cherche un lieu par son nom ou un de ses alias, sans accents ni casse, et en ignorant un « PH » de tête — « ph metric » trouve « Metric ». Rend le contexte administratif. Refuse une requête de moins de 2 ou de plus de 120 caractères.';
