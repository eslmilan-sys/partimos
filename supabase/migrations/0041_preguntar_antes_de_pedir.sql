-- =====================================================================
--  MIGRATION 0041 — Preguntar antes de pedir el puesto.
--
--  Pedido del dueño (26-08-2026): «option to be able to chat to the
--  driver without having to reserve».
--
--  EL PROBLEMA. `messages.booking_id` es NOT NULL, así que un mensaje
--  sólo existe si ya hay reserva. Y una reserva ocupa un puesto y arranca
--  el reloj de las cuatro horas del conductor. Para preguntar «¿pasas por
--  la vía Ricardo J. Alfaro?» había que comprometerse primero — que es
--  exactamente al revés de como decide la gente.
--
--  LO QUE SE HACE. `booking_id` pasa a ser opcional y aparece `trip_id`:
--  un mensaje cuelga de UNA de las dos cosas, nunca de ninguna y nunca de
--  las dos. Un `CHECK` lo impone, no la buena voluntad de quien escriba
--  el código.
--
--  QUIÉN HABLA CON QUIÉN. Un hilo de viaje NO es un muro público: es una
--  conversación entre el conductor y UNA persona interesada. Por eso va
--  `con_id` — quién es esa persona—, presente siempre en los mensajes de
--  viaje y siempre nulo en los de reserva (donde las partes ya salen de
--  `bookings`). La clave del hilo es (trip_id, con_id), y con ella las
--  políticas saben quién puede leer: esa persona y el conductor. Nadie
--  más, ni siquiera otro pasajero del mismo viaje.
--
--  LO QUE NO CAMBIA. Los mensajes siguen sin editarse ni borrarse — el
--  hilo es la prueba de lo que se acordó (0021). Y preguntar no reserva
--  nada: no toca `bookings`, ni puestos, ni el reloj de las cuatro horas.
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
--  1 · Las columnas, y la regla que las gobierna.
-- ─────────────────────────────────────────────────────────────────────

alter table messages alter column booking_id drop not null;

alter table messages
  add column if not exists trip_id uuid references trips(id) on delete cascade,
  -- La otra parte del hilo de viaje: quien pregunta. El conductor sale del
  -- propio viaje, así que no hace falta guardarlo.
  add column if not exists con_id  uuid references profiles(id) on delete cascade;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'messages_de_una_cosa') then
    alter table messages add constraint messages_de_una_cosa check (
      (booking_id is not null and trip_id is null and con_id is null)
      or
      (booking_id is null and trip_id is not null and con_id is not null)
    );
  end if;
end $$;

comment on column messages.trip_id is
  'Hilo de PREGUNTA, antes de reservar (0041). Excluyente con booking_id.';
comment on column messages.con_id is
  'Con quién habla el conductor en un hilo de viaje. La clave del hilo es (trip_id, con_id).';

create index if not exists idx_messages_hilo_de_viaje
  on messages (trip_id, con_id, created_at) where trip_id is not null;

-- ─────────────────────────────────────────────────────────────────────
--  2 · Quién lee y quién escribe.
--
--  Las políticas de 0021 miran `bookings` y con `booking_id` nulo no
--  encuentran nada, así que un hilo de viaje quedaría invisible incluso
--  para sus dos partes. Se rehacen cubriendo los dos casos.
-- ─────────────────────────────────────────────────────────────────────

drop policy if exists messages_parties_only on messages;
create policy messages_parties_only on messages
  for select using (
    -- Hilo de una reserva: sus dos partes, como siempre.
    (messages.booking_id is not null and exists (
      select 1 from bookings b join trips t on t.id = b.trip_id
      where b.id = messages.booking_id
        and (b.passenger_id = auth.uid() or t.driver_id = auth.uid())
    ))
    or
    -- Hilo de pregunta: quien preguntó y quien maneja. Nadie más.
    (messages.trip_id is not null and (
      messages.con_id = auth.uid()
      or exists (select 1 from trips t where t.id = messages.trip_id and t.driver_id = auth.uid())
    ))
  );

drop policy if exists messages_write_own on messages;
create policy messages_write_own on messages
  for insert with check (
    -- Firmas con tu propio nombre: nadie escribe haciéndose pasar por otro.
    sender_id = auth.uid()
    and (
      (booking_id is not null and exists (
        select 1 from bookings b join trips t on t.id = b.trip_id
        where b.id = booking_id
          and (b.passenger_id = auth.uid() or t.driver_id = auth.uid())
      ))
      or
      (trip_id is not null and con_id is not null and exists (
        select 1 from trips t
        where t.id = trip_id
          -- Sólo se pregunta sobre un viaje que está en la calle.
          and t.status = 'published'
          and (
            -- O eres quien pregunta —y entonces el hilo es tuyo—…
            (con_id = auth.uid() and t.driver_id <> auth.uid())
            -- …o eres el conductor, contestando a esa persona.
            or (t.driver_id = auth.uid() and con_id <> auth.uid())
          )
      ))
    )
  );

-- ─────────────────────────────────────────────────────────────────────
--  3 · Que no se pueda preguntar en nombre de otro.
--
--  Un `con_id` que no es ni quien escribe ni el conductor abriría hilos
--  a nombre de terceros. La política de arriba ya lo impide desde el
--  cliente; esto lo impide TAMBIÉN para la llave de servicio, que es
--  donde un error de código haría el daño en silencio.
-- ─────────────────────────────────────────────────────────────────────

create or replace function messages_hilo_coherente()
returns trigger language plpgsql as $$
declare
  v_driver uuid;
begin
  if new.trip_id is null then return new; end if;

  select driver_id into v_driver from trips where id = new.trip_id;
  if v_driver is null then
    raise exception 'messages: el viaje % no existe', new.trip_id;
  end if;
  if new.con_id = v_driver then
    raise exception 'messages: el conductor no puede ser la otra parte de su propio hilo';
  end if;
  if new.sender_id <> v_driver and new.sender_id <> new.con_id then
    raise exception 'messages: sólo el conductor y quien pregunta escriben en este hilo';
  end if;
  return new;
end $$;

drop trigger if exists trg_messages_hilo_coherente on messages;
create trigger trg_messages_hilo_coherente
  before insert or update on messages
  for each row execute function messages_hilo_coherente();
