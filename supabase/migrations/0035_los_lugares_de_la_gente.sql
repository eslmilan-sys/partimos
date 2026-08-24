-- =====================================================================
--  MIGRATION 0035 — Les lieux que les gens écrivent eux-mêmes.
--
--  LE MANQUE. OpenStreetMap ne connaît pas « PH Torre Mistral » si
--  personne ne l'a cartographié, et Google ne peut pas combler le trou :
--  ses conditions interdisent de garder ses résultats. Le seul index des
--  points de rendez-vous panaméens qui puisse nous appartenir est celui
--  qu'écrivent ceux qui montent dans les voitures.
--
--  0013 avait prévu la place — `source = 'usuario'` existe depuis toujours
--  — mais rien ne l'a jamais remplie.
--
--  ── LA RÈGLE, ET POURQUOI ELLE EST CELLE-LÀ ──
--
--  Un point écrit par quelqu'un entre tout de suite, mais **invisible aux
--  autres**. Il devient public quand une DEUXIÈME personne s'en sert.
--
--  Le compte se fait sur des personnes distinctes, pas sur des usages :
--  sinon celui qui publie dix trajets rendrait public son propre texte, et
--  la recherche de tout le pays afficherait ce qu'il a bien voulu écrire.
--  Deux personnes qui se donnent le même rendez-vous, c'est un lieu ; une
--  personne qui se le donne dix fois, c'est une habitude.
--
--  Ça évite aussi une file de modération que personne ne tiendrait.
--
--  ── POURQUOI SECURITY DEFINER ──
--
--  La promotion écrit `is_public`, et aucune politique RLS ne le permet —
--  c'est voulu : si le client pouvait le faire, la règle des deux
--  personnes ne servirait à rien. La fonction s'exécute donc élevée, avec
--  un `search_path` figé, ses arguments validés, et l'exécution accordée
--  aux seuls comptes connectés. C'est le seul endroit du schéma qui peut
--  rendre un lieu public.
-- =====================================================================

set search_path = public, extensions;

-- ---------------------------------------------------------------------
--  Qui s'est servi de quoi. Une ligne par personne et par lieu : c'est ce
--  qui rend la règle des deux personnes impossible à contourner seul.
-- ---------------------------------------------------------------------

create table if not exists place_usos (
  place_id   bigint not null references places (id) on delete cascade,
  profile_id uuid   not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (place_id, profile_id)
);

comment on table place_usos is
  'Qui s''est servi de quel lieu. Sert au compte de personnes distinctes qui rend un lieu d''utilisateur public. Aucune politique RLS : seule recordar_lugar y touche.';

create index if not exists place_usos_lugar on place_usos (place_id);

alter table place_usos enable row level security;
-- Volontairement sans politique : personne ne lit ni n'écrit cette table
-- depuis le client. RLS active + zéro politique = fermé à tous sauf au
-- propriétaire et aux fonctions SECURITY DEFINER.

-- ---------------------------------------------------------------------
--  Se souvenir d'un lieu qu'on a écrit
-- ---------------------------------------------------------------------

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
  -- Sans compte, rien. La règle des deux personnes n'a de sens que si on
  -- sait les distinguer.
  if quien is null then return null; end if;

  -- Les mêmes bornes que la recherche : ni un caractère perdu, ni un
  -- paragraphe collé dans le champ.
  if length(limpio) < 3 or length(limpio) > 120 then return null; end if;

  -- La ville doit être une de celles qu'on dessert : `places.city_slug`
  -- est une clé étrangère, et on ne crée pas de ville en passant.
  if not exists (select 1 from cities c where c.slug = ciudad and c.country_code = 'PA') then
    return null;
  end if;

  normal := lower(inmutable_unaccent (limpio));
  clave  := 'u:' || md5(ciudad || '|' || normal);

  -- Le point donné s'il existe, sinon le centre de la ville. Jamais une
  -- coordonnée inventée : elle entrerait dans le calcul du coût.
  if lat is not null and lng is not null then
    punto := st_setsrid (st_makepoint (lng, lat), 4326)::geography;
  else
    select st_setsrid (st_makepoint (c.lng, c.lat), 4326)::geography
      into punto
      from cities c
     where c.slug = ciudad and c.lat is not null and c.lng is not null;
  end if;
  if punto is null then return null; end if;

  -- Déjà connu, quelle que soit sa source ? Alors on ne le récrit pas :
  -- on compte son usage, ce qui fait monter son rang.
  select p.id into id_lugar
    from places p
   where p.city_slug = ciudad
     and lower(inmutable_unaccent (p.name)) = normal
   limit 1;

  if id_lugar is null then
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

  -- La promotion. Deux personnes distinctes, et le lieu sort au jour.
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
  'Enregistre un lieu écrit par un utilisateur, invisible aux autres, et le rend public dès qu''une deuxième personne s''en sert. SECURITY DEFINER parce que la promotion écrit is_public, qu''aucune politique RLS n''autorise — c''est ce qui rend la règle incontournable.';

-- L'exécution n'est pas ouverte à tout le monde : un anonyme n'a pas de
-- `auth.uid()`, donc rien à y faire, et l'appel serait du bruit.
revoke all on function recordar_lugar (text, text, double precision, double precision) from public;
revoke all on function recordar_lugar (text, text, double precision, double precision) from anon;
grant execute on function recordar_lugar (text, text, double precision, double precision) to authenticated;
