/**
 * `15d` Reportar algo — lo urgente arriba, y en silencio.
 *
 * Quien abre esta pantalla puede estar dentro del carro. Por eso el 104 va
 * primero, en su propia hoja blanca y con la placa y la ruta ya cargadas para
 * dictarlas: pedirle un formulario a alguien que está en peligro es pedirle lo
 * que no puede dar. El «Qué pasó» viene después, y sin caja de texto — cuatro
 * motivos que se tocan con el pulgar bastan para abrir el caso.
 *
 * El bloqueo vive en la misma pantalla, no en una segunda. Quien reporta casi
 * siempre quiere además no volver a cruzarse, y mandarlo a otro sitio a
 * buscarlo pierde a la mitad.
 *
 * Y la última línea es la que sostiene todo lo anterior: a la persona
 * reportada no se le dice nunca, ni que la reportaron ni que la bloquearon.
 * Va escrita en la pantalla, no en la letra pequeña, porque el miedo a la
 * represalia es lo que hace que un reporte no se escriba.
 */

import { useEffect, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type TextStyle,
  View,
} from 'react-native';

import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';

import {
  type DatosParaLlamar,
  EMERGENCIAS,
  EMERGENCIAS_QUIEN,
  MOTIVOS_DE_REPORTE,
  datosParaLlamar,
  reportar,
} from '@/servicios/seguridad';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { CampoRojo } from '@/ui/CampoRojo';
import { Boton } from '@/ui/controles';
import { diaCorto } from '@/ui/fechas';
import { Atras } from '@/ui/iconos';
import { color, espacio, familia, interlinea, radio, sombra, texto } from '@/ui/tokens';

// Mientras no haya sesión: la pasajera del recorrido del diseño y el puesto que
// tiene en el Albrook → Chitré. De ese puesto sale a quién se reporta.
const PASAJERA = '99999999-9999-4999-8999-999999999999';
const RESERVA = '77777777-7777-4777-8777-777777777700';

/**
 * React Native Web deja `white-space: pre-wrap` en todo `Text`, y eso conserva
 * el espacio que queda al final de la línea partida: el párrafo mide 4 px más
 * de lo que ocupa. El traspaso corta como corta el navegador.
 */
const CORTE_DEL_NAVEGADOR =
  Platform.OS === 'web' ? ({ whiteSpace: 'normal' } as unknown as TextStyle) : null;

