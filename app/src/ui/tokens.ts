import { Platform } from 'react-native';

/**
 * PARTIMOS · DESIGN SYSTEM V1
 *
 * Portado de `diseno/Partimos Main Screen.dc.html`, turno 10a («Foundation —
 * tokens and components») con las correcciones del turno 14. **Este sistema
 * sustituye al del traspaso anterior**, decidido por el usuario.
 *
 * Lo que cambia respecto de lo que había, y que conviene saber antes de tocar
 * una pantalla:
 *
 * - **Ya no hay azul.** El sistema anterior repartía la bandera por oficios
 *   —azul `#005293` dueño de las superficies, rojo `#D21034` dueño de la
 *   interacción—. El nuevo no tiene azul en ninguna parte: las superficies son
 *   blanco y gris de lienzo, y el rojo `#E1213B` es lo único que actúa.
 * - **Los neutros son fríos**, no cálidos. La rampa `ink` tira a violeta-gris
 *   y los fondos son gris de lienzo, no arena.
 * - **La escala de radios es fija y de cuatro pasos**: 10 fichas, 15 campos y
 *   botones, 20 tarjetas, 25 hojas. Nada de valores intermedios.
 * - **La rejilla es de 5 pt** y el gutter mide 20.
 *
 * Los nombres de la rampa anterior (`azul*`, `arena*`, `sand*`) se conservan
 * como alias sobre el sistema nuevo para que las pantallas sigan compilando
 * mientras se recorren una a una. **No los uses en código nuevo**: están
 * marcados abajo con su equivalente real.
 *
 * Valores exactos: no se ajustan «a ojo» en las pantallas.
 */

export const color = {
  /**
   * LA ACCIÓN. El único color que actúa: botones primarios, enlaces, estados
   * activos. Sobre blanco, nunca sobre otro relleno.
   */
  rojo500: '#E1213B',
  /** Pressed, y el texto de acento cuando el rojo puro no daría contraste. */
  rojo600: '#A6122A',
  rojo700: '#A6122A',
  rojo800: '#8F1024',
  /** El tinte: fondo de pastillas y avisos de acento. Lleva `rojo700` encima. */
  rojo50: '#FDE7EA',
  rojo100: '#FCE9EC',
  rojo200: '#F7C9D1',
  rojo300: '#EE8D9C',
  rojo400: '#E85A70',

  /**
   * LA TINTA. `#14141A` es el negro del sistema: titulares, cifras, cuerpo.
   *
   * `ink500` y `ink600` son los dos únicos grises que pueden llevar texto, y
   * el sistema los da medidos: secundario `#5A5A63` = 6,8:1, terciario
   * `#6B6B75` = 5,1:1. Los dos pasan AA en todos los tamaños en uso. Por
   * debajo de `ink600` no va texto: `ink400`, `ink300`, `ink200` e `ink100`
   * son para bordes, puntos y rellenos, nunca para leer.
   */
  ink900: '#14141A',
  ink800: '#17171A',
  ink700: '#2A2A31',
  /** Secundario · 6,8:1. Segundas líneas, horas de llegada, «por puesto». */
  ink500: '#5A5A63',
  /** Terciario · 5,1:1. Metadatos, epígrafes, el gris más claro con texto. */
  ink600: '#6B6B75',
  ink400: '#A6A6AF',
  ink300: '#C9C9D1',
  ink200: '#E6E6EA',
  ink100: '#F1F1F4',

  /**
   * LAS SUPERFICIES. `sand100` es el lienzo `#F5F5F7`, `sand200` el campo
   * `#F1F1F4`. Los nombres quedaron de la rampa cálida anterior; los valores
   * ya son los fríos del sistema nuevo.
   */
  sand50: '#FCFCFE',
  sand100: '#F5F5F7',
  sand200: '#F1F1F4',
  sand300: '#E6E6EA',

  /** Alias cálidos del sistema anterior. Equivalen al lienzo y al campo. */
  arena100: '#F5F5F7',
  arena200: '#F1F1F4',

  /**
   * ALIAS DEL AZUL RETIRADO.
   *
   * El sistema nuevo no tiene azul. Donde el azul vestía una superficie o un
   * epígrafe, ahora va tinta o gris; donde marcaba un relleno suave, va
   * lienzo. Se conservan para que las nueve pantallas que aún los nombran
   * compilen: al recorrerlas, sustitúyelos por `ink*` o `sand*`.
   */
  azul50: '#F5F5F7',
  azul100: '#F1F1F4',
  azul200: '#E6E6EA',
  azul300: '#C9C9D1',
  azul400: '#6B6B75',
  azul500: '#14141A',
  azul600: '#17171A',
  azul700: '#14141A',
  azul800: '#0E0E10',

  blanco: '#FFFFFF',
  oro500: '#E0A83C',
  verde500: '#0F7B4F',

  /**
   * LOS DOS ESTADOS QUE NO SON LA MARCA.
   *
   * El rojo es la marca, así que no puede querer decir «mal» ni «esperando».
   * El verde del sistema nuevo es `#0B5C3B` sobre `#E7F4EE`. El ámbar se
   * queda como estaba: el sistema no lo redefine y sigue siendo el único
   * color de espera.
   */
  hechoFondo: '#E7F4EE',
  hechoTinta: '#0B5C3B',
  esperaFondo: '#FBF0D8',
  esperaTinta: '#8A6413',

  /** El borde de tarjeta del sistema: 1 px `#E6E6EA`. */
  bordeSutil: '#E6E6EA',
  bordePorDefecto: '#C9C9D1',

  /** Disabled: relleno `#EDEDF0`, letra `#A6A6AF`. */
  inerteFondo: '#EDEDF0',
  inerteTinta: '#A6A6AF',

  /**
   * Restos del campo rojo héroe del sistema anterior. El sistema nuevo no
   * tiene superficie roja —el rojo sólo actúa, sobre blanco—, así que estos
   * dos desaparecen cuando se rehaga `CampoRojo.tsx`. Ver la nota de
   * `campoRojo` más abajo.
   */
  campoTexto: 'rgba(255,255,255,.92)',
  campoControl: 'rgba(255,255,255,.18)',
} as const;

