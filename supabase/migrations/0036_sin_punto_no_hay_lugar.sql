-- =====================================================================
--  MIGRATION 0036 — Sans point, pas de lieu.
--
--  LA CORRECTION, décidée par l'utilisateur le 24-08-2026 :
--
--    « Si l'utilisateur met un point qui n'existe pas, il ne faut pas le
--      garder : on n'a pas l'adresse et il n'y a pas de carte pour placer
--      un point. »
--
--  Et il a raison. 0035 créait le lieu en lui donnant le centre de sa
--  ville faute de mieux. Pour un catalogue de villes c'était acceptable —
--  un écart de trois kilomètres sur un trajet de deux cent cinquante.
--  Pour un POINT DE RENDEZ-VOUS, non : le conducteur doit savoir OÙ
--  s'arrêter. « PH Torre Mistral » posé au centre de la capitale n'est pas
--  un point de rendez-vous, c'est un nom qui flotte. Et il entrerait dans
--  le calcul de la distance comme s'il était juste.
--
--  ── LA LIGNE QUE JE TRACE, ET POURQUOI LÀ ──
--
--  On garde un lieu écrit par quelqu'un **si et seulement si il arrive
--  avec ses coordonnées** — c'est-à-dire quand il a été choisi dans une
--  liste de suggestions qui les portait. Là, ce n'est plus du texte
--  flottant : c'est un point situé, et l'objection tombe.
--
--  Sans coordonnées, on ne crée rien. On compte seulement l'usage d'un
--  lieu qui existait DÉJÀ, ce qui fait monter son rang sans rien inventer.
--
--  Le texte libre continue de vivre là où il a toujours vécu :
--  `trips.origin_label`, « le lieu TEL QUE le conducteur l'a écrit »
--  (migration 0022). Il sert au trajet, il ne devient pas une entrée du
--  catalogue que tout le pays cherchera.
-- =====================================================================

set search_path = public, extensions;

create or replace function recordar_lugar (
  nombre text,
  ciudad text,
  lat double precision default null,
  lng double precision default null
)
returns bigint
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  quien      uuid := auth.uid();
  limpio     text := btrim(coalesce(nombre, ''));
  normal     text;
  clave      text;
  punto      geography;
  id_lugar   bigint;
  personas   integer;
begin
  if quien is null then return null; end if;
  if length(limpio) < 3 or length(limpio) > 120 then return null; end if;

  if not exists (select 1 from cities c where c.slug = ciudad and c.country_code = 'PA') then
    return null;
  end if;

  normal := lower(inmutable_unaccent (limpio));

  -- Déjà connu ? Alors on compte l'usage, quelle que soit sa source et
  -- qu'on ait ou non des coordonnées : le lieu, lui, en a déjà.
  select p.id into id_lugar
    from places p
   where p.city_slug = ciudad
     and lower(inmutable_unaccent (p.name)) = normal
   limit 1;

  -- Inconnu ET sans coordonnées : on ne le garde pas. C'est la règle.
  -- Un nom sans point n'est pas un endroit où une voiture peut s'arrêter,
  -- et lui prêter le centre de la ville serait une coordonnée inventée.
  if id_lugar is null and (lat is null or lng is null) then
    return null;
  end if;

  if id_lugar is null then
    clave := 'u:' || md5(ciudad || '|' || normal);
    punto := st_setsrid (st_makepoint (lng, lat), 4326)::geography;

    insert into places (name, kind, country_code, city_slug, geom, source, source_id, is_public)
    values (limpio, 'usuario', 'PA', ciudad, punto, 'usuario'::place_source, clave, false)
    on conflict (source, source_id) do nothing
    returning id into id_lugar;

    -- Deux personnes au même instant : l'autre a gagné, on prend le sien.
    if id_lugar is null then
      select p.id into id_lugar
        from places p
       where p.source = 'usuario'::place_source and p.source_id = clave;
    end if;
  end if;

  if id_lugar is null then return null; end if;

  insert into place_usos (place_id, profile_id)
  values (id_lugar, quien)
  on conflict do nothing;

  update places set used_count = used_count + 1 where id = id_lugar;

  -- La promotion ne concerne que les lieux d'utilisateur, et il faut deux
  -- personnes distinctes. Voir 0035 pour le pourquoi.
  select count(*) into personas from place_usos u where u.place_id = id_lugar;
  if personas >= 2 then
    update places
       set is_public = true
     where id = id_lugar
       and source = 'usuario'::place_source
       and not is_public;
  end if;

  return id_lugar;
end $$;

comment on function recordar_lugar (text, text, double precision, double precision) is
  'Compte l''usage d''un lieu. N''en crée un que s''il arrive AVEC ses coordonnées : un nom sans point n''est pas un endroit où une voiture peut s''arrêter, et lui prêter le centre de sa ville serait une coordonnée inventée. Le texte libre reste dans trips.origin_label, il n''entre pas au catalogue.';

-- Ce qui a pu entrer sous 0035 sans vraies coordonnées — c'est-à-dire posé
-- au centre de sa ville — n'a pas à rester cherchable. Rien n'est effacé :
-- on le retire du public, et la ligne garde sa trace.
update places p
   set is_public = false
 where p.source = 'usuario'::place_source
   and exists (
     select 1 from cities c
      where c.slug = p.city_slug
        and c.lat is not null and c.lng is not null
        and st_dwithin (p.geom, st_setsrid (st_makepoint (c.lng, c.lat), 4326)::geography, 1)
   );
