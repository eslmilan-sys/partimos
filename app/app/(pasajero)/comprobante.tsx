/**
 * `16c` El comprobante del pasajero — lo que pagó, y por qué esto no es una
 * factura.
 *
 * Partimos no vende un transporte: reparte el costo de uno que ya iba a
 * ocurrir. Un papel que se parezca a una factura convierte al conductor en
 * transportista, y eso es justo lo que la app no es. Por eso la frase «No es
 * una factura» va escrita en la pantalla, en el mismo cuerpo que el resto, y
 * no escondida en letra pequeña.
 *
 * El orden es el de la pregunta que trae quien abre esto: primero cuánto salió
 * —la cifra sola, con la pastilla de pagado al lado—, después de dónde sale esa
 * cifra —aporte y tarifa sumando el total, porque la tarifa es lo único que la
 * gente sospecha—, y sólo al final los datos del viaje, que son los que hacen
 * que el papel sirva para reclamar en el trabajo.
 *
 * La única hoja con sombra y brillo es la del total: las otras dos son fichas
 * con borde, para que la jerarquía se lea sin leer.
 *
 * No hay nada rojo debajo del campo. Compartir y guardar no son avanzar en un
 * flujo, son dos salidas del mismo peso, y por eso van las dos con contorno.
 */

import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { type Comprobante, comprobante } from '@/servicios/ayuda';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Brillo, CampoRojo } from '@/ui/CampoRojo';
import { Boton, Epigrafe, Pastilla } from '@/ui/controles';
import { formatearDinero, tabular } from '@/ui/dinero';
import { diaCorto, hora } from '@/ui/fechas';
import { Atras } from '@/ui/iconos';
import { color, espacio, familia, radio, sombra, texto } from '@/ui/tokens';

/** Mientras no haya sesión, la reserva pagada de Daniela en el Albrook → Chitré. */
const RESERVA = '77777777-7777-4777-8777-777777777700';

/** El ancho de la hoja del total, para que el brillo sepa dónde nace. */
const ANCHO_HOJA = 346;
const ALTO_HOJA = 104;

