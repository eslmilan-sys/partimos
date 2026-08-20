/**
 * Iconos dibujados a mano, trazo 1.6–1.8, extremos redondos, como el traspaso.
 * Los `d` son los del diseño, no aproximaciones.
 */

import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { color } from './tokens';

type Props = { tamano?: number; tinta?: string };

export function Atras({ tamano = 20, tinta = '#fff' }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path
        d="M15 5l-7 7 7 7"
        stroke={tinta}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function Carro({ tamano = 19, tinta = color.ink600 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path
        d="M3 13.5l1.6-4.4A2.4 2.4 0 0 1 6.9 7.5h10.2a2.4 2.4 0 0 1 2.3 1.6l1.6 4.4"
        stroke={tinta}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M3 13.5h18v4.2H3z" stroke={tinta} strokeWidth={1.6} strokeLinejoin="round" />
      <Circle cx={7} cy={17.7} r={1.4} stroke={tinta} strokeWidth={1.6} />
      <Circle cx={17} cy={17.7} r={1.4} stroke={tinta} strokeWidth={1.6} />
    </Svg>
  );
}

export function Mas({ tamano = 16, tinta = color.azul700 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path d="M12 5v14M5 12h14" stroke={tinta} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function Cerrar({ tamano = 12, tinta = color.ink600 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path d="M6 6l12 12M18 6L6 18" stroke={tinta} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}

export function Pin({ tamano = 15, tinta = color.azul500 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path
        d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"
        stroke={tinta}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={10} r={2.4} stroke={tinta} strokeWidth={1.8} />
    </Svg>
  );
}

export function Maleta({ tamano = 15, tinta = color.ink600 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Rect x={3} y={7} width={18} height={13} rx={2.5} stroke={tinta} strokeWidth={1.7} />
      <Path d="M9 7V4.8h6V7" stroke={tinta} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

export function Visto({ tamano = 14, tinta = '#fff' }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path
        d="M5 12.5l4.5 4.5L19 7.5"
        stroke={tinta}
        strokeWidth={2.4}
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
      <Path d="M4 6h16M7 12h10M10 18h4" stroke={tinta} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

export function Compartir({ tamano = 19, tinta = color.ink900 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path
        d="M12 15V4M8.5 7.5 12 4l3.5 3.5"
        stroke={tinta}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5"
        stroke={tinta}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function Escudo({ tamano = 18, tinta = color.azul500 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path
        d="M12 21s7-3.5 7-9V6l-7-3-7 3v6c0 5.5 7 9 7 9Z"
        stroke={tinta}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9.5 12l1.8 1.8 3.4-3.6"
        stroke={tinta}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function Lupa({ tamano = 21, tinta = color.ink700 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path
        d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3"
        stroke={tinta}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function Chat({ tamano = 21, tinta = color.ink700 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path
        d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9.5L5 19.5V16a2 2 0 0 1-1-1.7z"
        stroke={tinta}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function Persona({ tamano = 21, tinta = color.ink700 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 21a7 7 0 0 1 14 0"
        stroke={tinta}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * La marca: cuatro cuadrados en rejilla, la geometría de la bandera. No hay
 * archivo de logo en el traspaso; se dibuja.
 */
export function Marca({ tamano = 26, tinta = '#fff' }: Props) {
  const c = tamano / 2 - 1;
  return (
    <Svg viewBox={`0 0 ${tamano} ${tamano}`} width={tamano} height={tamano}>
      <Rect x={0} y={0} width={c} height={c} rx={2} fill={tinta} />
      <Rect x={c + 2} y={0} width={c} height={c} rx={2} fill={tinta} opacity={0.5} />
      <Rect x={0} y={c + 2} width={c} height={c} rx={2} fill={tinta} opacity={0.5} />
      <Rect x={c + 2} y={c + 2} width={c} height={c} rx={2} fill={tinta} />
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
        strokeWidth={1.8}
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
        <Path d={d} stroke={color.ink200} strokeWidth={1.7} />
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
export function Avanza({ tamano = 17, tinta = color.ink300 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path
        d="M9 6l6 6-6 6"
        stroke={tinta}
        strokeWidth={1.7}
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
      <Rect x={6.4} y={3.6} width={4} height={11} rx={2} stroke={tinta} strokeWidth={1.8} />
      <Rect x={6.4} y={13.4} width={11.2} height={4} rx={2} stroke={tinta} strokeWidth={1.8} />
      <Path d="M17.6 17.4v2.8" stroke={tinta} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

/** El bocadillo con la interrogación: la ayuda. */
export function Ayuda({ tamano = 18, tinta = color.ink600 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Circle cx={12} cy={12} r={8.6} stroke={tinta} strokeWidth={1.7} />
      <Path
        d="M9.7 9.4a2.4 2.4 0 1 1 3.1 2.6c-.6.2-.9.8-.9 1.4v.4"
        stroke={tinta}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M11.9 16.6h.01" stroke={tinta} strokeWidth={2.1} strokeLinecap="round" />
    </Svg>
  );
}

/** La cédula: el rectángulo con la foto y las dos líneas. */
export function Cedula({ tamano = 20, tinta = color.ink600 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Rect x={2.6} y={5} width={18.8} height={14} rx={3} stroke={tinta} strokeWidth={1.7} />
      <Circle cx={8.6} cy={11.4} r={2.1} stroke={tinta} strokeWidth={1.7} />
      <Path d="M5.4 16.2c.5-1.3 1.7-2 3.2-2s2.7.7 3.2 2" stroke={tinta} strokeWidth={1.7} strokeLinecap="round" />
      <Path d="M14.6 10.4h4.2M14.6 13.8h4.2" stroke={tinta} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

/** Cómo se paga: el billete. Ni tarjeta ni moneda — aquí se paga de mano a mano. */
export function Billete({ tamano = 20, tinta = color.ink600 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Rect x={2.4} y={6} width={19.2} height={12} rx={2.6} stroke={tinta} strokeWidth={1.7} />
      <Circle cx={12} cy={12} r={2.6} stroke={tinta} strokeWidth={1.7} />
      <Path d="M6 12h.01M18 12h.01" stroke={tinta} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/** Mis viajes: los dos hilos de una ruta con sus paradas. */
export function Ruta({ tamano = 20, tinta = color.ink600 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path d="M3 7h9a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h9" stroke={tinta} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={19} cy={7} r={2.2} stroke={tinta} strokeWidth={1.7} />
      <Circle cx={5} cy={19} r={2.2} stroke={tinta} strokeWidth={1.7} />
    </Svg>
  );
}

/** Cómo funciona: la brújula. */
export function Brujula({ tamano = 20, tinta = color.ink600 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Circle cx={12} cy={12} r={8.8} stroke={tinta} strokeWidth={1.7} />
      <Path d="M15.2 8.8l-1.9 4.5-4.5 1.9 1.9-4.5z" stroke={tinta} strokeWidth={1.7} strokeLinejoin="round" />
    </Svg>
  );
}

/** Legal: la hoja con su esquina doblada. */
export function Documento({ tamano = 20, tinta = color.ink600 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path d="M13.6 3.2H7a2 2 0 0 0-2 2v13.6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.6z" stroke={tinta} strokeWidth={1.7} strokeLinejoin="round" />
      <Path d="M13.4 3.4V8.4h5M8.6 13h6.8M8.6 16.4h4.4" stroke={tinta} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Cerrar sesión: la puerta con la flecha que sale. */
export function Salir({ tamano = 20, tinta = color.rojo600 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path d="M14 4.6H6.8a2 2 0 0 0-2 2v10.8a2 2 0 0 0 2 2H14" stroke={tinta} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16.4 8.4 20 12l-3.6 3.6M19.4 12H10" stroke={tinta} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Las dos flechas de intercambiar: origen por destino, orden por orden. */
export function Intercambio({ tamano = 18, tinta = color.ink600 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path
        d="M7 4v13m0 0l-3-3m3 3l3-3M17 20V7m0 0l-3 3m3-3l3 3"
        stroke={tinta}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** El cigarro tachado: en este carro no se fuma. */
export function SinHumo({ tamano = 15, tinta = color.ink600 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Rect x={2.6} y={13.4} width={14} height={4.2} rx={1.4} stroke={tinta} strokeWidth={1.6} />
      <Path d="M18.6 13.4v-2.2M21 13.4v-3.4M17 8.6c1.6-.7 1.6-2.6 0-3.4" stroke={tinta} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M3.4 20.2 20.6 4.2" stroke={tinta} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

/** La huella: el carro acepta mascota. */
export function Mascota({ tamano = 15, tinta = color.ink600 }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Circle cx={7} cy={8.4} r={2} stroke={tinta} strokeWidth={1.6} />
      <Circle cx={12} cy={6.4} r={2} stroke={tinta} strokeWidth={1.6} />
      <Circle cx={17} cy={8.4} r={2} stroke={tinta} strokeWidth={1.6} />
      <Path d="M12 11.4c2.8 0 5 2 5 4.4 0 2-1.6 3-3.2 2.6-.6-.2-1.2-.3-1.8-.3s-1.2.1-1.8.3C8.6 18.8 7 17.8 7 15.8c0-2.4 2.2-4.4 5-4.4Z" stroke={tinta} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}

/** La campana de los avisos. Solo la lleva el inicio, arriba a la derecha. */
export function Campana({ tamano = 21, tinta = '#fff' }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path
        d="M12 3a5.5 5.5 0 0 0-5.5 5.5c0 3.3-.8 5-1.6 6-.4.5 0 1.2.6 1.2h13c.6 0 1-.7.6-1.2-.8-1-1.6-2.7-1.6-6A5.5 5.5 0 0 0 12 3Z"
        stroke={tinta}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Path d="M10 19a2 2 0 0 0 4 0" stroke={tinta} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

export function Alerta({ tamano = 15, tinta = color.rojo700 }: Props) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 16 16" fill="none">
      <Path
        d="M8 2.2 14.5 13.4H1.5L8 2.2Z"
        stroke={tinta}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <Path d="M8 6.4v3.1" stroke={tinta} strokeWidth={1.4} strokeLinecap="round" />
      <Path d="M8 11.5h.01" stroke={tinta} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}
