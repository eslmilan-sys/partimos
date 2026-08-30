/**
 * Ayuda y cómo se paga — pantallas `15b` (¿qué pasó?), `16b` (cómo se paga) y
 * `16c` (el comprobante).
 *
 * `15b` empieza por **tu viaje**, no por un buscador: quien abre la ayuda
 * viene de algo concreto. Después, las cuatro cosas que de verdad salen mal, y
 * sólo al final las preguntas de siempre.
 *
 * El comprobante de `16c` **no es una factura**: Partimos no vende un
 * transporte, sólo reparte el costo. Eso va escrito en la pantalla, no en la
 * letra pequeña.
 */

import { NOMBRE_DEL_CANAL, TARIFA_PCT, tarifaDeServicio } from '@/dominio/tarifas';
import { deFilas, resumenCorto } from '@/dominio/equipaje';

import { fuente } from './_fuente';
import { formatearDineroRedondo } from '@/ui/dinero';
import { ciudadDestino, rutaCorta } from './viajes';

const demora = <T,>(valor: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(valor), ms));

/* -------------------------------------------------------------- Ayuda */

export type ViajeDeAyuda = {
  reservaId: string;
  /** De qué viaje, para las filas que llevan a `16b` «Cómo se paga». */
  viajeId: string;
  destino: string;
  cuando: string;
  linea: string;
  conductor: string;
};

/** El viaje del que se viene hablando, arriba del todo. */
export async function viajeDeAyuda(reservaId: string): Promise<ViajeDeAyuda | null> {
  const reserva = fuente.reservas.find((r) => r.id === reservaId);
  if (!reserva) return demora(null);
  const viaje = fuente.viajes.find((v) => v.id === reserva.trip_id);
  const conductor = fuente.perfiles.find((p) => p.id === viaje?.driver_id);
  const nombre = conductor ? `${conductor.first_name} ${conductor.last_initial ?? ''}`.trim() : '';
  const aporte = reserva.unit_price_cents * reserva.seats;

  return demora({
    reservaId,
    viajeId: reserva.trip_id,
    destino: viaje ? ciudadDestino(viaje) : '',
    cuando: viaje?.departure_at ?? '',
    linea: `${formatearDineroRedondo(aporte)} · ${NOMBRE_DEL_CANAL[reserva.payment_channel]} · ${nombre}`,
    conductor: nombre,
  });
}

export type CosaQueSaleMal = {
  clave: string;
  titulo: string;
  /** La pastilla de la derecha: qué pasa si lo tocas. */
  respuesta: string;
  ruta: string;
};

/** Las cuatro cosas que de verdad salen mal, en orden de urgencia real. */
export const LO_QUE_SALE_MAL: CosaQueSaleMal[] = [
  { clave: 'nollego', titulo: 'No llegó a recogerme', respuesta: 'Reembolso', ruta: '/(ayuda)/reembolso' },
  { clave: 'cobro', titulo: 'Me cobraron mal', respuesta: 'Revisamos', ruta: '/(ayuda)/reembolso' },
  { clave: 'cancelar', titulo: 'Quiero cancelar', respuesta: 'Ahora', ruta: '/(ayuda)/cancelar' },
  { clave: 'incidente', titulo: 'Algo pasó en el viaje', respuesta: 'Urgente', ruta: '/(ayuda)/reportar' },
];

export const PREGUNTAS: { titulo: string; ruta: string }[] = [
  { titulo: 'Cómo se aporta y qué es la tarifa', ruta: '/(ayuda)/pagos' },
  { titulo: 'Cuándo se libera el aporte', ruta: '/(ayuda)/pagos' },
  /* **IBA A `reportar`**, que es el formulario de denunciar un incidente: la
     fila prometía explicar la seguridad y abría un parte de daños. La
     pantalla que explica la seguridad es `seguridad` (29-08-2026). */
  { titulo: 'Cómo te cuidamos', ruta: '/(ayuda)/seguridad' },
];

