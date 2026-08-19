-- ============================================================
-- EL CHAT DE UN VIAJE — escribir, leer, y nada más
-- ============================================================
--
-- La tabla `messages` ya existía desde 0001, con su índice y una policy
-- de lectura correcta. Le faltaba lo esencial: NADIE PODÍA ESCRIBIR. Sin
-- policy de INSERT, la RLS niega por defecto — el chat era una tabla
-- vacía imposible de llenar.
--
-- Tres decisiones que vienen de las reglas de la casa:
--
--   · El chat cuelga de una RESERVA, no de un viaje ni de un perfil. Sin
--     reserva no hay conversación posible: es exactamente la regla
--     anti-contorno del dueño — no se puede escribir al conductor para
--     arreglar el pago por fuera antes de reservar.
--   · Un mensaje NO se edita ni se borra. Es la prueba de lo que se
--     acordó el día que alguien reclame. Solo se marca como leído.
--   · El número de teléfono deja de hacer falta: se habla aquí.
--
-- Re-ejecutable: cada bloque comprueba antes de crear.

-- ---------- La tabla, por si acaso ----------
create table if not exists messages (
  id           bigserial primary key,
  booking_id   uuid not null references bookings(id) on delete cascade,
  sender_id    uuid not null references profiles(id),
  body         text not null,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

alter table messages enable row level security;

create index if not exists idx_messages_booking on messages (booking_id, created_at);

-- ---------- Un mensaje vacío o kilométrico no es un mensaje ----------
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'messages_body_razonable'
  ) then
    alter table messages add constraint messages_body_razonable
      check (length(btrim(body)) between 1 and 2000);
  end if;
end $$;

-- ---------- Quién puede LEER (ya existía; se rehace por si falta) ----------
drop policy if exists messages_parties_only on messages;
create policy messages_parties_only on messages
  for select using (
    exists (
      select 1 from bookings b join trips t on t.id = b.trip_id
      where b.id = messages.booking_id
        and (b.passenger_id = auth.uid() or t.driver_id = auth.uid())
    )
  );

-- ---------- Quién puede ESCRIBIR — lo que faltaba ----------
--
-- Dos condiciones, las dos necesarias:
--   1. firmas con tu propio nombre (sender_id = auth.uid()): nadie puede
--      escribir haciéndose pasar por el otro;
--   2. eres parte de ESA reserva.
--
-- La reserva cancelada cierra la conversación: dejar hablar después de
-- una cancelación es la puerta a « me pagas por fuera y la cancelamos ».
--
-- OJO con el nombre del estado. El enum `booking_status` no tiene ningún
-- valor que se llame 'cancelled' a secas: son 'cancelled_passenger' y
-- 'cancelled_driver' (quién canceló importa para el reembolso). Comparar
-- contra 'cancelled' no da error — simplemente nunca es cierto, y la
-- puerta que creíamos cerrada queda abierta de par en par. Por eso el
-- prefijo: cubre los dos valores reales, y de paso cualquier grafía
-- ('canceled', 'cancelada') si algún entorno viejo los tuviera.
drop policy if exists messages_write_parties on messages;
create policy messages_write_parties on messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from bookings b join trips t on t.id = b.trip_id
      where b.id = messages.booking_id
        and (b.passenger_id = auth.uid() or t.driver_id = auth.uid())
        and coalesce(b.status::text, '') not like 'cancel%'
    )
  );

-- ---------- Marcar como leído, y NADA más ----------
--
-- Solo el DESTINATARIO marca (quien no escribió el mensaje), y solo puede
-- tocar `read_at`: el cuerpo y el autor quedan intactos. El disparador de
-- abajo es lo que lo garantiza — una policy de UPDATE por sí sola dejaría
-- reescribir el texto.
drop policy if exists messages_mark_read on messages;
create policy messages_mark_read on messages
  for update using (
    sender_id <> auth.uid()
    and exists (
      select 1 from bookings b join trips t on t.id = b.trip_id
      where b.id = messages.booking_id
        and (b.passenger_id = auth.uid() or t.driver_id = auth.uid())
    )
  );

create or replace function messages_solo_lectura()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  -- Un mensaje es una prueba: su texto y su autor son inmutables.
  if new.body is distinct from old.body
     or new.sender_id is distinct from old.sender_id
     or new.booking_id is distinct from old.booking_id
     or new.created_at is distinct from old.created_at then
    raise exception 'un mensaje no se edita';
  end if;
  return new;
end $$;

drop trigger if exists messages_inmutables on messages;
create trigger messages_inmutables
  before update on messages
  for each row execute function messages_solo_lectura();

-- ---------- Tiempo real ----------
-- Sin esto el chat obliga a recargar para ver la respuesta.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table messages;
  end if;
end $$;

comment on table messages is
  'Chat de una reserva. Solo existe entre pasajero y conductor de esa reserva, nunca antes de reservar. Los mensajes son inmutables: solo se marca read_at.';
