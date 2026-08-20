/**
 * `11b` Bandeja de avisos — la pantalla roja entera.
 *
 * **Por qué el campo ocupa toda la pantalla y no una franja.** En el resto de
 * la app el rojo es la cabecera de algo que se lee debajo, en arena. Aquí no
 * hay «debajo»: la bandeja ES la pantalla. Dejarla en arena con una franja
 * roja arriba la hacía parecer una lista más; en rojo entero se reconoce de
 * un vistazo y las tarjetas blancas flotan sobre ella con contraste real.
 *
 * El orden es el argumento: **lo que pide acción va arriba**, porque ahí la
 * acción viaja dentro del propio aviso —aceptar o calificar sin ir a buscar
 * la pantalla— y eso es lo que separa esto de una notificación cualquiera.
 *
 * El punto de cada fila **es** el «sin leer»: tocar la fila lo apaga y el
 * contador de la cabecera va detrás, nunca al revés.
 *
 * Y cuando no hay nada, no se enseña una línea de texto en medio del vacío:
 * se enseña **un aviso de ejemplo**, apagado y rotulado como tal, para que se
 * entienda qué va a llegar aquí y por qué vale la pena dar el permiso.
 */

import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { type Href, useRouter } from 'expo-router';

import { useVolver } from '@/ui/salidas';

import { type Aviso, type Bandeja, bandeja, marcarLeido, marcarTodo } from '@/servicios/avisos';
import { useMiIdOEntrar } from '@/servicios/sesion';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { CampoRojo } from '@/ui/CampoRojo';
import { Pestanas } from '@/ui/Pestanas';
import { tabular } from '@/ui/dinero';
import { Atras, Avanza, Billete, Carro, Escudo, Estrella, Visto } from '@/ui/iconos';
import { TRACK_MICRO, color, espacio, familia, radio } from '@/ui/tokens';

/** Daniela, la pasajera del simulado. Mientras no haya sesión, esta es la convención. */
const DEL_RECORRIDO = '99999999-9999-4999-8999-999999999999';

/** El dibujo de cada clase de aviso. Un aviso sin cara es una línea de texto. */
function iconoDe(titulo: string) {
  const t = titulo.toLowerCase();
  if (t.includes('aport') || t.includes('$')) return <Billete tamano={19} tinta={color.azul700} />;
  if (t.includes('califica')) return <Estrella tamano={17} tinta={color.oro500} />;
  if (t.includes('no puede') || t.includes('cancel'))
    return <Escudo tamano={19} tinta={color.rojo600} />;
  if (t.includes('pidió') || t.includes('aceptó')) return <Carro tamano={19} tinta={color.azul700} />;
  return <Visto tamano={17} tinta={color.azul700} />;
}

