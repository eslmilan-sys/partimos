/**
 * `14c` Añadir método de pago — Yappy o tarjeta.
 *
 * La tarifa se enseña a tamaño de titular y en dinero sobre un viaje de
 * verdad, **antes** del botón. Guardar un método es el momento en que se
 * decide cuánto vas a pagar de más cada vez, así que el porcentaje pesa más
 * en la pantalla que el nombre del método: nadie debería enterarse de la
 * tarifa al pagar.
 *
 * La línea del candado no es letra chica ni va escondida en un enlace: se
 * sienta a la vista, debajo de la tarifa, porque es lo primero que uno se
 * pregunta al teclear un celular o una tarjeta.
 *
 * La hoja es blanca sobre el campo rojo, así que la acción de guardar es
 * azul: rojo sobre rojo no se lee.
 */

import { useEffect, useMemo, useState } from 'react';

import { useRouter } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { type CanalDePago, TARIFA_PCT, seCobraEnLaApp, tarifaDeServicio } from '@/dominio/tarifas';
import { type MetodoDePago, metodosDePago } from '@/servicios/pagos';
import { type ReservaPreparada, prepararReserva } from '@/servicios/reservas';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Brillo, CampoRojo } from '@/ui/CampoRojo';
import { Boton, Campo } from '@/ui/controles';
import { formatearDinero, formatearDineroRedondo, tabular } from '@/ui/dinero';
import { Atras } from '@/ui/iconos';
import { TRACK_MICRO, familia, color, espacio, radio, sombra } from '@/ui/tokens';

/**
 * El viaje de referencia del traspaso, Albrook → Chitré. La tarifa no se
 * enseña en abstracto: se enseña sobre lo que cuesta un viaje real.
 */
const VIAJE_DE_REFERENCIA = '55555555-5555-4555-8555-555555555555';

/** El efectivo no se guarda: no pasa por la app, se paga en la mano al subir. */
type Guardable = Exclude<CanalDePago, 'external'>;
const esGuardable = (canal: CanalDePago): canal is Guardable => seCobraEnLaApp(canal);

/** Lo único que cambia de un método a otro es texto de interfaz. */
const FORMULARIO: Record<
  Guardable,
  { etiqueta: string; marcador: string; ayuda: string; porque: string; boton: string }
> = {
  yappy_app: {
    etiqueta: 'Celular de tu Yappy',
    marcador: '6000-0000',
    ayuda: 'El banco te pedirá confirmar en su app.',
    porque: 'Es el método más barato en Panamá y el que usa casi todo el mundo aquí.',
    boton: 'Guardar el Yappy',
  },
  card: {
    etiqueta: 'Número de la tarjeta',
    marcador: '0000 0000 0000 0000',
    ayuda: 'El banco te pedirá confirmar el cobro.',
    porque: 'Sirve con cualquier banco, dentro y fuera de Panamá.',
    boton: 'Guardar la tarjeta',
  },
};

