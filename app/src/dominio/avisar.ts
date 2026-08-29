/**
 * Qué avisos merecen los hechos — la regla, sin base y sin pantalla.
 *
 * Un aviso no es una fila que alguien se acuerda de escribir: es un hecho
 * del viaje contado a la parte que le toca saberlo. Los hechos ya están en
 * las reservas y los viajes; este módulo dice CUÁLES de ellos son un aviso,
 * PARA QUIÉN, y con qué palabras — las cinco reglas del traspaso (`12b`).
 *
 * Lo usan las dos fuentes por igual, desde `servicios/avisos.ts`: en el
 * simulado es la única forma de que pedir un puesto le aparezca al
 * conductor; contra la base real cubre lo que la tabla `notifications`
 * (migración 0040) todavía no tiene — el recordatorio de salida, que no es
 * un evento sino un estado del reloj, y los hechos de antes de la tabla.
 *
 * Los identificadores son deterministas (`av-pidio-<reserva>`) a propósito:
 * así el mismo hecho derivado dos veces es EL MISMO aviso, y una fila
 * escrita por la base lo suprime comparando (kind, booking_id).
 */

/** Lo que hay que saber de una reserva para avisar. Subconjunto de `ReservaFila`. */
export type ReservaAvisable = {
  id: string;
  trip_id: string;
  passenger_id: string;
  status: string;
  seats: number;
  unit_price_cents: number;
  created_at: string;
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  released_at: string | null;
  updated_at: string;
};

/** Lo que hay que saber de un viaje. Subconjunto de `ViajeFila`. */
export type ViajeAvisable = {
  id: string;
  driver_id: string;
  status: string;
  departure_at: string;
  origin_label: string | null;
  destination_label: string | null;
};

/**
 * Lo que hay que saber de un mensaje para avisar. Subconjunto de `Message`.
 *
 * Un hilo cuelga de una reserva **o** de un viaje, nunca de las dos (0041), y
 * eso es justo lo que hace falta para saber a dónde manda el aviso.
 */
export type MensajeAvisable = {
  id: number;
  booking_id: string | null;
  trip_id?: string | null;
  con_id?: string | null;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

/** La forma de `AvisoPendiente`, dicha aquí para que el dominio no importe nada. */
export type AvisoDerivado = {
  id: string;
  profile_id: string;
  kind:
    | 'solicitud_aceptada'
    | 'solicitud_recibida'
    | 'aporte_recibido'
    | 'califica_tu'
    | 'viaje_cancelado'
    | 'sales_pronto'
    | 'mensaje_nuevo';
  title: string;
  body: string;
  action_label: string | null;
  action_route: string | null;
  booking_id: string | null;
  trip_id: string | null;
  read_at: string | null;
  created_at: string;
};

export type Hechos = {
  reservas: ReservaAvisable[];
  viajes: ViajeAvisable[];
  /** Los mensajes de todos los hilos; se filtran aquí los que te tocan. */
  mensajes?: MensajeAvisable[];
  /** «Andrés M.», o «Alguien». La guía de nombres vive fuera del dominio. */
  nombreDe: (perfilId: string) => string;
  /** ¿Este pasajero ya calificó esta reserva? Si sí, no se le vuelve a pedir. */
  yaCalifico: (reservaId: string, autorId: string) => boolean;
  ahora: Date;
};

/** El recordatorio empieza a existir un día antes de la salida… */
const VENTANA_RECORDATORIO_MS = 24 * 3600_000;
/** …y cambia a «Sales pronto» cuando queda menos de esto. */
const YA_CASI_MS = 100 * 60_000;

/* ── Palabras compartidas ────────────────────────────────────────────── */

const horaEnPanama = (iso: string): string =>
  new Intl.DateTimeFormat('es-PA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Panama',
  }).format(new Date(iso));

const diaEnPanama = (d: Date): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Panama' }).format(d);

/** «14:50 · Albrook → Chitré» — la segunda línea de toda la bandeja. */
export function cuandoDelViaje(v: ViajeAvisable): string {
  const lugar = (etiqueta: string | null) => (etiqueta ?? '').split(' · ')[0];
  return `${horaEnPanama(v.departure_at)} · ${lugar(v.origin_label)} → ${lugar(v.destination_label)}`;
}

