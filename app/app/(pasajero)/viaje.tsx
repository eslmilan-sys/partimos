/**
 * `5a` Detalle del viaje — el camino, la persona y el dinero.
 *
 * **Ya no hay mapa arriba.** Era un bloque dibujado que no enseñaba el
 * recorrido de verdad —no hay mapas contratados— y se comía el tercio de
 * pantalla donde tiene que estar lo que decide si te subes: a qué hora sales,
 * cuánto pones y quién maneja. En su sitio va el arquetipo de la casa, el
 * campo rojo con el dibujo del destino, que sí dice a dónde vas.
 *
 * Quien maneja sale de la base, no de un texto escrito a mano: nombre, nota,
 * carro y placa son los suyos. Antes decía «Andrés M. · Elantra gris ·
 * AB-1234» en todos los viajes, también en los de José.
 *
 * «Verificado» se enseña como estado del conductor, no como filtro ni como
 * distintivo que lo separe de otros: todos los conductores tienen cédula.
 */

import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { etiquetaDeMaletero } from '@/dominio/equipaje';
import { type PerfilPublico, perfilPublico } from '@/servicios/perfiles';
import { useSesion } from '@/servicios/sesion';
import { obtenerViaje, paradasDelViaje, slugDestinoDe } from '@/servicios/viajes';
import type { TripStop, ViajeFila } from '@/tipos';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Bandera, motivoDe } from '@/ui/CampoRojo';
import { Avatar, Boton, Epigrafe, Insignia, Pastilla } from '@/ui/controles';
import { formatearDineroRedondo, tabular } from '@/ui/dinero';
import { diaLargo, hora } from '@/ui/fechas';
import { Atras, Carro, Compartir, Escudo, Estrella } from '@/ui/iconos';
import { TRACK_MICRO, familia, color, espacio, radio } from '@/ui/tokens';

const DEL_RECORRIDO = '55555555-5555-4555-8555-555555555555';
/** Sin sesión que preguntar —solo en simulado—. En producción la pide `1c`. */
const YO_DEL_RECORRIDO = '22222222-2222-4222-8222-222222222222';