/**
 * CÓMO SE HACE — lo que la ayuda no tenía.
 *
 * La pantalla de ayuda se llamaba «¿Qué pasó?» y era entera un parte de
 * incidencias: cuatro cosas que salen mal y tres enlaces. Pero desde el
 * perfil la fila se llama «Ayuda y contacto», y quien la toca la mitad de las
 * veces no viene de un problema — viene de no saber hacer algo. No había ni
 * una línea que lo explicara (29-08-2026, pedido del dueño).
 *
 * Cada una responde a UNA pregunta, en el orden en que aparecen en la vida de
 * quien usa la app, y en su voz. Nada de «el sistema permite»: se dice qué
 * tocas y qué pasa.
 */
export type ComoSeHace = { titulo: string; texto: string };

export const COMO_SE_HACE: ComoSeHace[] = [
  {
    titulo: 'Pedir un puesto',
    texto:
      'Busca a dónde vas, abre el viaje que te sirva y toca «Pedir mi puesto». Eliges dónde te recogen y qué equipaje llevas, y el conductor decide. Hasta que acepte no se cobra nada.',
  },
  {
    titulo: 'El código de subir',
    texto:
      'Cuando te aceptan, tu puesto lleva un código de cuatro cifras. Se lo dices al conductor al subir y él lo teclea: eso es lo que prueba que el viaje pasó. Lo tienes en Viajes, en la ficha de tu puesto.',
  },
  {
    titulo: 'Acordar dónde te recogen',
    texto:
      'El punto exacto no lo pone la app: lo acuerdas con el conductor por el chat, y ahí queda escrito con la hora. Si algo cambia —una calle cerrada, un retraso— díselo por el mismo chat.',
  },
  {
    titulo: 'Cancelar tu puesto',
    texto:
      'Desde la ficha del viaje, mientras no hayas subido y no haya salido. Si el conductor ya había aceptado, cuéntaselo por el chat: el carro sale igual y alguien más puede ocupar tu sitio.',
  },
  {
    titulo: 'Publicar un viaje',
    texto:
      'Con el «+» de la barra de abajo. Te pregunta de dónde a dónde, por dónde pasas, qué día y a qué hora, con qué carro y cuántos puestos, y cuánto aporta cada quien. Nada se publica hasta el último paso.',
  },
  {
    titulo: 'Verificar tu cédula',
    texto:
      'Hace falta para publicar, no para viajar. Se hace una vez, desde tu perfil, con un proveedor certificado: documento y selfie. Nosotros recibimos si pasó o no, y nada más.',
  },
  {
    titulo: 'Calificar y que te califiquen',
    texto:
      'Al terminar el viaje, cada quien califica al otro. Las notas sólo se enseñan a partir de la tercera, para que una mala tarde no marque a nadie de por vida.',
  },
];

/**
 * EL CORREO. Va al final de la ayuda y al final de «Cómo te cuidamos».
 *
 * Escrito en un solo sitio a propósito: el día que cambie, cambia aquí.
 * **Este buzón hay que crearlo**; hasta entonces la app promete algo que no
 * existe.
 */
export const CORREO = 'hola@partimos.app';

export const HORARIO = 'Respondemos de 7 a 21';
export const PROMESA = 'Contestamos en menos de 2 h dentro del horario.';

/* -------------------------------------------------------- Cómo se paga */

export type ComoSePaga = {
  aporteCentavos: number;
  tarifaPct: number;
  topeCentavos: number;
  porque: string;
  reloj: { titulo: string; texto: string }[];
  letraChica: string;
};

