/**
 * El único sitio donde los centavos se vuelven texto.
 *
 * Español de Panamá: coma decimal, espacio duro, símbolo detrás — «6,00 $».
 * Sin monoespaciada: la fuente de la interfaz con cifras tabulares.
 */

import { Text, type TextProps } from 'react-native';

/** El espacio duro que va entre la cifra y el símbolo. */
const DURO = ' ';

/** «6,00 $» — con centavos. */
export function formatearDinero(centavos: number): string {
  const signo = centavos < 0 ? '−' : '';
  const abs = Math.abs(centavos);
  const enteros = Math.floor(abs / 100);
  const resto = String(abs % 100).padStart(2, '0');
  return `${signo}${enteros},${resto}${DURO}$`;
}

/** «6 $» — sin centavos, para el aporte y los botones. */
export function formatearDineroRedondo(centavos: number): string {
  const exacto = centavos % 100 === 0;
  return exacto ? `${Math.round(centavos / 100)}${DURO}$` : formatearDinero(centavos);
}

/** Cifras tabulares, para que las columnas cuadren sin voz técnica. */
export const tabular = { fontVariant: ['tabular-nums' as const] };

type Props = TextProps & {
  centavos: number;
  /** true → «6 $» en vez de «6,00 $». */
  redondo?: boolean;
};

export function Dinero({ centavos, redondo = false, style, ...resto }: Props) {
  return (
    <Text {...resto} style={[tabular, style]}>
      {redondo ? formatearDineroRedondo(centavos) : formatearDinero(centavos)}
    </Text>
  );
}
