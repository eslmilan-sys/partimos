/**
 * `6c` Chat del viaje — donde se acuerda el punto por escrito.
 *
 * Sin celulares a la vista: el hilo es la prueba de lo que se acordó, y por eso
 * los mensajes no se editan (en la base hay un trigger que lo impide). Arriba,
 * siempre, de qué puesto se está hablando.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { type HiloDelViaje, enviarMensaje, hiloDelViaje } from '@/servicios/mensajes';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { CampoRojo } from '@/ui/CampoRojo';
import { Epigrafe, Insignia } from '@/ui/controles';
import { tabular } from '@/ui/dinero';
import { cuando } from '@/ui/fechas';
import { Atras, Avion, Mas } from '@/ui/iconos';
import { familia, color, espacio, interlinea, radio } from '@/ui/tokens';

const RESERVA = '77777777-7777-4777-8777-777777777700';
const YO = '99999999-9999-4999-8999-999999999999'; // Daniela, mientras no haya sesión

export default function Chat() {
  const [hilo, setHilo] = useState<HiloDelViaje | null>(null);
  const [texto, setTexto] = useState('');
  const lista = useRef<ScrollView>(null);

  const recargar = useCallback(async () => {
    setHilo(await hiloDelViaje(RESERVA, YO));
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  if (!hilo) return <View style={estilos.pantalla} />;

  const mandar = async () => {
    if (!texto.trim()) return;
    await enviarMensaje(RESERVA, YO, texto);
    setTexto('');
    await recargar();
    lista.current?.scrollToEnd({ animated: true });
  };

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={196} />
      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <View style={estilos.circulo}>
          <Atras />
        </View>
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
            fondo={hilo.puesto.confirmado ? '#DFF1E8' : color.sand200}
            tinta={hilo.puesto.confirmado ? '#0E5A3F' : color.ink700}
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
          <Pressable accessibilityRole="button" accessibilityLabel="Adjuntar" style={estilos.adjuntar}>
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enviar"
            onPress={mandar}
            style={estilos.enviar}
          >
            <Avion />
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
  retrato: {
    width: 38,
    height: 38,
    borderRadius: radio.cuadrado,
    backgroundColor: 'rgba(255,255,255,.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,.34)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retratoTexto: { fontSize: 13.5, lineHeight: interlinea(13.5), fontWeight: '600', color: '#fff', fontFamily: familia },
  nombre: {
    fontSize: 16.5,
    lineHeight: interlinea(16.5),
    fontWeight: '600',
    letterSpacing: -0.41,
    color: '#fff',
    fontFamily: familia,
  },
  contexto: { fontSize: 12.5, lineHeight: interlinea(12.5), color: color.campoTexto, fontFamily: familia, ...tabular },

  cuerpo: { flex: 1, paddingHorizontal: 22 },
  tarjetaPuesto: {
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#26232B',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  resumenPuesto: {
    fontSize: 14.5,
    lineHeight: interlinea(14.5),
    fontWeight: '500',
    color: color.ink900,
    marginTop: 4,
    fontFamily: familia,
    ...tabular,
  },

  dia: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: interlinea(12),
    color: color.ink500,
    marginTop: 20,
    marginBottom: 14,
    fontFamily: familia,
    ...tabular,
  },

  burbuja: { maxWidth: '78%', paddingVertical: 12, paddingHorizontal: 14 },
  suya: {
    alignSelf: 'flex-start',
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderTopLeftRadius: radio.l,
    borderTopRightRadius: radio.l,
    borderBottomRightRadius: radio.l,
    borderBottomLeftRadius: 6,
  },
  mia: {
    alignSelf: 'flex-end',
    backgroundColor: color.azul500,
    borderTopLeftRadius: radio.l,
    borderTopRightRadius: radio.l,
    borderBottomRightRadius: 6,
    borderBottomLeftRadius: radio.l,
  },
  textoBurbuja: { fontSize: 14.5, lineHeight: 21.02, color: color.ink900, fontFamily: familia },
  horaBurbuja: { fontSize: 11, lineHeight: interlinea(11), color: color.ink400, marginTop: 5, fontFamily: familia, ...tabular },

  barraEscribir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 14,
    paddingBottom: 26,
  },
  adjuntar: {
    width: 44,
    height: 44,
    borderRadius: radio.pastilla,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
    alignItems: 'center',
    justifyContent: 'center',
  },
  campoMensaje: {
    flex: 1,
    height: 48,
    borderRadius: radio.pastilla,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  entradaMensaje: {
    fontSize: 15,
    lineHeight: interlinea(15),
    color: color.ink900,
    fontFamily: familia,
    outlineStyle: 'none',
  } as never,
  enviar: {
    width: 48,
    height: 48,
    borderRadius: radio.pastilla,
    backgroundColor: color.azul500,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
