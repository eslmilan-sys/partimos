-- 0016 — CIERRA LAS MÉTRICAS Y ABRE LOS CATÁLOGOS
--
-- El linter de Supabase encontró dos cosas al aplicar 0015 sobre el
-- proyecto real. La primera es grave y es culpa de esa migración.
--
-- 1. FUGA: `metricas_usuarios` lee `auth.users`, y toda vista del esquema
--    `public` queda expuesta por la API. Con la clave publicable —que por
--    diseño va en el navegador de cualquiera— se podían leer los correos
--    y teléfonos de los registrados. Las cinco vistas de métricas son
--    para el dueño, no para el público: se les quita el permiso a `anon`
--    y `authenticated`, y se les pone `security_invoker` para que además
--    respeten los permisos de quien pregunta. Se leen desde el panel, con
--    el rol de servicio.
--
-- 2. CATÁLOGOS MUDOS: `cities`, `corridors`, `pickup_points`,
--    `vehicle_categories`, `price_rules` y `cancellation_policies` tienen
--    RLS activada y NINGUNA política. En Postgres eso no significa
--    «abierto», significa «cerrado para todos»: el día que el sitio lea
--    la base, no vería ni una ciudad. Son datos de referencia, públicos
--    por naturaleza —lo que cuesta un kilómetro, dónde para un carro— y
--    se abren a lectura. Escribir sigue reservado al rol de servicio.

/* ── 1. Las métricas se cierran ─────────────────────────────────────── */

do $$
declare v text;
begin
  foreach v in array array[
    'metricas_usuarios',
    'metricas_embudo_diario',
    'metricas_fuentes',
    'metricas_rutas_buscadas',
    'metricas_eventos_diarios'
  ] loop
    if to_regclass('public.' || v) is not null then
      execute format('revoke all on public.%I from anon, authenticated', v);
      execute format('alter view public.%I set (security_invoker = on)', v);
    end if;
  end loop;
end $$;

/* ── 2. Los catálogos se abren a lectura ────────────────────────────── */

do $$
declare t text;
begin
  foreach t in array array[
    'cities',
    'corridors',
    'pickup_points',
    'vehicle_categories',
    'price_rules',
    'cancellation_policies'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop policy if exists %I on public.%I', t || '_read', t);
      execute format(
        'create policy %I on public.%I for select using (true)',
        t || '_read', t
      );
    end if;
  end loop;
end $$;

comment on view metricas_usuarios is
  'Solo para el dueño: contiene datos de auth.users. Sin permiso para anon ni authenticated — se lee desde el panel con el rol de servicio.';

/* ── 3. Funciones que no tienen por qué ser llamables desde fuera ───── */

-- El disparador que sincroniza el badge de cédula quedaba expuesto como
-- RPC. Revocar EXECUTE no lo afecta: los disparadores corren con los
-- permisos del dueño de la tabla, no del que llama.
revoke execute on function public.sync_profile_id_verified() from anon, authenticated;

-- Funciones internas de PostGIS, expuestas por herencia. La app nunca las
-- llama desde el navegador.
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'st_estimatedextent'
  loop
    execute format('revoke execute on function %s from anon, authenticated', f.sig);
  end loop;
end $$;

/* ── Lo que se deja como está, a propósito ───────────────────────────
 * · `public_profiles` y `available_trips` son SECURITY DEFINER a
 *   propósito: es así como enseñan unas pocas columnas al público
 *   mientras RLS protege las tablas de abajo. Cambiarlas a
 *   security_invoker cerraría la búsqueda a los visitantes.
 * · Las tablas de operación (payments, payouts, reviews, vehicles…)
 *   tienen RLS sin políticas: solo el rol de servicio y las funciones
 *   Edge las tocan. Es cerrado por diseño, no un olvido.
 * · `spatial_ref_sys` es una tabla de referencia de PostGIS, sin ningún
 *   dato nuestro; no somos sus dueños y activarle RLS puede romper
 *   PostGIS.
 * · Las extensiones quedaron en `public`. Moverlas es arriesgado y no
 *   cambia nada de seguridad real aquí.
 */
