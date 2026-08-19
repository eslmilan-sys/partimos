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

import type { Incident, IdentityVerification } from '@/tipos';

import { fuente } from './_fuente';

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

const ETIQUETA: Record<string, EstadoDeCedula['estado']> = {
  pending: 'en revisión',
  verified: 'verificada',
  rejected: 'rechazada',
  expired: 'pendiente',
};

export async function estadoDeCedula(perfilId: string): Promise<EstadoDeCedula> {
  const v = fuente.verificaciones.find((x) => x.profile_id === perfilId);
  const estado = v ? ETIQUETA[v.status] : 'pendiente';
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
  { titulo: 'Mandaste tu cédula', detalle: 'al proveedor certificado, no a nosotros' },
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
    id: `id000000-0000-4000-8000-${String(fuente.verificaciones.length + 2).padStart(12, '0')}`,
    profile_id: perfilId,
    provider: 'didit',
    provider_ref: `ver_${String(fuente.verificaciones.length + 2).padStart(4, '0')}`,
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

/** El número de emergencias de Panamá. Va primero, siempre. */
export const EMERGENCIAS = '104';
export const EMERGENCIAS_QUIEN = 'Policía Nacional';

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
    ruta: `${(viaje?.origin_label ?? '').split(' · ')[0]} → ${(viaje?.destination_label ?? '').split(' · ')[0]}`,
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
    id: `in000000-0000-4000-8000-${String(fuente.incidencias.length + 1).padStart(12, '0')}`,
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
