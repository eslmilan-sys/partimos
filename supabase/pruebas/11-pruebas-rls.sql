-- =====================================================================
--  CE QUE `anon` PEUT VRAIMENT FAIRE, une fois 0039 chargée.
--
--  `anon` est le rôle de la clé publiable — celle qui part dans le paquet
--  téléchargé par le navigateur. Ces essais se font DANS SA PEAU
--  (`set role anon`), donc ce qui passe ici est exactement ce que passerait
--  n'importe qui avec l'adresse du projet.
-- =====================================================================

\set ON_ERROR_STOP on

create or replace function prueba_igual(hecho text, esperado text, dijo text)
returns void language plpgsql as $$
begin
  if hecho is distinct from esperado then
    raise exception 'FALLA — % : esperaba «%», dio «%»', dijo, esperado, hecho;
  end if;
  raise notice 'ok   %', dijo;
end $$;

-- Quelqu'un, un carro, un viaje publié, une réservation.
insert into profiles (id) values ('11111111-1111-4111-8111-111111111111');
insert into vehicles (id, owner_id, make, plate_last3)
  values ('22222222-2222-4222-8222-222222222222',
          '11111111-1111-4111-8111-111111111111', 'Hyundai', '234');
insert into trips (id, driver_id, vehicle_id, status)
  values ('33333333-3333-4333-8333-333333333333',
          '11111111-1111-4111-8111-111111111111',
          '22222222-2222-4222-8222-222222222222', 'published');
-- Un carro que personne n'a mis sur la route.
insert into vehicles (id, owner_id, make, plate_last3)
  values ('44444444-4444-4444-8444-444444444444',
          '11111111-1111-4111-8111-111111111111', 'Kia', '999');
insert into cities (name) values ('Ciudad de Panamá');
insert into credits (profile_id) values ('11111111-1111-4111-8111-111111111111');
insert into payouts default values;
insert into no_show_reports default values;

-- ── Dans la peau de `anon` ───────────────────────────────────────────
set role anon;

do $$ begin
  perform prueba_igual(
    (select count(*)::text from cities), '1',
    'el catálogo se lee sin sesión — la app busca antes de registrarse');

  perform prueba_igual(
    (select count(*)::text from vehicles), '1',
    'solo se ve el carro que lleva un viaje publicado, no el guardado');

  perform prueba_igual(
    (select make from vehicles), 'Hyundai',
    'y el que se ve es el del viaje publicado');

  perform prueba_igual(
    (select count(*)::text from credits), '0',
    'el saldo de alguien NO se lee desde el navegador');

  perform prueba_igual(
    (select count(*)::text from payouts), '0',
    'los pagos al conductor tampoco');

  perform prueba_igual(
    (select count(*)::text from no_show_reports), '0',
    'ni que alguien dijo que otro no apareció');

  perform prueba_igual(
    (select count(*)::text from payments), '0',
    'sin sesión no hay pago que mirar');
end $$;

-- Écrire dans le catalogue : refusé. C'est le cœur de l'alerte reçue.
do $$
begin
  insert into cities (name) values ('Ciudad inventada');
  raise exception 'FALLA — anon PUDO escribir en el catálogo';
exception
  when insufficient_privilege then
    raise notice 'ok   anon no puede escribir en el catálogo';
end $$;

do $$
begin
  delete from cities;
  if (select count(*) from cities) = 0 then
    raise exception 'FALLA — anon PUDO borrar el catálogo';
  end if;
  raise notice 'ok   anon no puede borrar el catálogo';
end $$;

do $$
begin
  update vehicles set plate_last3 = '000';
  if exists (select 1 from vehicles where plate_last3 = '000') then
    raise exception 'FALLA — anon PUDO cambiar la placa de un carro ajeno';
  end if;
  raise notice 'ok   anon no puede cambiar el carro de otro';
end $$;

reset role;

-- ── Le garde-fou de 0039 fait-il son travail ? ───────────────────────
create table tabla_olvidada (id int);

do $$
declare
  abiertas text;
begin
  select string_agg(c.relname, ', ' order by c.relname) into abiertas
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
    and not c.relrowsecurity and c.relname <> 'spatial_ref_sys';

  if abiertas is distinct from 'tabla_olvidada' then
    raise exception 'FALLA — el centinela vio «%», esperaba «tabla_olvidada»', abiertas;
  end if;
  raise notice 'ok   el centinela de 0039 ve la tabla que se quedó abierta';
end $$;

drop table tabla_olvidada;
