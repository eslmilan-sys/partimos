/**
 * `16d` Permiso de avisos — se pide cuando ya importa, nunca al arrancar.
 *
 * Un permiso pedido en frío se niega. Por eso esta pantalla se cruza justo
 * antes de pedir el puesto, cuando el pasajero ya tiene algo que perder: el
 * epígrafe lo dice («Antes de pedir el puesto») y las tres razones son las tres
 * cosas por las que de verdad vamos a escribirle, en el orden en que ocurren.
 * Ninguna es una ventaja: son avisos que sin ellos le cuestan el viaje.
 *
 * El orden de abajo también es deliberado: primero prometemos qué NO mandamos,
 * y sólo después enseñamos el cartel del sistema, apagado al 70 % y sin
 * responder al dedo, para que el «Permitir» ya esté decidido cuando aparezca
 * de verdad. Ese cartel es un ensayo, no un control: si se hace pulsable, la
 * pantalla miente.
 *
 * El nombre del conductor sale del viaje que se está a punto de reservar. Es
 * el único dato de negocio de la pantalla; lo demás es copia de interfaz.
 */

import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';

import { type ReservaPreparada, prepararReserva } from '@/servicios/reservas';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { CampoRojo } from '@/ui/CampoRojo';
import { Boton } from '@/ui/controles';
import { Atras } from '@/ui/iconos';
import { TRACK_MICRO, familia, color, espacio, radio, sombra, texto } from '@/ui/tokens';

/** Mientras no haya sesión, el viaje del recorrido del diseño: Albrook → Chitré. */
const VIAJE = '55555555-5555-4555-8555-555555555555';

/** `--radius-sheet` son 28 px en el traspaso. `radio.hoja` de los tokens quedó
 *  en 26 y los tokens no se tocan desde una pantalla. */
const RADIO_HOJA = 28;

/* --------------------------------------------------------------- Iconos */
/* Los tres de las razones comparten trazo 1,7 y tinta azul; los de `@/ui/iconos`
   vienen con otro grosor y aquí se notaría contra el cuadro de 34. */

