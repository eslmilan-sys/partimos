/**
 * La misma superficie que `../simulado`, contra la base de verdad.
 *
 * **Por qué carga y no consulta.** Los servicios leen el almacén como arreglos
 * —`fuente.viajes.filter(...)`— y son 3 226 líneas escritas así. Reescribirlas
 * una por una en consultas asíncronas habría tocado también las 58 pantallas.
 * En vez de eso, la app pide sus tablas una vez al arrancar y las deja en los
 * mismos arreglos. Es lo que un catálogo de este tamaño permite: seis
 * corredores, treinta y dos ciudades, unas decenas de viajes. Cuando la escala
 * cambie, este archivo se parte en consultas y arriba no se entera nadie.
 *
 * Los arreglos se exportan **vacíos y se llenan en su sitio**. Por eso `cargar`
 * tiene que terminar antes del primer render: `app/_layout.tsx` lo espera.
 */

import type {
  Cancellation, CancellationPolicy, City, Corridor, IdentityVerification, Incident,
  Credit, LedgerEntry, Message, NoShowReport, Payment, Payout, PayoutBatch, Profile, Refund,
  ReservaFila, Review, RutinaFila, TripStop, ViajeFila, Vehicle, VehicleCategory,
  AvisoPendiente,
} from '@/tipos';

import { A_CUALQUIER_HORA, etiquetaDeRutina } from '@/dominio/rutinas';

import { supabase } from './cliente';

/* El catálogo de carros no es un dato: es una lista cerrada del producto. */
export * from '../simulado/catalogo';

/* ── Las tablas ──────────────────────────────────────────────────────────── */

export const ciudades: City[] = [];
export const corredores: Corridor[] = [];
export const perfiles: Profile[] = [];
export const vehiculos: Vehicle[] = [];
export const categorias: (VehicleCategory & { consumo_l_100km: number })[] = [];
export const viajes: ViajeFila[] = [];
export const paradas: TripStop[] = [];
export const reservas: ReservaFila[] = [];
export const mensajes: Message[] = [];
export const pagos: Payment[] = [];
export const resenas: Review[] = [];
export const verificaciones: IdentityVerification[] = [];
export const incidencias: Incident[] = [];
export const rutinas: RutinaFila[] = [];
export const politicas: CancellationPolicy[] = [];
export const cancelaciones: Cancellation[] = [];
export const reembolsos: Refund[] = [];
export const creditos: Credit[] = [];
export const lotes: PayoutBatch[] = [];
export const pagosAlConductor: Payout[] = [];
export const libro: LedgerEntry[] = [];
export const reportesDeNoShow: NoShowReport[] = [];

/**
 * **No hay tabla `notifications`, y los avisos igual existen.**
 *
 * El traspaso dice que un aviso es un hecho del viaje contado a tiempo, no una
 * fila que alguien tiene que acordarse de escribir. Los hechos ya están en la
 * base: una reserva confirmada es «te aceptaron», una pendiente en tu viaje es
 * «alguien pidió puesto», una liberada es «te aportaron». Así que la bandeja
 * se deriva de lo que ya se ha cargado, en vez de salir vacía —que es lo que
 * hacía, y por eso al pasajero no le llegaba nunca que el conductor le había
 * aceptado—.
 *
 * Lo que esto no puede hacer es sonar en el teléfono con la app cerrada: eso
 * sí necesita tabla y un envío. Cuando exista, `derivarAvisos` se cambia por
 * un `traer('notifications', avisos)` y ninguna pantalla se entera.
 */
export const avisos: AvisoPendiente[] = [];

/* ── Lo que no es una columna ────────────────────────────────────────────── */

/** Viajes hechos y nota media, contados sobre `reviews`. */
export const reputacion: Record<string, { viajes: number; calificacion: number | null }> = {};

/**
 * La placa entera **no existe en la base, y es a propósito**: `vehicles` solo
 * guarda `plate_last3`. Enseñar la placa completa de alguien a quien todavía no
 * has conocido es exactamente lo que el diseño evita.
 */
export const placasCompletas: Record<string, string> = {};

/** El Yappy del conductor: tampoco hay columna. Pendiente de migración. */
export const yappyDelConductor: Record<string, string> = {};

