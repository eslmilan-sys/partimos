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
 * ── La pasada del 30-08-2026 ─────────────────────────────────────────────
 *
 * El dueño: «ver histórico leads to yappy after, it's weirdly designed.
 * Focus on a simple yet very useful perfil page». Lo que había:
 *
 * 1. **Una tarjeta de Yappy que no decía nada.** Una «Y», «Yappy · 7788» y
 *    «Se envía cada lunes». Ni cuánto, ni cuándo, ni de qué viajes: después
 *    del histórico aparecía una marca de banco sin venir a cuento. Ahora
 *    esa tarjeta es **el envío que está pendiente de verdad** —la cifra, la
 *    semana que cubre y el lunes en que sale—, que ya estaba calculado en
 *    `proximoEnvio` y no lo leía nadie.
 *
 * 2. **Y lo que NO llega por ahí no se decía en ninguna parte.** El dinero
 *    de este producto va de la mano a la mano; sólo pasa por un envío
 *    semanal lo que el pasajero eligió pagar dentro de la app. Sin esa
 *    frase, un conductor que cobró en efectivo se queda esperando un lunes
 *    que no le toca.
 *
 * 3. **El histórico no decía cuándo.** «Chitré → Albrook · 2 puestos ·
 *    B/12», sin fecha: en un histórico, la fecha no es un adorno, es la
 *    mitad de la línea.
 *
 * El brillo cálido de la tarjeta es el mismo de las tarjetas de aporte: es la
 * única celebración que el producto se permite, y es tibia a propósito.
 */

import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { useVolver } from '@/ui/salidas';

import { type Aportes, type Tramo, aportes, proximoEnvio } from '@/servicios/aportes';
import { useMiIdOEntrar } from '@/servicios/sesion';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { CampoRojo, Brillo } from '@/ui/CampoRojo';
import { Epigrafe, Pastilla } from '@/ui/controles';
import { formatearDineroRedondo, tabular } from '@/ui/dinero';
import { mesAbrev, mesLargo, numeroDeDia } from '@/ui/fechas';
import { Atras } from '@/ui/iconos';
import { Pestanas } from '@/ui/Pestanas';
import { color, espacio, familia, interlinea, radio, TRACK_MICRO, zonaDeToque } from '@/ui/tokens';

/** Sin sesión que preguntar —solo en simulado—, el conductor del traspaso. */
const DEL_RECORRIDO = '11111111-1111-4111-8111-111111111111';

/** Lo que `proximoEnvio` devuelve, sin volver a escribir la forma a mano. */
type Envio = Awaited<ReturnType<typeof proximoEnvio>>;

export default function AportesPantalla() {
  const router = useRouter();
  const volver = useVolver('/(conductor)/panel');
  const yo = useMiIdOEntrar(DEL_RECORRIDO);
  const [tramo, setTramo] = useState<Tramo>('mes');
  const [datos, setDatos] = useState<Aportes | null>(null);
  const [envio, setEnvio] = useState<Envio>(null);

  useEffect(() => {
    if (!yo) return;
    aportes(yo, tramo).then(setDatos);
  }, [yo, tramo]);

  /* El envío no depende del tramo que se esté mirando: es uno, el de esta
     semana. Se pide aparte para que cambiar de «Este mes» a «Todo» no lo
     vuelva a pedir. */
  useEffect(() => {
    if (!yo) return;
    proximoEnvio(yo).then(setEnvio);
  }, [yo]);

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
          {'Aportes y '}
          <Text style={estilos.titularFuerte}>pagos</Text>
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

        {/* LO QUE ESTÁ EN CAMINO, antes del histórico: es la única cifra de
            esta pantalla sobre la que todavía puede pasar algo. El histórico
            es pasado; esto es el lunes que viene. */}
        <View style={estilos.envio}>
          <View style={estilos.cabeceraEnvio}>
            <View style={estilos.marcaYappy}>
              <Text style={estilos.marcaYappyTexto}>Y</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={estilos.epigrafeEnvio}>En camino a tu Yappy</Text>
              {/* Los puntos VAN FUERA de las cifras tabulares: con
                  `tabular-nums` el punto medio se estira a la anchura de un
                  dígito y «···7788» sale como «· · · 7788». */}
              <Text style={estilos.dondeCae}>
                {datos.yappy ? (
                  <>
                    <Text style={estilos.puntosDelYappy}>···</Text>
                    <Text style={tabular}>{datos.yappy}</Text>
                  </>
                ) : (
                  'Sin número guardado'
                )}
              </Text>
            </View>
            {envio ? (
              <Text style={[estilos.cifraEnvio, tabular]}>
                {formatearDineroRedondo(envio.centavos)}
              </Text>
            ) : null}
          </View>

          <Text style={estilos.cuandoLlega}>
            {envio
              ? `De tus viajes ${entreDosDias(envio.desde, envio.hasta)}. ${
                  envio.enviado ? 'Ya salió: llega en el día.' : 'Sale el lunes.'
                }`
              : 'Nada en camino esta semana.'}
          </Text>

          {/* LA REGLA, EN UNA FRASE (01-09-2026, «make this page simpler»):
              eran dos renglones y medio de contabilidad. Lo que hay que
              saber cabe en uno — el efectivo ya lo tienes en la mano. */}
          <Text style={estilos.soloLoDeLaApp}>
            Aquí sólo llega lo pagado dentro de la app; el efectivo ya lo tienes en la mano.
          </Text>

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
            accessibilityLabel={
              datos.yappy ? 'Este no es mi Yappy, escribirles' : 'Darles mi número de Yappy'
            }
            onPress={() => router.push('/(ayuda)')}
            style={({ pressed }) => [estilos.enlaceYappy, zonaDeToque, pressed && { backgroundColor: color.lavado }]}
          >
            {/* CON PINTA DE BOTÓN (01-09-2026): era una línea de texto azul
                que nadie leía como pulsable, y guardar el número es lo único
                que esta tarjeta pide hacer. */}
            <Text style={estilos.cambiar}>
              {datos.yappy ? '¿No es tuyo? Escríbenos' : 'Guardar mi número de Yappy'}
            </Text>
          </Pressable>
        </View>

        <View style={estilos.tarjeta}>
          <Epigrafe>Viaje por viaje</Epigrafe>

          {datos.viajes.length === 0 ? (
            <Text style={estilos.sinViajes}>
              {tramo === 'mes'
                ? 'Este mes todavía no. Cambia a «Todo» para ver los anteriores.'
                : 'Aquí aparecerá cada viaje en cuanto alguien se suba.'}
            </Text>
          ) : (
            datos.viajes.map((v, i) => (
              <View key={v.id} style={[estilos.fila, i === 0 && estilos.primeraFila]}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={estilos.ruta} numberOfLines={1}>
                    {v.ruta}
                  </Text>
                  {/* LA FECHA, que faltaba. En un histórico es la mitad de la
                      línea: sin ella, tres viajes de la misma ruta son tres
                      renglones idénticos. */}
                  <Text style={estilos.detalle}>
                    {[elDia(v.cuando), v.detalle].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <Text style={estilos.aporte}>{formatearDineroRedondo(v.centavos)}</Text>
              </View>
            ))
          )}
        </View>
      </View>
      </ScrollView>

      {/* LA BARRA SE QUEDA (01-09-2026, pedido del dueño: «the menu shall
          always be present»). Esta pantalla se abre desde Perfil y no tiene
          acción propia abajo: sin la barra, volver al resto de la app
          costaba un «atrás» que nadie debe adivinar. */}
      <Pestanas valor="Perfil" yo={yo} />
    </View>
  );
}

