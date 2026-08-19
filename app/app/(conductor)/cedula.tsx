/**
 * `6d` Verificación de la cédula — la pantalla que dice en voz alta lo que no
 * guardamos.
 *
 * La cédula se verifica **fuera**: la foto del documento y el número van al
 * proveedor certificado y nunca llegan a nuestros servidores. De vuelta sólo
 * recibimos dos cosas, si pasó o no y una referencia. Por eso esto no es un
 * formulario sino una línea de tiempo: aquí no hay nada que subir, sólo algo
 * que esperar, y el tercer paso enseña por escrito el límite de lo que entra.
 *
 * Verificarse es obligatorio para conducir, así que el pie no ofrece ningún
 * atajo para publicar: la única acción es volver a mirar el estado. Los dos
 * beneficios de abajo son la razón de esperar, y nunca un distintivo que
 * separe a unos conductores de otros.
 */

import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';

import {
  type EstadoDeCedula,
  LO_QUE_DA_LA_CEDULA,
  PASOS_DE_LA_CEDULA,
  estadoDeCedula,
  pedirVerificacion,
} from '@/servicios/seguridad';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { CampoRojo } from '@/ui/CampoRojo';
import { Boton, Epigrafe } from '@/ui/controles';
import { tabular } from '@/ui/dinero';
import { Atras } from '@/ui/iconos';
import { familia, color, espacio, radio, sombra } from '@/ui/tokens';

/**
 * Quien se está haciendo conductor. Andrés la tiene verificada desde hace
 * meses; esta pantalla es la de quien acaba de mandarla. Mientras no haya
 * sesión, ésta es la convención.
 */
const PERFIL = '22222222-2222-4222-8222-222222222222';

/** `--arena-700` del traspaso: el ámbar de lo que está en curso. `@/ui/tokens`
 *  trae la arena clara pero no su tinta, y no se tocan los tokens desde aquí. */
const ARENA_700 = '#A06F33';

/** Hasta dónde llegó la verificación, en pasos de `PASOS_DE_LA_CEDULA`. Que la
 *  respuesta sea «no» también es haberla recibido: ahí la línea está completa. */
const HASTA_DONDE: Record<EstadoDeCedula['estado'], number> = {
  pendiente: 0,
  'en revisión': 1,
  verificada: PASOS_DE_LA_CEDULA.length,
  rechazada: PASOS_DE_LA_CEDULA.length,
};

const TINTA_DEL_ESTADO: Record<EstadoDeCedula['estado'], { fondo: string; tinta: string }> = {
  pendiente: { fondo: color.arena100, tinta: ARENA_700 },
  'en revisión': { fondo: color.arena100, tinta: ARENA_700 },
  verificada: { fondo: color.azul100, tinta: color.azul700 },
  rechazada: { fondo: color.rojo100, tinta: color.rojo700 },
};

