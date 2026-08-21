import { Platform } from 'react-native';

/**
 * PARTIMOS · SISTEMA v6
 *
 * Portado de `diseno/Partimos App v6.dc.html`, decidido por el usuario como
 * **la estructura base de todas las pantallas**: «this is the base structure,
 * copy it on everywhere». El propio archivo trae su especificación en diez
 * secciones y nueve invariantes, y advierte: cada valor es el usado en el
 * archivo, sin aproximaciones. Aquí están esos valores, y solo esos.
 *
 * Lo que cambia respecto del sistema anterior (el v1 del canevas):
 *
 * - **El campo rojo héroe desaparece.** El usuario lo rechazó. Ninguna
 *   pantalla abre con una banda roja: todas abren sobre el lienzo `#F4F7F8`
 *   con dos halos radiales tenues (sarcelle y rojo) como única atmósfera.
 * - **La tinta es azul-sarcelle**, no violeta ni negra: `#0A2731` y su rampa.
 *   Es también la superficie oscura (chip Filtros, botón Publicar, bisel).
 * - **El rojo queda reservado a cuatro sentidos** — destino, acción primaria,
 *   poca disponibilidad, «en vivo» — y a nada decorativo. Invariante 4 del
 *   propio archivo.
 * - **La grotesca es Switzer** (autoalojada en `public/fuentes/`), con
 *   Helvetica Neue e Inter Tight detrás.
 * - Los números comparables — horas, precios, duraciones, calificaciones —
 *   van SIEMPRE en cifras tabulares. Invariante 9.
 */

export const color = {
  /**
   * LA TINTA, seis pasos medidos por el propio diseño.
   *
   * `ink900` es texto primario Y superficie oscura: el chip «Filtros», el
   * botón de publicar, el bisel del teléfono. Los pasos 500/600 son los
   * grises con oficio fijo: 500 rotula secciones y meta, 600 lleva unidades
   * y cejas de campo. `ink400` es texto agotado/deshabilitado; `ink300` son
   * guiones, chevrones y raíles apagados — **nunca texto corrido**.
   */
  ink900: '#0A2731',
  /** El extremo claro del degradado del botón Publicar (160°, hacia ink900). */
  ink800: '#123F4D',
  /** Ink 2 · rótulos de control, cuerpo secundario, nombres de lugar. */
  ink700: '#2A4B55',
  /** Ink 3 · rótulos de sección, meta, la línea de confianza. */
  ink500: '#5A757E',
  /** Ink 4 · unidades («B/»), meta terciaria, cejas de campo. */
  ink600: '#7C959D',
  /** Ink 5 · texto agotado y deshabilitado. */
  ink400: '#93A8AE',
  /** Ink 6 · guiones, chevrones, raíl deshabilitado. Nunca para leer. */
  ink300: '#B0C1C6',
  /**
   * Los dos grises DE ICONO del dibujo v6, que la tabla de color no lista
   * pero el archivo usa en cada pantalla: `#6C8A93` para iconos en reposo
   * (pestañas inactivas, aro del raíl, campana del agotado) y `#3E5D67`
   * para los iconos de cabecera (campana, lápiz).
   */
  inkIcono: '#6C8A93',
  inkIconoFuerte: '#3E5D67',
  ink200: '#D5E2E5',
  ink100: '#EAF1F2',

  /**
   * EL ACENTO, en tres profundidades con oficio distinto:
   * `rojo500` actúa (CTA, marcador de destino, punto en vivo, insignias de
   * cuenta); `rojo700` es el acento de TEXTO sobre blanco (enlaces, «Llega»,
   * pestañas activas); `rojo800` es el acento dentro de un chip teñido
   * (pocos cupos, «Mejor opción»). `rojo600` es el pressed del CTA.
   */
  rojo500: '#E1213B',
  rojo600: '#A6122A',
  rojo700: '#C11730',
  rojo800: '#B01128',
  /** El tinte: `rgba(225,33,59,.10)` aplanado sobre blanco. */
  rojo100: '#FCE9EC',
  rojo50: '#FDF0F2',
  rojo200: '#F7C9D1',
  rojo300: '#EE8D9C',
  rojo400: '#E85A70',

  /**
   * LAS SUPERFICIES. Tarjetas y hojas son blanco pleno; el suelo de pantalla
   * es `#F4F7F8`; detrás del teléfono (solo en el canvas de diseño) está
   * `#E9EEEF`. Los nombres `sand*`/`arena*` quedaron de sistemas anteriores
   * y hoy resuelven al lienzo frío del v6.
   */
  blanco: '#FFFFFF',
  sand50: '#FFFFFF',
  sand100: '#F4F7F8',
  sand200: '#EFF3F4',
  sand300: '#E9EEEF',
  arena100: '#F4F7F8',
  arena200: '#EFF3F4',

  /** Alias del azul retirado hace dos sistemas; hoy la tinta ES azulada. */
  azul50: '#F4F7F8',
  azul100: '#EAF1F2',
  azul200: '#D5E2E5',
  azul300: '#B0C1C6',
  azul400: '#7C959D',
  azul500: '#0A2731',
  azul600: '#123F4D',
  azul700: '#0A2731',
  azul800: '#0A2731',

  /**
   * LOS BORDES Y LOS LAVADOS: el diseño los escribe como tinta con alfa para
   * que funcionen sobre blanco y sobre lienzo por igual.
   */
  bordeSutil: 'rgba(10,39,49,.08)',
  bordePorDefecto: 'rgba(10,39,49,.11)',
  /** El fondo pulsado de una celda de icono: «a 6 % ink wash». */
  lavado: 'rgba(10,39,49,.06)',
  lavadoChip: 'rgba(10,39,49,.05)',
  /** El separador dentro de una tarjeta: 1px, a todo el ancho. */
  divisor: 'rgba(10,39,49,.07)',

  /**
   * LOS DOS ESTADOS QUE NO SON LA MARCA. El rojo tiene sus cuatro sentidos
   * tasados, así que «hecho» y «esperando» siguen fuera de él.
   */
  hechoFondo: '#E7F4EE',
  hechoTinta: '#0B5C3B',
  esperaFondo: '#FBF0D8',
  esperaTinta: '#8A6413',
  verde500: '#0F7B4F',
  oro500: '#E0A83C',

  inerteFondo: 'rgba(10,39,49,.06)',
  inerteTinta: '#93A8AE',

  /**
   * RESTOS DEL CAMPO ROJO HÉROE, que ya no existe. Las pantallas que aún
   * nombran estos dos tokens ponían texto blanco y controles translúcidos
   * sobre una banda roja; la banda es ahora el lienzo claro, así que el
   * «texto sobre el campo» es tinta secundaria y el «control sobre el campo»
   * es el lavado estándar. Así, cada cabecera vieja se vuelve legible sobre
   * claro sin tocar la pantalla. Retirar cuando ninguna pantalla los nombre.
   */
  campoTexto: '#5A757E',
  campoControl: 'rgba(10,39,49,.06)',
} as const;

