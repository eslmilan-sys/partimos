/**
 * Los controles del sistema, con las medidas del bundle de diseño:
 * Stepper (círculos de 40, hueco de 14, cifra de 34 mínimo) e
 * Interruptor (48 × 30, pulgar de 24, recorrido de 18).
 */

import { type ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type ViewStyle } from 'react-native';

import { familia, color, interlinea, radio, sombra, texto } from './tokens';

/* ---------------------------------------------------------------- Stepper */

type StepperProps = {
  valor: number;
  alCambiar: (v: number) => void;
  min?: number;
  max?: number;
  /** Se lee con lector de pantalla: «Puestos libres, 3». */
  /**
   * LO QUE VA DELANTE DE LA CIFRA CUANDO EL CONTADOR CUENTA DINERO: «B/».
   *
   * Antes esto era un `sufijo` y su único uso escribía «8 $», con el símbolo
   * detrás — el único sitio de la app donde el dinero no llevaba el prefijo
   * balboa del sistema, y en una pantalla que tres líneas más abajo escribía
   * «B/10» bien. En español de Panamá la moneda va DELANTE, y el sistema lo
   * fija en un invariante: dos formatos de dinero en una app son un formato
   * de menos (29-08-2026).
   */
  prefijo?: string;
  /**
   * CUÁNTO SE MUEVE CADA TOQUE. Uno, salvo cuando el contador cuenta CENTAVOS
   * —el aporte de un tramo— y entonces son 25: desde que el reparto va al
   * centavo exacto (`dominio/aporte`), un contador de dólares enteros no podía
   * ni enseñar la cifra que iba a publicarse.
   */
  paso?: number;
  /** Cómo se escribe el valor. Sin esto, el número pelado. */
  comoSeVe?: (v: number) => string;
  /**
   * La cifra en pequeño. La grande es de 25 px, pensada para un número de una
   * cifra («3 puestos»); con una cantidad escrita entera —«B/2,87»— ocupa 85
   * px y se come el rótulo de al lado en un teléfono de 390.
   */
  compacto?: boolean;
  etiquetaAccesible: string;
};

