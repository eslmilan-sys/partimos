/**
 * El mensaje de Partimos — el único hilo que siempre está en `16a`.
 *
 * **Por qué existe.** Una bandeja de mensajes vacía el primer día no dice
 * nada, y quien acaba de entrar no sabe qué puede hacer. Esto es lo primero
 * que lee: las tres cosas que ya puede hacer, con la puerta de cada una.
 *
 * **No es una conversación, y lo dice.** No hay nadie al otro lado de este
 * hilo; fingir que se puede contestar aquí sería dejar a alguien esperando
 * respuesta a un mensaje que nadie lee. La línea del pie manda a Ayuda, que
 * es donde sí se escribe.
 *
 * No se guarda en `messages`: no es de nadie ni va contra una reserva. Es una
 * pantalla, y por eso se lee igual el primer día que el año siguiente.
 */

import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { useVolver } from '@/ui/salidas';

import { perfilResumido } from '@/servicios/perfiles';
import { useMiId } from '@/servicios/sesion';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { CampoRojo } from '@/ui/CampoRojo';
import { Boton } from '@/ui/controles';
import { Atras, Avanza, Escudo, Lupa, Marca, Mas } from '@/ui/iconos';
import { TRACK_MICRO, color, espacio, familia, radio } from '@/ui/tokens';

/** Sin sesión que preguntar —solo en simulado—: la persona del recorrido. */
const YO_DEL_RECORRIDO = '22222222-2222-4222-8222-222222222222';

export default function MensajeDePartimos() {
  const router = useRouter();
  const volver = useVolver();
  const yo = useMiId(YO_DEL_RECORRIDO);
  const [nombre, setNombre] = useState<string | null>(null);

  useEffect(() => {
    if (!yo) return;
    perfilResumido(yo).then((p) => setNombre(p?.first_name ?? null));
  }, [yo]);

  const tres: { titulo: string; texto: string; icono: React.ReactNode; alPulsar: () => void }[] = [
    {
      titulo: 'Busca a dónde vas',
      texto:
        'Escribe tu punto exacto —un PH, un mall, una esquina—. Ves el aporte antes de pedir el puesto.',
      icono: <Lupa tamano={20} tinta={color.rojo600} />,
      alPulsar: () => router.push('/(pasajero)'),
    },
    {
      titulo: 'Publica tu viaje',
      texto: 'Si eres tú quien maneja, recuperas parte de lo que ibas a gastar de todos modos.',
      icono: <Mas tamano={20} tinta={color.rojo600} />,
      alPulsar: () => router.push('/(conductor)/publicar'),
    },
    {
      titulo: 'Mira cómo te cuidamos',
      texto: 'Cédula verificada fuera de aquí, chat que queda escrito, y el 911 a un toque.',
      icono: <Escudo tamano={20} tinta={color.rojo600} />,
      /* NO a `reportar`: ese formulario habla de UN viaje y quien acaba de
         registrarse no tiene ninguno, así que la pantalla se quedaba
         girando para siempre. Y tampoco era lo que la fila promete. */
      alPulsar: () => router.push('/(ayuda)/seguridad'),
    },
  ];

  return (
    <View style={estilos.pantalla}>
      <BarraDeEstado />

      {/* TODA LA PANTALLA DESLIZA, no solo el cuerpo: en el teléfono se siente
          como una app y no como una cabecera clavada. Solo la barra de estado
          —y la de pestañas, donde la hay— quedan fijas. */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >

      <CampoRojo altura={186} motivo="hibisco" />

      <View style={estilos.cabecera}>
        <View style={estilos.filaSuperior}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atrás"
            onPress={() => volver()}
            style={estilos.circulo}
          >
            <Atras />
          </Pressable>
          <Text style={estilos.epigrafeCampo}>Mensaje de Partimos</Text>
        </View>
        <View style={estilos.filaMarca}>
          <Marca tamano={22} />
          <Text style={estilos.titular}>Partimos</Text>
        </View>
      </View>

      <View style={estilos.cuerpo}>
        <View style={estilos.burbuja}>
          <Text style={estilos.burbujaTexto}>
            {`Bienvenido a bordo${nombre ? `, ${nombre}` : ''}. Aquí van las tres cosas que puedes hacer desde ya.`}
          </Text>
        </View>

        {tres.map((c) => (
          <Pressable
            key={c.titulo}
            accessibilityRole="button"
            accessibilityLabel={c.titulo}
            onPress={c.alPulsar}
            style={({ pressed }) => [estilos.tarjeta, pressed && { backgroundColor: color.sand100 }]}
          >
            <View style={estilos.cuadroIcono}>{c.icono}</View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={estilos.tarjetaTitulo}>{c.titulo}</Text>
              <Text style={estilos.tarjetaTexto}>{c.texto}</Text>
            </View>
            <Avanza />
          </Pressable>
        ))}

        {/* Los dos botones se fueron (27-08-2026). Las tres tarjetas de arriba
            ya llevan a donde hay que ir, y la barra de abajo tiene Buscar y
            Publicar siempre a mano: repetirlos aquí era el mismo camino
            dibujado tres veces en la misma pantalla. */}

        <Text style={estilos.pieTexto}>
          Este es un mensaje nuestro, no una conversación: aquí no contestamos. Para escribirnos,
          Perfil → Ayuda.
        </Text>
      </View>
      </ScrollView>
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

  cabecera: { paddingHorizontal: espacio.gutter },
  filaSuperior: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  epigrafeCampo: {
    fontSize: 11.5,
    lineHeight: 15.95,
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.campoTexto,
    fontFamily: familia,
  },
  filaMarca: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 14 },
  titular: { fontSize: 22, lineHeight: 26, letterSpacing: -0.77, fontWeight: '600', color: color.ink900, fontFamily: familia, },

  cuerpo: { paddingHorizontal: espacio.gutter, paddingTop: 22, paddingBottom: 30, gap: 10 },

  burbuja: {
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderRadius: radio.l,
    borderTopLeftRadius: 6,
    padding: 17,
  },
  burbujaTexto: { fontSize: 15.5, lineHeight: 23, color: color.ink900, fontFamily: familia },

  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderRadius: radio.l,
    padding: 15,
  },
  cuadroIcono: {
    width: 42,
    height: 42,
    borderRadius: radio.control,
    backgroundColor: color.rojo50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tarjetaTitulo: {
    fontSize: 15.5,
    lineHeight: 22.5,
    fontWeight: '600',
    letterSpacing: -0.23,
    color: color.ink900,
    fontFamily: familia,
  },
  tarjetaTexto: { fontSize: 13.5, lineHeight: 19.5, color: color.ink500, marginTop: 3, fontFamily: familia },

  acciones: { flexDirection: 'row', gap: 9, marginTop: 8 },

  pieTexto: {
    fontSize: 12.5,
    lineHeight: 19,
    color: color.ink600,
    marginTop: 6,
    fontFamily: familia,
  },
});