/**
 * LOS DOS HALOS DEL LIENZO — la única atmósfera que tiene una pantalla.
 * Sarcelle arriba-izquierda, rojo arriba-derecha, y ninguno intercepta un
 * toque. Los dibuja `CampoRojo.tsx` (hoy `FondoAmbiente`).
 */
export const ambiente = {
  sarcelle: 'rgba(38,120,140,.16)',
  rojo: 'rgba(225,33,59,.10)',
} as const;

/**
 * LOS RADIOS, sección 05 de la spec, con su regla: **una superficie anidada
 * resta el padding de la madre** (miniatura 8 dentro de tarjeta 16 con
 * padding 8); los controles conservan su propia escala e ignoran la regla.
 */
export const radio = {
  /** Superficie anidada (miniatura dentro de una tarjeta). */
  anidado: 8,
  xs: 8,
  /** Chip retirable, 32 de alto. */
  ficha: 11,
  s: 11,
  /** Chip de barra (Filtros, orden, fecha), 38 de alto. */
  cuadrado: 13,
  /** Celda de icono con fondo pulsado, 44 × 44. */
  icono: 14,
  /** Control dentro de tarjeta (48), tarjeta favorita, fila compacta. */
  control: 16,
  m: 16,
  /** Botón a todo lo ancho, 54 — primario y secundario por igual. */
  boton: 18,
  /** Tarjeta de viaje y tarjeta de búsqueda. */
  l: 24,
  xl: 24,
  hoja: 24,
  pastilla: 999,
} as const;

export const espacio = {
  /**
   * EL ANCHO DEL MARCO. El diseño se dibuja a 393 (iPhone 14/15), pero a 393
   * reales los iPhone anchos dejaban una franja de fondo a cada lado — fallo
   * medido en el teléfono. 440 cubre todos los iPhone en venta; en escritorio
   * el marco sigue siendo un teléfono. Nada del diseño depende del ancho
   * exacto: todo mide en porcentaje o en flex.
   */
  marco: 440,

  /**
   * LA ESCALA, sección 02: 4 · 8 · 10 · 12 · 16 · 20, y en el teléfono el
   * hueco más grande ES 20. El 10 tiene un solo oficio: icono-o-imagen a
   * texto, nada más.
   */
  compacto: 4,
  chip: 8,
  iconoATexto: 10,
  fila: 12,
  relleno: 16,
  gutter: 20,
  seccion: 20,
  bloque: 20,

  entreTarjetas: 16,
  tarjeta: 16,
  hoja: 20,
  filaY: 12,

  /** Alturas de control, sección 07: 32 · 38 · 44 · 48 · 52 · 54. */
  chipS: 32,
  chipBarra: 38,
  tap: 44,
  controlS: 48,
  campo: 52,
  control: 54,
} as const;

