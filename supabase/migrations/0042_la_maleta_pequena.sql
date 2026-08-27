-- =====================================================================
--  MIGRACIÓN 0042 — La maleta pequeña, y las cantidades de verdad.
--
--  Pedido del dueño (27-08-2026): «option de choisir nombre de maleta ou
--  de sac (0 +1 +2 etc) et mettre aussi chiquita pequeña».
--
--  QUÉ HABÍA. `bookings.mochilas` y `bookings.maletas` existen desde la
--  0026 y ya eran enteros — cantidades. Pero desde el 25-08 la app sólo
--  escribía 0 o 1 en cada una, porque el modelo de entonces tenía tres
--  opciones sueltas: nada, un bolso, una maleta. Las columnas estaban
--  bien; era la app la que no las usaba.
--
--  QUÉ FALTA. El tamaño. «Una maleta» no distingue a quien lleva un
--  carry-on de quien lleva un baúl entero, y esa diferencia es justo la
--  que decide si cabe. No se puede meter en `maletas` sin mentir, ni en
--  `mochilas` sin fingir que una maleta va en el asiento. Nace columna.
--
--  LO QUE NO CAMBIA. **El equipaje no toca el precio** (R1, R3): el
--  aporte sale de la gasolina y los peajes divididos entre los ocupantes,
--  y ninguna pieza se cobra aparte. Aquí no hay ni una columna de dinero,
--  a propósito.
-- =====================================================================

alter table bookings
  add column if not exists maletas_pequenas integer not null default 0;

comment on column bookings.maletas_pequenas is
  'Maletas de cabina que lleva el pasajero (0042). Van al baúl igual que las grandes, ocupando menos.';

-- ─────────────────────────────────────────────────────────────────────
--  El tope, dicho por la base y no sólo por la pantalla.
--
--  Tres piezas por clase es equipaje de pasajero; más que eso es una
--  mudanza, y eso se habla por el chat antes de pedir puesto. Un cliente
--  que mande 40 no está pidiendo un puesto.
-- ─────────────────────────────────────────────────────────────────────

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'bookings_equipaje_razonable') then
    -- Se acota lo que ya está guardado antes de exigirlo: la 0026 no puso
    -- techo, así que una fila vieja podría no pasar y tumbar la migración.
    update bookings set mochilas = least(greatest(mochilas, 0), 3)
      where mochilas < 0 or mochilas > 3;
    update bookings set maletas = least(greatest(maletas, 0), 3)
      where maletas < 0 or maletas > 3;

    alter table bookings add constraint bookings_equipaje_razonable check (
      mochilas between 0 and 3
      and maletas between 0 and 3
      and maletas_pequenas between 0 and 3
    );
  end if;
end $$;
