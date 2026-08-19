import { Platform } from 'react-native';

/**
 * Los tokens del traspaso, portados desde design_system/tokens/*.css.
 * Valores exactos: no se ajustan «a ojo» en las pantallas.
 */

export const color = {
  rojo50: '#FDF2F3',
  rojo100: '#F9DEE2',
  rojo200: '#F2BBC3',
  rojo300: '#E68A98',
  rojo400: '#DC4E64',
  rojo500: '#D21034',
  rojo600: '#B00C2A',
  rojo700: '#8C0A22',
  rojo800: '#5E0717',

  azul50: '#EEF3F8',
  azul100: '#DBE7F0',
  azul200: '#B4CCE0',
  azul300: '#7AA6C7',
  azul400: '#2E76A8',
  azul500: '#005293',
  azul600: '#00436F',
  azul700: '#003A69',
  azul800: '#002741',

  arena100: '#FBEDDF',
  arena200: '#F6DCC2',

  ink900: '#26232B',
  ink800: '#332F39',
  ink700: '#4A4552',
  ink600: '#6B6672',
  ink500: '#857F8C',
  ink400: '#A19BA8',
  ink300: '#B7B2BC',
  ink200: '#D8D4DB',
  ink100: '#EBE7EC',

  sand50: '#FCFAF7',
  sand100: '#FAF7F3',
  sand200: '#F3EFE9',
  sand300: '#E9E4DC',

  blanco: '#FFFFFF',
  oro500: '#E0A83C',
  verde500: '#157A57',

  bordeSutil: '#EBE7EC',
  bordePorDefecto: '#D8D4DB',

  /** El texto sobre el campo rojo: blanco al 78 %. */
  campoTexto: 'rgba(255,255,255,.78)',
  /** Los controles que se sientan encima del campo. Nunca vidrio. */
  campoControl: 'rgba(255,255,255,.18)',
} as const;

/** El campo rojo. Tres capas: luz cálida arriba a la derecha, sombra abajo a la
 *  izquierda, y el degradado de bandera. Se compone con SVG en CampoRojo.tsx. */
export const campoRojo = {
  luz: 'rgba(255,216,188,.34)',
  sombra: 'rgba(94,7,23,.62)',
  de: '#DD1D3F',
  medio: '#D21034',
  a: '#AF0B29',
  alturaInicio: 326,
  alturaSecundaria: 206,
} as const;

export const radio = {
  xs: 6,
  s: 10,
  m: 14,
  l: 20,
  xl: 24,
  hoja: 26,
  cuadrado: 10,
  ficha: 12,
  control: 14,
  pastilla: 999,
} as const;

export const espacio = {
  gutter: 26,
  seccion: 32,
  entreTarjetas: 10,
  tarjeta: 22,
  hoja: 26,
  fila: 60,
  filaY: 15,
  control: 52,
  controlS: 40,
  tap: 44,
} as const;

/**
 * Una sola grotesca neutra: Helvetica Neue de verdad en Apple, Inter Tight en
 * el resto. Nunca peso 300. No hay monoespaciada: los números usan cifras
 * tabulares de la misma fuente.
 */
export const familia = Platform.select({
  // En web, la misma pila del traspaso: Inter Tight se carga en app/+html.tsx.
  web: '"Helvetica Neue", Helvetica, "Inter Tight", Arial, sans-serif',
  // En Apple la grotesca del diseño existe de verdad.
  ios: 'Helvetica Neue',
  // En Android hace falta registrar Inter Tight por peso, que pide una
  // compilación propia: en Expo Go se ve con la grotesca del sistema.
  default: undefined,
});

/**
 * La altura de línea del cuerpo, `--lh-body`. En el navegador el texto la
 * hereda; React Native no hereda nada, así que va explícita en cada estilo.
 * Sin ella cada fila queda ~4 px más corta y la pantalla entera se comprime.
 */
export const INTERLINEA = 1.45;

/** Redondeada al cuarto de píxel, como la calcula el navegador. */
export const interlinea = (tamano: number) => Math.round(tamano * INTERLINEA * 100) / 100;

const conFuente = { fontFamily: familia };

export const sombra = {
  s: {
    shadowColor: '#26232B',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  l: {
    shadowColor: '#26232B',
    shadowOpacity: 0.12,
    shadowRadius: 48,
    shadowOffset: { width: 0, height: 18 },
    elevation: 8,
  },
  /** La hoja blanca que monta sobre el campo, con sombra teñida de rojo. */
  hoja: {
    shadowColor: 'rgb(120,10,30)',
    shadowOpacity: 0.28,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
    elevation: 6,
  },
} as const;

/** `--track-micro` es 0.1em. En un epígrafe de 11px son 1,1px. */
export const TRACK_MICRO = 0.1;
export const trackMicro = (tamano: number) => tamano * TRACK_MICRO;

export const texto = {
  titular: { fontSize: 31, lineHeight: 32.55, letterSpacing: -1.24, fontWeight: '400' as const, ...conFuente },
  titularFuerte: { fontWeight: '600' as const },
  titularSecundario: { fontSize: 27, lineHeight: 28.35, letterSpacing: -1.13, fontWeight: '400' as const, ...conFuente },
  tituloTarjeta: { fontSize: 15.5, lineHeight: interlinea(15.5), letterSpacing: -0.28, fontWeight: '500' as const, ...conFuente },
  cuerpo: { fontSize: 14, lineHeight: interlinea(14), fontWeight: '400' as const, ...conFuente },
  fila: { fontSize: 14.5, lineHeight: interlinea(14.5), letterSpacing: -0.22, fontWeight: '500' as const, ...conFuente },
  epigrafe: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 11 * TRACK_MICRO,
    lineHeight: interlinea(11),
    textTransform: 'uppercase' as const,
    ...conFuente,
  },
  precio: { fontSize: 31, lineHeight: 27.9, fontWeight: '700' as const, letterSpacing: -1.4, ...conFuente },
  pastilla: { fontSize: 10.5, lineHeight: interlinea(10.5), fontWeight: '600' as const, ...conFuente },
} as const;
