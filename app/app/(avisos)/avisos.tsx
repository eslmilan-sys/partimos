/**
 * `11b` Bandeja de avisos.
 *
 * Dos bloques, y el orden es el argumento: **lo que pide acción va anclado
 * arriba**, en hoja blanca que monta sobre el campo rojo, porque ahí la acción
 * viaja dentro del propio aviso —aceptar o calificar sin ir a buscar la
 * pantalla— y eso es lo que separa esto de una notificación cualquiera. Lo
 * informativo baja a una tarjeta con borde, sin botón: se lee y ya.
 *
 * El punto de cada fila **es** el «sin leer»: por eso tocar la fila lo apaga y
 * el contador de la cabecera va detrás, nunca al revés. Arriba el punto es rojo
 * y va en el epígrafe, no en cada fila, porque la sección entera es la que
 * reclama; abajo es azul y va por fila, porque ahí lo que se cuenta es cada
 * aviso.
 *
 * La línea del pie no es relleno: es la promesa que hace aceptable pedir el
 * permiso de `16d`. Si no es tu viaje, no escribimos.
 */

import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { type Href, useRouter } from 'expo-router';

import { type Aviso, type Bandeja, bandeja, marcarLeido, marcarTodo } from '@/servicios/avisos';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { CampoRojo } from '@/ui/CampoRojo';
import { tabular } from '@/ui/dinero';
import { Atras } from '@/ui/iconos';
import { TRACK_MICRO, color, espacio, familia, radio } from '@/ui/tokens';

/** Daniela, la pasajera del simulado. Mientras no haya sesión, esta es la convención. */
const PERFIL = '99999999-9999-4999-8999-999999999999';

