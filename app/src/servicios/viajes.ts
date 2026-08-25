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
import { soloCiudad, soloPunto } from '@/dominio/comoSeLlama';
import { type Lugar, distanciaKm as kmEntrePuntos } from '@/dominio/lugar';
import type { AvailableTrip, Corridor, TripStop, Vehicle, ViajeFila } from '@/tipos';

import { nuevoId } from './_id';
import { recordarLugar } from './lugaresDeLaGente';
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
  /** Las dos condiciones del carro. Migración 0029. */
  allows_pets: boolean;
  allows_smoking: boolean;
  origin_label: string | null;
  destination_label: string | null;
  /** De la vista `driver_ratings`. Nula si todavía no lo ha calificado nadie. */
  driver_rating: number | null;
};

export type Filtros = {
  aceptaMaletas?: boolean;
  /** Quien viaja con su perro no puede subirse a un carro que no los lleva. */
  aceptaMascotas?: boolean;
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
  /* Por corredor cuando lo hay — y por las CIUDADES del viaje cuando no:
     un viaje de ruta libre no cuelga de ningún corredor (0022) y aun así
     tiene que aparecer donde se le busca. Es el espejo del LEFT JOIN de
     `available_trips` (0031). */
  const corredor = corredorDe(origen, destino);
  const idOrigen = fuente.ciudades.find((c) => c.slug === origen)?.id ?? null;
  const idDestino = fuente.ciudades.find((c) => c.slug === destino)?.id ?? null;
  if (!corredor && (!idOrigen || !idDestino)) return demora([]);

  const encontrados = fuente.viajes
    .filter(
      (v) =>
        (corredor != null && v.corridor_id === corredor.id) ||
        (v.origin_city_id === idOrigen && v.destination_city_id === idDestino),
    )
    .filter((v) => v.status === 'published')
    .filter((v) => diaEnPanama(v.departure_at) === fecha)
    .filter((v) => (filtros.aceptaMaletas ? v.accepts_luggage : true))
    .filter((v) => (filtros.aceptaMascotas ? v.allows_pets : true))
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

/**
 * El slug de la ciudad a la que va el viaje.
 *
 * `destination_label` es texto para leer —«Chitré · Parque Unión»—, no una
 * clave: el dibujo del campo y la fotografía se eligen por el slug, y sacarlo
 * del texto sería adivinarlo. Se saca del corredor, que es quien lo sabe.
 */
export function slugDestinoDe(viaje: ViajeFila): string | null {
  const corredor = fuente.corredores.find((c) => c.id === viaje.corridor_id);
  if (!corredor) return null;
  return fuente.ciudades.find((x) => x.id === corredor.destination_city_id)?.slug ?? null;
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
export async function rutasPopulares(limite = 6): Promise<RutaPopular[]> {
  const rutas = fuente.corredores
    /* Antes solo salían los marcados como prioritarios, y eran dos. Una
       pantalla de inicio con dos destinos no dice a dónde llevamos: los
       prioritarios van delante, y detrás el resto de corredores abiertos. */
    .filter((c) => c.is_active)
    .sort((a, b) => Number(b.is_priority) - Number(a.is_priority))
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
  /** La llegada estimada, para poder decir «19:00 → 22:30». Nula si falta. */
  llegada: string | null;
  destino: string;
  /** El punto exacto de recogida, sin la ciudad: «Albrook». */
  recogida: string;
  aporteCentavos: number;
  /** El slug de la ciudad, que es como se encuentra su fotografía. */
  foto: string;
  /** Quién maneja: una salida sin nombre no invita a nadie a subirse. */
  conductor: string;
  calificacion: number | null;
  /** Cuántos viajes lleva hechos: es la otra mitad de la confianza. */
  viajesHechos: number;
  /** Sin paradas intermedias incluidas: se va directo. */
  directo: boolean;
  puestosLibres: number;
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
      /* Un bloc de découverte dit la VILLE : « Albrook » ne dit rien à qui
         n'habite pas la capitale. La règle est dans `comoSeLlama`. */
      const ciudad = fuente.ciudades.find((c) => c.id === v.destination_city_id);
      const destino = soloCiudad(ciudad?.name, v.destination_label);
      const salida = fuente.ciudades.find((c) => c.id === v.origin_city_id);
      const p = fuente.perfiles.find((x) => x.id === v.driver_id);
      return {
        viajeId: v.id,
        hora: v.departure_at,
        llegada: v.arrival_estimate_at ?? null,
        destino,
        /* Le point exact SANS sa ville : le titre du bloc dit déjà « desde
           Panamá », et « Chitré · Ciudad de Panamá · Albrook » se lisait comme
           trois lieux à la file. */
        recogida: soloPunto(salida?.name, v.origin_label),
        aporteCentavos: v.price_cents,
        foto: ciudad?.slug ?? '',
        conductor: p ? `${p.first_name} ${p.last_initial ?? ''}`.trim() : '',
        calificacion: fuente.reputacion[v.driver_id]?.calificacion ?? null,
        viajesHechos: fuente.reputacion[v.driver_id]?.viajes ?? 0,
        directo: !fuente.paradas.some((x) => x.trip_id === v.id),
        puestosLibres: v.seats_offered - contarVendidos(v.id),
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

  /* Un bloc de découverte nomme la VILLE. Celle où les voyages arrivent
     vraiment, qui n'est pas toujours celle du couloir : le couloir
     panama-coronado sert aussi Río Hato. */
  const comun = suyos
    .map((v) => ciudadDestino(v))
    .find((nombre, _i, todas) => nombre && todas.filter((x) => x === nombre).length > 1);

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
  /** Null en ruta libre: el viaje no cuelga de ningún corredor (0022). */
  corredor: Corridor | null;
  /** La ciudad de cada extremo, resuelta al preparar — en ruta libre no hay
      corredor que la sepa después. Null si el extremo no es ciudad servida. */
  origenCiudadId: string | null;
  destinoCiudadId: string | null;
  /** El punto exacto de cada extremo, si el lugar elegido lo traía. */
  origenPunto: { lat: number; lng: number } | null;
  destinoPunto: { lat: number; lng: number } | null;
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
  /** Falso cuando el cálculo va con el sedán de referencia porque esta
   *  persona todavía no ha registrado su carro. La pantalla lo dice y no
   *  deja publicar. */
  carroPropio: boolean;
};

export async function prepararPublicacion(
  conductorId: string,
  corredorSlug: string,
  salida: string,
  /**
   * LA RUTA LIBRE TAMBIÉN SE PUBLICA. Decidido el 24-08-2026: «all routes
   * shall be opened». Antes, un par sin corredor solo podía guardarse; la
   * base lo permite desde 0022 (`corridor_id` nullable) y la búsqueda lo
   * encuentra desde 0031 (LEFT JOIN). Sin corredor, los kilómetros salen de
   * las coordenadas por el factor de carretera y los peajes van en cero —
   * desconocidos no se cobran.
   */
  libre?: { desde: Lugar; hacia: Lugar },
): Promise<PublicacionPreparada> {
  const corredor = fuente.corredores.find((c) => c.slug === corredorSlug) ?? null;
  if (!corredor && !libre) throw new Error(`No conocemos la ruta ${corredorSlug}`);

  /**
   * SIN CARRO TAMBIÉN SE CALCULA.
   *
   * Esto lanzaba «Este conductor no tiene carro registrado» y la pantalla de
   * publicar enseñaba el «esto ya no está aquí». Quien acaba de registrarse
   * ve por primera vez la mitad conductora del producto y lo que recibe es un
   * error: nunca llega a saber cuánto recuperaría, que es justo lo que le
   * haría registrar el carro.
   *
   * Sin carro se calcula con el sedán de referencia —el mismo con el que sale
   * el tope de la ruta— y se dice que es una estimación. La pantalla se
   * encarga de que ese caso no pueda publicar.
   */
  const suyo = fuente.vehiculos.find((v) => v.owner_id === conductorId && v.is_active) ?? null;
  const carro: Vehicle =
    suyo ?? {
      id: 'referencia',
      owner_id: conductorId,
      category_code: 'standard',
      make: 'Sedán',
      model: 'de referencia',
      color: null,
      year: null,
      seats_total: 5,
      plate_last3: null,
      photo_path: null,
      is_active: true,
      rate_per_km_cents: null,
      consumption_l_100km: CONSUMO_L_100KM.standard,
      created_at: new Date().toISOString(),
    };

  /* Los kilómetros y peajes del camino: medidos si hay corredor; de las
     coordenadas por el factor de carretera —y peaje cero— si no. La fórmula
     es la misma; solo cambia de dónde sale la distancia. */
  let distanciaKm: number;
  let peajeCentavos: number;
  let duracionMin: number;
  if (corredor) {
    distanciaKm = Number(corredor.distance_km);
    peajeCentavos = Number(corredor.toll_cents);
    duracionMin = corredor.typical_duration_min ?? 0;
  } else {
    const estimada = estimarRuta(libre!.desde, libre!.hacia);
    if (!estimada) {
      throw new Error('A este par le faltan coordenadas para estimar la distancia.');
    }
    distanciaKm = estimada.distanciaKm;
    peajeCentavos = 0;
    duracionMin = estimada.duracionMin;
  }

  const consumo = consumoDe(carro);
  const costo = costoDelViaje({ distanciaKm, peajeCentavos, consumoL100km: consumo });

  // El tope es de la ruta: se calcula con el carro de referencia, no con el suyo.
  const costoDeReferencia = costoDelViaje({
    distanciaKm,
    peajeCentavos,
    consumoL100km: CONSUMO_L_100KM.standard,
  });

  const ciudadId = (slug: string | null | undefined) =>
    slug ? (fuente.ciudades.find((c) => c.slug === slug)?.id ?? null) : null;
  const punto = (l: Lugar | undefined) =>
    l && l.lat != null && l.lng != null ? { lat: l.lat, lng: l.lng } : null;

  return demora({
    corredor,
    origenCiudadId: corredor ? corredor.origin_city_id : ciudadId(libre?.desde.citySlug),
    destinoCiudadId: corredor ? corredor.destination_city_id : ciudadId(libre?.hacia.citySlug),
    origenPunto: corredor ? null : punto(libre?.desde),
    destinoPunto: corredor ? null : punto(libre?.hacia),
    carro,
    carroPropio: suyo != null,
    placa: fuente.placasCompletas[carro.id] ?? '',
    /* De las ciudades del corredor y no escrito a mano: aquí ponía siempre
       «Albrook · Terminal» y «Chitré · Parque Unión», así que publicar
       Panamá → David dejaba un viaje que decía ir a Chitré. En ruta libre,
       el lugar TAL COMO el conductor lo eligió (0022: origin_label). */
    origen: corredor ? nombreDeCiudadDe(corredor.origin_city_id) : libre!.desde.nombre,
    destino: corredor ? nombreDeCiudadDe(corredor.destination_city_id) : libre!.hacia.nombre,
    salida,
    distanciaKm,
    duracionMin,
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
  /** Vacío en ruta libre: entonces mandan `desde` y `hacia`. */
  corredorSlug: string;
  /** Los dos extremos de una ruta libre, tal como se eligieron. */
  desde?: Lugar | null;
  hacia?: Lugar | null;
  salida: string;
  /** Cuántas paradas de las ofrecidas van incluidas, en orden. */
  paradas: number;
  puestos: number;
  /** null = usar el calculado. */
  aporteCentavos: number | null;
  aceptaMaletas: boolean;
  soloMujeres: boolean;
  /** Las dos condiciones del carro, no del pasajero. Ver migración 0029. */
  aceptaMascotas: boolean;
  sePuedeFumar: boolean;
};

export async function publicarViaje(borrador: BorradorDePublicacion): Promise<ViajeFila> {
  const preparada = await prepararPublicacion(
    borrador.conductorId,
    borrador.corredorSlug,
    borrador.salida,
    borrador.desde && borrador.hacia ? { desde: borrador.desde, hacia: borrador.hacia } : undefined,
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
    corridor_id: preparada.corredor?.id ?? null,
    departure_at: borrador.salida,
    /* La llegada estimada se guarda: sin ella los resultados no pueden
       decir cuánto dura el viaje ni a qué hora llegas. */
    arrival_estimate_at: new Date(
      new Date(borrador.salida).getTime() + (preparada.duracionMin ?? 0) * 60_000,
    ).toISOString(),
    seats_offered: borrador.puestos,
    price_cents: aporte,
    gender_preference: borrador.soloMujeres ? 'women_only' : 'any',
    notes: null,
    status: 'published',
    price_rule_id: '6ad0a57f-ec7c-4a83-b331-523af650584e',
    snap_distance_km: preparada.distanciaKm,
    snap_rate_per_km_cents: Math.round(preparada.costoCentavos / preparada.distanciaKm),
    // Ruta libre: peaje desconocido no se cobra, y la prueba lo dice.
    snap_toll_cents: preparada.corredor ? Number(preparada.corredor.toll_cents) : 0,
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
    /* LA VILLE SE FIXE ICI, en publiant, où on sait encore ce qui a été
       choisi. Après, personne ne peut plus la deviner : « Albrook » ne dit
       pas « Ciudad de Panamá ». Migration 0031. */
    origin_city_id: preparada.origenCiudadId,
    destination_city_id: preparada.destinoCiudadId,
    origin_lat: preparada.origenPunto?.lat ?? null,
    origin_lng: preparada.origenPunto?.lng ?? null,
    destination_lat: preparada.destinoPunto?.lat ?? null,
    destination_lng: preparada.destinoPunto?.lng ?? null,
    accepts_luggage: borrador.aceptaMaletas,
    allows_pets: borrador.aceptaMascotas,
    allows_smoking: borrador.sePuedeFumar,
  };

  const guardado = await fuente.guardarViaje(viaje);

  /**
   * LE CATALOGUE APPREND CE QUE LE CONDUCTEUR A ÉCRIT.
   *
   * C'est ici et pas dans le champ de recherche : ce qui compte est
   * l'engagement, pas la frappe. Quelqu'un qui publie un trajet depuis
   * « PH Torre Mistral » dit que ce point existe et qu'on peut s'y arrêter.
   *
   * Sans `await` et sans conséquence : publier ne doit jamais échouer
   * parce que le catalogue n'a pas pu retenir un nom. Le lieu reste
   * invisible aux autres jusqu'à ce qu'une deuxième personne s'en serve —
   * la règle vit dans la base, migration 0035.
   */
  /* Con su punto cuando lo hay: la regla del 24-08 — sin coordenadas no se
     crea lugar, solo se cuenta el uso de uno que ya exista (0036). */
  void recordarLugar(preparada.origen, ciudadSlugDe(viaje.origin_city_id), preparada.origenPunto);
  void recordarLugar(
    preparada.destino,
    ciudadSlugDe(viaje.destination_city_id),
    preparada.destinoPunto,
  );

  /**
   * Y SUS PARADAS. Publicar escribía el viaje y no las paradas, así que un
   * viaje recién publicado enseñaba la tarjeta «ruta del viaje» en blanco:
   * sin `trip_stops` no hay ni de dónde sale ni dónde termina, y `7a` no
   * tenía primera parada que proponerle al pasajero.
   *
   * La primera y la última son las ciudades del corredor; las de en medio,
   * las que el conductor dejó puestas, en su orden. Máximo cuatro puntos de
   * recogida por viaje, que es la regla del producto.
   */
  const intermedias = preparada.paradasOfrecidas.slice(0, Math.min(borrador.paradas, 2));
  const salidaMs = new Date(borrador.salida).getTime();
  const enPunto = (min: number) => new Date(salidaMs + min * 60_000).toISOString();

  const deLaRuta: TripStop[] = [
    { etiqueta: preparada.origen, minutos: 0, tipo: 'origin' as const },
    ...intermedias.map((p) => ({ etiqueta: p.nombre, minutos: p.minutos, tipo: 'waypoint' as const })),
    {
      etiqueta: preparada.destino,
      minutos: preparada.duracionMin + intermedias.length * 5,
      tipo: 'destination' as const,
    },
  ].map((p, i) => ({
    id: nuevoId(),
    trip_id: viaje.id,
    pickup_point_id: null,
    custom_label: p.etiqueta,
    sequence: i,
    kind: p.tipo,
    scheduled_at: enPunto(p.minutos),
    lat: null,
    lng: null,
    place_id: null,
    created_at: ahora,
  }));

  for (const parada of deLaRuta) await fuente.guardarParada(parada);

  return demora(guardado);
}

/**
 * Las rutas que un conductor puede publicar hoy: las que servimos, con su
 * nombre ya escrito. `5c` tenía el corredor fijo en una constante del
 * archivo, así que solo se podía publicar Panamá → Chitré.
 */
export type RutaPublicable = {
  slug: string;
  origen: string;
  destino: string;
  /** Los slugs de ciudad, para casar con lo que eligen los campos de lugar. */
  origenSlug: string;
  destinoSlug: string;
  distanciaKm: number;
  duracionMin: number;
};

export function rutasPublicables(): RutaPublicable[] {
  const slugDe = (id: string) => fuente.ciudades.find((c) => c.id === id)?.slug ?? '';
  return fuente.corredores
    .filter((c) => c.is_active)
    .map((c) => ({
      slug: c.slug,
      origen: nombreDeCiudadDe(c.origin_city_id),
      destino: nombreDeCiudadDe(c.destination_city_id),
      origenSlug: slugDe(c.origin_city_id),
      destinoSlug: slugDe(c.destination_city_id),
      distanciaKm: Number(c.distance_km),
      duracionMin: c.typical_duration_min ?? 0,
    }))
    .sort((a, b) => a.destino.localeCompare(b.destino));
}

/* ══════════════════════════════════════════════════════════════════════
   LA RUTA LIBRE — el aporte exacto de un camino que la lista no trae.
   ══════════════════════════════════════════════════════════════════════ */

/**
 * Del camino entre dos LADOS de la carretera a la cifra en kilómetros: la
 * distancia en línea recta por el factor de carretera.
 *
 * 1,65 y no el 1,3 «clásico», porque el 1,3 es de mapas europeos y aquí se
 * puede MEDIR: Panamá → Chitré son 151 km en línea recta y 250 por
 * carretera — la Interamericana bordea el golfo antes de bajar a Azuero —
 * o sea un factor real de 1,655. Con 1,3 el estimado quedaba un 35 % corto
 * (245 km para Playa Venao → Panamá, que anda por los 330 reales): un tope
 * corto hace que el conductor pague más que su parte, y la equivocación
 * barata es la contraria. Se dice «aproximado» en pantalla porque lo es.
 */
const FACTOR_DE_CARRETERA = 1.65;
/** A cuánto se avanza de media entre ciudades, para estimar la duración. */
const KM_POR_HORA = 65;

export type EstimacionDeRuta = {
  /** El corredor abierto que casa con ese par, si existe. */
  corredorSlug: string | null;
  distanciaKm: number;
  duracionMin: number;
  costoCentavos: number;
  topeCentavos: number;
  aporteCentavos: number;
  /** true cuando sale de coordenadas y no de un corredor medido. */
  esAproximada: boolean;
};

/**
 * El cálculo de un camino cualquiera, con la MISMA fórmula de siempre —
 * `(km × tarifa × 1,10 + peajes) ÷ (puestos + 1)` — para que elegir un punto
 * fuera de la lista nunca cambie las reglas del precio (R1 y R3: la fórmula
 * no mira ni la demanda ni la fecha, solo la distancia).
 *
 * Si el par casa con un corredor abierto, mandan los kilómetros y peajes
 * medidos del corredor. Si no, la distancia sale de las coordenadas por el
 * factor de carretera, los peajes se quedan en cero —desconocidos no se
 * cobran— y todo se marca aproximado. Sin coordenadas no hay estimación.
 */
export function estimarRuta(desde: Lugar, hacia: Lugar, puestos = 3): EstimacionDeRuta | null {
  if (desde.citySlug && hacia.citySlug) {
    const corredor = corredorDe(desde.citySlug, hacia.citySlug);
    if (corredor) {
      const costo = costoDelViaje({
        distanciaKm: Number(corredor.distance_km),
        peajeCentavos: Number(corredor.toll_cents),
        consumoL100km: CONSUMO_L_100KM.standard,
      });
      const tope = topeDeRuta(costo);
      return {
        corredorSlug: corredor.slug,
        distanciaKm: Number(corredor.distance_km),
        duracionMin: corredor.typical_duration_min ?? 0,
        costoCentavos: costo,
        topeCentavos: tope,
        aporteCentavos: aporteCalculado(costo, puestos, tope),
        esAproximada: false,
      };
    }
  }

  /* Un lugar del catálogo puede llegar sin coordenadas —una fila de ciudad
     convertida a mano—: las 32 ciudades del almacén las tienen, así que se
     completan desde ahí antes de rendirse. */
  const conCoordenadas = (l: Lugar): { lat: number; lng: number } | null => {
    if (l.lat != null && l.lng != null) return { lat: l.lat, lng: l.lng };
    const ciudad = l.citySlug ? fuente.ciudades.find((c) => c.slug === l.citySlug) : null;
    if (ciudad?.lat != null && ciudad?.lng != null) return { lat: ciudad.lat, lng: ciudad.lng };
    return null;
  };
  const a = conCoordenadas(desde);
  const b = conCoordenadas(hacia);
  if (!a || !b) return null;

  const km = Math.max(1, Math.round(kmEntrePuntos(a, b) * FACTOR_DE_CARRETERA));
  const costo = costoDelViaje({
    distanciaKm: km,
    peajeCentavos: 0,
    consumoL100km: CONSUMO_L_100KM.standard,
  });
  const tope = topeDeRuta(costo);
  return {
    corredorSlug: null,
    distanciaKm: km,
    duracionMin: Math.round(((km / KM_POR_HORA) * 60) / 5) * 5,
    costoCentavos: costo,
    topeCentavos: tope,
    aporteCentavos: aporteCalculado(costo, puestos, tope),
    esAproximada: true,
  };
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

/** El nombre de una ciudad por su identificador, o cadena vacía. */
function nombreDeCiudadDe(ciudadId: string): string {
  return fuente.ciudades.find((c) => c.id === ciudadId)?.name ?? '';
}

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
    allows_pets: v.allows_pets,
    allows_smoking: v.allows_smoking,
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
    /* La ville à côté de l'étiquette, jamais à sa place : les blocs de
       découverte lisent l'une, la page d'offres écrit les deux. */
    origin_city: ciudadDe(v.origin_city_id),
    destination_city: ciudadDe(v.destination_city_id),
    origin_city_slug: slugDe(v.origin_city_id),
    destination_city_slug: slugDe(v.destination_city_id),
    driver_rating: fuente.reputacion[v.driver_id]?.calificacion ?? null,
  };
}

/** Le nom de la ville, ou rien : `comoSeLlama` sait retomber sur l'étiquette. */
const ciudadDe = (id: string | null): string | null =>
  fuente.ciudades.find((c) => c.id === id)?.name ?? null;

/**
 * LES DEUX VILLES D'UN VOYAGE. Depuis 0031 elles sont sur la ligne ; ceci
 * évite que chaque écran refasse la jointure à la main — et surtout que
 * quelqu'un retombe dans `origin_label.split(' · ')[0]`, qui rendait
 * « Albrook » là où il fallait lire « Ciudad de Panamá ».
 */
export function ciudadesDelViaje(viaje: ViajeFila): { origen: string | null; destino: string | null } {
  return {
    origen: ciudadDe(viaje.origin_city_id),
    destino: ciudadDe(viaje.destination_city_id),
  };
}

/** La ville de départ, pour tout ce qui n'est ni la page d'offres ni le détail. */
export const ciudadOrigen = (viaje: ViajeFila): string =>
  soloCiudad(ciudadDe(viaje.origin_city_id), viaje.origin_label);

export const ciudadDestino = (viaje: ViajeFila): string =>
  soloCiudad(ciudadDe(viaje.destination_city_id), viaje.destination_label);

/**
 * « Ciudad de Panamá → Chitré ». La ligne que lisent le chat, les avis, les
 * demandes, l'aide et les notes : partout où on RÉSUME un voyage, on nomme les
 * villes. Le point exact n'apparaît qu'au moment de choisir.
 */
export const rutaCorta = (viaje: ViajeFila): string =>
  `${ciudadOrigen(viaje)} → ${ciudadDestino(viaje)}`;

const slugDe = (id: string | null): string | null =>
  fuente.ciudades.find((c) => c.id === id)?.slug ?? null;

/** Le slug de la ville d'un bout de trajet, pour rattacher le lieu appris. */
const ciudadSlugDe = (id: string | null): string | null => slugDe(id);
