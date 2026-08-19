/**
 * `7a` Reserva — tu punto y tu equipaje.
 *
 * El formulario se adapta al booleano del conductor: si acepta maletas aparece
 * el stepper de maleta junto al de mochila; si no, solo mochila y la línea lo
 * dice con su nombre. La mochila siempre viaja y nunca cuenta.
 *
 * Pedir puesto no cobra nada: el cobro es cuando el conductor acepta (`11a`).
 */

import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { etiquetaDeMaletero, notaDeEquipaje } from '@/dominio/equipaje';
import { type ReservaPreparada, pedirPuesto, prepararReserva } from '@/servicios/reservas';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { CampoRojo } from '@/ui/CampoRojo';
import { Boton, Campo, Epigrafe, Pastilla, Stepper } from '@/ui/controles';
import { tabular } from '@/ui/dinero';
import { diaCorto, hora } from '@/ui/fechas';
import { Atras, Maleta } from '@/ui/iconos';
import { TRACK_MICRO, familia, color, espacio, radio } from '@/ui/tokens';

const VIAJE = '55555555-5555-4555-8555-555555555555';
/** Mientras no exista sesión. La cuenta se pide en `1c`, al pulsar Pedir puesto. */
const PASAJERO = '22222222-2222-4222-8222-222222222222';

