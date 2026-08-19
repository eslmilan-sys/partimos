/**
 * `10a` Panel del conductor — sus viajes publicados.
 *
 * Lo único de esta pantalla con reloj corriendo son las solicitudes sin
 * responder, y por eso van **ancladas dentro del viaje de hoy, en rojo y con
 * su caducidad escrita**: no responder en 4 h no es una notificación perdida,
 * es un puesto que se cae.
 *
 * El resto es deliberadamente tranquilo. Un viaje sin nadie todavía no es un
 * problema que resolver: es un viaje al que le queda tiempo, y lo que ofrece
 * es compartirlo, no un aviso.
 */

import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';

import { type ViajePublicado, viajesPublicados } from '@/servicios/panel';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { BarraDePestanas } from '@/ui/BarraDePestanas';
import { CampoRojo } from '@/ui/CampoRojo';
import { Pastilla } from '@/ui/controles';
import { formatearDineroRedondo, tabular } from '@/ui/dinero';
import { cuando, diaAbrev, hora } from '@/ui/fechas';
import { Carro, Chat, Lupa, Mas, Persona } from '@/ui/iconos';
import { TRACK_MICRO, familia, color, espacio, interlinea, radio } from '@/ui/tokens';

/** Mientras no haya sesión, el conductor del recorrido del diseño. */
const CONDUCTOR = '11111111-1111-4111-8111-111111111111';

export default function Panel() {
  const router = useRouter();
  const [viajes, setViajes] = useState<ViajePublicado[]>([]);

  useEffect(() => {
    viajesPublicados(CONDUCTOR).then(setViajes);
  }, []);

  const [hoy, ...resto] = viajes;

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={214} />
      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <Text style={estilos.epigrafeCampo}>Conductor · Andrés C.</Text>
        <Text style={estilos.titular}>
          {'Tus viajes '}
          <Text style={estilos.titularFuerte}>publicados</Text>
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={estilos.cuerpo}
        showsVerticalScrollIndicator={false}
      >
        {hoy ? <Hoy viaje={hoy} router={router} /> : null}

        {resto.map((v) => (
          <Proximo key={v.id} viaje={v} router={router} />
        ))}

        <Text style={estilos.pieTexto}>Puedes editar un viaje mientras nadie haya pagado.</Text>
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Publicar un viaje"
        onPress={() => router.push('/(conductor)/publicar')}
        style={estilos.fab}
      >
        <Mas tamano={24} tinta="#fff" />
      </Pressable>

      <View style={estilos.pie}>
        <BarraDePestanas
          valor="Mis viajes"
          pestanas={[
            { valor: 'Buscar', etiqueta: 'Buscar', icono: (a) => <Lupa tinta={tinta(a)} /> },
            { valor: 'Mis viajes', etiqueta: 'Mis viajes', icono: (a) => <Carro tamano={21} tinta={tinta(a)} /> },
            { valor: 'Mensajes', etiqueta: 'Mensajes', icono: (a) => <Chat tinta={tinta(a)} /> },
            { valor: 'Perfil', etiqueta: 'Perfil', icono: (a) => <Persona tinta={tinta(a)} /> },
          ]}
        />
      </View>
    </View>
  );
}

const tinta = (activo: boolean) => (activo ? color.rojo600 : color.ink700);

type Router = ReturnType<typeof useRouter>;

