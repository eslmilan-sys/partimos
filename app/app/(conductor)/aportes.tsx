/**
 * `10b` Lo que te han aportado.
 *
 * «Aportado», no «ganado». El titular no va solo: debajo va la frase que le
 * da sentido —«3 viajes, 5 puestos. Es lo que has recuperado de la gasolina
 * de agosto»—, porque un número grande sin esa línea se lee como un sueldo,
 * y no lo es.
 *
 * Esa frase decía «la gasolina te sale casi cubierta» pasara lo que pasara,
 * también con un B/0 y cero viajes encima. Se calcula desde el 26-08-2026;
 * el porqué está en `servicios/aportes.ts`.
 *
 * El brillo cálido de la tarjeta es el mismo de las tarjetas de aporte: es la
 * única celebración que el producto se permite, y es tibia a propósito.
 */

import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { useVolver } from '@/ui/salidas';

import { type Aportes, type Tramo, aportes } from '@/servicios/aportes';
import { useMiIdOEntrar } from '@/servicios/sesion';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { CampoRojo, Brillo } from '@/ui/CampoRojo';
import { Epigrafe, Pastilla } from '@/ui/controles';
import { formatearDineroRedondo, tabular } from '@/ui/dinero';
import { Atras } from '@/ui/iconos';
import { color, espacio, familia, interlinea, radio, TRACK_MICRO, zonaDeToque } from '@/ui/tokens';

/** Sin sesión que preguntar —solo en simulado—, el conductor del traspaso. */
const DEL_RECORRIDO = '11111111-1111-4111-8111-111111111111';