export default function Avisos() {
  const router = useRouter();
  const [datos, setDatos] = useState<Bandeja | null>(null);

  const cargar = useCallback(() => {
    bandeja(PERFIL).then(setDatos);
  }, []);

  useEffect(cargar, [cargar]);

  if (!datos) return <View style={estilos.pantalla} />;

  const abrir = async (aviso: Aviso) => {
    await marcarLeido(aviso.id);
    cargar();
    if (aviso.accion) router.push(aviso.accion.ruta as Href);
  };

  const leerTodo = async () => {
    await marcarTodo(PERFIL);
    cargar();
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
          <Text style={estilos.epigrafeCampo}>
            {datos.sinLeer > 0 ? `${datos.sinLeer} sin leer` : 'Todo leído'}
          </Text>
        </View>
        <Text style={estilos.titular}>
          {'Tus '}
          <Text style={estilos.titularFuerte}>avisos</Text>
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 22 }}
        showsVerticalScrollIndicator={false}
      >
        {datos.pideAccion.length > 0 ? (
          <View style={estilos.hoja}>
            <View style={estilos.filaSeccion}>
              <Text style={estilos.epigrafeRojo}>Pide acción</Text>
              <View style={estilos.puntoSeccion} />
            </View>

            {datos.pideAccion.map((aviso) => (
              <View key={aviso.id} style={estilos.filaAccion}>
                <View style={estilos.textoFila}>
                  <Text style={estilos.tituloAccion} numberOfLines={1}>
                    {aviso.titulo}
                  </Text>
                  <Text style={estilos.detalleAccion} numberOfLines={1}>
                    {aviso.detalle}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${aviso.accion?.etiqueta}. ${aviso.titulo}`}
                  onPress={() => abrir(aviso)}
                  style={estilos.boton}
                >
                  <Text style={estilos.botonTexto}>{aviso.accion?.etiqueta}</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        {datos.paraSaber.length > 0 ? (
          <View style={estilos.tarjeta}>
            <View style={estilos.filaSeccionSaber}>
              <Text style={estilos.epigrafeAzul}>Solo para saber</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Marcar todo leído"
                onPress={leerTodo}
              >
                <Text style={estilos.marcarLeido}>Marcar leído</Text>
              </Pressable>
            </View>

            {datos.paraSaber.map((aviso) => (
              <Pressable
                key={aviso.id}
                accessibilityRole="button"
                accessibilityLabel={`${aviso.titulo}. ${aviso.detalle}${aviso.leido ? '' : '. Sin leer'}`}
                accessibilityState={{ selected: !aviso.leido }}
                onPress={() => abrir(aviso)}
                style={estilos.filaSaber}
              >
                {/* El punto ocupa su sitio aunque esté leído: la fila no se mueve al tocarla. */}
                <View style={[estilos.punto, aviso.leido ? estilos.puntoApagado : null]} />
                <View style={estilos.textoFila}>
                  <Text style={estilos.tituloSaber} numberOfLines={1}>
                    {aviso.titulo}
                  </Text>
                  <Text style={estilos.detalleSaber} numberOfLines={1}>
                    {aviso.detalle}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        <Text style={estilos.promesa}>Solo te escribimos por tus viajes. Nunca promociones.</Text>
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

  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 6 },
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
    fontSize: 33,
    lineHeight: 34.65,
    letterSpacing: -1.32,
    fontWeight: '400',
    color: '#fff',
    marginTop: 12,
    fontFamily: familia,
  },
  titularFuerte: { fontWeight: '600' },

  hoja: {
    marginHorizontal: 22,
    marginTop: 22,
    backgroundColor: color.blanco,
    borderRadius: 28,
    padding: 20,
    shadowColor: 'rgb(120,10,30)',
    shadowOpacity: 0.28,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
    elevation: 6,
  },
  filaSeccion: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 4 },
  epigrafeRojo: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15.95,
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.rojo600,
    fontFamily: familia,
  },
  puntoSeccion: { width: 7, height: 7, borderRadius: radio.pastilla, backgroundColor: color.rojo500 },

  filaAccion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  textoFila: { flex: 1, minWidth: 0 },
  tituloAccion: {
    fontSize: 15,
    lineHeight: 21.75,
    fontWeight: '500',
    letterSpacing: -0.27,
    color: color.ink900,
    fontFamily: familia,
  },
  detalleAccion: {
    fontSize: 12.5,
    lineHeight: 18.125,
    color: color.ink600,
    marginTop: 2,
    fontFamily: familia,
    ...tabular,
  },
  boton: {
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: radio.pastilla,
    backgroundColor: color.rojo500,
  },
  botonTexto: {
    fontSize: 12.5,
    lineHeight: 18.125,
    fontWeight: '600',
    color: '#fff',
    fontFamily: familia,
  },

  tarjeta: {
    marginHorizontal: 22,
    marginTop: 11,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderRadius: radio.l,
    padding: 20,
  },
  /**
   * El epígrafe de 11 px y «Marcar leído» de 12 px comparten línea base: un
   * píxel de desnivel. Va a mano porque `alignItems: 'baseline'` mide desde la
   * caja de línea, no desde la letra, y deja el epígrafe un píxel más abajo.
   */
  filaSeccionSaber: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginBottom: 4 },
  epigrafeAzul: {
    flex: 1,
    marginTop: 1,
    fontSize: 11,
    lineHeight: 15.95,
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.azul500,
    fontFamily: familia,
  },
  marcarLeido: {
    fontSize: 12,
    lineHeight: 17.4,
    fontWeight: '600',
    color: color.azul700,
    fontFamily: familia,
  },

  filaSaber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  punto: { width: 7, height: 7, borderRadius: radio.pastilla, backgroundColor: color.azul500 },
  puntoApagado: { backgroundColor: 'transparent' },
  tituloSaber: {
    fontSize: 14.5,
    lineHeight: 21.025,
    fontWeight: '600',
    letterSpacing: -0.2175,
    color: color.ink900,
    fontFamily: familia,
  },
  detalleSaber: {
    fontSize: 12.5,
    lineHeight: 18.125,
    color: color.ink500,
    marginTop: 1,
    fontFamily: familia,
    ...tabular,
  },

  promesa: {
    marginHorizontal: 22,
    marginTop: 11,
    fontSize: 12.5,
    lineHeight: 18.75,
    color: color.ink500,
    fontFamily: familia,
  },
});