/**
 * EL CAMPO ROJO — SUPERSEDIDO, PENDIENTE DE RETIRAR.
 *
 * El sistema anterior abría casi todas las pantallas con una superficie roja
 * a sangre de 326 px. **El sistema v1 no tiene superficie roja**: el rojo sólo
 * actúa —botones, enlaces, activos— y siempre sobre blanco. La pantalla de
 * inicio del turno 10d es lienzo con un H1 «Buscar viajes» en tinta.
 *
 * Se conserva para que `CampoRojo.tsx` y las siete pantallas que lo montan
 * sigan compilando. Los tonos se han llevado al rojo nuevo para que, mientras
 * dure la transición, no convivan dos rojos distintos en la misma app.
 */
export const campoRojo = {
  luz: 'rgba(255,216,188,.34)',
  sombra: 'rgba(143,16,36,.62)',
  de: '#E83950',
  medio: '#E1213B',
  a: '#A6122A',
  alturaInicio: 326,
  alturaSecundaria: 206,
} as const;

/**
 * LOS RADIOS, CON ASIGNACIÓN FIJA.
 *
 * Cuatro pasos y un círculo, y cada uno tiene su sitio. No se elige el radio
 * «que quede bien»: se elige por lo que es la pieza.
 *
 *   10 · fichas, pastillas, insignias
 *   15 · campos y botones
 *   20 · tarjetas
 *   25 · hojas y modales
 *   círculo · avatares
 */
export const radio = {
  /** Fichas e insignias. */
  ficha: 10,
  xs: 10,
  s: 10,
  cuadrado: 10,
  /** Campos y botones. */
  control: 15,
  m: 15,
  /** Tarjetas. */
  l: 20,
  /** Hojas y modales. */
  xl: 25,
  hoja: 25,
  /** Avatares y pastillas a media altura. */
  pastilla: 999,
} as const;