/** Las paradas intermedias de cada ruta, sacadas de `pickup_points`. */
export const paradasDeLaRuta: Record<string, { ciudad: string; etiqueta: string; minutos: number }[]> = {};

/* ── La carga ────────────────────────────────────────────────────────────── */

/**
 * El cliente tipa cada tabla por su nombre literal, y estos ayudantes reciben
 * el nombre como dato. La conversión vive aquí, en un sitio, y no repartida por
 * las quince llamadas de abajo. Lo que sí se comprueba es la forma de la fila:
 * cada arreglo lleva su tipo de `@/tipos`, generado del esquema.
 */
type Devuelve = Promise<{ data: unknown; error: { message: string } | null }>;
type Consulta = {
  select: (columnas?: string) => Devuelve & { eq: (c: string, v: unknown) => Devuelve };
  insert: (fila: unknown) => { select: () => { single: () => Devuelve } };
  update: (cambios: unknown) => {
    eq: (c: string, v: unknown) => { select: () => { single: () => Devuelve } };
  };
};
const tabla = (nombre: string) => supabase.from(nombre as never) as unknown as Consulta;

const traer = async <T,>(nombre: string, destino: T[], columnas = '*') => {
  const { data, error } = await tabla(nombre).select(columnas);
  if (error) throw new Error(`${nombre}: ${error.message}`);
  destino.length = 0;
  destino.push(...((data ?? []) as T[]));
};

/**
 * Igual, pero un fallo no tumba la app.
 *
 * `traer` lanza, y `app/_layout.tsx` convierte cualquier excepción de `cargar`
 * en la pantalla «No se pudo cargar». Para las tablas sin las que la app no
 * existe —ciudades, viajes— eso es correcto. Para las que solo llenan una
 * pantalla lateral, no: perder los pagos no es motivo para no dejar buscar un
 * viaje. Aquí un fallo deja el arreglo vacío, que es lo que ya pasaba antes de
 * pedirlos siquiera.
 */
const traerSiSePuede = async <T,>(nombre: string, destino: T[]) => {
  try {
    await traer<T>(nombre, destino);
  } catch {
    destino.length = 0;
  }
};

let enCurso: Promise<void> | null = null;

/** Trae el almacén. Llamarla dos veces no lo trae dos veces. */
export function cargar(): Promise<void> {
  enCurso ??= (async () => {
    await Promise.all([
      traer<City>('cities', ciudades),
      traer<Corridor>('corridors', corredores),
      traer<Vehicle>('vehicles', vehiculos),
      traer<ViajeFila>('trips', viajes),
      traer<TripStop>('trip_stops', paradas),
      traer<ReservaFila>('bookings', reservas),
      traer<Message>('messages', mensajes),
      traer<Review>('reviews', resenas),
      traer<IdentityVerification>('identity_verifications', verificaciones),
      traerRutinas(),
      traer<CancellationPolicy>('cancellation_policies', politicas),
      // Los pagos son de sus dos partes (migración 0024): quien no tenga
      // sesión recibe una lista vacía, no un error. Va por la vía tolerante
      // porque una pantalla de dinero vacía no justifica tumbar la app.
      traerSiSePuede<Payment>('payments', pagos),
      // Los perfiles vienen de la vista: nombre, inicial, foto y poco más. El
      // teléfono y el apellido entero se quedan donde deben.
      traer<Profile>('perfiles_publicos', perfiles),
      cargarCategorias(),
      cargarParadasDeRuta(),
    ]);
    calcularReputacion();
    derivarAvisos();
  })();
  return enCurso;
}

/**
 * Los avisos, sacados de los hechos que ya se cargaron.
 *
 * Se derivan para las dos partes de cada reserva —el pasajero y el
 * conductor—; `bandeja(perfilId)` se queda con los de quien mira. No hace
 * falta filtrar por sesión aquí: las políticas ya hicieron ese trabajo, y lo
 * que está en `reservas` es lo que puedo ver porque soy parte.
 */
