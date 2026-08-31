/**
 * Los viajes de cada uno — pantallas `10a` (panel del conductor), `5b` (mis
 * viajes, lado pasajero) y `14d` (editar el viaje).
 *
 * En `10a` las solicitudes pendientes van **ancladas arriba y en rojo, con su
 * caducidad**: son lo único de la pantalla con reloj corriendo, y no
 * responderlas cuesta un puesto.
 *
 * En `14d` lo que un pasajero pagado ha cerrado se enseña **con candado y con
 * el motivo**, no escondido. Cambiar la hora o la ruta de un viaje que alguien
 * ya pagó no es editar: es cancelarle el viaje a otro sin decírselo.
 */

import { soloPunto } from '@/dominio/comoSeLlama';
import type { Lugar } from '@/dominio/lugar';
import type { ViajeFila } from '@/tipos';

import { fuente } from './_fuente';
import { puestosLibresDe } from './solicitudes';
import { ciudadDestino, ciudadOrigen, ciudadesDelViaje, rutaCorta } from './viajes';

const demora = <T,>(valor: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(valor), ms));

/* ------------------------------------------------------- 10a · el panel */

export type ViajePublicado = {
  id: string;
  cuando: string;
  origen: string;
  destino: string;
  horaSalida: string;
  horaLlegada: string;
  puestosVendidos: number;
  puestosOfrecidos: number;
  aporteCentavos: number;
  /** Solicitudes sin responder, con la que expira antes. */
  solicitudes: number;
  expiraLaPrimera: string | null;
  /**
   * EN QUÉ MOMENTO DEL VIAJE VA LA GENTE — para que el panel diga lo que el
   * conductor está haciendo AHORA y no un rótulo fijo.
   *
   * `panel` ofrecía «Abordar · teclear los códigos» en todos los viajes,
   * también en uno donde no había reservado nadie: llevaba a una pantalla que
   * respondía «El viaje está cerrado. Cada aporte ya salió hacia ti», sobre un
   * viaje al que no se ha subido nadie nunca (visto por el dueño el
   * 30-08-2026). Con estas dos cuentas la fila sabe si toca subir gente, si
   * toca cerrar, o si no hay nada que teclear y no debe salir.
   */
  porSubir: number;
  porBajar: number;
  /** Personas con el puesto asegurado: las que de verdad van a bordo. */
  aBordo: number;
  /** Se puede editar mientras nadie haya pagado. */
  editable: boolean;
  /** La hora de salida ya pasó: el viaje está en marcha o terminado. */
  yaSalio: boolean;
  /**
   * ¿Se puede tocar? Nadie ha asegurado su puesto Y todavía no ha salido.
   *
   * Faltaba la segunda mitad (27-08-2026): el panel ofrecía «Editar» sobre un
   * viaje de esta mañana que ya se había hecho. Cambiarle la hora a un viaje
   * que ya pasó no es editar, es reescribir la historia.
   */
  sePuedeEditar: boolean;
};

export async function viajesPublicados(conductorId: string): Promise<ViajePublicado[]> {
  const mios = fuente.viajes
    .filter((v) => v.driver_id === conductorId && v.status === 'published')
    .sort((a, b) => a.departure_at.localeCompare(b.departure_at));

  return demora(mios.map(comoPublicado));
}

export async function viajePublicado(viajeId: string): Promise<ViajePublicado | null> {
  const v = fuente.viajes.find((x) => x.id === viajeId);
  return demora(v ? comoPublicado(v) : null);
}

/**
 * Los viajes que MANEJAS, partidos en los que vienen y los que ya pasaron.
 *
 * Existía `viajesPublicados` —sólo los que vienen— y `viajesHechos`, que
 * deduplica por ruta porque su trabajo es ofrecer «publicar de nuevo». Para
 * un historial eso está mal: cuatro viernes a Chitré son cuatro viajes, no
 * uno. Aquí no se deduplica nada.
 *
 * El corte es el reloj y no el estado: un viaje `published` cuya hora ya
 * pasó pertenece al pasado aunque nadie lo haya cerrado.
 */
