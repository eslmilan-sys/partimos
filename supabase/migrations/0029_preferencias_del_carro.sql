-- =====================================================================
--  0029 · Si se fuma y si van mascotas
-- =====================================================================
--
--  Las dos preferencias que se preguntan siempre antes de subirse a un carro
--  ajeno, y que no eran una columna.
--
--  No son un filtro de personas —eso es `gender_preference`, que ya existe y
--  tiene su propia razón—: son una condición del carro, del mismo orden que
--  «acepta maletas». Por eso viven en `trips` y no en `profiles`: el mismo
--  conductor puede llevar al perro un sábado y no llevarlo el lunes.
--
--  Por defecto NO se fuma y NO van mascotas, que es lo normal y lo que la
--  gente espera si nadie dijo nada. Las filas que ya existen quedan válidas
--  sin tocarlas.

alter table trips add column if not exists allows_pets boolean not null default false;
alter table trips add column if not exists allows_smoking boolean not null default false;

comment on column trips.allows_pets is
  'El conductor acepta que subas con tu mascota. Condición del carro, no del pasajero.';
comment on column trips.allows_smoking is
  'Se puede fumar en el carro. Por defecto no, que es lo que se espera si nadie lo dijo.';
