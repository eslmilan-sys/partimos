/**
 * La raíz. Antes de la primera pantalla, el almacén tiene que estar en pie.
 *
 * Con datos simulados no hay nada que esperar. Contra la base sí: los
 * servicios leen las tablas como arreglos, y un arreglo vacío no es una app
 * cargando, es una app vacía. Así que aquí se espera una vez, con el campo
 * rojo de fondo para que la espera se parezca al producto y no a un error.
 */

import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { MODO, cargar } from '@/servicios/_fuente';
import { familia, color, espacio, interlinea } from '@/ui/tokens';

export default function Layout() {
  const [listo, setListo] = useState(MODO === 'simulado');
  const [fallo, setFallo] = useState<string | null>(null);

  useEffect(() => {
    if (listo) return;
    cargar().then(
      () => setListo(true),
      (e: Error) => setFallo(e.message),
    );
  }, [listo]);

  if (fallo) return <NoSePudo motivo={fallo} />;
  if (!listo) return <Cargando />;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: color.sand100 },
        }}
      />
    </>
  );
}

function Cargando() {
  return (
    <View style={estilos.espera}>
      <ActivityIndicator color="#fff" />
    </View>
  );
}

/**
 * Sin red no hay app, y decirlo es mejor que una pantalla en blanco. El motivo
 * va debajo porque quien lo lee suele ser quien puede arreglarlo.
 */
function NoSePudo({ motivo }: { motivo: string }) {
  return (
    <View style={estilos.espera}>
      <Text style={estilos.titulo}>No se pudo cargar</Text>
      <Text style={estilos.motivo}>{motivo}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  espera: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacio.entreTarjetas,
    paddingHorizontal: espacio.gutter,
    backgroundColor: color.rojo500,
  },
  titulo: {
    fontFamily: familia,
    fontSize: 22,
    lineHeight: interlinea(22),
    fontWeight: '600',
    color: '#fff',
  },
  motivo: {
    fontFamily: familia,
    fontSize: 13,
    lineHeight: interlinea(13),
    color: 'rgba(255,255,255,.72)',
    textAlign: 'center',
  },
});