/**
 * UNA SOLA GROTESCA: **Switzer**, la del v6, autoalojada en
 * `public/fuentes/Switzer-{400,500,600,700}.woff2` y declarada en
 * `app/+html.tsx`. Detrás, la misma cadena de siempre: Helvetica Neue en
 * Apple, Inter Tight donde esté registrada, Arial al final. En el teléfono
 * nativo Switzer no está registrada todavía — allí manda la reserva.
 */
export const familia = Platform.select({
  web: '"Switzer", "Helvetica Neue", Helvetica, "Inter Tight", Arial, sans-serif',
  ios: 'Helvetica Neue',
  default: undefined,
});

/** Cifras tabulares — invariante 9: todo número comparable las lleva. */
export const tabulares = { fontVariant: ['tabular-nums'] as 'tabular-nums'[] };

/**
 * La altura de línea del cuerpo para las pantallas aún no migradas a la
 * escala v6 (23 sitios la llaman). En código nuevo se escribe el interlineado
 * absoluto del paso, nunca esta razón.
 */
export const INTERLINEA = 1.45;
export const interlinea = (tamano: number) => Math.round(tamano * INTERLINEA * 100) / 100;

const conFuente = { fontFamily: familia };

/**
 * LAS SOMBRAS, tal como las tasa la sección 07:
 * tarjetas 0 4 14 al 5 % · tarjeta de búsqueda 0 12 32 al 7 % ·
 * destacada 0 16 36 al 10 % · CTA rojo 0 10 24 al 28 % del acento.
 */
