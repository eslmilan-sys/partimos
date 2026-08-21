/**
 * El único sitio donde los centavos se vuelven texto.
 *
 * **Notación v6: «B/18»** — el balboa delante, pegado a la cifra, como lo
 * escribe `diseno/Partimos App v6.dc.html` en cada tarjeta y en el rango de
 * precios. (El traspaso anterior escribía «6 $»; decisión del usuario al
 * adoptar v6 como base.) Con centavos, coma decimal: «B/6,50». Sin
 * monoespaciada: la fuente de la interfaz con cifras tabulares.
 *
 * En la tarjeta de viaje el prefijo va en su propio `Text` más pequeño
 * (12/500) sobre la misma línea de base — ahí no se usa esta función sino
 * las dos piezas por separado; esta es para el texto corrido.
 */

import { Text, type TextProps } from 'react-native';

/** «B/6,00» — con centavos. */
export function formatearDinero(centavos: number): string {
  const signo = centavos < 0 ? '−' : '';
  const abs = Math.abs(centavos);
  const enteros = Math.floor(abs / 100);
  const resto = String(abs % 100).padStart(2, '0');
  return `${signo}B/${enteros},${resto}`;
}

/** «B/6» — sin centavos, para el aporte y los botones. */
export function formatearDineroRedondo(centavos: number): string {
  const exacto = centavos % 100 === 0;
  return exacto ? `B/${Math.round(centavos / 100)}` : formatearDinero(centavos);
}

/** Solo la cifra, para cuando el «B/» va en su propio Text al lado. */
export function cifraRedonda(centavos: number): string {
  const exacto = centavos % 100 === 0;
  if (exacto) return String(Math.round(centavos / 100));
  const abs = Math.abs(centavos);
  return `${Math.floor(abs / 100)},${String(abs % 100).padStart(2, '0')}`;
}

/** Cifras tabulares, para que las columnas cuadren sin voz técnica. */
export const tabular = { fontVariant: ['tabular-nums' as const] };

type Props = TextProps & {
  centavos: number;
  /** true → «B/6» en vez de «B/6,00». */
  redondo?: boolean;
};

export function Dinero({ centavos, redondo = false, style, ...resto }: Props) {
  return (
    <Text {...resto} style={[tabular, style]}>
      {redondo ? formatearDineroRedondo(centavos) : formatearDinero(centavos)}
    </Text>
  );
}
