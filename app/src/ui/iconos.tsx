/**
 * Iconos dibujados a mano, una sola rejilla de 24, extremos redondos.
 * Los `d` son los del diseño, no aproximaciones.
 *
 * **El trazo ya no se escribe icono a icono.** Era la corrección 4 del turno
 * 14: estaban «dibujados en seis rejillas distintas con seis pesos de trazo»,
 * y el resultado es que a tamaño pequeño unos se ven pálidos y otros gordos
 * junto a los demás. Ahora todos salen de `trazo()`, abajo.
 */

import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { color } from './tokens';

/**
 * EL PESO ÓPTICO, CONSTANTE A CUALQUIER TAMAÑO.
 *
 * Todos los iconos se dibujan en una caja de 24 y luego se escalan. Al
 * encogerlos, el trazo encoge con ellos: un 1.75 dibujado en la caja de 24 se
 * queda en 1.17 px cuando el icono se pinta a 16, y al lado de uno de 24 se ve
 * descolorido. Se compensa al revés — cuanto más pequeño se pinta, más grueso
 * se dibuja— con la regla que da el propio sistema:
 *
 *     trazo = 1.6 × 24 ÷ tamaño
 *
 * Así los tres tamaños en uso rinden **1,6 px ópticos**: 24 de navegación,
 * 20 de filas de lista, 16 en línea.
 */
export const trazo = (tamano: number) => (1.6 * 24) / tamano;

type Props = { tamano?: number; tinta?: string; grueso?: number };

