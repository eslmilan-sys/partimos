/**
 * La tarjeta de un viaje — la anatomía de la sección 08 del v6, sin
 * aproximaciones.
 *
 * Tres columnas — `auto · minmax(48,1fr) · auto`, hueco 8 — y dos invariantes
 * del propio archivo dentro de ellas:
 *
 * - **La dirección se codifica dos veces, siempre**: el par de cejas
 *   SALE / LLEGA y el raíl que corre de aro hueco a punta de flecha roja.
 *   Un separador neutro entre dos nombres de lugar no es aceptable nunca.
 * - **Cada lugar va debajo de SU hora**, jamás en una línea compartida con
 *   el otro extremo.
 * - **Una llegada pasada la medianoche lleva «+1 día». Sin excepciones.**
 *
 * Debajo del divisor, la fila del conductor: avatar de 34 con la marca de
 * verificado encima (aquí todos los conductores la tienen — sin cédula
 * verificada no se publica), nombre 13/500 sobre calificación 11/400, y el
 * aporte a la derecha — «B/» en 12/500 gris de unidad y la cifra en 22/600
 * tinta, sobre la misma línea de base. Los cupos van en acento profundo
 * `#B01128` cuando quedan 1–2, y en gris de icono si no: nunca una pastilla
 * de color en una tarjeta normal.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Avatar } from './controles';
import { cifraRedonda, formatearDineroRedondo, tabular } from './dinero';
import { familia, color, pulsado, radio } from './tokens';

export type ViajeEnTarjeta = {
  id: string;
  salida: string;
  duracion: string;
  aporteCentavos: number;
  puestosLibres: number;
  origen: string;
  destino: string;
  llegada: string;
  equipaje: 'Acepta maletas' | 'Solo mochila';
  aceptaMascotas: boolean;
  sePuedeFumar: boolean;
  conductor: { nombre: string; calificacion: number | null; carro: string };
  canal: string;
  /** «directo», «1 parada»… Si no viene, la fila del raíl lo omite. */
  paradas?: string;
  /** Cuántos viajes lleva hechos, para la línea de meta del conductor. */
  viajesHechos?: number;
};

/** La punta de flecha roja: «hacia», el mismo dibujo en todas partes. */
export function PuntaDeFlecha({ tamano = 9, tinta = color.rojo500 }: { tamano?: number; tinta?: string }) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 10 10" fill="none">
      <Path d="M1 1.4 7.4 5 1 8.6V1.4Z" fill={tinta} />
    </Svg>
  );
}

/** El aro hueco del origen: ø7 con borde de 2. */
export function AroDeOrigen({ tinta = color.inkIcono }: { tinta?: string }) {
  return <View style={[estilos.aro, { borderColor: tinta }]} />;
}

/**
 * ¿La llegada cruza la medianoche? Se deduce de las dos horas «HH:MM»: si la
 * llegada es menor que la salida, el viaje terminó al día siguiente.
 */
function cruzaMedianoche(salida: string, llegada: string): boolean {
  const [hs, ms] = salida.split(':').map(Number);
  const [hl, ml] = llegada.split(':').map(Number);
  if ([hs, ms, hl, ml].some((n) => Number.isNaN(n))) return false;
  return hl * 60 + ml < hs * 60 + ms;
}

