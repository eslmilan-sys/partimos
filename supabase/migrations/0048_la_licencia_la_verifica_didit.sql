-- =====================================================================
--  MIGRATION 0048 — La licencia la verifica Didit, no el conductor
--
--  La 0047 puso `profiles.license_expires_on`: una fecha que el
--  conductor tecleaba. **Se retira**, confirmado por el propietario el
--  28-08-2026: la licencia pasa por Didit, como la cédula.
--
--  La razón no es de gusto. En cuanto esa fecha DECIDE algo —y decide si
--  puedes publicar—, una fecha que uno mismo se pone deja de ser una
--  prueba: quien la tiene vencida escribe 2035 y sigue publicando. Un
--  control que el controlado rellena no controla nada.
--
--  Dónde vive ahora: en `identity_verifications`, con
--  `document_type = 'DL'` y la fecha en `expires_at` — columnas que ya
--  existían desde la 0001, y un camino que `didit-start` ya sabe pedir
--  (`kind: 'licencia'` → `DL`). No hace falta tabla nueva.
--
--  DOS COLUMNAS PARA LO MISMO ES EL ERROR QUE MÁS VECES HEMOS
--  CORREGIDO en este proyecto, así que la de la 0047 se va entera en vez
--  de quedarse «por si acaso». La 0047 vivió unas horas y ninguna fila
--  de producción llegó a escribirse.
--
--  R6 sigue en pie: del documento vuelven el veredicto y UNA FECHA. Ni
--  la imagen, ni el número, ni el nombre. Una fecha no identifica a
--  nadie, y sin ella la regla de la licencia no puede existir — es la
--  única cosa que se añade a lo que R6 permitía, y se añade a sabiendas.
-- =====================================================================

alter table profiles
  drop constraint if exists profiles_licencia_razonable;

drop index if exists idx_profiles_licencia_por_vencer;

alter table profiles
  drop column if exists license_expires_on;

-- Buscar la verificación de UN documento de UNA persona es lo que hacen
-- ahora `estadoDeCedula` y `licenciaDe`, y hasta hoy era un barrido.
create index if not exists idx_verificaciones_por_documento
  on identity_verifications (profile_id, document_type, updated_at desc);

comment on column identity_verifications.expires_at is
  'Cuándo se vence el documento, según el proveedor. Para la licencia (document_type = DL) es lo que decide si se puede seguir publicando. Sólo la fecha: ni imagen ni número (R6).';