export default function Reservar() {
  const router = useRouter();
  // `/viaje/[id]` en cuanto exista el descubrimiento; hoy, el del simulado.
  const { viaje } = useLocalSearchParams<{ viaje?: string }>();
  const viajeId = viaje ?? VIAJE;
  const [datos, setDatos] = useState<ReservaPreparada | null>(null);
  const [direccion, setDireccion] = useState('Vía Argentina, Riba Smith');
  const [mochilas, setMochilas] = useState(1);
  const [maletas, setMaletas] = useState(1);
  const [pidiendo, setPidiendo] = useState(false);

  useEffect(() => {
    prepararReserva(viajeId).then(setDatos);
  }, [viajeId]);

  if (!datos) return <View style={estilos.pantalla} />;

  // Si el conductor no lleva maletas, no hay maleta que contar.
  const maletasReales = datos.aceptaMaletas ? maletas : 0;

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={214} />

      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <View style={estilos.filaEpigrafe}>
          <View style={estilos.circulo}>
            <Atras />
          </View>
          <Text style={estilos.epigrafeCampo}>
            {`${datos.destino} · ${diaCorto(datos.salida)}, ${hora(datos.salida)}`}
          </Text>
        </View>
        <Text style={estilos.titular}>
          {'Tu punto y tu '}
          <Text style={estilos.titularFuerte}>equipaje</Text>
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 18 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.hoja}>
          <Epigrafe>Dónde te recogen</Epigrafe>

          <View style={estilos.recorrido}>
            <View style={estilos.lineaRecorrido} />

            <View style={estilos.parada}>
              <View style={estilos.puntoLleno} />
              <Text style={estilos.paradaNombre}>{datos.origen.etiqueta}</Text>
              <Text style={estilos.paradaHora}>{hora(datos.origen.hora)}</Text>
            </View>

            <View style={[estilos.parada, { paddingBottom: 0 }]}>
              <View style={estilos.puntoTuyo} />
              <Text style={[estilos.paradaNombre, { color: color.azul700 }]}>Tu punto</Text>
              <Text style={estilos.paradaHora}>{`+${datos.minutosDeDesvio} min`}</Text>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <Campo
              valor={direccion}
              alEscribir={setDireccion}
              marcador="Calle, edificio o referencia"
              ayuda={`${datos.conductor} lo aprueba junto con el puesto.`}
              etiquetaAccesible="Tu dirección de recogida"
            />
          </View>
        </View>

        <View style={estilos.tarjetaEquipaje}>
          <View style={estilos.filaTitulo}>
            <View style={{ flex: 1 }}>
              <Epigrafe>Equipaje</Epigrafe>
            </View>
            <Pastilla
              tamano="m"
              fondo={datos.aceptaMaletas ? color.azul100 : color.sand200}
              tinta={datos.aceptaMaletas ? color.azul700 : color.ink700}
            >
              {etiquetaDeMaletero(datos.aceptaMaletas)}
            </Pastilla>
          </View>

          <View style={{ marginTop: 12 }}>
            <View style={estilos.filaStepper}>
              <Text style={estilos.etiquetaStepper}>
                Mochila
                <Text style={estilos.etiquetaApagada}> · va contigo</Text>
              </Text>
              <Stepper
                valor={mochilas}
                alCambiar={setMochilas}
                min={0}
                max={2}
                etiquetaAccesible="Mochilas"
              />
            </View>

            {datos.aceptaMaletas ? (
              <View style={estilos.filaStepper}>
                <Text style={estilos.etiquetaStepper}>
                  Maleta
                  <Text style={estilos.etiquetaApagada}> · al maletero</Text>
                </Text>
                <Stepper
                  valor={maletas}
                  alCambiar={setMaletas}
                  min={0}
                  max={2}
                  etiquetaAccesible="Maletas"
                />
              </View>
            ) : null}
          </View>

          <View style={estilos.nota}>
            <Maleta tamano={14} />
            <Text style={estilos.notaTexto}>
              {notaDeEquipaje(datos.aceptaMaletas, maletasReales, datos.conductor)}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={estilos.pie}>
        <View style={estilos.filaPrecio}>
          <Text style={estilos.precio}>
            {String(Math.round(datos.aporteCentavos / 100))}
            <Text style={estilos.precioSimbolo}> $</Text>
          </Text>
          <Pastilla estilo={{ marginBottom: 6 }}>por plaza</Pastilla>
        </View>

        <Boton
          tono="azul"
          desactivado={pidiendo}
          alPulsar={async () => {
            setPidiendo(true);
            try {
              await pedirPuesto(
                viajeId,
                { direccionPropia: direccion },
                { mochilas, maletas: maletasReales },
                { pasajeroId: PASAJERO },
              );
              router.push({ pathname: '/(pasajero)/pagar', params: { viaje: viajeId } });
            } finally {
              setPidiendo(false);
            }
          }}
        >
          Pedir puesto
        </Boton>
        <Text style={estilos.notaPie}>{`No se cobra hasta que ${datos.conductor} acepte.`}</Text>
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

  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 6 },
  filaEpigrafe: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  epigrafeCampo: {
    fontSize: 11, lineHeight: 15.95,
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.campoTexto,
    flex: 1,
    fontFamily: familia,
  },
  titular: {
    fontSize: 33,
    lineHeight: 34.65,
    letterSpacing: -1.32,
    fontWeight: '400',
    color: '#fff',
    marginTop: 12,
    fontFamily: familia,
  },
  titularFuerte: { fontWeight: '600' },

  hoja: {
    marginHorizontal: 22,
    marginTop: 24,
    backgroundColor: color.blanco,
    borderRadius: radio.hoja,
    padding: 20,
    shadowColor: 'rgb(120,10,30)',
    shadowOpacity: 0.28,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
    elevation: 6,
  },

  recorrido: { marginTop: 12, position: 'relative' },
  lineaRecorrido: {
    position: 'absolute',
    left: 4.25,
    top: 9,
    bottom: 9,
    width: 1.5,
    backgroundColor: color.rojo300,
  },
  parada: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingBottom: 12 },
  puntoLleno: {
    width: 10,
    height: 10,
    borderRadius: radio.pastilla,
    backgroundColor: color.rojo500,
    marginTop: 5,
  },
  puntoTuyo: {
    width: 10,
    height: 10,
    borderRadius: radio.pastilla,
    backgroundColor: color.blanco,
    borderWidth: 2,
    borderColor: color.azul500,
    marginTop: 5,
  },
  paradaNombre: {
    flex: 1,
    fontSize: 15.5, lineHeight: 22.47,
    fontWeight: '500',
    letterSpacing: -0.28,
    color: color.ink900,
    fontFamily: familia,
  },
  paradaHora: { fontSize: 13, lineHeight: 18.85, color: color.ink400, fontFamily: familia, ...tabular },

  tarjetaEquipaje: {
    marginHorizontal: 22,
    marginTop: 6,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderRadius: radio.l,
    padding: 14,
  },
  filaTitulo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  filaStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  etiquetaStepper: {
    flex: 1,
    fontSize: 14.5, lineHeight: 21.02,
    fontWeight: '500',
    letterSpacing: -0.22,
    color: color.ink900,
    fontFamily: familia,
  },
  etiquetaApagada: { fontWeight: '400', color: color.ink500 },
  nota: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  notaTexto: { flex: 1, fontSize: 12.5, lineHeight: 18.125, color: color.ink600, fontFamily: familia },

  pie: {
    paddingHorizontal: espacio.gutter,
    paddingTop: 14,
    paddingBottom: 26,
    backgroundColor: color.blanco,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  filaPrecio: { flexDirection: 'row', alignItems: 'flex-end', gap: 9, marginBottom: 12 },
  precio: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -1.44,
    lineHeight: 28.8,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  precioSimbolo: { fontSize: 17, lineHeight: 15.3, fontWeight: '500' },
  notaPie: { textAlign: 'center', fontSize: 12.5, lineHeight: 18.12, color: color.ink500, marginTop: 10, fontFamily: familia },
});
