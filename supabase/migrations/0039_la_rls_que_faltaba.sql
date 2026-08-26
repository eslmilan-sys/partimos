-- =====================================================================
--  MIGRATION 0039 — La RLS que faltaba.
--
--  Supabase mandó una alerta de seguridad el 23-08 («Table publicly
--  accessible»). Revisando el repo entero, el defecto es mucho mayor que
--  lo que la alerta enseñaba, y es de la clase más traicionera:
--
--    **HAY POLÍTICAS ESCRITAS SOBRE TABLAS QUE NUNCA TUVIERON RLS.**
--
--  `vehicles`, `trip_stops`, `payments`, `cancellations`, `refunds`,
--  `incidents` y `reviews` tienen políticas cuidadas —de 0023, 0024, 0025
--  y 0028— pero a ninguna se le hizo `ENABLE ROW LEVEL SECURITY`. Una
--  política sin RLS encendida NO SE APLICA: Postgres la guarda y la
--  ignora. El resultado es una base que parece protegida al leer las
--  migraciones y está abierta de par en par.
--
--  Y once tablas más nunca tuvieron ni una cosa ni la otra: el catálogo
--  (`cities`, `corridors`, `pickup_points`, `price_rules`,
--  `vehicle_categories`, `cancellation_policies`) y las de plata y
--  conflictos (`credits`, `payouts`, `payout_batches`, `no_show_reports`,
--  `driver_activation`, `demand_signals`).
--
--  QUÉ SIGNIFICABA. La llave publicable va dentro del paquete que se
--  descarga al navegador — es pública a propósito, y lo que protege los
--  datos son las políticas RLS (regla 4 de CLAUDE.md). Sin ellas,
--  cualquiera con esa llave —que es cualquiera que abra la app— podía
--  LEER, ESCRIBIR y BORRAR cada fila de esas dieciocho tablas: los pagos,
--  los reembolsos, los reportes de incidentes, los carros de la gente.
--
--  Esta migración no inventa políticas nuevas donde ya las había: enciende
--  la RLS para que las que existen empiecen a valer, y escribe las que
--  faltan.
--
--  NO TOCA `spatial_ref_sys`. Es la tabla de sistemas de coordenadas de
--  PostGIS —ocho mil filas de definiciones de proyección, ni un dato de
--  nadie— y su dueño es la extensión, no nosotros: intentar encenderle la
--  RLS devuelve «42501: must be owner of table», que es exactamente lo
--  que pasó al intentarlo desde el panel. Es un falso positivo conocido
--  del linter de Supabase y se deja como está.
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
--  1 · Las que YA tenían política y no la aplicaban.
--
--  Aquí solo se enciende el interruptor. Las políticas de 0023/0024/0025
--  y 0028 pasan a valer tal como se escribieron.
-- ─────────────────────────────────────────────────────────────────────

alter table vehicles      enable row level security;
alter table trip_stops    enable row level security;
alter table payments      enable row level security;
alter table cancellations enable row level security;
alter table refunds       enable row level security;
alter table incidents     enable row level security;
alter table reviews       enable row level security;

-- El carro se ve ANTES de pedir puesto: es como el pasajero reconoce en
-- qué se va a subir. `vehicles_owner_all` (0023) solo deja al dueño, así
-- que encender la RLS sin esto dejaría los resultados sin carro. Se abre
-- la lectura de los carros que llevan un viaje publicado, y nada más: un
-- carro que nadie ha puesto en la calle no se lista.
--
-- Lo que se ve de un carro ya es el mínimo: marca, modelo, color, año y
-- los TRES últimos de la placa. La placa entera no está en esta tabla.
drop policy if exists vehicles_public_read on vehicles;
create policy vehicles_public_read on vehicles
  for select
  using (
    exists (
      select 1 from trips t
      where t.vehicle_id = vehicles.id and t.status = 'published'
    )
  );