function derivarAvisos() {
  avisos.length = 0;
  const nombreDe = (id: string) => {
    const p = perfiles.find((x) => x.id === id);
    return p ? `${p.first_name} ${p.last_initial ?? ''}`.trim() : 'Alguien';
  };
  const cuando = (v: ViajeFila | undefined) => {
    if (!v) return '';
    const t = new Date(v.departure_at);
    const hhmm = new Intl.DateTimeFormat('es-PA', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Panama',
    }).format(t);
    const ruta = `${(v.origin_label ?? '').split(' · ')[0]} → ${(v.destination_label ?? '').split(' · ')[0]}`;
    return `${hhmm} · ${ruta}`;
  };
  const poner = (a: AvisoPendiente) => avisos.push(a);

  for (const r of reservas) {
    const viaje = viajes.find((v) => v.id === r.trip_id);
    if (!viaje) continue;
    const base = { booking_id: r.id, trip_id: r.trip_id, read_at: null as string | null };

    // — lo que le toca saber al pasajero —
    if (r.status === 'confirmed') {
      poner({
        ...base,
        id: `av-aceptada-${r.id}`,
        profile_id: r.passenger_id,
        kind: 'solicitud_aceptada',
        title: `${nombreDe(viaje.driver_id).split(' ')[0]} aceptó tu puesto`,
        body: cuando(viaje),
        action_label: 'Ver código',
        action_route: `/(pasajero)/codigo?reserva=${r.id}`,
        created_at: r.confirmed_at ?? r.updated_at,
      });
    }
    if (r.status === 'cancelled_driver') {
      poner({
        ...base,
        id: `av-cancelada-${r.id}`,
        profile_id: r.passenger_id,
        kind: 'viaje_cancelado',
        title: `${nombreDe(viaje.driver_id).split(' ')[0]} no puede llevarte`,
        body: cuando(viaje),
        action_label: 'Buscar otro',
        action_route: '/(pasajero)',
        created_at: r.cancelled_at ?? r.updated_at,
      });
    }
    if (r.status === 'completed' && !resenas.some((x) => x.booking_id === r.id && x.author_id === r.passenger_id)) {
      poner({
        ...base,
        id: `av-califica-${r.id}`,
        profile_id: r.passenger_id,
        kind: 'califica_tu',
        title: `Califica a ${nombreDe(viaje.driver_id)}`,
        body: cuando(viaje),
        action_label: 'Calificar',
        action_route: `/(pasajero)/calificar?reserva=${r.id}`,
        created_at: r.completed_at ?? r.updated_at,
      });
    }

    // — lo que le toca saber al conductor —
    if (r.status === 'pending') {
      poner({
        ...base,
        id: `av-pidio-${r.id}`,
        profile_id: viaje.driver_id,
        kind: 'solicitud_recibida',
        title: `${nombreDe(r.passenger_id)} pidió puesto`,
        body: cuando(viaje),
        action_label: 'Ver la solicitud',
        action_route: `/(conductor)/solicitudes?viaje=${r.trip_id}`,
        created_at: r.created_at,
      });
    }
    if (r.released_at) {
      const aporte = r.unit_price_cents * r.seats;
      poner({
        ...base,
        id: `av-aporte-${r.id}`,
        profile_id: viaje.driver_id,
        kind: 'aporte_recibido',
        title: `Te aportaron ${aporte % 100 === 0 ? aporte / 100 : (aporte / 100).toFixed(2)} $`,
        body: cuando(viaje),
        action_label: null,
        action_route: null,
        created_at: r.released_at,
      });
    }
  }
}

/**
 * `routines` guarda los días y la hora; «Viernes por la tarde» y el
 * interruptor de avisar son campos pendientes que solo existían en el
 * simulado. Sin derivarlos aquí, `15a` enseñaba la ruta y un hueco donde va
 * el cuándo.
 */
async function traerRutinas() {
  const crudas: RutinaFila[] = [];
  await traerSiSePuede<RutinaFila>('routines', crudas);
  rutinas.length = 0;
  for (const r of crudas) {
    rutinas.push({
      ...r,
      avisar: r.avisar ?? true,
      etiqueta: etiquetaDeRutina(r.days ?? [], String(r.departure_time ?? A_CUALQUIER_HORA)),
    });
  }
}