/** El viaje de hoy va en hoja blanca sobre el campo: es el que manda. */
function Hoy({ viaje, router }: { viaje: ViajePublicado; router: Router }) {
  return (
    <View style={estilos.hoja}>
      <View style={estilos.filaEpigrafe}>
        <Text style={estilos.epigrafeVivo}>{cuando(viaje.cuando)}</Text>
        <View style={estilos.puntoVivo} />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(conductor)/editar')}
          style={{ marginLeft: 'auto' }}
        >
          <Text style={estilos.enlace}>Editar</Text>
        </Pressable>
      </View>

      <Recorrido viaje={viaje} />

      <View style={estilos.filaVendidos}>
        <Text style={estilos.vendidos}>
          {`${viaje.puestosVendidos} de ${viaje.puestosOfrecidos} puestos vendidos`}
        </Text>
        <Pastilla tamano="m">{viaje.maletas}</Pastilla>
      </View>

      {viaje.solicitudes > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${viaje.solicitudes} solicitudes nuevas`}
          onPress={() => router.push('/(conductor)/solicitudes')}
          style={estilos.solicitudes}
        >
          <View style={estilos.contador}>
            <Text style={estilos.contadorTexto}>{viaje.solicitudes}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={estilos.solicitudesTitulo}>Solicitudes nuevas</Text>
            <Text style={estilos.solicitudesPie}>Se les cobra al aceptar · expiran en 4 h</Text>
          </View>
          <Galon />
        </Pressable>
      ) : null}
    </View>
  );
}

/** Los demás van en tarjeta normal, sobre la arena. */
function Proximo({ viaje, router }: { viaje: ViajePublicado; router: Router }) {
  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.filaEpigrafe}>
        <Text style={estilos.epigrafeAzul}>
          {`${diaAbrev(viaje.cuando)} ${diaNumero(viaje.cuando)} · ${hora(viaje.cuando)}`}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(conductor)/editar')}
          style={{ marginLeft: 'auto' }}
        >
          <Text style={estilos.enlace}>Editar</Text>
        </Pressable>
      </View>

      <View style={estilos.filaRutaSuelta}>
        <View style={estilos.puntoAzul} />
        <Text style={estilos.parada}>{`${viaje.origen} → ${viaje.destino}`}</Text>
        <Text style={estilos.horaParada}>{formatearDineroRedondo(viaje.aporteCentavos)}</Text>
      </View>

      <View style={estilos.filaVendidos}>
        <Text style={estilos.nadie}>
          {viaje.puestosVendidos === 0
            ? 'Nadie todavía'
            : `${viaje.puestosVendidos} de ${viaje.puestosOfrecidos} puestos vendidos`}
        </Text>
        <Pressable accessibilityRole="button" style={{ marginLeft: 'auto' }}>
          <Text style={estilos.enlace}>Compartir el viaje</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Recorrido({ viaje }: { viaje: ViajePublicado }) {
  return (
    <View style={estilos.recorrido}>
      <View style={estilos.filaRuta}>
        <View style={estilos.puntoLleno} />
        <Text style={estilos.parada}>{viaje.origen}</Text>
        <Text style={estilos.horaParada}>{hora(viaje.horaSalida)}</Text>
      </View>
      <View style={estilos.filaRuta}>
        <View style={estilos.puntoVacio} />
        <Text style={estilos.parada}>{viaje.destino}</Text>
        <Text style={estilos.horaParada}>{hora(viaje.horaLlegada)}</Text>
      </View>
    </View>
  );
}

/** El galón que dice «esto lleva a algún sitio». */
function Galon() {
  return (
    <Svg viewBox="0 0 24 24" width={18} height={18} fill="none">
      <Path
        d="M9 6l6 6-6 6"
        stroke={color.rojo700}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const diaNumero = (cuandoISO: string) =>
  new Intl.DateTimeFormat('es-PA', { day: 'numeric', timeZone: 'America/Panama' }).format(
    new Date(cuandoISO),
  );

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
    fontSize: 33,
    lineHeight: 34.65,
    letterSpacing: -1.32,
    fontWeight: '400',
    color: '#fff',
    marginTop: 12,
    fontFamily: familia,
  },
  titularFuerte: { fontWeight: '600' },

  cuerpo: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 8, gap: 10 },

  hoja: {
    backgroundColor: color.blanco,
    borderRadius: 28,
    padding: 20,
    shadowColor: 'rgb(120,10,30)',
    shadowOpacity: 0.28,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
    elevation: 6,
  },
  tarjeta: {
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    padding: 20,
    marginTop: 13,
  },

  filaEpigrafe: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  epigrafeVivo: {
    fontSize: 11,
    lineHeight: interlinea(11),
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.rojo600,
    fontFamily: familia,
  },
  epigrafeAzul: {
    fontSize: 11,
    lineHeight: interlinea(11),
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.azul500,
    fontFamily: familia,
  },
  puntoVivo: { width: 7, height: 7, borderRadius: 999, backgroundColor: color.rojo500 },
  enlace: {
    fontSize: 13,
    lineHeight: 18.85,
    fontWeight: '600',
    color: color.azul700,
    fontFamily: familia,
  },

  recorrido: { gap: 9, marginTop: 13 },
  filaRuta: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  filaRutaSuelta: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 13 },
  puntoLleno: { width: 9, height: 9, borderRadius: 999, backgroundColor: color.rojo500 },
  puntoAzul: { width: 9, height: 9, borderRadius: 999, backgroundColor: color.azul700 },
  puntoVacio: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: color.blanco,
    borderWidth: 2,
    borderColor: color.ink200,
  },
  parada: {
    flex: 1,
    fontSize: 16,
    lineHeight: 23.2,
    fontWeight: '500',
    letterSpacing: -0.32,
    color: color.ink900,
    fontFamily: familia,
  },
  horaParada: {
    fontSize: 13,
    lineHeight: 18.85,
    color: color.ink400,
    fontFamily: familia,
    ...tabular,
  },

  filaVendidos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  vendidos: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: interlinea(13.5),
    color: color.ink700,
    fontFamily: familia,
    ...tabular,
  },
  nadie: {
    fontSize: 13.5,
    lineHeight: interlinea(13.5),
    color: color.ink500,
    fontFamily: familia,
  },

  // La única caja roja de la pantalla, y por eso es la que se mira primero.
  solicitudes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    backgroundColor: color.rojo100,
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 15,
  },
  contador: {
    width: 34,
    height: 34,
    borderRadius: radio.cuadrado,
    backgroundColor: color.rojo500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contadorTexto: {
    fontSize: 15,
    lineHeight: interlinea(15),
    fontWeight: '700',
    color: '#fff',
    fontFamily: familia,
    ...tabular,
  },
  solicitudesTitulo: {
    fontSize: 14.5,
    lineHeight: 21.025,
    fontWeight: '600',
    letterSpacing: -0.2175,
    color: color.rojo700,
    fontFamily: familia,
  },
  solicitudesPie: {
    fontSize: 12.5,
    lineHeight: 18.125,
    color: color.ink600,
    fontFamily: familia,
  },

  pieTexto: {
    fontSize: 12.5,
    lineHeight: 18.75,
    color: color.ink500,
    marginTop: 14,
    fontFamily: familia,
  },

  fab: {
    position: 'absolute',
    right: 22,
    bottom: 130,
    width: 56,
    height: 56,
    borderRadius: radio.cuadrado,
    backgroundColor: color.rojo500,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgb(210,16,52)',
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },

  pie: { paddingTop: 10, paddingHorizontal: 14, paddingBottom: 22 },
});
