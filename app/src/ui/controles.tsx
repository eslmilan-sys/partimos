/**
 * Los controles del sistema, con las medidas del bundle de diseño:
 * Stepper (círculos de 40, hueco de 14, cifra de 34 mínimo) e
 * Interruptor (48 × 30, pulgar de 24, recorrido de 18).
 */

import { type ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type ViewStyle } from 'react-native';

import { familia, color, interlinea, radio, texto } from './tokens';

/* ---------------------------------------------------------------- Stepper */

type StepperProps = {
  valor: number;
  alCambiar: (v: number) => void;
  min?: number;
  max?: number;
  /** Se lee con lector de pantalla: «Puestos libres, 3». */
  /** Lo que va detrás de la cifra: «$» cuando el contador cuenta dinero. */
  sufijo?: string;
  etiquetaAccesible: string;
};

export function Stepper({
  valor,
  alCambiar,
  min = 0,
  max = 9,
  sufijo,
  etiquetaAccesible,
}: StepperProps) {
  const boton = (paso: number, apagado: boolean, glifo: string, nombre: string) => (
    <Pressable
      disabled={apagado}
      accessibilityRole="button"
      accessibilityLabel={nombre}
      onPress={() => alCambiar(Math.min(max, Math.max(min, valor + paso)))}
      style={({ pressed }) => [
        estilos.stepperBoton,
        pressed && !apagado && { backgroundColor: color.sand200 },
      ]}
    >
      <Text style={[estilos.stepperGlifo, apagado && { color: color.ink300 }]}>{glifo}</Text>
    </Pressable>
  );

  return (
    <View
      style={estilos.stepper}
      accessibilityRole="adjustable"
      accessibilityLabel={etiquetaAccesible}
      accessibilityValue={{ min, max, now: valor }}
    >
      {boton(-1, valor <= min, '−', 'Uno menos')}
      <Text style={estilos.stepperValor}>
        {valor}
        {/* El símbolo va más pequeño y en tinta suave: la cifra es lo que se
            mueve, el símbolo sólo dice de qué. */}
        {sufijo ? <Text style={estilos.stepperSufijo}>{` ${sufijo}`}</Text> : null}
      </Text>
      {boton(1, valor >= max, '+', 'Uno más')}
    </View>
  );
}

/* ----------------------------------------------------------- Interruptor */

type InterruptorProps = {
  activo: boolean;
  alCambiar: (v: boolean) => void;
  etiqueta: string;
  descripcion?: string;
};

export function Interruptor({ activo, alCambiar, etiqueta, descripcion }: InterruptorProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: activo }}
      accessibilityLabel={etiqueta}
      onPress={() => alCambiar(!activo)}
      style={[estilos.interruptorFila, { alignItems: descripcion ? 'flex-start' : 'center' }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={estilos.interruptorEtiqueta}>{etiqueta}</Text>
        {descripcion ? <Text style={estilos.interruptorDescripcion}>{descripcion}</Text> : null}
      </View>
      <View style={[estilos.pista, { backgroundColor: activo ? color.rojo500 : color.ink200 }]}>
        <View style={[estilos.pulgar, { transform: [{ translateX: activo ? 18 : 0 }] }]} />
      </View>
    </Pressable>
  );
}

/* --------------------------------------------------------------- Pastilla */

/** La pastilla tiene dos tamaños en el traspaso, y la diferencia se nota. */
const MEDIDAS_PASTILLA = {
  s: { fontSize: 10.5, lineHeight: 15.225, paddingVertical: 3, paddingHorizontal: 8 },
  m: { fontSize: 11.5, lineHeight: 16.675, paddingVertical: 4, paddingHorizontal: 9 },
} as const;

type PastillaProps = {
  children: ReactNode;
  fondo?: string;
  tinta?: string;
  tamano?: keyof typeof MEDIDAS_PASTILLA;
  estilo?: ViewStyle;
};

