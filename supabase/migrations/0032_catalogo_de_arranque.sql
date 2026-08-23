-- =====================================================================
--  MIGRATION 0032 — Le catalogue d'amorçage.
--
--  LE PROBLÈME. `places` (0013) existe avec son index trigramme et sa
--  fonction `search_places`, et l'app l'interroge en premier à chaque
--  frappe. Mais la table est VIDE, et les trois clés de géocodage
--  commercial ne sont pas configurées. Donc on tape « Multiplaza » et on
--  ne trouve rien : la recherche ne connaît que les 32 villes servies.
--
--  CE QUE FAIT CE FICHIER. Il met dedans les lieux que les Panaméens
--  citent vraiment comme point de rendez-vous. Ce n'est PAS « toutes les
--  adresses » — c'est le noyau qui rend la recherche utile le premier
--  jour, sans clé, sans réseau, sans facture. L'import OpenStreetMap
--  (`scripts/importar-lugares.mjs`) le complète ensuite par dizaines de
--  milliers, et `source` distingue les deux pour toujours.
--
--  ── LA COORDONNÉE, ET POURQUOI ELLE EST CE QU'ELLE EST ──
--  Chaque entrée reçoit le point de SA VILLE, pas une coordonnée précise
--  écrite de mémoire. Une coordonnée inventée est pire que pas de
--  coordonnée : elle entre dans le calcul de la distance, donc du coût,
--  donc du plafond, et personne ne verrait l'erreur. La ville, elle, est
--  exacte — elle vient de `cities` — et sur un trajet interurbain l'écart
--  se compte en kilomètres, pas en dizaines. L'import OSM remplace ensuite
--  chaque point par le vrai.
--
--  ── CE QUI N'Y EST PAS, EXPRÈS ──
--  Aucun terminal de bus. `PRODUCT.md` en fait une condition juridique et
--  le design le contredit encore : le conflit est ouvert dans `CLAUDE.md`
--  et ce fichier ne le tranche pas tout seul.
-- =====================================================================

set search_path = public, extensions;

insert into places (name, kind, country_code, city_slug, address, geom, source, source_id, is_public)
select
  v.nombre,
  v.tipo,
  'PA',
  v.ciudad,
  c.name,
  c.geom_ciudad,
  'catalogo'::place_source,
  v.clave,
  true
