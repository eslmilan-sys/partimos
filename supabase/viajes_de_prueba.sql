-- LO QUE LA CUENTA DE CONDUCTOR NECESITA PARA QUE LA PRUEBA SIRVA.
--
-- `cuentas_de_prueba.sql` deja entrar. Esto deja **ver algo** al entrar: sin
-- viajes publicados, «Mis viajes» y «Solicitudes» son dos pantallas vacías, y
-- quien prueba no puede decir si están rotas o si es que no hay nada.
--
-- Qué crea, sobre la cuenta `conductor@partimos.app`:
--
--   · el teléfono dado por verificado (`is_phone_verified`), que es lo último
--     que le faltaba: la cédula y el carro ya los pone `cuentas_de_prueba.sql`
--   · dos viajes publicados Albrook → Chitré, con sus cuatro paradas cada uno
--   · una reserva PENDIENTE — para probar aceptar y rechazar
--   · una reserva CONFIRMADA con su pago autorizado — para probar el abordaje,
--     la llegada y la liberación del aporte
--
-- LAS FECHAS SON RELATIVAS. Se puede volver a ejecutar cuantas veces haga
-- falta: borra lo suyo y lo vuelve a poner mañana y pasado. Los viajes de una
-- ronda anterior caducan y dejan de aparecer en la búsqueda; esto los repone.
--
--   psql "$URL_DE_LA_BASE" -f viajes_de_prueba.sql
--
-- LOS NÚMEROS SON LOS DEL TRASPASO, NO INVENTADOS. Panamá → Chitré: 250 km,
-- 6,4 c/km (8 L/100 × 0,80 $/L), 3,00 $ de peaje → 20,60 $ de coste, ÷ 4
-- ocupantes = 5,15 $, tope 6,87 $, aporte 6,00 $. Es lo mismo que calcula
-- `app/src/dominio/aporte.ts` y lo mismo que dibuja `diseno/`.
--
-- LOS CÓDIGOS, para poder probar sin adivinar:
--
--   reserva pendiente    subir 4821   ·  llegada 7390
--   reserva confirmada   subir 1573   ·  llegada 9042

\set ON_ERROR_STOP on

do $$
declare
  v_con     uuid;
  v_pas     uuid;
  v_carro   uuid;
  v_ruta    uuid;
  v_regla   uuid;
  v_uno     uuid := 'aaaa1111-0000-4000-8000-000000000001';
  v_dos     uuid := 'aaaa1111-0000-4000-8000-000000000002';
  v_sale1   timestamptz := date_trunc('day', now()) + interval '1 day 6 hours 30 minutes';
  v_sale2   timestamptz := date_trunc('day', now()) + interval '2 days 15 hours';