/** El auricular del bloque de emergencia; `@/ui/iconos` no tiene teléfono. */
function Telefono({ tamano = 20, tinta = color.blanco }: { tamano?: number; tinta?: string }) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path
        d="M6.5 4.5l3 1.5-1 3.5 2.5 4 3.5 1 1.5 3-2 2c-4.5-.5-9-5-9.5-9.5z"
        stroke={tinta}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function Reportar() {
  const router = useRouter();
  const [datos, setDatos] = useState<DatosParaLlamar | null>(null);
  const [motivo, setMotivo] = useState(MOTIVOS_DE_REPORTE[0].clave);
  const [bloquear, setBloquear] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    datosParaLlamar(RESERVA).then(setDatos);
  }, []);

  if (!datos) return <View style={estilos.pantalla} />;

  // El epígrafe del campo dice de qué viaje hablamos; el día basta, la fecha
  // exacta sobra cuando ya se está dentro del viaje.
  const dia = diaCorto(datos.cuando).split(' ')[0];
  const nombre = datos.conductor.split(' ')[0];

  const llamar = () => Linking.openURL(`tel:${EMERGENCIAS}`);

  const enviar = async () => {
    setEnviando(true);
    await reportar(RESERVA, motivo, PASAJERA, bloquear);
    router.replace('/(pasajero)');
  };

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={206} />
      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <View style={estilos.filaVolver}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atrás"
            onPress={() => router.back()}
            style={estilos.circulo}
          >
            <Atras />
          </Pressable>
          <Text style={estilos.epigrafeCampo}>{`Viaje del ${dia} · ${datos.conductor}`}</Text>
        </View>
        <Text style={estilos.titular}>Reportar algo</Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={estilos.hojaEmergencia}>
          <View style={estilos.filaEpigrafe}>
            <Text style={estilos.epigrafeRojo}>Si estás en peligro ahora</Text>
            <View style={estilos.puntoVivo} />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Llamar al ${EMERGENCIAS}, ${EMERGENCIAS_QUIEN}`}
            // Lo que hay que dictar por teléfono, leído sin salir de la pantalla.
            accessibilityHint={`Placa ${datos.placa}, ruta ${datos.ruta}, ${datos.carro}`}
            onPress={llamar}
            style={estilos.llamada}
          >
            <View style={estilos.auricular}>
              <Telefono />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={estilos.llamadaTitulo}>{`Llamar al ${EMERGENCIAS}`}</Text>
              <Text style={estilos.llamadaDetalle}>
                {`${EMERGENCIAS_QUIEN} · te pasamos la placa y la ruta`}
              </Text>
            </View>
          </Pressable>

          <Text style={estilos.despues}>Después de llamar, cuéntanoslo aquí.</Text>
        </View>

        <View style={estilos.tarjetaMotivos}>
          <Text style={estilos.epigrafeAzul}>Qué pasó</Text>

          <View style={estilos.motivos} accessibilityRole="radiogroup">
            {MOTIVOS_DE_REPORTE.map((m) => {
              const elegido = m.clave === motivo;
              return (
                <Pressable
                  key={m.clave}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: elegido }}
                  accessibilityLabel={m.etiqueta}
                  onPress={() => setMotivo(m.clave)}
                  style={[
                    estilos.motivo,
                    elegido
                      ? { backgroundColor: color.azul100, borderColor: color.azul500 }
                      : { backgroundColor: color.blanco, borderColor: color.bordeSutil },
                  ]}
                >
                  <View
                    style={[
                      estilos.marca,
                      { borderColor: elegido ? color.azul500 : color.bordePorDefecto },
                    ]}
                  >
                    {elegido ? <View style={estilos.marcaPunto} /> : null}
                  </View>
                  <Text style={estilos.motivoTexto}>{m.etiqueta}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* El párrafo va en su propia caja dentro de la línea, como en el
              traspaso: ocupa lo que mide, no toda la columna. */}
          <View style={estilos.consecuencia}>
            <Text style={estilos.consecuenciaTexto}>
              <Text style={CORTE_DEL_NAVEGADOR}>
                Lo revisamos hoy mismo y puede quedar suspendido mientras miramos.
              </Text>
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: bloquear }}
          accessibilityLabel="Que no volvamos a cruzarnos"
          onPress={() => setBloquear((b) => !b)}
          style={estilos.tarjetaBloqueo}
        >
          <View style={{ flex: 1 }}>
            <Text style={estilos.bloqueoTitulo}>Que no volvamos a cruzarnos</Text>
            <Text style={estilos.bloqueoDetalle}>Ni sus viajes a ti, ni los tuyos a él</Text>
          </View>
          <View style={[estilos.pista, { backgroundColor: bloquear ? color.rojo500 : color.ink200 }]}>
            <View style={[estilos.pulgar, { transform: [{ translateX: bloquear ? 18 : 0 }] }]} />
          </View>
        </Pressable>
      </ScrollView>

      <View style={estilos.pie}>
        <Boton tono="azul" alPulsar={enviar} desactivado={enviando}>
          Enviar el reporte
        </Boton>
        <Text style={estilos.callado}>
          {`${nombre} no sabrá que lo reportaste ni que lo bloqueaste.`}
        </Text>
      </View>
    </View>
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

  cabecera: { paddingTop: 4, paddingHorizontal: espacio.gutter },
  filaVolver: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  epigrafeCampo: { ...texto.epigrafe, color: color.campoTexto },
  titular: { ...texto.titular, color: color.blanco, marginTop: 12 },

  hojaEmergencia: {
    marginTop: 18,
    marginHorizontal: 22,
    backgroundColor: color.blanco,
    // `--radius-sheet` son 28; `radio.hoja` se quedó en 26.
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 18,
    ...sombra.hoja,
  },
  filaEpigrafe: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 11 },
  epigrafeRojo: { ...texto.epigrafe, color: color.rojo600, flex: 1 },
  puntoVivo: { width: 7, height: 7, borderRadius: radio.pastilla, backgroundColor: color.rojo500 },

  llamada: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderRadius: 16,
    backgroundColor: color.rojo100,
  },
  auricular: {
    width: 34,
    height: 34,
    borderRadius: radio.pastilla,
    backgroundColor: color.rojo500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  llamadaTitulo: {
    fontSize: 15.5,
    lineHeight: interlinea(15.5),
    fontWeight: '600',
    letterSpacing: -0.31,
    color: color.rojo700,
    fontFamily: familia,
  },
  llamadaDetalle: {
    fontSize: 12.5,
    lineHeight: interlinea(12.5),
    color: color.ink700,
    marginTop: 1,
    fontFamily: familia,
  },
  despues: {
    fontSize: 12.5,
    lineHeight: interlinea(12.5),
    color: color.ink600,
    marginTop: 11,
    fontFamily: familia,
  },

  tarjetaMotivos: {
    marginTop: 9,
    marginHorizontal: 22,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderRadius: radio.l,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  epigrafeAzul: { ...texto.epigrafe, color: color.azul500, marginBottom: 10 },
  motivos: { gap: 7 },
  motivo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderRadius: 13,
    borderWidth: 1,
  },
  marca: {
    width: 16,
    height: 16,
    borderRadius: radio.pastilla,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marcaPunto: { width: 8, height: 8, borderRadius: radio.pastilla, backgroundColor: color.azul500 },
  motivoTexto: {
    fontSize: 14,
    lineHeight: interlinea(14),
    fontWeight: '500',
    letterSpacing: -0.21,
    color: color.ink900,
    fontFamily: familia,
  },
  consecuencia: {
    marginTop: 11,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  consecuenciaTexto: {
    fontSize: 12.5,
    lineHeight: interlinea(12.5),
    color: color.ink600,
    fontFamily: familia,
  },

  tarjetaBloqueo: {
    marginTop: 9,
    marginHorizontal: 22,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderRadius: radio.l,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    // 12 de hueco y 16 más que el interruptor se reserva a su izquierda.
    gap: 28,
  },
  bloqueoTitulo: {
    fontSize: 14.5,
    lineHeight: interlinea(14.5),
    fontWeight: '500',
    letterSpacing: -0.2175,
    color: color.ink900,
    fontFamily: familia,
  },
  bloqueoDetalle: {
    fontSize: 12.5,
    lineHeight: interlinea(12.5),
    color: color.ink500,
    marginTop: 1,
    fontFamily: familia,
  },
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

  pie: {
    backgroundColor: color.blanco,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
    paddingTop: 14,
    paddingHorizontal: espacio.gutter,
    paddingBottom: 26,
  },
  callado: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 12.5,
    lineHeight: interlinea(12.5),
    color: color.ink500,
    fontFamily: familia,
  },
});
