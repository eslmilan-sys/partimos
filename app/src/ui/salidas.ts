/**
 * Volver y compartir — las dos cosas que se hacen desde treinta pantallas y
 * que estaban rotas de la misma manera: fallaban en silencio.
 *
 * **Volver.** Treinta y cinco pantallas llamaban a `router.back()` a secas.
 * Medido pulsando los 359 controles de la app: en treinta pantallas la flecha
 * de atrás **no hacía nada**. Y no es un caso raro de laboratorio — pasa
 * siempre que se llega sin historial: un enlace compartido a un viaje, el
 * comprobante abierto desde un correo, la app recargada, o la primera
 * pantalla después de entrar. La persona se queda encerrada con una flecha
 * que no responde, que es peor que no tener flecha.
 *
 * `useVolver` mira si hay a dónde volver y, si no lo hay, va a la puerta que
 * le corresponde a esa pantalla. Nunca se queda quieta.
 *
 * **Compartir.** `Share.share` de React Native **no existe en el navegador**:
 * lanza «Share is not supported in this browser» y el error sube a la consola
 * sin que nadie lo recoja. Medido en cinco pantallas. `compartir` prueba lo
 * que haya —el compartir del sistema, el del navegador, el portapapeles— y
 * devuelve qué pasó, para que la pantalla pueda decirlo.
 */

import { Platform, Share } from 'react-native';

import { type Href, useRouter } from 'expo-router';

/**
 * La puerta por defecto: a dónde se sale cuando no hay historial.
 *
 * Buscar, y no la pantalla de antes, porque es la única que existe siempre y
 * desde la que se llega a todo lo demás.
 */
export const PUERTA: Href = '/(pasajero)';

/**
 * Devuelve la función de volver de esta pantalla.
 *
 * @param sinHistorial A dónde ir si no hay nada atrás. Por defecto, Buscar.
 */
export function useVolver(sinHistorial: Href = PUERTA) {
  const router = useRouter();
  return () => {
    if (router.canGoBack()) router.back();
    else router.replace(sinHistorial);
  };
}

/* ----------------------------------------------------------- Compartir */

export type Compartido = 'compartido' | 'copiado' | 'nada';

/**
 * Comparte un texto por donde se pueda, sin lanzar nunca.
 *
 * El orden va de lo mejor a lo peor: la hoja del sistema en el teléfono, la
 * del navegador donde exista —Safari y Chrome de Android la tienen—, y el
 * portapapeles como último recurso, que al menos deja el texto en la mano.
 */
export async function compartir(mensaje: string, titulo = 'Partimos'): Promise<Compartido> {
  if (Platform.OS !== 'web') {
    try {
      const r = await Share.share({ title: titulo, message: mensaje });
      return r.action === Share.dismissedAction ? 'nada' : 'compartido';
    } catch {
      return 'nada';
    }
  }

  const nav = globalThis.navigator as
    | (Navigator & { share?: (d: { title?: string; text?: string }) => Promise<void> })
    | undefined;

  if (nav?.share) {
    try {
      await nav.share({ title: titulo, text: mensaje });
      return 'compartido';
    } catch {
      /* Cancelar la hoja también entra aquí; se sigue al portapapeles. */
    }
  }

  try {
    await nav?.clipboard?.writeText(mensaje);
    return 'copiado';
  } catch {
    return 'nada';
  }
}

/** Lo que se le dice a la persona según por dónde salió. */
export const DIJO: Record<Compartido, string | null> = {
  compartido: null,
  copiado: 'Copiado. Pégalo donde quieras.',
  nada: 'No se pudo compartir desde este navegador.',
};
