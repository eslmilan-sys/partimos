/**
 * Cualquier dirección que no sea una pantalla abre el índice.
 *
 * La app se sirve desde sitios distintos —la raíz en local, un subcamino en
 * GitHub Pages, una dirección con identificador cuando se publica como página
 * suelta— y el enrutador compara el camino del navegador con sus rutas. Si no
 * encuentra nada, en vez de enseñar «no existe» a alguien que acaba de abrir el
 * enlace que le mandaron, entra por la puerta de siempre.
 */

import { Redirect } from 'expo-router';

export default function NoEncontrada() {
  return <Redirect href="/" />;
}
