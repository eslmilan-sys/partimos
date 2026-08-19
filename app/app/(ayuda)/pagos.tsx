/**
 * `16b` Cómo se paga — los tres números y el reloj del dinero.
 *
 * La tarifa es lo único de Partimos que la gente sospecha, así que la pantalla
 * empieza por ahí: el aporte, la tarifa y el tope, los tres a la vez y del
 * mismo tamaño. Enseñar el tope junto al aporte es lo que hace creíble la
 * frase que va debajo —nadie gana dinero con esto—, porque el tope es
 * justamente el techo que impide que esto se vuelva un taxi.
 *
 * La segunda pregunta no es cuánto sino **cuándo**, y esa no se contesta con
 * un párrafo: se contesta con un reloj de cuatro pasos, uno por cada vez que
 * el dinero cambia de sitio. El azul marca el segundo, el único paso donde el
 * dinero se mueve de verdad; los otros tres se leen desde ahí.
 *
 * Y no hay letra pequeña: lo de la tarjeta y el efectivo va al pie, fuera de
 * las hojas, en el mismo cuerpo que el resto de la pantalla. Por eso el
 * epígrafe del campo rojo puede prometerlo.
 *
 * Todo el color de acento dentro de las hojas blancas es azul. El rojo se
 * queda en el campo de arriba y no vuelve a aparecer: aquí no hay nada que
 * pulsar salvo volver.
 */

import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { NOMBRE_DEL_CANAL } from '@/dominio/tarifas';
import { type ComoSePaga, comoSePaga } from '@/servicios/ayuda';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Brillo, CampoRojo } from '@/ui/CampoRojo';
import { formatearDineroRedondo, tabular } from '@/ui/dinero';
import { Atras } from '@/ui/iconos';
import { color, espacio, familia, radio, sombra, texto } from '@/ui/tokens';

// El Albrook → Chitré, el viaje de referencia del traspaso: de él salen el
// aporte y el tope que ilustran la explicación mientras no haya sesión.
const VIAJE = '55555555-5555-4555-8555-555555555555';

/**
 * Un rótulo de dos líneas fijas. El salto va en su propio `Text`, igual que el
 * `<br>` del traspaso: no forma parte de la cadena del rótulo.
 */
function Rotulo({ lineas }: { lineas: string }) {
  const [arriba, abajo] = lineas.split('\n');
  return (
    <Text style={estilos.rotulo}>
      {arriba}
      <Text>{'\n'}</Text>
      {abajo}
    </Text>
  );
}

/** El paso en el que el dinero sale del pasajero. El resto del reloj se lee desde él. */
const DONDE_SE_RETIENE = 1;

/** El espacio duro entre la cifra y el signo, el mismo que usa `@/ui/dinero`. */
const DURO = ' ';

