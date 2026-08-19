/**
 * `15e` Quién pide puesto.
 *
 * Arregla una asimetría que el producto tenía y que nadie nombraba: el
 * pasajero podía mirar a quién se subía, y el conductor sólo veía un nombre y
 * un botón de aceptar. Aquí ve lo mismo que ve el otro.
 *
 * Cuando no hay estrellas, la pantalla **lo dice y explica qué sí sabemos**
 * en vez de enseñar un hueco. Un perfil vacío no es una señal de alarma: todo
 * el mundo tuvo un primer viaje, y la cédula ya está verificada.
 */

import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { type PerfilPublico, perfilPublico } from '@/servicios/perfiles';
import { type Solicitud, aceptarSolicitud, listarSolicitudes, rechazarSolicitud } from '@/servicios/solicitudes';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { CampoRojo } from '@/ui/CampoRojo';
import { Epigrafe, Insignia } from '@/ui/controles';
import { formatearDineroRedondo, tabular } from '@/ui/dinero';
import { cuando } from '@/ui/fechas';
import { Atras, Maleta, Pin } from '@/ui/iconos';
import { TRACK_MICRO, familia, color, espacio, interlinea, radio } from '@/ui/tokens';

const VIAJE = '55555555-5555-4555-8555-555555555555';

const VERDE = { fondo: '#DFF1E8', tinta: '#0E5A3F' };

