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
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { useDecir } from '@/ui/Nota';
import { DIJO, compartir } from '@/ui/salidas';

import { useVolver } from '@/ui/salidas';

import { ciudadYPunto, soloCiudad } from '@/dominio/comoSeLlama';
import { etiquetaDeMaletero } from '@/dominio/equipaje';
import { type PerfilPublico, perfilPublico } from '@/servicios/perfiles';
import { useSesion } from '@/servicios/sesion';
import { ciudadesDelViaje, obtenerViaje, paradasDelViaje, slugDestinoDe } from '@/servicios/viajes';
import type { TripStop, ViajeFila } from '@/tipos';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando, Hueso } from '@/ui/Cargando';
import { Bandera, motivoDe } from '@/ui/CampoRojo';
import { Avatar, Epigrafe, Pastilla } from '@/ui/controles';
import { formatearDineroRedondo, tabular } from '@/ui/dinero';
import { diaLargo, hora } from '@/ui/fechas';
import {
  Asiento,
  Atras,
  Avanza,
  Ayuda,
  Carro,
  Chat,
  Compartir,
  Escudo,
  Estrella,
  Maleta,
  Mascota,
  SinHumo,
} from '@/ui/iconos';
import { TRACK_MICRO, familia, color, espacio, radio } from '@/ui/tokens';

const DEL_RECORRIDO = '55555555-5555-4555-8555-555555555555';
/** Sin sesión que preguntar —solo en simulado—. En producción la pide `1c`. */
const YO_DEL_RECORRIDO = '22222222-2222-4222-8222-222222222222';

