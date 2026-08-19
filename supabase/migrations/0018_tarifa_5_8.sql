-- 0018 — LA TARIFA SUBE A 5 % (YAPPY) Y 8 % (TARJETA)
--
-- Decisión del dueño. La regla de fondo no cambia: la tarifa es FIJA POR
-- CANAL y sigue el costo del canal, nunca la demanda (R2). El conductor
-- sigue recibiendo su aporte completo, y el efectivo sigue costando cero.
--
-- Esta restricción es la autoridad: si el front cobrara otra cosa, la
-- base rechazaría la reserva. Por eso se cambia aquí y en
-- `src/lib/pricing.ts` en el mismo movimiento — nunca en uno solo.

alter table bookings
  drop constraint if exists fee_is_fixed_pct;

alter table bookings
  add constraint fee_is_fixed_pct check (
    case payment_channel
      when 'external'  then service_fee_cents = 0
      when 'yappy_app' then service_fee_cents = round(total_cents * 0.05)
      when 'card'      then service_fee_cents = round(total_cents * 0.08)
    end
  );

comment on column bookings.payment_channel is
  'external = efectivo/Yappy directo al conductor (gratis). yappy_app = Botón de Pago Yappy, tarifa 5 %. card = pasarela certificada, tarifa 8 %. La tarifa la paga el pasajero; el conductor recibe su aporte completo en los tres casos.';