/** Los tres números y el reloj del dinero. Sin letra pequeña. */
export async function comoSePaga(viajeId?: string): Promise<ComoSePaga> {
  const viaje = fuente.viajes.find((v) => v.id === viajeId) ?? fuente.viajes[0];

  return demora({
    aporteCentavos: viaje.price_cents,
    tarifaPct: TARIFA_PCT.yappy_app,
    topeCentavos: viaje.snap_max_price_cents ?? 0,
    porque:
      'Nadie gana dinero con esto. El aporte cubre gasolina y peajes, y hay un tope por ruta para que no se convierta en un taxi.',
    reloj: [
      { titulo: 'Pides el puesto', texto: 'No se cobra nada todavía.' },
      { titulo: 'El conductor acepta', texto: 'Se retiene el aporte. Aún no es suyo.' },
      { titulo: 'Viajan', texto: 'Sigue retenido durante el camino.' },
      { titulo: 'Llegan', texto: 'Se le libera al conductor. Si el viaje no pasó, vuelve a ti.' },
    ],
    letraChica: `Con tarjeta la tarifa es del ${TARIFA_PCT.card} %; en efectivo no hay tarifa y le pagas al subir. El conductor recibe el aporte completo con cualquier método.`,
  });
}

/* -------------------------------------------------------- Comprobante */

export type Comprobante = {
  referencia: string;
  cuando: string;
  destino: string;
  totalCentavos: number;
  aportadoCon: string;
  desglose: { concepto: string; centavos: number; fuerte?: boolean }[];
  filas: { etiqueta: string; valor: string }[];
  /** Lo que esto es y lo que no es. Va en la pantalla, no en la letra chica. */
  queEsEsto: string;
};

export async function comprobante(reservaId: string): Promise<Comprobante> {
  const reserva = fuente.reservas.find((r) => r.id === reservaId);
  if (!reserva) throw new Error(`No existe la reserva ${reservaId}`);
  const viaje = fuente.viajes.find((v) => v.id === reserva.trip_id);
  if (!viaje) throw new Error(`No existe el viaje ${reserva.trip_id}`);
  const conductor = fuente.perfiles.find((p) => p.id === viaje.driver_id);
  const carro = fuente.vehiculos.find((v) => v.id === viaje.vehicle_id);

  const aporte = reserva.unit_price_cents * reserva.seats;
  const tarifa = tarifaDeServicio(aporte, reserva.payment_channel);
  const nombre = conductor ? `${conductor.first_name} ${conductor.last_initial ?? ''}`.trim() : '';

  return demora({
    referencia: reserva.boarding_code ?? reserva.id.slice(0, 8),
    cuando: reserva.confirmed_at ?? reserva.created_at,
    destino: ciudadDestino(viaje),
    totalCentavos: aporte + tarifa,
    aportadoCon: NOMBRE_DEL_CANAL[reserva.payment_channel],
    desglose: [
      { concepto: `Aporte a ${conductor?.first_name ?? 'el conductor'}`, centavos: aporte },
      { concepto: `Tarifa Partimos · ${TARIFA_PCT[reserva.payment_channel]} %`, centavos: tarifa },
      { concepto: 'Total', centavos: aporte + tarifa, fuerte: true },
    ],
    filas: [
      {
        etiqueta: 'Viaje',
        valor: rutaCorta(viaje),
      },
      { etiqueta: 'Salida y llegada', valor: `${hhmm(viaje.departure_at)} · ${hhmm(viaje.arrival_estimate_at)}` },
      {
        etiqueta: 'Conductor',
        valor: `${nombre} · ${carro?.model ?? ''} ${carro?.color ?? ''}`.trim(),
      },
      {
        etiqueta: 'Puestos',
        valor: `${reserva.seats} · ${resumenCorto(deFilas({ mochilas: reserva.mochilas, maletas: reserva.maletas, maletas_pequenas: reserva.maletas_pequenas }))}`,
      },
      { etiqueta: 'Referencia', valor: reserva.boarding_code ?? reserva.id.slice(0, 8) },
    ],
    queEsEsto:
      'Sirve como comprobante de gasto compartido. No es una factura: Partimos no vende un transporte, solo reparte el costo.',
  });
}

function hhmm(cuando: string | null): string {
  if (!cuando) return '';
  return new Intl.DateTimeFormat('es-PA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Panama',
  }).format(new Date(cuando));
}
