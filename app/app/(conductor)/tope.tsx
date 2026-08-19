/**
 * `5d` El tope — la cifra sola en el campo y el reparto debajo.
 *
 * El tope es el mecanismo que impide que esto sea un taxi: nadie puede pedir
 * más que él y, aun pidiéndolo entero, nadie gana plata. Por eso la cifra va
 * enorme sobre el campo rojo y **sin un solo control al lado**: aquí no se
 * decide nada, se entiende. Quien quiera mover el aporte vuelve a `5c`.
 *
 * La hoja blanca hace la cuenta hasta el final —lo que cuesta el camino, entre
 * cuántos se reparte, lo que recuperas con el carro lleno y lo que aun así
 * pones tú—, y la última línea es la que sostiene el producto entero: si el
 * conductor recuperara el costo completo esto sería cobrar pasaje. Esa línea
 * se repite en palabras en la tarjeta de amanecer porque una resta no se
 * discute, pero tampoco se recuerda.
 */

import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { MARGEN_DESVIO_PCT, OCUPACION_DE_REFERENCIA, aporteCalculado } from '@/dominio/aporte';
import {
  type PublicacionPreparada,
  prepararPublicacion,
  repartoDelCosto,
} from '@/servicios/viajes';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Amanecer, CampoRojo } from '@/ui/CampoRojo';
import { Boton, Epigrafe } from '@/ui/controles';
import { formatearDinero, formatearDineroRedondo, tabular } from '@/ui/dinero';
import { Atras } from '@/ui/iconos';
import { color, espacio, familia, radio, sombra } from '@/ui/tokens';

/** Mientras no haya sesión, el conductor del recorrido del diseño. */
const CONDUCTOR = '11111111-1111-4111-8111-111111111111';
const RUTA = 'panama-chitre';
const SALIDA = '2026-11-14T14:50:00-05:00';

/** `--radius-sheet` son 28 px; `radio.hoja` se quedó en 26 y no se toca desde aquí. */
const RADIO_HOJA = 28;

/** El servicio devuelve el sitio entero —«Albrook · Terminal»—; el epígrafe del
 *  campo sólo quiere la ciudad, que es lo que cabe en una línea de 11 px. */
const ciudad = (etiqueta: string) => etiqueta.split('·')[0].trim();

