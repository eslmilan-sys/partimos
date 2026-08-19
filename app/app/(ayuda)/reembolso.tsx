/**
 * `7d` Pedir reembolso — empieza por lo que pasó, no por un formulario.
 *
 * La regla, el importe y el plazo no los decide lo que el pasajero pida, los
 * decide el motivo: si cancelas tú a menos de 2 h el conductor se queda 1 $; si
 * falla el otro vuelve todo, tarifa incluida; y si nunca se marcó el código son
 * 24 h en vez de 3 a 5 días. Por eso la pregunta es «¿qué pasó?» y la tarjeta
 * de abajo se reescribe entera con cada opción: se lee la consecuencia antes de
 * tocar «Solicitar», no después.
 *
 * La hoja es blanca sobre el campo rojo, así que aquí la acción es azul.
 */

import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Path, Rect } from 'react-native-svg';

import type { MotivoDeReembolso } from '@/dominio/reembolsos';
import { ajustes } from '@/servicios/ajustes';
import { comprobante, viajeDeAyuda, type ViajeDeAyuda } from '@/servicios/ayuda';
import {
  MOTIVOS,
  cancelar,
  previsualizarTodos,
  type Previsualizacion,
} from '@/servicios/cancelaciones';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { CampoRojo } from '@/ui/CampoRojo';
import { Boton, Epigrafe } from '@/ui/controles';
import { formatearDinero, tabular } from '@/ui/dinero';
import { hora } from '@/ui/fechas';
import { Atras } from '@/ui/iconos';
import { familia, color, espacio, interlinea, radio, sombra, texto } from '@/ui/tokens';

/** La reserva de Daniela, la pasajera, y ella misma. Mientras no haya sesión. */
const RESERVA = '77777777-7777-4777-8777-777777777700';
const PASAJERA = '99999999-9999-4999-8999-999999999999';

/**
 * El traspaso pregunta en pasado. `14a` dice «Ya no puedo ir» porque ahí todavía
 * no ha pasado nada; aquí ya pasó, y la misma clave se cuenta como «Cancelé yo».
 * Las claves y el orden son del servicio; el tiempo verbal es de esta pantalla.
 */
const COMO_LO_CUENTAS: Record<MotivoDeReembolso, string> = {
  yo: 'Cancelé yo',
  conductor: 'El conductor canceló',
  novino: 'El conductor no llegó',
  nopaso: 'El viaje no pasó',
};

/** El motivo con el que se dibuja el traspaso, cuando no se llega desde una queja. */
const POR_DEFECTO: MotivoDeReembolso = 'conductor';