export function Stepper({
  valor,
  alCambiar,
  min = 0,
  max = 9,
  prefijo,
  paso = 1,
  comoSeVe,
  compacto = false,
  etiquetaAccesible,
}: StepperProps) {
  /* Con paso de 25 el máximo casi nunca es múltiplo del paso —el reparto da
     729—, así que se acota DESPUÉS de redondear: el extremo se alcanza. */
  const acotar = (v: number) => Math.min(max, Math.max(min, Math.round(v / paso) * paso));

  const boton = (cuanto: number, apagado: boolean, glifo: string, nombre: string) => (
    <Pressable
      disabled={apagado}
      accessibilityRole="button"
      accessibilityLabel={nombre}
      onPress={() => alCambiar(acotar(valor + cuanto))}
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
      {boton(-paso, valor <= min, '−', 'Bajar')}
      <Text style={[estilos.stepperValor, compacto && estilos.stepperValorCompacto]}>
        {/* El símbolo va más pequeño y en tinta suave: la cifra es lo que se
            mueve, el símbolo sólo dice de qué. */}
        {prefijo ? <Text style={estilos.stepperSufijo}>{prefijo}</Text> : null}
        {comoSeVe ? comoSeVe(valor) : valor}
      </Text>
      {boton(paso, valor >= max, '+', 'Subir')}
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

/**
 * DOS PISOS, NO DOS COLUMNAS. La descripción vivía en la columna de al lado
 * del toggle, así que CADA renglón suyo perdía el ancho de la pista más el
 * hueco (~64 px) — por eso «Únicamente mujeres podrán pedir puesto en este
 * viaje» se partía en dos líneas con medio card libre a la derecha. El
 * toggle solo tiene que reservar sitio junto al TÍTULO: arriba va la fila
 * título + pista, y debajo la descripción a TODO el ancho de la tarjeta.
 * El título pide una sola línea; la pista no se encoge nunca.
 */
export function Interruptor({ activo, alCambiar, etiqueta, descripcion }: InterruptorProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: activo }}
      accessibilityLabel={etiqueta}
      onPress={() => alCambiar(!activo)}
      style={estilos.interruptorBloque}
    >
      <View style={estilos.interruptorFila}>
        <Text style={estilos.interruptorEtiqueta} numberOfLines={1}>
          {etiqueta}
        </Text>
        <View style={[estilos.pista, { backgroundColor: activo ? color.rojo500 : color.ink200 }]}>
          <View style={[estilos.pulgar, { transform: [{ translateX: activo ? 18 : 0 }] }]} />
        </View>
      </View>
      {descripcion ? <Text style={estilos.interruptorDescripcion}>{descripcion}</Text> : null}
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

/**
 * Las dos alturas del v6: 48 el primario dentro de una tarjeta (radio 16),
 * 54 el botón a todo lo ancho (radio 18). Rótulo 15/600 en las dos.
 */
const TAMANOS: Record<Tamano, { height: number; paddingHorizontal: number; fontSize: number; radio: number }> = {
  md: { height: 48, paddingHorizontal: 20, fontSize: 15, radio: 16 },
  lg: { height: 54, paddingHorizontal: 24, fontSize: 15, radio: 18 },
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
    /** El CTA del v6: rojo pleno, pulsado a `#A6122A`, sombra del acento. */
    rojo: { fondo: color.rojo500, pulsado: color.rojo600, tinta: color.blanco, borde: 'transparent' },
    /** La superficie oscura de tinta — el chip Filtros, el Publicar. */
    azul: { fondo: color.ink900, pulsado: color.ink800, tinta: color.blanco, borde: 'transparent' },
    contorno: {
      fondo: color.blanco,
      pulsado: color.lavadoChip,
      tinta: color.ink900,
      borde: color.bordePorDefecto,
    },
    texto: {
      fondo: 'transparent',
      pulsado: color.lavadoChip,
      tinta: color.rojo700,
      borde: 'transparent',
    },
    /** El secundario del v6: blanco con borde de pelo, tinta primaria. */
    blanco: {
      fondo: color.blanco,
      pulsado: color.lavadoChip,
      tinta: color.ink900,
      borde: color.bordePorDefecto,
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
          borderRadius: medida.radio,
          paddingHorizontal: medida.paddingHorizontal,
          backgroundColor: pressed ? paleta.pulsado : paleta.fondo,
          borderColor: paleta.borde,
        },
        /* Desactivado NO es rojo al 50 % — eso da una losa rosada que parece
           un error de pintura, y el rojo tiene sus cuatro sentidos tasados.
           Agotado se dice con los tokens de agotado: lavado de tinta y
           tinta apagada, como todo lo inerte del v6. */
        desactivado && { backgroundColor: color.inerteFondo, borderColor: 'transparent' },
        tono === 'rojo' && !desactivado ? sombra.cta : null,
        pressed && { transform: [{ scale: 0.97 }] },
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
            color: desactivado ? color.inerteTinta : paleta.tinta,
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

/**
 * EN EL v6 EL AVATAR ES UNO SOLO: claro, con borde de pelo y las iniciales
 * en Ink 2 — `linear-gradient(160deg,#EAF1F2,#D5E2E5)` en el dibujo, aquí el
 * extremo claro con el borde de tinta al 10 %. Los tonos por persona del
 * sistema anterior se conservan como opción explícita, pero nadie los
 * reparte ya por defecto: en una lista de conductores, el que destaca es el
 * verificado, no el que le tocó el color más vivo.
 */
const TONOS_AVATAR = {
  claro: { fondo: color.ink100, tinta: color.ink700 },
  azul: { fondo: color.ink100, tinta: color.ink700 },
  rojo: { fondo: color.rojo100, tinta: color.rojo700 },
  arena: { fondo: color.ink100, tinta: color.ink700 },
  arena2: { fondo: color.ink100, tinta: color.ink700 },
} as const;

export function Avatar({
  nombre,
  tono,
  tamano = 44,
}: {
  nombre: string;
  tono?: keyof typeof TONOS_AVATAR;
  tamano?: number;
}) {
  const paleta = TONOS_AVATAR[tono ?? 'claro'];
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
          /* Nunca por debajo de 10: a 20 px de avatar, el 40 % daba ocho
             píxeles y las iniciales eran una mancha. */
          fontSize: Math.max(10, tamano * 0.4),
          lineHeight: interlinea(Math.max(10, tamano * 0.4)),
          fontWeight: '600',
          // `-.02em`, como el resto del traspaso: depende del tamaño.
          letterSpacing: Math.max(10, tamano * 0.4) * -0.02,
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
          fontSize: 11.5,
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

export function Epigrafe({ children, tinta = color.azul700 }: { children: ReactNode; tinta?: string }) {
  return <Text style={[texto.epigrafe, { color: tinta }]}>{children}</Text>;
}

const estilos = StyleSheet.create({
  /**
   * EL HUECO ES 8, NO 14. Al subir los botones de 40 a 44 el control se llevó
   * 40 px de la columna del texto, y en `reservar` las descripciones —«Mochila
   * o cartera. Va contigo en el asiento.»— pasaron de dos renglones a tres.
   * Los 44 son intocables, que es el dedo; el aire entre los tres elementos
   * sí se puede apretar sin que nadie falle un toque, porque los botones se
   * tocan por su superficie y no por el hueco.
   */
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  /**
   * 44, QUE ES EL MÍNIMO DE UN DEDO. Iban a 40 aquí y a 34 en `reservar`,
   * que tenía su propia copia del control: el mismo ± en tres tamaños según
   * la pantalla. 44 × 44 es el mínimo que piden tanto Apple como Material, y
   * este control es el que más se pulsa de la app —cuatro veces seguidas
   * para pedir dos puestos y un bolso—. En `reservar` ya no hay copia.
   */
  stepperBoton: {
    width: 44,
    height: 44,
    borderRadius: radio.pastilla,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
    backgroundColor: color.blanco,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperGlifo: { fontSize: 19, lineHeight: 19, fontWeight: '500', color: color.ink900, fontFamily: familia },
  stepperSufijo: { fontSize: 13.5, lineHeight: 18.85, fontWeight: '600', color: color.ink500 },
  /**
   * LA CIFRA DEL STEPPER, EN GRANDE (29-08-2026, pedido del dueño).
   *
   * Iba a 19 entre dos botones de 40 px: el número que se está cambiando era
   * más pequeño que los círculos que lo cambian. Es el dato, no el control.
   * A 25 pesa lo que tiene que pesar y sigue cabiendo con «3 puestos» de
   * sufijo en un teléfono de 390.
   */
  stepperValor: {
    minWidth: 30,
    textAlign: 'center',
    fontSize: 25, lineHeight: 30,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: color.ink900,
    fontVariant: ['tabular-nums'], fontFamily: familia },
  stepperValorCompacto: { minWidth: 62, fontSize: 17, lineHeight: 22, letterSpacing: -0.3 },

  interruptorBloque: { width: '100%' },
  /** Título y pista, centrados entre sí; el título cede, la pista jamás. */
  interruptorFila: { flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 30 },
  interruptorEtiqueta: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600',
    letterSpacing: -0.24,
    color: color.ink900,
    fontFamily: familia,
  },
  /** A TODO el ancho, con aire propio: 13/19 y la tinta de meta. */
  interruptorDescripcion: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: color.ink600,
    fontFamily: familia,
  },
  pista: {
    width: 48,
    height: 30,
    flexShrink: 0,
    borderRadius: radio.pastilla,
    padding: 3,
    justifyContent: 'center',
  },
  pulgar: {
    width: 24,
    height: 24,
    borderRadius: radio.pastilla,
    backgroundColor: color.blanco,
    shadowColor: '#14141A',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },

  pastilla: { borderRadius: radio.pastilla },

  boton: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  botonTexto: { fontWeight: '600', fontFamily: familia },

  /** Círculo, con borde de pelo: el avatar del v6 nunca es un cuadrado. */
  avatar: {
    borderRadius: radio.pastilla,
    borderWidth: 1,
    borderColor: 'rgba(10,39,49,.10)',
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
    fontSize: 15.5, lineHeight: 23.2,
    fontWeight: '500',
    letterSpacing: -0.16,
    color: color.ink900,
    fontFamily: familia,
    // en web el input trae su propio contorno al enfocarse
    outlineStyle: 'none',
  } as never,
  campoAyuda: { marginTop: 6, fontSize: 12.5, lineHeight: 18.12, color: color.ink600, fontFamily: familia },
});

