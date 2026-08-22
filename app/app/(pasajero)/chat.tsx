/**
 * `6c` Chat del viaje — donde se acuerda el punto por escrito.
 *
 * Sin celulares a la vista: el hilo es la prueba de lo que se acordó, y por eso
 * los mensajes no se editan (en la base hay un trigger que lo impide). Arriba,
 * siempre, de qué puesto se está hablando.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { useVolver } from '@/ui/salidas';

import { useMiIdOEntrar } from '@/servicios/sesion';

import { type HiloDelViaje, enviarMensaje, hiloDelViaje } from '@/servicios/mensajes';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { CampoRojo } from '@/ui/CampoRojo';
import { Epigrafe, Insignia } from '@/ui/controles';
import { tabular } from '@/ui/dinero';
import { cuando } from '@/ui/fechas';
import { Atras, Avion, Mas } from '@/ui/iconos';
import { familia, color, espacio, interlinea, radio } from '@/ui/tokens';

/** Sin parámetro de ruta —solo al abrir la pantalla suelta—, la del traspaso. */
const DEL_RECORRIDO = '77777777-7777-4777-8777-777777777700';
/** Sin sesión que preguntar —solo en simulado—, la pasajera del traspaso. */
const YO_DEL_RECORRIDO = '99999999-9999-4999-8999-999999999999';

