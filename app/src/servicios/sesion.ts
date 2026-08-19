/**
 * Quién está usando la app — en una sola pieza, para las pantallas que hasta
 * ahora lo tenían escrito a mano.
 *
 * **Por qué existe.** Cada pantalla llevaba el identificador de la persona del
 * recorrido de diseño en una constante (`const CONDUCTOR = '11111111-…'`). Con
 * datos simulados eso funciona, porque esa fila existe en memoria. Contra la
 * base de verdad no existe nadie con ese identificador, así que la pantalla
 * pedía los datos de un fantasma y salía vacía sin decir por qué.
 *
 * La regla queda: **quién soy lo dice la sesión**. Cuando no hay sesión que
 * preguntar —el modo simulado no tiene autenticación, es un catálogo en
 * memoria— manda la persona del recorrido, que es para lo que se hizo.
 *
 * `alCambiarLaSesion` mantiene el valor al día: entrar o salir se nota en la
 * pantalla que ya está abierta, sin recargar.
 */

import { useEffect, useState } from 'react';

import { useRouter } from 'expo-router';

import { MODO } from './_fuente';
import { alCambiarLaSesion, miId } from './cuenta';

export type Sesion = {
  /** Quién está dentro, o `null` si no hay nadie o todavía no se sabe. */
  id: string | null;
  /** `true` mientras se pregunta. En simulado no se pregunta nunca. */
  preguntando: boolean;
};

/**
 * La sesión completa, con el «todavía no sé» separado del «no hay nadie».
 * Distinguirlos es lo que evita mandar a la puerta a quien sí tiene cuenta.
 */
export function useSesion(delRecorrido: string): Sesion {
  const simulado = MODO === 'simulado';
  const [id, setId] = useState<string | null>(simulado ? delRecorrido : null);
  const [preguntando, setPreguntando] = useState(!simulado);

  useEffect(() => {
    if (simulado) return;

    let vivo = true;
    const mirar = () => {
      miId().then((quien) => {
        if (!vivo) return;
        setId(quien);
        setPreguntando(false);
      });
    };

    mirar();
    const dejarDeEscuchar = alCambiarLaSesion(mirar);
    return () => {
      vivo = false;
      dejarDeEscuchar();
    };
  }, [simulado]);

  return { id, preguntando };
}

/**
 * El identificador de quien está dentro, que es lo que casi toda pantalla
 * necesita.
 *
 * - `delRecorrido` es la persona del traspaso: se usa **solo** en simulado.
 * - Contra la base devuelve `null` mientras pregunta, y `null` si no hay
 *   sesión. Una pantalla que reciba `null` no debe pedir datos: pedirlos con
 *   un identificador inventado es justo lo que se está corrigiendo.
 */
export function useMiId(delRecorrido: string): string | null {
  return useSesion(delRecorrido).id;
}

/**
 * Igual, pero para las pantallas que no significan nada sin cuenta —el panel
 * del conductor, tu cuenta, tus aportes—: sin sesión manda a entrar en vez de
 * dejar una pantalla en blanco que nadie sabe interpretar.
 */
export function useMiIdOEntrar(delRecorrido: string): string | null {
  const router = useRouter();
  const { id, preguntando } = useSesion(delRecorrido);

  useEffect(() => {
    if (!preguntando && id === null) router.replace('/(cuenta)/entrar');
  }, [preguntando, id, router]);

  return id;
}