async function cargarCategorias() {
  const { data } = await supabase.from('vehicle_categories').select('*');
  categorias.length = 0;
  // `l_100km` es de la tabla; el nombre que usan los servicios es el del dominio.
  for (const c of data ?? []) categorias.push({ ...c, consumo_l_100km: (c as { l_100km?: number }).l_100km ?? 8 });
}

async function cargarParadasDeRuta() {
  const { data } = await supabase
    .from('pickup_points')
    .select('name, description, city_id, cities(name)')
    .eq('is_active', true);
  for (const c of corredores) {
    paradasDeLaRuta[c.slug] = (data ?? [])
      .filter((p) => p.city_id !== c.origin_city_id && p.city_id !== c.destination_city_id)
      .map((p) => ({
        ciudad: (p.cities as { name: string } | null)?.name ?? p.name,
        etiqueta: p.name,
        minutos: 0,
      }));
  }
}

function calcularReputacion() {
  for (const r of resenas) {
    const quien = (r as { subject_id?: string }).subject_id;
    if (!quien) continue;
    const hasta = reputacion[quien] ?? { viajes: 0, calificacion: null };
    const nota = (r as { rating?: number | null }).rating;
    const suma = (hasta.calificacion ?? 0) * hasta.viajes + (nota ?? 0);
    hasta.viajes += 1;
    hasta.calificacion = nota == null ? hasta.calificacion : suma / hasta.viajes;
    reputacion[quien] = hasta;
  }
}

/* ── Las escrituras ──────────────────────────────────────────────────────── */
/* Escriben en la base y dejan el arreglo al día, para que la pantalla que
   llamó vea el resultado sin volver a cargar todo. */

async function insertar<T extends { id: string }>(nombre: string, fila: T, destino: T[]): Promise<T> {
  const { data, error } = await tabla(nombre).insert(fila).select().single();
  if (error) throw new Error(`${nombre}: ${error.message}`);
  const guardada = data as T;
  destino.push(guardada);
  return guardada;
}

export const guardarViaje = (v: ViajeFila) => insertar('trips', v, viajes);

/**
 * Las paradas de un viaje. Publicar escribía el viaje y **no** sus paradas,
 * así que un viaje recién publicado enseñaba la tarjeta «ruta del viaje»
 * vacía: sin `trip_stops` no hay ni de dónde sale ni dónde termina.
 */
export const guardarParada = (p: TripStop) => insertar('trip_stops', p, paradas);
export const guardarReserva = async (r: ReservaFila) => {
  const guardada = await insertar('bookings', r, reservas);
  // el conductor tiene que enterarse de que le pidieron puesto
  derivarAvisos();
  return guardada;
};
export const guardarPago = (p: Payment) => insertar('payments', p, pagos);
export const guardarCancelacion = (c: Cancellation) => insertar('cancellations', c, cancelaciones);
export const guardarReembolso = (r: Refund) => insertar('refunds', r, reembolsos);
export const guardarIncidencia = (i: Incident) => insertar('incidents', i, incidencias);

/**
 * Las tres que se escribian solo en memoria y se perdian al recargar: la nota
 * que le pones a alguien, lo que escribes en el chat y el carro que registras.
 * `calificaciones.ts`, `mensajes.ts` y `carros.ts` hacian `array.push` y ya.
 * En simulado no se notaba —todo es memoria— pero contra la base significaba
 * que calificar no calificaba.
 */
export const guardarResena = (r: Review) => insertar('reviews', r, resenas);

/**
 * Guardar una ruta para que te avisen. `avisar` y `etiqueta` no son columnas,
 * así que se derivan igual que al cargar. La base tiene `UNIQUE (profile_id,
 * from_city_id, to_city_id)`: pedir dos veces la misma ruta no la duplica, y
 * quien lo intenta ya la tenía guardada.
 */
export async function guardarRuta(r: RutinaFila): Promise<RutinaFila> {
  const { avisar: _a, etiqueta: _e, ...fila } = r;
  const { data, error } = await tabla('routines').insert(fila).select().single();
  if (error) {
    if (error.message.includes('duplicate key')) return r;
    throw new Error(`routines: ${error.message}`);
  }
  const guardada = { ...(data as RutinaFila), avisar: true, etiqueta: r.etiqueta };
  rutinas.push(guardada);
  return guardada;
}
export const guardarVehiculo = (v: Vehicle) => insertar('vehicles', v, vehiculos);