export default function DetalleDelViaje() {
  const router = useRouter();
  const { viaje: viajeParam } = useLocalSearchParams<{ viaje?: string }>();
  const viajeId = viajeParam ?? DEL_RECORRIDO;

  /**
   * QUIÉN ESTÁ DENTRO DECIDE A DÓNDE LLEVA EL BOTÓN.
   *
   * Antes «Pedir mi puesto» mandaba siempre a la puerta `1c`, así que a quien
   * ya tenía la sesión abierta le salía «Tus viajes viven en tu cuenta» y le
   * pedía el correo otra vez. La puerta es para quien no tiene cuenta; quien
   * la tiene va derecho a elegir su punto y su equipaje.
   */
  const { id: yo, preguntando } = useSesion(YO_DEL_RECORRIDO);

  const [viaje, setViaje] = useState<ViajeFila | null>(null);
  const [paradas, setParadas] = useState<TripStop[]>([]);
  const [conductor, setConductor] = useState<PerfilPublico | null>(null);

  useEffect(() => {
    obtenerViaje(viajeId).then(setViaje);
    paradasDelViaje(viajeId).then(setParadas);
  }, [viajeId]);

  useEffect(() => {
    if (!viaje) return;
    perfilPublico(viaje.driver_id)
      .then(setConductor)
      .catch(() => setConductor(null));
  }, [viaje]);

  if (!viaje) return <View style={estilos.pantalla} />;

  const minutos = viaje.arrival_estimate_at
    ? Math.round(
        (new Date(viaje.arrival_estimate_at).getTime() - new Date(viaje.departure_at).getTime()) /
          60_000,
      )
    : 0;
  const nombre = conductor?.nombre ?? '';
  const deNombre = nombre.split(' ')[0] || 'el conductor';
  const carro = conductor?.carro;

  return (
    <View style={estilos.pantalla}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={estilos.contenido}
        showsVerticalScrollIndicator={false}
      >
        {/* El campo va DENTRO del desplazamiento, envuelto con su cabecera:
            fuera se queda clavado y la hoja le pasa por encima. */}
        <Bandera altura={252} motivo={motivoDe(slugDestinoDe(viaje))}>
          <BarraDeEstado />

          <View style={estilos.chrome}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Atrás"
              onPress={() => router.back()}
              style={estilos.circulo}
            >
              <Atras />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Compartir el viaje"
              onPress={() =>
                Share.share({
                  title: 'Partimos',
                  message: `${viaje.origin_label ?? ''} → ${viaje.destination_label ?? ''} · ${diaLargo(viaje.departure_at)} ${hora(viaje.departure_at)} · ${formatearDineroRedondo(viaje.price_cents)} por puesto`,
                })
              }
              style={estilos.circulo}
            >
              <Compartir tinta="#fff" />
            </Pressable>
          </View>

          <View style={estilos.cabecera}>
            <Text style={estilos.epigrafeCampo}>{diaLargo(viaje.departure_at)}</Text>
            <View style={estilos.filaTitular}>
              <Text style={estilos.titular}>
                <Text style={estilos.titularFuerte}>{hora(viaje.departure_at)}</Text>
                {minutos > 0 ? ` · ${Math.floor(minutos / 60)} h ${minutos % 60}` : ''}
              </Text>
              {/* El aporte va en el campo, junto a la hora: es lo primero que
                  se mira y en la hoja se quedaba en un rincón vacío. */}
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={estilos.precio}>{formatearDineroRedondo(viaje.price_cents)}</Text>
                <Text style={estilos.porPuesto}>por puesto</Text>
              </View>
            </View>
            <Text style={estilos.subtitulo} numberOfLines={1}>
              {`${(viaje.origin_label ?? '').split(' · ')[0]} → ${(viaje.destination_label ?? '').split(' · ')[0]}`}
            </Text>
          </View>
        </Bandera>

        <View style={estilos.hoja}>
          <Epigrafe>Por dónde pasa</Epigrafe>

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
                  <Text
                    style={[
                      estilos.paradaNombre,
                      i > 0 && i < paradas.length - 1 && { fontWeight: '400' },
                    ]}
                  >
                    {p.custom_label}
                  </Text>
                  <Text style={estilos.paradaHora}>
                    {p.scheduled_at ? hora(p.scheduled_at) : ''}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={nombre ? `Ver el perfil de ${nombre}` : 'Ver el perfil del conductor'}
            onPress={() =>
              router.push({ pathname: '/(pasajero)/perfil', params: { perfil: viaje.driver_id } })
            }
            style={({ pressed }) => [
              estilos.tarjeta,
              pressed && { backgroundColor: color.sand100 },
            ]}
          >
            <View style={estilos.filaConductor}>
              <Avatar nombre={nombre || '·'} tono="rojo" />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={estilos.nombre}>{nombre}</Text>
                <View style={estilos.filaCalificacion}>
                  {conductor?.calificacion != null ? <Estrella /> : null}
                  <Text style={estilos.calificacion}>
                    {conductor?.calificacion != null
                      ? `${conductor.calificacion.toFixed(1)} · ${conductor.viajes} ${conductor.viajes === 1 ? 'viaje' : 'viajes'}`
                      : 'Todavía sin calificaciones'}
                  </Text>
                </View>
              </View>
              {conductor?.distintivos.some((d) => d.tono === 'verde') ? (
                <Insignia punto fondo="#DFF1E8" tinta="#0E5A3F">
                  Verificado
                </Insignia>
              ) : null}
            </View>

            <View style={estilos.separador} />

            <View style={estilos.filaCarro}>
              <Carro />
              <Text style={estilos.textoCarro} numberOfLines={1}>
                {carro
                  ? `${carro.modelo}${carro.color ? ` ${carro.color}` : ''}${carro.placa ? ` · ${carro.placa}` : ''}`
                  : 'Carro sin registrar'}
              </Text>
              <Pastilla>{etiquetaDeMaletero(viaje.accepts_luggage)}</Pastilla>
            </View>

            <View style={estilos.filaPromesa}>
              <Escudo />
              <Text style={estilos.promesa}>
                {`Pedir puesto no cuesta nada · no se cobra hasta que ${deNombre} acepte`}
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      <View style={estilos.barraVidrio}>
        <View style={estilos.filaPrecioBarra}>
          <Text style={estilos.precioBarra}>{formatearDineroRedondo(viaje.price_cents)}</Text>
          <Pastilla estilo={{ marginTop: 3 }}>1 puesto</Pastilla>
        </View>
        <Boton
          desactivado={preguntando}
          alPulsar={() =>
            router.push(
              yo
                ? { pathname: '/(pasajero)/reservar', params: { viaje: viajeId } }
                : { pathname: '/(cuenta)/puerta', params: { viaje: viajeId } },
            )
          }
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
    maxWidth: espacio.marco,
    width: '100%',
    alignSelf: 'center',
  },
  contenido: { paddingBottom: 170 },

  chrome: {
    paddingHorizontal: 22,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* El relleno de abajo es lo que da altura al bloque de la bandera: sin él
     la hoja subía —lleva margen negativo— y tapaba la línea de la ruta. */
  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 14, paddingBottom: 66 },
  filaTitular: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14 },
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
    lineHeight: 32.86,
    letterSpacing: -1.395,
    fontWeight: '400',
    color: '#fff',
    marginTop: 12,
    fontFamily: familia,
    ...tabular,
  },
  titularFuerte: { fontWeight: '600' },
  subtitulo: {
    fontSize: 14,
    lineHeight: 20.3,
    color: color.campoTexto,
    marginTop: 8,
    fontFamily: familia,
  },

  hoja: {
    marginTop: -30,
    backgroundColor: color.sand100,
    borderTopLeftRadius: radio.hoja,
    borderTopRightRadius: radio.hoja,
    paddingHorizontal: espacio.gutter,
    paddingTop: 22,
    shadowColor: '#26232B',
    shadowOpacity: 0.14,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: -12 },
    elevation: 8,
  },

  precio: {
    fontSize: 27,
    fontWeight: '700',
    letterSpacing: -1.21,
    lineHeight: 27,
    textAlign: 'right',
    color: '#fff',
    fontFamily: familia,
    ...tabular,
  },
  porPuesto: {
    fontSize: 12,
    lineHeight: 17.4,
    textAlign: 'right',
    color: color.campoTexto,
    marginTop: 3,
    fontFamily: familia,
  },

  tarjeta: {
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderRadius: radio.l,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginTop: 14,
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
  puntoLleno: {
    width: 10,
    height: 10,
    borderRadius: radio.pastilla,
    backgroundColor: color.rojo500,
  },
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
  paradaNombre: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21.75,
    fontWeight: '500',
    letterSpacing: -0.27,
    color: color.ink900,
    fontFamily: familia,
  },
  paradaHora: {
    fontSize: 13,
    lineHeight: 18.85,
    color: color.ink400,
    fontFamily: familia,
    ...tabular,
  },

  filaConductor: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  nombre: {
    fontSize: 16.5,
    lineHeight: 23.93,
    fontWeight: '500',
    letterSpacing: -0.33,
    color: color.ink900,
    fontFamily: familia,
  },
  filaCalificacion: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  calificacion: {
    fontSize: 13,
    lineHeight: 18.85,
    color: color.ink600,
    fontFamily: familia,
    ...tabular,
  },
  separador: { height: 1, backgroundColor: color.bordeSutil, marginVertical: 16 },
  filaCarro: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  textoCarro: {
    flex: 1,
    fontSize: 14.5,
    lineHeight: 21.02,
    fontWeight: '500',
    letterSpacing: -0.22,
    color: color.ink900,
    fontFamily: familia,
  },
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