export default function Pagos() {
  const router = useRouter();
  const [datos, setDatos] = useState<ComoSePaga | null>(null);

  useEffect(() => {
    comoSePaga(VIAJE).then(setDatos);
  }, []);

  if (!datos) return <View style={estilos.pantalla} />;

  // Los rótulos parten en dos líneas fijas, no por ancho: así las tres
  // columnas cierran a la misma altura aunque digan cosas de largo distinto.
  const numeros = [
    { cifra: formatearDineroRedondo(datos.aporteCentavos), rotulo: 'aporte por\npuesto' },
    { cifra: `${datos.tarifaPct}${DURO}%`, rotulo: `tarifa con\n${NOMBRE_DEL_CANAL.yappy_app}` },
    { cifra: formatearDineroRedondo(datos.topeCentavos), rotulo: 'tope de\nla ruta' },
  ];

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={206} />
      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <View style={estilos.filaVolver}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atrás"
            onPress={() => router.back()}
            style={estilos.circulo}
          >
            <Atras />
          </Pressable>
          <Text style={estilos.epigrafeCampo}>Sin letra pequeña</Text>
        </View>

        <Text style={estilos.titular}>
          {'Cómo se '}
          <Text style={texto.titularFuerte}>paga</Text>
        </Text>
      </View>

      <View style={estilos.tarjetaNumeros}>
        {/* El brillo sube desde debajo del borde inferior, así que la tarjeta recorta. */}
        <Brillo ancho={346} alto={192} />

        <View style={estilos.filaNumeros}>
          {numeros.map((n) => (
            <View key={n.rotulo} style={estilos.numero}>
              <Text style={estilos.cifra}>{n.cifra}</Text>
              <Rotulo lineas={n.rotulo} />
            </View>
          ))}
        </View>

        <Text style={estilos.porque}>{datos.porque}</Text>
      </View>

      <View style={estilos.tarjetaReloj}>
        <Text style={estilos.epigrafeReloj}>Cuándo se mueve el dinero</Text>

        <View style={estilos.pasos}>
          {datos.reloj.map((paso, i) => {
            const marcado = i === DONDE_SE_RETIENE;
            return (
              <View key={paso.titulo} style={estilos.paso}>
                <View style={[estilos.insignia, marcado && estilos.insigniaMarcada]}>
                  <Text style={[estilos.insigniaTexto, marcado && estilos.insigniaTextoMarcada]}>
                    {i + 1}
                  </Text>
                </View>
                <View style={estilos.pasoColumna}>
                  <Text style={estilos.pasoTitulo}>{paso.titulo}</Text>
                  <Text style={estilos.pasoTexto}>{paso.texto}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <Text style={estilos.letraChica}>{datos.letraChica}</Text>
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

  cabecera: { paddingTop: 4, paddingHorizontal: espacio.gutter },
  filaVolver: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  circulo: {
    width: espacio.controlS,
    height: espacio.controlS,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  epigrafeCampo: { ...texto.epigrafe, color: color.campoTexto },
  titular: { ...texto.titular, color: color.blanco, marginTop: 12 },

  /* La hoja que monta sobre el campo rojo: 28 de radio, dos más que
     `radio.hoja`, como el resto de las pantallas de ayuda. */
  tarjetaNumeros: {
    marginTop: 20,
    marginHorizontal: espacio.tarjeta,
    backgroundColor: color.blanco,
    borderRadius: 28,
    padding: 20,
    overflow: 'hidden',
    ...sombra.hoja,
  },
  filaNumeros: { flexDirection: 'row', gap: 14 },
  numero: { flex: 1 },
  cifra: {
    fontSize: 29,
    // Interlineado 0,9: las tres cifras son una sola línea y el rótulo sube
    // a pegarse a ellas. Con el 1,45 del cuerpo la tarjeta crece 8 px.
    lineHeight: 26.1,
    fontWeight: '700',
    letterSpacing: -1.305,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  rotulo: {
    fontSize: 12,
    lineHeight: 16.2,
    color: color.ink600,
    marginTop: 5,
    fontFamily: familia,
  },
  porque: {
    fontSize: 13,
    lineHeight: 19.5,
    color: color.ink700,
    marginTop: 15,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
    fontFamily: familia,
  },

  /* La tarjeta del reloj va con borde y sin sombra: explica, no monta. */
  tarjetaReloj: {
    marginTop: espacio.entreTarjetas,
    marginHorizontal: espacio.tarjeta,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderRadius: radio.l,
    padding: 18,
  },
  epigrafeReloj: { ...texto.epigrafe, color: color.azul500 },

  pasos: { marginTop: 13 },
  paso: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', paddingBottom: 14 },
  insignia: {
    width: 18,
    height: 18,
    borderRadius: radio.pastilla,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.blanco,
    borderWidth: 2,
    borderColor: color.bordePorDefecto,
  },
  insigniaMarcada: { backgroundColor: color.azul500, borderWidth: 0 },
  insigniaTexto: {
    fontSize: 10,
    lineHeight: 14.5,
    fontWeight: '700',
    color: color.ink500,
    fontFamily: familia,
    ...tabular,
  },
  insigniaTextoMarcada: { color: color.blanco },

  pasoColumna: { flex: 1, minWidth: 0 },
  pasoTitulo: { ...texto.fila, color: color.ink900 },
  pasoTexto: {
    fontSize: 12.5,
    lineHeight: 17.5,
    color: color.ink600,
    marginTop: 2,
    fontFamily: familia,
  },

  /* Fuera de las hojas y en el mismo cuerpo que el resto: si estuviera dentro
     y más chica sería exactamente la letra pequeña que el epígrafe niega. */
  letraChica: {
    marginTop: espacio.entreTarjetas,
    marginHorizontal: espacio.tarjeta,
    fontSize: 12.5,
    lineHeight: 18.75,
    color: color.ink600,
    fontFamily: familia,
  },
});
