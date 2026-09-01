-- ─────────────────────────────────────────────────────────────────────
--  0049 · La tercera fila
--
--  Pedido del dueño el 01-09-2026: «si il met un grand voiture de plus
--  de place arrière doit avoir l'option d'avoir plus de place».
--
--  El catálogo ya sabía que un Rush o un Outlander ofrecen seis puestos
--  (siete plazas menos el volante), pero la 0045 dejó escrito
--  `seats_back between 0 and 3` — un solo banco. Quien registraba una
--  van de siete no podía ofrecer su tercera fila: la app se lo permitía
--  a medias y la base lo habría rechazado.
--
--  `seats_back` sigue siendo UNA cifra, la suma de las filas de atrás.
--  No se parte en dos columnas porque nadie pregunta por la tercera
--  fila: quien reserva pide un puesto atrás. El dibujo de `5c` reparte
--  la cifra en bancos de tres, que es como se sienta la gente.
--
--  El techo nuevo es SEIS: dos bancos llenos. `seats_offered` ya
--  admitía hasta 7 desde la 0001, así que no hay que tocarlo, y
--  `vehicles.seats_total` ya llegaba a 8.
-- ─────────────────────────────────────────────────────────────────────

alter table trips drop constraint if exists trips_puestos_cuadran;

alter table trips add constraint trips_puestos_cuadran check (
  -- O no se dice nada, o se dice entero y suma lo que se ofrece.
  (seats_front is null and seats_back is null)
  or (
    seats_front between 0 and 1
    and seats_back between 0 and 6
    and seats_front + seats_back = seats_offered
  )
);

comment on column trips.seats_back is
  'Puestos ofrecidos atrás, sumando las dos filas (0045, ampliado en 0049).
   Con 2 el viaje anuncia «máx. 2 personas atrás»; por encima de 3 hay dos
   bancos y no se promete nada.';
