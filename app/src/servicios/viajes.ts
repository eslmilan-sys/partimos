/**
 * Viajes: buscar, ver y publicar.
 *
 * Las firmas son las definitivas. Por dentro, hoy, datos simulados con la forma
 * exacta de las tablas.
 */

import {
  CONSUMO_L_100KM,
  type CategoriaVehiculo,
  aporteCalculado,
  costoDelViaje,
  loQuePonesDeTuBolsillo,
  loQueRecuperas,
  topeDeRuta,
} from '@/dominio/aporte';
import type { AvailableTrip, Corridor, TripStop, Vehicle, ViajeFila } from '@/tipos';

import { fuente } from './_fuente';

const demora = <T,>(valor: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(valor), ms));

const diaPanama = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'America/Panama',
});

/** El día de un viaje es el de Panamá, no el del teléfono ni el UTC. */
export function diaEnPanama(cuando: string | Date): string {
  return diaPanama.format(new Date(cuando));
}

/**
 * Una fila de `available_trips` más lo que la vista todavía no expone: el
 * booleano de maletas y las etiquetas de origen y destino, que sí están en
 * `trips`.
 */
export type ViajeEnResultados = AvailableTrip & {
  accepts_luggage: boolean;
  origin_label: string | null;
  destination_label: string | null;
  /** De la vista `driver_ratings`. Nula si todavía no lo ha calificado nadie. */
  driver_rating: number | null;
};

export type Filtros = {
  aceptaMaletas?: boolean;
  soloMujeres?: boolean;
  /** Quien paga con Yappy no quiere ver viajes que solo aceptan efectivo. */
  yappy?: boolean;
  /** El orden de `1b`: «más temprano primero» o el aporte más bajo. */
  orden?: Orden;
};

export type Orden = 'temprano' | 'barato';

/** Lo que la pantalla escribe debajo del titular. */
export const COMO_SE_ORDENA: Record<Orden, string> = {
  temprano: 'más temprano primero',
  barato: 'el aporte más bajo primero',
};

/**
 * Busca viajes publicados en una ruta y una fecha.
 * `origen` y `destino` son slugs de ciudad; `fecha` es 'AAAA-MM-DD'.
 */
export async function buscarViajes(
  origen: string,
  destino: string,
  fecha: string,
  filtros: Filtros = {},
): Promise<ViajeEnResultados[]> {
  const corredor = corredorDe(origen, destino);
  if (!corredor) return demora([]);

  const encontrados = fuente.viajes
    .filter((v) => v.corridor_id === corredor.id)
    .filter((v) => v.status === 'published')
    .filter((v) => diaEnPanama(v.departure_at) === fecha)
    .filter((v) => (filtros.aceptaMaletas ? v.accepts_luggage : true))
    .filter((v) => (filtros.soloMujeres ? v.gender_preference === 'women_only' : true))
    .filter((v) => (filtros.yappy ? v.accepts_yappy_direct : true))
    .map(comoResultado)
    // un viaje lleno no es un resultado
    .filter((v) => (v.seats_available ?? 0) > 0)
    .sort((a, b) => {
      const hora = (a.departure_at ?? '').localeCompare(b.departure_at ?? '');
      if (filtros.orden !== 'barato') return hora;
      return (a.price_cents ?? 0) - (b.price_cents ?? 0) || hora;
    });

  return demora(encontrados);
}

/**
 * El primer día, desde hoy, con salidas publicadas en esa ruta. Es lo que la
 * pantalla de resultados enseña cuando nadie ha elegido fecha todavía: más
 * útil que un «hoy» vacío.
 */
export async function proximoDiaConViajes(
  origen: string,
  destino: string,
  desde = new Date(),
): Promise<string> {
  const corredor = corredorDe(origen, destino);
  const hoy = diaEnPanama(desde);
  if (!corredor) return demora(hoy, 0);

  const dias = fuente.viajes
    .filter((v) => v.corridor_id === corredor.id && v.status === 'published')
    .filter((v) => v.seats_offered > contarVendidos(v.id))
    .map((v) => diaEnPanama(v.departure_at))
    .filter((d) => d >= hoy)
    .sort();

  return demora(dias[0] ?? hoy, 0);
}

export async function obtenerViaje(viajeId: string): Promise<ViajeFila | null> {
  return demora(fuente.viajes.find((v) => v.id === viajeId) ?? null);
}

export async function paradasDelViaje(viajeId: string): Promise<TripStop[]> {
  return demora(fuente.paradas.filter((p) => p.trip_id === viajeId).sort((a, b) => a.sequence - b.sequence));
}

/* ------------------------------------------------------------------ *
 * Inicio — pantalla `3a`
 * ------------------------------------------------------------------ */

