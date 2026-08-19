/**
 * `16a` Conversaciones — todos los hilos, cada uno con su viaje.
 *
 * Un chat sin contexto obliga a recordar de qué iba; por eso cada fila lleva
 * debajo el viaje del que habla. Es la misma razón por la que el hilo de `6c`
 * tiene el puesto anclado arriba.
 *
 * Y la línea del pie dice cuándo se abren y cuándo se cierran, que es lo que
 * evita la pregunta de por qué un chat viejo ya no responde: se cierran 48 h
 * después de la llegada, cuando ya no hay nada que acordar.
 */

import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { type HiloDelViaje, hiloDelViaje } from '@/servicios/mensajes';
import { type PuestoMio, misViajes } from '@/servicios/panel';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { BarraDePestanas } from '@/ui/BarraDePestanas';
import { CampoRojo } from '@/ui/CampoRojo';
import { Avatar } from '@/ui/controles';
import { tabular } from '@/ui/dinero';
import { diaAbrev, esHoy, hora } from '@/ui/fechas';
import { Atras, Carro, Chat, Lupa, Persona } from '@/ui/iconos';
import { TRACK_MICRO, familia, color, espacio, interlinea } from '@/ui/tokens';

const YO = '99999999-9999-4999-8999-999999999999';

type Fila = { puesto: PuestoMio; hilo: HiloDelViaje };

export default function Conversaciones() {
  const router = useRouter();
  const [filas, setFilas] = useState<Fila[]>([]);

  useEffect(() => {
    (async () => {
      const mios = await misViajes(YO);
      const todos = [...mios.proximos, ...mios.pasados];
      const hilos = await Promise.all(
        todos.map(async (puesto) => ({ puesto, hilo: await hiloDelViaje(puesto.reservaId, YO) })),
      );
      setFilas(hilos.filter((f) => f.hilo.mensajes.length > 0));
    })();
  }, []);

  const sinLeer = filas.filter((f) => !f.hilo.mensajes[f.hilo.mensajes.length - 1]?.mio).length;

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={206} />
      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <View style={estilos.filaSuperiorCampo}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atrás"
            onPress={() => router.back()}
            style={estilos.circulo}
          >
            <Atras />
          </Pressable>
          <Text style={estilos.epigrafeCampo}>
            {sinLeer === 1 ? '1 sin leer' : `${sinLeer} sin leer`}
          </Text>
        </View>
        <Text style={estilos.titular}>Mensajes</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={estilos.cuerpo}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.lista}>
          {filas.map(({ puesto, hilo }, i) => {
            const ultimo = hilo.mensajes[hilo.mensajes.length - 1];
            return (
              <Pressable
                key={puesto.reservaId}
                accessibilityRole="button"
                accessibilityLabel={`Conversación con ${hilo.otro.nombre}`}
                onPress={() => router.push('/(pasajero)/chat')}
                style={[estilos.fila, i < filas.length - 1 && estilos.filaConRaya]}
              >
                <Avatar nombre={hilo.otro.nombre} tono="rojo" />

                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={estilos.filaSuperior}>
                    <Text style={estilos.nombre} numberOfLines={1}>
                      {hilo.otro.nombre}
                    </Text>
                    <Text style={estilos.cuando}>{ultimo ? cuandoCorto(hilo.cuando) : ''}</Text>
                  </View>

                  <Text style={estilos.ultimo} numberOfLines={1}>
                    {ultimo?.texto ?? ''}
                  </Text>

                  <Text style={estilos.contexto} numberOfLines={1}>
                    {`${puesto.destino} · ${cuandoLargo(puesto.cuando)}`}
                  </Text>
                </View>
              </Pressable>
            );
          })}

          {filas.length === 0 ? (
            <Text style={estilos.vacio}>
              Todavía no tienes conversaciones. Se abren cuando el conductor acepta tu puesto.
            </Text>
          ) : null}
        </View>

        <Text style={estilos.pieTexto}>
          Los chats se abren cuando el conductor acepta y se cierran 48 h después de la llegada.
          Todo lo del punto de recogida que se acuerde aquí queda por escrito.
        </Text>
      </ScrollView>

      <View style={estilos.pie}>
        <BarraDePestanas
          valor="Mensajes"
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

/** La hora si es de hoy, el día si no: en una lista nadie quiere la fecha entera. */
function cuandoCorto(cuandoISO: string): string {
  return esHoy(cuandoISO) ? hora(cuandoISO) : diaAbrev(cuandoISO);
}

function cuandoLargo(cuandoISO: string): string {
  return esHoy(cuandoISO)
    ? `hoy ${hora(cuandoISO)}`
    : `${diaAbrev(cuandoISO).toLowerCase()} ${hora(cuandoISO)}`;
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
  filaSuperiorCampo: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: 999,
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

  cuerpo: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 12 },
  lista: {
    backgroundColor: color.blanco,
    borderRadius: 28,
    paddingHorizontal: 20,
    shadowColor: 'rgb(120,10,30)',
    shadowOpacity: 0.28,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
    elevation: 6,
  },
  fila: { flexDirection: 'row', alignItems: 'flex-start', gap: 13, paddingVertical: 16 },
  filaConRaya: { borderBottomWidth: 1, borderBottomColor: color.bordeSutil },
  filaSuperior: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  nombre: {
    flex: 1,
    fontSize: 15.5,
    lineHeight: 22.475,
    fontWeight: '500',
    letterSpacing: -0.279,
    color: color.ink900,
    fontFamily: familia,
  },
  cuando: { fontSize: 12.5, lineHeight: 18.125, color: color.ink400, fontFamily: familia, ...tabular },
  ultimo: { fontSize: 13.5, lineHeight: 19.575, color: color.ink600, marginTop: 2, fontFamily: familia },
  // El viaje del que habla el hilo: sin esto, un chat viejo no se sitúa.
  contexto: {
    fontSize: 12,
    lineHeight: 17.4,
    color: color.ink400,
    marginTop: 4,
    fontFamily: familia,
    ...tabular,
  },
  vacio: {
    fontSize: 13.5,
    lineHeight: 19.575,
    color: color.ink500,
    paddingVertical: 28,
    textAlign: 'center',
    fontFamily: familia,
  },

  pieTexto: {
    fontSize: 12.5,
    lineHeight: 18.75,
    color: color.ink500,
    paddingHorizontal: 4,
    marginTop: 16,
    fontFamily: familia,
  },

  pie: { paddingTop: 8, paddingHorizontal: 14, paddingBottom: 22 },
});
