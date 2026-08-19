/**
 * `15a` Rutas guardadas — el destino de «Avisarme».
 *
 * Una ruta guardada es una `routine`: de dónde a dónde y cuándo. El
 * interruptor de cada fila **apaga el aviso sin borrar la ruta**, y por eso
 * es un interruptor y no una papelera: dejar de recibir mensajes no es dejar
 * de querer ir. La ruta apagada se queda en la lista, sólo pierde el punto
 * rojo y pasa a decir «Avisos apagados».
 *
 * El epígrafe cuenta cuántas avisan, no cuántas hay guardadas: es el número
 * que cambia al tocar, y así el interruptor tiene consecuencia visible fuera
 * de su propia fila.
 *
 * La nota del pie es la promesa que hace soportable el permiso de avisos —
 * una vez por viaje y nunca de madrugada—, así que va debajo de todo y en
 * gris: se lee cuando dudas si encender otro.
 */

import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { cambiarAviso, cuantasAvisando, rutasGuardadas, type RutaGuardada } from '@/servicios/rutas';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { CampoRojo } from '@/ui/CampoRojo';
import { Epigrafe } from '@/ui/controles';
import { tabular } from '@/ui/dinero';
import { Atras, Mas } from '@/ui/iconos';
import { color, espacio, familia, radio, sombra, texto } from '@/ui/tokens';

/** Mientras no haya sesión, la pasajera del recorrido del diseño. */
const PERFIL = '99999999-9999-4999-8999-999999999999';