export type RutaPopular = {
  slug: string;
  origen: string;
  destino: string;
  /** El aporte más barato publicado hoy en esa ruta. */
  desdeCentavos: number;
  foto: string;
};

/** `corridors.is_priority` marca las rutas que el producto empuja. */
export async function rutasPopulares(limite = 2): Promise<RutaPopular[]> {
  const rutas = fuente.corredores
    .filter((c) => c.is_priority && c.is_active)
    .slice(0, limite)
    .map((c) => {
      const destino = fuente.ciudades.find((x) => x.id === c.destination_city_id);
      const publicados = fuente.viajes
        .filter((v) => v.corridor_id === c.id && v.status === 'published')
        .map((v) => v.price_cents);
      return {
        slug: c.slug,
        origen: 'Panamá',
        destino: destino?.name ?? '',
        desdeCentavos: publicados.length
          ? Math.min(...publicados)
          : aporteDeReferencia(c),
        foto: destino?.slug ?? '',
      };
    });
  return demora(rutas);
}

/* ------------------------------------------------------------------ *
 * Bienvenida — pantalla `1a`
 * ------------------------------------------------------------------ */

export type SalidaCercana = {
  viajeId: string;
  hora: string;
  destino: string;
  aporteCentavos: number;
  /** El slug de la ciudad, que es como se encuentra su fotografía. */
  foto: string;
};

/**
 * Las salidas que enseña `1a` **sin pedir cuenta**. Es la promesa entera del
 * recorrido del pasajero en una pantalla: hay gente saliendo ahora, y para
 * verlo no hace falta registrarse.
 */
export async function proximasSalidas(limite = 3, ventanaMin = 60): Promise<SalidaCercana[]> {
  const ahora = Date.now();
  const hasta = ahora + ventanaMin * 60_000;
  const salidas = fuente.viajes
    // La pantalla promete «salen en la próxima hora»: la ventana la cumple.
    .filter((v) => v.status === 'published')
    .filter((v) => {
      const t = new Date(v.departure_at).getTime();
      return t >= ahora && t <= hasta;
    })
    .filter((v) => v.seats_offered > contarVendidos(v.id))
    .sort((a, b) => a.departure_at.localeCompare(b.departure_at))
    .slice(0, limite)
    .map((v) => {
      const destino = (v.destination_label ?? '').split(' · ')[0];
      const ciudad = fuente.ciudades.find((c) => c.name === destino);
      return {
        viajeId: v.id,
        hora: v.departure_at,
        destino,
        aporteCentavos: v.price_cents,
        foto: ciudad?.slug ?? '',
      };
    });
  return demora(salidas);
}

/* ------------------------------------------------------------------ *
 * Una ruta con su fotografía — pantalla `3c`
 * ------------------------------------------------------------------ */

export type ResumenDeRuta = {
  slug: string;
  origen: string;
  destino: string;
  /** El slug de la ciudad, que es como se encuentra su fotografía. */
  foto: string;
  distanciaKm: number;
  duracionMin: number;
  cuantosViajes: number;
  /** «Fin de semana · 2 pasajeros», el contexto de la búsqueda. */
  contexto: string;
};

/**
 * La cabecera de `3c`: la ruta entera con su fotografía detrás. Se enseña
 * cuando el destino ya está elegido, que es cuando una foto informa en vez de
 * decorar.
 */
export async function resumenDeRuta(corredorSlug: string, pasajeros = 1): Promise<ResumenDeRuta> {
  const c = fuente.corredores.find((x) => x.slug === corredorSlug);
  if (!c) throw new Error(`No conocemos la ruta ${corredorSlug}`);

  const destino = fuente.ciudades.find((x) => x.id === c.destination_city_id);
  const origen = fuente.ciudades.find((x) => x.id === c.origin_city_id);
  const suyos = fuente.viajes.filter((v) => v.corridor_id === c.id && v.status === 'published');

  // El nombre que se enseña es el del sitio al que se llega de verdad —«Playa
  // Blanca»—, no el de la ciudad del corredor. Es el que dicen los viajes.
  const comun = suyos
    .map((v) => (v.destination_label ?? '').split(' · ')[0])
    .find((etiqueta, _i, todas) => todas.filter((x) => x === etiqueta).length > 1);

  return demora({
    slug: c.slug,
    origen: origen?.name === 'Ciudad de Panamá' ? 'Panamá' : (origen?.name ?? ''),
    destino: comun ?? destino?.name ?? '',
    foto: destino?.slug ?? '',
    distanciaKm: Number(c.distance_km),
    duracionMin: c.typical_duration_min ?? 0,
    cuantosViajes: suyos.length,
    contexto: `Fin de semana · ${pasajeros} ${pasajeros === 1 ? 'pasajero' : 'pasajeros'}`,
  });
}

export type GanchoDeConductor = {
  /** Lo que el conductor recupera llevando el carro lleno en esa ruta. */
  recuperasCentavos: number;
  puestos: number;
  destino: string;
};

