-- =====================================================================
--  MIGRATION 0047 — La licencia de conducir tiene fecha de vencimiento
--
--  En Panamá la licencia se renueva cada pocos años y se vence SIN
--  avisar: no llega ninguna carta. Quien maneja con la licencia vencida
--  no está cubierto por su seguro, y eso no es un problema del
--  conductor solamente — es que el pasajero no tendría a quién
--  reclamar.
--
--  SÓLO LA FECHA. Ni foto, ni número: es la misma regla que la cédula
--  (R6) por la misma razón. De un documento hace falta el veredicto, y
--  una fecha no identifica a nadie. Que la columna sea `date` y no
--  `text` es parte de eso: en una fecha no cabe un número de licencia.
--
--  NULA POR DEFECTO, y no bloquea. Todo el mundo que publicó antes de
--  hoy la tiene nula, y tratarlos como vencidos sería inventarles un
--  problema. Se les pide; hasta entonces se les deja publicar.
--
--  La regla — treinta días de aviso, vencida no publica — vive en
--  `app/src/dominio/licencia.ts` con sus pruebas. Aquí sólo la columna
--  y lo que la base puede sostener sola.
-- =====================================================================

alter table profiles
  add column if not exists license_expires_on date;

comment on column profiles.license_expires_on is
  'Cuándo se vence la licencia de conducir. SÓLO la fecha: ni foto ni número (R6). Nula = todavía no la ha dicho, y eso no bloquea nada.';

-- Una fecha de vencimiento a cincuenta años vista es un dedo resbalado,
-- no una licencia. Y una de antes de que existiera el registro tampoco
-- se sostiene. El rango es amplio a propósito: esto ataja el error de
-- tecleo, no juzga la validez — eso lo hace `dominio/licencia`.
alter table profiles
  drop constraint if exists profiles_licencia_razonable;
alter table profiles
  add constraint profiles_licencia_razonable
  check (
    license_expires_on is null
    or (license_expires_on >= date '2000-01-01' and license_expires_on <= date '2100-01-01')
  );

-- Quien la tiene por vencer, para el barrido del día que haya cron. No
-- hay envío push todavía, así que el aviso se deriva al abrir la
-- bandeja (`dominio/avisar.ts`), igual que el recordatorio de salida.
create index if not exists idx_profiles_licencia_por_vencer
  on profiles (license_expires_on)
  where license_expires_on is not null;