export default function Reembolso() {
  const router = useRouter();
  const parametros = useLocalSearchParams<{ motivo?: string }>();

  const [viaje, setViaje] = useState<ViajeDeAyuda | null>(null);
  const [referencia, setReferencia] = useState('');
  const [previas, setPrevias] = useState<Previsualizacion[]>([]);
  const [aDonde, setADonde] = useState('');
  const [pidiendo, setPidiendo] = useState(false);
  const [motivo, setMotivo] = useState<MotivoDeReembolso>(
    MOTIVOS.find((m) => m.clave === parametros.motivo)?.clave ?? POR_DEFECTO,
  );

  useEffect(() => {
    viajeDeAyuda(RESERVA).then(setViaje);
    comprobante(RESERVA).then((c) => setReferencia(c.referencia));
    previsualizarTodos(RESERVA).then(setPrevias);
    // Dónde cae el dinero es el método de pago de la cuenta: la fila que lleva a
    // cambiarlo es la misma que enseña cuál es.
    ajustes(PASAJERA).then((grupos) => {
      const fila = grupos.flatMap((g) => g.filas).find((f) => f.ruta === '/(pasajero)/metodos');
      setADonde(fila?.valor ?? '');
    });
  }, []);

  const previa = previas.find((p) => p.motivo === motivo);
  if (!viaje || !previa) return <View style={estilos.pantalla} />;

  const pedir = async () => {
    setPidiendo(true);
    await cancelar(RESERVA, motivo, PASAJERA);
    // `15c` — por dónde va el reembolso — todavía no está en el árbol de rutas.
    // Mientras no exista, el reembolso queda pedido y se vuelve por donde se vino.
    router.back();
  };

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={214} />
      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <View style={estilos.filaEpigrafe}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atrás"
            onPress={() => router.back()}
            style={estilos.circulo}
          >
            <Atras />
          </Pressable>
          <Epigrafe tinta={color.campoTexto}>
            {`Reserva ${referencia} · ${viaje.destino} ${hora(viaje.cuando)}`}
          </Epigrafe>
        </View>
        <Text style={estilos.titular}>
          {'Pedir '}
          <Text style={estilos.titularFuerte}>reembolso</Text>
        </Text>
      </View>

      <ScrollView style={estilos.medio} showsVerticalScrollIndicator={false}>
        <View style={estilos.hoja}>
          <View style={{ marginBottom: 14 }}>
            <Epigrafe>¿Qué pasó?</Epigrafe>
          </View>

          <View style={{ gap: 8 }}>
            {MOTIVOS.map((m) => {
              const elegido = m.clave === motivo;
              return (
                <Pressable
                  key={m.clave}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: elegido }}
                  accessibilityLabel={COMO_LO_CUENTAS[m.clave] ?? m.etiqueta}
                  onPress={() => setMotivo(m.clave)}
                  style={[
                    estilos.motivo,
                    {
                      borderColor: elegido ? color.azul500 : color.bordeSutil,
                      backgroundColor: elegido ? color.azul100 : color.blanco,
                    },
                  ]}
                >
                  <View
                    style={[
                      estilos.anillo,
                      { borderColor: elegido ? color.azul500 : color.bordePorDefecto },
                    ]}
                  >
                    {elegido ? <View style={estilos.punto} /> : null}
                  </View>
                  <Text style={estilos.motivoTexto}>
                    {COMO_LO_CUENTAS[m.clave] ?? m.etiqueta}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={estilos.tarjeta}>
          {/* El título y el texto van en su propia caja dentro de la línea, como
              en el traspaso: la regla ocupa lo que mide, no toda la columna. */}
          <Text style={estilos.reglaTitulo}>
            <Text>{previa.titulo}</Text>
          </Text>
          <Text style={estilos.reglaTexto}>
            <Text>{previa.texto}</Text>
          </Text>

          <View style={estilos.filaImporte}>
            <Text style={estilos.etiquetaImporte}>Te devolvemos</Text>
            <Text style={estilos.importe}>{formatearDinero(previa.montoCentavos)}</Text>
          </View>

          <View style={estilos.filaMetodo}>
            <TarjetaBancaria />
            <Text style={estilos.metodo}>
              {`A tu ${aDonde} · `}
              <Text style={estilos.plazo}>{previa.plazo}</Text>
            </Text>
            {/* El método de la cuenta (`/(pasajero)/metodos`, la ruta que nombra
                `ajustes`) todavía no existe; el que sí es el de este viaje. */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cambiar a dónde vuelve el dinero"
              onPress={() => router.push('/(pasajero)/pagar')}
            >
              <Text style={estilos.cambiar}>Cambiar</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={estilos.pie}>
        <Boton tono="azul" alPulsar={pedir} desactivado={pidiendo}>
          Solicitar reembolso
        </Boton>
        {/* La conversación con soporte tampoco está todavía en el árbol de rutas. */}
        <Boton tono="contorno" tamano="md" alPulsar={() => router.back()}>
          Escribir a soporte
        </Boton>
      </View>
    </View>
  );
}

/** No hay tarjeta en `@/ui/iconos` y esta línea la pide: dónde cae el dinero. */
function TarjetaBancaria() {
  return (
    <Svg viewBox="0 0 24 24" width={16} height={16} fill="none">
      <Rect
        x={3}
        y={6}
        width={18}
        height={12}
        rx={2.5}
        stroke={color.azul700}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
      <Path d="M3 10h18" stroke={color.azul700} strokeWidth={1.7} strokeLinecap="round" />
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
  filaEpigrafe: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  circulo: {
    width: espacio.controlS,
    height: espacio.controlS,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titular: {
    fontSize: 33,
    // 1.05 del titular grande, no la interlínea del cuerpo.
    lineHeight: 34.65,
    letterSpacing: -1.32,
    fontWeight: '400',
    color: color.blanco,
    marginTop: 16,
    fontFamily: familia,
  },
  titularFuerte: { fontWeight: '600' },

  // Con el motivo del traspaso cabe justo; con la regla de «cancelé yo», que es
  // dos líneas más larga, no. Rueda lo de en medio y el pie se queda fijo.
  medio: { flex: 1, minHeight: 0 },

  hoja: {
    marginTop: 22,
    marginHorizontal: 22,
    backgroundColor: color.blanco,
    // `--radius-sheet` del traspaso son 28; `radio.hoja` se quedó en 26.
    borderRadius: 28,
    padding: espacio.tarjeta,
    ...sombra.hoja,
  },
  motivo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 15,
    // El traspaso pide 1,5 y el navegador lo redondea a 1: con 1,5 de verdad la
    // fila crece un píxel y las cuatro se van desalineando hacia abajo.
    borderWidth: 1,
  },
  anillo: {
    width: 18,
    height: 18,
    borderRadius: radio.pastilla,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  punto: { width: 9, height: 9, borderRadius: radio.pastilla, backgroundColor: color.azul500 },
  motivoTexto: {
    fontSize: 15,
    lineHeight: interlinea(15),
    fontWeight: '500',
    letterSpacing: -0.225,
    color: color.ink900,
    fontFamily: familia,
  },

  tarjeta: {
    marginTop: espacio.entreTarjetas,
    marginHorizontal: 22,
    backgroundColor: color.azul100,
    borderRadius: radio.l,
    padding: 18,
  },
  reglaTitulo: {
    fontSize: 15.5,
    lineHeight: interlinea(15.5),
    fontWeight: '600',
    letterSpacing: -0.31,
    color: color.azul700,
    fontFamily: familia,
  },
  reglaTexto: {
    fontSize: 13.5,
    // El párrafo de la regla respira más que el cuerpo: 1.5.
    lineHeight: 20.25,
    fontWeight: '400',
    color: color.ink700,
    marginTop: 8,
    fontFamily: familia,
    // En web todo Text sale con `white-space: pre-wrap`, y eso mete el espacio
    // del salto de línea dentro de la caja: cuatro píxeles de más al medir.
    ...(Platform.OS === 'web' ? ({ whiteSpace: 'normal' } as object) : null),
  },

  filaImporte: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
    marginTop: 14,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,82,147,.16)',
  },
  etiquetaImporte: { ...texto.epigrafe, color: color.azul700, paddingBottom: 5 },
  importe: {
    fontSize: 32,
    // La cifra grande va apretada contra su línea: 0.9.
    lineHeight: 28.8,
    fontWeight: '700',
    letterSpacing: -1.44,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },

  filaMetodo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 13,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,82,147,.16)',
  },
  metodo: {
    flex: 1,
    minWidth: 0,
    fontSize: 13.5,
    lineHeight: interlinea(13.5),
    fontWeight: '500',
    letterSpacing: -0.2025,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  plazo: { fontWeight: '400', color: color.ink600 },
  cambiar: {
    fontSize: 12.5,
    lineHeight: interlinea(12.5),
    fontWeight: '600',
    color: color.azul700,
    fontFamily: familia,
  },

  pie: {
    backgroundColor: color.blanco,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
    paddingTop: 14,
    paddingHorizontal: espacio.gutter,
    paddingBottom: espacio.gutter,
    gap: 11,
  },
});