function Aceptado() {
  return (
    <Svg viewBox="0 0 24 24" width={18} height={18} fill="none">
      <Path
        d="M5 12.5l4.5 4.5L19 7.5"
        stroke={color.azul700}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function Mensaje() {
  return (
    <Svg viewBox="0 0 24 24" width={18} height={18} fill="none">
      <Path
        d="M4 5.5h16v11H12l-5 3.5v-3.5H4z"
        stroke={color.azul700}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function Reloj() {
  return (
    <Svg viewBox="0 0 24 24" width={18} height={18} fill="none">
      <Circle cx={12} cy={12.6} r={7.4} stroke={color.azul700} strokeWidth={1.7} />
      <Path
        d="M12 9v3.8l2.6 1.6M9 3.4h6"
        stroke={color.azul700}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** El aspa de lo que no vamos a mandar. */
function Aspa() {
  return (
    <Svg viewBox="0 0 24 24" width={16} height={16} fill="none" style={{ marginTop: 1 }}>
      <Path d="M5 5l14 14M19 5L5 19" stroke={color.ink600} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

/* -------------------------------------------------------------- Pantalla */

export default function PermisoDeAvisos() {
  const router = useRouter();
  const [datos, setDatos] = useState<ReservaPreparada | null>(null);

  useEffect(() => {
    prepararReserva(VIAJE).then(setDatos);
  }, []);

  if (!datos) return <View style={estilos.pantalla} />;

  // Se conteste que sí o que no, de aquí se sigue a pedir el puesto: el
  // permiso no bloquea nada.
  const seguir = () => router.replace('/(pasajero)/reservar');

  const razones = [
    {
      Icono: Aceptado,
      titulo: `Cuando ${datos.conductor} acepte`,
      texto: 'Es lo único que separa tu puesto de la lista de espera.',
    },
    {
      Icono: Mensaje,
      titulo: 'Cuando te escriba',
      texto: 'El punto de recogida se acuerda por el chat.',
    },
    {
      Icono: Reloj,
      titulo: 'Una hora antes de salir',
      texto: 'Para que nadie corra a las 5 de la mañana.',
    },
  ];

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={206} />

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
          <Text style={estilos.epigrafeCampo}>Antes de pedir el puesto</Text>
        </View>
        <Text style={estilos.titular}>
          {'¿Te '}
          <Text style={estilos.titularFuerte}>avisamos</Text>
          {'?'}
        </Text>
      </View>

      <View style={estilos.cuerpo}>
        <View style={estilos.hoja}>
          {razones.map(({ Icono, titulo, texto: detalle }) => (
            <View key={titulo} style={estilos.razon}>
              <View style={estilos.cuadro}>
                <Icono />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={estilos.razonTitulo}>{titulo}</Text>
                <Text style={estilos.razonTexto}>{detalle}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={estilos.nota}>
          <Aspa />
          <Text style={estilos.notaTexto}>
            Nada más. Sin promociones, sin rutas que no pediste, nunca antes de las 7 de la mañana.
            Se apaga por completo en Ajustes.
          </Text>
        </View>

        {/* El cartel del sistema, apagado: es un ensayo, no un control. */}
        <View style={estilos.sistema}>
          <Text style={estilos.epigrafeSistema}>Luego lo pregunta el sistema</Text>
          <View style={estilos.dialogo} pointerEvents="none">
            <Text style={estilos.dialogoTitulo}>«Partimos» quiere enviarte notificaciones</Text>
            <Text style={estilos.dialogoSub}>Pueden incluir avisos y sonidos.</Text>
            <View style={estilos.dialogoOpciones}>
              <View style={[estilos.dialogoOpcion, estilos.dialogoPartido]}>
                <Text style={estilos.dialogoNo}>No permitir</Text>
              </View>
              <View style={estilos.dialogoOpcion}>
                <Text style={estilos.dialogoSi}>Permitir</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={estilos.pie}>
        <Boton tono="azul" alPulsar={seguir}>
          Activar los avisos
        </Boton>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Más tarde"
          onPress={seguir}
          style={estilos.masTardeZona}
        >
          <Text style={estilos.masTarde}>Más tarde</Text>
        </Pressable>
      </View>
    </View>
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
  epigrafeCampo: { ...texto.epigrafe, color: color.campoTexto },
  titular: { ...texto.titular, color: color.blanco, marginTop: 12 },
  titularFuerte: texto.titularFuerte,

  // El cuerpo no desplaza: las tres razones y el ensayo del cartel caben, y lo
  // que se recorta abajo es aire.
  cuerpo: { flex: 1, overflow: 'hidden' },

  hoja: {
    marginTop: 20,
    marginHorizontal: 22,
    backgroundColor: color.blanco,
    borderRadius: RADIO_HOJA,
    paddingTop: 6,
    paddingHorizontal: 18,
    paddingBottom: 14,
    ...sombra.hoja,
  },
  razon: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  cuadro: {
    width: 34,
    height: 34,
    borderRadius: radio.cuadrado,
    backgroundColor: color.azul100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  razonTitulo: {
    fontSize: 15,
    lineHeight: 21.75,
    fontWeight: '500',
    letterSpacing: -0.27,
    color: color.ink900,
    fontFamily: familia,
  },
  razonTexto: {
    fontSize: 12.5,
    lineHeight: 17.5,
    color: color.ink600,
    marginTop: 2,
    fontFamily: familia,
  },

  nota: {
    marginTop: 10,
    marginHorizontal: 22,
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: radio.l,
    backgroundColor: color.sand100,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  notaTexto: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18.75,
    color: color.ink700,
    fontFamily: familia,
  },

  sistema: { marginTop: 16, marginHorizontal: 22 },
  epigrafeSistema: {
    fontSize: 10.5,
    lineHeight: 15.225,
    fontWeight: '600',
    letterSpacing: 10.5 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.ink400,
    marginBottom: 9,
    fontFamily: familia,
  },
  dialogo: {
    borderRadius: 18,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    paddingTop: 16,
    paddingHorizontal: 18,
    paddingBottom: 6,
    opacity: 0.7,
  },
  dialogoTitulo: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20.3,
    fontWeight: '600',
    letterSpacing: -0.21,
    color: color.ink900,
    fontFamily: familia,
  },
  dialogoSub: {
    textAlign: 'center',
    fontSize: 12.5,
    lineHeight: 17.5,
    color: color.ink600,
    marginTop: 5,
    fontFamily: familia,
  },
  dialogoOpciones: {
    flexDirection: 'row',
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  dialogoOpcion: { flex: 1, paddingVertical: 11 },
  dialogoPartido: { borderRightWidth: 1, borderRightColor: color.bordeSutil },
  dialogoNo: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20.3,
    color: color.ink600,
    fontFamily: familia,
  },
  dialogoSi: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20.3,
    fontWeight: '600',
    color: color.azul700,
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
  masTardeZona: { marginTop: 12 },
  masTarde: {
    textAlign: 'center',
    fontSize: 13.5,
    lineHeight: 19.575,
    fontWeight: '600',
    color: color.ink600,
    fontFamily: familia,
  },
});