export const sombra = {
  s: {
    shadowColor: '#0A2731',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  busqueda: {
    shadowColor: '#0A2731',
    shadowOpacity: 0.07,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
  },
  l: {
    shadowColor: '#0A2731',
    shadowOpacity: 0.1,
    shadowRadius: 36,
    shadowOffset: { width: 0, height: 16 },
    elevation: 8,
  },
  cta: {
    shadowColor: '#E1213B',
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  /** El botón Publicar de la barra: sombra de tinta, más corta y más honda. */
  publicar: {
    shadowColor: '#0A2731',
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
  },
  hoja: {
    shadowColor: '#0A2731',
    shadowOpacity: 0.1,
    shadowRadius: 36,
    shadowOffset: { width: 0, height: 16 },
    elevation: 8,
  },
} as const;

export const TRACK_MICRO = 0.1;
export const trackMicro = (tamano: number) => tamano * TRACK_MICRO;

/**
 * LA ESCALA, sección 03 de la spec — tamaño / peso / interlineado absolutos,
 * con el crenado de cada paso. Los nombres dicen el oficio, porque en el v6
 * cada paso TIENE oficio: no se elige el «que quede bien».
 */
export const texto = {
  /** 22/600/26 · −0.035em — título de pantalla («¿Para dónde partimos hoy?»). */
  titulo: { fontSize: 22, lineHeight: 26, letterSpacing: -0.77, fontWeight: '600' as const, ...conFuente },
  /** 24/600/28 · −0.035em — cabecera de ruta en Resultados (DESDE / HASTA). */
  ruta: { fontSize: 24, lineHeight: 28, letterSpacing: -0.84, fontWeight: '600' as const, ...conFuente },
  /** 19/600/23 · −0.03em, tabular — horas de salida y llegada. */
  hora: { fontSize: 19, lineHeight: 23, letterSpacing: -0.57, fontWeight: '600' as const, ...conFuente, ...tabulares },
  /**
   * 22/600/24 · −0.035em, tabular — la cifra del aporte. La precede un «B/»
   * de 12/500 en `ink600`, sobre la misma línea de base. El precio va en
   * TINTA: el rojo tiene cuatro sentidos y «precio» no es ninguno.
   */
  precio: { fontSize: 22, lineHeight: 24, letterSpacing: -0.77, fontWeight: '600' as const, ...conFuente, ...tabulares },
  /** 12/500/16 — la unidad «B/» junto al precio. */
  precioUnidad: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const, ...conFuente },
  /** 16/600/21 · −0.03em — destino favorito. */
  favorito: { fontSize: 16, lineHeight: 21, letterSpacing: -0.48, fontWeight: '600' as const, ...conFuente },
  /** 15/500/20 · −0.015em — valores de campo; a peso 600 es rótulo de botón. */
  campo: { fontSize: 15, lineHeight: 20, letterSpacing: -0.22, fontWeight: '500' as const, ...conFuente },
  boton: { fontSize: 15, lineHeight: 20, letterSpacing: -0.15, fontWeight: '600' as const, ...conFuente },
  /** 13/500/18 · −0.01em — nombre del conductor, rótulos de control. */
  nombre: { fontSize: 13, lineHeight: 18, letterSpacing: -0.13, fontWeight: '500' as const, ...conFuente },
  /** 12/500/17 · −0.01em — el lugar bajo su propia hora. */
  lugar: { fontSize: 12, lineHeight: 17, letterSpacing: -0.12, fontWeight: '500' as const, ...conFuente },
  /** 12/400/17 — meta: calificaciones, cuentas de viajes, paradas. */
  meta: { fontSize: 12, lineHeight: 17, fontWeight: '400' as const, ...conFuente },
  metaS: { fontSize: 11, lineHeight: 15, fontWeight: '400' as const, ...conFuente },
  /** 14/400/20 — cuerpo corrido (explicaciones, avisos). */
  cuerpo: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const, ...conFuente },
  /** 10/600/13 · +0.1em versalitas — SALE / LLEGA, texto de insignia. */
  ceja: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600' as const,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    ...conFuente,
  },
  /** 11/600/15 · +0.13em versalitas — cabeceras de sección. */
  epigrafe: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600' as const,
    letterSpacing: 1.43,
    textTransform: 'uppercase' as const,
    ...conFuente,
  },
  /** 10/500/13 — duraciones y rótulos de la barra de pestañas. */
  micro: { fontSize: 10, lineHeight: 13, fontWeight: '500' as const, ...conFuente },
  /** 10/400/13 — cuenta de paradas. */
  microSuave: { fontSize: 10, lineHeight: 13, fontWeight: '400' as const, ...conFuente },

  /** Alias de sistemas anteriores, apuntados al paso v6 más cercano. */
  titular: { fontSize: 22, lineHeight: 26, letterSpacing: -0.77, fontWeight: '600' as const, ...conFuente },
  titularFuerte: { fontWeight: '700' as const },
  titularSecundario: { fontSize: 22, lineHeight: 26, letterSpacing: -0.77, fontWeight: '600' as const, ...conFuente },
  tituloTarjeta: { fontSize: 16, lineHeight: 21, letterSpacing: -0.48, fontWeight: '600' as const, ...conFuente },
  h1: { fontSize: 22, lineHeight: 26, letterSpacing: -0.77, fontWeight: '600' as const, ...conFuente },
  h2: { fontSize: 19, lineHeight: 23, letterSpacing: -0.57, fontWeight: '600' as const, ...conFuente },
  h3: { fontSize: 16, lineHeight: 21, letterSpacing: -0.48, fontWeight: '600' as const, ...conFuente },
  fila: { fontSize: 13, lineHeight: 18, letterSpacing: -0.13, fontWeight: '500' as const, ...conFuente },
  pequeno: { fontSize: 12, lineHeight: 17, fontWeight: '500' as const, ...conFuente },
  pastilla: { fontSize: 10, lineHeight: 13, fontWeight: '600' as const, letterSpacing: 1, ...conFuente },
} as const;

/**
 * EL ÁREA MÍNIMA DE ALGO QUE SE TOCA — 44 px, sección 07. React Native Web
 * no implementa `hitSlop`, así que el relleno tiene que ser de verdad, y se
 * pone en el `Pressable`, nunca en el `Text`.
 */
export const zonaDeToque = { minHeight: espacio.tap, justifyContent: 'center' } as const;

/**
 * LOS ESTADOS PULSADOS, sección 07, tres y solo tres:
 * botones a `scale(.97)`, tarjetas a `scale(.985)`, celdas de icono con el
 * lavado del 6 %. 120 ms ease-out. En RN el timing lo pone el Pressable.
 */
export const pulsado = {
  boton: { transform: [{ scale: 0.97 }] },
  tarjeta: { transform: [{ scale: 0.985 }] },
  celda: { backgroundColor: color.lavado },
} as const;

/**
 * EL VIDRIO. La barra de pestañas es blanco al 94 % con borde superior; en
 * web se le suma desenfoque real. En el teléfono no hay `backdropFilter`:
 * mejor una capa casi opaca honesta que un vidrio que no filtra.
 */
export const vidrio =
  Platform.OS === 'web'
    ? ({ backdropFilter: 'blur(20px) saturate(150%)' } as never)
    : null;