export const espacio = {
  /**
   * EL ANCHO DEL MARCO.
   *
   * El traspaso se dibujó a 390, que es el iPhone «normal». Pero el 14 Pro
   * mide 393, el Plus 428, el Pro Max 430 y el 16 Pro Max 440: en todos ellos
   * un marco de 390 centrado deja una franja de fondo a cada lado. Sobre el
   * campo rojo esa franja se ve como una raya clara pegada al borde, que es
   * exactamente lo que se veía en el teléfono, y al tocar cerca del borde la
   * página se desplazaba de lado.
   *
   * 440 cubre todos los iPhone en venta, así que en el teléfono la pantalla
   * llena la ventana y no hay franja. En el escritorio el marco sigue siendo
   * un teléfono, 50 px más ancho: nada del diseño depende de un ancho exacto,
   * todo mide en porcentaje o en flex.
   */
  marco: 440,
  /**
   * LA REJILLA DE 5 PT.
   *
   * El sistema v1 mide todo en múltiplos de cinco: 5 compacto, 10 de icono a
   * texto, 15 relleno interno, 20 gutter y separación entre componentes, 30
   * entre secciones, 40 entre bloques mayores. El gutter pasa de 26 a 20 —el
   * lienzo del diseño mide 393 con 20 a cada lado, o sea 353 de contenido—.
   */
  compacto: 5,
  iconoATexto: 10,
  relleno: 15,
  gutter: 20,
  seccion: 30,
  bloque: 40,

  entreTarjetas: 10,
  tarjeta: 20,
  hoja: 25,
  fila: 60,
  filaY: 15,
  control: 52,
  controlS: 40,
  /**
   * El área mínima de algo que se toca. Es también la corrección 5 del turno
   * 14: «Ver todo» y «Editar» medían 17 px de alto y no tenían zona de toque.
   */
  tap: 44,
} as const;

/**
 * UNA SOLA GROTESCA NEUTRA.
 *
 * El diseño v1 está dibujado en **Neue Montreal**, que es una tipografía de
 * pago y **no está en el repositorio**: no hay ningún fichero suyo en
 * `app/public/fuentes/`, donde sí está Inter Tight en cuatro pesos. La pila la
 * pide primero, de modo que si algún día se licencia y se añade, el diseño se
 * ve tal cual fue dibujado sin tocar una línea; mientras tanto cae en la misma
 * grotesca de siempre, que es la sustituta que el propio diseño declara.
 *
 * Nunca peso 300. No hay monoespaciada: los números usan cifras tabulares de
 * la misma fuente.
 */