from (values
  -- ── Ciudad de Panamá ────────────────────────────────────────────────
  ('Albrook Mall',                    'mall',        'panama-city', 'cat-albrook-mall'),
  ('Multiplaza Pacific',              'mall',        'panama-city', 'cat-multiplaza'),
  ('Metromall',                       'mall',        'panama-city', 'cat-metromall'),
  ('Altaplaza Mall',                  'mall',        'panama-city', 'cat-altaplaza'),
  ('Los Pueblos',                     'mall',        'panama-city', 'cat-los-pueblos'),
  ('Aeropuerto de Tocumen',           'aeropuerto',  'panama-city', 'cat-tocumen'),
  ('Aeropuerto Marcos A. Gelabert',   'aeropuerto',  'panama-city', 'cat-albrook-aero'),
  ('Universidad de Panamá',           'poi',         'panama-city', 'cat-up'),
  ('Hospital Santo Tomás',            'poi',         'panama-city', 'cat-santo-tomas'),
  ('Parque Omar',                     'poi',         'panama-city', 'cat-parque-omar'),
  ('Cinta Costera',                   'poi',         'panama-city', 'cat-cinta-costera'),
  ('Calzada de Amador',               'poi',         'panama-city', 'cat-amador'),
  ('Casco Antiguo',                   'barrio',      'panama-city', 'cat-casco'),
  ('Vía España',                      'barrio',      'panama-city', 'cat-via-espana'),
  ('Vía Argentina',                   'barrio',      'panama-city', 'cat-via-argentina'),
  ('Calle 50',                        'barrio',      'panama-city', 'cat-calle-50'),
  ('Costa del Este',                  'barrio',      'panama-city', 'cat-costa-del-este'),
  ('Punta Pacífica',                  'barrio',      'panama-city', 'cat-punta-pacifica'),
  ('Paitilla',                        'barrio',      'panama-city', 'cat-paitilla'),
  ('Marbella',                        'barrio',      'panama-city', 'cat-marbella'),
  ('Obarrio',                         'barrio',      'panama-city', 'cat-obarrio'),
  ('Bella Vista',                     'barrio',      'panama-city', 'cat-bella-vista'),
  ('El Cangrejo',                     'barrio',      'panama-city', 'cat-el-cangrejo'),
  ('San Francisco',                   'barrio',      'panama-city', 'cat-san-francisco'),
  ('Betania',                         'barrio',      'panama-city', 'cat-betania'),
  ('El Dorado',                       'barrio',      'panama-city', 'cat-el-dorado'),
  ('Pueblo Nuevo',                    'barrio',      'panama-city', 'cat-pueblo-nuevo'),
  ('Río Abajo',                       'barrio',      'panama-city', 'cat-rio-abajo'),
  ('Juan Díaz',                       'barrio',      'panama-city', 'cat-juan-diaz'),
  ('Villa Lucre',                     'barrio',      'panama-city', 'cat-villa-lucre'),
  ('Brisas del Golf',                 'barrio',      'panama-city', 'cat-brisas-del-golf'),
  ('Condado del Rey',                 'barrio',      'panama-city', 'cat-condado-del-rey'),
  ('Villa Zaita',                     'barrio',      'panama-city', 'cat-villa-zaita'),
  ('Las Cumbres',                     'barrio',      'panama-city', 'cat-las-cumbres'),
  ('Chilibre',                        'barrio',      'panama-city', 'cat-chilibre'),
  ('Tocumen',                         'barrio',      'panama-city', 'cat-tocumen-barrio'),
  ('24 de Diciembre',                 'barrio',      'panama-city', 'cat-24-diciembre'),
  ('Clayton',                         'barrio',      'panama-city', 'cat-clayton'),
  ('Ancón',                           'barrio',      'panama-city', 'cat-ancon'),
  ('Balboa',                          'barrio',      'panama-city', 'cat-balboa'),

  -- ── Panamá Oeste ────────────────────────────────────────────────────
  ('Panamá Pacífico',                 'barrio',      'arraijan',    'cat-panama-pacifico'),
  ('Vista Alegre',                    'barrio',      'arraijan',    'cat-vista-alegre'),
  ('Nuevo Chorrillo',                 'barrio',      'arraijan',    'cat-nuevo-chorrillo'),
  ('Burunga',                         'barrio',      'arraijan',    'cat-burunga'),
  ('Westland Mall',                   'mall',        'la-chorrera', 'cat-westland'),
  ('Puerto Caimito',                  'barrio',      'la-chorrera', 'cat-puerto-caimito'),
  ('El Coco',                         'barrio',      'la-chorrera', 'cat-el-coco'),
  ('Punta Chame',                     'poi',         'chame',       'cat-punta-chame'),
  ('Playa Coronado',                  'poi',         'coronado',    'cat-playa-coronado'),
  ('Playa El Palmar',                 'poi',         'san-carlos',  'cat-el-palmar'),
  ('Playa Blanca',                    'poi',         'rio-hato',    'cat-playa-blanca'),
  ('Farallón',                        'poi',         'rio-hato',    'cat-farallon'),
  ('Buenaventura',                    'poi',         'rio-hato',    'cat-buenaventura'),

  -- ── Coclé, Herrera, Los Santos, Veraguas ────────────────────────────
  ('Divisa',                          'poi',         'parita',      'cat-divisa'),
  ('Parque Unión',                    'poi',         'chitre',      'cat-parque-union'),
  ('Hospital Cecilio Castillero',     'poi',         'chitre',      'cat-cecilio-castillero'),
  ('Parque Belisario Porras',         'poi',         'las-tablas',  'cat-belisario-porras'),
  ('Playa El Salado',                 'poi',         'aguadulce',   'cat-el-salado'),

  -- ── Chiriquí ────────────────────────────────────────────────────────
  ('Chiriquí Mall',                   'mall',        'david',       'cat-chiriqui-mall'),
  ('Parque Cervantes',                'poi',         'david',       'cat-parque-cervantes'),
  ('Aeropuerto Enrique Malek',        'aeropuerto',  'david',       'cat-enrique-malek'),
  ('Bajo Boquete',                    'barrio',      'boquete',     'cat-bajo-boquete'),
  ('Frontera de Paso Canoas',         'poi',         'paso-canoas', 'cat-frontera'),

  -- ── Colón ───────────────────────────────────────────────────────────
  ('Zona Libre de Colón',             'poi',         'colon',       'cat-zona-libre'),
  ('Cuatro Altos',                    'poi',         'colon',       'cat-cuatro-altos'),
  ('Sabanitas',                       'barrio',      'colon',       'cat-sabanitas')
) as v(nombre, tipo, ciudad, clave)
join (
  select slug, name, st_setsrid(st_makepoint(lng, lat), 4326)::geography as geom_ciudad
    from cities
   where country_code = 'PA' and lat is not null and lng is not null
) c on c.slug = v.ciudad
on conflict (source, source_id) do nothing;

comment on table places is
  'Les lieux cherchables. « catalogo » = le noyau écrit à la main, au point de sa ville ; « osm » = l''import OpenStreetMap, au point exact ; « usuario » = ce que les gens ont tapé et confirmé.';