export default function Tope() {
  const router = useRouter();
  // `5c` llega con los puestos que el conductor haya movido. Sin ellos, la
  // ocupación de referencia con la que el dominio calcula el tope de la ruta.
  const { puestos: puestosPedidos } = useLocalSearchParams<{ puestos?: string }>();
  const [datos, setDatos] = useState<PublicacionPreparada | null>(null);

  useEffect(() => {
    prepararPublicacion(CONDUCTOR, RUTA, SALIDA).then(setDatos);
  }, []);

  if (!datos) return <View style={estilos.pantalla} />;

  const puestos = Math.min(
    datos.puestosMaximos,
    Math.max(1, Number(puestosPedidos) || OCUPACION_DE_REFERENCIA),
  );
  // La cuenta de abajo es la del aporte que proponemos, no la del tope: el tope
  // es el techo, y enseñarlo repartido haría creer que hay que pedirlo.
  const aporte = aporteCalculado(datos.costoCentavos, puestos, datos.topeCentavos);
  const cuenta = repartoDelCosto(datos.costoCentavos, aporte, puestos);

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={250} />

      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <View style={estilos.filaCabecera}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atrás"
            onPress={() => router.back()}
            style={estilos.circulo}
          >
            <Atras />
          </Pressable>
          <Epigrafe tinta={color.campoTexto}>
            {`${ciudad(datos.origen)} → ${ciudad(datos.destino)} · ${puestos} puestos`}
          </Epigrafe>
        </View>

        <View style={estilos.filaCifra}>
          <Text style={estilos.cifra}>{formatearDineroRedondo(datos.topeCentavos)}</Text>
          <Text style={estilos.pieDeCifra}>{'tope por\npuesto'}</Text>
        </View>
      </View>

      <View style={estilos.cuerpo}>
        <View style={estilos.hoja}>
          <Epigrafe>El tope se calcula solo</Epigrafe>

          <View style={[estilos.fila, estilos.filaPrimera]}>
            <Text style={estilos.etiqueta}>Costo estimado del viaje</Text>
            <Text style={estilos.monto}>{formatearDinero(cuenta.costoCentavos)}</Text>
          </View>

          <View style={[estilos.fila, estilos.filaConLinea]}>
            <Text style={estilos.etiqueta}>{`Se divide entre ${puestos + 1} ocupantes`}</Text>
            <Text style={estilos.apunte}>tú incluido</Text>
          </View>

          <View style={[estilos.fila, estilos.filaConLinea]}>
            <Text style={estilos.etiquetaFuerte}>Recuperas con todo lleno</Text>
            <Text style={estilos.montoFuerte}>
              {formatearDineroRedondo(cuenta.recuperasCentavos)}
            </Text>
          </View>

          <View style={[estilos.fila, estilos.filaConLinea, estilos.filaUltima]}>
            <Text style={estilos.etiqueta}>Pones de tu bolsillo</Text>
            <Text style={estilos.monto}>{formatearDinero(cuenta.deTuBolsilloCentavos)}</Text>
          </View>
        </View>

        <View style={estilos.tarjetaFrase}>
          {/* El traspaso desborda el amanecer de la tarjeta y lo desenfoca 26 px,
              y ese desenfoque es lo que lo deja en un lavado y no en tres
              manchas. Sin filtro de desenfoque en React Native, el desborde se
              agranda hasta sacar los tres focos fuera de la tarjeta: dentro
              sólo entra su caída, que es lo que el desenfoque conseguía. */}
          <View style={estilos.amanecer} pointerEvents="none">
            <Amanecer ancho={486} alto={190} />
          </View>
          <Text style={estilos.frase}>
            {'Aunque llenes el carro, '}
            <Text style={estilos.fraseFuerte}>siempre pones parte del viaje</Text>
            {' — por eso esto es compartir gastos y no cobrar pasaje.'}
          </Text>
        </View>

        <Text style={estilos.nota}>
          {`Incluye gasolina, peajes y desgaste, más un margen del ${MARGEN_DESVIO_PCT} % por los desvíos de recogida.`}
        </Text>
      </View>

      <View style={estilos.pie}>
        {/* Entendido el tope, seguir adelante es volver a la publicación: los
            puestos y las maletas se dicen allí, no aquí. */}
        <Boton alPulsar={() => router.back()}>Proponer este viaje</Boton>
        <Text style={estilos.notaPie}>Puedes pedir menos, nunca más.</Text>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: color.sand100,
    maxWidth: 390,
    width: '100%',
    alignSelf: 'center',
    ...(Platform.OS === 'web' ? { height: 844, maxHeight: 844 } : null),
  },

  cabecera: { paddingHorizontal: espacio.gutter },
  filaCabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filaCifra: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: 22 },
  cifra: {
    fontSize: 58,
    // 0.9 del traspaso: la cifra manda tanto que su caja tiene que apretarla.
    lineHeight: 52.2,
    fontWeight: '700',
    letterSpacing: -2.9,
    color: color.blanco,
    fontFamily: familia,
    ...tabular,
  },
  pieDeCifra: {
    fontSize: 13.5,
    lineHeight: 17.55,
    color: color.campoTexto,
    paddingBottom: 7,
    fontFamily: familia,
  },

  cuerpo: { flex: 1, overflow: 'hidden', paddingHorizontal: 22, paddingTop: 30, paddingBottom: 152 },

  hoja: {
    backgroundColor: color.blanco,
    borderRadius: RADIO_HOJA,
    padding: 20,
    ...sombra.hoja,
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingTop: 12,
    paddingBottom: 12,
  },
  filaPrimera: { marginTop: 6, paddingTop: 14 },
  filaConLinea: { borderTopWidth: 1, borderTopColor: color.bordeSutil },
  filaUltima: { paddingBottom: 0 },
  etiqueta: { fontSize: 15, lineHeight: 21.75, color: color.ink700, fontFamily: familia },
  etiquetaFuerte: {
    fontSize: 15,
    lineHeight: 21.75,
    fontWeight: '500',
    color: color.ink900,
    fontFamily: familia,
  },
  apunte: { fontSize: 13.5, lineHeight: 19.575, color: color.ink500, fontFamily: familia },
  monto: {
    fontSize: 16,
    lineHeight: 23.2,
    fontWeight: '600',
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  montoFuerte: {
    fontSize: 18,
    lineHeight: 26.1,
    fontWeight: '700',
    letterSpacing: -0.54,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },

  tarjetaFrase: {
    marginTop: 10,
    backgroundColor: color.blanco,
    borderRadius: RADIO_HOJA,
    paddingVertical: 18,
    paddingHorizontal: 20,
    overflow: 'hidden',
    ...sombra.s,
  },
  amanecer: { position: 'absolute', left: -70, top: -30, width: 486, height: 190, opacity: 0.95 },
  frase: {
    maxWidth: 250,
    fontSize: 15,
    lineHeight: 21,
    color: color.ink900,
    fontFamily: familia,
  },
  fraseFuerte: { fontWeight: '600', fontFamily: familia },

  nota: {
    marginTop: 14,
    marginHorizontal: 4,
    fontSize: 12.5,
    lineHeight: 18.75,
    color: color.ink500,
    fontFamily: familia,
  },

  pie: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: color.blanco,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
    paddingTop: 16,
    paddingHorizontal: espacio.gutter,
    paddingBottom: 28,
    gap: 9,
    shadowColor: '#26232B',
    shadowOpacity: 0.18,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -10 },
    elevation: 10,
  },
  notaPie: {
    textAlign: 'center',
    fontSize: 12.5,
    lineHeight: 18.125,
    color: color.ink500,
    fontFamily: familia,
  },
});