export default function AportesPantalla() {
  const router = useRouter();
  const volver = useVolver('/(conductor)/panel');
  const yo = useMiIdOEntrar(DEL_RECORRIDO);
  const [tramo, setTramo] = useState<Tramo>('mes');
  const [datos, setDatos] = useState<Aportes | null>(null);

  useEffect(() => {
    if (!yo) return;
    aportes(yo, tramo).then(setDatos);
  }, [yo, tramo]);

  if (!datos) return <Cargando />;

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

      <CampoRojo altura={196} />

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
          <Text style={estilos.epigrafeCampo}>Conductor · dinero</Text>
        </View>

        <Text style={estilos.titular}>
          {'Te han '}
          <Text style={estilos.titularFuerte}>aportado</Text>
        </Text>
      </View>

      <View style={estilos.cuerpo}>
        <View style={estilos.hoja}>
          <Brillo ancho={346} alto={178} />

          <View style={estilos.tramos}>
            {(['mes', 'todo'] as const).map((t) => (
              <Pressable
                key={t}
                accessibilityRole="button"
                accessibilityState={{ selected: tramo === t }}
                onPress={() => setTramo(t)}
                style={[estilos.tramo, tramo === t ? estilos.tramoActivo : estilos.tramoQuieto]}
              >
                <Text style={[estilos.tramoTexto, tramo === t && estilos.tramoTextoActivo]}>
                  {t === 'mes' ? 'Este mes' : 'Todo'}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={estilos.filaTotal}>
            <Text style={estilos.total}>{formatearDineroRedondo(datos.totalCentavos)}</Text>
            <Pastilla estilo={{ marginBottom: 3 }}>{datos.periodo}</Pastilla>
          </View>

          <Text style={estilos.resumen}>{datos.resumen}</Text>
        </View>

        <View style={estilos.tarjeta}>
          <Epigrafe>Viaje por viaje</Epigrafe>

          {datos.viajes.map((v, i) => (
            <View key={v.id} style={[estilos.fila, i === 0 && { marginTop: 8 }]}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={estilos.ruta}>{v.ruta}</Text>
                <Text style={estilos.detalle}>{v.detalle}</Text>
              </View>
              <Text style={estilos.aporte}>{formatearDineroRedondo(v.centavos)}</Text>
            </View>
          ))}
        </View>

        <View style={estilos.envio}>
          <View style={estilos.marcaYappy}>
            <Text style={estilos.marcaYappyTexto}>Y</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={estilos.donde}>{datos.donde}</Text>
            <Text style={estilos.cadaCuando}>{datos.cadaCuando}</Text>
          </View>
          {/* «CAMBIAR» LLEVABA AL SITIO EQUIVOCADO. Esta tarjeta dice por
              dónde te LLEGA el dinero, y el enlace abría `9a`, la pantalla
              del PASAJERO para elegir cómo PAGA — con las tarifas de cada
              método, que el conductor no paga. Rol equivocado, pregunta
              equivocada, y de paso una cifra que asusta sin motivo.

              A dónde debería ir no existe todavía: no hay pantalla para el
              Yappy del conductor, ni columna donde guardarlo (`CLAUDE.md`,
              divergencias). Así que no se finge un ajuste que no hay — se
              ofrece el único camino real, que es escribirnos. Y en tinta:
              el rojo tiene cuatro sentidos y «cambiar un dato» no es
              ninguno (invariante 4). */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Este no es mi Yappy, escribirles"
            onPress={() => router.push('/(ayuda)')}
            style={zonaDeToque}
          >
            <Text style={estilos.cambiar}>¿No es tuyo?</Text>
          </Pressable>
        </View>
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

  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 6 },
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
    fontSize: 11.5,
    lineHeight: interlinea(11),
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.campoTexto,
    fontFamily: familia,
  },
  titular: { fontSize: 22, lineHeight: 26, letterSpacing: -0.77, fontWeight: '600', color: color.ink900, fontFamily: familia, marginTop: 12, },
  titularFuerte: { fontWeight: '600' },

  cuerpo: { paddingHorizontal: espacio.gutter, paddingTop: 22, paddingBottom: 20 },
  hoja: {
    backgroundColor: color.blanco,
    borderRadius: 28,
    padding: 22,
    overflow: 'hidden',
    shadowColor: 'rgb(120,10,30)',
    shadowOpacity: 0.28,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
    elevation: 6,
  },

  tramos: { flexDirection: 'row', gap: 7 },
  tramo: {
    borderRadius: radio.pastilla,
    paddingHorizontal: 13,
    alignItems: 'center',
    ...zonaDeToque,
  },
  tramoActivo: { backgroundColor: color.azul500 },
  tramoQuieto: { backgroundColor: color.sand200 },
  tramoTexto: {
    fontSize: 12.5,
    lineHeight: 18.125,
    fontWeight: '600',
    color: color.ink700,
    fontFamily: familia,
  },
  tramoTextoActivo: { color: '#fff' },

  filaTotal: { flexDirection: 'row', alignItems: 'flex-end', gap: 9, marginTop: 16 },
  // 44 px: el número es el titular de verdad de esta pantalla.
  total: {
    fontSize: 44,
    lineHeight: 38.72,
    fontWeight: '700',
    letterSpacing: -2.2,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  resumen: {
    fontSize: 13.5,
    lineHeight: interlinea(13.5),
    color: color.ink700,
    marginTop: 10,
    fontFamily: familia,
  },

  tarjeta: {
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    padding: 20,
    marginTop: 11,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  ruta: {
    fontSize: 14,
    lineHeight: 21.025,
    fontWeight: '500',
    letterSpacing: -0.2175,
    color: color.ink900,
    fontFamily: familia,
  },
  detalle: {
    fontSize: 12.5,
    lineHeight: 18.125,
    color: color.ink600,
    fontFamily: familia,
    ...tabular,
  },
  aporte: {
    fontSize: 15.5,
    lineHeight: 23.2,
    fontWeight: '700',
    letterSpacing: -0.48,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },

  envio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    paddingVertical: 15,
    paddingHorizontal: 18,
    marginTop: 11,
  },
  marcaYappy: {
    width: 34,
    height: 34,
    borderRadius: radio.cuadrado,
    backgroundColor: color.azul100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marcaYappyTexto: {
    fontSize: 15.5,
    lineHeight: interlinea(15),
    fontWeight: '700',
    color: color.azul700,
    fontFamily: familia,
  },
  donde: {
    fontSize: 14,
    lineHeight: 21.025,
    fontWeight: '500',
    letterSpacing: -0.2175,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  cadaCuando: { fontSize: 12.5, lineHeight: 18.125, color: color.ink600, fontFamily: familia },
  cambiar: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    // Tinta, no rojo: el rojo agita, y esto es un enlace de apoyo.
    color: color.azul700,
    fontFamily: familia,
  },
});
