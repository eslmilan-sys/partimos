/**
 * `1i` Llegada — el código cierra el viaje y libera el aporte.
 *
 * Es el segundo código: el conductor lo teclea al bajarte y ese tecleo suelta
 * el aporte retenido. La cuenta de abajo dice en voz alta que Partimos no se
 * queda nada del aporte: la tarifa se cobró aparte, al reservar.
 */

import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { type Llegada, resumenDeLlegada } from '@/servicios/abordaje';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { NoEsta } from '@/ui/NoEsta';
import { Amanecer, CampoRojo } from '@/ui/CampoRojo';
import { Boton, Epigrafe, Pastilla } from '@/ui/controles';
import { formatearDineroRedondo, tabular } from '@/ui/dinero';
import { hora } from '@/ui/fechas';
import { TRACK_MICRO, familia, color, espacio, radio } from '@/ui/tokens';

/** Sin parámetro de ruta —solo al abrir la pantalla suelta—, la del traspaso. */
const DEL_RECORRIDO = '77777777-7777-4777-8777-777777777710';

export default function LlegadaPantalla() {
  const router = useRouter();
  const { reserva } = useLocalSearchParams<{ reserva?: string }>();
  const reservaId = reserva ?? DEL_RECORRIDO;
  const [datos, setDatos] = useState<Llegada | null>(null);
  /* «Todavía no lo sé» y «no está» no son lo mismo: lo segundo dura para
     siempre, y en blanco no hay ni por dónde salir. */
  const [noEsta, setNoEsta] = useState(false);

  useEffect(() => {
    resumenDeLlegada(reservaId).then(setDatos).catch(() => setNoEsta(true));
  }, [reservaId]);

  if (noEsta) return <NoEsta />;
  if (!datos) return <Cargando />;

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={214} motivo="hibisco" />

      <BarraDeEstado hora={hora(datos.llegadaHora)} />

      <View style={estilos.cabecera}>
        <Text style={estilos.epigrafeCampo}>{`Llegaste · ${hora(datos.llegadaHora)}`}</Text>
        <Text style={estilos.titular}>
          {datos.ciudad}
          {'\n'}
          <Text style={estilos.titularFuerte}>{datos.lugar}</Text>
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={estilos.cuerpo}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.hoja}>
          <Epigrafe>Código de llegada</Epigrafe>
          <View style={estilos.digitos}>
            {datos.digitos.map((d, i) => (
              <View key={`${d}-${i}`} style={estilos.digito}>
                <Text style={estilos.digitoTexto}>{d}</Text>
              </View>
            ))}
          </View>
          <Text style={estilos.explicacion}>
            {`${datos.conductor} lo teclea al bajarte. Ese tecleo cierra el viaje y suelta el aporte, así nadie tiene que reclamar nada después.`}
          </Text>
        </View>

        <View style={estilos.tarjetaLiberacion}>
          <Amanecer />
          <Epigrafe tinta={color.ink700}>Se libera al cerrar</Epigrafe>
          <View style={estilos.filaCifra}>
            <Text style={estilos.cifra}>{formatearDineroRedondo(datos.aporteCentavos)}</Text>
            <Pastilla fondo={color.blanco} tinta={color.ink900} estilo={{ marginTop: 4 }}>
              {`completo a ${datos.conductor}`}
            </Pastilla>
          </View>
          <Text style={estilos.frase}>
            {'Le llega a '}
            <Text style={estilos.fraseFuerte}>{datos.destinoDelDinero}</Text>
            {' en cuanto el viaje se cierre. Partimos no se queda nada del aporte.'}
          </Text>
          <View style={{ marginTop: 20 }}>
            <Boton
              tamano="md"
              alPulsar={() =>
                router.push({
                  pathname: '/(pasajero)/comprobante',
                  params: { reserva: reservaId },
                })
              }
            >
              Ver el recibo
            </Boton>
          </View>
        </View>

        <View style={estilos.tarjetaCuenta}>
          <View style={estilos.filaCuenta}>
            <Text style={estilos.cuentaEtiqueta}>Aporte del puesto</Text>
            <Text style={estilos.cuentaMonto}>
              {formatearDineroRedondo(datos.aporteCentavos)}
            </Text>
          </View>
          <View style={[estilos.filaCuenta, estilos.filaConLinea]}>
            <Text style={estilos.cuentaEtiqueta}>Comisión de Partimos</Text>
            <Text style={estilos.cuentaMonto}>
              {formatearDineroRedondo(datos.comisionCentavos)}
            </Text>
          </View>
          <View style={estilos.filaTotal}>
            <Text style={estilos.totalEtiqueta}>Total</Text>
            <Text style={estilos.totalMonto}>{formatearDineroRedondo(datos.totalCentavos)}</Text>
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

  cabecera: { paddingHorizontal: espacio.gutter },
  epigrafeCampo: {
    fontSize: 11, lineHeight: 15.95,
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.campoTexto,
    fontFamily: familia,
  },
  titular: {
    fontSize: 31,
    lineHeight: 32.86,
    letterSpacing: -1.395,
    fontWeight: '400',
    color: '#fff',
    marginTop: 12,
    fontFamily: familia,
  },
  titularFuerte: { fontWeight: '600' },

  cuerpo: { paddingHorizontal: espacio.gutter, paddingTop: 28, paddingBottom: 26 },

  hoja: {
    backgroundColor: color.blanco,
    borderRadius: radio.hoja,
    padding: 22,
    shadowColor: 'rgb(120,10,30)',
    shadowOpacity: 0.28,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
    elevation: 6,
  },
  digitos: { flexDirection: 'row', gap: 9, marginTop: 14 },
  digito: {
    flex: 1,
    height: 66,
    borderRadius: radio.cuadrado,
    backgroundColor: color.sand200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitoTexto: {
    fontSize: 30, lineHeight: 43.5,
    fontWeight: '600',
    letterSpacing: -0.9,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  explicacion: {
    fontSize: 13.5,
    lineHeight: 19.575,
    color: color.ink600,
    marginTop: 14,
    fontFamily: familia,
  },

  tarjetaLiberacion: {
    marginTop: 12,
    borderRadius: radio.hoja,
    padding: 22,
    overflow: 'hidden',
    backgroundColor: color.blanco,
    shadowColor: '#26232B',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  filaCifra: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 12 },
  cifra: {
    fontSize: 46,
    fontWeight: '700',
    letterSpacing: -2.3,
    lineHeight: 41.4,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  frase: {
    fontSize: 15,
    lineHeight: 21,
    marginTop: 14,
    maxWidth: 230,
    color: color.ink900,
    fontFamily: familia,
  },
  fraseFuerte: { fontWeight: '600' },

  tarjetaCuenta: {
    marginTop: 12,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderRadius: radio.l,
    padding: 18,
  },
  filaCuenta: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingBottom: 11,
  },
  filaConLinea: { borderBottomWidth: 1, borderBottomColor: color.bordeSutil },
  cuentaEtiqueta: { fontSize: 14.5, lineHeight: 21.02, color: color.ink700, fontFamily: familia },
  cuentaMonto: { fontSize: 14.5, lineHeight: 21.02, fontWeight: '500', color: color.ink900, fontFamily: familia, ...tabular },
  filaTotal: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingTop: 13,
  },
  totalEtiqueta: { fontSize: 15, lineHeight: 21.75, fontWeight: '600', color: color.ink900, fontFamily: familia },
  totalMonto: {
    fontSize: 17, lineHeight: 24.65,
    fontWeight: '700',
    letterSpacing: -0.51,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
});