export default function Cedula() {
  const router = useRouter();
  const [datos, setDatos] = useState<EstadoDeCedula | null>(null);

  const mirar = useCallback(() => estadoDeCedula(PERFIL).then(setDatos), []);

  useEffect(() => {
    // Llegar aquí es haber mandado la cédula al proveedor: se abre la
    // verificación —si ya existe, devuelve la que hay— y de ahí en adelante
    // esta pantalla sólo lee.
    pedirVerificacion(PERFIL).then(mirar);
  }, [mirar]);

  if (!datos) return <View style={estilos.pantalla} />;

  const hasta = HASTA_DONDE[datos.estado];
  const insignia = TINTA_DEL_ESTADO[datos.estado];

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={214} />

      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <View style={estilos.filaCabecera}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atrás"
            onPress={() => router.back()}
            style={estilos.circulo}
          >
            <Atras />
          </Pressable>
          <Epigrafe tinta={color.campoTexto}>Verificación</Epigrafe>
        </View>

        <Text style={estilos.titular}>
          {'Tu cédula se'}
          {'\n'}
          <Text style={estilos.titularFuerte}>verifica fuera de aquí</Text>
        </Text>
      </View>

      <View style={estilos.cuerpo}>
        <View style={estilos.tarjeta}>
          <View style={estilos.filaEstado}>
            <Text style={estilos.estado}>Estado</Text>
            <View style={[estilos.insignia, { backgroundColor: insignia.fondo }]}>
              {/* Fuera del flujo para que la caja del texto quede centrada en
                  la pastilla, como en el traspaso. */}
              <View style={[estilos.insigniaPunto, { backgroundColor: insignia.tinta }]} />
              <Text style={[estilos.insigniaTexto, { color: insignia.tinta }]}>{datos.etiqueta}</Text>
            </View>
          </View>

          {PASOS_DE_LA_CEDULA.map((paso, i) => {
            const hecho = i < hasta;
            const enCurso = i === hasta;
            const ultimo = i === PASOS_DE_LA_CEDULA.length - 1;

            return (
              <View
                key={paso.titulo}
                style={[estilos.paso, i === 0 && { paddingTop: 16 }, !ultimo && { paddingBottom: 14 }]}
              >
                {ultimo ? null : (
                  <View
                    style={[
                      estilos.linea,
                      { top: i === 0 ? 36 : 20 },
                      hecho && { backgroundColor: color.rojo300 },
                    ]}
                  />
                )}
                {/* El halo del paso en curso: en React Native no hay `spread`,
                    así que va detrás, fuera del flujo. */}
                {enCurso ? <View style={estilos.halo} /> : null}
                <View
                  style={[
                    estilos.marca,
                    (hecho || enCurso) && { backgroundColor: color.rojo500, borderWidth: 0 },
                  ]}
                />
                <View style={estilos.pasoTexto}>
                  <Text
                    style={[
                      estilos.pasoTitulo,
                      enCurso && { fontWeight: '500' },
                      !hecho && !enCurso && { color: color.ink600 },
                    ]}
                  >
                    {paso.titulo}
                  </Text>
                  {/* El renglón lleva la interlínea del cuerpo (15/21.75) y el
                      detalle va dentro: así el texto pequeño se sienta sobre la
                      misma línea base que en el diseño. */}
                  <Text style={estilos.renglon}>
                    <Text style={estilos.pasoDetalle}>{paso.detalle}</Text>
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={estilos.nota}>
          <View style={estilos.notaIcono}>
            <Candado />
          </View>
          <Text style={estilos.notaTexto}>
            La foto del documento y el número nunca llegan a nuestros servidores.
          </Text>
        </View>

        <View style={estilos.beneficios}>
          <Epigrafe>Con la cédula verificada</Epigrafe>
          {LO_QUE_DA_LA_CEDULA.map((linea, i) => (
            <View
              key={linea}
              style={[estilos.beneficio, i < LO_QUE_DA_LA_CEDULA.length - 1 && estilos.beneficioPartido]}
            >
              <Text style={estilos.numero}>{i + 1}</Text>
              <Text style={estilos.beneficioTexto}>{linea}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={estilos.pie}>
        <Boton tono="rojo" alPulsar={mirar}>
          Ver el estado otra vez
        </Boton>
        <Text style={estilos.notaPie}>Se hace una sola vez.</Text>
      </View>
    </View>
  );
}

/** El candado del traspaso. No está en `@/ui/iconos` y no se tocan desde aquí. */
function Candado({ tamano = 19, tinta = color.azul500 }: { tamano?: number; tinta?: string }) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path
        d="M6 11h12v9H6z"
        stroke={tinta}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 11V8a3 3 0 0 1 6 0v3"
        stroke={tinta}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: color.sand100,
    maxWidth: 390,
    width: '100%',
    alignSelf: 'center',
    ...(Platform.OS === 'web' ? { height: 844, maxHeight: 844 } : null),
  },

  cabecera: { paddingHorizontal: espacio.gutter },
  filaCabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titular: {
    fontSize: 28,
    lineHeight: 30.24,
    letterSpacing: -1.176,
    fontWeight: '400',
    color: color.blanco,
    marginTop: 14,
    fontFamily: familia,
  },
  titularFuerte: {
    fontSize: 28,
    lineHeight: 30.24,
    letterSpacing: -1.176,
    fontWeight: '600',
    color: color.blanco,
    fontFamily: familia,
  },

  cuerpo: { flex: 1, overflow: 'hidden', paddingTop: 26, paddingHorizontal: 22, paddingBottom: 152 },

  // `--radius-sheet` son 28 px; `radio.hoja` se quedó en 26.
  tarjeta: { backgroundColor: color.blanco, borderRadius: 28, padding: 20, ...sombra.hoja },

  filaEstado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: color.bordeSutil,
  },
  estado: {
    flex: 1,
    fontSize: 16.5,
    lineHeight: 23.925,
    letterSpacing: -0.33,
    fontWeight: '500',
    color: color.ink900,
    fontFamily: familia,
  },
  insignia: {
    height: 28,
    borderRadius: radio.pastilla,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },
  insigniaPunto: {
    position: 'absolute',
    left: 11,
    top: 11,
    width: 6,
    height: 6,
    borderRadius: radio.pastilla,
    opacity: 0.85,
  },
  insigniaTexto: {
    paddingLeft: 12,
    fontSize: 12.5,
    lineHeight: 18.125,
    letterSpacing: -0.0625,
    fontWeight: '500',
    fontFamily: familia,
  },

  paso: { flexDirection: 'row', gap: 14, position: 'relative' },
  linea: {
    position: 'absolute',
    left: 4.5,
    bottom: 0,
    width: 1.5,
    backgroundColor: color.bordePorDefecto,
  },
  halo: {
    position: 'absolute',
    left: -5,
    top: 0,
    width: 20,
    height: 20,
    borderRadius: radio.pastilla,
    backgroundColor: color.rojo100,
  },
  marca: {
    width: 10,
    height: 10,
    marginTop: 5,
    borderRadius: radio.pastilla,
    backgroundColor: color.blanco,
    borderWidth: 2,
    borderColor: color.ink200,
  },
  pasoTexto: { flex: 1 },
  pasoTitulo: {
    fontSize: 15.5,
    lineHeight: 22.475,
    letterSpacing: -0.279,
    fontWeight: '400',
    color: color.ink900,
    fontFamily: familia,
  },
  renglon: { fontSize: 15, lineHeight: 21.75, color: color.ink500, fontFamily: familia },
  pasoDetalle: { fontSize: 12.5, lineHeight: 18.125, fontWeight: '400', color: color.ink500, fontFamily: familia },

  nota: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: color.azul50,
    borderWidth: 1,
    borderColor: color.azul100,
    borderRadius: radio.l,
    paddingVertical: 15,
    paddingHorizontal: 17,
  },
  notaIcono: { width: 19, height: 19, marginTop: 1 },
  notaTexto: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 19.575,
    fontWeight: '400',
    color: color.ink700,
    fontFamily: familia,
  },

  beneficios: { paddingTop: 22, paddingHorizontal: 4 },
  beneficio: { flexDirection: 'row', alignItems: 'baseline', gap: 14, paddingVertical: 13 },
  beneficioPartido: { borderBottomWidth: 1, borderBottomColor: color.bordeSutil },
  numero: {
    width: 20,
    fontSize: 14,
    lineHeight: 20.3,
    fontWeight: '600',
    color: color.rojo600,
    fontFamily: familia,
    ...tabular,
  },
  beneficioTexto: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21.75,
    fontWeight: '400',
    color: color.ink900,
    fontFamily: familia,
  },

  pie: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: 9,
    backgroundColor: color.blanco,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
    paddingTop: 16,
    paddingHorizontal: espacio.gutter,
    paddingBottom: 28,
    shadowColor: '#26232B',
    shadowOpacity: 0.18,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -10 },
    elevation: 10,
  },
  notaPie: {
    textAlign: 'center',
    fontSize: 12.5,
    lineHeight: 18.125,
    fontWeight: '400',
    color: color.ink500,
    fontFamily: familia,
  },
});
