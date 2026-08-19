-- Los pagos no tenían ninguna política, y con RLS encendida eso no significa
-- «abierto»: significa cerrado a todo el mundo. Medido: `payments` tiene
-- rowsecurity = true y cero políticas, así que la inserción que hace
-- `aceptarSolicitud` —el conductor acepta a alguien— fallaba siempre contra la
-- base de verdad. El recorrido del conductor se cortaba justo ahí.
--
-- Un pago tiene exactamente dos partes: quien pide el puesto y quien maneja.
-- Nadie más lo ve, nadie más lo escribe. La condición se lee de la reserva, que
-- es donde vive la relación; no se duplica el pasajero ni el conductor en
-- `payments` solo para poder comprobarlo.
--
-- **La plataforma no cobra** (regla 2 de PRODUCT.md). Esta fila no es un cobro:
-- es la anotación de que el aporte quedó comprometido, y el dinero pasa de mano
-- a mano. Que exista la tabla no la convierte en una pasarela.

-- Las dos partes de la reserva a la que pertenece el pago.
CREATE OR REPLACE FUNCTION es_parte_del_pago(la_reserva uuid)
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

-- Leer: las dos partes.
CREATE POLICY payments_parties_read ON payments
  FOR SELECT USING (es_parte_del_pago(booking_id));

-- Escribir: las dos partes. El conductor la crea al aceptar; el pasajero la
-- necesita cuando paga en efectivo y se anota al subir.
CREATE POLICY payments_parties_insert ON payments
  FOR INSERT WITH CHECK (es_parte_del_pago(booking_id));

-- Cambiar de estado —retenido a liberado— también son las dos partes: el
-- conductor al cerrar el viaje, el pasajero al confirmar la llegada.
CREATE POLICY payments_parties_update ON payments
  FOR UPDATE USING (es_parte_del_pago(booking_id))
  WITH CHECK (es_parte_del_pago(booking_id));
