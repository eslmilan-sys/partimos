/**
 * QUÉ SE PUEDE JUZGAR DE CADA UNO — los ejes de una reseña, por lado.
 *
 * La fórmula de la nota es la misma para quien maneja y para quien viaja
 * (`dominio/notas.ts`): aquí no hay un proveedor y un cliente, hay dos
 * personas repartiendo un costo. **Lo que cambia son los ejes**, y no por
 * cortesía: hay cosas que un pasajero sencillamente no hace.
 *
 *   · `manejo` — cómo condujo. Un pasajero no conduce.
 *   · `carro` — si estaba limpio y era el registrado. No es su carro.
 *
 * Los otros tres valen en los dos sentidos, aunque quieran decir cosas
 * ligeramente distintas:
 *
 *   · `puntualidad` — salió a la hora / estaba a la hora.
 *   · `encuentro` — llegó al punto acordado. Los dos tienen que llegar.
 *   · `trato` — fue amable. Eso no depende de dónde vas sentado.
 *
 * **Sigue sin haber eje de precio** (decidido en la 0007 y no se toca): el
 * tope es la regla de la plataforma, no un mérito de quien maneja, y
 * puntuarlo devolvería la presión tarifaria por la puerta de atrás (R3).
 *
 * Y **no hay eje de «pagó lo acordado»**. Es el riesgo número uno de un
 * modelo de mano a mano y merece existir, pero pide una columna nueva en
 * `reviews` y una decisión del dueño sobre qué pasa cuando alguien lo marca.
 * Inventarlo aquí sería decidir por él.
 */

/** Los ejes que la tabla `reviews` ya tiene (0007). */
export type Eje = 'puntualidad' | 'manejo' | 'trato' | 'carro' | 'encuentro';

/** A quién se está calificando. */
export type Lado = 'conductor' | 'pasajero';

export type Atajo = {
  /** La clave que la pantalla marca y desmarca. */
  clave: string;
  /** Lo que dice el chip, ya escrito para ese lado. */
  texto: string;
  /** Dónde se guarda la nota si se marca. */
  eje: Eje;
};

/** Lo que se puede decir de quien maneja. */
const DEL_CONDUCTOR: Atajo[] = [
  { clave: 'puntual', texto: 'Puntual', eje: 'puntualidad' },
  { clave: 'manejo', texto: 'Manejó tranquilo', eje: 'manejo' },
  { clave: 'punto', texto: 'Punto exacto', eje: 'encuentro' },
  { clave: 'conversa', texto: 'Buena conversa', eje: 'trato' },
  { clave: 'carro', texto: 'Carro limpio', eje: 'carro' },
];

/**
 * Lo que se puede decir de quien viaja.
 *
 * Tres, no cinco, y en su propia voz: «Estaba a la hora» no es «Puntual»
 * dicho de otra manera — el conductor esperó o no esperó, y eso es lo que
 * recuerda.
 */
const DEL_PASAJERO: Atajo[] = [
  { clave: 'puntual', texto: 'Estaba a la hora', eje: 'puntualidad' },
  { clave: 'punto', texto: 'En el punto acordado', eje: 'encuentro' },
  { clave: 'conversa', texto: 'Buena compañía', eje: 'trato' },
];

export function atajosDe(lado: Lado): Atajo[] {
  return lado === 'conductor' ? DEL_CONDUCTOR : DEL_PASAJERO;
}

/**
 * En qué eje cae cada atajo marcado, para ESE lado.
 *
 * Devuelve un mapa completo: los ejes que ese lado no puede juzgar salen en
 * `null`, que **no es una mala nota** — es «no opinó», y la vista de medias
 * lo ignora en vez de contarlo como un cero.
 */
export function ejesDe(lado: Lado, marcados: string[], nota: number): Record<Eje, number | null> {
  const atajos = atajosDe(lado);
  const puesto = (eje: Eje) =>
    atajos.some((a) => a.eje === eje && marcados.includes(a.clave)) ? nota : null;
  return {
    puntualidad: puesto('puntualidad'),
    manejo: puesto('manejo'),
    trato: puesto('trato'),
    carro: puesto('carro'),
    encuentro: puesto('encuentro'),
  };
}
