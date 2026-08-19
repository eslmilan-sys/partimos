/**
 * `1c` La Puerta — la única pantalla de cuenta del recorrido del pasajero.
 *
 * Solo se llega aquí pulsando «Pedir puesto», y el viaje se queda detrás,
 * atenuado pero visible: ya sabes qué ganas antes de dar el correo. Es la
 * diferencia con el conductor, que tiene la cédula en el paso 03.
 */

import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { correoValido } from '@/servicios/cuenta';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Campo } from '@/ui/Campo';
import { CampoRojo } from '@/ui/CampoRojo';
import { Boton, Epigrafe } from '@/ui/controles';
import { tabular } from '@/ui/dinero';
import { Escudo } from '@/ui/iconos';
import { TRACK_MICRO, familia, color, espacio, radio } from '@/ui/tokens';

export default function Puerta() {
  const router = useRouter();
  const { viaje } = useLocalSearchParams<{ viaje?: string }>();
  const [correo, setCorreo] = useState('');

  const listo = correoValido(correo);

  return (
    <View style={estilos.pantalla}>
      {/* El viaje sigue ahí detrás: la puerta no borra lo que ibas a hacer. */}
      <CampoRojo altura={196} />
      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <Text style={estilos.epigrafeCampo}>Sábado 14 de junio</Text>
        <Text style={estilos.titular}>
          <Text style={estilos.titularFuerte}>06:30</Text>
          {' · 3 h 20'}
        </Text>
      </View>

      <View style={estilos.detras}>
        <View style={estilos.tarjetaDetras}>
          <View style={estilos.parada}>
            <View style={estilos.puntoLleno} />
            <View style={{ flex: 1 }}>
              <Text style={estilos.paradaNombre}>Albrook · Terminal</Text>
              <Text style={estilos.paradaDetalle}>Junto a la entrada principal</Text>
            </View>
            <Text style={estilos.paradaHora}>06:30</Text>
          </View>
          <View style={[estilos.parada, { paddingBottom: 0 }]}>
            <View style={estilos.puntoFinal} />
            <View style={{ flex: 1 }}>
              <Text style={estilos.paradaNombre}>Chitré · Parque Unión</Text>
              <Text style={estilos.paradaDetalle}>Frente a la iglesia</Text>
            </View>
            <Text style={estilos.paradaHora}>09:50</Text>
          </View>
        </View>
      </View>

      <View style={estilos.velo} pointerEvents="none" />

      <View style={estilos.hojaModal}>
        <View style={estilos.asa} />

        <View>
          <Epigrafe>Solo para pedir el puesto</Epigrafe>
          <Text style={estilos.titulo}>
            {'Tus viajes viven en'}
            {'\n'}
            <Text style={estilos.tituloFuerte}>tu cuenta</Text>
          </Text>
          <Text style={estilos.explicacion}>
            Te pedimos el correo una vez. Con eso te avisamos cuando Andrés acepte y te guardamos
            el código de abordaje.
          </Text>
        </View>

        <Campo
          etiqueta="Correo"
          valor={correo}
          alEscribir={setCorreo}
          marcador="tu@correo.com"
          correo
        />

        <View style={{ gap: 10 }}>
          <Boton
            desactivado={!listo}
            alPulsar={() =>
              router.push({ pathname: '/(cuenta)/registro', params: { correo, viaje, paso: '2' } })
            }
          >
            Pedir el puesto
          </Boton>
          <View style={estilos.filaPromesa}>
            <Escudo tamano={15} tinta={color.ink500} />
            <Text style={estilos.promesa}>Una vez, y ya. Nada de anuncios ni llamadas.</Text>
          </View>
        </View>

        <View style={estilos.otrasEntradas}>
          <Pressable accessibilityRole="button" style={estilos.botonQuieto}>
            <Text style={estilos.botonQuietoTexto}>Google</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={estilos.botonQuieto}>
            <Text style={estilos.botonQuietoTexto}>Apple</Text>
          </Pressable>
        </View>
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

  cabecera: { paddingHorizontal: espacio.gutter },
  epigrafeCampo: {
    fontSize: 11, lineHeight: 15.95,
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.campoTexto,
    fontFamily: familia,
  },
  titular: {
    fontSize: 27,
    lineHeight: 29.7,
    letterSpacing: -1.08,
    fontWeight: '400',
    color: '#fff',
    marginTop: 10,
    fontFamily: familia,
  },
  titularFuerte: { fontWeight: '600' },

  detras: { paddingHorizontal: 22, paddingTop: 26 },
  tarjetaDetras: {
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderRadius: radio.l,
    padding: 20,
  },
  parada: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', paddingBottom: 16.2 },
  puntoLleno: {
    width: 10,
    height: 10,
    borderRadius: radio.pastilla,
    backgroundColor: color.rojo500,
    marginTop: 5,
  },
  puntoFinal: {
    width: 10,
    height: 10,
    borderRadius: radio.pastilla,
    backgroundColor: color.blanco,
    borderWidth: 2,
    borderColor: color.ink200,
    marginTop: 5,
  },
  paradaNombre: { fontSize: 16, lineHeight: 23.2, letterSpacing: -0.29, color: color.ink900, fontFamily: familia },
  paradaDetalle: { fontSize: 13, lineHeight: 18.85, color: color.ink500, marginTop: 3, fontFamily: familia },
  paradaHora: { fontSize: 13.5, lineHeight: 19.57, color: color.ink600, fontFamily: familia, ...tabular },

  velo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(38,35,43,.48)' },

  hojaModal: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: color.blanco,
    borderTopLeftRadius: radio.hoja,
    borderTopRightRadius: radio.hoja,
    paddingHorizontal: espacio.gutter,
    paddingTop: 16,
    paddingBottom: 30,
    gap: 18,
    shadowColor: '#26232B',
    shadowOpacity: 0.18,
    shadowRadius: 48,
    shadowOffset: { width: 0, height: -16 },
    elevation: 12,
  },
  asa: { width: 38, height: 4, borderRadius: radio.pastilla, backgroundColor: color.ink200, alignSelf: 'center' },
  titulo: {
    fontSize: 24,
    lineHeight: 28.8,
    letterSpacing: -0.84,
    fontWeight: '400',
    marginTop: 10,
    color: color.ink900,
    fontFamily: familia,
  },
  tituloFuerte: { fontWeight: '600' },
  explicacion: { fontSize: 14.5, lineHeight: 21, color: color.ink600, marginTop: 12, fontFamily: familia },

  filaTelefono: { flexDirection: 'row', gap: 9 },
  prefijo: {
    width: 96,
    height: 56,
    borderWidth: 1.5,
    borderColor: color.bordePorDefecto,
    borderRadius: radio.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefijoTexto: { fontSize: 16, lineHeight: 23.2, fontWeight: '500', color: color.ink700, fontFamily: familia },
  campoTelefono: {
    flex: 1,
    height: 56,
    borderWidth: 1.5,
    borderColor: color.bordePorDefecto,
    borderRadius: radio.control,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  entradaTelefono: {
    fontSize: 17, lineHeight: 24.65,
    fontWeight: '500',
    letterSpacing: -0.17,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
    outlineStyle: 'none',
  } as never,

  filaPromesa: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center' },
  promesa: { fontSize: 12.5, lineHeight: 18.12, color: color.ink500, fontFamily: familia },

  otrasEntradas: {
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
    paddingTop: 16,
    flexDirection: 'row',
    gap: 9,
  },
  botonQuieto: {
    flex: 1,
    height: 40,
    borderRadius: radio.pastilla,
    backgroundColor: color.sand200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonQuietoTexto: { fontSize: 14, lineHeight: 20.3, fontWeight: '600', letterSpacing: -0.14, color: color.ink900, fontFamily: familia },
});
