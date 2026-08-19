import type { Metadata } from "next";
import { LegalPage, PendingLegalReview } from "@/components/site/LegalPage";
import { LEGAL_FOOTER } from "@/lib/content";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Términos de uso",
  description:
    "Condiciones de uso de Partimos: qué es la plataforma, qué no es, cómo se calcula el aporte por puesto y qué responsabilidades tiene cada parte.",
  alternates: { canonical: canonical("/terminos") },
  robots: { index: true, follow: true },
};

export default function TerminosPage() {
  return (
    <LegalPage
      title="Términos de uso"
      updatedAt="agosto 2026"
      intro="Qué es Partimos, qué no es, y qué se espera de cada persona que la usa."
    >
      <PendingLegalReview />

      <h2>1. Qué es Partimos</h2>
      <p>{LEGAL_FOOTER}</p>
      <p>
        Partimos pone en contacto a un conductor particular que ya iba a hacer
        un recorrido con pasajeros que quieren hacer ese mismo recorrido y
        compartir los gastos. La relación de viaje se da entre esas personas.
        Partimos no es parte de ella.
      </p>

      <h2>2. Qué no es</h2>
      <ul>
        <li>
          No es una empresa de transporte ni un servicio de taxi o de
          ride-hailing.
        </li>
        <li>No emplea, contrata ni dirige a los conductores.</li>
        <li>No asigna viajes, no impone rutas y no fija horarios.</li>
        <li>
          No cobra nada al conductor: su aporte le llega completo, siempre.
        </li>
      </ul>

      <h2>2 bis. El pago — tres vías, a elección del pasajero</h2>
      <p>
        <b>Yappy en la app (tarifa de servicio del 5%).</b> El pasajero
        paga por la plataforma mediante el Botón de Pago Yappy. Es la vía
        recomendada y la de tarifa más baja.
      </p>
      <p>
        <b>Tarjeta en la app (tarifa de servicio del 8%).</b> El pasajero
        paga por la plataforma con tarjeta, a través de una pasarela
        certificada; los datos de la tarjeta nunca pasan por los servidores
        de Partimos.
      </p>
      <p>
        <b>Efectivo (sin tarifa).</b> El pasajero le paga directamente al
        conductor el día del viaje, en efectivo o por Yappy a su número.
        Partimos no interviene en esa transacción y esta vía permanece
        siempre disponible y gratuita.
      </p>
      <p>
        La tarifa de servicio remunera el servicio digital de reserva —
        cobro protegido, comprobante, soporte y reembolsos según las reglas
        de cancelación — y se cobra únicamente al pasajero que elige pagar
        en la app. Es fija por canal: refleja el costo de procesar cada
        medio de pago y nunca varía con la demanda, la fecha ni la
        disponibilidad de puestos. Nunca se descuenta del aporte del
        conductor y no constituye un cobro por el transporte. El aporte
        cobrado por la plataforma se transfiere íntegro al conductor.
      </p>

      <h2>3. El aporte por puesto</h2>
      <p>
        El monto que un pasajero aporta está limitado por la plataforma. El tope
        se calcula repartiendo el costo real del recorrido —distancia por un
        costo kilométrico de referencia, más peajes, más un margen del 10 % por
        los desvíos de recogida— entre todos los ocupantes del vehículo,
        incluido el conductor.
      </p>
      <p>
        Como el conductor cuenta como ocupante, nunca recupera el total de lo
        que gastó: siempre pone una parte del viaje. Un conductor puede pedir
        menos que el tope; no puede pedir más, y la plataforma no permite
        registrar un viaje que lo supere.
      </p>
      <p>
        El aporte no varía según la demanda, la fecha ni la disponibilidad de
        puestos. Sigue el costo del recorrido, nunca el mercado.
      </p>

      <h2>4. El pago</h2>
      <p>
        El pago del aporte se hace por la vía que el pasajero elige entre las
        tres de la cláusula 2 bis. Cuando paga en la app, Partimos procesa el
        cobro a través de proveedores certificados y transfiere el aporte
        íntegro al conductor; los datos de tarjeta viven en la pasarela,
        nunca en Partimos. Cuando paga en efectivo, la transacción ocurre
        entre el pasajero y el conductor y Partimos no interviene. Reservar
        no cuesta nada: la tarifa de servicio solo existe si el pasajero
        elige el cobro en la app, y se muestra antes de confirmar.
      </p>

      <h2>5. Obligaciones del conductor</h2>
      <ul>
        <li>
          Ser el titular o el usuario autorizado del vehículo, con licencia
          vigente y el seguro que exija la ley panameña.
        </li>
        <li>
          Verificar con su aseguradora que su póliza cubre el transporte de
          personas que comparten los gastos del viaje.
        </li>
        <li>Publicar únicamente viajes que efectivamente va a realizar.</li>
        <li>
          Respetar la ruta, la hora y los puntos de recogida anunciados, y
          avisar cuanto antes si algo cambia.
        </li>
      </ul>

      <h2>6. Obligaciones del pasajero</h2>
      <ul>
        <li>Presentarse a la hora y en el punto acordados.</li>
        <li>Aportar el monto acordado al conductor el día del viaje.</li>
        <li>Avisar con la mayor anticipación posible si ya no va a viajar.</li>
      </ul>

      <h2>7. Cancelaciones</h2>
      <p>
        Como no hay dinero retenido por la plataforma, cancelar no tiene costo
        económico. Sí tiene consecuencias de reputación: las cancelaciones
        quedan registradas en el perfil. Un conductor que cancela con menos de
        seis horas de anticipación tres veces en 90 días deja de poder publicar
        viajes. La plataforma nunca cobra una penalidad económica a un
        conductor.
      </p>

      <h2>8. Verificación de identidad</h2>
      <p>
        La verificación la realiza un proveedor externo certificado. Partimos
        conserva únicamente el resultado de la verificación y la referencia del
        expediente. No almacena imágenes del documento de identidad ni el número
        de cédula.
      </p>

      <h2>9. Suspensión de cuentas</h2>
      <p>
        Partimos puede suspender una cuenta que incumpla estos términos, que
        utilice la plataforma con fines comerciales o que ponga en riesgo a
        otras personas.
      </p>

      <h2>10. Límite de responsabilidad</h2>
      <p>
        Partimos no responde por lo que ocurra durante un viaje acordado entre
        particulares, incluidos accidentes, retrasos, pérdidas o desacuerdos
        sobre el aporte. Cada conductor responde por su vehículo, su conducción
        y su cobertura de seguro.
      </p>

      <h2>11. Ley aplicable</h2>
      <p>Estos términos se rigen por las leyes de la República de Panamá.</p>
    </LegalPage>
  );
}