export default function Chat() {
  const router = useRouter();
  const volver = useVolver();
  const { reserva } = useLocalSearchParams<{ reserva?: string }>();
  const reservaId = reserva ?? DEL_RECORRIDO;
  const yo = useMiIdOEntrar(YO_DEL_RECORRIDO);
  const [hilo, setHilo] = useState<HiloDelViaje | null>(null);
  const [texto, setTexto] = useState('');
  const lista = useRef<ScrollView>(null);

  const recargar = useCallback(async () => {
    if (!yo) return;
    setHilo(await hiloDelViaje(reservaId, yo));
  }, [reservaId, yo]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  if (!hilo) return <Cargando />;

  const mandar = async () => {
    if (!texto.trim()) return;
    if (!yo) return;
    await enviarMensaje(reservaId, yo, texto);
    setTexto('');
    await recargar();
    lista.current?.scrollToEnd({ animated: true });
  };

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={196} />
      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Atrás"
          onPress={() => volver()}
          style={estilos.circulo}
        >
          <Atras />
        </Pressable>
        <View style={estilos.retrato}>
          <Text style={estilos.retratoTexto}>{hilo.otro.iniciales}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={estilos.nombre} numberOfLines={1}>
            {hilo.otro.nombre}
          </Text>
          <Text style={estilos.contexto} numberOfLines={1}>
            {`${hilo.ruta} · ${cuando(hilo.cuando).toLowerCase()}`}
          </Text>
        </View>
      </View>

      <View style={estilos.cuerpo}>
        <View style={estilos.tarjetaPuesto}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Epigrafe>Tu puesto</Epigrafe>
            <Text style={estilos.resumenPuesto}>{hilo.puesto.resumen}</Text>
          </View>
          <Insignia
            fondo={hilo.puesto.confirmado ? color.hechoFondo : color.sand200}
            tinta={hilo.puesto.confirmado ? color.hechoTinta : color.ink700}
          >
            {hilo.puesto.estado}
          </Insignia>
        </View>

        <ScrollView
          ref={lista}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={estilos.dia}>Ayer</Text>

          <View style={{ gap: 10 }}>
            {hilo.mensajes.map((m) => (
              <View key={m.id} style={[estilos.burbuja, m.mio ? estilos.mia : estilos.suya]}>
                <Text style={[estilos.textoBurbuja, m.mio && { color: '#fff' }]}>{m.texto}</Text>
                <Text style={[estilos.horaBurbuja, m.mio && { color: 'rgba(255,255,255,.72)' }]}>
                  {m.hora}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={estilos.barraEscribir}>
          {/* El punto de recogida es de lo que más se habla aquí, así que el
              «más» abre el mapa en vez de un adjunto: no hay módulo de archivos
              en el proyecto, y un botón que no hace nada es peor que uno que
              hace lo útil. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver el punto de recogida"
            onPress={() => router.push('/(pasajero)/ya-mapa')}
            style={estilos.adjuntar}
          >
            <Mas tamano={19} tinta={color.ink700} />
          </Pressable>
          <View style={estilos.campoMensaje}>
            <TextInput
              accessibilityLabel="Escribe un mensaje"
              value={texto}
              onChangeText={setTexto}
              onSubmitEditing={mandar}
              placeholder="Escribe un mensaje"
              placeholderTextColor={color.ink400}
              returnKeyType="send"
              style={estilos.entradaMensaje}
            />
          </View>
          {/* Sin texto el botón devolvía en silencio: parecía roto. Apagado
              dice lo mismo antes de que nadie lo pulse. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enviar"
            disabled={!texto.trim()}
            onPress={mandar}
            style={({ pressed }) => [
              estilos.enviar,
              !texto.trim() && estilos.enviarApagado,
              pressed && texto.trim() ? { backgroundColor: color.rojo600 } : null,
            ]}
          >
            <Avion tinta={texto.trim() ? '#fff' : color.inerteTinta} />
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
    maxWidth: espacio.marco,
    width: '100%',
    alignSelf: 'center',
  },

  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: espacio.gutter,
    paddingBottom: 18,
  },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Círculo, como todo retrato del v6. */
  retrato: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: color.ink100,
    borderWidth: 1,
    borderColor: 'rgba(10,39,49,.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retratoTexto: { fontSize: 13.5, lineHeight: interlinea(13.5), fontWeight: '600', color: color.ink700, fontFamily: familia },
  nombre: {
    fontSize: 15.5,
    lineHeight: interlinea(16.5),
    fontWeight: '600',
    letterSpacing: -0.41,
    color: color.ink900,
    fontFamily: familia,
  },
  contexto: { fontSize: 12.5, lineHeight: interlinea(12.5), color: color.campoTexto, fontFamily: familia, ...tabular },

  cuerpo: { flex: 1, paddingHorizontal: espacio.gutter },
  tarjetaPuesto: {
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderRadius: radio.l,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resumenPuesto: {
    fontSize: 14,
    lineHeight: interlinea(14.5),
    fontWeight: '500',
    color: color.ink900,
    marginTop: 4,
    fontFamily: familia,
    ...tabular,
  },

  dia: {
    textAlign: 'center',
    fontSize: 12.5,
    lineHeight: interlinea(12),
    color: color.ink500,
    marginTop: 20,
    marginBottom: 14,
    fontFamily: familia,
    ...tabular,
  },

  burbuja: { maxWidth: '78%', paddingVertical: 10, paddingHorizontal: 14 },
  /** La suya: blanca con borde de pelo, la esquina de salida recogida. */
  suya: {
    alignSelf: 'flex-start',
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 6,
  },
  /** La mía: la superficie oscura de tinta — la única del v6. */
  mia: {
    alignSelf: 'flex-end',
    backgroundColor: color.ink900,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 6,
    borderBottomLeftRadius: 18,
  },
  textoBurbuja: { fontSize: 14, lineHeight: 20, color: color.ink900, fontFamily: familia },
  horaBurbuja: {
    fontSize: 10,
    lineHeight: 14,
    color: color.ink500,
    marginTop: 4,
    alignSelf: 'flex-end',
    fontFamily: familia,
    ...tabular,
  },

  barraEscribir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 14,
    paddingBottom: 26,
  },
  /** La celda de icono del v6: 44, radio 14, lavado al pulsar. */
  adjuntar: {
    width: 44,
    height: 44,
    borderRadius: radio.icono,
    backgroundColor: color.lavado,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** El campo del v6: superficie de campo, sin borde. */
  campoMensaje: {
    flex: 1,
    height: 48,
    borderRadius: radio.control,
    backgroundColor: color.sand200,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  entradaMensaje: {
    fontSize: 15.5,
    lineHeight: interlinea(15),
    color: color.ink900,
    fontFamily: familia,
    outlineStyle: 'none',
  } as never,
  /** Apagado sigue OPACO — lo que se apaga es el dibujo, no la superficie. */
  enviarApagado: { backgroundColor: color.inerteFondo },
  /** Enviar ES la acción: va en rojo, con la sombra del acento. */
  enviar: {
    width: 48,
    height: 48,
    borderRadius: radio.control,
    backgroundColor: color.rojo500,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