/** «26 ago» — corto, porque va detrás del nombre de la ruta. */
function elDia(cuando: string): string {
  return `${numeroDeDia(cuando)} ${mesAbrev(cuando).toLowerCase()}`;
}

/**
 * «del 24 al 31 de agosto» — y «del 28 de agosto al 3 de septiembre» cuando
 * la semana cruza de mes, que es justo el caso donde decir el mes una sola
 * vez engaña.
 */
function entreDosDias(desde: string, hasta: string): string {
  const mesA = mesLargo(desde);
  const mesB = mesLargo(hasta);
  return mesA === mesB
    ? `del ${numeroDeDia(desde)} al ${numeroDeDia(hasta)} de ${mesB}`
    : `del ${numeroDeDia(desde)} de ${mesA} al ${numeroDeDia(hasta)} de ${mesB}`;
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

  cuerpo: { paddingHorizontal: espacio.gutter, paddingTop: 22, paddingBottom: 110 },
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
  /* La primera fila no lleva raya: una raya justo debajo del epígrafe pinta
     un renglón vacío entre el rótulo y su lista. */
  primeraFila: { marginTop: 4, borderTopWidth: 0 },
  mas: {
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    marginTop: 11,
    paddingHorizontal: 18,
  },
  filaMas: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 },
  filaMasPartida: { borderBottomWidth: 1, borderBottomColor: color.bordeSutil },
  pulsadaMas: { backgroundColor: color.lavado },
  filaMasEtiqueta: {
    flex: 1,
    fontSize: 14.5,
    lineHeight: 21,
    fontWeight: '500',
    color: color.ink900,
    fontFamily: familia,
  },
  filaMasValor: { fontSize: 13.5, lineHeight: 19, color: color.ink600, fontFamily: familia },
  sinViajes: {
    marginTop: 8,
    fontSize: 13.5,
    lineHeight: interlinea(13.5),
    color: color.ink600,
    fontFamily: familia,
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
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginTop: 11,
  },
  cabeceraEnvio: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  epigrafeEnvio: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.ink600,
    fontFamily: familia,
  },
  dondeCae: {
    fontSize: 15.5,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: color.ink900,
    fontFamily: familia,
  },
  /* El punto medio de Switzer trae mucho aire a los lados: sin apretarlo,
     «···7788» se lee «· · · 7788», como si el número tuviera espacios. */
  puntosDelYappy: { letterSpacing: -2.5 },
  cifraEnvio: {
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '700',
    letterSpacing: -0.7,
    color: color.ink900,
    fontFamily: familia,
  },
  cuandoLlega: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: interlinea(13),
    color: color.ink700,
    fontFamily: familia,
  },
  soloLoDeLaApp: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
    fontSize: 12,
    lineHeight: 17,
    color: color.ink600,
    fontFamily: familia,
  },
  enlaceYappy: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 14,
    borderRadius: radio.pastilla,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
    backgroundColor: color.blanco,
    justifyContent: 'center',
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
