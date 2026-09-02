/**
 * `14d` Editar el viaje — UNA pantalla, y contesta una sola pregunta:
 * *¿qué puedo cambiar todavía?*
 *
 * ── La reconstrucción del 02-09-2026 ─────────────────────────────────────
 *
 * El dueño la señaló con tres capturas: una tarjeta blanca VACÍA arriba,
 * campos que no se podían tocar sin motivo, y dos botones —«Cómo se
 * reparte», «El tope de la ruta»— que saltaban a pantallas del flujo de
 * PUBLICAR, una de ellas con su botón «Publicar» y todo. Editar un viaje
 * paseaba por tres pantallas y no dejaba editar ni la hora ni el aporte.
 *
 * Lo que había roto de raíz:
 * · La tarjeta vacía ERA la hoja de campos cerrados: sin nadie pagado no
 *   hay campos cerrados, y la hoja se dibujaba igual — vacía.
 * · La hora y el aporte, cuando estaban ABIERTOS, no se dibujaban en
 *   absoluto: el filtro sólo enseñaba lo cerrado.
 * · `guardarEdicion` escribía en la copia en memoria: contra la base, el
 *   guardado no guardaba (arreglado en `servicios/panel`).
 *
 * La regla de ahora: **mientras nadie haya pagado, se edita TODO aquí
 * mismo** — hora (la rueda de `5c`), aporte por puesto (con su techo:
 * tu parte del costo, la misma cuenta de publicar) y puestos (con el
 * suelo en los ya ocupados). Cuando alguien paga, la hora y el aporte se
 * enseñan con candado y con el motivo: cambiarle el precio o la hora a
 * quien ya pagó no es editar, es otro trato.
 *
 * «Solo mujeres» sólo se le ofrece a una conductora: un hombre
 * encendiéndolo se excluiría de su propio carro (pedido del dueño).
 */

import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { useVolver } from '@/ui/salidas';
import Svg, { Path, Rect } from 'react-native-svg';

import { aporteCalculado, APORTE_MINIMO_CENTAVOS } from '@/dominio/aporte';
import { type Edicion, guardarEdicion, prepararEdicion } from '@/servicios/panel';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { CampoRojo } from '@/ui/CampoRojo';
import { Boton, Interruptor, Stepper } from '@/ui/controles';
import { formatearDineroRedondo, tabular } from '@/ui/dinero';
import { ElegirHora } from '@/ui/ElegirHora';
import { cuando } from '@/ui/fechas';
import { Atras } from '@/ui/iconos';
import { color, espacio, familia, interlinea, radio, TRACK_MICRO, zonaDeToque } from '@/ui/tokens';

/** Sin parámetro de ruta —solo al abrir la pantalla suelta—, el del traspaso. */
const DEL_RECORRIDO = '55555555-5555-4555-8555-555555555555';

