-- El tablero D del traspaso —cancelar, reembolsar, reportar— no podía escribir
-- nada: `cancellations`, `refunds` e `incidents` tienen RLS encendida y cero
-- políticas, que significa cerrado a todo el mundo. Medido. Es el mismo agujero
-- que tenía `payments` antes de la 0024.
--
-- La regla es la misma que en toda la app: una reserva tiene dos partes —quien
-- pide el puesto y quien maneja— y nadie más ve ni escribe lo suyo.

-- ── Una sola definición de «ser parte» ──────────────────────────────────────
-- La 0024 la llamó `es_parte_del_pago`, pero el nombre se queda corto en cuanto
-- lo usan también las cancelaciones. Misma lógica, nombre honesto, y las
-- políticas de pagos se rehacen encima para que no queden dos copias.
CREATE OR REPLACE FUNCTION es_parte_de_la_reserva(la_reserva uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM bookings b
    JOIN trips t ON t.id = b.trip_id
    WHERE b.id = la_reserva
      AND (b.passenger_id = auth.uid() OR t.driver_id = auth.uid())
  );
$$;

DROP POLICY IF EXISTS payments_parties_read   ON payments;
DROP POLICY IF EXISTS payments_parties_insert ON payments;
DROP POLICY IF EXISTS payments_parties_update ON payments;
DROP FUNCTION IF EXISTS es_parte_del_pago(uuid);

CREATE POLICY payments_parties_read ON payments
  FOR SELECT USING (es_parte_de_la_reserva(booking_id));
CREATE POLICY payments_parties_insert ON payments
  FOR INSERT WITH CHECK (es_parte_de_la_reserva(booking_id));
CREATE POLICY payments_parties_update ON payments
  FOR UPDATE USING (es_parte_de_la_reserva(booking_id))
  WITH CHECK (es_parte_de_la_reserva(booking_id));

-- ── Cancelar ────────────────────────────────────────────────────────────────
-- Cancelan las dos partes: el pasajero suelta el puesto, el conductor deshace
-- el viaje. Quién fue queda en `cancelled_by` y `actor_id`, y `actor_id` tiene
-- que ser quien firma: sin eso, una parte podría cancelar en nombre de la otra.
CREATE POLICY cancellations_parties_read ON cancellations
  FOR SELECT USING (es_parte_de_la_reserva(booking_id));

CREATE POLICY cancellations_parties_insert ON cancellations
  FOR INSERT WITH CHECK (
    es_parte_de_la_reserva(booking_id) AND (actor_id IS NULL OR actor_id = auth.uid())
  );

-- ── Reembolsar ──────────────────────────────────────────────────────────────
-- El reembolso cuelga de la cancelación, así que las partes son las mismas.
-- No se puede modificar desde el cliente: el estado —pendiente, emitido— lo
-- mueve el proceso de pagos, no quien lo pidió.
CREATE POLICY refunds_parties_read ON refunds
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM cancellations c
            WHERE c.id = refunds.cancellation_id
              AND es_parte_de_la_reserva(c.booking_id))
  );

CREATE POLICY refunds_parties_insert ON refunds
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM cancellations c
            WHERE c.id = refunds.cancellation_id
              AND es_parte_de_la_reserva(c.booking_id))
  );

-- ── Reportar ────────────────────────────────────────────────────────────────
-- **Un reporte lo lee quien lo escribió, y nadie más.** No la persona
-- reportada: enseñarle quién lo denunció, y que además siguen compartiendo un
-- viaje, es exactamente lo que hace que nadie reporte. Por eso este es el único
-- caso donde las dos partes NO ven lo mismo.
--
-- Quien tiene que leerlo es soporte, y soporte no entra por aquí: entra con
-- `service_role`, que se salta RLS por definición.
CREATE POLICY incidents_reporter_read ON incidents
  FOR SELECT USING (reporter_id = auth.uid());

CREATE POLICY incidents_reporter_insert ON incidents
  FOR INSERT WITH CHECK (
    reporter_id = auth.uid() AND es_parte_de_la_reserva(booking_id)
  );