export default function Avisos() {
  const router = useRouter();
  const volver = useVolver();
  /* El campo mide lo que mide la ventana: así la silueta de la ciudad cae al
     pie de la pantalla y no a mil pixeles por debajo. */
  const { height: alto } = useWindowDimensions();
  const yo = useMiIdOEntrar(DEL_RECORRIDO);
  const [datos, setDatos] = useState<Bandeja | null>(null);

  const cargar = useCallback(() => {
    if (yo) bandeja(yo).then(setDatos);
  }, [yo]);

  useEffect(cargar, [cargar]);

  if (!datos) return <Cargando />;

  const abrir = async (aviso: Aviso) => {
    await marcarLeido(aviso.id);
    cargar();
    if (aviso.accion) router.push(aviso.accion.ruta as Href);
  };

  const vacia = datos.pideAccion.length === 0 && datos.paraSaber.length === 0;

  return (
    <View style={estilos.pantalla}>
      {/* El campo, de arriba abajo, con la silueta de la ciudad al pie. */}
      <View style={estilos.fondo} pointerEvents="none">
        <CampoRojo altura={Math.max(alto, 700)} motivo="tornillo" />
      </View>

      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <View style={estilos.filaEpigrafe}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atrás"
            onPress={() => volver()}
            style={estilos.circulo}
          >
            <Atras />
          </Pressable>
          <Text style={estilos.epigrafeCampo}>
            {datos.sinLeer > 0 ? `${datos.sinLeer} sin leer` : 'Todo leído'}
          </Text>
          {datos.sinLeer > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Marcar todo leído"
              onPress={async () => {
                if (!yo) return;
                await marcarTodo(yo);
                cargar();
              }}
              style={estilos.marcar}
            >
              <Text style={estilos.marcarTexto}>Marcar leído</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={estilos.titular}>
          {'Tus '}
          <Text style={estilos.titularFuerte}>avisos</Text>
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={estilos.cuerpo}
        showsVerticalScrollIndicator={false}
      >
        {datos.pideAccion.length > 0 ? (
          <>
            <View style={estilos.filaSeccion}>
              <Text style={estilos.seccion}>Pide acción</Text>
              <View style={estilos.puntoSeccion} />
            </View>

            {datos.pideAccion.map((aviso) => (
              <View key={aviso.id} style={[estilos.tarjeta, estilos.tarjetaAccion]}>
                <View style={estilos.filaTarjeta}>
                  <View style={estilos.cuadroIcono}>{iconoDe(aviso.titulo)}</View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={estilos.titulo} numberOfLines={2}>
                      {aviso.titulo}
                    </Text>
                    <Text style={estilos.detalle} numberOfLines={1}>
                      {aviso.detalle}
                    </Text>
                  </View>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${aviso.accion?.etiqueta}. ${aviso.titulo}`}
                  onPress={() => abrir(aviso)}
                  style={({ pressed }) => [
                    estilos.boton,
                    { backgroundColor: pressed ? color.rojo600 : color.rojo500 },
                  ]}
                >
                  <Text style={estilos.botonTexto}>{aviso.accion?.etiqueta}</Text>
                  <Avanza tamano={16} tinta="#fff" />
                </Pressable>
              </View>
            ))}
          </>
        ) : null}

        {datos.paraSaber.length > 0 ? (
          <>
            <View style={[estilos.filaSeccion, { marginTop: datos.pideAccion.length ? 22 : 0 }]}>
              <Text style={estilos.seccion}>Solo para saber</Text>
            </View>

            {datos.paraSaber.map((aviso) => (
              <Pressable
                key={aviso.id}
                accessibilityRole="button"
                accessibilityLabel={`${aviso.titulo}. ${aviso.detalle}${aviso.leido ? '' : '. Sin leer'}`}
                onPress={() => abrir(aviso)}
                style={({ pressed }) => [estilos.tarjeta, pressed && { backgroundColor: color.sand100 }]}
              >
                <View style={estilos.filaTarjeta}>
                  <View style={estilos.cuadroIcono}>{iconoDe(aviso.titulo)}</View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={estilos.titulo} numberOfLines={2}>
                      {aviso.titulo}
                    </Text>
                    <Text style={estilos.detalle} numberOfLines={1}>
                      {aviso.detalle}
                    </Text>
                  </View>
                  {/* El punto ocupa su sitio aunque esté leído: la fila no se
                      mueve al tocarla. */}
                  <View style={[estilos.punto, aviso.leido && estilos.puntoApagado]} />
                </View>
              </Pressable>
            ))}
          </>
        ) : null}

        {vacia ? (
          <>
            <View style={estilos.filaSeccion}>
              <Text style={estilos.seccion}>Así se ve un aviso</Text>
            </View>

            {/* El ejemplo. Apagado y rotulado, para que no se confunda con uno
                de verdad, y con la forma exacta que tendrá el que llegue. */}
            <View style={[estilos.tarjeta, estilos.ejemplo]}>
              <View style={estilos.filaTarjeta}>
                <View style={estilos.cuadroIcono}>
                  <Carro tamano={19} tinta={color.azul700} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={estilos.titulo}>Andrés aceptó tu puesto</Text>
                  <Text style={estilos.detalle}>06:30 · Albrook → Chitré</Text>
                </View>
              </View>
              <View style={estilos.rotuloEjemplo}>
                <Text style={estilos.rotuloEjemploTexto}>Ejemplo</Text>
              </View>
            </View>

            <View style={estilos.tarjetaVacia}>
              <Text style={estilos.vacioTitulo}>Todavía no hay nada que contarte.</Text>
              <Text style={estilos.vacioTexto}>
                Aquí llegan tres cosas y ninguna más: cuando alguien acepta tu puesto, cuando te
                piden uno de los tuyos, y cuando te aportan. Nunca promociones.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/(pasajero)')}
                style={({ pressed }) => [
                  estilos.botonVacio,
                  { backgroundColor: pressed ? color.rojo600 : color.rojo500 },
                ]}
              >
                <Text style={estilos.botonTexto}>Buscar un viaje</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <Text style={estilos.promesa}>
            Solo te escribimos por tus viajes. Nunca promociones.
          </Text>
        )}
      </ScrollView>

      <Pestanas valor="Perfil" />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: color.rojo600,
    maxWidth: espacio.marco,
    width: '100%',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  fondo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

  cabecera: { paddingHorizontal: espacio.gutter },
  filaEpigrafe: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  epigrafeCampo: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17.4,
    fontWeight: '600',
    letterSpacing: 12 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.campoTexto,
    fontFamily: familia,
  },
  marcar: { paddingVertical: 12, paddingLeft: 12 },
  marcarTexto: {
    fontSize: 13,
    lineHeight: 18.85,
    fontWeight: '600',
    color: '#fff',
    fontFamily: familia,
  },
  titular: {
    fontSize: 34,
    lineHeight: 36,
    letterSpacing: -1.53,
    fontWeight: '400',
    color: '#fff',
    marginTop: 14,
    fontFamily: familia,
  },
  titularFuerte: { fontWeight: '600' },

  cuerpo: { paddingHorizontal: espacio.gutter, paddingTop: 26, paddingBottom: 24, gap: 10 },

  filaSeccion: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  seccion: {
    fontSize: 12,
    lineHeight: 17.4,
    fontWeight: '600',
    letterSpacing: 12 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: '#fff',
    fontFamily: familia,
  },
  puntoSeccion: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },

  tarjeta: {
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    padding: 16,
    /* Sombra propia: la tarjeta flota sobre el campo, no se apoya en él. */
    shadowColor: '#5E0717',
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  tarjetaAccion: { gap: 14 },
  filaTarjeta: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  cuadroIcono: {
    width: 42,
    height: 42,
    borderRadius: radio.control,
    backgroundColor: color.azul50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontSize: 15.5,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.23,
    color: color.ink900,
    fontFamily: familia,
  },
  detalle: {
    fontSize: 13,
    lineHeight: 19,
    color: color.ink600,
    marginTop: 2,
    fontFamily: familia,
    ...tabular,
  },
  punto: { width: 9, height: 9, borderRadius: 5, backgroundColor: color.rojo500 },
  puntoApagado: { backgroundColor: 'transparent' },

  boton: {
    height: 46,
    borderRadius: radio.pastilla,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  botonTexto: {
    fontSize: 15,
    lineHeight: 21.75,
    fontWeight: '600',
    letterSpacing: -0.15,
    color: '#fff',
    fontFamily: familia,
  },

  ejemplo: { opacity: 0.72, gap: 12 },
  rotuloEjemplo: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radio.pastilla,
    backgroundColor: color.sand200,
  },
  rotuloEjemploTexto: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.ink600,
    fontFamily: familia,
  },

  tarjetaVacia: {
    marginTop: 4,
    padding: 18,
    borderRadius: radio.l,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,.34)',
    gap: 12,
  },
  vacioTitulo: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: -0.34,
    color: '#fff',
    fontFamily: familia,
  },
  vacioTexto: { fontSize: 13.5, lineHeight: 20, color: color.campoTexto, fontFamily: familia },
  botonVacio: {
    height: 48,
    borderRadius: radio.pastilla,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  promesa: {
    fontSize: 12.5,
    lineHeight: 19,
    color: color.campoTexto,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: familia,
  },
});