export async function misViajesConduciendo(
  conductorId: string,
): Promise<{ proximos: ViajePublicado[]; pasados: ViajePublicado[] }> {
  const ahora = Date.now();
  const mios = fuente.viajes.filter(
    (v) => v.driver_id === conductorId && v.status !== 'cancelled',
  );
  const yaFue = (v: ViajeFila) =>
    v.status === 'completed' || new Date(v.departure_at).getTime() < ahora;

  return demora({
    proximos: mios
      .filter((v) => !yaFue(v))
      .sort((a, b) => a.departure_at.localeCompare(b.departure_at))
      .map(comoPublicado),
    pasados: mios
      .filter(yaFue)
      .sort((a, b) => b.departure_at.localeCompare(a.departure_at))
      .map(comoPublicado),
  });
}

/* --------------------------------------------- 10a · repetir un viaje */

/**
 * Un viaje que ya pasó, contado con lo justo para querer repetirlo.
 *
 * El interurbano de verdad es semanal — se baja a Chitré el viernes, se
 * vuelve el domingo — y hasta ahora los viajes hechos del conductor no
 * salían EN NINGUNA pantalla: repetir uno era rellenar el formulario
 * entero otra vez, de memoria.
 */
export type ViajeHecho = {
  id: string;
  cuando: string;
  origen: string;
  destino: string;
  aporteCentavos: number;
  puestosVendidos: number;
};

export async function viajesHechos(conductorId: string, cuantos = 4): Promise<ViajeHecho[]> {
  const ahora = Date.now();
  const hechos = fuente.viajes
    .filter(
      (v) =>
        v.driver_id === conductorId &&
        (v.status === 'completed' ||
          (v.status === 'published' && new Date(v.departure_at).getTime() < ahora)),
    )
    .sort((a, b) => b.departure_at.localeCompare(a.departure_at));

  /* La misma ruta hecha cuatro veces es UNA fila: se repite la ruta, no la
     fecha. Se queda la más reciente de cada par origen → destino. */
  const vistos = new Set<string>();
  const unicos = hechos.filter((v) => {
    const par = `${ciudadOrigen(v)}→${ciudadDestino(v)}`;
    if (vistos.has(par)) return false;
    vistos.add(par);
    return true;
  });

  return demora(
    unicos.slice(0, cuantos).map((v) => ({
      id: v.id,
      cuando: v.departure_at,
      origen: ciudadOrigen(v),
      destino: ciudadDestino(v),
      aporteCentavos: v.price_cents,
      puestosVendidos: fuente.reservas.filter(
        (r) => r.trip_id === v.id && (r.status === 'confirmed' || r.status === 'completed'),
      ).length,
    })),
  );
}

/** Lo que `publicar` necesita para salir ya rellenado con un viaje de antes. */
export type PlantillaDeViaje = {
  origen: Lugar;
  destino: Lugar;
  /** «HH:MM» en hora de Panamá — la hora a la que saliste aquella vez. */
  hora: string;
  puestos: number;
};

/**
 * El viaje viejo convertido en plantilla. A nivel de CIUDAD adrede: el
 * punto exacto se vuelve a elegir en el formulario — es lo único que de
 * verdad cambia de una semana a otra —, y la fecha nace en hoy.
 */
export async function plantillaDeViaje(viajeId: string): Promise<PlantillaDeViaje | null> {
  const v = fuente.viajes.find((x) => x.id === viajeId);
  if (!v) return demora(null);

  const lugarDe = (cityId: string | null, etiqueta: string | null): Lugar | null => {
    const ciudad = fuente.ciudades.find((c) => c.id === cityId);
    if (!ciudad) return null;
    return {
      nombre: ciudad.name,
      citySlug: ciudad.slug,
      tipo: 'ciudad',
      fuente: 'propia',
      contexto: ciudad.province ?? 'Panamá',
      lat: ciudad.lat,
      lng: ciudad.lng,
    };
  };

  const origen = lugarDe(v.origin_city_id, v.origin_label);
  const destino = lugarDe(v.destination_city_id, v.destination_label);
  if (!origen || !destino) return demora(null);

  const hora = new Intl.DateTimeFormat('es-PA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Panama',
  }).format(new Date(v.departure_at));

  return demora({ origen, destino, hora, puestos: v.seats_offered });
}

