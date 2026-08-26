-- =====================================================================
--  MIGRATION 0040 — La tabla de avisos.
--
--  «Il n'y a pas de table notifications» decía CLAUDE.md desde el
--  principio, y la app vivía con dos remedios: el simulado traía seis
--  avisos escritos a mano, y la fuente real DERIVABA la bandeja de los
--  hechos ya cargados (reservas confirmadas, pendientes, liberadas).
--  La derivación funciona para la bandeja abierta — pero no puede sonar
--  en un teléfono con la app cerrada, y «leído» se perdía al recargar
--  porque no había dónde escribirlo.
--
--  Esta migración crea la fila. La forma es EXACTAMENTE la de
--  `AvisoPendiente` en `app/src/tipos/index.ts`, que se escribió «con
--  nombre propio para que la migración sea mecánica». Hoy es mecánica.
--
--  QUIÉN ESCRIBE. Nadie desde el cliente. Un aviso es un hecho del viaje
--  contado a la otra parte; dejar que un navegador inserte avisos en la
--  bandeja de otro es una puerta de spam. Los escriben TRIGGERS sobre
--  `bookings` y `trips` — los hechos ya pasan por ahí, y el trigger corre
--  con los permisos del dueño de la tabla, no con los del que pulsa.
--
--  QUIÉN LEE. Cada quien la suya. Y del UPDATE solo se concede la
--  columna `read_at`: marcar leído es lo único que un lector hace con
--  un aviso. Ni el título ni la ruta de acción se editan desde fuera.
--
--  Los momentos cubiertos (el mapa de eventos `12b` del traspaso):
--    · alguien pidió puesto            → al conductor
--    · el conductor respondió          → al pasajero (aceptó / no puede)
--    · el aporte se liberó             → al conductor
--    · el viaje terminó, califícalo    → al pasajero
--    · el viaje se canceló             → a cada pasajero confirmado
--
--  «Sales pronto» (el recordatorio) NO está aquí a propósito: no es un
--  evento sino un estado del reloj, y una fila escrita a las 24 h de la
--  salida necesitaría un cron. Mientras no haya envío push, la app lo
--  deriva al abrir la bandeja (`src/dominio/avisar.ts`), que es cuando
--  puede verse. El día que haya push, ese cron se añade aquí al lado.
-- =====================================================================