export function TarjetaDeViaje({
  viaje,
  marca,
  alPulsar,
  plano = false,
}: {
  viaje: ViajeEnTarjeta;
  /** «Mejor opción», y solo en una tarjeta: dos marcas no marcan nada. */
  marca?: string;
  alPulsar?: () => void;
  /**
   * Sin superficie propia — ni borde, ni fondo, ni relleno — para vivir
   * DENTRO de otra tarjeta: la destacada de Resultados la envuelve, y dos
   * marcos anidados se leían como una tarjeta dentro de una caja.
   */
  plano?: boolean;
}) {
  // 1–2 cupos van en acento profundo: es lo que queda por decidir rápido.
  const pocos = viaje.puestosLibres <= 2;
  const masUnDia = cruzaMedianoche(viaje.salida, viaje.llegada);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Sale ${viaje.salida} de ${viaje.origen}, llega ${viaje.llegada} a ${viaje.destino}, ${formatearDineroRedondo(viaje.aporteCentavos)} por puesto, con ${viaje.conductor.nombre}`}
      onPress={alPulsar}
      style={({ pressed }) => [
        plano ? estilos.tarjetaPlana : estilos.tarjeta,
        pressed && pulsado.tarjeta,
      ]}
    >
      {marca ? (
        <View style={estilos.marca}>
          <Text style={estilos.marcaTexto}>{marca}</Text>
        </View>
      ) : null}

      {/* Las tres columnas: SALE · raíl · LLEGA */}
      <View style={estilos.rejilla}>
        <View style={estilos.columna}>
          <Text style={estilos.ceja}>Sale</Text>
          <Text style={estilos.hora}>{viaje.salida}</Text>
          <Text style={estilos.lugar} numberOfLines={1}>
            {viaje.origen}
          </Text>
        </View>

        <View style={estilos.columnaRail}>
          <View style={estilos.rail}>
            <AroDeOrigen />
            <View style={estilos.railLinea} />
            <PuntaDeFlecha />
          </View>
          <Text style={estilos.duracion}>{viaje.duracion}</Text>
          {viaje.paradas ? <Text style={estilos.paradas}>{viaje.paradas}</Text> : null}
        </View>

        <View style={[estilos.columna, estilos.columnaDerecha]}>
          <Text style={[estilos.ceja, estilos.cejaLlega]}>Llega</Text>
          <Text style={estilos.hora}>{viaje.llegada}</Text>
          {masUnDia ? (
            <View style={estilos.masUnDia}>
              <Text style={estilos.masUnDiaTexto}>+1 día</Text>
            </View>
          ) : null}
          <Text style={estilos.lugar} numberOfLines={1}>
            {viaje.destino}
          </Text>
        </View>
      </View>

      <View style={estilos.divisor} />

      {/* La fila del conductor y el aporte */}
      <View style={estilos.filaConductor}>
        <View style={estilos.avatarConMarca}>
          <Avatar nombre={viaje.conductor.nombre} tamano={34} />
          <Svg width={14} height={14} viewBox="0 0 16 16" fill="none" style={estilos.verificado}>
            <Path
              d="M8 14.6a6.6 6.6 0 1 0 0-13.2 6.6 6.6 0 0 0 0 13.2Z"
              fill={color.rojo500}
              stroke={color.blanco}
              strokeWidth={2.2}
            />
            <Path
              d="m5.2 8.2 2 2 3.6-4"
              stroke="#fff"
              strokeWidth={1.9}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={estilos.nombre} numberOfLines={1}>
            {viaje.conductor.nombre}
          </Text>
          <Text style={estilos.meta} numberOfLines={1}>
            {`★ ${viaje.conductor.calificacion?.toFixed(1) ?? 'Nuevo'}${
              viaje.viajesHechos ? ` · ${viaje.viajesHechos} viajes` : ` · ${viaje.conductor.carro}`
            }`}
          </Text>
        </View>
        <View style={estilos.pilaPrecio}>
          <View style={estilos.filaPrecio}>
            <Text style={estilos.precioUnidad}>B/</Text>
            <Text style={estilos.precio}>{cifraRedonda(viaje.aporteCentavos)}</Text>
          </View>
          <Text style={[estilos.cupos, { color: pocos ? color.rojo800 : color.inkIcono }]}>
            {viaje.puestosLibres === 1 ? '1 cupo' : `${viaje.puestosLibres} cupos`}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderRadius: radio.l,
    padding: 16,
    gap: 12,
  },
  tarjetaPlana: { gap: 12 },

  /** «Mejor opción»: chip teñido del acento, texto en acento profundo. */
  marca: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9,
    backgroundColor: 'rgba(225,33,59,.10)',
  },
  marcaTexto: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: color.rojo800,
    fontFamily: familia,
  },

  rejilla: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  columna: { gap: 1 },
  columnaDerecha: { alignItems: 'flex-end' },
  columnaRail: {
    flex: 1,
    minWidth: 48,
    alignItems: 'center',
    gap: 3,
    /* 21 para que el raíl se centre sobre el glifo de la hora. */
    paddingTop: 21,
  },

  ceja: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: color.ink600,
    fontFamily: familia,
  },
  /** LLEGA va en el acento de texto: la dirección se marca dos veces. */
  cejaLlega: { color: color.rojo700 },
  hora: {
    fontSize: 19,
    lineHeight: 23,
    fontWeight: '600',
    letterSpacing: -0.57,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  lugar: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    letterSpacing: -0.12,
    color: color.ink700,
    fontFamily: familia,
  },

  rail: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 3 },
  aro: { width: 7, height: 7, borderRadius: 4, borderWidth: 2, borderColor: color.inkIcono },
  railLinea: {
    flex: 1,
    height: 0,
    borderBottomWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(10,39,49,.22)',
  },
  duracion: { fontSize: 10, lineHeight: 13, fontWeight: '500', color: color.ink600, fontFamily: familia, ...tabular },
  paradas: { fontSize: 10, lineHeight: 13, fontWeight: '400', color: color.ink400, fontFamily: familia },

  masUnDia: {
    marginTop: 2,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 7,
    backgroundColor: color.lavado,
  },
  masUnDiaTexto: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
    color: color.ink500,
    fontFamily: familia,
  },

  divisor: { height: 1, backgroundColor: color.divisor },

  filaConductor: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarConMarca: { position: 'relative' },
  verificado: { position: 'absolute', right: -3, bottom: -3 },
  nombre: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    letterSpacing: -0.13,
    color: color.ink900,
    fontFamily: familia,
  },
  meta: { fontSize: 11, lineHeight: 15, fontWeight: '400', color: color.ink600, fontFamily: familia, ...tabular },

  pilaPrecio: { alignItems: 'flex-end', gap: 2 },
  filaPrecio: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  precioUnidad: { fontSize: 12, lineHeight: 16, fontWeight: '500', color: color.ink600, fontFamily: familia },
  precio: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: -0.77,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  cupos: { fontSize: 11, lineHeight: 15, fontWeight: '500', fontFamily: familia },
});