begin
  select id into v_con from auth.users where email = 'conductor@partimos.app';
  select id into v_pas from auth.users where email = 'test@partimos.app';
  if v_con is null or v_pas is null then
    raise exception 'Falta ejecutar cuentas_de_prueba.sql antes que esto';
  end if;

  select id into v_carro from vehicles where owner_id = v_con and is_active order by created_at limit 1;
  if v_carro is null then
    raise exception 'La cuenta de conductor no tiene carro; lo pone cuentas_de_prueba.sql';
  end if;

  /* El corredor y la regla de precio ya vienen de `siembra.sql`. Se busca por
     su rótulo, no por identificador fijo: los de la semilla se generan y no
     son los mismos en dos bases. */
  select id into v_ruta from corridors where slug = 'panama-chitre' limit 1;
  if v_ruta is null then
    raise exception 'No está el corredor Panamá → Chitré; falta la semilla';
  end if;

  /* La regla vigente es por país, no por corredor: la de Panamá sin fecha
     de cierre. */
  select id into v_regla from price_rules
   where country_code = 'PA' and effective_to is null
   order by effective_from desc limit 1;

  /* El teléfono. La cédula y el carro ya están; sin esto la cuenta no cuenta
     como «aprobada del todo» y `puedePublicar` deja pasar pero el perfil se ve
     a medias. */
  update profiles set is_phone_verified = true, is_id_verified = true where id = v_con;

  /* Se borra por identificador antes de reponer: así vuelve a ser de mañana
     por mucho que hayan pasado semanas. Las claves foráneas de `bookings` y
     `trip_stops` NO son en cascada —medido: `bookings_trip_id_fkey` frena el
     borrado—, así que hay que ir de la hoja al tronco: pago, reserva, parada,
     viaje. */
  delete from payments where booking_id in (select id from bookings where trip_id in (v_uno, v_dos));
  delete from bookings   where trip_id in (v_uno, v_dos);
  delete from trip_stops where trip_id in (v_uno, v_dos);
  delete from trips      where id in (v_uno, v_dos);

  insert into trips (
    id, driver_id, vehicle_id, corridor_id, price_rule_id, status,
    departure_at, arrival_estimate_at, published_at,
    origin_label, destination_label, seats_offered, price_cents,
    accepts_cash, accepts_yappy_direct, accepts_luggage, gender_preference,
    allows_pets, allows_smoking, recurrence,
    snap_distance_km, snap_toll_cents, snap_rate_per_km_cents,
    snap_occupants, snap_cost_total_cents, snap_max_price_cents)
  values
    (v_uno, v_con, v_carro, v_ruta, v_regla, 'published',
     v_sale1, v_sale1 + interval '3 hours 30 minutes', now(),
     'Albrook · Terminal', 'Chitré · Parque Unión', 3, 600,
     true, true, true, 'any',
     true, false, 'none',
     250, 300, 64, 4, 2060, 687),
    (v_dos, v_con, v_carro, v_ruta, v_regla, 'published',
     v_sale2, v_sale2 + interval '3 hours 30 minutes', now(),
     'Albrook · Terminal', 'Chitré · Parque Unión', 3, 600,
     true, true, true, 'any',
     false, false, 'none',
     250, 300, 64, 4, 2060, 687);

  /* Cuatro paradas por viaje: el máximo que permite `PRODUCT.md`. Sin ellas la
     pantalla de la ruta enseña una línea con dos puntos y nada en medio. */
  insert into trip_stops (trip_id, sequence, kind, custom_label, scheduled_at)
  select v.id, p.sequence, p.kind::stop_kind, p.custom_label, v.departure_at + p.desfase
    from (values (v_uno, v_sale1), (v_dos, v_sale2)) as v(id, departure_at),
         (values (0, 'origin',      'Albrook · Terminal',     interval '0'),
                 (1, 'waypoint',    'La Chorrera',            interval '45 minutes'),
                 (2, 'waypoint',    'Penonomé',               interval '1 hour 50 minutes'),
                 (3, 'destination', 'Chitré · Parque Unión',  interval '3 hours 30 minutes'))
           as p(sequence, kind, custom_label, desfase);

  /* La pendiente: es la que abre «Solicitudes» con algo dentro. Caduca en
     cuatro horas, como manda la regla del producto. */
  insert into bookings (
    id, trip_id, passenger_id, seats, status, unit_price_cents, total_cents,
    service_fee_cents, payment_channel, mochilas, maletas,
    proposed_point, detour_minutes, boarding_code, arrival_code, expires_at)
  values (
    'bbbb1111-0000-4000-8000-000000000001', v_uno, v_pas, 1, 'pending', 600, 600,
    30, 'yappy_app', 1, 1,
    'Vía Argentina, Riba Smith', 6, '4821', '7390', now() + interval '4 hours');

  /* La confirmada, con su pago autorizado: es la que deja probar el abordaje,
     el código de llegada y la liberación del aporte. */
  insert into bookings (
    id, trip_id, passenger_id, seats, status, unit_price_cents, total_cents,
    service_fee_cents, payment_channel, mochilas, maletas,
    proposed_point, detour_minutes, boarding_code, arrival_code, confirmed_at)
  values (
    'bbbb1111-0000-4000-8000-000000000002', v_dos, v_pas, 1, 'confirmed', 600, 600,
    30, 'yappy_app', 1, 0,
    'Costa del Este, PH Mar', 4, '1573', '9042', now());

  insert into payments (id, booking_id, provider, status, amount_cents, fee_cents)
  values ('cccc1111-0000-4000-8000-000000000002',
          'bbbb1111-0000-4000-8000-000000000002', 'yappy', 'authorized', 600, 30);
end $$;
