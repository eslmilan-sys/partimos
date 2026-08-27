-- =====================================================================
--  MIGRACIÓN 0043 — Las ciudades que faltan.
--
--  Pedido del dueño (27-08-2026): «si ça ne trouve pas, il faut que le
--  client mette le nom + un bouton pour nous envoyer une notification
--  pour l'ajouter ; nous on cherche et on l'ajoute».
--
--  EL PROBLEMA. `cities` es un catálogo que escribimos nosotros. Quien
--  vive en un pueblo que no está no tiene ninguna salida: ni puede decir
--  de dónde sale, ni sabe si algún día podrá. Hoy se va y no vuelve, y
--  nosotros ni nos enteramos de que existía.
--
--  LO QUE SE HACE. Una bandeja: la persona escribe el nombre, la fila
--  queda aquí, y nosotros buscamos las coordenadas y la damos de alta en
--  `cities`. Es a propósito una PETICIÓN y no un alta automática — una
--  ciudad inventada rompe la búsqueda para todos, y `lugar.ts` ya decía
--  que una dirección no se inventa.
--
--  QUIÉN VE QUÉ. Cualquiera puede pedir, incluso sin cuenta: la persona
--  que más necesita esto es justo la que todavía no se ha registrado
--  porque la app no le servía. Pero **nadie lee la tabla desde el
--  cliente**: son nombres escritos a mano y no hay razón para que un
--  usuario vea lo que pidieron los demás. La leemos nosotros con la
--  llave de servicio.
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
--  Primero la función, porque el índice de más abajo la usa.
--
--  `unaccent` es una extensión que puede no estar instalada, y pedirla
--  aquí haría que la migración dependa de un permiso que no controlamos.
--  Esto hace lo justo para el castellano de Panamá, y es `immutable`,
--  que es lo que un índice necesita.
-- ─────────────────────────────────────────────────────────────────────

create or replace function unaccent_es(t text)
returns text language sql immutable strict as $$
  select translate(t, 'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
                      'aaaaaeeeeiiiiooooouuuuncAAAAAEEEEIIIIOOOOOUUUUNC')
$$;

-- ─────────────────────────────────────────────────────────────────────
--  La bandeja.
-- ─────────────────────────────────────────────────────────────────────

create table if not exists city_requests (
  id          uuid primary key default gen_random_uuid(),
  -- Nulo cuando la pide alguien sin cuenta. No es un error: es el caso.
  profile_id  uuid references profiles(id) on delete set null,
  nombre      text not null,
  provincia   text,
  -- Lo que hacemos con ella. `atendida_at` es el día que nació en `cities`.
  atendida_at timestamptz,
  city_id     uuid references cities(id) on delete set null,
  created_at  timestamptz not null default now(),

  constraint city_requests_nombre_razonable
    check (char_length(btrim(nombre)) between 2 and 80),
  constraint city_requests_provincia_razonable
    check (provincia is null or char_length(btrim(provincia)) <= 80)
);

comment on table city_requests is
  'Ciudades que la gente pide y todavía no están en `cities` (0043). Se leen con la llave de servicio, nunca desde el cliente.';

-- Para no leer la bandeja entera cada vez: primero lo que falta por atender.
create index if not exists idx_city_requests_pendientes
  on city_requests (created_at desc) where atendida_at is null;

-- La misma ciudad pedida cien veces es una fila, no cien. Sin acentos ni
-- mayúsculas: «Chitre» y «Chitré» son la misma petición.
create unique index if not exists uq_city_requests_nombre
  on city_requests (lower(unaccent_es(btrim(nombre))))
  where atendida_at is null;

-- ─────────────────────────────────────────────────────────────────────
--  Quién puede qué.
-- ─────────────────────────────────────────────────────────────────────

alter table city_requests enable row level security;

grant insert on city_requests to anon, authenticated;
-- Sin `select`: nadie lee la bandeja desde el cliente, ni la suya propia.
-- Sin `update` ni `delete`: una petición no se edita, se atiende.

drop policy if exists city_requests_cualquiera_pide on city_requests;
create policy city_requests_cualquiera_pide on city_requests
  for insert with check (
    -- O la firmas con tu propio nombre, o la mandas sin nombre. Lo que no
    -- se puede es pedirla a nombre de otra persona.
    profile_id is null or profile_id = auth.uid()
  );
