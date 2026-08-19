/**
 * `5a` Detalle del viaje — mapa, camino, persona y dinero.
 *
 * El mapa es todavía un bloque dibujado. La hoja de arena monta sobre él y la
 * barra de abajo es la única capa de vidrio de la pantalla: vidrio solo sobre
 * algo con color, nunca sobre la página lisa.
 *
 * «Verificado» se enseña como estado del conductor, no como filtro ni como
 * distintivo que lo separe de otros: todos los conductores tienen cédula.
 */

import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { etiquetaDeMaletero } from '@/dominio/equipaje';
import { obtenerViaje, paradasDelViaje } from '@/servicios/viajes';
import type { TripStop, ViajeFila } from '@/tipos';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Avatar, Boton, Epigrafe, Insignia, Pastilla } from '@/ui/controles';
import { Mapa } from '@/ui/Mapa';
import { formatearDineroRedondo, tabular } from '@/ui/dinero';
import { diaLargo, hora } from '@/ui/fechas';
import { Atras, Carro, Compartir, Escudo, Estrella } from '@/ui/iconos';
import { familia, color, espacio, radio } from '@/ui/tokens';

const POR_DEFECTO = '55555555-5555-4555-8555-555555555555';

export default function DetalleDelViaje() {
  const router = useRouter();
  const { viaje: viajeParam } = useLocalSearchParams<{ viaje?: string }>();
  const viajeId = viajeParam ?? POR_DEFECTO;

  const [viaje, setViaje] = useState<ViajeFila | null>(null);
  const [paradas, setParadas] = useState<TripStop[]>([]);

  useEffect(() => {
    obtenerViaje(viajeId).then(setViaje);
    paradasDelViaje(viajeId).then(setParadas);
  }, [viajeId]);

  if (!viaje) return <View style={estilos.pantalla} />;

  const minutos = viaje.arrival_estimate_at
    ? Math.round(
        (new Date(viaje.arrival_estimate_at).getTime() - new Date(viaje.departure_at).getTime()) /
          60_000,
      )
    : 0;

  return (
    <View style={estilos.pantalla}>
      <Mapa alto={300} />

      <BarraDeEstado tono="oscuro" />

      <View style={estilos.chrome}>
        <View style={estilos.vidrioBoton}>
          <Atras tinta={color.ink900} />
        </View>
        <View style={estilos.vidrioBoton}>
          <Compartir />
        </View>
      </View>

      <ScrollView
        style={estilos.hoja}
        contentContainerStyle={estilos.hojaContenido}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.filaEncabezado}>
          <View>
            <Epigrafe>{diaLargo(viaje.departure_at)}</Epigrafe>
            <Text style={estilos.cuando}>
              <Text style={estilos.cuandoFuerte}>{hora(viaje.departure_at)}</Text>
              {` · ${Math.floor(minutos / 60)} h ${minutos % 60}`}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={estilos.precio}>{formatearDineroRedondo(viaje.price_cents)}</Text>
            <Text style={estilos.porPuesto}>por puesto</Text>
          </View>
        </View>

        <View style={estilos.tarjeta}>
          <View style={estilos.recorrido}>
            <View style={estilos.linea} />
            {paradas.map((p, i) => (
              <View
                key={p.id}
                style={[estilos.parada, i === paradas.length - 1 && { paddingBottom: 0 }]}
              >
                <View
                  style={
                    i === 0
                      ? estilos.puntoLleno
                      : i === paradas.length - 1
                        ? estilos.puntoFinal
                        : estilos.puntoMedio
                  }
                />
                <Text style={[estilos.paradaNombre, i > 0 && i < paradas.length - 1 && { fontWeight: '400' }]}>
                  {p.custom_label}
                </Text>
                <Text style={estilos.paradaHora}>
                  {p.scheduled_at ? hora(p.scheduled_at) : ''}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[estilos.tarjeta, { marginTop: 10 }]}>
          <View style={estilos.filaConductor}>
            <Avatar nombre="Andrés M." tono="rojo" />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={estilos.nombre}>Andrés M.</Text>
              <View style={estilos.filaCalificacion}>
                <Estrella />
                <Text style={estilos.calificacion}>4.9 · Elantra gris</Text>
              </View>
            </View>
            <Insignia punto fondo="#DFF1E8" tinta="#0E5A3F">
              Verificado
            </Insignia>
          </View>

          <View style={estilos.separador} />

          <View style={estilos.filaCarro}>
            <Carro />
            <Text style={estilos.textoCarro} numberOfLines={1}>
              {'Elantra gris · '}
              <Text style={tabular}>AB-1234</Text>
            </Text>
            <Pastilla>{etiquetaDeMaletero(viaje.accepts_luggage)}</Pastilla>
          </View>

          <View style={estilos.filaPromesa}>
            <Escudo />
            <Text style={estilos.promesa}>
              Pedir puesto no cuesta nada · no se cobra hasta que Andrés acepte
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={estilos.barraVidrio}>
        <View style={estilos.filaPrecioBarra}>
          <Text style={estilos.precioBarra}>{formatearDineroRedondo(viaje.price_cents)}</Text>
          <Pastilla estilo={{ marginTop: 3 }}>1 puesto</Pastilla>
        </View>
        <Boton
          // la puerta: pedir puesto es lo único que pide cuenta
          alPulsar={() => router.push({ pathname: '/(cuenta)/puerta', params: { viaje: viajeId } })}
        >
          Pedir mi puesto
        </Boton>
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

  chrome: {
    paddingHorizontal: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vidrioBoton: {
    width: 44,
    height: 44,
    borderRadius: radio.pastilla,
    // vidrio sobre el mapa, que sí tiene color debajo
    backgroundColor: 'rgba(255,255,255,.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.6)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#26232B',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  hoja: {
    marginTop: 112,
    backgroundColor: color.sand100,
    borderTopLeftRadius: radio.hoja,
    borderTopRightRadius: radio.hoja,
    shadowColor: '#26232B',
    shadowOpacity: 0.14,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: -12 },
    elevation: 8,
  },
  hojaContenido: { paddingHorizontal: espacio.gutter, paddingTop: 20, paddingBottom: 170 },

  filaEncabezado: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 },
  cuando: { fontSize: 25, lineHeight: 36.25, letterSpacing: -1, marginTop: 7, fontWeight: '400', color: color.ink900, fontFamily: familia },
  cuandoFuerte: { fontWeight: '600' },
  precio: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -1.35,
    lineHeight: 27,
    textAlign: 'right',
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  porPuesto: {
    fontSize: 12.5,
    lineHeight: 18.125,
    textAlign: 'right',
    color: color.ink600,
    marginTop: 5,
    fontFamily: familia,
  },

  tarjeta: {
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderRadius: radio.l,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginTop: 16,
  },

  recorrido: { position: 'relative' },
  linea: {
    position: 'absolute',
    left: 4.25,
    top: 8,
    bottom: 8,
    width: 1.5,
    backgroundColor: color.rojo300,
  },
  parada: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingBottom: 9 },
  puntoLleno: { width: 10, height: 10, borderRadius: radio.pastilla, backgroundColor: color.rojo500 },
  puntoMedio: {
    width: 10,
    height: 10,
    borderRadius: radio.pastilla,
    backgroundColor: color.blanco,
    borderWidth: 2,
    borderColor: color.azul500,
  },
  puntoFinal: {
    width: 10,
    height: 10,
    borderRadius: radio.pastilla,
    backgroundColor: color.blanco,
    borderWidth: 2,
    borderColor: color.ink200,
  },
  paradaNombre: { flex: 1, fontSize: 15, lineHeight: 21.75, fontWeight: '500', letterSpacing: -0.27, color: color.ink900, fontFamily: familia },
  paradaHora: { fontSize: 13, lineHeight: 18.85, color: color.ink400, fontFamily: familia, ...tabular },

  filaConductor: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  nombre: { fontSize: 16.5, lineHeight: 23.93, fontWeight: '500', letterSpacing: -0.33, color: color.ink900, fontFamily: familia },
  filaCalificacion: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  calificacion: { fontSize: 13, lineHeight: 18.85, color: color.ink600, fontFamily: familia, ...tabular },
  separador: { height: 1, backgroundColor: color.bordeSutil, marginVertical: 16 },
  filaCarro: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  textoCarro: { flex: 1, fontSize: 14.5, lineHeight: 21.02, fontWeight: '500', letterSpacing: -0.22, color: color.ink900, fontFamily: familia },
  filaPromesa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  promesa: { flex: 1, fontSize: 13, lineHeight: 18.85, color: color.ink700, fontFamily: familia },

  barraVidrio: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: espacio.gutter,
    paddingTop: 16,
    paddingBottom: 28,
    backgroundColor: 'rgba(255,255,255,.86)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,.7)',
    shadowColor: 'rgb(0,39,65)',
    shadowOpacity: 0.18,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: -8 },
    elevation: 10,
  },
  filaPrecioBarra: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12 },
  precioBarra: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -1.17,
    lineHeight: 25,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
});
