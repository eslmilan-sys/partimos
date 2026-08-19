/**
 * `8a` Ajustes — avisos, viaje, dinero y cuenta. En ese orden.
 *
 * El orden no es alfabético ni de importancia declarada: es el de cuánto sale
 * de la app. Los avisos son lo único que te alcanza con el teléfono en el
 * bolsillo, así que van primero y en la única hoja que monta sobre el campo
 * rojo —por eso lleva radio de hoja y sombra teñida, y no borde—. Debajo va lo
 * que cambia lo que ves al buscar, y al final lo que se toca una vez al año,
 * ya en arena, en tarjetas de borde y sin sombra.
 *
 * Un interruptor dice sí o no y se queda donde está; una fila con galón lleva
 * a otra pantalla. Son dos gestos distintos y por eso no se mezclan dentro de
 * una misma tarjeta. La cédula no lleva galón: es un estado, no un destino, y
 * se enseña en pastilla verde.
 *
 * «Cerrar sesión» es lo único destructivo de la pantalla: borde rojo y texto
 * rojo, nunca relleno, y fuera de las tarjetas para que no se toque por
 * inercia al terminar de bajar la lista.
 */

import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { type Href, useRouter } from 'expo-router';

import { type Cuenta, type GrupoDeAjustes, ajustes, cuenta } from '@/servicios/ajustes';
import { type EstadoDeCedula, estadoDeCedula } from '@/servicios/seguridad';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { CampoRojo } from '@/ui/CampoRojo';
import { tabular } from '@/ui/dinero';
import { Atras } from '@/ui/iconos';
import { color, espacio, familia, radio, sombra, texto } from '@/ui/tokens';

/** Mientras no haya sesión, el mismo perfil que abre `6a`. */
const PERFIL = '11111111-1111-4111-8111-111111111111';

/** `--radius-sheet` son 28 px; `radio.hoja` se quedó en 26. Manda el traspaso. */
const RADIO_HOJA = 28;

/** `--green-100/700` del traspaso, que no están en tokens. */
const VERDE_FONDO = '#DFF1E8';
const VERDE_TINTA = '#0E5A3F';

/**
 * Los cinco interruptores. Ni `profiles` ni ninguna otra tabla guarda todavía
 * estas preferencias —igual que los avisos, que tampoco tienen tabla—, así que
 * el texto es de interfaz y el sí o el no viven en la pantalla hasta que
 * `servicios/ajustes` tenga dónde escribirlos.
 */
const AVISOS = ['Alguien publica mi ruta', 'Mensajes del conductor', 'Recordatorio 1 h antes'];
const SOLO_MUJERES = {
  etiqueta: 'Solo mujeres',
  descripcion: 'Solo verás carros con conductoras y pasajeras.',
};
const COMPARTIR_LLEGADA = 'Compartir mi llegada';

/** La línea que resume la tarjeta va detrás de los interruptores, no delante. */
const CUANTOS = ['Ninguno activo', 'Uno activo', 'Dos activos', 'Los tres activos'];

/** El relleno que el traspaso da a cada fila de «Dinero y cuenta». */
const RELLENO_DINERO = [10, 11, 11];

