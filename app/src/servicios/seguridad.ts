/**
 * Cédula y reportes — pantallas `6d` (verificación) y `15d` (reportar).
 *
 * Dos reglas del traspaso mandan aquí:
 *
 * La cédula **se verifica fuera**. La foto del documento y el número nunca
 * llegan a nuestros servidores: de la verificación sólo recibimos dos cosas,
 * si pasó o no y una referencia. Eso es exactamente lo que guarda
 * `identity_verifications` (`provider`, `provider_ref`, `status`), y es lo que
 * la pantalla dice en voz alta.
 *
 * Reportar pone el **104 primero**, con la placa y la ruta listas para
 * dictarlas, y sólo después pregunta qué pasó. A la persona reportada no se le
 * dice nunca: ni que la reportaron ni que la bloquearon.
 */

import { estadoDe, laQueVale } from '@/dominio/verificacion';
import type { Incident, IdentityVerification } from '@/tipos';

import { nuevoId } from './_id';
import { fuente } from './_fuente';
import { rutaCorta } from './viajes';

const demora = <T,>(valor: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(valor), ms));

/* ------------------------------------------------------------- Cédula */

export type EstadoDeCedula = {
  estado: 'pendiente' | 'en revisión' | 'verificada' | 'rechazada';
  etiqueta: string;
  proveedor: string;
  referencia: string;
  cuando: string | null;
  puedePublicar: boolean;
};

/**
 * LA REGLA VIVE EN `dominio/verificacion`, con sus pruebas (28-08-2026).
 *
 * Aquí se ordenaba por `updated_at` y se tomaba la primera. Con las filas de
 * la base real eso daba lo CONTRARIO de la verdad: dos sesiones abandonadas
 * del 15 y el 16, barridas a `expired` los días 22 y 23, ganaban a la
 * verificación conseguida el 17. La app decía «Pendiente» y le ofrecía
 * «Verificar mi cédula» a quien ya lo estaba — mientras Didit, preguntado en
 * el mismo momento, respondía `already_verified`.
 *
 * Y esta función decide QUIÉN PUEDE PUBLICAR, así que el fallo no era de
 * dibujo: dejaba fuera a conductores verificados.
 */

export async function estadoDeCedula(perfilId: string): Promise<EstadoDeCedula> {
  const suyas = fuente.verificaciones.filter((x) => x.profile_id === perfilId);
  const v = laQueVale(suyas);
  const estado = estadoDe(suyas);
  return demora({
    estado,
    etiqueta: estado === 'en revisión' ? 'En revisión' : estado === 'verificada' ? 'Verificada' : 'Pendiente',
    proveedor: v?.provider ?? '',
    referencia: v?.provider_ref ?? '',
    cuando: v?.verified_at ?? null,
    puedePublicar: estado === 'verificada',
  });
}

/** Los tres pasos de `6d`, con lo que pasa y lo que no sale de aquí. */
export const PASOS_DE_LA_CEDULA: { titulo: string; detalle: string }[] = [
  /* En pasado decía «Mandaste tu cédula» cuando todavía no se había mandado
     nada — el primer paso es el que está POR hacer. En infinitivo vale para
     los dos momentos. */
  { titulo: 'Mandas tu cédula', detalle: 'al proveedor certificado, no a nosotros' },
  { titulo: 'Confirma que es real', detalle: 'suele tomar unos minutos' },
  { titulo: 'Recibimos dos cosas', detalle: 'si pasó o no, y una referencia' },
];

export const LO_QUE_DA_LA_CEDULA: string[] = [
  'Puedes publicar viajes y recibir aportes',
  'Apareces con la insignia en cada búsqueda',
];

export async function pedirVerificacion(perfilId: string): Promise<IdentityVerification> {
  const ya = fuente.verificaciones.find((v) => v.profile_id === perfilId);
  if (ya) return demora(ya);

  const v: IdentityVerification = {
    id: nuevoId(),
    profile_id: perfilId,
    provider: 'didit',
    provider_ref: `ver_${nuevoId().slice(0, 8)}`,
    document_country: 'PA',
    document_type: 'cedula',
    status: 'pending',
    score: null,
    verified_at: null,
    expires_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  fuente.verificaciones.push(v);
  return demora(v);
}

/* ----------------------------------------------------------- Reportar */

/**
 * El número de emergencias de Panamá. Va primero, siempre.
 *
 * **Era el 104 y está corregido a 911** (dueño, 26-08-2026). El 104 es una
 * línea de la Policía Nacional; el 911 es el SUME, el sistema único, y manda
 * policía, ambulancia o bomberos según lo que pase. Quien abre esta pantalla
 * no está en condiciones de elegir a quién llamar — se le da el número que
 * cubre las tres cosas.
 */
export const EMERGENCIAS = '911';
export const EMERGENCIAS_QUIEN = 'Policía, ambulancia y bomberos';

export type MotivoDeReporte = { clave: string; etiqueta: string; severidad: number };

export const MOTIVOS_DE_REPORTE: MotivoDeReporte[] = [
  { clave: 'conduccion', etiqueta: 'Conducía de forma peligrosa', severidad: 3 },
  { clave: 'trato', etiqueta: 'Me trató mal', severidad: 2 },
  { clave: 'dinero', etiqueta: 'Me pidió más dinero', severidad: 2 },
  { clave: 'otra', etiqueta: 'Otra cosa', severidad: 1 },
];

export type DatosParaLlamar = {
  /** Lo que se dicta por teléfono, ya escrito. */
  placa: string;
  ruta: string;
  cuando: string;
  conductor: string;
  carro: string;
};

/** Lo que hace falta tener en la mano al llamar, sin buscarlo. */
export async function datosParaLlamar(reservaId: string): Promise<DatosParaLlamar> {
  const reserva = fuente.reservas.find((r) => r.id === reservaId);
  if (!reserva) throw new Error(`No existe la reserva ${reservaId}`);
  const viaje = fuente.viajes.find((v) => v.id === reserva.trip_id);
  const conductor = fuente.perfiles.find((p) => p.id === viaje?.driver_id);
  const carro = fuente.vehiculos.find((v) => v.id === viaje?.vehicle_id);

  return demora({
    placa: carro ? (fuente.placasCompletas[carro.id] ?? '') : '',
    ruta: viaje ? rutaCorta(viaje) : '',
    cuando: viaje?.departure_at ?? '',
    conductor: conductor ? `${conductor.first_name} ${conductor.last_initial ?? ''}`.trim() : '',
    carro: carro ? `${carro.make} ${carro.model} ${carro.color ?? ''}`.trim() : '',
  });
}

export async function reportar(
  reservaId: string,
  motivo: string,
  quienReporta: string,
  bloquear: boolean,
  texto?: string,
): Promise<Incident> {
  const reserva = fuente.reservas.find((r) => r.id === reservaId);
  if (!reserva) throw new Error(`No existe la reserva ${reservaId}`);
  const viaje = fuente.viajes.find((v) => v.id === reserva.trip_id);
  const elegido = MOTIVOS_DE_REPORTE.find((m) => m.clave === motivo);

  const incidencia: Incident = {
    id: nuevoId(),
    booking_id: reservaId,
    category: bloquear ? `${motivo}+bloqueo` : motivo,
    severity: elegido?.severidad ?? 1,
    description: texto?.trim() || null,
    reporter_id: quienReporta,
    subject_id: viaje?.driver_id ?? null,
    resolution: null,
    resolved_at: null,
    created_at: new Date().toISOString(),
  };

  await fuente.guardarIncidencia(incidencia);
  return demora(incidencia);
}
