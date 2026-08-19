-- Datos de prueba para que la app tenga algo que enseñar.
--
-- La base de producción tenía las tablas de referencia llenas —32 ciudades, 6
-- corredores, 3 categorías de carro, una regla de precio— y cero contenido: 0
-- viajes, 0 puntos de recogida, 0 carros. Una app de viajes compartidos sin
-- viajes no se puede probar, así que esto siembra lo mínimo para recorrerla.
--
-- Todo lo sembrado cuelga de identificadores que empiezan por «dddddddd-», y
-- los correos de los conductores están en «demo.partimos.app», un dominio que
-- no existe: nadie puede pedir un enlace mágico y entrar como ellos.
--
-- Los aportes no están escritos a mano. Salen de la misma fórmula que la app
-- (src/dominio/aporte.ts): Panamá → Chitré en sedán da 20,60 $ de costo, 7 $ de
-- tope y 6 $ de aporte, que son las tres cifras del traspaso.
--
-- Es idempotente: correrlo dos veces no duplica nada salvo los viajes, que se
-- borran primero. Para deshacerlo entero, ver DESHACER al final.

-- ── 1 · Puntos de recogida ───────────────────────────────────────────────────
-- Coordenadas aproximadas: sirven para ordenar y para el mapa, no para navegar.
insert into pickup_points (city_id, name, description, is_terminal, is_active, lat, lng)
select c.id, v.nombre, v.descripcion, v.terminal, true, v.lat, v.lng
from (values
 ('panama-city','Albrook','Gran Terminal de Transporte, bahía 4',true,8.9739,-79.5536),
 ('panama-city','Vía España','Frente al área bancaria',false,8.9880,-79.5290),
 ('panama-city','Costa del Este','Entrada de Costa del Este',false,9.0100,-79.4700),
 ('panama-city','San Francisco','Parque Omar',false,8.9860,-79.5100),
 ('panama-city','Tocumen','Salida del aeropuerto',false,9.0714,-79.3835),
 ('chitre','Chitré · Terminal','Terminal de transporte de Chitré',true,7.9600,-80.4300),
 ('chitre','Chitré · Parque Unión','Parque Unión, frente a la catedral',false,7.9633,-80.4297),
 ('santiago','Santiago · Terminal','Terminal de Santiago',true,8.1000,-80.9800),
 ('david','David · Terminal','Terminal de David',true,8.4300,-82.4300),
 ('penonome','Penonomé · Terminal','Terminal de Penonomé',true,8.5200,-80.3600),
 ('las-tablas','Las Tablas · Terminal','Terminal de Las Tablas',true,7.7700,-80.2800),
 ('coronado','Coronado','Entrada de Coronado, frente al súper',false,8.5300,-79.9500)
) as v(ciudad, nombre, descripcion, terminal, lat, lng)
join cities c on c.slug = v.ciudad
where not exists (select 1 from pickup_points p where p.name = v.nombre);

-- ── 2 · Cuatro conductores ───────────────────────────────────────────────────
-- El disparador on_auth_user_created crea el perfil solo, leyendo first_name y
-- last_name de raw_user_meta_data.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data)
select v.id::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated',
       v.correo, '', now(), now(), now(),
       '{"provider":"email","providers":["email"]}'::jsonb,
       jsonb_build_object('first_name', v.nombre, 'last_name', v.apellido)
from (values
 ('dddddddd-0000-4000-8000-000000000001','andres@demo.partimos.app','Andrés','Mendoza'),
 ('dddddddd-0000-4000-8000-000000000002','carla@demo.partimos.app','Carla','Ríos'),
 ('dddddddd-0000-4000-8000-000000000003','jose@demo.partimos.app','José','Vega'),
 ('dddddddd-0000-4000-8000-000000000004','yaris@demo.partimos.app','Yaris','Batista')
) as v(id, correo, nombre, apellido)
on conflict (id) do nothing;

update profiles set
  gender = case id::text
    when 'dddddddd-0000-4000-8000-000000000002' then 'female'
    when 'dddddddd-0000-4000-8000-000000000004' then 'female' else 'male' end,
  home_city_id = (select id from cities where slug = case id::text
    when 'dddddddd-0000-4000-8000-000000000003' then 'santiago'
    when 'dddddddd-0000-4000-8000-000000000004' then 'chitre'
    else 'panama-city' end),
  is_id_verified = true, is_phone_verified = true,
  accepts_cash = true, accepts_yappy_direct = true, preferred_pay_channel = 'yappy_app',
  bio = case id::text
    when 'dddddddd-0000-4000-8000-000000000001' then 'Bajo a Chitré casi todos los fines de semana.'
    when 'dddddddd-0000-4000-8000-000000000002' then 'Manejo tranquilo y salgo puntual.'
    when 'dddddddd-0000-4000-8000-000000000003' then 'Santiago–Panamá los lunes y los viernes.'
    else 'Voy y vuelvo a Chitré, cabe una maleta.' end
where id::text like 'dddddddd-%';

-- ── 3 · Un carro por conductor, del catálogo de `14b` ────────────────────────
insert into vehicles (id, owner_id, category_code, make, model, year, color, plate_last3,
                      seats_total, consumption_l_100km, rate_per_km_cents, is_active)
values
 ('dddddddd-1111-4000-8000-000000000001','dddddddd-0000-4000-8000-000000000001','standard','Toyota','Corolla',2020,'Gris','842',4,7.4,25,true),
 ('dddddddd-1111-4000-8000-000000000002','dddddddd-0000-4000-8000-000000000002','economy','Kia','Picanto',2022,'Blanco','317',3,5.8,22,true),
 ('dddddddd-1111-4000-8000-000000000003','dddddddd-0000-4000-8000-000000000003','suv','Toyota','Rush',2019,'Negro','605',6,9.1,32,true),
 ('dddddddd-1111-4000-8000-000000000004','dddddddd-0000-4000-8000-000000000004','standard','Hyundai','Elantra',2024,'Azul','229',4,6.9,25,true)