function comoPublicado(v: ViajeFila): ViajePublicado {
  const reservas = fuente.reservas.filter((r) => r.trip_id === v.id);
  const pendientes = reservas
    .filter((r) => r.status === 'pending')
    .sort((a, b) => (a.expires_at ?? '9').localeCompare(b.expires_at ?? '9'));
  const vendidos = v.seats_offered - puestosLibresDe(v.id);
  const yaSalio = new Date(v.departure_at).getTime() < Date.now();

  /* Los códigos sólo existen para quien tiene el puesto asegurado: una
     solicitud pendiente no sube a nadie al carro. */
  const aseguradas = reservas.filter(
    (r) => r.status === 'confirmed' || r.status === 'completed',
  );

  return {
    id: v.id,
    cuando: v.departure_at,
    // La etiqueta entera, con el sitio: en el panel del conductor «Albrook»
    // a secas no dice de qué terminal sale su propio viaje.
    origen: v.origin_label ?? '',
    destino: v.destination_label ?? '',
    horaSalida: v.departure_at,
    horaLlegada: v.arrival_estimate_at ?? v.departure_at,
    puestosVendidos: vendidos,
    puestosOfrecidos: v.seats_offered,
    aporteCentavos: v.price_cents,
    solicitudes: pendientes.length,
    expiraLaPrimera: pendientes[0]?.expires_at ?? null,
    porSubir: aseguradas.filter((r) => r.boarded_at == null).length,
    porBajar: aseguradas.filter((r) => r.boarded_at != null && r.released_at == null).length,
    aBordo: aseguradas.length,
    editable: reservas.every((r) => r.status !== 'confirmed'),
    yaSalio,
    sePuedeEditar: reservas.every((r) => r.status !== 'confirmed') && !yaSalio,
  };
}

/* -------------------------------------------------- 5b · mis viajes */

export type PuestoMio = {
  reservaId: string;
  /** De qué viaje es el puesto: lo que `5b` necesita para abrir `5a`. */
  viajeId: string;
  destino: string;
  cuando: string;
  conductor: string;
  iniciales: string;
  aporteCentavos: number;
  canal: string;
  codigo: string;
  punto: string;
  /** Los kilómetros del corredor, que `1h` enseña junto al tiempo que falta. */
  distanciaKm: number;
  /** Sólo el de hoy manda en la pantalla. */
  esDeHoy: boolean;

  /* ── Lo que `5b` enseña en la tarjeta grande ─────────────────────────
     La ficha de un viaje son dos extremos con su sitio, no un destino
     suelto: «Ciudad de Panamá · Albrook» arriba y «Chitré · Parque Unión»
     abajo. `origin_label` guarda las dos mitades unidas por « · », así que
     se parten aquí una vez y no en cada pantalla. */
  /** La ciudad de la que sale. */
  origen: string;
  /** El sitio exacto dentro de esa ciudad, si el rótulo lo trae. */
  origenSitio: string;
  /** El sitio exacto de la bajada. */
  destinoSitio: string;
  /** La llegada estimada, para poder escribir de cuándo a cuándo dura. */
  llegada: string;
  /** Quién maneja, para abrir su perfil y el chat. */
  conductorId: string;
  /** La nota media y cuántos viajes lleva; nulo si todavía no tiene. */
  calificacion: number | null;
  viajesDelConductor: number;
  /** La cédula pasada por Didit. Lo que dibuja el visto azul del nombre. */
  verificado: boolean;
  /** El carro con el que te recoge. */
  carro: { modelo: string; color: string; placa: string } | null;
  /** `confirmed` cuando el conductor ya dijo que sí; `pending` mientras
   *  espera respuesta. Es lo que decide la pastilla de estado. */
  estado: string;
};