export default function DetalleDelViaje() {
  const router = useRouter();
  const volver = useVolver();
  const decir = useDecir();
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
  /**
   * `undefined` es «todavía no lo he preguntado», `null` es «pregunté y no
   * está». Tratarlos igual hacía que durante un instante —y en una red lenta,
   * durante varios— la tarjeta dijera «Todavía sin calificaciones» y «Carro
   * sin registrar» de un conductor que tiene las dos cosas.
   */
  const [conductor, setConductor] = useState<PerfilPublico | null | undefined>(undefined);

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

  if (!viaje) return <Cargando />;

  const minutos = viaje.arrival_estimate_at
    ? Math.round(
        (new Date(viaje.arrival_estimate_at).getTime() - new Date(viaje.departure_at).getTime()) /
          60_000,
      )
    : 0;
  const nombre = conductor?.nombre ?? '';
  const deNombre = nombre.split(' ')[0] || 'el conductor';
  const carro = conductor?.carro;
  /**
   * NADIE SE PIDE UN PUESTO EN SU PROPIO CARRO. Al conductor que llega aquí
   * —desde su panel, o desde un enlace que compartió él mismo— la barra le
   * ofrece administrarlo, no reservarlo.
   */
  const esMio = !!yo && yo === viaje.driver_id;
  const ciudades = ciudadesDelViaje(viaje);

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
              onPress={() => volver()}
              style={estilos.circulo}
            >
              <Atras />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Compartir el viaje"
              onPress={() =>
                compartir(
                  `${ciudadYPunto(ciudades.origen, viaje.origin_label)} → ${ciudadYPunto(ciudades.destino, viaje.destination_label)} · ${diaLargo(viaje.departure_at)} ${hora(viaje.departure_at)} · ${formatearDineroRedondo(viaje.price_cents)} por puesto`,
                ).then((c) => decir(DIJO[c]))
              }
              style={estilos.circulo}
            >
              <Compartir />
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
              {`${soloCiudad(ciudades.origen, viaje.origin_label)} → ${soloCiudad(ciudades.destino, viaje.destination_label)}`}
            </Text>
          </View>
        </Bandera>

        <View style={estilos.hoja}>
          <View style={estilos.tarjeta}>
            <Epigrafe>Ruta del viaje</Epigrafe>
            <View style={estilos.recorrido}>
              <View style={estilos.linea} />
              {paradas.map((p, i) => {
                const ultima = i === paradas.length - 1;
                return (
                  <View key={p.id} style={[estilos.parada, ultima && { paddingBottom: 0 }]}>
                    <View
                      style={i === 0 ? estilos.puntoLleno : ultima ? estilos.puntoFinal : estilos.puntoMedio}
                    />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      {/* «Salida» y «Llegada» con nombre: dos filas con un punto
                          cada una no dicen cuál es cuál si no las lees enteras. */}
                      <Text
                        style={[
                          estilos.paradaQue,
                          i === 0 && { color: color.rojo600 },
                        ]}
                      >
                        {i === 0 ? 'Salida' : ultima ? 'Llegada' : 'Parada'}
                      </Text>
                      <Text style={[estilos.paradaNombre, !ultima && i > 0 && { fontWeight: '400' }]}>
                        {p.custom_label}
                      </Text>
                    </View>
                    <Text style={estilos.paradaHora}>
                      {p.scheduled_at ? hora(p.scheduled_at) : ''}
                      {ultima && p.scheduled_at ? <Text style={estilos.aprox}> aprox.</Text> : null}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={nombre ? `Ver el perfil de ${nombre}` : 'Ver el perfil del conductor'}
            onPress={() =>
              router.push({ pathname: '/(pasajero)/perfil', params: { perfil: viaje.driver_id } })
            }
            style={({ pressed }) => [estilos.tarjeta, pressed && { backgroundColor: color.sand100 }]}
          >
            <View style={estilos.filaConductor}>
              {conductor === undefined ? (
                <Hueso ancho={56} alto={56} redondo={radio.cuadrado} />
              ) : (
                <Avatar nombre={nombre || '·'} tamano={56} />
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                {conductor === undefined ? (
                  <>
                    <Hueso ancho="60%" alto={17} />
                    <Hueso ancho="40%" alto={13} estilo={{ marginTop: 8 }} />
                  </>
                ) : (
                  <>
                    <Text style={estilos.nombre}>{nombre}</Text>
                    <View style={estilos.filaCalificacion}>
                      {conductor?.calificacion != null ? <Estrella tamano={13} /> : null}
                      <Text style={estilos.calificacion}>
                        {conductor?.calificacion != null
                          ? `${conductor.calificacion.toFixed(1)} (${conductor.viajes} ${conductor.viajes === 1 ? 'viaje' : 'viajes'})`
                          : 'Todavía sin calificaciones'}
                      </Text>
                    </View>
                  </>
                )}
                {/* Las dos etiquetas en su propia fila y no a la derecha del
                    nombre: a 390 px la pastilla del equipaje dejaba ochenta
                    píxeles para la nota, y «4.9 (34 viajes)» partía en dos. */}
                <View style={estilos.filaChips}>
                  {conductor?.distintivos.some((d) => d.tono === 'verde') ? (
                    <View style={estilos.verificado}>
                      <Escudo tamano={13} tinta={color.hechoTinta} />
                      <Text style={estilos.verificadoTexto}>Verificado</Text>
                    </View>
                  ) : null}
                  <View style={estilos.pastillaEquipaje}>
                    <Maleta tamano={13} tinta={color.azul700} />
                    <Text style={estilos.pastillaEquipajeTexto}>
                      {etiquetaDeMaletero(viaje.accepts_luggage)}
                    </Text>
                  </View>
                  {/* Aquí sí se dicen las dos, digan que sí o que no: quien
                      está a un toque de pedir el puesto necesita saberlo. */}
                  <View style={estilos.pastillaLlana}>
                    <Mascota tamano={13} tinta={color.ink600} />
                    <Text style={estilos.pastillaLlanaTexto}>
                      {viaje.allows_pets ? 'Acepta mascotas' : 'Sin mascotas'}
                    </Text>
                  </View>
                  <View style={estilos.pastillaLlana}>
                    <SinHumo tamano={13} tinta={color.ink600} />
                    <Text style={estilos.pastillaLlanaTexto}>
                      {viaje.allows_smoking ? 'Se puede fumar' : 'No se fuma'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={estilos.separador} />

            <View style={estilos.filaCarro}>
              <View style={estilos.cuadroCarro}>
                <Carro tamano={26} tinta={color.ink500} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                {conductor === undefined ? (
                  <>
                    <Hueso ancho="65%" alto={16} />
                    <Hueso ancho="45%" alto={12} estilo={{ marginTop: 7 }} />
                  </>
                ) : (
                  <>
                    <Text style={estilos.textoCarro} numberOfLines={1}>
                      {carro ? `${carro.modelo}${carro.color ? ` ${carro.color}` : ''}` : 'Carro sin registrar'}
                    </Text>
                    {/* La placa entera no se guarda: solo los tres últimos.
                        Enseñar la de alguien a quien no has conocido es lo que
                        el diseño evita, así que se dice lo que hay. */}
                    <Text style={estilos.detalleCarro}>
                      {carro?.placa ? `Placa ${carro.placa}` : 'Lo reconoces por el modelo y el color'}
                    </Text>
                  </>
                )}
              </View>
              <Avanza />
            </View>
          </Pressable>

          {/* Azul, no rojo: informa, no es algo que tocar. */}
          <View style={estilos.aviso}>
            <Escudo tamano={19} tinta={color.azul500} />
            <Text style={estilos.avisoTexto}>
              <Text style={estilos.avisoFuerte}>Pedir puesto no cuesta nada</Text>
              {` · no se cobra hasta que ${deNombre} acepte`}
            </Text>
          </View>

          {/* Tres cosas ciertas, y ninguna promete lo que no hay: no hay
              soporte 24/7 ni la plataforma custodia el dinero de nadie.
              Va en el desplazamiento y no en la barra fija: pegada abajo, la
              barra se comía un tercio de la pantalla en un teléfono. */}
          <View style={estilos.tira}>
            <View style={estilos.tiraItem}>
              <Escudo tamano={17} tinta={color.ink500} />
              <Text style={estilos.tiraTexto}>Sin cargo al pedir</Text>
            </View>
            <View style={estilos.tiraItem}>
              <Chat tamano={17} tinta={color.ink500} />
              <Text style={estilos.tiraTexto}>Chat al aceptar</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(ayuda)')}
              style={estilos.tiraItem}
            >
              <Ayuda tamano={17} tinta={color.ink500} />
              <Text style={estilos.tiraTexto}>Ayuda si algo pasa</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={estilos.barraVidrio}>
        <View style={estilos.filaPrecioBarra}>
          <Text style={estilos.precioBarra}>{formatearDineroRedondo(viaje.price_cents)}</Text>
          <Pastilla estilo={{ marginTop: 3 }}>1 puesto</Pastilla>
          {/* «Aporte directo» y no «pago seguro»: la plataforma no guarda la
              plata de nadie, y decir lo contrario sería la única mentira que
              este producto no se puede permitir. */}
          <View style={estilos.filaDirecto}>
            <Escudo tamano={15} tinta={color.ink600} />
            <Text style={estilos.directo}>{esMio ? 'Tu viaje' : 'Aporte directo'}</Text>
          </View>
        </View>

        {esMio ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Administrar mi viaje"
            onPress={() => router.push('/(conductor)/panel')}
            style={({ pressed }) => [
              estilos.cta,
              { backgroundColor: pressed ? color.ink800 : color.ink900 },
            ]}
          >
            <Text style={estilos.ctaTexto}>Administrar mi viaje</Text>
            <Avanza tamano={19} tinta="#fff" />
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Pedir mi puesto"
            disabled={preguntando}
            onPress={() =>
              router.push(
                yo
                  ? { pathname: '/(pasajero)/reservar', params: { viaje: viajeId } }
                  : { pathname: '/(cuenta)/puerta', params: { viaje: viajeId } },
              )
            }
            style={({ pressed }) => [
              estilos.cta,
              { backgroundColor: pressed ? color.rojo600 : color.rojo500, opacity: preguntando ? 0.5 : 1 },
            ]}
          >
            <Asiento tamano={21} />
            <Text style={estilos.ctaTexto}>Pedir mi puesto</Text>
            <Avanza tamano={19} tinta="#fff" />
          </Pressable>
        )}

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
  contenido: { paddingBottom: 190 },

  chrome: {
    paddingHorizontal: espacio.gutter,
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
  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 14, paddingBottom: 44 },
  filaTitular: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14 },
  epigrafeCampo: {
    fontSize: 11.5,
    lineHeight: 15.95,
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.campoTexto,
    fontFamily: familia,
  },
  titular: { fontSize: 22, lineHeight: 26, letterSpacing: -0.77, fontWeight: '600', color: color.ink900, fontFamily: familia, marginTop: 12, },
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
    shadowColor: '#14141A',
    shadowOpacity: 0.14,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: -12 },
    elevation: 8,
  },

  /** El aporte en la cabecera: H2 del v6, en tinta — el rojo no es precio. */
  precio: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.77,
    lineHeight: 26,
    textAlign: 'right',
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  porPuesto: {
    fontSize: 12.5,
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

  recorrido: { position: 'relative', marginTop: 14 },
  linea: {
    position: 'absolute',
    left: 4.25,
    top: 10,
    bottom: 22,
    width: 1.5,
    backgroundColor: color.rojo300,
  },
  parada: { flexDirection: 'row', alignItems: 'flex-start', gap: 13, paddingBottom: 16 },
  paradaQue: {
    fontSize: 12.5,
    lineHeight: 18.12,
    color: color.ink500,
    fontFamily: familia,
  },
  aprox: { fontSize: 11.5, color: color.ink500 },
  puntoLleno: {
    width: 10,
    height: 10,
    borderRadius: radio.pastilla,
    backgroundColor: color.rojo500,
    marginTop: 6,
  },
  puntoMedio: {
    width: 10,
    height: 10,
    borderRadius: radio.pastilla,
    backgroundColor: color.blanco,
    borderWidth: 2,
    borderColor: color.azul500,
    marginTop: 6,
  },
  puntoFinal: {
    width: 10,
    height: 10,
    borderRadius: radio.pastilla,
    backgroundColor: color.blanco,
    borderWidth: 2,
    borderColor: color.ink200,
    marginTop: 6,
  },
  paradaNombre: {
    fontSize: 15.5,
    lineHeight: 21.75,
    fontWeight: '500',
    letterSpacing: -0.27,
    color: color.ink900,
    fontFamily: familia,
  },
  paradaHora: {
    fontSize: 14,
    lineHeight: 23,
    color: color.ink500,
    fontFamily: familia,
    ...tabular,
  },

  filaConductor: { flexDirection: 'row', alignItems: 'flex-start', gap: 13 },
  filaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 9 },
  verificado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radio.pastilla,
    backgroundColor: color.hechoFondo,
  },
  verificadoTexto: {
    fontSize: 12.5,
    lineHeight: 16,
    fontWeight: '600',
    color: color.hechoTinta,
    fontFamily: familia,
  },
  pastillaEquipaje: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radio.pastilla,
    backgroundColor: color.azul100,
  },
  pastillaEquipajeTexto: {
    fontSize: 12.5,
    lineHeight: 16,
    fontWeight: '600',
    color: color.azul700,
    fontFamily: familia,
  },
  pastillaLlana: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radio.pastilla,
    backgroundColor: color.sand200,
  },
  pastillaLlanaTexto: {
    fontSize: 12.5,
    lineHeight: 16,
    fontWeight: '500',
    color: color.ink700,
    fontFamily: familia,
  },
  cuadroCarro: {
    width: 52,
    height: 40,
    borderRadius: radio.control,
    backgroundColor: color.sand200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nombre: {
    fontSize: 15.5,
    lineHeight: 23.93,
    fontWeight: '500',
    letterSpacing: -0.33,
    color: color.ink900,
    fontFamily: familia,
  },
  filaCalificacion: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  calificacion: {
    fontSize: 13.5,
    lineHeight: 18.85,
    color: color.ink600,
    fontFamily: familia,
    ...tabular,
  },
  separador: { height: 1, backgroundColor: color.bordeSutil, marginVertical: 16 },
  filaCarro: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  textoCarro: {
    fontSize: 15.5,
    lineHeight: 22.5,
    fontWeight: '500',
    letterSpacing: -0.24,
    color: color.ink900,
    fontFamily: familia,
  },
  detalleCarro: {
    fontSize: 13.5,
    lineHeight: 18.85,
    color: color.ink500,
    fontFamily: familia,
    ...tabular,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginTop: 14,
    padding: 15,
    borderRadius: radio.l,
    backgroundColor: color.azul50,
  },
  avisoTexto: { flex: 1, fontSize: 13.5, lineHeight: 20, color: color.azul700, fontFamily: familia },
  avisoFuerte: { fontWeight: '600' },

  barraVidrio: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: espacio.gutter,
    paddingTop: 16,
    paddingBottom: 28,
    /* **Opaca, no de vidrio.** Con el desenfoque puesto y el blanco al 82 %,
       «Hyundai Elantra gris» se seguía leyendo a través del pie: el vidrio
       luce cuando lo de detrás es color, y aquí detrás hay texto negro sobre
       casi blanco, así que sólo dejaba un fantasma. La barra de abajo sí lo
       lleva, que es donde pasa contenido de verdad por debajo. */
    backgroundColor: color.sand50,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
    shadowColor: 'rgb(0,39,65)',
    shadowOpacity: 0.18,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: -8 },
    elevation: 10,
  },
  filaPrecioBarra: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12 },
  filaDirecto: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 'auto', marginTop: 4 },
  directo: { fontSize: 13.5, lineHeight: 18.85, color: color.ink600, fontFamily: familia },

  cta: {
    height: 60,
    borderRadius: radio.pastilla,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 26,
  },
  ctaTexto: {
    fontSize: 17.5,
    lineHeight: 25,
    fontWeight: '600',
    letterSpacing: -0.175,
    color: '#fff',
    fontFamily: familia,
  },

  tira: {
    flexDirection: 'row',
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  tiraItem: {
    minHeight: espacio.tap, flex: 1, alignItems: 'center', gap: 6 },
  tiraTexto: {
    fontSize: 11.5,
    lineHeight: 16,
    color: color.ink600,
    textAlign: 'center',
    fontFamily: familia,
  },
  precioBarra: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -1.35,
    lineHeight: 29,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
});