/**
 * `messages.id` es un `bigserial` con valor por defecto, asi que el
 * identificador NO se manda: lo pone la base. Mandarlo desde el cliente es
 * como choca la secuencia en cuanto escriben dos personas.
 */
export async function guardarMensaje(m: Message): Promise<Message> {
  const { id: _sinUsar, ...sinId } = m;
  const { data, error } = await tabla('messages').insert(sinId).select().single();
  if (error) throw new Error(`messages: ${error.message}`);
  const guardado = data as Message;
  mensajes.push(guardado);
  return guardado;
}

/**
 * Cambia una fila de `profiles`. La política RLS solo deja tocar la propia, que
 * es exactamente lo que la app pide: nadie cambia por dónde le cobran a otro.
 *
 * El arreglo local viene de la vista `perfiles_publicos`, que no trae todas las
 * columnas; por eso se mezcla el cambio sobre la fila que ya había en vez de
 * reemplazarla por lo que devuelve la base.
 */
export async function actualizarPerfil(id: string, cambios: Partial<Profile>): Promise<Profile> {
  const { error } = await tabla('profiles').update(cambios).eq('id', id).select().single();
  if (error) throw new Error(`profiles: ${error.message}`);
  const i = perfiles.findIndex((p) => p.id === id);
  if (i >= 0) perfiles[i] = { ...perfiles[i], ...cambios };
  return perfiles[i] ?? ({ id, ...cambios } as Profile);
}

export async function actualizarReserva(id: string, cambios: Partial<ReservaFila>): Promise<ReservaFila> {
  const { data, error } = await tabla('bookings').update(cambios).eq('id', id).select().single();
  if (error) throw new Error(`bookings: ${error.message}`);
  const i = reservas.findIndex((r) => r.id === id);
  if (i >= 0) reservas[i] = data as ReservaFila;
  /* Aceptar, rechazar y cerrar cambian lo que la otra parte tiene que saber:
     los avisos se vuelven a derivar del hecho nuevo. */
  derivarAvisos();
  return data as ReservaFila;
}

/** El paso de «retenido» a «cobrado», que es el único cambio que un pago tiene. */
export async function actualizarPago(id: string, cambios: Partial<Payment>): Promise<Payment> {
  const { data, error } = await tabla('payments').update(cambios).eq('id', id).select().single();
  if (error) throw new Error(`payments: ${error.message}`);
  const i = pagos.findIndex((p) => p.id === id);
  if (i >= 0) pagos[i] = data as Payment;
  return data as Payment;
}

/**
 * Leído se queda en memoria: los avisos son derivados, no filas, así que no
 * hay dónde escribir la marca. Se nota al recargar, y es preferible a que
 * tocar un aviso no haga nada.
 */
export async function marcarAvisoLeido(id: string): Promise<AvisoPendiente | null> {
  const i = avisos.findIndex((a) => a.id === id);
  if (i < 0) return null;
  avisos[i] = { ...avisos[i], read_at: new Date().toISOString() };
  return avisos[i];
}

export async function marcarTodosLeidos(perfilId: string): Promise<number> {
  const ahora = new Date().toISOString();
  let n = 0;
  for (let i = 0; i < avisos.length; i += 1) {
    if (avisos[i].profile_id === perfilId && !avisos[i].read_at) {
      avisos[i] = { ...avisos[i], read_at: ahora };
      n += 1;
    }
  }
  return n;
}

/**
 * `routines` no guarda todavía el interruptor «avisarme»: el cambio vive en
 * memoria hasta que exista la columna. Se nota al recargar, y es preferible a
 * fingir que se guardó.
 */
export async function cambiarAvisoDeRutina(id: string, avisar: boolean): Promise<RutinaFila | null> {
  const i = rutinas.findIndex((r) => r.id === id);
  if (i < 0) return null;
  rutinas[i] = { ...rutinas[i], avisar };
  return rutinas[i];
}
