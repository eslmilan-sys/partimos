-- =====================================================================
--  0028 · Dos agujeros que impedían que la app funcionara
-- =====================================================================
--
--  APLICADA EN PRODUCCIÓN el 19 de agosto como
--  `lo_publico_de_un_perfil_y_pedir_puesto`, y no escrita aquí hasta ahora.
--  Las políticas se vuelven a crear con `drop ... if exists` delante para que
--  pasarla dos veces no falle.
--
--  Ninguno de los dos agujeros era un descuido: la base estaba cerrada de
--  más, no de menos.

-- 1 · Un perfil solo se ve si es el tuyo. Así, la lista de resultados no puede
--     enseñar quién maneja. Pero abrir la fila entera enseñaría también el
--     teléfono, que la política `phone_visible_after_booking` esconde a
--     propósito hasta que hay reserva. Así que no se abre la fila: se publica
--     una vista con lo que el diseño enseña de alguien y nada más.
create or replace view perfiles_publicos as
select id, first_name, last_initial, photo_url, bio, gender,
       is_id_verified, is_phone_verified, created_at
from profiles
where is_suspended = false;

comment on view perfiles_publicos is
  'Lo que el diseño enseña de una persona antes de viajar con ella: nombre, '
  'inicial, foto, presentación y si tiene la cédula verificada. El teléfono, '
  'el apellido entero y la ciudad no salen de aquí.';

grant select on perfiles_publicos to anon, authenticated;

-- 2 · El carro se enseña en los resultados —marca, modelo, color, puestos— y
--     solo lo veía su dueño.
drop policy if exists vehicles_read_when_driving on vehicles;
create policy vehicles_read_when_driving on vehicles
  for select using (
    owner_id = auth.uid()
    or exists (select 1 from trips t where t.vehicle_id = vehicles.id and t.status = 'published')
  );

-- 3 · Nadie podía pedir puesto: bookings tenía lectura y ninguna escritura.
drop policy if exists bookings_passenger_insert on bookings;
create policy bookings_passenger_insert on bookings
  for insert with check (passenger_id = auth.uid());

-- El pasajero cambia lo suyo —cancelar, añadir equipaje— y el conductor
-- responde a las solicitudes de sus viajes. Cada uno sobre sus propias filas.
drop policy if exists bookings_passenger_update on bookings;
create policy bookings_passenger_update on bookings
  for update using (passenger_id = auth.uid()) with check (passenger_id = auth.uid());

drop policy if exists bookings_driver_update on bookings;
create policy bookings_driver_update on bookings
  for update using (
    exists (select 1 from trips t where t.id = bookings.trip_id and t.driver_id = auth.uid())
  ) with check (
    exists (select 1 from trips t where t.id = bookings.trip_id and t.driver_id = auth.uid())
  );

-- 4 · Las notas son públicas por definición: se enseñan en el perfil de quien
--     maneja, y esconderlas vacía la única señal de confianza que hay.
drop policy if exists reviews_public_read on reviews;
create policy reviews_public_read on reviews for select using (true);

drop policy if exists reviews_author_write on reviews;
create policy reviews_author_write on reviews
  for insert with check (author_id = auth.uid());