export default function Rutas() {
  const router = useRouter();
  const [rutas, setRutas] = useState<RutaGuardada[] | null>(null);
  const [avisando, setAvisando] = useState(0);

  useEffect(() => {
    rutasGuardadas(PERFIL).then(setRutas);
    cuantasAvisando(PERFIL).then(setAvisando);
  }, []);

  const alternar = useCallback(async (id: string, avisar: boolean) => {
    const cambiada = await cambiarAviso(id, avisar);
    if (!cambiada) return;
    // El estado de la fila lo reescribe el servicio: apagar el aviso no sólo
    // mueve el pulgar, también borra lo que había esta semana.
    setRutas((antes) => antes?.map((r) => (r.id === cambiada.id ? cambiada : r)) ?? antes);
    setAvisando(await cuantasAvisando(PERFIL));
  }, []);

  if (!rutas) return <View style={estilos.pantalla} />;

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={206} />
      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <View style={estilos.filaVolver}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={() => router.back()}
            style={estilos.volver}
          >
            <Atras tamano={20} />
          </Pressable>
          <Epigrafe tinta={color.campoTexto}>
            {`${avisando} ${avisando === 1 ? 'ruta avisando' : 'rutas avisando'}`}
          </Epigrafe>
        </View>

        <Text style={estilos.titular}>
          {'Tus '}
          <Text style={estilos.titularFuerte}>rutas</Text>
        </Text>
      </View>

      <View style={estilos.cuerpo}>
        <View style={estilos.lista}>
          {rutas.map((r) => (
            <View key={r.id} style={estilos.tarjeta}>
              <View style={estilos.filaRuta}>
                <View
                  style={[estilos.punto, { backgroundColor: r.avisar ? color.rojo500 : color.ink200 }]}
                />
                <Text style={estilos.rutaHueco} numberOfLines={1}>
                  <Text style={estilos.ruta}>{r.ruta}</Text>
                </Text>
                <PalancaDeAviso
                  activa={r.avisar}
                  etiqueta={`Avisarme de ${r.ruta}`}
                  alCambiar={(v) => alternar(r.id, v)}
                />
              </View>

              <View style={estilos.filaEstado}>
                <Text style={estilos.cuandoHueco}>
                  <Text style={estilos.cuando}>{r.cuando}</Text>
                </Text>
                <Text
                  style={[estilos.estado, { color: r.hayViajes ? color.azul700 : color.ink500 }]}
                >
                  {r.estado}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Guardar otra ruta"
          onPress={() => router.push('/(pasajero)')}
          style={estilos.guardarOtra}
        >
          <Mas tamano={18} />
          <Text style={estilos.guardarOtraTexto}>Guardar otra ruta</Text>
        </Pressable>

        <Text style={estilos.promesa}>
          <Text>Te escribimos una sola vez por viaje nuevo, y nunca antes de las 7 de la mañana.</Text>
        </Text>
      </View>
    </View>
  );
}

/**
 * El interruptor suelto de la fila. `Interruptor` de `@/ui/controles` trae su
 * propia etiqueta visible pegada al control, y aquí el nombre de la ruta ya la
 * hace: se queda con las medidas del sistema (48 × 30, pulgar de 24, recorrido
 * de 18) y sin texto. El hueco de 16 px a la izquierda es del diseño, y de paso
 * agranda el sitio donde se toca.
 */
function PalancaDeAviso({
  activa,
  etiqueta,
  alCambiar,
}: {
  activa: boolean;
  etiqueta: string;
  alCambiar: (v: boolean) => void;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: activa }}
      accessibilityLabel={etiqueta}
      onPress={() => alCambiar(!activa)}
      style={estilos.palanca}
    >
      <View style={[estilos.pista, { backgroundColor: activa ? color.rojo500 : color.ink200 }]}>
        <View style={[estilos.pulgar, { transform: [{ translateX: activa ? 18 : 0 }] }]} />
      </View>
    </Pressable>
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

  cabecera: { paddingTop: 4, paddingHorizontal: espacio.gutter },
  filaVolver: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  volver: {
    width: espacio.controlS,
    height: espacio.controlS,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titular: { ...texto.titular, color: color.blanco, marginTop: 12 },
  titularFuerte: texto.titularFuerte,

  cuerpo: { flex: 1, overflow: 'hidden' },
  lista: { marginTop: 20, marginHorizontal: 22, gap: espacio.entreTarjetas },

  tarjeta: {
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    paddingVertical: 17,
    paddingHorizontal: 18,
    ...sombra.s,
  },
  filaRuta: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  punto: { width: 9, height: 9, borderRadius: radio.pastilla },
  // El hueco es lo que empuja el interruptor contra el borde de la tarjeta; el
  // nombre va dentro, ceñido al texto, como en el traspaso.
  rutaHueco: { ...texto.tituloTarjeta, letterSpacing: -0.279, flex: 1 },
  ruta: { ...texto.tituloTarjeta, letterSpacing: -0.279, color: color.ink900 },

  filaEstado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 11,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  cuandoHueco: { fontSize: 12.5, lineHeight: 18.125, fontFamily: familia, flex: 1, ...tabular },
  cuando: {
    fontSize: 12.5,
    lineHeight: 18.125,
    color: color.ink600,
    fontFamily: familia,
    ...tabular,
  },
  estado: {
    fontSize: 12.5,
    lineHeight: 18.125,
    fontWeight: '600',
    fontFamily: familia,
    ...tabular,
  },

  palanca: { paddingLeft: 16 },
  pista: { width: 48, height: 30, borderRadius: radio.pastilla, padding: 3, justifyContent: 'center' },
  pulgar: {
    width: 24,
    height: 24,
    borderRadius: radio.pastilla,
    backgroundColor: color.blanco,
    shadowColor: '#26232B',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },

  guardarOtra: {
    marginTop: 14,
    marginHorizontal: 22,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.bordePorDefecto,
    borderRadius: radio.l,
    paddingVertical: 17,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  guardarOtraTexto: {
    fontSize: 14.5,
    lineHeight: 21.025,
    fontWeight: '600',
    letterSpacing: -0.2175,
    color: color.azul700,
    fontFamily: familia,
    flex: 1,
  },

  promesa: {
    marginTop: 14,
    marginHorizontal: 22,
    fontSize: 12.5,
    // 1.5 aquí, no la interlínea del cuerpo: el diseño le da aire a la nota.
    lineHeight: 18.75,
    color: color.ink500,
    fontFamily: familia,
  },
});
