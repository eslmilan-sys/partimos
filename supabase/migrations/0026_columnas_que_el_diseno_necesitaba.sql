-- =====================================================================
--  0026 · Las columnas que el traspaso de diseño da por hechas
-- =====================================================================
--
--  ESTA MIGRACIÓN YA ESTÁ APLICADA EN PRODUCCIÓN. Se aplicó el 19 de agosto
--  como `columnas_que_el_diseno_necesitaba` y no se escribió aquí, así que
--  durante unos días el esquema del repositorio y el de la base no eran el
--  mismo y nadie podía saberlo leyendo el repositorio. Se escribe ahora, tal
--  cual se aplicó, para que una base creada desde cero con estas migraciones
--  salga igual que la de verdad. Todo es `if not exists`: volver a pasarla no
--  hace nada.
--
--  Va con el número 26 aunque se aplicó antes que la 24 y la 25: renumerar lo
--  que ya está aplicado sería mentir sobre lo que pasó.
--
--  Todo es aditivo: ni una columna cambia de tipo, ni una se borra, y las que
--  no admiten nulo traen valor por defecto, así que las filas que ya existen
--  quedan válidas sin tocarlas. El sitio de `web/` sigue leyendo igual.

-- `5c` Publicar: una sola casilla de maletas, sin contabilidad de maletero.
alter table trips add column if not exists accepts_luggage boolean not null default true;

-- `5d` El tope: hoy se calcula en cada pantalla; guardarlo lo hace auditable.
alter table corridors add column if not exists max_price_cents integer;

-- `1f`/`1g`/`1i`: son dos códigos distintos. Uno abre el viaje al subir, otro
-- lo cierra al llegar y es lo que suelta el aporte al conductor.
alter table bookings add column if not exists boarding_code text;
alter table bookings add column if not exists arrival_code text;
alter table bookings add column if not exists boarded_at timestamptz;
alter table bookings add column if not exists released_at timestamptz;

-- `11a`: las 4 h que tiene el conductor para responder una solicitud.
alter table bookings add column if not exists expires_at timestamptz;

-- Los minutos que el punto del pasajero le añade al conductor.
alter table bookings add column if not exists detour_minutes integer;

-- El modelo de equipaje del traspaso: mochilas y maletas contadas aparte.
alter table bookings add column if not exists mochilas integer not null default 0;
alter table bookings add column if not exists maletas integer not null default 0;
