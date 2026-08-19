-- =====================================================================
--  MIGRATION 0023 — EL CONDUCTOR ESCRIBE DE VERDAD
--
--  Hasta hoy, «Publicar el viaje» terminaba en el localStorage del
--  navegador. La base tenía las tablas, las reglas y el tope; lo que no
--  tenía era PERMISO para que el dueño de un carro guardara su carro.
--
--  `vehicles` y `trip_stops` tienen RLS activada y CERO políticas. En
--  Postgres eso no es «abierto», es «cerrado para todo el mundo»: ni
--  siquiera el dueño de la fila puede leerla. La migración 0016 lo
--  anotó como intencional —«solo el rol de servicio las toca»— y era
--  cierto MIENTRAS nadie publicara. Desde el momento en que el flujo de
--  publicación escribe, deja de serlo: `trips.vehicle_id` es NOT NULL y
--  apunta a una tabla donde el conductor no puede insertar nada.
--
--  Se abren, y solo lo justo:
--    · el dueño ve y escribe SUS carros, nadie más;
--    · las paradas de un viaje se leen si el viaje se lee, y se
--      escriben si el viaje es tuyo.
--  El pasajero sigue viendo el carro por `available_trips`, que es
--  SECURITY DEFINER y enseña marca, modelo y color sin la placa.
--
--  Y la señal de demanda: `demand_signals` existe desde el primer día
--  con cero filas, porque nadie la escribía. Es el dato que le dice al
--  conductor «tu ruta la buscan» — el único argumento honesto para
--  pedirle que publique. Se escribe y se lee por dos funciones, y la
--  tabla queda cerrada a lectura directa: quién buscó qué no es asunto
--  de nadie más.
-- =====================================================================

/* ── 1. El carro es de su dueño ─────────────────────────────────────── */

drop policy if exists vehicles_owner_all on vehicles;
create policy vehicles_owner_all on vehicles
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

comment on table vehicles is
  'El carro del conductor. RLS: solo su dueño. El pasajero ve marca/modelo/color por la vista available_trips, nunca la placa.';

/* ── 2. Las paradas siguen a su viaje ───────────────────────────────── */

drop policy if exists trip_stops_read on trip_stops;
create policy trip_stops_read on trip_stops
  for select
  using (
    exists (
      select 1 from trips t
      where t.id = trip_stops.trip_id
        and (t.status = 'published' or t.driver_id = auth.uid())
    )
  );

drop policy if exists trip_stops_owner_write on trip_stops;
create policy trip_stops_owner_write on trip_stops
  for all
  using (
    exists (
      select 1 from trips t
      where t.id = trip_stops.trip_id and t.driver_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from trips t
      where t.id = trip_stops.trip_id and t.driver_id = auth.uid()
    )
  );

/* ── 3. La señal de demanda ─────────────────────────────────────────── */

-- El id anónimo del navegador (el mismo de `events`). Sirve para NO
-- contar diez veces a la misma persona que refresca la página: sin él,
-- «12 búsquedas» sería una cifra inflable, y una cifra inflable que se
-- le enseña a un conductor es una mentira con retraso.
alter table demand_signals add column if not exists search_session text;

create index if not exists idx_demanda_ruta_fecha
  on demand_signals (origin_city_id, destination_city_id, created_at desc);

-- Escribir: por función, nunca por INSERT directo. Así el navegador no
-- elige el `searcher_id` de otro ni inventa un corredor.
create or replace function registrar_busqueda(
  p_origen     text,
  p_destino    text,
  p_fecha      date,
  p_puestos    int  default 1,
  p_resultados int  default 0,
  p_sesion     text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_origen   uuid;
  v_destino  uuid;
  v_corredor uuid;
begin
  if p_origen is null or p_destino is null or p_origen = p_destino then
    return;
  end if;

  select id into v_origen  from cities where slug = p_origen;
  select id into v_destino from cities where slug = p_destino;
  if v_origen is null or v_destino is null then
    return;  -- ciudad desconocida: no se inventa una fila
  end if;

  select id into v_corredor
    from corridors
   where origin_city_id = v_origen and destination_city_id = v_destino;

  -- La misma persona, la misma ruta, el mismo día, dentro de la media
  -- hora: es la misma búsqueda. Se cuenta una vez.
  if exists (
    select 1 from demand_signals d
     where d.origin_city_id = v_origen
       and d.destination_city_id = v_destino
       and d.requested_date = coalesce(p_fecha, current_date)
       and d.search_session is not distinct from p_sesion
       and d.created_at > now() - interval '30 minutes'
  ) then
    return;
  end if;

  insert into demand_signals (
    corridor_id, origin_city_id, destination_city_id, searcher_id,
    requested_date, seats_wanted, results_count, source, search_session
  ) values (
    v_corredor, v_origen, v_destino, auth.uid(),
    coalesce(p_fecha, current_date),
    greatest(1, least(coalesce(p_puestos, 1), 4)),
    greatest(0, coalesce(p_resultados, 0)),
    'app',
    p_sesion
  );
end $$;

-- Leer: solo un NÚMERO, y solo de una ruta que se pregunta por su
-- nombre. Nunca las filas — quién buscó qué no sale de aquí.
create or replace function demanda_reciente(
  p_origen  text,
  p_destino text,
  p_dias    int default 14
) returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(distinct coalesce(d.search_session, d.id::text))::int
    from demand_signals d
    join cities o on o.id = d.origin_city_id
    join cities e on e.id = d.destination_city_id
   where o.slug = p_origen
     and e.slug = p_destino
     and d.created_at > now() - make_interval(days => greatest(1, least(coalesce(p_dias, 14), 60)));
$$;

revoke execute on function registrar_busqueda(text, text, date, int, int, text) from public;
revoke execute on function demanda_reciente(text, text, int) from public;
grant  execute on function registrar_busqueda(text, text, date, int, int, text) to anon, authenticated;
grant  execute on function demanda_reciente(text, text, int) to anon, authenticated;

comment on function registrar_busqueda is
  'Registra una búsqueda como señal de demanda. Deduplica por sesión anónima dentro de 30 minutos: la cifra que ve el conductor no se puede inflar refrescando.';
comment on function demanda_reciente is
  'Cuántas búsquedas distintas tuvo una ruta en los últimos N días. Devuelve un número, nunca filas.';
