-- =====================================================================
--  BANC D'ESSAI DE 0041 — préguntar antes de pedir el puesto.
--
--  Ce qu'on vérifie, dans la peau de chacun : que deux personnes qui
--  n'ont réservé nada peuvent parler avec le conducteur, que leurs deux
--  fils ne se voient PAS entre eux, et qu'on ne peut ni ouvrir un fil au
--  nom d'un tiers ni écrire dans celui d'un autre.
-- =====================================================================

\set ON_ERROR_STOP on

do $$ begin create role anon;          exception when duplicate_object then null; end $$;
do $$ begin create role authenticated; exception when duplicate_object then null; end $$;

create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('prueba.uid', true), '')::uuid $$;

create table profiles (id uuid primary key, first_name text);
create table trips (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid references profiles(id),
  status text
);
create table bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id),
  passenger_id uuid references profiles(id)
);
create table messages (
  id bigserial primary key,
  booking_id uuid not null references bookings(id) on delete cascade,
  sender_id  uuid not null references profiles(id),
  body       text not null,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
alter table messages enable row level security;

-- Les politiques de 0021, que 0041 remplace.
create policy messages_parties_only on messages for select using (
  exists (select 1 from bookings b join trips t on t.id = b.trip_id
          where b.id = messages.booking_id
            and (b.passenger_id = auth.uid() or t.driver_id = auth.uid())));
create policy messages_write_own on messages for insert with check (sender_id = auth.uid());

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

\ir ../migrations/0041_preguntar_antes_de_pedir.sql

-- ── Les personnages ──────────────────────────────────────────────────
insert into profiles values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Andrés'),   -- conduit
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Daniela'),  -- demande
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'Elena'),    -- demande aussi
  ('ffffffff-ffff-4fff-8fff-ffffffffffff', 'Fabio');    -- n'a rien à voir
insert into trips (id, driver_id, status) values
  ('11111111-1111-4111-8111-111111111111',
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'published');

create or replace function prueba_igual(hecho text, esperado text, dijo text)
returns void language plpgsql as $$
begin
  if hecho is distinct from esperado then
    raise exception 'FALLA — % : esperaba «%», dio «%»', dijo, esperado, hecho;
  end if;
  raise notice 'ok   %', dijo;
end $$;

-- ── Daniela pregunta, sin reservar nada ──────────────────────────────
set role authenticated;
select set_config('prueba.uid', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', false);

insert into messages (trip_id, con_id, sender_id, body) values
  ('11111111-1111-4111-8111-111111111111',
   'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
   'dddddddd-dddd-4ddd-8ddd-dddddddddddd', '¿Pasas por la vía Ricardo J. Alfaro?');

do $$ begin
  perform prueba_igual((select count(*)::text from messages), '1',
    'se puede preguntar sin haber reservado nada');
  perform prueba_igual((select count(*)::text from bookings), '0',
    'y preguntar NO crea reserva: ningún puesto ocupado');
end $$;

-- ── Elena pregunta también. Los dos hilos no se mezclan ──────────────
select set_config('prueba.uid', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', false);
insert into messages (trip_id, con_id, sender_id, body) values
  ('11111111-1111-4111-8111-111111111111',
   'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
   'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', '¿Queda cupo el viernes?');

do $$ begin
  perform prueba_igual((select count(*)::text from messages), '1',
    'Elena ve SU hilo y no el de Daniela — no es un muro público');
  perform prueba_igual((select body from messages), '¿Queda cupo el viernes?',
    'y el que ve es el suyo');
end $$;

-- Elena no puede escribir en el hilo de Daniela.
do $$
begin
  insert into messages (trip_id, con_id, sender_id, body) values
    ('11111111-1111-4111-8111-111111111111',
     'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
     'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'me cuelo');
  raise exception 'FALLA — Elena PUDO escribir en el hilo de Daniela';
-- Le déclencheur tire AVANT la politique RLS, donc c'est lui qu'on voit
-- ici : c'est la garde la plus stricte des deux — elle vaut aussi pour la
-- clé de service. La politique le refuserait de toute façon.
exception when raise_exception or insufficient_privilege or check_violation then
  raise notice 'ok   nadie escribe en el hilo de otro';
end $$;

-- ── El conductor ve los dos, y contesta a cada uno ───────────────────
select set_config('prueba.uid', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', false);
do $$ begin
  perform prueba_igual((select count(*)::text from messages), '2',
    'el conductor ve los dos hilos: son los dos suyos');
end $$;

insert into messages (trip_id, con_id, sender_id, body) values
  ('11111111-1111-4111-8111-111111111111',
   'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Sí, paso por ahí.');
do $$ begin
  perform prueba_igual((select count(*)::text from messages where con_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'), '2',
    'y contesta dentro del hilo de quien preguntó');
end $$;

-- ── Fabio, que no tiene nada que ver, no ve nada ─────────────────────
select set_config('prueba.uid', 'ffffffff-ffff-4fff-8fff-ffffffffffff', false);
do $$ begin
  perform prueba_igual((select count(*)::text from messages), '0',
    'quien no es parte no lee una sola línea');
end $$;

-- ── Las reglas de forma ──────────────────────────────────────────────
reset role;
do $$
begin
  insert into messages (sender_id, body) values
    ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'sin reserva ni viaje');
  raise exception 'FALLA — se guardó un mensaje que no cuelga de nada';
exception when check_violation then
  raise notice 'ok   un mensaje cuelga de una reserva o de un viaje, nunca de nada';
end $$;

do $$
begin
  insert into messages (trip_id, con_id, sender_id, body) values
    ('11111111-1111-4111-8111-111111111111',
     'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
     'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'hablando solo');
  raise exception 'FALLA — el conductor abrió un hilo consigo mismo';
exception when raise_exception then
  raise notice 'ok   el conductor no es la otra parte de su propio hilo';
end $$;

-- Ni siquiera con la llave de servicio se abre un hilo a nombre de un tercero.
do $$
begin
  insert into messages (trip_id, con_id, sender_id, body) values
    ('11111111-1111-4111-8111-111111111111',
     'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
     'ffffffff-ffff-4fff-8fff-ffffffffffff', 'en nombre de otro');
  raise exception 'FALLA — un tercero escribió en un hilo ajeno con la llave de servicio';
exception when raise_exception then
  raise notice 'ok   el disparador lo impide también para la llave de servicio';
end $$;