export function Pastilla({
  children,
  fondo = color.azul100,
  tinta = color.azul700,
  tamano = 's',
  estilo,
}: PastillaProps) {
  const medida = MEDIDAS_PASTILLA[tamano];
  return (
    <View
      style={[
        estilos.pastilla,
        {
          backgroundColor: fondo,
          paddingVertical: medida.paddingVertical,
          paddingHorizontal: medida.paddingHorizontal,
        },
        estilo,
      ]}
    >
      <Text
        style={[
          texto.pastilla,
          { fontSize: medida.fontSize, lineHeight: medida.lineHeight, color: tinta },
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

/* ----------------------------------------------------------------- Botón */

/**
 * `rojo` es la acción de seguir adelante. `azul` es la acción dentro de una
 * hoja, porque rojo sobre rojo no se lee. `blanco` es esa misma acción cuando
 * se sienta encima del campo rojo. `contorno` no es destructivo por sí mismo:
 * es la salida secundaria, con borde y sin relleno. `texto` es la salida más
 * callada de todas: sin relleno y sin borde, para lo que se va sin hacer
 * nada.
 */
type Tono = 'rojo' | 'azul' | 'contorno' | 'texto' | 'blanco';
type Tamano = 'md' | 'lg';

type BotonProps = {
  children: ReactNode;
  alPulsar?: () => void;
  tono?: Tono;
  tamano?: Tamano;
  desactivado?: boolean;
  /** Ocupa el ancho disponible. */
  ancho?: boolean;
};

const TAMANOS: Record<Tamano, { height: number; paddingHorizontal: number; fontSize: number }> = {
  md: { height: 52, paddingHorizontal: 26, fontSize: 16 },
  lg: { height: 58, paddingHorizontal: 32, fontSize: 17 },
};

export function Boton({
  children,
  alPulsar,
  tono = 'rojo',
  tamano = 'lg',
  desactivado = false,
  ancho = false,
}: BotonProps) {
  const medida = TAMANOS[tamano];
  const paleta = {
    rojo: { fondo: color.rojo500, pulsado: color.rojo600, tinta: color.blanco, borde: 'transparent' },
    azul: { fondo: color.azul500, pulsado: color.azul600, tinta: color.blanco, borde: 'transparent' },
    contorno: {
      fondo: 'transparent',
      pulsado: color.sand200,
      tinta: color.ink900,
      borde: color.ink900,
    },
    texto: {
      fondo: 'transparent',
      pulsado: color.sand200,
      tinta: color.ink600,
      borde: 'transparent',
    },
    // Sobre el campo rojo la acción no puede ser roja: ahí el blanco es lo que
    // se toca para seguir adelante.
    blanco: {
      fondo: color.blanco,
      pulsado: color.sand200,
      tinta: color.ink900,
      borde: 'transparent',
    },
  }[tono];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={desactivado}
      onPress={alPulsar}
      style={({ pressed }) => [
        estilos.boton,
        {
          height: medida.height,
          paddingHorizontal: medida.paddingHorizontal,
          backgroundColor: pressed ? paleta.pulsado : paleta.fondo,
          borderColor: paleta.borde,
          opacity: desactivado ? 0.5 : 1,
        },
        ancho && { flex: 1 },
      ]}
    >
      <Text
        style={[
          estilos.botonTexto,
          {
            fontSize: medida.fontSize,
            lineHeight: interlinea(medida.fontSize),
            // `-.01em` del traspaso: depende del tamaño, no es un número fijo.
            letterSpacing: -medida.fontSize / 100,
            color: paleta.tinta,
          },
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

/* ----------------------------------------------------------------- Campo */

type CampoProps = {
  valor: string;
  alEscribir: (v: string) => void;
  marcador?: string;
  /** La línea que explica qué pasa con lo que escribes. */
  ayuda?: string;
  etiquetaAccesible: string;
};

export function Campo({ valor, alEscribir, marcador, ayuda, etiquetaAccesible }: CampoProps) {
  const [enfocado, setEnfocado] = useState(false);
  return (
    <View>
      <View
        style={[
          estilos.campo,
          enfocado && { borderColor: color.rojo500 },
        ]}
      >
        <TextInput
          accessibilityLabel={etiquetaAccesible}
          value={valor}
          onChangeText={alEscribir}
          placeholder={marcador}
          placeholderTextColor={color.ink400}
          onFocus={() => setEnfocado(true)}
          onBlur={() => setEnfocado(false)}
          style={estilos.campoTexto}
        />
      </View>
      {ayuda ? <Text style={estilos.campoAyuda}>{ayuda}</Text> : null}
    </View>
  );
}

/* ---------------------------------------------------------------- Avatar */

/** Un tono por persona, estable por el nombre, para que no cambie de pantalla en pantalla. */
const TONOS_AVATAR = {
  azul: { fondo: color.azul100, tinta: color.azul700 },
  rojo: { fondo: color.rojo100, tinta: color.rojo700 },
  arena: { fondo: color.arena100, tinta: '#A06F33' },
  arena2: { fondo: color.sand200, tinta: color.ink700 },
} as const;

function tonoDe(nombre: string): keyof typeof TONOS_AVATAR {
  const claves = ['azul', 'arena', 'arena2'] as const;
  let n = 0;
  for (let i = 0; i < nombre.length; i++) n = (n + nombre.charCodeAt(i)) % 997;
  return claves[n % claves.length];
}

export function Avatar({
  nombre,
  tono,
  tamano = 44,
}: {
  nombre: string;
  tono?: keyof typeof TONOS_AVATAR;
  tamano?: number;
}) {
  const paleta = TONOS_AVATAR[tono ?? tonoDe(nombre)];
  const iniciales = nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <View
      style={[
        estilos.avatar,
        { width: tamano, height: tamano, backgroundColor: paleta.fondo },
      ]}
    >
      <Text
        style={{
          fontSize: tamano * 0.4,
          lineHeight: interlinea(tamano * 0.4),
          fontWeight: '600',
          // `-.02em`, como el resto del traspaso: depende del tamaño.
          letterSpacing: tamano * 0.4 * -0.02,
          color: paleta.tinta,
          fontFamily: familia,
        }}
      >
        {iniciales}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------- Insignia */

export function Insignia({
  children,
  fondo = color.sand200,
  tinta = color.ink700,
  punto = false,
}: {
  children: ReactNode;
  fondo?: string;
  tinta?: string;
  punto?: boolean;
}) {
  return (
    <View style={[estilos.insignia, { backgroundColor: fondo }]}>
      {/* El punto va dentro del hueco que la etiqueta le reserva a su
          izquierda, no como hermano: así la caja del texto es la de la
          insignia entera, como en el traspaso. */}
      {punto ? <View style={[estilos.insigniaPunto, { backgroundColor: tinta }]} /> : null}
      <Text
        style={{
          fontSize: 11,
          lineHeight: interlinea(11),
          fontWeight: '500',
          letterSpacing: -0.055,
          color: tinta,
          fontFamily: familia,
          ...(punto ? { paddingLeft: 12 } : null),
        }}
      >
        {children}
      </Text>
    </View>
  );
}

/* --------------------------------------------------------------- Epígrafe */

export function Epigrafe({ children, tinta = color.azul500 }: { children: ReactNode; tinta?: string }) {
  return <Text style={[texto.epigrafe, { color: tinta }]}>{children}</Text>;
}

const estilos = StyleSheet.create({
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepperBoton: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
    backgroundColor: color.blanco,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperGlifo: { fontSize: 19, lineHeight: 19, fontWeight: '500', color: color.ink900, fontFamily: familia },
  stepperSufijo: { fontSize: 13, lineHeight: 18.85, fontWeight: '600', color: color.ink600 },
  stepperValor: {
    minWidth: 34,
    textAlign: 'center',
    fontSize: 19, lineHeight: 27.55,
    fontWeight: '600',
    letterSpacing: -0.38,
    color: color.ink900,
    fontVariant: ['tabular-nums'], fontFamily: familia },

  interruptorFila: { flexDirection: 'row', gap: 16, minHeight: 30 },
  interruptorEtiqueta: { fontSize: 15, lineHeight: 21.75, fontWeight: '500', color: color.ink900, fontFamily: familia },
  interruptorDescripcion: { fontSize: 13, lineHeight: 18.2, color: color.ink600, marginTop: 2, fontFamily: familia },
  pista: { width: 48, height: 30, borderRadius: radio.pastilla, padding: 3, justifyContent: 'center' },
  pulgar: {
    width: 24,
    height: 24,
    borderRadius: radio.pastilla,
    backgroundColor: color.blanco,
    shadowColor: '#26232B',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },

  pastilla: { borderRadius: radio.pastilla },

  boton: {
    borderRadius: radio.pastilla,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  botonTexto: { fontWeight: '600', fontFamily: familia },

  avatar: {
    borderRadius: radio.cuadrado,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  insignia: {
    height: 22,
    paddingHorizontal: 8,
    borderRadius: radio.pastilla,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  insigniaPunto: {
    position: 'absolute',
    left: 8,
    width: 6,
    height: 6,
    borderRadius: radio.pastilla,
    opacity: 0.85,
  },

  campo: {
    height: 52,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: color.blanco,
    borderRadius: radio.control,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
  },
  campoTexto: {
    fontSize: 16, lineHeight: 23.2,
    fontWeight: '500',
    letterSpacing: -0.16,
    color: color.ink900,
    fontFamily: familia,
    // en web el input trae su propio contorno al enfocarse
    outlineStyle: 'none',
  } as never,
  campoAyuda: { marginTop: 6, fontSize: 12.5, lineHeight: 18.12, color: color.ink400, fontFamily: familia },
});

