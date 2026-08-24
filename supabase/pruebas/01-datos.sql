-- Des lieux qui existent vraiment, écrits comme OSM les écrit.

insert into cities (slug, name, lat, lng) values
  ('panama',  'Ciudad de Panamá', 8.9824, -79.5199),
  ('david',   'David',            8.4333, -82.4333),
  ('chitre',  'Chitré',           7.9614, -80.4297);

insert into profiles (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222');

-- La hiérarchie administrative, telle que 0033 la veut : niveau déclaré,
-- parent au-dessus.
insert into admin_areas (id, nivel, parent_id, name, normalized_name, source_id) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'provincia', null,
   'Panamá', 'panama', 'r1'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'distrito',
   'aaaaaaaa-0000-0000-0000-000000000001', 'Panamá', 'panama', 'r2'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'corregimiento',
   'aaaaaaaa-0000-0000-0000-000000000002', 'San Francisco', 'san francisco', 'r3'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'comarca', null,
   'Guna Yala', 'guna yala', 'r4'),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'corregimiento',
   'aaaaaaaa-0000-0000-0000-000000000004', 'Narganá', 'nargana', 'r5');

insert into places (name, kind, city_slug, geom, source, source_id, used_count, is_public, admin_area_id) values
  ('Multiplaza Pacific', 'mall', 'panama',
   st_setsrid(st_makepoint(-79.5077, 8.9840), 4326)::geography,
   'osm', 'w/1', 12, true, 'aaaaaaaa-0000-0000-0000-000000000003'),
  ('Aeropuerto Internacional de Tocumen', 'aeropuerto', 'panama',
   st_setsrid(st_makepoint(-79.3835, 9.0714), 4326)::geography,
   'osm', 'w/2', 40, true, 'aaaaaaaa-0000-0000-0000-000000000002'),
  ('Parque Omar', 'parque', 'panama',
   st_setsrid(st_makepoint(-79.5140, 8.9880), 4326)::geography,
   'osm', 'w/3', 3, true, 'aaaaaaaa-0000-0000-0000-000000000003'),
  ('Terminal de Chitré', 'terminal', 'chitre',
   st_setsrid(st_makepoint(-80.4290, 7.9600), 4326)::geography,
   'catalogo', 'c/1', 5, true, null),
  -- Même enseigne dans deux villes : c'est ce qui met `near_city` à l'épreuve.
  ('Super 99 Vía España', 'tienda', 'panama',
   st_setsrid(st_makepoint(-79.5200, 8.9900), 4326)::geography,
   'osm', 'w/4', 2, true, 'aaaaaaaa-0000-0000-0000-000000000003'),
  ('Super 99 David', 'tienda', 'david',
   st_setsrid(st_makepoint(-82.4300, 8.4340), 4326)::geography,
   'osm', 'w/5', 99, true, null),
  -- Un lieu d'utilisateur encore invisible : une seule personne s'en sert.
  ('PH Torre Escondida', 'usuario', 'panama',
   st_setsrid(st_makepoint(-79.5100, 8.9850), 4326)::geography,
   'usuario', 'u:secreto', 1, false, null);

insert into place_aliases (place_id, alias, normalized_alias, source)
select id, 'Multiplaza', 'multiplaza', 'osm' from places where source_id = 'w/1';
insert into place_aliases (place_id, alias, normalized_alias, source)
select id, 'PTY', 'pty', 'osm' from places where source_id = 'w/2';
insert into place_aliases (place_id, alias, normalized_alias, source)
select id, 'Tocumen', 'tocumen', 'osm' from places where source_id = 'w/2';