/** La tarjeta que invita a publicar, en `3a`. La cifra es de un viaje, no del mes. */
export async function ganchoDeConductor(corredorSlug = 'panama-chitre'): Promise<GanchoDeConductor> {
  const corredor = fuente.corredores.find((c) => c.slug === corredorSlug)!;
  const destino = fuente.ciudades.find((x) => x.id === corredor.destination_city_id);
  const puestos = 3;
  const costo = costoDelViaje({
    distanciaKm: Number(corredor.distance_km),
    peajeCentavos: Number(corredor.toll_cents),
    consumoL100km: CONSUMO_L_100KM.standard,
  });
  const aporte = aporteCalculado(costo, puestos, topeDeRuta(costo));
  return demora({
    recuperasCentavos: loQueRecuperas(aporte, puestos),
    puestos,
    destino: destino?.name ?? '',
  });
}

function aporteDeReferencia(c: Corridor): number {
  const costo = costoDelViaje({
    distanciaKm: Number(c.distance_km),
    peajeCentavos: Number(c.toll_cents),
    consumoL100km: CONSUMO_L_100KM.standard,
  });
  return aporteCalculado(costo, 3, topeDeRuta(costo));
}

/* ------------------------------------------------------------------ *
 * Publicar — pantalla `5c`
 * ------------------------------------------------------------------ */

export type ParadaOfrecida = {
  nombre: string;
  /** Minutos desde la salida. La hora se calcula al vuelo con la hora de salida. */
  minutos: number;
};

/** Todo lo que `5c` necesita saber antes de que el conductor toque nada. */
export type PublicacionPreparada = {
  corredor: Corridor;
  carro: Vehicle;
  placa: string;
  origen: string;
  destino: string;
  salida: string;
  distanciaKm: number;
  duracionMin: number;
  costoCentavos: number;
  topeCentavos: number;
  puestosMaximos: number;
  paradasOfrecidas: ParadaOfrecida[];
};

export async function prepararPublicacion(
  conductorId: string,
  corredorSlug: string,
  salida: string,
): Promise<PublicacionPreparada> {
  const corredor = fuente.corredores.find((c) => c.slug === corredorSlug);
  if (!corredor) throw new Error(`No conocemos la ruta ${corredorSlug}`);

  const carro = fuente.vehiculos.find((v) => v.owner_id === conductorId && v.is_active);
  if (!carro) throw new Error('Este conductor no tiene carro registrado');

  const consumo = consumoDe(carro);
  const costo = costoDelViaje({
    distanciaKm: Number(corredor.distance_km),
    peajeCentavos: Number(corredor.toll_cents),
    consumoL100km: consumo,
  });

  // El tope es de la ruta: se calcula con el carro de referencia, no con el suyo.
  const costoDeReferencia = costoDelViaje({
    distanciaKm: Number(corredor.distance_km),
    peajeCentavos: Number(corredor.toll_cents),
    consumoL100km: CONSUMO_L_100KM.standard,
  });

  return demora({
    corredor,
    carro,
    placa: fuente.placasCompletas[carro.id] ?? '',
    origen: 'Albrook · Terminal',
    destino: 'Chitré · Parque Unión',
    salida,
    distanciaKm: Number(corredor.distance_km),
    duracionMin: corredor.typical_duration_min ?? 0,
    costoCentavos: costo,
    topeCentavos: topeDeRuta(costoDeReferencia),
    // el conductor nunca se ofrece a sí mismo: los puestos del carro menos el suyo
    puestosMaximos: Math.max(1, carro.seats_total - 1),
    paradasOfrecidas: (fuente.paradasDeLaRuta[corredorSlug] ?? []).map((p) => ({
      nombre: p.etiqueta,
      minutos: p.minutos,
    })),
  });
}

export type BorradorDePublicacion = {
  conductorId: string;
  carroId: string;
  corredorSlug: string;
  salida: string;
  /** Cuántas paradas de las ofrecidas van incluidas, en orden. */
  paradas: number;
  puestos: number;
  /** null = usar el calculado. */
  aporteCentavos: number | null;
  aceptaMaletas: boolean;
  soloMujeres: boolean;
};