const nombreCorto = (nombre: string) => nombre.split(' ')[0];

/**
 * El título del recordatorio depende de cuánto falta, no de una palabra
 * fija: «mañana» a las diez de la noche del mismo día sería mentira.
 */
function tituloDeSalida(salida: Date, ahora: Date, verbo: 'viajas' | 'manejas'): string {
  if (salida.getTime() - ahora.getTime() <= YA_CASI_MS) return 'Sales pronto';
  return diaEnPanama(salida) === diaEnPanama(ahora) ? `Hoy ${verbo}` : `Mañana ${verbo}`;
}

/* ── La derivación ───────────────────────────────────────────────────── */

/**
 * Todos los avisos que los hechos le deben a `perfilId`, del más nuevo al
 * más viejo. Puro: mismos hechos, mismos avisos.
 */
export function avisosDeLosHechos(perfilId: string, hechos: Hechos): AvisoDerivado[] {
  const salen: AvisoDerivado[] = [];
  const viajeDe = new Map(hechos.viajes.map((v) => [v.id, v]));

  for (const r of hechos.reservas) {
    const viaje = viajeDe.get(r.trip_id);
    if (!viaje) continue;
    const base = { booking_id: r.id, trip_id: r.trip_id, read_at: null };
    const cuando = cuandoDelViaje(viaje);

    /* — lo que le toca saber al conductor — */
    if (perfilId === viaje.driver_id) {
      if (r.status === 'pending') {
        salen.push({
          ...base,
          id: `av-pidio-${r.id}`,
          profile_id: perfilId,
          kind: 'solicitud_recibida',
          title: `${hechos.nombreDe(r.passenger_id)} pidió puesto`,
          body: cuando,
          action_label: 'Ver la solicitud',
          action_route: `/(conductor)/solicitudes?viaje=${r.trip_id}`,
          created_at: r.created_at,
        });
      }
      /**
       * **Y AL CONDUCTOR TAMBIÉN SE LE PIDE CALIFICAR** (28-08-2026).
       *
       * Sólo se le pedía al pasajero, así que «la misma fórmula para los dos
       * lados» era una frase sin nada detrás: nadie calificaba nunca a un
       * pasajero, y por eso ningún pasajero tenía nota. La reseña del
       * conductor es la que hace que la nota de quien viaja exista.
       */
      if (r.status === 'completed' && !hechos.yaCalifico(r.id, perfilId)) {
        salen.push({
          ...base,
          id: `av-califica-p-${r.id}`,
          profile_id: perfilId,
          kind: 'califica_tu',
          title: `Califica a ${hechos.nombreDe(r.passenger_id)}`,
          body: cuando,
          action_label: 'Calificar',
          action_route: `/(pasajero)/calificar?reserva=${r.id}`,
          created_at: r.completed_at ?? r.updated_at,
        });
      }
      if (r.released_at) {
        const aporte = r.unit_price_cents * r.seats;
        salen.push({
          ...base,
          id: `av-aporte-${r.id}`,
          profile_id: perfilId,
          kind: 'aporte_recibido',
          title: `Te aportaron ${dinero(aporte)}`,
          body: cuando,
          action_label: null,
          action_route: null,
          created_at: r.released_at,
        });
      }
    }

    /* — lo que le toca saber al pasajero — */
    if (perfilId === r.passenger_id) {
      if (r.status === 'confirmed') {
        salen.push({
          ...base,
          id: `av-aceptada-${r.id}`,
          profile_id: perfilId,
          kind: 'solicitud_aceptada',
          title: `${nombreCorto(hechos.nombreDe(viaje.driver_id))} aceptó tu puesto`,
          body: cuando,
          action_label: 'Ver código',
          action_route: `/(pasajero)/codigo?reserva=${r.id}`,
          created_at: r.confirmed_at ?? r.updated_at,
        });

        const recordatorio = recordatorioDeSalida(r, viaje, hechos.ahora);
        if (recordatorio) salen.push(recordatorio);
      }
      if (r.status === 'cancelled_driver') {
        salen.push({
          ...base,
          id: `av-rechazo-${r.id}`,
          profile_id: perfilId,
          kind: 'viaje_cancelado',
          title: `${nombreCorto(hechos.nombreDe(viaje.driver_id))} no puede llevarte`,
          body: cuando,
          action_label: 'Buscar otro',
          action_route: '/(pasajero)',
          created_at: r.cancelled_at ?? r.updated_at,
        });
      }
      if (r.status === 'completed' && !hechos.yaCalifico(r.id, perfilId)) {
        salen.push({
          ...base,
          id: `av-califica-${r.id}`,
          profile_id: perfilId,
          kind: 'califica_tu',
          title: `Califica a ${hechos.nombreDe(viaje.driver_id)}`,
          body: cuando,
          action_label: 'Calificar',
          action_route: `/(pasajero)/calificar?reserva=${r.id}`,
          created_at: r.completed_at ?? r.updated_at,
        });
      }
    }
  }

  /* — y al conductor, que mañana maneja: es a quien peor le sale olvidarlo — */
  for (const v of hechos.viajes) {
    if (v.driver_id !== perfilId || v.status !== 'published') continue;
    const confirmadas = hechos.reservas.filter(
      (r) => r.trip_id === v.id && r.status === 'confirmed',
    ).length;
    if (confirmadas === 0) continue; // sin nadie a bordo no hay cita que recordar
    const salida = new Date(v.departure_at);
    const falta = salida.getTime() - hechos.ahora.getTime();
    if (falta <= 0 || falta > VENTANA_RECORDATORIO_MS) continue;
    salen.push({
      id: `av-manejas-${v.id}`,
      profile_id: perfilId,
      kind: 'sales_pronto',
      title: tituloDeSalida(salida, hechos.ahora, 'manejas'),
      body: `${confirmadas === 1 ? '1 persona va' : `${confirmadas} personas van`} contigo · ${cuandoDelViaje(v)}`,
      action_label: 'Ver mi viaje',
      action_route: `/(conductor)/panel?viaje=${v.id}`,
      booking_id: null,
      trip_id: v.id,
      read_at: null,
      created_at: new Date(salida.getTime() - VENTANA_RECORDATORIO_MS).toISOString(),
    });
  }

  salen.push(...avisosDeMensajes(perfilId, hechos, viajeDe));

  return salen.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/**
 * «Andrés M. te escribió» — UN aviso POR HILO, no por mensaje.
 *
 * Regla 3 del traspaso: un evento, un aviso. Tres mensajes seguidos de la
 * misma persona sobre el mismo viaje son una sola cosa que saber — «tienes
 * que contestar»—, y tres líneas en la bandeja por eso serían tres veces la
 * misma. Se apunta el más nuevo sin leer, que es el que se lee al abrir.
 *
 * Sólo sobrevive mientras esté SIN LEER: el aviso de un mensaje no es una
 * constancia de que pasó, es que falta contestarlo. Abrir el hilo lo marca
 * leído (`marcarHiloLeido`) y con eso el aviso desaparece solo — sin una
 * segunda marca que mantener en otro sitio.
 */
function avisosDeMensajes(
  perfilId: string,
  hechos: Hechos,
  viajeDe: Map<string, ViajeAvisable>,
): AvisoDerivado[] {
  const reservaDe = new Map(hechos.reservas.map((r) => [r.id, r]));
  /** Por hilo: quién escribe, cuántos van, y el último de todos. */
  const porHilo = new Map<
    string,
    { de: string; cuantos: number; ultimo: MensajeAvisable; ruta: string; viajeId: string | null }
  >();

  for (const m of hechos.mensajes ?? []) {
    if (m.sender_id === perfilId || m.read_at != null) continue;

    let clave: string;
    let ruta: string;
    let viaje: ViajeAvisable | undefined;

    if (m.booking_id) {
      const r = reservaDe.get(m.booking_id);
      if (!r) continue;
      viaje = viajeDe.get(r.trip_id);
      if (!viaje) continue;
      if (r.passenger_id !== perfilId && viaje.driver_id !== perfilId) continue;
      clave = m.booking_id;
      ruta = `/(pasajero)/chat?reserva=${m.booking_id}`;
    } else {
      if (!m.trip_id || !m.con_id) continue;
      viaje = viajeDe.get(m.trip_id);
      if (!viaje) continue;
      if (m.con_id !== perfilId && viaje.driver_id !== perfilId) continue;
      clave = `${m.trip_id}·${m.con_id}`;
      ruta = `/(pasajero)/chat?viaje=${m.trip_id}&con=${m.con_id}`;
    }

    const antes = porHilo.get(clave);
    const ultimo = antes && antes.ultimo.created_at > m.created_at ? antes.ultimo : m;
    porHilo.set(clave, {
      de: m.sender_id,
      cuantos: (antes?.cuantos ?? 0) + 1,
      ultimo,
      ruta,
      viajeId: viaje.id,
    });
  }

  return [...porHilo.entries()].map(([clave, h]) => {
    const nombre = hechos.nombreDe(h.de);
    const viaje = h.viajeId ? viajeDe.get(h.viajeId) : undefined;
    return {
      id: `av-escrito-${clave}`,
      profile_id: perfilId,
      kind: 'mensaje_nuevo' as const,
      title: h.cuantos === 1 ? `${nombre} te escribió` : `${h.cuantos} mensajes de ${nombre}`,
      /* Lo que dijo, y de qué viaje. El texto va primero porque es lo que
         decide si hay que abrir ahora o luego. */
      body: viaje ? `«${enUnaLinea(h.ultimo.body)}» · ${rutaDelViaje(viaje)}` : enUnaLinea(h.ultimo.body),
      action_label: 'Responder',
      action_route: h.ruta,
      booking_id: h.ultimo.booking_id,
      trip_id: h.viajeId,
      read_at: null,
      created_at: h.ultimo.created_at,
    };
  });
}

/** «Albrook → Chitré», sin hora: un mensaje no ocurre a la hora del viaje. */
function rutaDelViaje(v: ViajeAvisable): string {
  const lugar = (etiqueta: string | null) => (etiqueta ?? '').split(' · ')[0];
  return `${lugar(v.origin_label)} → ${lugar(v.destination_label)}`;
}

/** Un renglón de bandeja: sin saltos y sin colas de párrafo. */
function enUnaLinea(texto: string): string {
  const plano = texto.replace(/\s+/g, ' ').trim();
  return plano.length > 70 ? `${plano.slice(0, 69)}…` : plano;
}

/**
 * El recordatorio del pasajero: existe desde 24 h antes de la salida, y su
 * `created_at` es el momento en que empezó a existir — nunca antes de que
 * la reserva se confirmara, que un aviso no puede preceder a su hecho.
 */
function recordatorioDeSalida(
  r: ReservaAvisable,
  viaje: ViajeAvisable,
  ahora: Date,
): AvisoDerivado | null {
  const salida = new Date(viaje.departure_at);
  const falta = salida.getTime() - ahora.getTime();
  if (falta <= 0 || falta > VENTANA_RECORDATORIO_MS) return null;

  const abrio = salida.getTime() - VENTANA_RECORDATORIO_MS;
  const confirmada = new Date(r.confirmed_at ?? r.updated_at).getTime();
  return {
    id: `av-pronto-${r.id}`,
    profile_id: r.passenger_id,
    kind: 'sales_pronto',
    title: tituloDeSalida(salida, ahora, 'viajas'),
    body: cuandoDelViaje(viaje),
    action_label: 'Ver mi viaje',
    action_route: `/(pasajero)/viaje?viaje=${viaje.id}`,
    booking_id: r.id,
    trip_id: viaje.id,
    read_at: null,
    created_at: new Date(Math.max(abrio, confirmada)).toISOString(),
  };
}

/** «B/6», «B/7.50» — el mismo trato que `ui/dinero`, sin importarlo. */
function dinero(cents: number): string {
  return `B/${cents % 100 === 0 ? cents / 100 : (cents / 100).toFixed(2)}`;
}

/**
 * ¿Este aviso derivado ya está contado por una fila escrita? La fila manda:
 * tiene identidad estable y su «leído» sobrevive. Se compara por el hecho
 * —(kind, booking_id) o (kind, trip_id)— porque los identificadores no
 * coinciden nunca: los derivados son `av-…`, las filas son uuid.
 */
export function yaEstaEscrito(
  derivado: AvisoDerivado,
  escritos: { kind: string; booking_id: string | null; trip_id: string | null }[],
): boolean {
  return escritos.some(
    (e) =>
      e.kind === derivado.kind &&
      (derivado.booking_id != null
        ? e.booking_id === derivado.booking_id
        : e.booking_id == null && e.trip_id === derivado.trip_id),
  );
}