export default function MetodoNuevo() {
  const router = useRouter();
  const [metodos, setMetodos] = useState<MetodoDePago[]>([]);
  const [datos, setDatos] = useState<ReservaPreparada | null>(null);
  const [canal, setCanal] = useState<Guardable>('yappy_app');
  const [numero, setNumero] = useState('');

  useEffect(() => {
    metodosDePago(VIAJE_DE_REFERENCIA).then(setMetodos);
    prepararReserva(VIAJE_DE_REFERENCIA).then(setDatos);
  }, []);

  const pestanas = useMemo(
    () => metodos.flatMap((m) => (esGuardable(m.canal) ? [{ canal: m.canal, nombre: m.nombre }] : [])),
    [metodos],
  );

  if (!datos || pestanas.length === 0) return <View style={estilos.pantalla} />;

  const copia = FORMULARIO[canal];
  const aporte = datos.aporteCentavos;

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={206} />

      <BarraDeEstado />

      <View style={estilos.cuerpo}>
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
            <Text style={estilos.epigrafeCampo}>Cuenta · dinero</Text>
          </View>
          <Text style={estilos.titular}>
            {'Añadir '}
            <Text style={estilos.titularFuerte}>método</Text>
          </Text>
        </View>

        <View style={estilos.lienzo}>
          <View style={estilos.hoja}>
            <View style={estilos.segmentado}>
              {pestanas.map((p) => {
                const elegido = p.canal === canal;
                return (
                  <Pressable
                    key={p.canal}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: elegido }}
                    accessibilityLabel={p.nombre}
                    onPress={() => setCanal(p.canal)}
                    style={[
                      estilos.pestana,
                      elegido && { backgroundColor: color.blanco },
                    ]}
                  >
                    <Text
                      style={[
                        estilos.pestanaTexto,
                        { color: elegido ? color.ink900 : color.ink600 },
                      ]}
                    >
                      {p.nombre}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={estilos.grupo}>
              <Text style={estilos.etiqueta}>{copia.etiqueta}</Text>
              <Campo
                valor={numero}
                alEscribir={setNumero}
                marcador={copia.marcador}
                ayuda={copia.ayuda}
                etiquetaAccesible={copia.etiqueta}
              />
            </View>
          </View>

          <View style={estilos.tarjetaTarifa}>
            <Brillo ancho={344} alto={149} />

            <Text style={estilos.epigrafeTarifa}>Lo que te cuesta usarlo</Text>

            <View style={estilos.filaTarifa}>
              <Text style={estilos.porcentaje}>{`${TARIFA_PCT[canal]} %`}</Text>
              {/* El ejemplo se apoya en la línea base del porcentaje, no en su caja. */}
              <View style={estilos.cajaEjemplo}>
                <Text style={estilos.ejemplo}>
                  {`${formatearDinero(tarifaDeServicio(aporte, canal))} en un viaje de ${formatearDineroRedondo(aporte)}`}
                </Text>
              </View>
            </View>

            <View style={estilos.separador}>
              <Text style={estilos.porque}>{copia.porque}</Text>
            </View>
          </View>

          <View style={estilos.filaCandado}>
            <Candado />
            <Text style={estilos.notaCandado}>
              No guardamos el número completo. Lo custodia el banco.
            </Text>
          </View>
        </View>

        <View style={estilos.pie}>
          <Boton tono="azul">{copia.boton}</Boton>
          <Text style={estilos.notaPie}>No se cobra nada al guardarlo.</Text>
        </View>
      </View>
    </View>
  );
}

/** El candado del traspaso. No está en `@/ui/iconos` y esta es la única pantalla que lo usa. */
function Candado({ tamano = 15, tinta = color.ink400 }: { tamano?: number; tinta?: string }) {
  return (
    <Svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke={tinta}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={estilos.candado}
    >
      <Rect x={4} y={10} width={16} height={10} rx={2.4} />
      <Path d="M8 10V7.6a4 4 0 0 1 8 0V10" />
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

  cuerpo: { flex: 1, minHeight: 0 },

  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 4 },
  filaEpigrafe: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  epigrafeCampo: {
    fontSize: 11,
    lineHeight: 15.95,
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.campoTexto,
    fontFamily: familia,
  },
  titular: {
    fontSize: 31,
    lineHeight: 32.55,
    letterSpacing: -1.24,
    fontWeight: '400',
    color: '#fff',
    marginTop: 12,
    fontFamily: familia,
  },
  titularFuerte: { fontWeight: '600' },

  lienzo: { flex: 1, minHeight: 0, overflow: 'hidden' },

  hoja: {
    marginHorizontal: 22,
    marginTop: 20,
    backgroundColor: color.blanco,
    // `--radius-sheet` son 28; `radio.hoja` se quedó en 26 al portar los tokens.
    borderRadius: 28,
    padding: 18,
    ...sombra.hoja,
  },

  segmentado: {
    flexDirection: 'row',
    gap: 7,
    backgroundColor: color.sand200,
    borderRadius: radio.pastilla,
    padding: 4,
  },
  pestana: { flex: 1, paddingVertical: 9, borderRadius: radio.pastilla },
  pestanaTexto: {
    fontSize: 13.5,
    lineHeight: 19.575,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: familia,
  },

  grupo: { marginTop: 15 },
  etiqueta: {
    fontSize: 13,
    lineHeight: 15.6,
    fontWeight: '500',
    color: color.ink600,
    marginBottom: 7,
    fontFamily: familia,
  },

  tarjetaTarifa: {
    marginHorizontal: 22,
    marginTop: 10,
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    padding: 18,
    overflow: 'hidden',
  },
  epigrafeTarifa: {
    fontSize: 11,
    lineHeight: 15.95,
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.azul500,
    fontFamily: familia,
  },
  filaTarifa: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 8 },
  porcentaje: {
    fontSize: 31,
    lineHeight: 27.9,
    fontWeight: '700',
    letterSpacing: -1.395,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  cajaEjemplo: { paddingBottom: 3 },
  ejemplo: {
    fontSize: 13.5,
    lineHeight: 19.575,
    color: color.ink600,
    fontFamily: familia,
    ...tabular,
  },
  separador: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
    paddingTop: 12,
  },
  porque: { fontSize: 12.5, lineHeight: 18.125, color: color.ink700, fontFamily: familia },

  filaCandado: {
    marginHorizontal: 22,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  candado: { marginTop: 1 },
  notaCandado: {
    fontSize: 12.5,
    lineHeight: 18.125,
    color: color.ink500,
    flexShrink: 1,
    fontFamily: familia,
  },

  pie: {
    paddingHorizontal: espacio.gutter,
    paddingTop: 14,
    paddingBottom: 26,
    backgroundColor: color.blanco,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  notaPie: {
    textAlign: 'center',
    fontSize: 12.5,
    lineHeight: 18.125,
    color: color.ink500,
    marginTop: 10,
    fontFamily: familia,
  },
});
