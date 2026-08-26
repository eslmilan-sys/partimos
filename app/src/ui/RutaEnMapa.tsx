/**
 * El recorrido sobre el país — la geografía DE VERDAD, dibujada por nosotros.
 *
 * El `Mapa` de siempre es un decorado: calles inventadas, una curva que no va
 * a ningún sitio. Esto es otra cosa: cada punto se proyecta desde sus
 * coordenadas reales, así que Penonomé cae ENTRE Panamá y Chitré porque ahí
 * está, y el «+4 min» de un desvío deja de ser un número abstracto — se ve
 * de qué lado queda cada parada.
 *
 * Por qué no un proveedor de mapas: la app corre como export estático y el
 * detalle callejero no aporta nada a la decisión que se toma aquí — ¿me
 * queda de camino? Un trazado limpio con las posiciones verdaderas responde
 * eso mejor que un plano cargado, no pesa nada y funciona sin red.
 *
 * La proyección es equirrectangular con el ancho corregido por el coseno de
 * la latitud media — a 8° del ecuador el error es invisible a este tamaño.
 */

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Text as TextoSvg } from 'react-native-svg';

import { color, familia, radio } from './tokens';

export type PuntoDelRecorrido = {
  nombre: string;
  lat: number;
  lng: number;
  tipo: 'origen' | 'parada' | 'destino';
  /** El punto donde TÚ te subes, si ya lo elegiste: se dibuja distinto. */
  esElTuyo?: boolean;
};

/** El margen para que ningún rótulo muera contra el borde. */
const AIRE = { x: 34, y: 30 };

export function RutaEnMapa({
  puntos,
  tuyo,
  alto = 180,
}: {
  puntos: PuntoDelRecorrido[];
  /**
   * TU punto, si lo elegiste tú y todavía no es parte de la ruta: se dibuja
   * AL LADO de la línea, no sobre ella — el conductor aún no ha dicho que
   * sí, y verlo junto al trazado es exactamente cómo se responde «¿me queda
   * de camino?».
   */
  tuyo?: { nombre: string; lat: number; lng: number } | null;
  alto?: number;
}) {
  /* El ancho se mide, no se pregunta: `useWindowDimensions` devuelve 0 en el
     prerender estático (medido en la apertura, 25-08). */
  const [ancho, setAncho] = useState(0);

  if (puntos.length < 2) return null;

  /* ── La proyección — sobre TODO lo que se dibuja, tu punto incluido ── */
  const situados = tuyo ? [...puntos, { ...tuyo, tipo: 'parada' as const }] : puntos;
  const latMedia = situados.reduce((s, p) => s + p.lat, 0) / situados.length;
  const escalaX = Math.cos((latMedia * Math.PI) / 180);

  const xs = situados.map((p) => p.lng * escalaX);
  const ys = situados.map((p) => -p.lat); // el norte arriba
  const caja = {
    x0: Math.min(...xs),
    x1: Math.max(...xs),
    y0: Math.min(...ys),
    y1: Math.max(...ys),
  };
  const anchoGeo = Math.max(caja.x1 - caja.x0, 1e-6);
  const altoGeo = Math.max(caja.y1 - caja.y0, 1e-6);

  /* Una sola escala para los dos ejes: estirar la geografía para llenar el
     rectángulo la deformaría, y la forma del recorrido es el dato. */
  const escala = Math.min(
    (ancho - AIRE.x * 2) / anchoGeo,
    (alto - AIRE.y * 2) / altoGeo,
  );
  const sobraX = (ancho - AIRE.x * 2 - anchoGeo * escala) / 2;
  const sobraY = (alto - AIRE.y * 2 - altoGeo * escala) / 2;

  const en = (i: number) => ({
    x: AIRE.x + sobraX + (xs[i] - caja.x0) * escala,
    y: AIRE.y + sobraY + (ys[i] - caja.y0) * escala,
  });
  const xy = situados.map((_, i) => en(i));

  /* La línea del recorrido pasa por las paradas DEL VIAJE — tu punto, si lo
     hay, es el último de `situados` y queda fuera del trazo adrede. */
  const enLinea = xy.slice(0, puntos.length);
  let linea = `M ${enLinea[0].x} ${enLinea[0].y}`;
  for (let i = 1; i < enLinea.length; i += 1) {
    const previa = enLinea[i - 1];
    const esta = enLinea[i];
    const mx = (previa.x + esta.x) / 2;
    const my = (previa.y + esta.y) / 2;
    linea += i === 1 ? ` L ${mx} ${my}` : ` Q ${previa.x} ${previa.y} ${mx} ${my}`;
    if (i === enLinea.length - 1) linea += ` L ${esta.x} ${esta.y}`;
  }

  return (
    <View
      style={[estilos.marco, { height: alto }]}
      onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
    >
      {ancho > 0 ? (
        <Svg width={ancho} height={alto}>
          {/* la retícula tenue que dice «esto es un plano», sin fingir calles */}
          {[0.25, 0.5, 0.75].map((f) => (
            <Path
              key={`h${f}`}
              d={`M 0 ${alto * f} H ${ancho}`}
              stroke={color.ink100}
              strokeWidth={1}
            />
          ))}
          {[0.25, 0.5, 0.75].map((f) => (
            <Path
              key={`v${f}`}
              d={`M ${ancho * f} 0 V ${alto}`}
              stroke={color.ink100}
              strokeWidth={1}
            />
          ))}

          {/* dos capas, como el Mapa de siempre — pero la de arriba en ink300,
              que azul200 sobre arena se perdía (medido en la captura) */}
          <Path d={linea} fill="none" stroke={color.blanco} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
          <Path d={linea} fill="none" stroke={color.ink300} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />

          {puntos.map((p, i) => (
            <Marcador key={`${p.nombre}-${i}`} x={xy[i].x} y={xy[i].y} ancho={ancho} p={p} />
          ))}
          {tuyo ? (
            <Marcador
              x={xy[xy.length - 1].x}
              y={xy[xy.length - 1].y}
              ancho={ancho}
              p={{ ...tuyo, tipo: 'parada', esElTuyo: true }}
            />
          ) : null}
        </Svg>
      ) : null}
    </View>
  );
}