export default function Ajustes() {
  const router = useRouter();
  const [grupos, setGrupos] = useState<GrupoDeAjustes[] | null>(null);
  const [quien, setQuien] = useState<Cuenta | null>(null);
  const [cedula, setCedula] = useState<EstadoDeCedula | null>(null);

  const [avisosActivos, setAvisosActivos] = useState([true, true, true]);
  const [soloMujeres, setSoloMujeres] = useState(false);
  const [compartirLlegada, setCompartirLlegada] = useState(true);

  useEffect(() => {
    Promise.all([ajustes(PERFIL), cuenta(PERFIL), estadoDeCedula(PERFIL)]).then(([g, c, v]) => {
      setGrupos(g);
      setQuien(c);
      setCedula(v);
    });
  }, []);

  if (!grupos || !quien || !cedula) return <View style={estilos.pantalla} />;

  // El servicio promete los cuatro grupos en este orden, y ese orden es la
  // pantalla: cambiarlo allí cambia esto, que es lo que queremos.
  const [avisos, viaje, dinero, salida] = grupos;

  const alternarAviso = (i: number) =>
    setAvisosActivos((a) => a.map((v, j) => (j === i ? !v : v)));

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={196} />
      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <View style={estilos.filaVolver}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={() => router.back()}
            style={estilos.volver}
          >
            <Atras tamano={20} />
          </Pressable>
          <Text style={estilos.epigrafeCampo}>
            {`${quien.nombre} ${quien.apellido} · Cuenta`}
          </Text>
        </View>
        <Text style={estilos.titular}>Ajustes</Text>
      </View>

      <View style={estilos.cuerpo}>
        {/* La hoja de avisos monta sobre el campo rojo: sombra teñida, sin borde. */}
        <View style={estilos.hoja}>
          <Text style={estilos.epigrafe}>{avisos.titulo}</Text>
          <Text style={estilos.resumen}>
            {CUANTOS[avisosActivos.filter(Boolean).length]}
          </Text>

          {AVISOS.map((etiqueta, i) => (
            <FilaDePalanca
              key={etiqueta}
              etiqueta={etiqueta}
              activa={avisosActivos[i]}
              alCambiar={() => alternarAviso(i)}
              ultima={i === AVISOS.length - 1}
            />
          ))}
        </View>

        <View style={estilos.tarjeta}>
          <Text style={[estilos.epigrafe, { marginBottom: 5 }]}>{viaje.titulo}</Text>

          <FilaDePalanca
            etiqueta={SOLO_MUJERES.etiqueta}
            descripcion={SOLO_MUJERES.descripcion}
            activa={soloMujeres}
            alCambiar={() => setSoloMujeres((v) => !v)}
          />
          <FilaDePalanca
            etiqueta={COMPARTIR_LLEGADA}
            activa={compartirLlegada}
            alCambiar={() => setCompartirLlegada((v) => !v)}
            ultima
          />
        </View>

        <View style={estilos.tarjeta}>
          <Text style={[estilos.epigrafe, { marginBottom: 10 }]}>{dinero.titulo}</Text>

          {dinero.filas.map((fila, i) => {
            // La cédula es la única que enseña un estado en vez de un dato: la
            // reconocemos porque su valor es el que da el servicio de seguridad.
            const esEstado = fila.valor != null && fila.valor === cedula.etiqueta;
            const ultima = i === dinero.filas.length - 1;
            const relleno = RELLENO_DINERO[i] ?? 11;

            return (
              <Pressable
                key={fila.etiqueta}
                accessibilityRole={esEstado ? 'text' : 'button'}
                accessibilityLabel={fila.valor ? `${fila.etiqueta}, ${fila.valor}` : fila.etiqueta}
                disabled={esEstado}
                onPress={fila.ruta ? () => router.push(fila.ruta as Href) : undefined}
                style={[
                  estilos.filaDato,
                  { paddingTop: relleno, paddingBottom: ultima ? 0 : relleno },
                ]}
              >
                <Text style={estilos.filaDatoEtiqueta}>{fila.etiqueta}</Text>

                {esEstado ? (
                  // El punto se sienta en el hueco que la etiqueta reserva a su
                  // izquierda: así la pastilla mide lo que mide en el traspaso.
                  <View style={estilos.insignia}>
                    <View style={estilos.punto} />
                    <Text style={estilos.insigniaTexto}>{fila.valor}</Text>
                  </View>
                ) : (
                  <>
                    {fila.valor ? <Text style={estilos.filaDatoValor}>{fila.valor}</Text> : null}
                    <Adelante />
                  </>
                )}
              </Pressable>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={salida.filas[0].etiqueta}
          // Cerrar sesión deja la app como recién instalada, no en la puerta
          // de mitad de recorrido: sin sesión no hay viaje detrás que mirar.
          onPress={() => router.replace('/(cuenta)/apertura')}
          style={({ pressed }) => [estilos.cerrar, pressed && { backgroundColor: color.rojo50 }]}
        >
          <Text style={estilos.cerrarTexto}>{salida.filas[0].etiqueta}</Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * La fila de interruptor. `Interruptor` de `@/ui/controles` mete la etiqueta en
 * una caja de `flex: 1`, y aquí el traspaso la ciñe al texto y empuja el
 * control contra el borde de la tarjeta; su descripción, además, va a 1,4 de
 * interlineado y no a 18 px pelados. Se queda con las medidas del sistema
 * (48 × 30, pulgar de 24, recorrido de 18) y con esta caja.
 */
function FilaDePalanca({
  etiqueta,
  descripcion,
  activa,
  alCambiar,
  ultima = false,
}: {
  etiqueta: string;
  descripcion?: string;
  activa: boolean;
  alCambiar: () => void;
  ultima?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: activa }}
      accessibilityLabel={descripcion ? `${etiqueta}. ${descripcion}` : etiqueta}
      onPress={alCambiar}
      style={[
        estilos.filaPalanca,
        { alignItems: descripcion ? 'flex-start' : 'center', paddingBottom: ultima ? 0 : 9 },
      ]}
    >
      <View style={estilos.palancaTextos}>
        <Text style={estilos.palancaEtiqueta}>{etiqueta}</Text>
        {descripcion ? <Text style={estilos.palancaDescripcion}>{descripcion}</Text> : null}
      </View>

      <View style={[estilos.pista, { backgroundColor: activa ? color.rojo500 : color.ink200 }]}>
        <View style={[estilos.pulgar, { transform: [{ translateX: activa ? 18 : 0 }] }]} />
      </View>
    </Pressable>
  );
}

/** El galón de «lleva a otra pantalla». No está en `@/ui/iconos`. */
function Adelante() {
  return (
    <Svg viewBox="0 0 24 24" width={17} height={17} fill="none">
      <Path
        d="M9 5l7 7-7 7"
        stroke={color.ink400}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: color.sand100,
    maxWidth: 390,
    width: '100%',
    alignSelf: 'center',
    ...(Platform.OS === 'web' ? { height: 844, maxHeight: 844 } : null),
  },

  cabecera: { paddingTop: 6, paddingHorizontal: espacio.gutter },
  filaVolver: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  volver: {
    width: espacio.controlS,
    height: espacio.controlS,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  epigrafeCampo: { ...texto.epigrafe, color: color.campoTexto },
  // Ceñido al texto, como el titular del traspaso: si se estira, se descentra.
  titular: {
    fontSize: 33,
    lineHeight: 34.65,
    letterSpacing: -1.32,
    fontWeight: '600',
    color: color.blanco,
    marginTop: 14,
    alignSelf: 'flex-start',
    fontFamily: familia,
  },

  cuerpo: { flex: 1, overflow: 'hidden', paddingTop: 20, paddingHorizontal: 22, gap: 11 },

  hoja: {
    backgroundColor: color.blanco,
    borderRadius: RADIO_HOJA,
    padding: 18,
    ...sombra.hoja,
  },
  tarjeta: {
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    padding: 18,
  },
  epigrafe: { ...texto.epigrafe, color: color.azul500 },
  resumen: {
    fontSize: 12.5,
    lineHeight: 18.125,
    color: color.ink500,
    marginTop: 3,
    marginBottom: 4,
    alignSelf: 'flex-start',
    fontFamily: familia,
  },

  filaPalanca: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  palancaTextos: { flexShrink: 1 },
  palancaEtiqueta: {
    fontSize: 15,
    lineHeight: 21.75,
    fontWeight: '500',
    color: color.ink900,
    fontFamily: familia,
  },
  palancaDescripcion: {
    fontSize: 13,
    lineHeight: 18.2,
    color: color.ink600,
    marginTop: 2,
    fontFamily: familia,
  },
  pista: {
    width: 48,
    height: 30,
    borderRadius: radio.pastilla,
    padding: 3,
    justifyContent: 'center',
  },
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

  filaDato: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  filaDatoEtiqueta: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21.75,
    fontWeight: '500',
    letterSpacing: -0.225,
    color: color.ink900,
    fontFamily: familia,
  },
  filaDatoValor: {
    fontSize: 13.5,
    lineHeight: 19.575,
    color: color.ink600,
    fontFamily: familia,
    ...tabular,
  },

  insignia: {
    height: 22,
    borderRadius: radio.pastilla,
    justifyContent: 'center',
    backgroundColor: VERDE_FONDO,
  },
  punto: {
    position: 'absolute',
    left: 8,
    top: 8,
    width: 6,
    height: 6,
    borderRadius: radio.pastilla,
    backgroundColor: VERDE_TINTA,
    opacity: 0.85,
  },
  insigniaTexto: {
    paddingLeft: 20,
    paddingRight: 8,
    fontSize: 11,
    lineHeight: 15.95,
    fontWeight: '500',
    letterSpacing: -0.055,
    color: VERDE_TINTA,
    fontFamily: familia,
  },

  cerrar: {
    height: 52,
    borderRadius: radio.pastilla,
    borderWidth: 1.5,
    borderColor: color.rojo300,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cerrarTexto: {
    fontSize: 15.5,
    lineHeight: 22.475,
    fontWeight: '600',
    letterSpacing: -0.2325,
    color: color.rojo700,
    fontFamily: familia,
  },
});
