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

import { paradasEnElCamino } from '@/dominio/enElCamino';
import { notaDe } from '@/dominio/notas';
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
 * La tabla `notifications` EXISTE desde la migración 0040: la escriben los
 * triggers de `bookings` y `trips`, cada quien lee la suya, y del UPDATE
 * solo se concede `read_at`. Aquí se trae por la vía tolerante — si la
 * migración no ha corrido todavía, la lista queda vacía y la bandeja vive
 * de la derivación de los hechos (`servicios/avisos.ts`), que era lo único
 * que había antes. Nada se rompe por el orden en que se aplique.
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
export const paradasDeLaRuta: Record<string, { ciudad: string; etiqueta: string; fraccion: number }[]> = {};

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
  /* `insert` es esperable por sí solo: cuando la tabla no da `select` a
     nadie —`city_requests`, 0043— pedir la fila de vuelta falla por
     permisos aunque el alta haya entrado. */
  insert: (fila: unknown) => Devuelve & { select: () => { single: () => Devuelve } };
  update: (cambios: unknown) => {
    /* Como `insert`: esperable por sí solo cuando no hace falta la fila de
       vuelta — marcar leído no necesita releer el mensaje. */
    eq: (c: string, v: unknown) => Devuelve & { select: () => { single: () => Devuelve } };
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
    /* Los avisos escritos, si la tabla ya está. Después de las reservas a
       propósito: la bandeja los junta con lo derivado y dedupe por hecho. */
    await traerSiSePuede<AvisoPendiente>('notifications', avisos);
  })();
  return enCurso;
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

/**
 * Las paradas de cada corredor.
 *
 * **Repartía el país entero.** Cogía TODOS los `pickup_points` activos y los
 * ofrecía en TODAS las rutas, quitando sólo los dos extremos: publicando
 * Panamá → Chitré salía «parar en David», 400 km al oeste. Visto en el
 * teléfono del dueño el 25-08-2026. Ahora la geometría decide —
 * `paradasEnElCamino`, probada con las coordenadas de la semilla.
 *
 * **Y son CIUDADES, no terminales.** El punto exacto lo propone el pasajero
 * y lo acepta el conductor (regla 4); el conductor sólo dice por qué
 * ciudades pasa. Eso además saca de la interfaz los seis nombres de
 * terminal de la semilla, que `PRODUCT.md` prohíbe como sitio de encuentro.
 */
async function cargarParadasDeRuta() {
  const donde = new Map(ciudades.map((c) => [c.id, c]));
  for (const c of corredores) {
    const salida = donde.get(c.origin_city_id);
    const llegada = donde.get(c.destination_city_id);
    if (!salida || !llegada || salida.lat == null || salida.lng == null || llegada.lat == null || llegada.lng == null) {
      paradasDeLaRuta[c.slug] = [];
      continue;
    }
    /* Una ciudad sin coordenadas no se puede situar, así que no se ofrece:
       adivinar dónde cae sería peor que no proponerla. */
    const candidatas = ciudades.filter(
      (x): x is City & { lat: number; lng: number } =>
        x.lat != null &&
        x.lng != null &&
        x.id !== c.origin_city_id &&
        x.id !== c.destination_city_id,
    );
    paradasDeLaRuta[c.slug] = paradasEnElCamino(
      { lat: salida.lat, lng: salida.lng },
      { lat: llegada.lat, lng: llegada.lng },
      candidatas,
    ).map((p) => ({
      ciudad: p.name,
      etiqueta: p.name,
      /* La FRACCIÓN del trayecto, no minutos: quien sabe cuánto dura el
         viaje es el servicio, y ahí se convierte. Guardar minutos aquí
         obligaría a esta capa a conocer la duración de cada corredor. */
      fraccion: p.fraccion,
    }));
  }
}

/**
 * LA NOTA SALE DE `dominio/notas`, no de un promedio a mano (28-08-2026).
 *
 * Lo que había aquí era un promedio corriente calculado a mano, y tenía dos
 * fallos aparte de no ser la fórmula:
 *
 * · `viajes` contaba RESEÑAS y se llamaba viajes. La pantalla escribía «34
 *   viajes» al lado de la nota de alguien que tenía tres opiniones.
 * · Una reseña sin `rating` incrementaba `viajes` igual, así que dividía por
 *   un denominador más grande que el número de notas sumadas y bajaba la
 *   media de quien tuviera reseñas mudas.
 *
 * Ahora los dos números se dicen por separado y con su nombre: `viajes` son
 * los viajes cumplidos (`bookings` con `completed_at`), y `calificacion` es
 * lo que devuelve `notaDe` — la misma función, con las mismas constantes,
 * que usa el recorrido simulado.
 */
