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
 * **No hay tabla `notifications`.** El diseño da los avisos por hechos y la
 * base no guarda ninguno, así que aquí no hay nada que traer. La bandeja sale
 * vacía, que es la verdad, en vez de enseñar avisos inventados.
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
      traer<RutinaFila>('routines', rutinas),
      traer<CancellationPolicy>('cancellation_policies', politicas),
      // Los perfiles vienen de la vista: nombre, inicial, foto y poco más. El
      // teléfono y el apellido entero se quedan donde deben.
      traer<Profile>('perfiles_publicos', perfiles),
      cargarCategorias(),
      cargarParadasDeRuta(),
    ]);
    calcularReputacion();
  })();
  return enCurso;
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
export const guardarReserva = (r: ReservaFila) => insertar('bookings', r, reservas);
export const guardarPago = (p: Payment) => insertar('payments', p, pagos);
export const guardarCancelacion = (c: Cancellation) => insertar('cancellations', c, cancelaciones);
export const guardarReembolso = (r: Refund) => insertar('refunds', r, reembolsos);
export const guardarIncidencia = (i: Incident) => insertar('incidents', i, incidencias);

export async function actualizarReserva(id: string, cambios: Partial<ReservaFila>): Promise<ReservaFila> {
  const { data, error } = await tabla('bookings').update(cambios).eq('id', id).select().single();
  if (error) throw new Error(`bookings: ${error.message}`);
  const i = reservas.findIndex((r) => r.id === id);
  if (i >= 0) reservas[i] = data as ReservaFila;
  return data as ReservaFila;
}

/** Sin tabla de avisos no hay nada que marcar. */
export const marcarAvisoLeido = async (_id: string): Promise<AvisoPendiente | null> => null;
export const marcarTodosLeidos = async (_perfilId: string): Promise<number> => 0;

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
