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

import { useRouter } from 'expo-router';
import Svg, { Path, Rect } from 'react-native-svg';

import { type Edicion, equipajeEnConflicto, guardarEdicion, prepararEdicion } from '@/servicios/panel';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { CampoRojo } from '@/ui/CampoRojo';
import { Boton, Interruptor, Stepper } from '@/ui/controles';
import { tabular } from '@/ui/dinero';
import { cuando } from '@/ui/fechas';
import { Atras } from '@/ui/iconos';
import { TRACK_MICRO, familia, color, espacio, interlinea, radio } from '@/ui/tokens';

const VIAJE = '55555555-5555-4555-8555-555555555555';

export default function Editar() {
  const router = useRouter();
  const [datos, setDatos] = useState<Edicion | null>(null);
  const [puestos, setPuestos] = useState(3);
  const [maletas, setMaletas] = useState(true);
  const [mujeres, setMujeres] = useState(false);

  useEffect(() => {
    prepararEdicion(VIAJE).then((e) => {
      setDatos(e);
      const p = e.campos.find((c) => c.clave === 'puestos');
      setPuestos(Number(p?.valor.split(' ')[0] ?? 3));
      setMaletas(e.campos.find((c) => c.clave === 'maletas')?.valor === 'Sí');
      setMujeres(e.campos.find((c) => c.clave === 'mujeres')?.valor === 'Sí');
    });
  }, []);

  if (!datos) return <View style={estilos.pantalla} />;

  const cerrados = datos.campos.filter((c) => c.cerrado);
  const vendidos = datos.campos.find((c) => c.clave === 'puestos')?.valor.split('· ')[1] ?? '';
  const conflicto = equipajeEnConflicto(VIAJE, maletas);

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={196} />
      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <View style={estilos.filaSuperior}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atrás"
            onPress={() => router.back()}
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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={estilos.cuerpo}
        showsVerticalScrollIndicator={false}
      >
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

        {/* Rojo, no gris: no es un ajuste, es dejar en tierra una maleta pagada. */}
        <View style={[estilos.nota, conflicto ? estilos.notaRoja : null]}>
          <Text style={[estilos.notaTexto, conflicto ? estilos.notaTextoRojo : null]}>
            {conflicto ?? 'Los cambios se avisan a quien ya tiene puesto.'}
          </Text>
        </View>
      </ScrollView>

      <View style={estilos.pie}>
        <Boton
          tono="azul"
          alPulsar={async () => {
            await guardarEdicion(VIAJE, { puestos, maletas, mujeres });
            router.back();
          }}
        >
          Guardar
        </Boton>
        <Pressable accessibilityRole="button" onPress={() => router.push('/(ayuda)/cancelar')}>
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
    maxWidth: 390,
    width: '100%',
    alignSelf: 'center',
    ...(Platform.OS === 'web' ? { height: 844, maxHeight: 844 } : null),
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
  titularFuerte: { fontWeight: '600' },

  cuerpo: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 8 },
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
  avisoTexto: { flex: 1, fontSize: 13, lineHeight: 18.85, color: color.ink700, fontFamily: familia },

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
    fontSize: 14.5,
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