create table notifications (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references profiles(id) on delete cascade,
  kind         text not null check (kind in (
                 'solicitud_aceptada', 'solicitud_recibida', 'aporte_recibido',
                 'ruta_publicada', 'te_calificaron', 'califica_tu',
                 'viaje_cancelado', 'reembolso_enviado', 'sales_pronto'
               )),
  title        text not null,
  body         text not null,
  -- La acción que el aviso lleva dentro: aceptar sin abrir la app es la clave.
  action_label text,
  action_route text,
  booking_id   uuid references bookings(id) on delete cascade,
  trip_id      uuid references trips(id)    on delete cascade,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

comment on table notifications is
  'Un aviso es un hecho del viaje contado a tiempo. Lo escriben los triggers de 0040, nunca un cliente.';

create index idx_notifications_bandeja
  on notifications (profile_id, created_at desc);

-- Un evento, un aviso (regla 3 del traspaso): el mismo hecho sobre la misma
-- reserva no se cuenta dos veces, aunque el trigger se dispare de nuevo.
create unique index uq_notifications_evento
  on notifications (kind, booking_id, profile_id) where booking_id is not null;

-- ── Quién puede qué ──────────────────────────────────────────────────

alter table notifications enable row level security;

create policy notifications_own_read on notifications
  for select using (profile_id = auth.uid());

create policy notifications_own_mark on notifications
  for update using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- La política de UPDATE deja tocar TU fila; la concesión por columna hace
-- que lo único tocable sea `read_at`. Ni insert ni delete desde el cliente.
revoke all on notifications from anon, authenticated;
grant select           on notifications to authenticated;
grant update (read_at) on notifications to authenticated;

-- ── Las piezas con las que se escribe un aviso ───────────────────────

-- «Andrés M.», o «Alguien» si el perfil no está.
create or replace function aviso_nombre_de(p_id uuid)
returns text language sql stable as $$
  select coalesce(
    nullif(trim(p.first_name || ' ' || coalesce(p.last_initial, '')), ''),
    'Alguien')
  from profiles p where p.id = p_id;
$$;

-- «14:50 · Albrook → Chitré» — la segunda línea de toda la bandeja:
-- la hora EN PANAMÁ y los dos lugares, con el detalle tras « · » podado.
create or replace function aviso_cuando_del_viaje(p_trip_id uuid)
returns text language sql stable as $$
  select to_char(t.departure_at at time zone 'America/Panama', 'HH24:MI')
         || ' · '
         || coalesce(split_part(t.origin_label, ' · ', 1), o.name, '')
         || ' → '
         || coalesce(split_part(t.destination_label, ' · ', 1), d.name, '')
  from trips t
  left join cities o on o.id = t.origin_city_id
  left join cities d on d.id = t.destination_city_id
  where t.id = p_trip_id;
$$;

-- «B/6», «B/7.50» — el formato de `app/src/ui/dinero.tsx`, en SQL.
create or replace function aviso_dinero(p_cents bigint)
returns text language sql immutable as $$
  select 'B/' || case when p_cents % 100 = 0
                      then (p_cents / 100)::text
                      else to_char(p_cents / 100.0, 'FM999990.00') end;
$$;

-- ── Los triggers: el hecho escribe su propio aviso ───────────────────

create or replace function avisar_de_la_reserva()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_driver uuid;
begin
  select driver_id into v_driver from trips where id = new.trip_id;
  if v_driver is null then return new; end if;

  -- Alguien pidió puesto → al conductor, con la acción dentro.
  if tg_op = 'INSERT' and new.status = 'pending' then
    insert into notifications
      (profile_id, kind, title, body, action_label, action_route, booking_id, trip_id)
    values
      (v_driver, 'solicitud_recibida',
       aviso_nombre_de(new.passenger_id) || ' pidió puesto',
       aviso_cuando_del_viaje(new.trip_id),
       'Ver la solicitud', '/(conductor)/solicitudes?viaje=' || new.trip_id,
       new.id, new.trip_id)
    on conflict do nothing;
  end if;

  if tg_op = 'UPDATE' then
    -- El conductor aceptó → al pasajero, con su código.
    if old.status = 'pending' and new.status = 'confirmed' then
      insert into notifications
        (profile_id, kind, title, body, action_label, action_route, booking_id, trip_id, created_at)
      values
        (new.passenger_id, 'solicitud_aceptada',
         split_part(aviso_nombre_de(v_driver), ' ', 1) || ' aceptó tu puesto',
         aviso_cuando_del_viaje(new.trip_id),
         'Ver código', '/(pasajero)/codigo?reserva=' || new.id,
         new.id, new.trip_id, coalesce(new.confirmed_at, now()))
      on conflict do nothing;
    end if;

    -- El conductor no puede → al pasajero, con la puerta de buscar otro.
    if old.status = 'pending' and new.status = 'cancelled_driver' then
      insert into notifications
        (profile_id, kind, title, body, action_label, action_route, booking_id, trip_id, created_at)
      values
        (new.passenger_id, 'viaje_cancelado',
         split_part(aviso_nombre_de(v_driver), ' ', 1) || ' no puede llevarte',
         aviso_cuando_del_viaje(new.trip_id),
         'Buscar otro', '/(pasajero)',
         new.id, new.trip_id, coalesce(new.cancelled_at, now()))
      on conflict do nothing;
    end if;

    -- El aporte se liberó → al conductor. El dinero también avisa (regla 3:
    -- es lo único que puede repetirse en dos canales).
    if old.released_at is null and new.released_at is not null then
      insert into notifications
        (profile_id, kind, title, body, action_label, action_route, booking_id, trip_id, created_at)
      values
        (v_driver, 'aporte_recibido',
         'Te aportaron ' || aviso_dinero(new.unit_price_cents * new.seats),
         aviso_cuando_del_viaje(new.trip_id),
         null, null, new.id, new.trip_id, new.released_at)
      on conflict do nothing;
    end if;

    -- El viaje terminó → al pasajero: califícalo.
    if old.status is distinct from 'completed' and new.status = 'completed' then
      insert into notifications
        (profile_id, kind, title, body, action_label, action_route, booking_id, trip_id, created_at)
      values
        (new.passenger_id, 'califica_tu',
         'Califica a ' || aviso_nombre_de(v_driver),
         aviso_cuando_del_viaje(new.trip_id),
         'Calificar', '/(pasajero)/calificar?reserva=' || new.id,
         new.id, new.trip_id, coalesce(new.completed_at, now()))
      on conflict do nothing;
    end if;
  end if;

  return new;
end $$;

create trigger trg_avisar_de_la_reserva
  after insert or update on bookings
  for each row execute function avisar_de_la_reserva();

-- El viaje entero se cayó → a cada pasajero que ya tenía puesto.
create or replace function avisar_del_viaje_cancelado()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status is distinct from 'cancelled' and new.status = 'cancelled' then
    insert into notifications
      (profile_id, kind, title, body, action_label, action_route, booking_id, trip_id)
    select b.passenger_id, 'viaje_cancelado',
           split_part(aviso_nombre_de(new.driver_id), ' ', 1) || ' canceló el viaje',
           aviso_cuando_del_viaje(new.id),
           'Buscar otro', '/(pasajero)',
           b.id, new.id
    from bookings b
    where b.trip_id = new.id and b.status in ('pending', 'confirmed')
    on conflict do nothing;
  end if;
  return new;
end $$;

create trigger trg_avisar_del_viaje_cancelado
  after update on trips
  for each row execute function avisar_del_viaje_cancelado();

-- ── El pasado también cuenta ─────────────────────────────────────────
--
--  Las reservas que ya existen no dispararon ningún trigger. Se les
--  escribe su aviso ahora, con la fecha del hecho — y lo que tiene más
--  de siete días nace LEÍDO: abrir la bandeja por primera vez sobre un
--  montón de «sin leer» viejos es ruido, no memoria.

insert into notifications
  (profile_id, kind, title, body, action_label, action_route, booking_id, trip_id, created_at, read_at)
select t.driver_id, 'solicitud_recibida',
       aviso_nombre_de(b.passenger_id) || ' pidió puesto',
       aviso_cuando_del_viaje(b.trip_id),
       'Ver la solicitud', '/(conductor)/solicitudes?viaje=' || b.trip_id,
       b.id, b.trip_id, b.created_at,
       case when b.created_at < now() - interval '7 days' then b.created_at end
from bookings b join trips t on t.id = b.trip_id
where b.status = 'pending'
on conflict do nothing;

insert into notifications
  (profile_id, kind, title, body, action_label, action_route, booking_id, trip_id, created_at, read_at)
select b.passenger_id, 'solicitud_aceptada',
       split_part(aviso_nombre_de(t.driver_id), ' ', 1) || ' aceptó tu puesto',
       aviso_cuando_del_viaje(b.trip_id),
       'Ver código', '/(pasajero)/codigo?reserva=' || b.id,
       b.id, b.trip_id, coalesce(b.confirmed_at, b.updated_at),
       case when coalesce(b.confirmed_at, b.updated_at) < now() - interval '7 days'
            then coalesce(b.confirmed_at, b.updated_at) end
from bookings b join trips t on t.id = b.trip_id
where b.status = 'confirmed'
on conflict do nothing;

insert into notifications
  (profile_id, kind, title, body, action_label, action_route, booking_id, trip_id, created_at, read_at)
select b.passenger_id, 'califica_tu',
       'Califica a ' || aviso_nombre_de(t.driver_id),
       aviso_cuando_del_viaje(b.trip_id),
       'Calificar', '/(pasajero)/calificar?reserva=' || b.id,
       b.id, b.trip_id, coalesce(b.completed_at, b.updated_at),
       case when coalesce(b.completed_at, b.updated_at) < now() - interval '7 days'
            then coalesce(b.completed_at, b.updated_at) end
from bookings b join trips t on t.id = b.trip_id
where b.status = 'completed'
  and not exists (select 1 from reviews r
                  where r.booking_id = b.id and r.author_id = b.passenger_id)
on conflict do nothing;
