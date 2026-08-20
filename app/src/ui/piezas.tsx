/**
 * Las piezas que se repiten en toda la app, escritas una vez.
 *
 * **Por qué existe este archivo.** La primera versión del producto —la que
 * está en el repositorio `test`, antes del rojo— se veía mejor sin tener más
 * pantallas, y la razón es que tenía **un vocabulario corto y lo usaba
 * siempre**: una tarjeta, una pastilla de sección, un chip, un control
 * segmentado, una fila con su raya de un pelo. Aquí cada pantalla se inventaba
 * su tarjeta con su radio y su sombra, y por eso ninguna se parecía a la de al
 * lado. Un producto no se ve caro porque cada pantalla esté bien: se ve caro
 * porque todas están hechas de las mismas cinco cosas.
 *
 * Las cinco:
 *
 *   · `Tarjeta`   — la caja blanca. Un radio, un borde, una sombra.
 *   · `Seccion`   — el rótulo de sección con su cuenta o su enlace al lado.
 *   · `Chip`      — el filtro y la etiqueta. Redondo, de un pelo, 36 de alto.
 *   · `Segmentos` — el control de dos o tres opciones, con su pastilla blanca.
 *   · `Carril`    — el origen y el destino con el hilo entre ellos.
 */

import { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { Avanza } from './iconos';
import { TRACK_MICRO, color, espacio, familia, interlinea, radio, zonaDeToque } from './tokens';

/* --------------------------------------------------------------- Tarjeta */

/**
 * La caja blanca, en tres pesos.
 *
 *   · `plana`    — solo borde. Para listas largas, donde diez sombras son ruido.
 *   · `apoyada`  — borde y una sombra corta. La de siempre.
 *   · `elevada`  — la que monta sobre el campo rojo, con la sombra teñida.
 */
export function Tarjeta({
  children,
  peso = 'apoyada',
  relleno = 16,
  estilo,
}: {
  children: ReactNode;
  peso?: 'plana' | 'apoyada' | 'elevada';
  relleno?: number;
  estilo?: ViewStyle | ViewStyle[];
}) {
  return (
    <View style={[estilos.tarjeta, PESO[peso], { padding: relleno }, estilo]}>{children}</View>
  );
}

const PESO = StyleSheet.create({
  plana: {},
  apoyada: {
    shadowColor: '#26232B',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  elevada: {
    borderColor: 'transparent',
    shadowColor: 'rgb(120,10,30)',
    shadowOpacity: 0.24,
    shadowRadius: 36,
    shadowOffset: { width: 0, height: 16 },
    elevation: 8,
  },
});

/* --------------------------------------------------------------- Sección */

/**
 * El rótulo de una sección, con lo que va a su derecha.
 *
 * Tres formas y ninguna más: el rótulo solo, el rótulo con una cuenta, o el
 * rótulo con un enlace. `alPulsar` convierte el lado derecho en enlace y le
 * pone su galón, para que no haya un «Ver todas» que no se vea que se toca.
 */
export function Seccion({
  children,
  cuenta,
  enlace,
  alPulsar,
}: {
  children: string;
  cuenta?: string;
  enlace?: string;
  alPulsar?: () => void;
}) {
  return (
    <View style={estilos.seccion}>
      <Text style={estilos.seccionTexto}>{children}</Text>
      {alPulsar && enlace ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={enlace}
          onPress={alPulsar}
          style={[estilos.seccionEnlace, zonaDeToque]}
        >
          <Text style={estilos.seccionEnlaceTexto}>{enlace}</Text>
          <Avanza tamano={13} tinta={color.rojo600} />
        </Pressable>
      ) : cuenta ? (
        <Text style={estilos.seccionCuenta}>{cuenta}</Text>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ Chip */

export function Chip({
  children,
  activo = false,
  cuenta,
  glifo,
  alPulsar,
}: {
  children: string;
  activo?: boolean;
  cuenta?: number;
  glifo?: ReactNode;
  alPulsar?: () => void;
}) {
  const contenido = (
    <>
      {glifo}
      <Text style={[estilos.chipTexto, activo && estilos.chipTextoActivo]} numberOfLines={1}>
        {children}
      </Text>
      {cuenta != null ? (
        <View style={[estilos.chipCuenta, activo && estilos.chipCuentaActiva]}>
          <Text style={[estilos.chipCuentaTexto, activo && estilos.chipCuentaTextoActivo]}>
            {cuenta}
          </Text>
        </View>
      ) : null}
    </>
  );

  if (!alPulsar) return <View style={[estilos.chip, activo && estilos.chipActivo]}>{contenido}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      accessibilityLabel={children}
      onPress={alPulsar}
      style={({ pressed }) => [
        estilos.chip,
        activo && estilos.chipActivo,
        pressed && !activo && { backgroundColor: color.sand200 },
      ]}
    >
      {contenido}
    </Pressable>
  );
}

/**
 * Una tira de chips que se desplaza sin cortarse.
 *
 * El relleno va en el contenido y no en la caja: puesto en la caja, el primer
 * chip nace ya desplazado y el último se corta contra el borde. Medido en `2b`,
 * donde «Acepta maletas» quedaba partido por la mitad.
 */
export function TiraDeChips({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={estilos.tira}
    >
      {children}
    </ScrollView>
  );
}

/* -------------------------------------------------------------- Segmentos */

/**
 * El control de dos o tres opciones.
 *
 * `tono` decide sobre qué se apoya: `claro` sobre arena, `oscuro` sobre el
 * campo rojo. Es el mismo control; lo que cambia es de dónde saca el contraste.
 */
export function Segmentos<T extends string>({
  opciones,
  valor,
  alCambiar,
  tono = 'claro',
}: {
  opciones: { valor: T; etiqueta: string }[];
  valor: T;
  alCambiar: (v: T) => void;
  tono?: 'claro' | 'oscuro';
}) {
  const oscuro = tono === 'oscuro';
  return (
    <View style={[estilos.segmentos, oscuro && estilos.segmentosOscuro]}>
      {opciones.map((o) => {
        const activo = o.valor === valor;
        return (
          <Pressable
            key={o.valor}
            accessibilityRole="tab"
            accessibilityState={{ selected: activo }}
            accessibilityLabel={o.etiqueta}
            onPress={() => alCambiar(o.valor)}
            style={[estilos.segmento, activo && estilos.segmentoActivo]}
          >
            <Text
              style={[
                estilos.segmentoTexto,
                oscuro && !activo && { color: 'rgba(255,255,255,.82)' },
                activo && estilos.segmentoTextoActivo,
              ]}
              numberOfLines={1}
            >
              {o.etiqueta}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* --------------------------------------------------------------- Carril */

/**
 * De dónde a dónde: dos puntos y el hilo entre ellos.
 *
 * El de arriba es macizo y azul —de ahí sales, es un hecho—; el de abajo es un
 * aro rojo —ahí llegas, todavía no—. Es la misma pareja en la ficha del viaje,
 * en el resultado de la búsqueda y en el resumen de la publicación, y por eso
 * vive aquí.
 */
export function Carril({
  origen,
  destino,
  origenPie,
  destinoPie,
  ladoOrigen,
  ladoDestino,
  compacto = false,
}: {
  origen: string;
  destino: string;
  origenPie?: string;
  destinoPie?: string;
  ladoOrigen?: ReactNode;
  ladoDestino?: ReactNode;
  compacto?: boolean;
}) {
  const t = compacto ? COMPACTO : NORMAL;
  return (
    <View>
      <View style={estilos.hito}>
        <View style={[estilos.rail, { width: t.punto }]}>
          <View style={[estilos.lleno, t.bola, { backgroundColor: color.azul500 }]} />
          <View style={estilos.hilo} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[estilos.lugar, t.lugar]} numberOfLines={1}>
            {origen}
          </Text>
          {origenPie ? (
            <Text style={[estilos.pie, t.pie]} numberOfLines={1}>
              {origenPie}
            </Text>
          ) : null}
        </View>
        {ladoOrigen}
      </View>

      <View style={[estilos.hito, { marginTop: compacto ? 8 : 12 }]}>
        <View style={[estilos.rail, { width: t.punto }]}>
          <View style={[estilos.hueco, t.bola]} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[estilos.lugar, t.lugar]} numberOfLines={1}>
            {destino}
          </Text>
          {destinoPie ? (
            <Text style={[estilos.pie, t.pie]} numberOfLines={1}>
              {destinoPie}
            </Text>
          ) : null}
        </View>
        {ladoDestino}
      </View>
    </View>
  );
}

const NORMAL = {
  punto: 12,
  bola: { width: 10, height: 10, borderRadius: 5 },
  lugar: { fontSize: 15, lineHeight: 21 },
  pie: { fontSize: 12.5, lineHeight: 18 },
} as const;

const COMPACTO = {
  punto: 10,
  bola: { width: 7, height: 7, borderRadius: 3.5 },
  lugar: { fontSize: 14, lineHeight: 20 },
  pie: { fontSize: 11.5, lineHeight: 17 },
} as const;

/* ------------------------------------------------------------------ */

const estilos = StyleSheet.create({
  tarjeta: {
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordeSutil,
  },

  seccion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 30,
  },
  seccionTexto: {
    flex: 1,
    fontSize: 12,
    lineHeight: interlinea(12),
    fontWeight: '700',
    letterSpacing: 12 * 0.07,
    textTransform: 'uppercase',
    color: color.azul700,
    fontFamily: familia,
  },
  seccionCuenta: { fontSize: 12.5, lineHeight: 18, color: color.ink500, fontFamily: familia },
  seccionEnlace: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 10 },
  seccionEnlaceTexto: {
    fontSize: 13,
    lineHeight: 18.85,
    fontWeight: '700',
    color: color.rojo600,
    fontFamily: familia,
  },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    /* 44 y no 38: la auditoría mide la zona que responde al dedo, y un chip
       es un control, no una etiqueta. `hitSlop` no existe en web. */
    height: espacio.tap,
    paddingHorizontal: 14,
    borderRadius: radio.pastilla,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
    backgroundColor: color.blanco,
  },
  chipActivo: { backgroundColor: color.azul500, borderColor: color.azul500 },
  chipTexto: {
    fontSize: 13.5,
    lineHeight: 19.575,
    fontWeight: '600',
    letterSpacing: -0.135,
    color: color.ink800,
    fontFamily: familia,
  },
  chipTextoActivo: { color: '#fff' },
  chipCuenta: {
    minWidth: 19,
    height: 19,
    paddingHorizontal: 5,
    borderRadius: radio.pastilla,
    backgroundColor: color.sand200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipCuentaActiva: { backgroundColor: 'rgba(255,255,255,.24)' },
  chipCuentaTexto: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    color: color.ink700,
    fontFamily: familia,
  },
  chipCuentaTextoActivo: { color: '#fff' },

  tira: { gap: 8, paddingHorizontal: espacio.gutter, paddingVertical: 2 },

  segmentos: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: radio.pastilla,
    backgroundColor: color.sand200,
  },
  segmentosOscuro: { backgroundColor: 'rgba(255,255,255,.16)' },
  segmento: {
    flex: 1,
    height: espacio.tap,
    borderRadius: radio.pastilla,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  segmentoActivo: {
    backgroundColor: color.blanco,
    shadowColor: '#26232B',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  segmentoTexto: {
    fontSize: 13.5,
    lineHeight: 19.575,
    fontWeight: '600',
    letterSpacing: -0.135,
    color: color.ink600,
    fontFamily: familia,
  },
  segmentoTextoActivo: { color: color.ink900 },

  hito: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  rail: { alignItems: 'center', alignSelf: 'stretch', paddingTop: 5 },
  lleno: {},
  hueco: { borderWidth: 2, borderColor: color.rojo500, backgroundColor: color.blanco },
  hilo: { flex: 1, width: 2, marginVertical: 3, backgroundColor: color.ink200, borderRadius: 1 },
  lugar: {
    fontWeight: '600',
    letterSpacing: -0.28,
    color: color.ink900,
    fontFamily: familia,
  },
  pie: { color: color.ink500, marginTop: 1, fontFamily: familia },

  /** El crenado del rótulo de sección, escrito una vez. */
  _track: { letterSpacing: TRACK_MICRO },
});