on conflict (id) do nothing;

-- ── 4 · Los viajes ───────────────────────────────────────────────────────────
-- Nueve patrones semanales sembrados sobre los próximos 21 días. Correr esto
-- otra vez dentro de tres semanas vuelve a llenar el calendario.
-- Solo se borran los viajes que nadie ha reservado: si un probador ya pidió un
-- puesto, su viaje se queda. Volver a correr la siembra no le borra la prueba.
delete from trip_stops where trip_id in (
  select t.id from trips t
  where t.driver_id::text like 'dddddddd-%' and t.departure_at > now()
    and not exists (select 1 from bookings b where b.trip_id = t.id));
delete from trips t
  where t.driver_id::text like 'dddddddd-%' and t.departure_at > now()
    and not exists (select 1 from bookings b where b.trip_id = t.id);

with patron(cond, carro, corr, dow, hora, dur, desde, hasta, puestos, mujeres, efectivo, yappy, costo, tope, km, peaje, tasa) as (values
 (1,1,'panama-chitre'   ,5,'17:00','3:30','Albrook','Chitré · Parque Unión',3,false,true ,true ,2060,700,250.0,300,6),
 (1,1,'panama-chitre'   ,0,'15:00','3:30','Chitré · Terminal','Albrook'    ,3,false,true ,true ,2060,700,250.0,300,6),
 (2,2,'panama-coronado' ,6,'08:00','1:30','Vía España','Coronado'          ,2,true ,false,true , 724,300, 85.0,200,6),
 (2,2,'panama-penonome' ,3,'07:00','2:00','Albrook','Penonomé · Terminal'  ,2,false,false,true ,1193,500,145.0,300,6),
 (3,3,'panama-santiago' ,1,'06:00','3:30','Albrook','Santiago · Terminal'  ,4,false,true ,false,2720,700,250.0,300,9),
 (3,3,'panama-santiago' ,5,'16:00','3:30','Santiago · Terminal','Albrook'  ,4,false,true ,false,2720,700,250.0,300,9),
 (4,4,'panama-chitre'   ,3,'06:30','3:30','Albrook','Chitré · Terminal'    ,3,false,true ,true ,2060,700,250.0,300,6),
 (4,4,'panama-chitre'   ,6,'06:30','3:30','Albrook','Chitré · Terminal'    ,3,false,true ,true ,2060,700,250.0,300,6),
 (3,3,'panama-david'    ,4,'05:00','6:00','Albrook','David · Terminal'     ,4,false,true ,true ,4559,1200,440.0,300,9)
), dias as (
  select d::date from generate_series(current_date + 1, current_date + 21, interval '1 day') d
), nuevos as (
  insert into trips (driver_id, vehicle_id, corridor_id, price_rule_id, departure_at, arrival_estimate_at,
    seats_offered, price_cents, status, published_at, gender_preference, accepts_cash, accepts_yappy_direct,
    snap_cost_total_cents, snap_distance_km, snap_max_price_cents, snap_occupants, snap_rate_per_km_cents,
    snap_toll_cents, origin_label, destination_label)
  select
    ('dddddddd-0000-4000-8000-00000000000' || p.cond)::uuid,
    ('dddddddd-1111-4000-8000-00000000000' || p.carro)::uuid,
    (select id from corridors where slug = p.corr),
    (select id from price_rules order by effective_from desc limit 1),
    (d.d + p.hora::time) at time zone 'America/Panama',
    (d.d + p.hora::time + p.dur::interval) at time zone 'America/Panama',
    p.puestos,
    -- La misma fórmula que aporteCalculado(): el costo entre los ocupantes —el
    -- conductor cuenta como uno más que paga—, al dólar de arriba, con suelo de
    -- 3 $ y techo en el tope de la ruta.
    least(p.tope, greatest(300, ceil(p.costo::numeric / (p.puestos + 1) / 100) * 100))::bigint,
    'published', now() - interval '6 days',
    (case when p.mujeres then 'women_only' else 'any' end)::gender_pref,
    p.efectivo, p.yappy, p.costo, p.km, p.tope, p.puestos + 1, p.tasa, p.peaje, p.desde, p.hasta
  from patron p join dias d on extract(dow from d.d)::int = p.dow
  returning id, origin_label, destination_label, departure_at, arrival_estimate_at
)
insert into trip_stops (trip_id, pickup_point_id, kind, sequence, scheduled_at)
select n.id, pp.id, 'origin'::stop_kind, 0, n.departure_at
from nuevos n join pickup_points pp on pp.name = n.origin_label
union all
select n.id, pp.id, 'destination'::stop_kind, 1, n.arrival_estimate_at
from nuevos n join pickup_points pp on pp.name = n.destination_label;

-- ── DESHACER ─────────────────────────────────────────────────────────────────
-- Deja la base como estaba. El orden importa: las reservas y las paradas
-- apuntan a los viajes, y los viajes a los carros y a los perfiles.
--
--   delete from bookings      where trip_id in (select id from trips where driver_id::text like 'dddddddd-%');
--   delete from trip_stops    where trip_id in (select id from trips where driver_id::text like 'dddddddd-%');
--   delete from trips         where driver_id::text like 'dddddddd-%';
--   delete from vehicles      where id::text like 'dddddddd-%';
--   delete from profiles      where id::text like 'dddddddd-%';
--   delete from auth.users    where id::text like 'dddddddd-%';
--   delete from pickup_points;  -- solo si quieres quitar también los puntos
