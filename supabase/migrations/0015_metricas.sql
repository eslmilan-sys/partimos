-- 0015 — LAS MÉTRICAS: quién entra, de dónde viene y qué hace
--
-- Las 33 tablas anteriores cuentan el NEGOCIO (viajes, reservas, plata).
-- Ninguna cuenta el PRODUCTO: cuánta gente miró y se fue, qué buscaron
-- los que no reservaron, si el que llegó por un enlace de WhatsApp
-- convierte mejor que el que llegó por Google. Eso es lo que decide qué
-- se arregla la semana que viene, y hasta ahora no se estaba guardando.
--
-- Qué se guarda, y qué NO
-- =======================
-- Se guarda: el nombre del evento, la hora, un id de sesión anónimo, de
-- dónde vino la visita (utm + dominio del referente) y cuatro datos de
-- contexto (ruta buscada, ciudad, tipo de pantalla).
--
-- NO se guarda: la IP, el user-agent completo, ni la URL entera del
-- referente. Una IP es un dato personal en Panamá igual que en Europa, y
-- para saber si Chitré convierte mejor que David no hace ninguna falta.
-- Guardar menos también es no tener que protegerlo.
--
-- El `session_id` es un número aleatorio que vive en el navegador. Si la
-- persona entra con cuenta, `user_id` se llena y las dos mitades se unen
-- — antes de eso, nadie sabe quién es, y así está bien.

create table if not exists events (
  id bigserial primary key,
  -- Nombre en dos partes, `objeto_verbo`: busqueda_hecha, viaje_visto,
  -- reserva_pedida, publicacion_hecha… Se lee ordenado alfabéticamente.
  name text not null,
  occurred_at timestamptz not null default now(),
  -- Anónimo hasta que haya cuenta. Se conserva al iniciar sesión, así
  -- que la visita de antes y la cuenta de después se pueden unir.
  session_id text not null,
  user_id uuid references auth.users (id) on delete set null,
  -- De dónde viene la visita. Solo el DOMINIO del referente
  -- ('google.com', 'wa.me'), nunca la URL completa.
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referrer_host text,
  -- Contexto útil sin ser identificante.
  path text,
  origin_slug text,
  destination_slug text,
  device text check (device in ('movil', 'escritorio')),
  -- Lo específico del evento (puestos buscados, canal de pago elegido…).
  props jsonb not null default '{}'::jsonb
);

create index if not exists events_name_time on events (name, occurred_at desc);
create index if not exists events_session on events (session_id);
create index if not exists events_user on events (user_id) where user_id is not null;
create index if not exists events_time on events (occurred_at desc);

alter table events enable row level security;

-- Escribir: cualquiera, con o sin cuenta — el visitante anónimo es
-- justamente el que hay que entender. La tabla solo acepta INSERT.
drop policy if exists events_insert on events;
create policy events_insert on events for insert to anon, authenticated
  with check (true);

-- Leer: nadie desde la app. Los números se miran desde el panel (rol de
-- servicio). Un visitante no tiene por qué poder leer el tráfico ajeno.

/* ══════════════════════════════════════════════════════════════════
   LAS VISTAS — las preguntas que de verdad se hacen
   ══════════════════════════════════════════════════════════════════ */

/** Quién se registró y cuándo, con su procedencia y su actividad.
 *  Una línea por persona: la respuesta a «¿quién es esta gente?». */
create or replace view metricas_usuarios as
select
  u.id,
  p.first_name,
  u.created_at as registrado_el,
  u.last_sign_in_at as ultima_conexion,
  u.raw_app_meta_data ->> 'provider' as metodo_registro,
  p.is_phone_verified as telefono_verificado,
  p.is_id_verified as cedula_verificada,
  (select count(*) from events e
    where e.user_id = u.id and e.name = 'sesion_iniciada') as veces_conectado,
  (select count(*) from events e
    where e.user_id = u.id and e.name = 'busqueda_hecha') as busquedas,
  (select count(*) from bookings b where b.passenger_id = u.id) as reservas,
  (select count(*) from trips t where t.driver_id = u.id) as viajes_publicados,
  (select e.utm_source from events e
    where e.user_id = u.id and e.utm_source is not null
    order by e.occurred_at limit 1) as vino_de
from auth.users u
left join profiles p on p.id = u.id;

/** El embudo, día a día. La pregunta es siempre la misma: ¿dónde se
 *  cae la gente? Sesiones que buscan, búsquedas que abren un viaje,
 *  viajes que terminan en reserva. */
create or replace view metricas_embudo_diario as
select
  date_trunc('day', occurred_at)::date as dia,
  count(distinct session_id) filter (where name = 'pagina_vista') as sesiones,
  count(*) filter (where name = 'busqueda_hecha') as busquedas,
  count(*) filter (where name = 'busqueda_vacia') as busquedas_sin_resultado,
  count(*) filter (where name = 'viaje_visto') as viajes_vistos,
  count(*) filter (where name = 'reserva_pedida') as reservas,
  count(*) filter (where name = 'publicacion_hecha') as publicaciones,
  count(distinct session_id) filter (where name = 'cuenta_creada') as cuentas_nuevas
from events
group by 1
order by 1 desc;

/** De dónde viene la gente, y cuál de esas fuentes trae gente que
 *  RESERVA — no solo que mira. Es la única forma honesta de decidir
 *  dónde poner el esfuerzo. */
create or replace view metricas_fuentes as
select
  coalesce(utm_source, referrer_host, 'directo') as fuente,
  utm_campaign as campana,
  count(distinct session_id) as sesiones,
  count(distinct session_id) filter (where name = 'reserva_pedida') as sesiones_con_reserva,
  round(
    100.0 * count(distinct session_id) filter (where name = 'reserva_pedida')
      / nullif(count(distinct session_id), 0),
    1
  ) as tasa_conversion_pct
from events
group by 1, 2
order by sesiones desc;

/** Las rutas que la gente busca, y las que se quedan sin respuesta.
 *  Una ruta muy buscada y siempre vacía es un conductor que falta —
 *  el dato más accionable de todos. */
create or replace view metricas_rutas_buscadas as
select
  origin_slug,
  destination_slug,
  count(*) as busquedas,
  count(*) filter (where name = 'busqueda_vacia') as sin_resultado,
  round(
    100.0 * count(*) filter (where name = 'busqueda_vacia') / nullif(count(*), 0),
    1
  ) as pct_sin_resultado,
  max(occurred_at) as ultima_vez
from events
where name in ('busqueda_hecha', 'busqueda_vacia')
  and origin_slug is not null
group by 1, 2
order by busquedas desc;

/** Qué se toca en cada pantalla, por día. Responde a «¿hizo clic en
 *  qué?» sin tener que abrir la tabla cruda. */
create or replace view metricas_eventos_diarios as
select
  date_trunc('day', occurred_at)::date as dia,
  name as evento,
  count(*) as veces,
  count(distinct session_id) as sesiones,
  count(*) filter (where device = 'movil') as en_movil
from events
group by 1, 2
order by 1 desc, 3 desc;

comment on table events is
  'Analítica de producto. Sin IP, sin user-agent, sin URL completa del referente. Se escribe desde el navegador (solo INSERT) y se lee desde el panel con el rol de servicio. Vistas: metricas_usuarios, metricas_embudo_diario, metricas_fuentes, metricas_rutas_buscadas, metricas_eventos_diarios.';