-- ─────────────────────────────────────────────────────────────────────
--  2 · El catálogo: lo lee cualquiera, no lo escribe nadie.
--
--  Ciudades, corredores, puntos de recogida, el barème y las políticas de
--  cancelación son datos públicos — la app los carga sin sesión, para
--  buscar antes de registrarse. Se abre el SELECT y NO se escribe ninguna
--  política de escritura: sin política, RLS deniega. Estas tablas se
--  siembran por migración, con la llave de servicio.
-- ─────────────────────────────────────────────────────────────────────

alter table cities                enable row level security;
alter table corridors             enable row level security;
alter table pickup_points         enable row level security;
alter table price_rules           enable row level security;
alter table vehicle_categories    enable row level security;
alter table cancellation_policies enable row level security;

drop policy if exists cities_public_read on cities;
create policy cities_public_read on cities
  for select to anon, authenticated using (true);

drop policy if exists corridors_public_read on corridors;
create policy corridors_public_read on corridors
  for select to anon, authenticated using (true);

drop policy if exists pickup_points_public_read on pickup_points;
create policy pickup_points_public_read on pickup_points
  for select to anon, authenticated using (true);

drop policy if exists price_rules_public_read on price_rules;
create policy price_rules_public_read on price_rules
  for select to anon, authenticated using (true);

drop policy if exists vehicle_categories_public_read on vehicle_categories;
create policy vehicle_categories_public_read on vehicle_categories
  for select to anon, authenticated using (true);

drop policy if exists cancellation_policies_public_read on cancellation_policies;
create policy cancellation_policies_public_read on cancellation_policies
  for select to anon, authenticated using (true);

-- ─────────────────────────────────────────────────────────────────────
--  3 · Las cerradas: ninguna llave de cliente las toca.
--
--  Plata que se mueve entre nosotros y el conductor, reportes de que
--  alguien no apareció, activaciones y señales de demanda. Nada de esto
--  lo pinta una pantalla: lo escriben las funciones Edge con la llave de
--  servicio, que salta la RLS por diseño.
--
--  Se enciende la RLS y se deja SIN políticas — que es la forma más
--  clara de decir «desde el cliente, nunca». Es el mismo criterio que
--  `ledger_no_client_access` de 0001, escrito allí como `USING (false)`.
-- ─────────────────────────────────────────────────────────────────────

alter table credits           enable row level security;
alter table payouts           enable row level security;
alter table payout_batches    enable row level security;
alter table no_show_reports   enable row level security;
alter table driver_activation enable row level security;
alter table demand_signals    enable row level security;

comment on table credits is
  'RLS encendida sin políticas (0039): solo la llave de servicio. El saldo de alguien no se lee desde el navegador.';
comment on table payouts is
  'RLS encendida sin políticas (0039): solo la llave de servicio.';
comment on table payout_batches is
  'RLS encendida sin políticas (0039): solo la llave de servicio.';
comment on table no_show_reports is
  'RLS encendida sin políticas (0039): solo la llave de servicio. Decir que alguien no apareció es un juicio sobre una persona.';
comment on table driver_activation is
  'RLS encendida sin políticas (0039): solo la llave de servicio.';
comment on table demand_signals is
  'RLS encendida sin políticas (0039): solo la llave de servicio.';

-- ─────────────────────────────────────────────────────────────────────
--  4 · Que no vuelva a pasar.
--
--  El defecto no fue olvidar una política: fue creer que escribirla
--  bastaba. Esta comprobación falla la migración si queda una sola tabla
--  de `public` sin RLS, así que el error no puede repetirse en silencio.
--  `spatial_ref_sys` queda fuera a mano, con su razón.
-- ─────────────────────────────────────────────────────────────────────

do $$
declare
  abiertas text;
begin
  select string_agg(c.relname, ', ' order by c.relname)
    into abiertas
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and not c.relrowsecurity
    -- De PostGIS, no nuestra: no somos su dueño y no guarda datos de nadie.
    and c.relname <> 'spatial_ref_sys';

  if abiertas is not null then
    raise exception 'Quedan tablas sin RLS en public: %', abiertas;
  end if;
end $$;