export const familia = Platform.select({
  // Inter Tight se carga en app/+html.tsx; «Neue Montreal» sólo resuelve si se
  // instala. El orden es el del propio diseño.
  web: '"Neue Montreal", "Helvetica Neue", Helvetica, "Inter Tight", Arial, sans-serif',
  // En Apple la grotesca sustituta del diseño existe de verdad.
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
    shadowColor: '#14141A',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  l: {
    shadowColor: '#14141A',
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

/**
 * LA ESCALA, TAL COMO LA ESPECIFICA EL TURNO 10a.
 *
 * Seis pasos, con su interlineado en píxeles y su crenado por escalón. El
 * interlineado del sistema v1 es **absoluto**, no una razón: 28/34, 20/26,
 * 18/23, 14/20, 12/17, 10/14. `interlinea()` sigue exportada porque veintitrés
 * sitios la llaman, pero en código nuevo se escribe el número del sistema.
 */
export const texto = {
  /** H1 · 28/34 · -0,03 em. Titulares de pantalla: «Buscar viajes». */
  h1: { fontSize: 28, lineHeight: 34, letterSpacing: -0.84, fontWeight: '700' as const, ...conFuente },
  /** H2 · 20/26 · -0,02 em. Títulos de sección, y **el precio**. */
  h2: { fontSize: 20, lineHeight: 26, letterSpacing: -0.4, fontWeight: '700' as const, ...conFuente },
  /** H3 · 18/23 · -0,015 em. Horas: «14:30 → 20:15». */
  h3: { fontSize: 18, lineHeight: 23, letterSpacing: -0.27, fontWeight: '600' as const, ...conFuente },
  /** Body · 14/20. */
  cuerpo: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const, ...conFuente },
  /** Small · 12/17 · peso 500. Segundas líneas, en `ink500`. */
  pequeno: { fontSize: 12, lineHeight: 17, fontWeight: '500' as const, ...conFuente },
  /**
   * XS · 10/14 · 0,09 em, versalitas. **Sólo metadatos no esenciales**, que es
   * literalmente como los rotula el sistema: «DESDE · METADATA NO ESENCIAL».
   * Un epígrafe que titula una sección entera no es metadato: ese usa
   * `epigrafe`, abajo.
   */
  micro: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '500' as const,
    letterSpacing: 10 * 0.09,
    textTransform: 'uppercase' as const,
    ...conFuente,
  },

  /**
   * EL EPÍGRAFE QUE TITULA UNA SECCIÓN — «RUTA DEL VIAJE», «SALEN POR LA
   * NOCHE».
   *
   * Se queda en el paso Small, 12/17, y no baja al XS de 10. La razón está
   * medida y sigue valiendo en el sistema nuevo: once píxeles en versalitas
   * con el crenado abierto se descifran, no se leen, y fue el fallo más
   * repetido de la app. El sistema v1 reserva el XS para «metadata no
   * esencial»; estos epígrafes titulan secciones, así que no le corresponden.
   *
   * Con `ink600` sobre lienzo da 5,1:1, que pasa AA.
   */
  epigrafe: {
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 12 * 0.09,
    lineHeight: 17,
    textTransform: 'uppercase' as const,
    ...conFuente,
  },

  /**
   * EL PRECIO ES UN H2, NO UN CARTEL.
   *
   * Era 31 px en peso 700 y en rojo, más grande que el titular de la propia
   * pantalla. En el sistema v1 el precio se dibuja en H2 —20/26, peso 700— y
   * **en tinta, no en rojo**: el rojo es la acción, y un precio no se pulsa.
   */
  precio: { fontSize: 20, lineHeight: 26, letterSpacing: -0.4, fontWeight: '700' as const, ...conFuente },
  pastilla: { fontSize: 10, lineHeight: 14, fontWeight: '500' as const, ...conFuente },

  /** Alias del sistema anterior, para que las pantallas sigan compilando. */
  titular: { fontSize: 28, lineHeight: 34, letterSpacing: -0.84, fontWeight: '700' as const, ...conFuente },
  titularFuerte: { fontWeight: '700' as const },
  titularSecundario: { fontSize: 20, lineHeight: 26, letterSpacing: -0.4, fontWeight: '700' as const, ...conFuente },
  tituloTarjeta: { fontSize: 18, lineHeight: 23, letterSpacing: -0.27, fontWeight: '600' as const, ...conFuente },
  fila: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const, ...conFuente },
} as const;

/**
 * EL ÁREA MÍNIMA DE ALGO QUE SE TOCA, cuando lo que se toca es una palabra.
 *
 * React Native Web **no implementa `hitSlop`**: medido en el navegador, el
 * rectángulo que responde al dedo es exactamente el del elemento, ni un píxel
 * más. Un enlace de una línea mide dieciocho píxeles de alto —«ver todo»,
 * «Compartir mi llegada», «Cambiar»—, que es menos de la mitad de los
 * cuarenta y cuatro que pide cualquier guía táctil, y falla primero a quien
 * tiene el pulso menos firme o va en un carro en marcha, que es exactamente
 * quien usa esto.
 *
 * Así que el relleno tiene que ser de verdad. Esto se pone en el `Pressable`,
 * nunca en el `Text`: lo que crece es la zona que responde, no la letra.
 */
export const zonaDeToque = { minHeight: espacio.tap, justifyContent: 'center' } as const;

/**
 * EL VIDRIO.
 *
 * Una superficie translúcida sin desenfoque no es vidrio: es una capa a medio
 * pintar. Medido en la barra de «Pedir mi puesto» —blanco al 86 % sin
 * desenfoque—: el texto de la tarjeta de debajo se leía entero a través del
 * pie, y las dos capas se mezclaban en una sopa gris. El desenfoque es lo que
 * separa el primer plano del fondo; la translucidez sola sólo los junta.
 *
 * En el teléfono no hay `backdropFilter`, así que allí la superficie va casi
 * opaca y punto: mejor una capa honesta que un vidrio que no filtra.
 */
export const vidrio =
  Platform.OS === 'web'
    ? ({ backdropFilter: 'blur(20px) saturate(150%)' } as never)
    : null;
