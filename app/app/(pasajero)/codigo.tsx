/**
 * `1f` Código de abordaje — lado pasajero.
 *
 * Cuatro dígitos sobre el campo rojo. El conductor los teclea al subirte; esa
 * marca es lo que hace que el viaje cuente y que el aporte se libere al llegar.
 */

import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { type CodigoDeAbordaje, codigoDeAbordaje } from '@/servicios/abordaje';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { CampoRojo } from '@/ui/CampoRojo';
import { Avatar, Boton } from '@/ui/controles';
import { formatearDineroRedondo, tabular } from '@/ui/dinero';
import { hora, mas } from '@/ui/fechas';
import { Atras } from '@/ui/iconos';
import { TRACK_MICRO, familia, color, espacio, radio } from '@/ui/tokens';

const RESERVA = '77777777-7777-4777-8777-777777777710';

export default function Codigo() {
  const [datos, setDatos] = useState<CodigoDeAbordaje | null>(null);

  useEffect(() => {
    codigoDeAbordaje(RESERVA).then(setDatos);
  }, []);

  if (!datos) return <View style={estilos.pantalla} />;

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={400} />

      <BarraDeEstado hora={hora(mas(datos.salida, -12))} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 26 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.cabecera}>
          <View style={estilos.filaSuperior}>
            <View style={estilos.circulo}>
              <Atras />
            </View>
            <View style={estilos.pastillaSalida}>
              <Text style={estilos.pastillaSalidaTexto}>{`Sale ${hora(datos.salida)}`}</Text>
              <View style={estilos.puntoBlanco} />
            </View>
          </View>

          <Text style={estilos.epigrafe}>
            {`Muéstrale este código a ${datos.conductor.nombre.split(' ')[0]}`}
          </Text>

          <View style={estilos.digitos}>
            {datos.digitos.map((d, i) => (
              <View key={`${d}-${i}`} style={estilos.digito}>
                <Text style={estilos.digitoTexto}>{d}</Text>
              </View>
            ))}
          </View>

          <Text style={estilos.explicacion}>
            Él lo teclea al subirte. Solo así empieza el viaje y se cuenta tu puesto.
          </Text>
        </View>

        <View style={estilos.hoja}>
          <View style={estilos.filaConductor}>
            <Avatar nombre={datos.conductor.nombre} tono="rojo" />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={estilos.nombreConductor}>{datos.conductor.nombre}</Text>
              <Text style={estilos.carro}>
                {`${datos.conductor.carro} · `}
                <Text style={tabular}>{datos.conductor.placa}</Text>
              </Text>
            </View>
          </View>

          <View style={estilos.separador} />

          <View style={estilos.recorrido}>
            <View style={estilos.lineaRecorrido} />
            <View style={estilos.parada}>
              <View style={estilos.puntoLleno} />
              <View style={{ flex: 1 }}>
                <Text style={estilos.paradaNombre}>{datos.recogida.etiqueta}</Text>
                <Text style={estilos.paradaDetalle}>Estás a 2 min a pie</Text>
              </View>
              <Text style={estilos.paradaHora}>{hora(datos.recogida.hora)}</Text>
            </View>
            <View style={[estilos.parada, { paddingBottom: 0 }]}>
              <View style={estilos.puntoFinal} />
              <Text style={[estilos.paradaNombre, { flex: 1 }]}>{datos.destino.etiqueta}</Text>
              <Text style={estilos.paradaHora}>{hora(datos.destino.hora)}</Text>
            </View>
          </View>

          <View style={{ marginTop: 20 }}>
            <Boton tono="azul">Ver el punto de recogida</Boton>
          </View>
        </View>

        <View style={estilos.avisoPago}>
          <Text style={estilos.avisoTexto}>
            {`Aporte ${formatearDineroRedondo(datos.aporteCentavos)}. ${datos.lineaDePago}`}
          </Text>
        </View>
      </ScrollView>
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

  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 2 },
  filaSuperior: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastillaSalida: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 34,
    paddingHorizontal: 13,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
  },
  pastillaSalidaTexto: {
    fontSize: 12.5, lineHeight: 18.12,
    fontWeight: '600',
    color: '#fff',
    fontFamily: familia,
    ...tabular,
  },
  puntoBlanco: { width: 6, height: 6, borderRadius: radio.pastilla, backgroundColor: '#fff' },

  epigrafe: {
    fontSize: 11, lineHeight: 15.95,
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.campoTexto,
    marginTop: 26,
    fontFamily: familia,
  },

  digitos: { flexDirection: 'row', gap: 10, marginTop: 18 },
  digito: {
    flex: 1,
    height: 96,
    borderRadius: radio.cuadrado,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitoTexto: {
    fontSize: 52, lineHeight: 75.4,
    fontWeight: '600',
    letterSpacing: -2.08,
    color: '#fff',
    fontFamily: familia,
    ...tabular,
  },

  explicacion: {
    fontSize: 14,
    lineHeight: 20.3,
    color: color.campoTexto,
    marginTop: 18,
    fontFamily: familia,
  },

  hoja: {
    marginHorizontal: 22,
    marginTop: 30,
    backgroundColor: color.blanco,
    borderRadius: radio.hoja,
    padding: 22,
    shadowColor: 'rgb(120,10,30)',
    shadowOpacity: 0.28,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
    elevation: 6,
  },
  filaConductor: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  nombreConductor: {
    fontSize: 16.5, lineHeight: 23.93,
    fontWeight: '500',
    letterSpacing: -0.33,
    color: color.ink900,
    fontFamily: familia,
  },
  carro: { fontSize: 13.5, lineHeight: 19.57, color: color.ink600, marginTop: 2, fontFamily: familia },
  separador: { height: 1, backgroundColor: color.bordeSutil, marginVertical: 18 },

  recorrido: { position: 'relative' },
  lineaRecorrido: {
    position: 'absolute',
    left: 4.5,
    top: 20,
    bottom: 8,
    width: 1.5,
    backgroundColor: color.rojo300,
  },
  parada: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', paddingBottom: 14 },
  puntoLleno: {
    width: 10,
    height: 10,
    borderRadius: radio.pastilla,
    backgroundColor: color.rojo500,
    marginTop: 4,
  },
  puntoFinal: {
    width: 10,
    height: 10,
    borderRadius: radio.pastilla,
    backgroundColor: color.blanco,
    borderWidth: 2,
    borderColor: color.ink200,
    marginTop: 4,
  },
  paradaNombre: { fontSize: 16, lineHeight: 23.2, letterSpacing: -0.29, color: color.ink900, fontFamily: familia },
  paradaDetalle: { fontSize: 13, lineHeight: 18.85, color: color.ink500, fontFamily: familia },
  paradaHora: { fontSize: 13.5, lineHeight: 19.57, color: color.ink600, fontFamily: familia, ...tabular },

  avisoPago: {
    marginHorizontal: 22,
    marginTop: 12,
    backgroundColor: color.azul50,
    borderWidth: 1,
    borderColor: color.azul100,
    borderRadius: radio.l,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  avisoTexto: { fontSize: 13.5, lineHeight: 20.3, color: color.ink700, fontFamily: familia },
});
