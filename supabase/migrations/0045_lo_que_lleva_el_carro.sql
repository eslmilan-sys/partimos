-- =====================================================================
--  MIGRACIÓN 0045 — Lo que lleva el carro, dónde te sientas, y lo que
--  aporta quien sube a mitad de camino.
--
--  Pedido del dueño (27-08-2026), con capturas de BlaBlaCar: que quien
--  maneja pueda decir qué tiene el carro, cuántos puestos van adelante y
--  cuántos atrás, y qué aporta quien sube en una parada del camino.
--
--  ── 1 · LO QUE TIENE EL CARRO ───────────────────────────────────────
--  Aire y enchufe USB. Van en `vehicles` y no en `trips` porque son del
--  carro: no cambian de un viaje al siguiente, y preguntarlo cada vez
--  sería hacer teclear lo mismo cada semana.
--
--  ── 2 · ADELANTE Y ATRÁS ────────────────────────────────────────────
--  `seats_offered` decía cuántos puestos hay y no dónde. Y el sitio
--  importa: tres atrás van apretados, dos van cómodos, y el de adelante
--  es otro viaje. Con el reparto explícito, «máx. 2 personas atrás» deja
--  de ser una casilla aparte — es simplemente haber puesto 2 atrás.
--
--  Los dos son nulos en lo ya publicado: un viaje de antes no sabe cómo
--  se repartía, y no se inventa. La app cae a `seats_offered` entero.
--
--  ── 3 · EL APORTE DESDE CADA PARADA ─────────────────────────────────
--  Un viaje que declara sus ciudades de paso sirve varios trayectos, y
--  **el aporte es el del tramo, no el del viaje entero** — regla ya
--  escrita en PRODUCT.md. Faltaba dónde guardarlo.
--
--  **Aquí está la diferencia con BlaBlaCar, y no es un detalle.** Allá
--  el conductor fija el precio de cada tramo a mano y a lo que quiera.
--  Aquí cada tramo tiene su propio tope, calculado con la MISMA fórmula
--  sobre los kilómetros de ESE tramo: quien sube en Penonomé no puede
--  pagar lo de quien sube en Panamá. El tope se guarda junto al importe
--  y la base lo impone; sin eso, partir un viaje en trozos sería la
--  puerta de atrás para cobrar de más sin que la fórmula se entere.
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
--  1 · El carro
-- ─────────────────────────────────────────────────────────────────────

alter table vehicles
  add column if not exists has_ac  boolean not null default false,
  add column if not exists has_usb boolean not null default false;

comment on column vehicles.has_ac  is 'Aire acondicionado (0045). Del carro, no del viaje.';
comment on column vehicles.has_usb is 'Enchufe USB para cargar (0045).';

-- ─────────────────────────────────────────────────────────────────────
--  2 · Dónde te sientas
-- ─────────────────────────────────────────────────────────────────────

alter table trips
  add column if not exists seats_front integer,
  add column if not exists seats_back  integer;

comment on column trips.seats_front is
  'Puestos ofrecidos adelante (0045). Nulo en lo publicado antes: no se inventa.';
comment on column trips.seats_back is
  'Puestos ofrecidos atrás (0045). Con 2, el viaje anuncia «máx. 2 personas atrás».';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'trips_puestos_cuadran') then
    alter table trips add constraint trips_puestos_cuadran check (
      -- O no se dice nada, o se dice entero y suma lo que se ofrece.
      (seats_front is null and seats_back is null)
      or (
        seats_front between 0 and 1
        and seats_back between 0 and 3
        and seats_front + seats_back = seats_offered
      )
    );
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────
--  3 · El aporte de cada tramo
--
--  La clave es (viaje, desde, hasta) con las dos paradas del tramo. Se
--  guarda sólo lo que el conductor deja publicado; lo que no está aquí
--  se calcula al vuelo con la misma fórmula.
-- ─────────────────────────────────────────────────────────────────────

create table if not exists trip_segment_prices (
  id             uuid primary key default gen_random_uuid(),
  trip_id        uuid not null references trips(id) on delete cascade,
  from_stop_id   uuid not null references trip_stops(id) on delete cascade,
  to_stop_id     uuid not null references trip_stops(id) on delete cascade,
  price_cents    integer not null,
  /* El tope de ESTE tramo, calculado al publicar con la misma fórmula.
     Se guarda —y no sólo se comprueba— por la misma razón que `trips`
     guarda sus `snap_*`: para poder auditar después con qué números se
     dejó pasar, aunque el precio de la gasolina haya cambiado. */
  max_price_cents integer not null,
  created_at     timestamptz not null default now(),

  constraint trip_segment_prices_una_vez unique (trip_id, from_stop_id, to_stop_id),
  constraint trip_segment_prices_orden check (from_stop_id <> to_stop_id),
  constraint trip_segment_prices_razonable check (price_cents > 0 and max_price_cents > 0),
  /* R1 EN EL TRAMO. La misma autoridad que `price_within_cap` tiene sobre
     el viaje entero: nadie cobra por encima del tope de su tramo, y la
     base lo dice, no el código de la app. */
  constraint trip_segment_within_cap check (price_cents <= max_price_cents)
);

comment on table trip_segment_prices is
  'El aporte de quien sube y baja en paradas del camino (0045). Cada tramo lleva su propio tope, con la misma fórmula sobre SUS kilómetros.';

create index if not exists idx_trip_segment_prices_viaje
  on trip_segment_prices (trip_id);

-- ─────────────────────────────────────────────────────────────────────
--  Quién ve qué.
--
--  Se leen como se lee el viaje: son parte de la oferta pública. Sólo
--  quien maneja los escribe, y sólo en SUS viajes.
-- ─────────────────────────────────────────────────────────────────────

alter table trip_segment_prices enable row level security;

grant select on trip_segment_prices to anon, authenticated;
grant insert, update, delete on trip_segment_prices to authenticated;

drop policy if exists trip_segment_prices_visibles on trip_segment_prices;
create policy trip_segment_prices_visibles on trip_segment_prices
  for select using (true);

drop policy if exists trip_segment_prices_del_conductor on trip_segment_prices;
create policy trip_segment_prices_del_conductor on trip_segment_prices
  for all
  using (exists (select 1 from trips t where t.id = trip_id and t.driver_id = auth.uid()))
  with check (exists (select 1 from trips t where t.id = trip_id and t.driver_id = auth.uid()));