export default function Editar() {
  const router = useRouter();
  const volver = useVolver('/(conductor)/panel');
  const { viaje } = useLocalSearchParams<{ viaje?: string }>();
  const viajeId = viaje ?? DEL_RECORRIDO;
  const [datos, setDatos] = useState<Edicion | null>(null);
  const [puestos, setPuestos] = useState(3);
  const [mujeres, setMujeres] = useState(false);
  const [aporte, setAporte] = useState(0);
  const [hora, setHora] = useState('06:00');
  const [eligiendoHora, setEligiendoHora] = useState(false);
  /* EL FALLO SE QUEDA EN PANTALLA (02-09-2026, critique): guardar sin
     try/catch era el único botón del flujo conductor sin filet — en 4G, un
     rechazo dejaba la pantalla muda y el conductor creía haber guardado.
     El patrón es el de `carro.tsx`, que ya lo hacía bien. */
  const [guardando, setGuardando] = useState(false);
  const [falloGuardar, setFalloGuardar] = useState<string | null>(null);

  useEffect(() => {
    prepararEdicion(viajeId).then((e) => {
      setDatos(e);
      const p = e.campos.find((c) => c.clave === 'puestos');
      setPuestos(Number(p?.valor.split(' ')[0] ?? 3));
      setMujeres(e.campos.find((c) => c.clave === 'mujeres')?.valor === 'Sí');
      setAporte(e.aporteCentavos);
      setHora(e.campos.find((c) => c.clave === 'hora')?.valor ?? '06:00');
    });
  }, [viajeId]);

  if (!datos) return <Cargando />;

  const cerrados = datos.campos.filter((c) => c.cerrado);
  const vendidos = datos.campos.find((c) => c.clave === 'puestos')?.valor.split('· ')[1] ?? '';
  const conflicto: string | null = null;
  const cerrado = datos.seAvisa;

  /* El techo del aporte se mueve CON los puestos: es tu parte del costo con
     esa gente en el carro — la misma cuenta de `5c`. Bajar puestos sube el
     techo; subirlos puede morderlo, y entonces el aporte puesto se recorta
     solo, a la vista. */
  const techo = aporteCalculado(datos.costoCentavos, puestos, datos.topeCentavos);
  const suelo = Math.min(APORTE_MINIMO_CENTAVOS, techo);
  const aporteVigente = Math.min(aporte, techo);

  const cambiarPuestos = (n: number) => {
    setPuestos(n);
    setAporte((a) => Math.min(a, aporteCalculado(datos.costoCentavos, n, datos.topeCentavos)));
  };

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
          <Text style={estilos.epigrafeCampo} numberOfLines={1}>
            {`${cuando(datos.cuando)} · ${datos.ruta}`}
          </Text>
        </View>

        <Text style={estilos.titular}>
          {'Editar el '}
          <Text style={estilos.titularFuerte}>viaje</Text>
        </Text>
      </View>

      <View style={estilos.cuerpo}>
        {/* LO CERRADO, SÓLO CUANDO HAY ALGO CERRADO. Esta hoja se dibujaba
            siempre — con el viaje sin reservas quedaba una tarjeta blanca
            VACÍA arriba de todo (visto por el dueño el 02-09-2026). */}
        {cerrado ? (
          <View style={estilos.hoja}>
            {datos.aviso ? (
              <View style={estilos.avisoCerrado}>
                <Candado tamano={17} />
                <Text style={estilos.avisoTexto}>{datos.aviso}</Text>
              </View>
            ) : null}

            <View style={estilos.cerrados}>
              {cerrados.map((c) => (
                <View key={c.clave} style={estilos.filaCerrada}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={estilos.etiqueta}>{c.etiqueta}</Text>
                    <Text style={estilos.valor}>{c.valor}</Text>
                  </View>
                  <Candado tamano={16} />
                </View>
              ))}
              {/* El aporte también queda cerrado: cambiarle el precio a
                  quien ya pagó no es editar, es otro trato. */}
              <View style={estilos.filaCerrada}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={estilos.etiqueta}>Aporte por puesto</Text>
                  <Text style={estilos.valor}>{formatearDineroRedondo(datos.aporteCentavos)}</Text>
                </View>
                <Candado tamano={16} />
              </View>
            </View>
          </View>
        ) : null}

        <View style={estilos.tarjeta}>
          {/* La hora, con la misma rueda de publicar. Sólo mientras nadie
              haya pagado: después vive arriba, con su candado. */}
          {!cerrado ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Hora de salida, ${hora}. Cambiarla`}
              onPress={() => setEligiendoHora(true)}
              style={({ pressed }) => [
                estilos.filaAbierta,
                estilos.filaPrimera,
                pressed && { backgroundColor: color.sand100 },
              ]}
            >
              <Text style={estilos.etiqueta}>Hora de salida</Text>
              <Text style={[estilos.valorFuerte, tabular]}>{hora}</Text>
            </Pressable>
          ) : null}

          {/* El aporte, con su techo A LA VISTA: tu parte del costo con esa
              gente en el carro. Es la misma cuenta de `5c`, así que editar
              no puede ofrecer lo que publicar habría prohibido. */}
          {!cerrado ? (
            <View style={[estilos.filaAbierta, estilos.filaSigue]}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={estilos.etiqueta}>Aporte por puesto</Text>
                <Text style={estilos.pista}>{`Techo: ${formatearDineroRedondo(techo)} — tu parte del costo`}</Text>
              </View>
              <View style={estilos.pasos}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Bajar el aporte"
                  disabled={aporteVigente - 100 < suelo}
                  onPress={() => setAporte(Math.max(suelo, aporteVigente - 100))}
                  style={[estilos.paso, aporteVigente - 100 < suelo && estilos.pasoApagado]}
                >
                  <Text style={estilos.pasoTexto}>−</Text>
                </Pressable>
                <Text style={[estilos.cifraAporte, tabular]}>
                  {formatearDineroRedondo(aporteVigente)}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Subir el aporte"
                  disabled={aporteVigente + 100 > techo}
                  onPress={() => setAporte(Math.min(techo, aporteVigente + 100))}
                  style={[estilos.paso, aporteVigente + 100 > techo && estilos.pasoApagado]}
                >
                  <Text style={estilos.pasoTexto}>+</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          <View style={[estilos.filaAbierta, !cerrado && estilos.filaSigue]}>
            <Text style={estilos.etiqueta}>
              {'Puestos '}
              <Text style={estilos.etiquetaSuave}>{`· ${vendidos}`}</Text>
            </Text>
            <Stepper
              valor={puestos}
              alCambiar={cambiarPuestos}
              min={Math.max(1, datos.ocupados)}
              max={datos.puestosMax}
              etiquetaAccesible="Puestos que ofreces"
            />
          </View>

          {/* «Solo mujeres», sólo a una conductora: un hombre encendiéndolo
              se excluiría de su propio carro (02-09-2026). */}
          {datos.conductoraEsMujer ? (
            <View style={estilos.filaInterruptorUltima}>
              <Interruptor activo={mujeres} alCambiar={setMujeres} etiqueta="Solo mujeres" />
            </View>
          ) : null}
        </View>

        {/* Rojo, no gris: no es un ajuste, es dejar en tierra una maleta pagada. */}
        <View style={[estilos.nota, conflicto ? estilos.notaRoja : null]}>
          <Text style={[estilos.notaTexto, conflicto ? estilos.notaTextoRojo : null]}>
            {conflicto ??
              (cerrado
                ? 'Los cambios se avisan a quien ya tiene puesto.'
                : 'El aporte nunca pasa de tu parte del costo: aquí se comparten gastos, no se cobra pasaje.')}
          </Text>
        </View>
      </View>
      </ScrollView>

      <ElegirHora
        abierta={eligiendoHora}
        elegido={hora}
        alElegir={setHora}
        alCerrar={() => setEligiendoHora(false)}
      />

      <View style={estilos.pie}>
        {falloGuardar ? (
          <View style={estilos.fallo}>
            <Text style={estilos.falloTexto}>{falloGuardar}</Text>
          </View>
        ) : null}
        <Boton
          desactivado={guardando}
          alPulsar={async () => {
            setGuardando(true);
            setFalloGuardar(null);
            try {
              await guardarEdicion(viajeId, {
                puestos,
                mujeres: datos.conductoraEsMujer ? mujeres : undefined,
                aporteCentavos: cerrado ? undefined : aporteVigente,
                hora: cerrado ? undefined : hora,
              });
              volver();
            } catch (e) {
              const porque =
                e instanceof Error ? e.message : 'No se pudo guardar. Prueba otra vez.';
              setFalloGuardar(porque);
            } finally {
              setGuardando(false);
            }
          }}
        >
          {guardando ? 'Guardando…' : falloGuardar ? 'Intentar otra vez' : 'Guardar'}
        </Boton>
        {falloGuardar ? (
          <Text style={estilos.notaFallo}>Nada se perdió: lo que pusiste sigue aquí.</Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(ayuda)/cancelar')}
          style={zonaDeToque}
        >
          <Text style={estilos.cancelar}>Cancelar el viaje entero</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** El candado de lo que ya no se toca. */
function Candado({ tamano }: { tamano: number }) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Rect x={4.6} y={10.4} width={14.8} height={9.6} rx={2.4} stroke={color.ink600} strokeWidth={1.7} />
      <Path
        d="M8.2 10.4V7.8a3.8 3.8 0 0 1 7.6 0v2.6"
        stroke={color.ink600}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </Svg>
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

  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 4 },
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
    flex: 1,
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

  cuerpo: { paddingHorizontal: espacio.gutter, paddingTop: 20, paddingBottom: 8 },
  hoja: {
    backgroundColor: color.blanco,
    borderRadius: 28,
    padding: 18,
    shadowColor: 'rgb(120,10,30)',
    shadowOpacity: 0.28,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
    elevation: 6,
  },
  avisoCerrado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: color.sand100,
    borderRadius: radio.control,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  avisoTexto: { flex: 1, fontSize: 13.5, lineHeight: 18.85, color: color.ink700, fontFamily: familia },

  // Apagado y con candado, no escondido: si no se ve, no se entiende por qué.
  filaCerrada: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
    opacity: 0.55,
  },
  cerrados: { marginTop: 6 },
  etiqueta: {
    fontSize: 14,
    lineHeight: 21.025,
    fontWeight: '500',
    letterSpacing: -0.2175,
    color: color.ink900,
    fontFamily: familia,
  },
  etiquetaSuave: { fontWeight: '400', color: color.ink600 },
  valor: {
    fontSize: 12.5,
    lineHeight: 18.125,
    color: color.ink600,
    marginTop: 1,
    fontFamily: familia,
    ...tabular,
  },

  tarjeta: {
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    paddingTop: 6,
    paddingHorizontal: 18,
    paddingBottom: 10,
    marginTop: 10,
  },
  filaAbierta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
  },
  filaPrimera: { marginHorizontal: -18, paddingHorizontal: 18, borderTopLeftRadius: radio.l, borderTopRightRadius: radio.l },
  filaSigue: { borderTopWidth: 1, borderTopColor: color.bordeSutil },
  filaInterruptorUltima: {
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },

  /** La hora puesta, con el peso de un valor que se puede tocar. */
  valorFuerte: {
    fontSize: 16.5,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: -0.33,
    color: color.ink900,
    fontFamily: familia,
  },
  pista: {
    fontSize: 12,
    lineHeight: 17,
    color: color.ink600,
    marginTop: 2,
    fontFamily: familia,
    ...tabular,
  },

  /* El paso del aporte: dos círculos y la cifra, como el Stepper de al lado. */
  pasos: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  paso: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pasoApagado: { opacity: 0.35 },
  pasoTexto: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '500',
    color: color.ink800,
    fontFamily: familia,
  },
  cifraAporte: {
    minWidth: 56,
    textAlign: 'center',
    fontSize: 16.5,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: -0.33,
    color: color.ink900,
    fontFamily: familia,
  },

  nota: {
    backgroundColor: color.sand100,
    borderRadius: radio.l,
    paddingVertical: 15,
    paddingHorizontal: 18,
    marginTop: 18,
  },
  notaRoja: { backgroundColor: color.rojo50 },
  notaTexto: { fontSize: 12.5, lineHeight: 18.75, color: color.ink500, fontFamily: familia },
  notaTextoRojo: { color: color.rojo700 },

  pie: {
    backgroundColor: color.blanco,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
    paddingTop: 14,
    paddingHorizontal: espacio.gutter,
    paddingBottom: 26,
    gap: 10,
  },
  cancelar: {
    textAlign: 'center',
    fontSize: 13.5,
    lineHeight: interlinea(13.5),
    fontWeight: '600',
    color: color.rojo700,
    fontFamily: familia,
  },

  /** El motivo del fallo, escrito y quieto hasta que se reintente. */
  fallo: {
    backgroundColor: color.rojo100,
    borderRadius: radio.m,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  falloTexto: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '500',
    color: color.rojo700,
    fontFamily: familia,
  },
  notaFallo: {
    textAlign: 'center',
    fontSize: 12.5,
    lineHeight: interlinea(12.5),
    color: color.ink600,
    fontFamily: familia,
  },
});