export default function Solicitante() {
  const router = useRouter();
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [perfil, setPerfil] = useState<PerfilPublico | null>(null);
  const [salida, setSalida] = useState('');

  useEffect(() => {
    listarSolicitudes(VIAJE).then(async (r) => {
      const primera = r.solicitudes.find((s) => s.estado === 'pendiente') ?? r.solicitudes[0];
      if (!primera) return;
      setSolicitud(primera);
      setSalida(r.viaje.salida);
      setPerfil(await perfilPublico(primera.pasajero.id));
    });
  }, []);

  if (!solicitud || !perfil) return <View style={estilos.pantalla} />;

  const sinEstrellas = perfil.calificacion == null;

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={196} />
      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <View style={estilos.filaSuperior}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atrás"
            onPress={() => router.back()}
            style={estilos.circulo}
          >
            <Atras />
          </Pressable>
          <Text style={estilos.epigrafeCampo}>
            {`Pide puesto · ${salida ? cuando(salida).toLowerCase() : ''}`}
          </Text>
        </View>

        <Text style={estilos.titular}>
          {`${perfil.nombre.split(' ')[0]} `}
          <Text style={estilos.titularFuerte}>{perfil.nombre.split(' ').slice(1).join(' ')}</Text>
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={estilos.cuerpo}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.hoja}>
          <View style={estilos.filaPersona}>
            <View style={estilos.retrato}>
              <Text style={estilos.retratoTexto}>{perfil.iniciales}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={estilos.nombre}>{perfil.nombre}</Text>
              <Text style={estilos.desde}>{`Miembro desde ${perfil.desde}`}</Text>
            </View>
          </View>

          <View style={estilos.distintivos}>
            {perfil.distintivos.map((d) => (
              <Insignia
                key={d.texto}
                fondo={d.tono === 'verde' ? VERDE.fondo : d.tono === 'rojo' ? color.rojo50 : color.sand200}
                tinta={d.tono === 'verde' ? VERDE.tinta : d.tono === 'rojo' ? color.rojo700 : color.ink700}
                punto={d.tono === 'verde'}
              >
                {d.texto}
              </Insignia>
            ))}
          </View>
        </View>

        <View style={estilos.tarjeta}>
          <Epigrafe>{sinEstrellas ? 'Su primer viaje' : 'Lo que dicen de ella'}</Epigrafe>

          <Text style={estilos.parrafo}>
            {sinEstrellas
              ? 'Nadie la ha calificado todavía, así que no hay estrellas que mirar. Lo que sí sabemos: la cédula está verificada y el pago se retiene hasta la llegada.'
              : `${perfil.totalResenas} personas la han calificado.`}
          </Text>

          <View style={estilos.cifras}>
            <Cifra valor={String(perfil.viajes)} etiqueta="viajes" />
            <Cifra valor={perfil.calificacion?.toFixed(1) ?? '—'} etiqueta="calificación" />
            <Cifra valor="0" etiqueta="cancelados" />
          </View>
        </View>

        <View style={estilos.tarjeta}>
          <Epigrafe>Lo que pide</Epigrafe>

          <View style={estilos.filaPide}>
            <Pin tamano={15} tinta={color.ink600} />
            <Text style={estilos.punto}>{solicitud.punto}</Text>
            <Text style={estilos.desvio}>{solicitud.minutosDeDesvio ? `+${solicitud.minutosDeDesvio} min` : ''}</Text>
          </View>

          <View style={estilos.filaPide}>
            <Maleta tamano={15} />
            <Text style={estilos.equipaje}>{solicitud.equipaje}</Text>
            <Text style={estilos.aporte}>{formatearDineroRedondo(solicitud.aporteCentavos)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={estilos.pie}>
        <Pressable
          accessibilityRole="button"
          onPress={async () => {
            await aceptarSolicitud(solicitud.id);
            router.back();
          }}
          style={estilos.aceptar}
        >
          <Text style={estilos.aceptarTexto}>
            {`Aceptar · ${formatearDineroRedondo(solicitud.aporteCentavos)}`}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={async () => {
            await rechazarSolicitud(solicitud.id);
            router.back();
          }}
          style={estilos.rechazar}
        >
          <Text style={estilos.rechazarTexto}>No puedo</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Cifra({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={estilos.cifra}>{valor}</Text>
      <Text style={estilos.cifraEtiqueta}>{etiqueta}</Text>
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

  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 4 },
  filaSuperior: { flexDirection: 'row', alignItems: 'center', gap: 13 },
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
    lineHeight: interlinea(11),
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

  cuerpo: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 12 },
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
  filaPersona: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  retrato: {
    width: 56,
    height: 56,
    borderRadius: radio.cuadrado,
    backgroundColor: color.azul100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retratoTexto: {
    fontSize: 22.4,
    lineHeight: 32.48,
    fontWeight: '600',
    letterSpacing: -0.448,
    color: color.azul700,
    fontFamily: familia,
  },
  nombre: {
    fontSize: 18,
    lineHeight: 26.1,
    fontWeight: '500',
    letterSpacing: -0.45,
    color: color.ink900,
    fontFamily: familia,
  },
  desde: { fontSize: 13, lineHeight: 18.85, color: color.ink600, marginTop: 3, fontFamily: familia },

  distintivos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },

  tarjeta: {
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    padding: 18,
    marginTop: 11,
  },
  parrafo: {
    fontSize: 13.5,
    lineHeight: 20.25,
    color: color.ink700,
    marginTop: 9,
    fontFamily: familia,
  },

  cifras: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  cifra: {
    fontSize: 20,
    lineHeight: 29,
    fontWeight: '700',
    letterSpacing: -0.6,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  cifraEtiqueta: { fontSize: 12, lineHeight: 17.4, color: color.ink500, marginTop: 2, fontFamily: familia },

  filaPide: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 11 },
  punto: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20.3,
    fontWeight: '500',
    letterSpacing: -0.21,
    color: color.ink900,
    fontFamily: familia,
  },
  desvio: { fontSize: 14, lineHeight: 20.3, color: color.ink500, fontFamily: familia, ...tabular },
  equipaje: { flex: 1, fontSize: 14, lineHeight: 20.3, color: color.ink700, fontFamily: familia },
  aporte: {
    fontSize: 17,
    lineHeight: 24.65,
    fontWeight: '700',
    letterSpacing: -0.51,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },

  pie: {
    flexDirection: 'row',
    gap: 9,
    backgroundColor: color.blanco,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
    paddingTop: 14,
    paddingHorizontal: espacio.gutter,
    paddingBottom: 26,
  },
  aceptar: {
    flex: 2,
    height: 52,
    borderRadius: radio.pastilla,
    backgroundColor: color.rojo500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aceptarTexto: {
    fontSize: 16,
    lineHeight: 23.2,
    fontWeight: '600',
    letterSpacing: -0.16,
    color: '#fff',
    fontFamily: familia,
  },
  // Rechazar no pide motivo y no se pinta de rojo: no es una acción cargada,
  // es decir que no y seguir.
  rechazar: {
    flex: 1,
    height: 52,
    borderRadius: radio.pastilla,
    backgroundColor: color.sand200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rechazarTexto: {
    fontSize: 16,
    lineHeight: 23.2,
    fontWeight: '600',
    letterSpacing: -0.16,
    color: color.ink900,
    fontFamily: familia,
  },
});