function calcularReputacion() {
  const porPersona = new Map<string, { rating: number; created_at: string }[]>();

  for (const r of resenas) {
    const fila = r as { subject_id?: string; rating?: number | null; created_at?: string };
    if (!fila.subject_id || fila.rating == null) continue;
    const suyas = porPersona.get(fila.subject_id) ?? [];
    suyas.push({ rating: fila.rating, created_at: fila.created_at ?? '' });
    porPersona.set(fila.subject_id, suyas);
  }

  /* Los viajes cumplidos, que NO son las reseñas: se puede viajar sin que
     nadie te califique, y es lo que hace casi todo el mundo. */
  const viajesDe = new Map<string, number>();
  for (const b of reservas) {
    if (!b.completed_at) continue;
    const viaje = viajes.find((v) => v.id === b.trip_id);
    for (const quien of [b.passenger_id, viaje?.driver_id]) {
      if (quien) viajesDe.set(quien, (viajesDe.get(quien) ?? 0) + 1);
    }
  }

  for (const quien of new Set([...porPersona.keys(), ...viajesDe.keys()])) {
    reputacion[quien] = {
      viajes: viajesDe.get(quien) ?? 0,
      calificacion: notaDe(porPersona.get(quien) ?? []).valor,
    };
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
/* El trigger de 0040 escribe el aviso del conductor en la base; la copia en
   memoria de `reservas` basta para que la bandeja lo derive al instante. */
export const guardarReserva = (r: ReservaFila) => insertar('bookings', r, reservas);
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
 * EL CARRO SE CORRIGE, NO SE DUPLICA. `guardarCarro` sólo sabía insertar,
 * así que cada «Guardar el carro» estrenaba una fila: el dueño llegó a tener
 * OCHO carros activos, todos el mismo Elantra (visto en la base el
 * 02-09-2026). La política `vehicles_owner_all` deja al dueño escribir la
 * suya; con esto la pantalla actualiza la que ya existe.
 */
export async function actualizarVehiculo(id: string, cambios: Partial<Vehicle>): Promise<Vehicle> {
  const { data, error } = await tabla('vehicles').update(cambios).eq('id', id).select().single();
  if (error) throw new Error(`vehicles: ${error.message}`);
  const guardado = data as Vehicle;
  const i = vehiculos.findIndex((v) => v.id === id);
  if (i >= 0) vehiculos[i] = guardado;
  else vehiculos.push(guardado);
  return guardado;
}

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
 * PEDIR QUE AGREGUEMOS UNA CIUDAD (0043).
 *
 * `city_requests` no tiene `select` para nadie —la bandeja la leemos
 * nosotros—, así que aquí **no se pide la fila de vuelta**: un `.select()`
 * detrás del insert fallaría por permisos aunque la fila hubiera entrado.
 * Lo que la pantalla necesita saber es si se aceptó, y eso es un booleano.
 *
 * La misma ciudad pedida dos veces choca contra `uq_city_requests_nombre`, y
 * eso no es un fallo: quien la pide ya la había pedido.
 */
export async function pedirCiudad(p: {
  profile_id: string | null;
  nombre: string;
  provincia: string | null;
}): Promise<boolean> {
  const { error } = await tabla('city_requests').insert(p);
  if (!error) return true;
  if (error.message.includes('duplicate key')) return true;
  throw new Error(`city_requests: ${error.message}`);
}

/**
 * Marcar leídos los mensajes que te escribieron.
 *
 * Sólo `read_at`: es la única columna que la política deja tocar desde el
 * cliente (`grant update (read_at)`, 0021). Se manda de uno en uno porque el
 * cliente tipado no expone `in (...)`, y son tres o cuatro por hilo.
 */
export async function marcarMensajesLeidos(ids: number[]): Promise<number> {
  const ahora = new Date().toISOString();
  let tocados = 0;
  for (const id of ids) {
    const { error } = await tabla('messages').update({ read_at: ahora }).eq('id', id);
    if (error) throw new Error(`messages: ${error.message}`);
    const enMemoria = mensajes.find((m) => m.id === id);
    if (enMemoria) enMemoria.read_at = ahora;
    tocados++;
  }
  return tocados;
}

/** El espejo del arreglo del simulado. Aquí no se lee: sólo se escribe. */
export const ciudadesPedidas: { profile_id: string | null; nombre: string; provincia: string | null }[] = [];

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

/**
 * EDITAR UN VIAJE POR FIN ESCRIBE EN LA BASE (02-09-2026). `guardarEdicion`
 * mutaba `fuente.viajes[i]` a pelo: en simulado daba igual —todo es
 * memoria—, pero contra Supabase el conductor «guardaba» sus puestos y al
 * recargar la app el viaje volvía como estaba. La política de 0023 (el
 * conductor escribe su fila) ya lo amparaba; faltaba llamarla.
 */
export async function actualizarViaje(id: string, cambios: Partial<ViajeFila>): Promise<ViajeFila> {
  const { data, error } = await tabla('trips').update(cambios).eq('id', id).select().single();
  if (error) throw new Error(`trips: ${error.message}`);
  const i = viajes.findIndex((v) => v.id === id);
  if (i >= 0) viajes[i] = data as ViajeFila;
  return data as ViajeFila;
}

export async function actualizarReserva(id: string, cambios: Partial<ReservaFila>): Promise<ReservaFila> {
  const { data, error } = await tabla('bookings').update(cambios).eq('id', id).select().single();
  if (error) throw new Error(`bookings: ${error.message}`);
  const i = reservas.findIndex((r) => r.id === id);
  if (i >= 0) reservas[i] = data as ReservaFila;
  /* Aceptar, rechazar y cerrar cambian lo que la otra parte tiene que saber:
     el trigger de 0040 le escribe su aviso, y la bandeja de este lado lo
     deriva del hecho recién copiado en `reservas`. */
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
 * Leído se escribe donde vive el aviso. Una fila de `notifications` guarda
 * su `read_at` en la base — es la ÚNICA columna que la 0040 concede — y así
 * la marca sobrevive a la recarga. Si el aviso no está aquí es un derivado
 * sin fila: se devuelve null y `servicios/avisos.ts` lo apunta en memoria.
 * Si la base rechaza la marca (la migración sin correr), la memoria basta:
 * leer no es un hecho que justifique tumbar nada.
 */
export async function marcarAvisoLeido(id: string): Promise<AvisoPendiente | null> {
  const i = avisos.findIndex((a) => a.id === id);
  if (i < 0) return null;
  const ahora = new Date().toISOString();
  avisos[i] = { ...avisos[i], read_at: ahora };
  try {
    await tabla('notifications').update({ read_at: ahora }).eq('id', id).select().single();
  } catch {
    /* en memoria ya quedó */
  }
  return avisos[i];
}

export async function marcarTodosLeidos(perfilId: string): Promise<number> {
  const ahora = new Date().toISOString();
  let n = 0;
  for (let i = 0; i < avisos.length; i += 1) {
    if (avisos[i].profile_id === perfilId && !avisos[i].read_at) {
      avisos[i] = { ...avisos[i], read_at: ahora };
      try {
        await tabla('notifications').update({ read_at: ahora }).eq('id', avisos[i].id).select().single();
      } catch {
        /* en memoria ya quedó */
      }
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

/**
 * LA CIUDAD QUE SE DIJO AL REGISTRARSE (28-08-2026).
 *
 * `registrarse` la manda en `options.data`, y el disparador `handle_new_user`
 * de la 0044 la copia a `profiles.home_city_id`. **Pero el disparador puede
 * no estar** —la migración se aplica a mano— y entonces la persona contesta
 * «¿de dónde sales?» en el registro y la app se lo vuelve a preguntar en el
 * inicio, como si no hubiera dicho nada.
 *
 * El dato no se pierde: sigue en los metadatos de la cuenta. Esto lo lee de
 * ahí para que la app se cure sola, aplicada la 0044 o no.
 */
export async function ciudadDelRegistro(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  const meta = data.user?.user_metadata as { home_city_id?: string } | undefined;
  return meta?.home_city_id ?? null;
}