export default function ComprobantePasajero() {
  const router = useRouter();
  const [datos, setDatos] = useState<Comprobante | null>(null);

  useEffect(() => {
    comprobante(RESERVA).then(setDatos);
  }, []);

  if (!datos) return <View style={estilos.pantalla} />;

  const cuando = new Date(datos.cuando);
  const desglose = datos.desglose.filter((d) => !d.fuerte);
  const totales = datos.desglose.filter((d) => d.fuerte);

  /**
   * El comprobante en texto plano. Guardar un PDF de verdad pide un servicio
   * que todavía no existe, así que las dos salidas abren la misma hoja del
   * sistema: es donde viven tanto «Compartir» como «Imprimir» y «Guardar en
   * Archivos».
   */
  const compartir = () =>
    Share.share({
      title: `Partimos · ${datos.referencia}`,
      message: [
        `Comprobante ${datos.referencia}`,
        ...datos.desglose.map((d) => `${d.concepto}: ${formatearDinero(d.centavos)}`),
        ...datos.filas.map((f) => `${f.etiqueta}: ${f.valor}`),
        datos.queEsEsto,
      ].join('\n'),
    });

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
          <Text style={estilos.epigrafeCampo}>
            {`Viaje ${datos.referencia} · ${diaCorto(cuando)}`}
          </Text>
        </View>

        <Text style={estilos.titular}>
          {'Tu '}
          <Text style={texto.titularFuerte}>comprobante</Text>
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={estilos.cuerpo}
        showsVerticalScrollIndicator={false}
      >
        {/* La hoja del total: el brillo sube desde debajo del borde, así que recorta. */}
        <View style={estilos.hojaTotal}>
          <Brillo ancho={ANCHO_HOJA} alto={ALTO_HOJA} />

          <View style={estilos.filaTotal}>
            <Text style={estilos.cifra}>{formatearDinero(datos.totalCentavos)}</Text>
            <Pastilla estilo={estilos.pastillaPagado}>pagado</Pastilla>
          </View>

          <Text style={estilos.comoSePago}>
            {`${datos.pagadoCon} · ${datos.referencia} · ${diaCorto(cuando)}, ${hora(cuando)}`}
          </Text>
        </View>

        <View style={estilos.ficha}>
          <Epigrafe>El desglose</Epigrafe>

          <View style={estilos.cuentas}>
            {desglose.map((d, i) => (
              <View key={d.concepto} style={[estilos.filaCuenta, i > 0 && { marginTop: 10 }]}>
                <Text style={estilos.concepto}>{d.concepto}</Text>
                <Text style={estilos.importe}>{formatearDinero(d.centavos)}</Text>
              </View>
            ))}

            <View style={estilos.raya} />

            {totales.map((d) => (
              <View key={d.concepto} style={estilos.filaCuenta}>
                <Text style={estilos.conceptoFuerte}>{d.concepto}</Text>
                <Text style={estilos.importeFuerte}>{formatearDinero(d.centavos)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={estilos.fichaDatos}>
          {datos.filas.map((f) => (
            <View key={f.etiqueta} style={estilos.filaDato}>
              <Text style={estilos.etiqueta}>{f.etiqueta}</Text>
              <Text style={estilos.valor}>{f.valor}</Text>
            </View>
          ))}
        </View>

        <Text style={estilos.queEsEsto}>{datos.queEsEsto}</Text>
      </ScrollView>

      <View style={estilos.pie}>
        <View style={estilos.filaBotones}>
          <Boton tono="contorno" tamano="md" ancho alPulsar={compartir}>
            Compartir
          </Boton>
          <Boton tono="contorno" tamano="md" ancho alPulsar={compartir}>
            Guardar PDF
          </Boton>
        </View>
      </View>
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

  cuerpo: { paddingHorizontal: espacio.tarjeta, paddingTop: 20 },

  /* La hoja que monta sobre el campo rojo: 28 de radio, dos más que
     `radio.hoja`, como el resto de las pantallas de ayuda. */
  hojaTotal: {
    backgroundColor: color.blanco,
    borderRadius: 28,
    padding: 20,
    overflow: 'hidden',
    ...sombra.hoja,
  },
  filaTotal: { flexDirection: 'row', alignItems: 'flex-end', gap: 9 },
  cifra: {
    fontSize: 40,
    lineHeight: 35.2,
    fontWeight: '700',
    letterSpacing: -2,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  /* La pastilla se apoya en la línea base de la cifra, no en su caja. */
  pastillaPagado: { marginBottom: 7 },
  comoSePago: {
    marginTop: 9,
    fontSize: 13.5,
    lineHeight: 19.575,
    color: color.ink700,
    fontFamily: familia,
    ...tabular,
  },

  ficha: {
    marginTop: espacio.entreTarjetas,
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    padding: 18,
  },
  cuentas: { marginTop: 12 },
  filaCuenta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
  },
  concepto: { fontSize: 14.5, lineHeight: 21.025, color: color.ink700, fontFamily: familia },
  importe: {
    fontSize: 14.5,
    lineHeight: 21.025,
    fontWeight: '500',
    color: color.ink700,
    fontFamily: familia,
    ...tabular,
  },
  raya: { height: 1, backgroundColor: color.bordeSutil, marginTop: 14, marginBottom: 13 },
  conceptoFuerte: {
    fontSize: 14.5,
    lineHeight: 21.025,
    fontWeight: '600',
    color: color.ink900,
    fontFamily: familia,
  },
  importeFuerte: {
    fontSize: 14.5,
    lineHeight: 21.025,
    fontWeight: '700',
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },

  /* Las filas traen la raya arriba, no abajo: así la última no cierra la ficha
     con una línea suelta y el aire de abajo queda parejo. */
  fichaDatos: {
    marginTop: espacio.entreTarjetas,
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    paddingTop: 6,
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  filaDato: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  etiqueta: { fontSize: 13.5, lineHeight: 19.575, color: color.ink600, fontFamily: familia },
  valor: {
    flexShrink: 1,
    textAlign: 'right',
    fontSize: 13.5,
    lineHeight: 19.575,
    fontWeight: '500',
    letterSpacing: -0.162,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },

  queEsEsto: {
    marginTop: espacio.entreTarjetas,
    fontSize: 12.5,
    lineHeight: 18.75,
    color: color.ink500,
    fontFamily: familia,
  },

  pie: {
    backgroundColor: color.blanco,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
    paddingTop: 14,
    paddingHorizontal: espacio.gutter,
    paddingBottom: espacio.gutter,
  },
  filaBotones: { flexDirection: 'row', gap: 9 },
});
