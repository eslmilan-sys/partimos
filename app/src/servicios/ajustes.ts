/**
 * Tu cuenta — pantalla `6a`. (La `8a`, Ajustes, se borró: ver abajo.)
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
import { estadoDeLicencia } from '@/dominio/licencia';
import { estadoDeCedula, licenciaDe } from './seguridad';

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
  /**
   * DÓNDE VIVE, para la línea de debajo del nombre en `6a`.
   *
   * Sale de `profiles.home_city_id`, que ya se pregunta en el inicio
   * (`servicios/miCiudad`). Nula mientras no haya contestado: la línea se
   * calla en vez de inventarle la capital, que es justo el defecto que
   * `miCiudad` vino a arreglar.
   */
  ciudad: string | null;
  /** Lo que se cuenta de ti, en tus palabras. `profiles.bio`. */
  bio: string;
  /** Verificado y nunca público: sirve para avisarte, no para enseñarte. */
  telefono: string | null;
  /**
   * LA LICENCIA, al lado de la cédula.
   *
   * «Verificado» en el perfil significa las DOS (pedido del dueño el
   * 31-08-2026: «its cédula and the licencia if they want to drive»). Con la
   * cédula sola se puede viajar de pasajero; para llevar a alguien hace falta
   * la licencia, y decir «verificado» sin ella promete lo que no se comprobó.
   */
  licenciaAlDia: boolean;
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
  const licencia = estadoDeLicencia(await licenciaDe(perfilId));

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
    /* Marca, modelo y color, como lo dice quien se va a subir: «Elantra» a
       secas no distingue el carro de nadie. */
    carro: carro
      ? [carro.make, carro.model, carro.color?.toLowerCase()].filter(Boolean).join(' ')
      : null,
    metodo: NOMBRE_DEL_CANAL[p.preferred_pay_channel ?? 'yappy_app'],
    bio: p.bio ?? '',
    telefono: p.phone ?? null,
    licenciaAlDia: licencia === 'al-dia' || licencia === 'por-vencer',
    ciudad: p.home_city_id
      ? (fuente.ciudades.find((c) => c.id === p.home_city_id)?.name ?? null)
      : null,
    cedula: cedula.puedePublicar ? 'al día' : cedula.etiqueta.toLowerCase(),
    queTeFalta: cedula.puedePublicar
      ? 'Tu cédula está verificada. Puedes publicar viajes.'
      : 'Verifica tu cédula para poder publicar viajes.',
  });
}

/**
 * **`ajustes()` Y LA PANTALLA `8a` SE BORRARON EL 01-09-2026.**
 *
 * Pedido del dueño —«delete ajustes, those should be in menu; delete la
 * rueda»— y, al abrir la pantalla para mudar sus filas al perfil, resultó
 * que **no tenía ni una fila propia**:
 *
 * · «Mi carro» y «Verificación» → dos de las cuatro filas del perfil.
 * · «Mis datos» → la cabecera del perfil, que se pulsa entera.
 * · «Cómo se aporta» → dentro de «Aportes y pagos».
 * · «Cómo te cuidamos» → la fila «Seguridad».
 * · «Cómo se hacen las cosas» → ahora la lista «Ayuda» del perfil.
 * · «Cerrar sesión» → abajo del todo en el perfil, su único sitio.
 *
 * Era un segundo menú que sólo llevaba a puertas ya visibles. El día que
 * exista algo que de verdad se AJUSTE —avisos, idioma, unidades— vuelve a
 * hacer falta una pantalla; hasta entonces, no.
 */

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
