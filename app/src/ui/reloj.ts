/**
 * El reloj del teléfono, pero solo cuando ya hay teléfono.
 *
 * La app publicada es un sitio estático: el HTML se dibuja al exportar y el
 * navegador lo rehidrata al abrirlo, días después. Si una pantalla leyera la
 * hora mientras pinta, los dos textos no coincidirían y React tiraría la
 * pantalla entera en vez de corregirla.
 *
 * Así que el primer pintado usa el momento del traspaso —el mismo que enseñan
 * `1a` y `12a`— y la hora de verdad entra al montar, que es cuando ya hay un
 * navegador con reloj. En el teléfono no hay hidratación y el cambio ocurre en
 * el primer cuadro.
 */

import { useEffect, useState } from 'react';

/** Sábado 14 de junio, 4:58 en Panamá: la hora que enseña el traspaso. */
export const MOMENTO_DEL_TRASPASO = new Date('2025-06-14T09:58:00Z');

/**
 * @param cada cada cuántos milisegundos se vuelve a mirar el reloj; `0` lo mira
 * una sola vez, al montar, que es lo que quiere una fecha que no cuenta
 * segundos.
 */
export function useReloj(cada = 0): Date {
  const [ahora, setAhora] = useState(MOMENTO_DEL_TRASPASO);

  useEffect(() => {
    setAhora(new Date());
    if (!cada) return;
    const t = setInterval(() => setAhora(new Date()), cada);
    return () => clearInterval(t);
  }, [cada]);

  return ahora;
}
