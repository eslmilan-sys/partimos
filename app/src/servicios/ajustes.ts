/**
 * Tu cuenta y tus ajustes — pantallas `6a` (cuenta) y `8a` (ajustes).
 *
 * `6a` dice quién eres y **qué te falta**: si la cédula no está verificada, esa
 * es la línea que manda, porque sin ella no se publica.
 *
 * Los números de `6a` son los del traspaso y no son un marcador: «aportado» es
 * lo que has puesto tú viajando de pasajero y «recuperado» lo que te han
 * puesto a ti llevando gente. Nadie gana; unos ponen y otros recuperan.
 */

import { NOMBRE_DEL_CANAL } from '@/dominio/tarifas';

import { fuente } from './_fuente';
import { estadoDeCedula } from './seguridad';

const demora = <T,>(valor: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(valor), ms));

export type Cuenta = {
  id: string;
  nombre: string;
  /** El apellido va en su propia línea en `6a`: el titular son dos pesos. */
  apellido: string;
  iniciales: string;
  viajes: number;
  calificacion: number | null;
  desde: string;
  verificado: boolean;
  /** Los tres números de la fila. */
  aportadoCentavos: number;
  recuperadoCentavos: number;
  kilometros: number;
  carro: string | null;
  metodo: string;
  cedula: string;
  /** La línea que cierra: lo que puedes hacer, o lo que te falta. */
  queTeFalta: string;
};

export async function cuenta(perfilId: string): Promise<Cuenta> {
  const p = fuente.perfiles.find((x) => x.id === perfilId);
  if (!p) throw new Error(`No existe el perfil ${perfilId}`);

  const rep = fuente.reputacion[perfilId];
  const carro = fuente.vehiculos.find((v) => v.owner_id === perfilId && v.is_active);
  const cedula = await estadoDeCedula(perfilId);

  const recuperado = fuente.libro
    .filter((e) => e.profile_id === perfilId && e.account === 'driver_payable')
    .reduce((n, e) => n + e.amount_cents, 0);
  const aportado = fuente.reservas
    .filter((r) => r.passenger_id === perfilId && r.status === 'confirmed')
    .reduce((n, r) => n + r.unit_price_cents * r.seats, 0);

  return demora({
    id: p.id,
    nombre: p.first_name,
    apellido: p.last_initial ?? '',
    iniciales: `${p.first_name[0] ?? ''}${(p.last_initial ?? '')[0] ?? ''}`.toUpperCase(),
    viajes: rep?.viajes ?? 0,
    calificacion: rep?.calificacion ?? null,
    desde: String(new Date(p.created_at).getFullYear()),
    verificado: cedula.puedePublicar,
    aportadoCentavos: aportado,
    recuperadoCentavos: recuperado,
    kilometros: kilometrosDe(perfilId),
    carro: carro?.model ?? null,
    metodo: NOMBRE_DEL_CANAL[p.preferred_pay_channel ?? 'yappy_app'],
    cedula: cedula.puedePublicar ? 'al día' : cedula.etiqueta.toLowerCase(),
    queTeFalta: cedula.puedePublicar
      ? 'Tu cédula está verificada. Puedes publicar viajes.'
      : 'Verifica tu cédula para poder publicar viajes.',
  });
}

export type GrupoDeAjustes = {
  titulo: string;
  filas: { etiqueta: string; valor?: string; ruta?: string; peligro?: boolean }[];
};

/** Cuatro grupos: avisos, viaje, dinero y cuenta. En ese orden. */
export async function ajustes(perfilId: string): Promise<GrupoDeAjustes[]> {
  const p = fuente.perfiles.find((x) => x.id === perfilId);
  const cedula = await estadoDeCedula(perfilId);
  const avisando = fuente.rutinas.filter((r) => r.profile_id === perfilId && r.avisar).length;

  return demora([
    {
      titulo: 'Avisos',
      filas: [
        { etiqueta: 'Avisos', valor: 'Los tres activos', ruta: '/(avisos)/permiso' },
        { etiqueta: 'Rutas guardadas', valor: `${avisando} avisando`, ruta: '/(pasajero)/rutas' },
      ],
    },
    {
      titulo: 'Viaje',
      filas: [
        { etiqueta: 'Mi carro', valor: fuente.vehiculos.find((v) => v.owner_id === perfilId)?.model ?? 'Ninguno', ruta: '/(conductor)/carro' },
        { etiqueta: 'Mis viajes', ruta: '/(conductor)/misviajes' },
      ],
    },
    {
      titulo: 'Dinero y cuenta',
      filas: [
        {
          etiqueta: 'Método de pago',
          valor: `${NOMBRE_DEL_CANAL[p?.preferred_pay_channel ?? 'yappy_app']} · ${fuente.yappyDelConductor[perfilId as keyof typeof fuente.yappyDelConductor] ?? ''}`.trim(),
          ruta: '/(pasajero)/metodos',
        },
        { etiqueta: 'Cédula', valor: cedula.puedePublicar ? 'Verificada' : cedula.etiqueta, ruta: '/(conductor)/cedula' },
        { etiqueta: 'Ayuda y reembolsos', ruta: '/(ayuda)' },
      ],
    },
    {
      titulo: '',
      filas: [{ etiqueta: 'Cerrar sesión', peligro: true }],
    },
  ]);
}

/** Los kilómetros compartidos: los de cada corredor por cada viaje hecho. */
function kilometrosDe(perfilId: string): number {
  const reservas = fuente.reservas.filter((r) => r.passenger_id === perfilId);
  const km = reservas.reduce((n, r) => {
    const viaje = fuente.viajes.find((v) => v.id === r.trip_id);
    return n + (viaje?.snap_distance_km ?? 0);
  }, 0);
  const rep = fuente.reputacion[perfilId];
  // Los viajes viejos no están en el almacén; el contador de reputación sí.
  return km + (rep?.viajes ?? 0) * 250;
}