export type MisViajes = { proximos: PuestoMio[]; pasados: PuestoMio[]; hoy: PuestoMio | null };

export async function misViajes(perfilId: string): Promise<MisViajes> {
  const ahora = Date.now();
  /* Lo pendiente TAMBIÉN es un viaje suyo. Antes se escondía, y quien acababa
     de pedir un puesto abría «Mis viajes» y no veía nada: parecía que la
     petición se hubiera perdido. Ahora sale con su pastilla de PENDIENTE, que
     es exactamente lo que hay que decirle. */
  const mios = fuente.reservas
    .filter(
      (r) =>
        r.passenger_id === perfilId &&
        (r.status === 'pending' || r.status === 'confirmed' || r.status === 'completed'),
    )
    .map(comoPuesto)
    .filter(Boolean) as PuestoMio[];

  const proximos = mios
    .filter((p) => new Date(p.cuando).getTime() >= ahora)
    .sort((a, b) => a.cuando.localeCompare(b.cuando));
  const pasados = mios
    .filter((p) => new Date(p.cuando).getTime() < ahora)
    .sort((a, b) => b.cuando.localeCompare(a.cuando));

  return demora({ proximos, pasados, hoy: proximos.find((p) => p.esDeHoy) ?? null });
}

function comoPuesto(r: (typeof fuente.reservas)[number]): PuestoMio | null {
  const viaje = fuente.viajes.find((v) => v.id === r.trip_id);
  if (!viaje) return null;
  const conductor = fuente.perfiles.find((p) => p.id === viaje.driver_id);
  const nombre = conductor ? `${conductor.first_name} ${conductor.last_initial ?? ''}`.trim() : '';
  const enPanama = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'America/Panama',
  });

  /* La carte de « Mis viajes » résume : en haut la VILLE, en dessous le point
     exact. Avant, la ligne du haut disait « Albrook » — un quartier. */
  const origen = ciudadOrigen(viaje);
  const origenSitio = soloPunto(ciudadesDelViaje(viaje).origen, viaje.origin_label);
  const destino = ciudadDestino(viaje);
  const destinoSitio = soloPunto(ciudadesDelViaje(viaje).destino, viaje.destination_label);
  const rep = conductor ? fuente.reputacion[conductor.id] : undefined;
  const suCarro = fuente.vehiculos.find((v) => v.owner_id === viaje.driver_id && v.is_active);

  return {
    reservaId: r.id,
    viajeId: r.trip_id,
    destino,
    cuando: viaje.departure_at,
    conductor: nombre,
    iniciales: `${conductor?.first_name[0] ?? ''}${(conductor?.last_initial ?? '')[0] ?? ''}`.toUpperCase(),
    aporteCentavos: r.unit_price_cents * r.seats,
    canal: r.payment_channel,
    codigo: r.boarding_code ?? '',
    punto: r.proposed_point ?? origen,
    distanciaKm: viaje.snap_distance_km ?? 0,
    esDeHoy: enPanama.format(new Date(viaje.departure_at)) === enPanama.format(new Date()),

    origen,
    origenSitio: r.proposed_point ?? origenSitio,
    destinoSitio,
    llegada: viaje.arrival_estimate_at ?? viaje.departure_at,
    conductorId: viaje.driver_id,
    calificacion: rep?.calificacion ?? null,
    viajesDelConductor: rep?.viajes ?? 0,
    verificado: conductor?.is_id_verified ?? false,
    carro: suCarro
      ? {
          modelo: [suCarro.make, suCarro.model].filter(Boolean).join(' '),
          color: suCarro.color ?? '',
          placa: suCarro.plate_last3 ?? '',
        }
      : null,
    estado: r.status,
  };
}

