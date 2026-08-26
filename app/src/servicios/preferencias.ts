/**
 * Las preferencias de la pantalla de ajustes — guardadas de verdad.
 *
 * **Antes eran decorado.** Los cinco interruptores de `8a` vivían en un
 * `useState` y volvían a su sitio al recargar: se apagaba «Solo mujeres», se
 * salía de la pantalla, y estaba encendido otra vez. El propio archivo lo
 * decía en un comentario — «el sí o el no viven en la pantalla hasta que
 * `servicios/ajustes` tenga dónde escribirlos»— y así se quedó. El dueño los
 * tachó en una captura el 26-08-2026, y tenía razón: un interruptor que no
 * interruptor nada es peor que no tenerlo.
 *
 * **Por qué en el navegador y no en la base.** `profiles` no tiene columnas
 * para esto y añadirlas es una migración que no puedo probar contra la base
 * real desde aquí. El almacén del navegador guarda de verdad, se nota al
 * instante, y el día que existan las columnas este archivo es el único sitio
 * que cambia — ninguna pantalla se entera. Lo que NO se guarda aquí es nada
 * que otra persona tenga que ver: son preferencias de quien mira.
 *
 * Los avisos de push no están: no hay canal de envío, así que un interruptor
 * de «avisarme por el teléfono» seguiría siendo mentira. Volverán cuando el
 * envío exista.
 */

export type Preferencias = {
  /** Solo ver carros con conductoras y pasajeras. Filtra la búsqueda. */
  soloMujeres: boolean;
  /** Ofrecer «Compartir mi llegada» durante el viaje. */
  compartirLlegada: boolean;
};

export const POR_DEFECTO: Preferencias = {
  soloMujeres: false,
  compartirLlegada: true,
};

const DONDE = 'partimos.preferencias';

/** Lo guardado, o lo de por defecto. Nunca lanza: sin almacén, hay defectos. */
export function preferencias(): Preferencias {
  try {
    const crudo = globalThis.localStorage?.getItem(DONDE);
    if (!crudo) return POR_DEFECTO;
    const leido = JSON.parse(crudo) as Partial<Preferencias>;
    return {
      soloMujeres: leido.soloMujeres ?? POR_DEFECTO.soloMujeres,
      compartirLlegada: leido.compartirLlegada ?? POR_DEFECTO.compartirLlegada,
    };
  } catch {
    return POR_DEFECTO;
  }
}

/** Cambia una y devuelve el conjunto entero, ya guardado. */
export function guardarPreferencia<C extends keyof Preferencias>(
  cual: C,
  valor: Preferencias[C],
): Preferencias {
  const nuevas = { ...preferencias(), [cual]: valor };
  try {
    globalThis.localStorage?.setItem(DONDE, JSON.stringify(nuevas));
  } catch {
    /* sin almacén se pierde al recargar, y no hay nada mejor que hacer */
  }
  return nuevas;
}
