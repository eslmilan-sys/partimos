-- =====================================================================
--  BANC D'ESSAI DE LA RLS — éprouver 0039 pour de vrai.
--
--  Le banc de `00-banco.sql` ne rejoue que 0033→0037 : il pose des tables
--  factices qui entrent en collision avec 0001, donc la chaîne complète
--  ne s'y rejoue pas. Ce fichier fait autre chose et plus utile : il
--  recrée les tables que 0039 touche AVEC LEURS VRAIES COLONNES, charge
--  0039 TEL QUEL, puis vérifie ce que `anon` peut réellement faire.
--
--  Ce qui est testé, c'est donc le comportement — pas la syntaxe.
-- =====================================================================

\set ON_ERROR_STOP on

do $$ begin create role anon;          exception when duplicate_object then null; end $$;
do $$ begin create role authenticated; exception when duplicate_object then null; end $$;

-- `auth.uid()` : sans GoTrue, on la simule comme le fait `00-banco.sql`.
create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('prueba.uid', true), '')::uuid $$;

-- ── Les tables, avec les colonnes dont les politiques se servent ──────
create table profiles   (id uuid primary key);
create table trips      (id uuid primary key default gen_random_uuid(),
                         driver_id uuid, vehicle_id uuid, status text);
create table vehicles   (id uuid primary key default gen_random_uuid(),
                         owner_id uuid, make text, plate_last3 text);
create table bookings   (id uuid primary key default gen_random_uuid(),
                         trip_id uuid, passenger_id uuid);
create table trip_stops (id uuid primary key default gen_random_uuid(), trip_id uuid);
create table payments   (id uuid primary key default gen_random_uuid(), booking_id uuid);
create table cancellations (id uuid primary key default gen_random_uuid(),
                            booking_id uuid, actor_id uuid);
create table refunds    (id uuid primary key default gen_random_uuid(), cancellation_id uuid);
create table incidents  (id uuid primary key default gen_random_uuid(),
                         booking_id uuid, reporter_id uuid);
create table reviews    (id uuid primary key default gen_random_uuid(), author_id uuid);

create table cities                (id uuid primary key default gen_random_uuid(), name text);
create table corridors             (id uuid primary key default gen_random_uuid());
create table pickup_points         (id uuid primary key default gen_random_uuid());
create table price_rules           (id uuid primary key default gen_random_uuid());
create table vehicle_categories    (code text primary key);
create table cancellation_policies (id uuid primary key default gen_random_uuid());

create table credits           (id uuid primary key default gen_random_uuid(), profile_id uuid);
create table payouts           (id uuid primary key default gen_random_uuid());
create table payout_batches    (id uuid primary key default gen_random_uuid());
create table no_show_reports   (id uuid primary key default gen_random_uuid());
create table driver_activation (profile_id uuid primary key);
create table demand_signals    (id uuid primary key default gen_random_uuid());

-- Les politiques que 0039 se contente d'allumer, reprises de 0023/24/25/28.
create policy vehicles_owner_all on vehicles
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy reviews_public_read on reviews for select using (true);
create policy trip_stops_read on trip_stops for select using (
  exists (select 1 from trips t where t.id = trip_stops.trip_id and t.status = 'published'));
create policy payments_parties_read on payments for select using (
  exists (select 1 from bookings b where b.id = payments.booking_id and b.passenger_id = auth.uid()));
create policy cancellations_parties_read on cancellations for select using (
  exists (select 1 from bookings b where b.id = cancellations.booking_id and b.passenger_id = auth.uid()));
create policy refunds_parties_read on refunds for select using (false);
create policy incidents_reporter_read on incidents for select using (reporter_id = auth.uid());

-- 0001 les allume déjà en production : le banc doit partir du même état.
alter table profiles enable row level security;
alter table trips    enable row level security;
alter table bookings enable row level security;
create policy trips_public_read on trips for select using (status = 'published');

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
