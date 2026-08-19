/**
 * `1a` Bienvenida — tres salidas ofrecidas sin cuenta.
 *
 * Es la promesa entera del recorrido del pasajero en una pantalla: hay gente
 * saliendo ahora, con hora y con aporte, y para verlo no hace falta
 * registrarse. La puerta de la cuenta está más adelante, en `1c`, cuando ya se
 * sabe qué se gana al cruzarla.
 *
 * Por eso el único botón fuerte busca viajes, y «Ya tengo cuenta» va abajo, en
 * letra pequeña.
 */

import { useEffect, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { type SalidaCercana, proximasSalidas } from '@/servicios/viajes';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { CampoRojo } from '@/ui/CampoRojo';
import { Boton, Epigrafe } from '@/ui/controles';
import { formatearDineroRedondo, tabular } from '@/ui/dinero';
import { diaLargo, hora } from '@/ui/fechas';
import { useReloj } from '@/ui/reloj';
import { Marca } from '@/ui/iconos';
import { TRACK_MICRO, familia, color, espacio, interlinea, radio } from '@/ui/tokens';

/** Cada destino del producto necesita su fotografía; éstas son las que hay. */
const FOTOS: Record<string, number> = {
  chitre: require('../../assets/chitre.jpeg'),
  coronado: require('../../assets/playa-blanca.jpeg'),
  david: require('../../assets/david.jpeg'),
  santiago: require('../../assets/boquete.jpeg'),
  'la-chorrera': require('../../assets/chorrera.jpeg'),
  'las-tablas': require('../../assets/venao.webp'),
};

export default function Bienvenida() {
  const router = useRouter();
  const [salidas, setSalidas] = useState<SalidaCercana[]>([]);
  const hoy = useReloj();

  useEffect(() => {
    proximasSalidas(3).then(setSalidas);
  }, []);

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={530} motivo="palmera" />
      <BarraDeEstado />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={estilos.desplaza}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.cabecera}>
          <View style={estilos.filaMarca}>
            {/* Panamá es el único mercado del producto: va como copia, no como dato. */}
            <Text style={estilos.epigrafeCampo}>{`Panamá · ${diaLargo(hoy)}`}</Text>
            <Marca tamano={26} />
          </View>

          <Text style={estilos.titular}>
            {'Alguien ya va'}
            {'\n'}
            <Text style={estilos.titularFuerte}>para allá</Text>
          </Text>

          <Text style={estilos.entrada}>
            Carro compartido entre la ciudad y el interior. Te recogen cerca y le aportas directo al
            conductor.
          </Text>
        </View>

        <View style={estilos.cuerpo}>
          <View style={estilos.hoja}>
            <Epigrafe>¿A dónde vas?</Epigrafe>

            <View style={estilos.destinos}>
              <Pressable accessibilityRole="button" style={estilos.filaDestino}>
                <View style={estilos.puntoLleno} />
                <Text style={estilos.destinoTexto}>Ciudad de Panamá</Text>
                <Text style={estilos.destinoPista}>Albrook</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                style={[estilos.filaDestino, estilos.filaSegunda]}
                onPress={() => router.push('/(pasajero)/resultados')}
              >
                <View style={estilos.puntoVacio} />
                <Text style={[estilos.destinoTexto, { color: color.ink400 }]}>
                  Chitré, David, Santiago…
                </Text>
              </Pressable>
            </View>

            <View style={{ marginTop: 18 }}>
              {/* Dentro de la hoja la acción es azul: rojo sobre rojo no se lee. */}
              <Boton tono="azul" alPulsar={() => router.push('/(pasajero)/resultados')}>
                Buscar un viaje
              </Boton>
            </View>
          </View>
        </View>

        <View style={estilos.seccion}>
          <View style={estilos.filaEpigrafe}>
            <Text style={estilos.epigrafeRojo}>Salen en la próxima hora</Text>
            <View style={estilos.puntoVivo} />
          </View>

          <View style={estilos.tarjetas}>
            {salidas.slice(0, 2).map((s) => (
              <Pressable
                key={s.viajeId}
                accessibilityRole="button"
                accessibilityLabel={`${s.destino} a las ${hora(s.hora)}`}
                onPress={() => router.push('/(pasajero)/viaje')}
                style={estilos.tarjeta}
              >
                <View style={estilos.banda}>
                  {FOTOS[s.foto] ? (
                    <Image source={FOTOS[s.foto]} style={estilos.foto} resizeMode="cover" />
                  ) : null}
                </View>
                <View style={estilos.pieTarjeta}>
                  <Text style={estilos.horaSalida}>{hora(s.hora)}</Text>
                  <Text style={estilos.destinoSalida}>
                    {`${s.destino} · ${formatearDineroRedondo(s.aporteCentavos)}`}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={estilos.pie}>
          <Boton tono="contorno" tamano="md" alPulsar={() => router.push('/(conductor)/publicar')}>
            Voy conduciendo
          </Boton>
          <Pressable accessibilityRole="button" onPress={() => router.push('/(cuenta)/entrar')}>
            <Text style={estilos.yaTengo}>
              {'Ya tengo cuenta · '}
              <Text style={estilos.entrar}>Entrar</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
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

  desplaza: { paddingBottom: 0 },

  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 14 },
  filaMarca: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  epigrafeCampo: {
    fontSize: 11,
    lineHeight: interlinea(11),
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.campoTexto,
    fontFamily: familia,
  },
  titular: {
    fontSize: 46,
    lineHeight: 46,
    letterSpacing: -2.07,
    fontWeight: '400',
    color: '#fff',
    marginTop: 22,
    fontFamily: familia,
  },
  titularFuerte: { fontWeight: '600' },
  entrada: {
    fontSize: 15,
    lineHeight: interlinea(15),
    letterSpacing: -0.12,
    color: color.campoTexto,
    marginTop: 16,
    maxWidth: 280,
    fontFamily: familia,
  },

  cuerpo: { paddingHorizontal: 22, paddingTop: 38 },
  hoja: {
    backgroundColor: color.blanco,
    borderRadius: 28,
    padding: 22,
    shadowColor: 'rgb(120,10,30)',
    shadowOpacity: 0.28,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
    elevation: 6,
  },

  destinos: { gap: 2, marginTop: 14 },
  filaDestino: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 11 },
  filaSegunda: { borderTopWidth: 1, borderTopColor: color.bordeSutil },
  puntoLleno: { width: 10, height: 10, borderRadius: 999, backgroundColor: color.rojo500 },
  // El destino todavía sin elegir es un aro, no un punto: no hay nada dentro.
  puntoVacio: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: color.blanco,
    borderWidth: 2,
    borderColor: color.ink200,
  },
  destinoTexto: {
    flex: 1,
    fontSize: 17,
    lineHeight: interlinea(17),
    letterSpacing: -0.34,
    color: color.ink900,
    fontFamily: familia,
  },
  destinoPista: {
    fontSize: 13,
    lineHeight: 18.85,
    color: color.ink400,
    fontFamily: familia,
  },

  seccion: { paddingHorizontal: espacio.gutter, paddingTop: 26 },
  filaEpigrafe: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  epigrafeRojo: {
    fontSize: 11,
    lineHeight: interlinea(11),
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.rojo600,
    fontFamily: familia,
  },
  puntoVivo: { width: 7, height: 7, borderRadius: 999, backgroundColor: color.rojo500 },

  tarjetas: { flexDirection: 'row', gap: 10, marginTop: 12 },
  tarjeta: {
    flex: 1,
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    overflow: 'hidden',
  },
  banda: { height: 64, backgroundColor: color.sand200 },
  foto: { width: '100%', height: '100%' },
  pieTarjeta: { paddingTop: 12, paddingHorizontal: 15, paddingBottom: 14 },
  horaSalida: {
    fontSize: 22,
    lineHeight: 31.9,
    fontWeight: '600',
    letterSpacing: -0.77,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  destinoSalida: {
    fontSize: 13,
    lineHeight: 18.85,
    marginTop: 3,
    color: color.ink600,
    fontFamily: familia,
    ...tabular,
  },

  pie: { paddingHorizontal: espacio.gutter, paddingTop: 0, paddingBottom: 30, gap: 14 },
  yaTengo: {
    textAlign: 'center',
    fontSize: 13.5,
    lineHeight: interlinea(13.5),
    color: color.ink600,
    fontFamily: familia,
  },
  entrar: { fontWeight: '600', color: color.rojo600 },
});