export async function publicarViaje(borrador: BorradorDePublicacion): Promise<ViajeFila> {
  const preparada = await prepararPublicacion(
    borrador.conductorId,
    borrador.corredorSlug,
    borrador.salida,
  );
  const aporte =
    borrador.aporteCentavos ??
    aporteCalculado(preparada.costoCentavos, borrador.puestos, preparada.topeCentavos);

  if (aporte > preparada.topeCentavos) {
    throw new Error('El aporte no puede pasar del tope de la ruta');
  }

  const ahora = new Date().toISOString();
  const viaje: ViajeFila = {
    id: nuevoId(),
    driver_id: borrador.conductorId,
    vehicle_id: borrador.carroId,
    corridor_id: preparada.corredor.id,
    departure_at: borrador.salida,
    arrival_estimate_at: null,
    seats_offered: borrador.puestos,
    price_cents: aporte,
    gender_preference: borrador.soloMujeres ? 'women_only' : 'any',
    notes: null,
    status: 'published',
    price_rule_id: '6ad0a57f-ec7c-4a83-b331-523af650584e',
    snap_distance_km: preparada.distanciaKm,
    snap_rate_per_km_cents: Math.round(preparada.costoCentavos / preparada.distanciaKm),
    snap_toll_cents: Number(preparada.corredor.toll_cents),
    snap_cost_total_cents: preparada.costoCentavos,
    snap_occupants: borrador.puestos + 1,
    snap_max_price_cents: preparada.topeCentavos,
    published_at: ahora,
    completed_at: null,
    cancelled_at: null,
    created_at: ahora,
    updated_at: ahora,
    recurrence: 'none',
    recurrence_parent_id: null,
    accepts_yappy_direct: true,
    accepts_cash: true,
    origin_place_id: null,
    destination_place_id: null,
    origin_label: preparada.origen,
    destination_label: preparada.destino,
    origin_lat: null,
    origin_lng: null,
    destination_lat: null,
    destination_lng: null,
    accepts_luggage: borrador.aceptaMaletas,
  };

  return demora(await fuente.guardarViaje(viaje));
}

/** El reparto que `5c` enseña bajo la cifra y `5d` desglosa. */
export function repartoDelCosto(costoCentavos: number, aporteCentavos: number, puestos: number) {
  const recuperas = loQueRecuperas(aporteCentavos, puestos);
  return {
    costoCentavos,
    recuperasCentavos: recuperas,
    deTuBolsilloCentavos: loQuePonesDeTuBolsillo(costoCentavos, recuperas),
    cubreElViaje: recuperas >= costoCentavos,
  };
}

/* ------------------------------------------------------------------ */

function contarVendidos(viajeId: string): number {
  return fuente.reservas.filter(
    (r) => r.trip_id === viajeId && (r.status === 'confirmed' || r.status === 'completed'),
  ).length;
}

function corredorDe(origen: string, destino: string): Corridor | undefined {
  const ciudad = (slug: string) => fuente.ciudades.find((c) => c.slug === slug)?.id;
  const o = ciudad(origen);
  const d = ciudad(destino);
  return fuente.corredores.find((c) => c.origin_city_id === o && c.destination_city_id === d);
}

function consumoDe(carro: Vehicle): number {
  if (carro.consumption_l_100km != null) return Number(carro.consumption_l_100km);
  return CONSUMO_L_100KM[carro.category_code as CategoriaVehiculo] ?? CONSUMO_L_100KM.standard;
}

function comoResultado(v: ViajeFila): ViajeEnResultados {
  const carro = fuente.vehiculos.find((c) => c.id === v.vehicle_id);
  const conductor = fuente.perfiles.find((p) => p.id === v.driver_id);
  const corredor = fuente.corredores.find((c) => c.id === v.corridor_id);
  const vendidos = fuente.reservas.filter(
    (r) => r.trip_id === v.id && (r.status === 'confirmed' || r.status === 'completed'),
  ).length;

  return {
    id: v.id,
    driver_id: v.driver_id,
    corridor_id: v.corridor_id,
    departure_at: v.departure_at,
    arrival_estimate_at: v.arrival_estimate_at,
    price_cents: v.price_cents,
    gender_preference: v.gender_preference,
    seats_offered: v.seats_offered,
    seats_available: v.seats_offered - vendidos,
    corridor_slug: corredor?.slug ?? null,
    distance_km: corredor?.distance_km ?? null,
    bus_price_cents: corredor?.bus_price_cents ?? null,
    first_name: conductor?.first_name ?? null,
    last_initial: conductor?.last_initial ?? null,
    photo_url: conductor?.photo_url ?? null,
    is_id_verified: conductor?.is_id_verified ?? null,
    make: carro?.make ?? null,
    model: carro?.model ?? null,
    color: carro?.color ?? null,
    category_code: carro?.category_code ?? null,
    year: carro?.year ?? null,
    rate_per_km_cents: carro?.rate_per_km_cents ?? null,
    photo_path: carro?.photo_path ?? null,
    accepts_luggage: v.accepts_luggage,
    origin_label: v.origin_label,
    destination_label: v.destination_label,
    driver_rating: fuente.reputacion[v.driver_id]?.calificacion ?? null,
  };
}

let contador = 0;
function nuevoId(): string {
  contador += 1;
  return `88888888-8888-4888-8888-${String(contador).padStart(12, '0')}`;
}