/**
 * Un punto con su nombre. El aro hueco es la salida y el punto rojo la
 * llegada — el mismo raíl aro → punta roja de todas las tarjetas (invariante
 * 1 del v6). El tuyo va en tinta plena con su rótulo, porque la pregunta del
 * plano es «¿dónde me subo yo?».
 */
function Marcador({
  x,
  y,
  ancho,
  p,
}: {
  x: number;
  y: number;
  ancho: number;
  p: PuntoDelRecorrido;
}) {
  /* el rótulo huye del borde: a la izquierda del punto si el punto cae en la
     mitad derecha del plano, y al revés */
  const alaIzquierda = x > ancho / 2;
  const fuerte = p.tipo !== 'parada' || p.esElTuyo;
  return (
    <>
      {p.tipo === 'origen' ? (
        <Circle cx={x} cy={y} r={5} fill={color.blanco} stroke={color.ink900} strokeWidth={2.2} />
      ) : p.tipo === 'destino' ? (
        <Circle cx={x} cy={y} r={5.5} fill={color.rojo500} stroke={color.blanco} strokeWidth={2} />
      ) : p.esElTuyo ? (
        <Circle cx={x} cy={y} r={5} fill={color.ink900} stroke={color.blanco} strokeWidth={2} />
      ) : (
        <Circle cx={x} cy={y} r={3.2} fill={color.blanco} stroke={color.ink500} strokeWidth={1.8} />
      )}
      <TextoSvg
        x={alaIzquierda ? x - 10 : x + 10}
        y={y + 3.5}
        textAnchor={alaIzquierda ? 'end' : 'start'}
        fontFamily={familia}
        fontSize={10.5}
        fontWeight={fuerte ? '600' : '400'}
        fill={fuerte ? color.ink900 : color.ink600}
      >
        {p.esElTuyo ? `${p.nombre} · te subes aquí` : p.nombre}
      </TextoSvg>
    </>
  );
}

const estilos = StyleSheet.create({
  marco: {
    backgroundColor: color.sand100,
    borderRadius: radio.m,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
  },
});