/** Sobre el lienzo claro del v6 la flecha es tinta; nadie vuelve sobre rojo. */
export function Atras({ tamano = 23, tinta = color.ink900 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path
        d="M15 5l-7 7 7 7"
        stroke={tinta}
        strokeWidth={trazo(tamano)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * EL CARRO. Antes eran dos cajas apiladas con dos puntos debajo: a 19 px se
 * leía como una furgoneta chata, y el usuario lo señaló.
 *
 * Ahora es la silueta de perfil que se reconoce de un vistazo: **una sola
 * línea** hace techo, parabrisas y capó, baja a los dos extremos y se abre en
 * los pasos de rueda; las ruedas son aros centrados sobre esa misma línea, de
 * modo que el arco que entra en la carrocería ES el guardabarros. La cintura
 * separa la cabina del cuerpo — sin ella el techo parece una joroba.
 */
export function Carro({ tamano = 19, tinta = color.ink600, grueso }: Props) {
  const t = grueso ?? trazo(tamano);
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      {/* Techo, parabrisas y costados, de esquina baja a esquina baja. */}
      <Path
        d="M2.7 15.5v-2.4c0-.53.33-1 .83-1.18l2.55-.92 1.9-2.74A2.7 2.7 0 0 1 10.2 7.1h3.6c.88 0 1.7.43 2.22 1.16l1.9 2.74 2.55.92c.5.18.83.65.83 1.18v2.4"
        stroke={tinta}
        strokeWidth={t}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* El suelo, partido: los huecos son los pasos de rueda. */}
      <Path
        d="M2.7 15.5h2.3M9.1 15.5h5.8M19 15.5h2.3"
        stroke={tinta}
        strokeWidth={t}
        strokeLinecap="round"
      />
      {/* La cintura: donde acaba el cristal y empieza la chapa. */}
      <Path d="M6.08 10.99h11.84" stroke={tinta} strokeWidth={t} strokeLinecap="round" />
      <Circle cx={7.05} cy={15.5} r={2.05} stroke={tinta} strokeWidth={t} />
      <Circle cx={16.95} cy={15.5} r={2.05} stroke={tinta} strokeWidth={t} />
    </Svg>
  );
}

export function Mas({ tamano = 16, tinta = color.azul700 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path d="M12 5v14M5 12h14" stroke={tinta} strokeWidth={trazo(tamano)} strokeLinecap="round" />
    </Svg>
  );
}

export function Cerrar({ tamano = 12, tinta = color.ink600 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path d="M6 6l12 12M18 6L6 18" stroke={tinta} strokeWidth={trazo(tamano)} strokeLinecap="round" />
    </Svg>
  );
}

export function Pin({ tamano = 15, tinta = color.azul500 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path
        d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"
        stroke={tinta}
        strokeWidth={trazo(tamano)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={10} r={2.4} stroke={tinta} strokeWidth={trazo(tamano)} />
    </Svg>
  );
}

export function Maleta({ tamano = 15, tinta = color.ink600 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Rect x={3} y={7} width={18} height={13} rx={2.5} stroke={tinta} strokeWidth={trazo(tamano)} />
      <Path d="M9 7V4.8h6V7" stroke={tinta} strokeWidth={trazo(tamano)} strokeLinecap="round" />
    </Svg>
  );
}

export function Visto({ tamano = 14, tinta = '#fff' }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path
        d="M5 12.5l4.5 4.5L19 7.5"
        stroke={tinta}
        strokeWidth={trazo(tamano)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function Estrella({ tamano = 11, tinta = color.oro500 }: Props) {
  return (
    <Svg viewBox="0 0 12 12" width={tamano} height={tamano}>
      <Path d="M6 .8 7.5 4h3.4L8.2 6.2l1 3.4L6 7.7 2.8 9.6l1-3.4L1.1 4h3.4z" fill={tinta} />
    </Svg>
  );
}

export function Filtros({ tamano = 19, tinta = '#fff' }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path d="M4 6h16M7 12h10M10 18h4" stroke={tinta} strokeWidth={trazo(tamano)} strokeLinecap="round" />
    </Svg>
  );
}

export function Compartir({ tamano = 19, tinta = color.ink900 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path
        d="M12 15V4M8.5 7.5 12 4l3.5 3.5"
        stroke={tinta}
        strokeWidth={trazo(tamano)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5"
        stroke={tinta}
        strokeWidth={trazo(tamano)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** El escudo del v6 — el de «Solo conductores…», de la caja de 16 a la de 24. */
export function Escudo({ tamano = 18, tinta = color.inkIcono, grueso }: Props) {
  const t = grueso ?? trazo(tamano);
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path
        d="M12 2.1 19.2 4.8v6.45c0 4.8-3.15 8.4-7.2 10.65-4.05-2.25-7.2-5.85-7.2-10.65V4.8L12 2.1Z"
        stroke={tinta}
        strokeWidth={t}
        strokeLinejoin="round"
      />
      <Path
        d="m8.55 12 2.55 2.55 4.65-5.1"
        stroke={tinta}
        strokeWidth={t}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * LOS CUATRO DE LA BARRA, EN REPOSO Y ACTIVOS.
 *
 * Corrección 3 del turno 14: las pestañas activas se distinguían **solo por el
 * color**, y eso no llega a quien no distingue ese color. Ahora la forma
 * cambia con el estado — **activo relleno, en reposo de contorno**—, así que
 * el color deja de ser el único portador del dato.
 */
type PropsPestana = Props & { lleno?: boolean };

export function Lupa({ tamano = 21, tinta = color.ink700, grueso, lleno }: PropsPestana) {
  const t = grueso ?? trazo(tamano);
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Circle cx={11} cy={11} r={6.4} fill={lleno ? tinta : 'none'} stroke={tinta} strokeWidth={t} />
      <Path d="m15.9 15.9 4.3 4.3" stroke={tinta} strokeWidth={t} strokeLinecap="round" />
    </Svg>
  );
}

/**
 * EL BOLETO — corrección 2 del turno 14.
 *
 * «Viajes» llevaba un icono de formulario, y el sistema lo dice sin rodeos:
 * *«es un formulario»*. Un icono dice qué hay detrás, y si miente, la persona
 * aprende a desconfiar de la barra entera. Detrás de «Mis viajes» hay puestos
 * reservados, así que es **un boleto**: el rectángulo con las dos muescas y la
 * línea de picado.
 */
export function Boleto({ tamano = 21, tinta = color.ink700, lleno }: PropsPestana) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path
        d="M3 8.5V6.5a1.5 1.5 0 0 1 1.5-1.5h15A1.5 1.5 0 0 1 21 6.5v2a2.5 2.5 0 0 0 0 5v2a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 15.5v-2a2.5 2.5 0 0 0 0-5Z"
        fill={lleno ? tinta : 'none'}
        stroke={tinta}
        strokeWidth={trazo(tamano)}
        strokeLinejoin="round"
      />
      <Path
        d="M14.5 5v14"
        stroke={lleno ? '#fff' : tinta}
        strokeWidth={trazo(tamano)}
        strokeLinecap="round"
        strokeDasharray="1.6 2.4"
      />
    </Svg>
  );
}

/** El globo de diálogo del v6 — la burbuja redonda con la cola a la izquierda. */
export function Chat({ tamano = 21, tinta = color.ink700, grueso, lleno }: PropsPestana) {
  const t = grueso ?? trazo(tamano);
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path
        d="M12 4.8c4.2 0 7.6 2.9 7.6 6.5s-3.4 6.5-7.6 6.5c-.9 0-1.7-.1-2.5-.4l-4.1 1.6 1.2-3.4a6.2 6.2 0 0 1-1.8-4.3c0-3.6 3.4-6.5 7.2-6.5Z"
        fill={lleno ? tinta : 'none'}
        stroke={tinta}
        strokeWidth={t}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function Persona({ tamano = 21, tinta = color.ink700, grueso, lleno }: PropsPestana) {
  const t = grueso ?? trazo(tamano);
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Circle cx={12} cy={8.4} r={3.8} fill={lleno ? tinta : 'none'} stroke={tinta} strokeWidth={t} />
      <Path
        d="M4.8 19.6c1.2-3.7 3.9-5.6 7.2-5.6s6 1.9 7.2 5.6"
        fill="none"
        stroke={tinta}
        strokeWidth={t}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * La marca: cuatro cuadrados en rejilla, la geometría de la bandera. No hay
 * archivo de logo en el traspaso; se dibuja.
 */
/**
 * LA MARCA DEL v6: dos caminos que se separan del mismo punto — el de la
 * izquierda en acento, el de la derecha en tinta — y el punto de partida en
 * rojo. Es el dibujo del propio producto: dos que parten juntos.
 *
 * `tinta` viste el camino derecho (tinta por defecto; blanco sobre oscuro).
 * El camino izquierdo y el punto se quedan en el acento salvo que la marca
 * entera vaya monocroma sobre oscuro.
 */
export function Marca({ tamano = 21, tinta = color.ink900 }: Props) {
  const monocroma = tinta === '#fff' || tinta === color.blanco;
  const acento = monocroma ? tinta : color.rojo500;
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path d="M5 19c0-6.5 3.8-8.6 6.5-12" stroke={acento} strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M19 19c0-6.5-3.8-8.6-6.5-12" stroke={tinta} strokeWidth={2.4} strokeLinecap="round" />
      <Circle cx={12} cy={5.4} r={2.1} fill={acento} />
    </Svg>
  );
}

/**
 * La marca en sus dos colores, dentro de su cuadrado blanco. Es la única vez
 * que el rojo y el azul se tocan, y funciona porque son cuatro cuadrados
 * separados por el blanco de detrás: la geometría de la bandera.
 */
export function MarcaColor({ tamano = 44 }: { tamano?: number }) {
  const hueco = 2;
  const relleno = 7;
  const c = (tamano - relleno * 2 - hueco) / 2;
  const cuadro = (x: number, y: number, tinta: string) => (
    <Rect x={x} y={y} width={c} height={c} rx={2} fill={tinta} />
  );
  return (
    <Svg width={tamano} height={tamano} viewBox={`0 0 ${tamano} ${tamano}`}>
      <Rect x={0} y={0} width={tamano} height={tamano} rx={10} fill="#fff" />
      {cuadro(relleno, relleno, color.rojo500)}
      {cuadro(relleno + c + hueco, relleno, color.azul500)}
      {cuadro(relleno, relleno + c + hueco, color.azul500)}
      {cuadro(relleno + c + hueco, relleno + c + hueco, color.rojo500)}
    </Svg>
  );
}

export function Avion({ tamano = 20, tinta = '#fff' }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path
        d="M4 12l16-8-6 8 6 8z"
        stroke={tinta}
        strokeWidth={trazo(tamano)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** La estrella grande de `1j`, que se rellena o se queda en contorno. */
export function EstrellaGrande({ tamano = 44, llena = true }: { tamano?: number; llena?: boolean }) {
  const d = 'M12 2.6l2.9 6 6.6.8-4.8 4.5 1.2 6.5L12 17.2l-5.9 3.2 1.2-6.5L2.5 9.4l6.6-.8z';
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      {llena ? (
        <Path d={d} fill={color.oro500} />
      ) : (
        <Path d={d} stroke={color.ink200} strokeWidth={trazo(tamano)} />
      )}
    </Svg>
  );
}

/** Cobertura y batería de la barra de estado del diseño. */
export function Cobertura({ tinta = '#fff' }: Props) {
  return (
    <Svg viewBox="0 0 18 12" width={17} height={11}>
      <Rect x={0} y={8} width={3} height={4} rx={1} fill={tinta} />
      <Rect x={4.5} y={5.5} width={3} height={6.5} rx={1} fill={tinta} />
      <Rect x={9} y={3} width={3} height={9} rx={1} fill={tinta} />
      <Rect x={13.5} y={0} width={3} height={12} rx={1} fill={tinta} />
    </Svg>
  );
}

export function Bateria({ tinta = '#fff' }: Props) {
  return (
    <Svg viewBox="0 0 26 13" width={24} height={12} fill="none">
      <Rect x={0.6} y={0.6} width={21} height={11.8} rx={3.4} stroke={tinta} strokeOpacity={0.45} />
      <Rect x={2.4} y={2.4} width={17.4} height={8.2} rx={2.2} fill={tinta} />
      <Path d="M23.4 4.4v4.2c1.2-.4 1.7-1.1 1.7-2.1s-.5-1.7-1.7-2.1Z" fill={tinta} fillOpacity={0.5} />
    </Svg>
  );
}

/**
 * El aviso de que algo salió mal. Un triángulo con su admiración dentro.
 *
 * `SISTEMA.md`: el error **no puede ser solo color**, porque el rojo es lo que
 * se pulsa. Va en `rojo-700` —más oscuro que cualquier botón— y **con este
 * icono al lado**, que es lo que lo separa de una etiqueta cualquiera.
 */
/** La punta que dice que una fila lleva a otro sitio. */
/** El chevron del v6: «hay más detrás», en gris de trazo apagado. */
export function Avanza({ tamano = 16, tinta = color.ink300, grueso }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path
        d="m9.6 4.8 7.2 7.2-7.2 7.2"
        stroke={tinta}
        strokeWidth={grueso ?? 2.1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * El puesto: una butaca de perfil, el respaldo y el asiento. Dos rectángulos
 * redondeados y nada más — cualquier cosa con más curvas a 20 px se lee como
 * un garabato, que es lo que pasaba con la primera versión.
 */
export function Asiento({ tamano = 20, tinta = '#fff' }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Rect x={6.4} y={3.6} width={4} height={11} rx={2} stroke={tinta} strokeWidth={trazo(tamano)} />
      <Rect x={6.4} y={13.4} width={11.2} height={4} rx={2} stroke={tinta} strokeWidth={trazo(tamano)} />
      <Path d="M17.6 17.4v2.8" stroke={tinta} strokeWidth={trazo(tamano)} strokeLinecap="round" />
    </Svg>
  );
}

/** El bocadillo con la interrogación: la ayuda. */
export function Ayuda({ tamano = 18, tinta = color.ink600 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Circle cx={12} cy={12} r={8.6} stroke={tinta} strokeWidth={trazo(tamano)} />
      <Path
        d="M9.7 9.4a2.4 2.4 0 1 1 3.1 2.6c-.6.2-.9.8-.9 1.4v.4"
        stroke={tinta}
        strokeWidth={trazo(tamano)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M11.9 16.6h.01" stroke={tinta} strokeWidth={trazo(tamano)} strokeLinecap="round" />
    </Svg>
  );
}

/** La cédula: el rectángulo con la foto y las dos líneas. */
export function Cedula({ tamano = 20, tinta = color.ink600 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Rect x={2.6} y={5} width={18.8} height={14} rx={3} stroke={tinta} strokeWidth={trazo(tamano)} />
      <Circle cx={8.6} cy={11.4} r={2.1} stroke={tinta} strokeWidth={trazo(tamano)} />
      <Path d="M5.4 16.2c.5-1.3 1.7-2 3.2-2s2.7.7 3.2 2" stroke={tinta} strokeWidth={trazo(tamano)} strokeLinecap="round" />
      <Path d="M14.6 10.4h4.2M14.6 13.8h4.2" stroke={tinta} strokeWidth={trazo(tamano)} strokeLinecap="round" />
    </Svg>
  );
}

/** Cómo se paga: el billete. Ni tarjeta ni moneda — aquí se paga de mano a mano. */
export function Billete({ tamano = 20, tinta = color.ink600 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Rect x={2.4} y={6} width={19.2} height={12} rx={2.6} stroke={tinta} strokeWidth={trazo(tamano)} />
      <Circle cx={12} cy={12} r={2.6} stroke={tinta} strokeWidth={trazo(tamano)} />
      <Path d="M6 12h.01M18 12h.01" stroke={tinta} strokeWidth={trazo(tamano)} strokeLinecap="round" />
    </Svg>
  );
}

/** Mis viajes: los dos hilos de una ruta con sus paradas. */
export function Ruta({ tamano = 20, tinta = color.ink600 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path d="M3 7h9a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h9" stroke={tinta} strokeWidth={trazo(tamano)} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={19} cy={7} r={2.2} stroke={tinta} strokeWidth={trazo(tamano)} />
      <Circle cx={5} cy={19} r={2.2} stroke={tinta} strokeWidth={trazo(tamano)} />
    </Svg>
  );
}

/** Cómo funciona: la brújula. */
export function Brujula({ tamano = 20, tinta = color.ink600 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Circle cx={12} cy={12} r={8.8} stroke={tinta} strokeWidth={trazo(tamano)} />
      <Path d="M15.2 8.8l-1.9 4.5-4.5 1.9 1.9-4.5z" stroke={tinta} strokeWidth={trazo(tamano)} strokeLinejoin="round" />
    </Svg>
  );
}

/** Legal: la hoja con su esquina doblada. */
export function Documento({ tamano = 20, tinta = color.ink600 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path d="M13.6 3.2H7a2 2 0 0 0-2 2v13.6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.6z" stroke={tinta} strokeWidth={trazo(tamano)} strokeLinejoin="round" />
      <Path d="M13.4 3.4V8.4h5M8.6 13h6.8M8.6 16.4h4.4" stroke={tinta} strokeWidth={trazo(tamano)} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Cerrar sesión: la puerta con la flecha que sale. */
export function Salir({ tamano = 20, tinta = color.rojo600 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path d="M14 4.6H6.8a2 2 0 0 0-2 2v10.8a2 2 0 0 0 2 2H14" stroke={tinta} strokeWidth={trazo(tamano)} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16.4 8.4 20 12l-3.6 3.6M19.4 12H10" stroke={tinta} strokeWidth={trazo(tamano)} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Las dos flechas de intercambiar: origen por destino, orden por orden. */
/** Las dos flechas verticales del v6, la baja y la sube. */
export function Intercambio({ tamano = 17, tinta = color.ink700, grueso }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path
        d="M7.4 4v16M7.4 20 4 16.6M16.6 20V4M16.6 4 20 7.4"
        stroke={tinta}
        strokeWidth={grueso ?? 2.1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** El calendario del v6: la caja, la línea del mes y los dos postes. */
export function Calendario({ tamano = 17, tinta = color.inkIcono, grueso }: Props) {
  const t = grueso ?? 2.1;
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Rect x={3.6} y={5.4} width={16.8} height={14.6} rx={3} stroke={tinta} strokeWidth={t} />
      <Path d="M3.6 9.8h16.8M8.2 3.4v3.4M15.8 3.4v3.4" stroke={tinta} strokeWidth={t} strokeLinecap="round" />
    </Svg>
  );
}

/** El pin relleno del destino: rojo con el punto blanco. «Hacia», siempre. */
export function PinLleno({ tamano = 13, tinta = color.rojo500 }: Props) {
  return (
    <Svg viewBox="0 0 16 16" width={tamano} height={tamano} fill="none">
      <Path
        d="M8 1.6c2.6 0 4.7 2 4.7 4.5 0 3.4-4.7 8.3-4.7 8.3S3.3 9.5 3.3 6.1C3.3 3.6 5.4 1.6 8 1.6Z"
        fill={tinta}
      />
      <Circle cx={8} cy={6.1} r={1.7} fill="#FFF" />
    </Svg>
  );
}

/** El cigarro tachado: en este carro no se fuma. */
export function SinHumo({ tamano = 15, tinta = color.ink600 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Rect x={2.6} y={13.4} width={14} height={4.2} rx={1.4} stroke={tinta} strokeWidth={trazo(tamano)} />
      <Path d="M18.6 13.4v-2.2M21 13.4v-3.4M17 8.6c1.6-.7 1.6-2.6 0-3.4" stroke={tinta} strokeWidth={trazo(tamano)} strokeLinecap="round" />
      <Path d="M3.4 20.2 20.6 4.2" stroke={tinta} strokeWidth={trazo(tamano)} strokeLinecap="round" />
    </Svg>
  );
}

/** La huella: el carro acepta mascota. */
export function Mascota({ tamano = 15, tinta = color.ink600 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Circle cx={7} cy={8.4} r={2} stroke={tinta} strokeWidth={trazo(tamano)} />
      <Circle cx={12} cy={6.4} r={2} stroke={tinta} strokeWidth={trazo(tamano)} />
      <Circle cx={17} cy={8.4} r={2} stroke={tinta} strokeWidth={trazo(tamano)} />
      <Path d="M12 11.4c2.8 0 5 2 5 4.4 0 2-1.6 3-3.2 2.6-.6-.2-1.2-.3-1.8-.3s-1.2.1-1.8.3C8.6 18.8 7 17.8 7 15.8c0-2.4 2.2-4.4 5-4.4Z" stroke={tinta} strokeWidth={trazo(tamano)} strokeLinejoin="round" />
    </Svg>
  );
}

/** La campana de los avisos. Solo la lleva el inicio, arriba a la derecha. */
/** La campana del v6 — el trazo exacto de la cabecera del archivo. */
export function Campana({ tamano = 23, tinta = color.inkIconoFuerte, grueso }: Props) {
  const t = grueso ?? 1.75;
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path
        d="M12 4.2a5.4 5.4 0 0 0-5.4 5.4c0 4-1.6 5.5-1.6 5.5h14s-1.6-1.5-1.6-5.5A5.4 5.4 0 0 0 12 4.2Z"
        stroke={tinta}
        strokeWidth={t}
        strokeLinejoin="round"
      />
      <Path d="M10.2 18.2a2 2 0 0 0 3.6 0" stroke={tinta} strokeWidth={t} strokeLinecap="round" />
    </Svg>
  );
}

/**
 * Redibujado de la caja de 16 a la de 24 (×1,5): era el único icono que se
 * salía de la rejilla única que pide la corrección 4 del turno 14.
 */
export function Alerta({ tamano = 15, tinta = color.rojo700 }: Props) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.3 21.75 20.1H2.25L12 3.3Z"
        stroke={tinta}
        strokeWidth={trazo(tamano)}
        strokeLinejoin="round"
      />
      <Path d="M12 9.6v4.65" stroke={tinta} strokeWidth={trazo(tamano)} strokeLinecap="round" />
      <Path d="M12 17.25h.01" stroke={tinta} strokeWidth={trazo(tamano)} strokeLinecap="round" />
    </Svg>
  );
}
