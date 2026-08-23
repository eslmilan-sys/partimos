-- =====================================================================
--  MIGRATION 0031 — Chaque voyage sait sa ville.
--
--  LE PROBLÈME. `origin_label` garde « le lieu TEL QUE le conducteur l'a
--  écrit » — c'est la règle de 0022 et elle est bonne. Mais alors rien sur
--  un voyage ne dit dans quelle VILLE ce lieu se trouve : vingt écrans
--  font `origin_label.split(' · ')[0]` et croient tenir une ville, alors
--  qu'ils tiennent « Albrook », qui est un quartier de la capitale.
--
--  Résultat : « Prochains départs depuis Panamá » annonce « Albrook », et
--  personne hors de la ville ne sait où c'est.
--
--  LA CORRECTION. Deux colonnes qui disent la ville, à côté de l'étiquette
--  qui dit le lieu exact. Les deux vivent ensemble et ne se remplacent
--  jamais — c'est exactement la règle qu'énonce déjà `dominio/lugar.ts` :
--  « la ciudad es un complemento de dirección, jamás un reemplazo ».
--
--  Ce que ça permet, et qui était impossible avant :
--    · les blocs de découverte disent la VILLE (« Ciudad de Panamá »)
--    · la page d'offres dit VILLE · POINT EXACT
--    · « Destinations populaires » peut grouper pour de vrai
--
--  Pour un couloir éditorial la ville est déjà connue : elle vient du
--  couloir. Pour une route libre elle se déduit du point le plus proche,
--  et l'app la fixe au moment de publier.
-- =====================================================================

alter table trips
  add column if not exists origin_city_id      uuid references cities(id),
  add column if not exists destination_city_id uuid references cities(id);

comment on column trips.origin_city_id is
  'La ville du départ. Complète origin_label, ne le remplace jamais : l''étiquette dit le lieu exact, celle-ci dit où il est.';
comment on column trips.destination_city_id is
  'La ville de l''arrivée. Même règle que origin_city_id.';

-- Les voyages qui ont un couloir savent déjà : la ville vient de lui.
update trips t
   set origin_city_id      = c.origin_city_id,
       destination_city_id = c.destination_city_id
  from corridors c
 where c.id = t.corridor_id
   and (t.origin_city_id is null or t.destination_city_id is null);

-- ATTENTION, le piège : un couloir a un SENS éditorial (Panamá → Chitré)
-- mais un voyage peut le parcourir à l'envers. La reprise ci-dessus a donc
-- donné « Ciudad de Panamá » à des retours qui partent de Chitré. On se fie
-- à l'étiquette, qui, elle, dit la vérité.
with mal as (
  select t.id, t.origin_city_id as o, t.destination_city_id as d
    from trips t
    join cities cd on cd.id = t.destination_city_id
   where split_part(t.origin_label, ' · ', 1) = cd.name
)
update trips t
   set origin_city_id = mal.d, destination_city_id = mal.o
  from mal where mal.id = t.id;

-- Une route libre sans ville : la plus proche du point, à vol d'oiseau.
-- Sert de filet pour les lignes déjà écrites ; l'app, elle, la fixe en
-- publiant, où elle connaît le lieu choisi et n'a pas à deviner.
update trips t
   set origin_city_id = (
         select c.id from cities c
          where c.lat is not null and c.lng is not null
          order by (c.lat - t.origin_lat) ^ 2 + (c.lng - t.origin_lng) ^ 2
          limit 1)
 where t.origin_city_id is null and t.origin_lat is not null;

update trips t
   set destination_city_id = (
         select c.id from cities c
          where c.lat is not null and c.lng is not null
          order by (c.lat - t.destination_lat) ^ 2 + (c.lng - t.destination_lng) ^ 2
          limit 1)
 where t.destination_city_id is null and t.destination_lat is not null;

create index if not exists trips_ciudad_origen  on trips (origin_city_id);
create index if not exists trips_ciudad_destino on trips (destination_city_id);

-- ---------------------------------------------------------------------
--  La vue que lit la recherche apprend les deux noms. Colonnes AJOUTÉES
--  EN FIN : les lecteurs existants ne bougent pas d'un caractère.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW available_trips AS
SELECT
  t.id, t.driver_id, t.corridor_id, t.departure_at, t.arrival_estimate_at,
  t.price_cents, t.gender_preference, t.seats_offered,
  t.seats_offered - seats_taken(t.id) AS seats_available,
  c.slug AS corridor_slug, c.distance_km, c.bus_price_cents,
  p.first_name, p.last_initial, p.photo_url, p.is_id_verified,
  v.make, v.model, v.color, v.category_code,
  v.year, v.rate_per_km_cents, v.photo_path,
  t.origin_label, t.destination_label,
  co.name AS origin_city, cd.name AS destination_city,
  co.slug AS origin_city_slug, cd.slug AS destination_city_slug
FROM trips t
LEFT JOIN corridors c ON c.id = t.corridor_id
JOIN profiles  p ON p.id = t.driver_id
JOIN vehicles  v ON v.id = t.vehicle_id
LEFT JOIN cities co ON co.id = t.origin_city_id
LEFT JOIN cities cd ON cd.id = t.destination_city_id
WHERE t.status = 'published'
  AND t.departure_at > now()
  AND p.is_suspended = false
  AND t.seats_offered - seats_taken(t.id) > 0;