/* -------------------------------------------------- 14d · editar */

export type CampoEditable = {
  clave: 'hora' | 'ruta' | 'puestos' | 'mujeres';
  etiqueta: string;
  valor: string;
  /** Cerrado por alguien que ya pagó, con el motivo escrito. */
  cerrado: boolean;
};

export type Edicion = {
  viajeId: string;
  cuando: string;
  ruta: string;
  /** Quién ha pagado ya, que es lo que cierra los campos. */
  aviso: string | null;
  campos: CampoEditable[];
  /** Avisar de un cambio no es opcional cuando alguien tiene puesto. */
  seAvisa: boolean;
};

export async function prepararEdicion(viajeId: string): Promise<Edicion> {
  const viaje = fuente.viajes.find((v) => v.id === viajeId);
  if (!viaje) throw new Error(`No existe el viaje ${viajeId}`);

  const pagados = fuente.reservas.filter((r) => r.trip_id === viajeId && r.status === 'confirmed');
  const hayPagados = pagados.length > 0;
  const quien = fuente.perfiles.find((p) => p.id === pagados[0]?.passenger_id);
  const paradas = fuente.paradas
    .filter((p) => p.trip_id === viajeId)
    .sort((a, b) => a.sequence - b.sequence)
    .map((p) => (p.custom_label ?? '').split(' · ')[0]);

  return demora({
    viajeId,
    cuando: viaje.departure_at,
    ruta: rutaCorta(viaje),
    aviso: hayPagados
      ? `${quien?.first_name ?? 'Alguien'} ya pagó su puesto. La hora y la ruta quedan cerradas.`
      : null,
    campos: [
      { clave: 'hora', etiqueta: 'Hora de salida', valor: hhmm(viaje.departure_at), cerrado: hayPagados },
      { clave: 'ruta', etiqueta: 'Ruta y paradas', valor: paradas.join(' · '), cerrado: hayPagados },
      {
        clave: 'puestos',
        etiqueta: 'Puestos',
        /* «Ocupado», no «vendido»: aquí nadie vende un puesto. Ver la nota
           en `servicios/solicitudes.ts`. */
        valor: `${viaje.seats_offered} · ${pagados.length} ocupado${pagados.length === 1 ? '' : 's'}`,
        cerrado: false,
      },
      {
        clave: 'mujeres',
        etiqueta: 'Solo mujeres',
        valor: viaje.gender_preference === 'women_only' ? 'Sí' : 'No',
        // El traspaso lo deja abierto aunque alguien haya pagado. Encenderlo
        // con un hombre a bordo es un problema de verdad, pero la decisión es
        // del diseño y se respeta: queda anotado, no cambiado a escondidas.
        cerrado: false,
      },
    ],
    seAvisa: hayPagados,
  });
}

/* `equipajeEnConflicto` se retiró el 25-08-2026: el conflicto que vigilaba
   —apagar «acepto maletas» con alguien ya reservado con una— no puede
   ocurrir, porque el viaje ya no declara nada. El conductor decide sobre
   cada solicitud, una por una, viendo lo que esa persona lleva. */

export async function guardarEdicion(
  viajeId: string,
  cambios: { puestos?: number; mujeres?: boolean },
): Promise<ViajeFila> {
  const i = fuente.viajes.findIndex((v) => v.id === viajeId);
  if (i < 0) throw new Error(`No existe el viaje ${viajeId}`);

  fuente.viajes[i] = {
    ...fuente.viajes[i],
    seats_offered: cambios.puestos ?? fuente.viajes[i].seats_offered,
    gender_preference:
      cambios.mujeres === undefined
        ? fuente.viajes[i].gender_preference
        : cambios.mujeres
          ? 'women_only'
          : 'any',
    updated_at: new Date().toISOString(),
  };
  return demora(fuente.viajes[i]);
}

function hhmm(cuando: string): string {
  return new Intl.DateTimeFormat('es-PA', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Panama',
  }).format(new Date(cuando));
}
