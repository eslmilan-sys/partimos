-- =====================================================================
--  MIGRATION 0046 — La nota deja de ser un promedio a secas
--
--  Hasta hoy `driver_ratings` hacía AVG(rating) de todo lo que hubiera,
--  sin mínimo y sin ventana. En un mercado donde alguien lleva tres
--  viajes y no trescientos, eso tiene cuatro defectos:
--
--    1. Una nota mala arruina a quien empieza. Con dos reseñas un 1 te
--       lleva de 5,0 a 3,0; con cuarenta es ruido. El mismo hecho con
--       consecuencias opuestas según cuánto lleves.
--    2. Un 5,0 de una reseña se lee igual que un 5,0 de cuarenta.
--    3. No olvida nunca.
--    4. Todo el mundo acaba entre 4,8 y 5,0 y el número deja de decir
--       nada.
--
--  LA FÓRMULA, la misma que `app/src/dominio/notas.ts`:
--
--      nota = (PESO × MEDIA + Σ notas) / (PESO + n)
--
--  Es el promedio encogido hacia la media de la plataforma — se empieza
--  con cinco reseñas imaginarias en la media y las de verdad las van
--  desplazando. Y sólo cuentan las últimas cincuenta, que es lo que
--  deja a alguien recuperarse sin inventar decaimientos que nadie
--  sabría explicar.
--
--  DEBAJO DE TRES RESEÑAS LA NOTA ES NULA, a propósito: es el
--  invariante 7 del sistema —una afirmación lleva su razón— llevado
--  hasta el final. «4,9» de una reseña es una cifra sin sujeto. La app
--  enseña entonces cuántos viajes lleva, que sí se sabe.
--
--  LA MEDIA (4,6) ES UNA CONSTANTE MIENTRAS NO HAYA DATOS. Cuando haya
--  unas cientas de reseñas se mide y se cambia aquí y en `notas.ts` a
--  la vez. No se calcula al vuelo: un prior que se mueve solo haría que
--  la nota de alguien cambiara sin que esa persona hiciera nada.
--
--  NO hay eje de precio, y sigue sin haberlo (0007): el tope es la
--  regla de la plataforma, no un mérito de quien maneja. Puntuarlo
--  devolvería la presión tarifaria por la puerta de atrás (R3).
--
--  La vista se llamaba `driver_ratings` y ya no dice la verdad: la
--  misma fórmula califica a quien maneja y a quien viaja, porque aquí
--  no hay un proveedor y un cliente, hay dos personas repartiendo un
--  costo. Nace `ratings` y `driver_ratings` queda como alias para no
--  romper nada que la lea.
-- =====================================================================

create or replace function nota_encogida(suma numeric, cuantas bigint)
returns numeric
language sql
immutable
as $$
  -- 5 reseñas imaginarias en 4,6; nula debajo de 3 reseñas de verdad.
  select case
           when cuantas < 3 then null
           else round((5 * 4.6 + suma) / (5 + cuantas), 1)
         end;
$$;

comment on function nota_encogida is
  'La fórmula de la nota. Espejo exacto de app/src/dominio/notas.ts — si cambia una, cambia la otra.';

create or replace view ratings as
with ultimas as (
  -- Sólo las cincuenta más nuevas de cada persona: la ventana.
  select subject_id, rating, puntualidad, manejo, trato, carro, encuentro
  from (
    select r.*,
           row_number() over (partition by subject_id order by created_at desc) as n
    from reviews r
    where r.rating is not null
  ) x
  where n <= 50
)
select subject_id                                  as profile_id,
       nota_encogida(sum(rating), count(*))        as nota,
       count(*)                                    as cuantas,
       -- El promedio CRUDO, que no es la nota: es lo que dijo la gente.
       -- Sirve para explicar por qué la nota es la que es, y para nada más.
       round(avg(rating)::numeric, 2)              as avg_crudo,
       round(avg(puntualidad)::numeric, 2)         as avg_puntualidad,
       round(avg(manejo)::numeric, 2)              as avg_manejo,
       round(avg(trato)::numeric, 2)               as avg_trato,
       round(avg(carro)::numeric, 2)               as avg_carro,
       round(avg(encuentro)::numeric, 2)           as avg_encuentro
from ultimas
group by subject_id;

comment on view ratings is
  'La nota de cada persona, encogida hacia la media y nula debajo de tres reseñas. Misma fórmula para quien maneja y quien viaja.';

-- `driver_ratings` se queda como alias: lo que ya la lea sigue leyendo,
-- con `avg_rating` apuntando ahora a la NOTA y no al promedio crudo —
-- que es lo que quien la leía quería decir.
create or replace view driver_ratings as
select profile_id,
       nota          as avg_rating,
       cuantas       as reviews_count,
       avg_puntualidad,
       avg_manejo,
       avg_trato,
       avg_carro,
       avg_encuentro
from ratings;

comment on view driver_ratings is
  'Alias histórico de `ratings`. Nombre engañoso: la misma fórmula vale para pasajeros. Usar `ratings`.';
