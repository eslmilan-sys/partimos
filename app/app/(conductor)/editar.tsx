/**
 * `14d` Editar el viaje.
 *
 * Lo que un pasajero pagado ha cerrado se enseña **con candado y con el
 * motivo**, no escondido. Ocultar la hora y la ruta dejaría al conductor
 * pensando que puede cambiarlas y que la app se le resiste; enseñarlas
 * apagadas y decir quién las cerró explica el producto en una línea: cuando
 * alguien paga, deja de ser tu viaje sólo tuyo.
 *
 * Apagar «acepto maletas» con alguien que ya reservó con maleta se avisa en
 * **rojo**, porque no es un ajuste: es dejar en tierra el equipaje de alguien
 * que ya pagó.
 */

import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { useVolver } from '@/ui/salidas';
import Svg, { Path, Rect } from 'react-native-svg';

import { type Edicion, equipajeEnConflicto, guardarEdicion, prepararEdicion } from '@/servicios/panel';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { CampoRojo } from '@/ui/CampoRojo';
import { Boton, Interruptor, Stepper } from '@/ui/controles';
import { tabular } from '@/ui/dinero';
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
  const [maletas, setMaletas] = useState(true);
  const [mujeres, setMujeres] = useState(false);

  useEffect(() => {
    prepararEdicion(viajeId).then((e) => {
      setDatos(e);
      const p = e.campos.find((c) => c.clave === 'puestos');
      setPuestos(Number(p?.valor.split(' ')[0] ?? 3));
      setMaletas(e.campos.find((c) => c.clave === 'maletas')?.valor === 'Sí');
      setMujeres(e.campos.find((c) => c.clave === 'mujeres')?.valor === 'Sí');
    });
  }, [viajeId]);

  if (!datos) return <Cargando />;

  const cerrados = datos.campos.filter((c) => c.cerrado);
  const vendidos = datos.campos.find((c) => c.clave === 'puestos')?.valor.split('· ')[1] ?? '';
  const conflicto = equipajeEnConflicto(viajeId, maletas);

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
          </View>
        </View>

        <View style={estilos.tarjeta}>
          <View style={estilos.filaAbierta}>
            <Text style={estilos.etiqueta}>
              {'Puestos '}
              <Text style={estilos.etiquetaSuave}>{`· ${vendidos}`}</Text>
            </Text>
            <Stepper
              valor={puestos}
              alCambiar={setPuestos}
              min={1}
              max={4}
              etiquetaAccesible="Puestos que ofreces"
            />
          </View>

          <View style={estilos.filaInterruptor}>
            <Interruptor activo={maletas} alCambiar={setMaletas} etiqueta="Acepto maletas" />
          </View>

          <View style={estilos.filaInterruptorUltima}>
            <Interruptor activo={mujeres} alCambiar={setMujeres} etiqueta="Solo mujeres" />
          </View>
        </View>

        {/* Las dos pantallas que explican de dónde salen los números: el tope
            de la ruta y el reparto por puestos. Existían y no se llegaba a
            ellas desde ningún sitio de la app. */}
        <View style={estilos.explican}>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: '/(conductor)/puestos', params: { viaje: viajeId } })
            }
            style={({ pressed }) => [estilos.explica, pressed && { backgroundColor: color.sand200 }]}
          >
            <Text style={estilos.explicaTexto}>Cómo se reparte</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: '/(conductor)/tope', params: { puestos: String(puestos) } })
            }
            style={({ pressed }) => [estilos.explica, pressed && { backgroundColor: color.sand200 }]}
          >
            <Text style={estilos.explicaTexto}>El tope de la ruta</Text>
          </Pressable>
        </View>

        {/* Rojo, no gris: no es un ajuste, es dejar en tierra una maleta pagada. */}
        <View style={[estilos.nota, conflicto ? estilos.notaRoja : null]}>
          <Text style={[estilos.notaTexto, conflicto ? estilos.notaTextoRojo : null]}>
            {conflicto ?? 'Los cambios se avisan a quien ya tiene puesto.'}
          </Text>
        </View>
      </View>
      </ScrollView>

      <View style={estilos.pie}>
        <Boton
         
          alPulsar={async () => {
            await guardarEdicion(viajeId, { puestos, maletas, mujeres });
            volver();
          }}
        >
          Guardar
        </Boton>
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
      <Rect x={4.6} y={10.4} width={14.8} height={9.6} rx={2.4} stroke={color.ink500} strokeWidth={1.7} />
      <Path
        d="M8.2 10.4V7.8a3.8 3.8 0 0 1 7.6 0v2.6"
        stroke={color.ink500}
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
  etiquetaSuave: { fontWeight: '400', color: color.ink500 },
  valor: {
    fontSize: 12.5,
    lineHeight: 18.125,
    color: color.ink500,
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
  filaInterruptor: {
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  filaInterruptorUltima: {
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },

  explican: { flexDirection: 'row', gap: 9, marginTop: 12 },
  explica: {
    flex: 1,
    height: 48,
    borderRadius: radio.control,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
    backgroundColor: color.blanco,
    alignItems: 'center',
    justifyContent: 'center',
  },
  explicaTexto: {
    fontSize: 13.5,
    lineHeight: 19.5,
    fontWeight: '600',
    color: color.ink800,
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
  notaTexto: { fontSize: 12.5, lineHeight: 18.75, color: color.ink600, fontFamily: familia },
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
});
