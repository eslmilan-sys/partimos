/**
 * Textes de l'interface et mentions légales.
 *
 * Ils vivent dans le dépôt, jamais dans un CMS externe (§10 du brief) : le
 * produit doit rendre même si un service tiers tombe, et une mention légale
 * qui disparaît parce qu'une API ne répond pas est un risque juridique.
 *
 * Registre : espagnol du Panama, tutoiement. « carro » et non « coche »,
 * « puesto » et non « asiento ». Jamais « gana dinero », « ingresos » ni
 * « ganancias » (R5) — on écrit « recuperas », « aporte », « compartir gastos ».
 */

export const LEGAL_FOOTER =
  "Partimos es una plataforma de contacto entre particulares que comparten " +
  "los gastos de un viaje que el conductor ya iba a realizar. No presta " +
  "servicios de transporte, no emplea conductores y no fija precios de " +
  "pasaje. El aporte por puesto está limitado al reparto del costo real del " +
  "recorrido entre todos los ocupantes del vehículo, incluido el conductor, " +
  "y le llega completo al conductor. Si el pasajero elige pagar en línea, " +
  "Partimos cobra una tarifa de servicio fija por la reserva protegida — " +
  "un servicio digital opcional, nunca un cobro por el transporte: pagar " +
  "directo al conductor, sin tarifa, está siempre disponible.";

/** Affiché à côté du montant, sur l'écran de réservation. */
export function bookingDisclaimer(driverName: string) {
  return `${driverName} no gana plata con este viaje. El monto cubre gasolina y peajes, y la app lo limita para que así sea.`;
}

export type Faq = { q: string; a: string };

export const GENERAL_FAQ: Faq[] = [
  {
    q: "¿Cómo y cuándo pago?",
    a: "Como prefieras, en este orden: Yappy en la app (recomendado, tarifa de servicio del 5%), tarjeta en la app (tarifa del 8%, por una pasarela certificada) o efectivo en la mano el día del viaje, sin tarifa. La tarifa paga la reserva protegida — comprobante, soporte y reembolso según las reglas de cancelación. En los tres casos el conductor recibe su aporte completo.",
  },
  {
    q: "¿Cómo hablo con el conductor?",
    a: "Por el chat de tu reserva, que se abre apenas confirmas. Antes no existe, para que los conductores no reciban mensajes de gente que al final no viaja. Nadie da su celular: ahí coordinas el punto exacto de recogida y cómo le vas a pagar, y lo que acuerden queda escrito — un mensaje no se edita ni se borra, de los dos lados.",
  },
  {
    q: "¿El conductor gana dinero conmigo?",
    a: "No. El aporte cubre gasolina, peajes y desgaste, y se divide entre todos los ocupantes del carro, incluido el conductor. La plataforma calcula un tope que no se puede pasar, así que aunque lleve el carro lleno siempre termina poniendo parte del viaje de su bolsillo.",
  },
  {
    q: "¿Dónde me recogen exactamente?",
    a: "Cada conductor marca de dos a cuatro puntos por donde ya va a pasar: por donde vive, una salida de la ciudad, una estación en la carretera. Escoges el que te quede mejor. Si ninguno te sirve, puedes proponer el tuyo y el conductor te dice si le queda de paso.",
  },
  {
    q: "¿Y si nadie va a mi destino?",
    a: "Guardamos tu búsqueda y le avisamos a los conductores que hacen esa ruta que hay gente esperando. Te escribimos apenas alguien publique.",
  },
  {
    q: "¿Puedo cancelar?",
    a: "Sí, desde la app y sin costo, porque no hay dinero de por medio hasta el día del viaje. Te pedimos avisar cuanto antes: del otro lado hay una persona contando contigo.",
  },
];

export const HELP_FAQ: Faq[] = [
  ...GENERAL_FAQ,
  {
    q: "¿Qué pasa si el conductor cancela?",
    a: "No pierdes nada: como el pago es directo y el día del viaje, no hay plata retenida que reclamar. Te avisamos de una vez y te mostramos los demás viajes del mismo corredor. Un conductor que cancela tarde tres veces en 90 días deja de poder publicar.",
  },
  {
    q: "¿Puedo pedir que me recojan en mi casa?",
    a: "Puedes proponer tu punto y el conductor decide. No se cobra un extra por eso: lo que cambia es la distancia del recorrido, y ese kilometraje adicional lo asume quien lo pidió. Si el desvío pasa de 15 % de kilómetros o de 15 minutos, el sistema no lo permite.",
  },
  {
    q: "¿Cuántas paradas puede tener un viaje?",
    a: "Cuatro como máximo, y ninguna en una terminal de buses. La idea es que el conductor recoja por donde ya iba a pasar, no que dé vueltas por la ciudad.",
  },
  {
    q: "¿Cuánto cuesta usar Partimos?",
    a: "El conductor recibe su aporte completo, siempre. Si el pasajero elige pagar dentro de la app, se le suma una tarifa de servicio fija por canal — la ves en pantalla antes de confirmar, sumada al total. Es fija porque sigue el costo del canal, nunca la demanda. Pagar en efectivo, directo al conductor, no cuesta nada y siempre está disponible.",
  },
  {
    q: "¿Guardan mi cédula?",
    a: "No. La verificación la hace un proveedor certificado y nosotros solo guardamos el resultado y la referencia del expediente. Nunca la imagen ni el número del documento.",
  },
];
