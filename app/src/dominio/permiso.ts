/**
 * Qué le falta a alguien para poder publicar un viaje — y qué puede hacer
 * mientras tanto.
 *
 * **La regla del producto, escrita en un sitio.** Quien se registra puede
 * buscar puesto **o** proponer viaje. Si no ha mandado sus papeles, no puede
 * publicar; pero **sí puede calcular**, y tiene que poder, porque la cuenta es
 * la única razón por la que alguien registraría su carro y mandaría su cédula.
 * Poner la pared antes del cálculo es pedir el esfuerzo antes de haber
 * enseñado para qué sirve.
 *
 * El orden de lo que falta no es alfabético: **primero el carro**, porque sin
 * él la cuenta de arriba es una estimación con un sedán de referencia y el
 * número que se enseña no es el suyo; después la cédula, que es lo que la ley
 * exige para llevar a alguien.
 *
 * Vive en `dominio` y no en la pantalla porque es una regla, no un dibujo: la
 * usan la pantalla de publicar y la de repaso, y tiene que decidir lo mismo en
 * las dos.
 */

/** Lo que hace falta, en el orden en que hay que resolverlo. */
export type LoQueFalta = 'carro' | 'cedula' | 'revision' | null;

export type QuePuede = {
  /** Siempre cierto: la cuenta se hace sin papeles. */
  calcular: true;
  /** Solo con carro propio y cédula verificada. */
  publicar: boolean;
  falta: LoQueFalta;
};

export function quePuedeHacer({
  tieneCarroPropio,
  estadoDeCedula,
}: {
  tieneCarroPropio: boolean;
  estadoDeCedula: 'pendiente' | 'en revisión' | 'verificada' | 'rechazada';
}): QuePuede {
  const falta: LoQueFalta = !tieneCarroPropio
    ? 'carro'
    : estadoDeCedula === 'verificada'
      ? null
      : estadoDeCedula === 'en revisión'
        ? 'revision'
        : 'cedula';

  return { calcular: true, publicar: falta === null, falta };
}

/** Lo que se le dice, por lo que le falta. */
export const LO_QUE_FALTA: Record<
  Exclude<LoQueFalta, null>,
  { titulo: string; texto: string; boton: string; ruta: string }
> = {
  carro: {
    titulo: 'Falta registrar tu carro',
    texto:
      'La cuenta de arriba va con un sedán de referencia. Con tu carro, tu consumo y tus puestos, el número es el tuyo.',
    boton: 'Registrar mi carro',
    ruta: '/(conductor)/carro',
  },
  cedula: {
    titulo: 'Falta verificar tu cédula',
    texto:
      'Nadie sube al carro de alguien sin nombre. Se hace una vez, con un proveedor certificado, y no guardamos ni la foto ni el número.',
    boton: 'Verificar mi cédula',
    ruta: '/(conductor)/cedula',
  },
  revision: {
    titulo: 'Tu cédula está en revisión',
    texto: 'Suele tomar unos minutos. En cuanto pase, este botón publica.',
    boton: 'Ver el estado',
    ruta: '/(conductor)/cedula',
  },
};
