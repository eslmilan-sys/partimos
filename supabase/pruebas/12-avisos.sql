-- =====================================================================
--  BANC D'ESSAI DE 0040 — les avis s'écrivent-ils tout seuls ?
--
--  On recrée les tables que la migration touche AVEC LES COLONNES dont
--  ses triggers se servent, on charge 0040 TEL QUEL, puis on fait vivre
--  une réservation entière : demande → acceptation → voyage fini →
--  apport libéré. À chaque étape, la bonne personne doit trouver le bon
--  avis dans sa bandeja — et personne d'autre.
--
--  Se lance depuis `correr-avisos.sh`, sur une base à lui.
-- =====================================================================

\set ON_ERROR_STOP on

do $$ begin create role anon;          exception when duplicate_object then null; end $$;
do $$ begin create role authenticated; exception when duplicate_object then null; end $$;

create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('prueba.uid', true), '')::uuid $$;

-- ── Les tables, avec les colonnes que 0040 lit ────────────────────────
create table profiles (
  id uuid primary key,
  first_name text not null,
  last_initial text
);
create table cities (id uuid primary key default gen_random_uuid(), name text);
create table trips (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid references profiles(id),
  status text,
  departure_at timestamptz,
  origin_label text,
  destination_label text,
  origin_city_id uuid references cities(id),
  destination_city_id uuid references cities(id)
);
create table bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id),
  passenger_id uuid references profiles(id),
  seats int default 1,
  unit_price_cents bigint default 0,
  status text default 'pending',
  confirmed_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  released_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid,
  author_id uuid
);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;

\ir ../migrations/0040_la_tabla_de_avisos.sql

-- ── Les personnages ──────────────────────────────────────────────────
insert into profiles values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Andrés',  'M.'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Daniela', 'L.');
insert into trips (id, driver_id, status, departure_at, origin_label, destination_label) values
  ('11111111-1111-4111-8111-111111111111',
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'published',
   '2026-08-27 11:00:00+00', 'Albrook · bahía 4', 'Chitré · parque Unión');

create or replace function prueba_igual(hecho text, esperado text, dijo text)
returns void language plpgsql as $$
begin
  if hecho is distinct from esperado then
    raise exception 'FALLA — % : esperaba «%», dio «%»', dijo, esperado, hecho;
  end if;
  raise notice 'ok   %', dijo;
end $$;

-- ── La vie d'une réservation, et l'avis que chaque pas doit écrire ───
insert into bookings (id, trip_id, passenger_id, seats, unit_price_cents) values
  ('22222222-2222-4222-8222-222222222222',
   '11111111-1111-4111-8111-111111111111',
   'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 1, 650);

do $$ begin
  perform prueba_igual(
    (select title from notifications
      where profile_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
        and kind = 'solicitud_recibida'),
    'Daniela L. pidió puesto',
    'pedir puesto le escribe su aviso al conductor');
  perform prueba_igual(
    (select body from notifications where kind = 'solicitud_recibida'),
    '06:00 · Albrook → Chitré',
    'la segunda línea dice la hora DE PANAMÁ y los lugares sin su detalle');
end $$;

update bookings set status = 'confirmed', confirmed_at = now()
 where id = '22222222-2222-4222-8222-222222222222';

do $$ begin
  perform prueba_igual(
    (select title from notifications
      where profile_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
        and kind = 'solicitud_aceptada'),
    'Andrés aceptó tu puesto',
    'aceptar le escribe el suyo al pasajero, con el nombre corto');
  perform prueba_igual(
    (select action_route from notifications where kind = 'solicitud_aceptada'),
    '/(pasajero)/codigo?reserva=22222222-2222-4222-8222-222222222222',
    'y la acción lleva directo a su código');
end $$;

update bookings set status = 'completed', completed_at = now(),
                    released_at = now()
 where id = '22222222-2222-4222-8222-222222222222';

do $$ begin
  perform prueba_igual(
    (select title from notifications where kind = 'califica_tu'),
    'Califica a Andrés M.',
    'el viaje hecho pide la calificación');
  perform prueba_igual(
    (select title from notifications where kind = 'aporte_recibido'),
    'Te aportaron B/6.50',
    'el aporte liberado avisa al conductor con la cifra en balboas');
end $$;

-- Le même fait rejoué ne compte qu'une fois (règle 3 du traspaso).
update bookings set completed_at = now()
 where id = '22222222-2222-4222-8222-222222222222';
do $$ begin
  perform prueba_igual(
    (select count(*)::text from notifications where kind = 'califica_tu'), '1',
    'un evento, un aviso: repetir el hecho no duplica');
end $$;

-- Le voyage annulé prévient chaque passager qui avait ENCORE sa place :
-- un deuxième voyage, une réservation confirmée, et l'annulation tombe.
insert into trips (id, driver_id, status, departure_at, origin_label, destination_label) values
  ('33333333-3333-4333-8333-333333333333',
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'published',
   '2026-08-28 11:00:00+00', 'Albrook · bahía 4', 'Santiago · piva');
insert into bookings (id, trip_id, passenger_id, status, confirmed_at) values
  ('44444444-4444-4444-8444-444444444444',
   '33333333-3333-4333-8333-333333333333',
   'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'confirmed', now());
update trips set status = 'cancelled'
 where id = '33333333-3333-4333-8333-333333333333';
do $$ begin
  perform prueba_igual(
    (select title from notifications where kind = 'viaje_cancelado'),
    'Andrés canceló el viaje',
    'cancelar el viaje avisa a quien iba montado');
  -- et le premier voyage, terminé depuis, n'a prévenu personne : il n'y
  -- avait plus de place à retirer.
  perform prueba_igual(
    (select count(*)::text from notifications where kind = 'viaje_cancelado'), '1',
    'un viaje ya hecho no se «cancela» a nadie');
end $$;

-- ── Dans la peau des lecteurs ────────────────────────────────────────
set role authenticated;
select set_config('prueba.uid', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', false);

do $$ begin
  perform prueba_igual(
    (select count(*)::text from notifications),
    (select count(*)::text from notifications
      where profile_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'),
    'cada quien lee SOLO su bandeja');
end $$;

-- Marquer lu : la seule écriture concédée…
update notifications set read_at = now() where kind = 'solicitud_aceptada';
do $$ begin
  perform prueba_igual(
    (select (read_at is not null)::text from notifications where kind = 'solicitud_aceptada'),
    'true',
    'marcar leído se guarda y sobrevive a la recarga');
end $$;

-- …et rien d'autre : ni retitre, ni invente, ni efface.
do $$ begin
  begin
    update notifications set title = 'otra cosa' where kind = 'solicitud_aceptada';
    raise exception 'FALLA — un lector PUDO reescribir el título de un aviso';
  exception when insufficient_privilege then
    raise notice 'ok   el título no se toca: solo read_at está concedida';
  end;
  begin
    insert into notifications (profile_id, kind, title, body)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'solicitud_recibida', 'spam', 'spam');
    raise exception 'FALLA — un cliente PUDO inventar un aviso en bandeja ajena';
  exception when insufficient_privilege then
    raise notice 'ok   ningún cliente inventa avisos: los escriben los hechos';
  end;
end $$;

reset role;
