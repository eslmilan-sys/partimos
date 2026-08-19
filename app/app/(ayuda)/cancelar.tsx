/**
 * `14a` Cancelar el puesto — la consecuencia va delante del botón.
 *
 * Cancelar es de las pocas cosas de la app que no se deshacen, así que la
 * pantalla enseña la regla, el importe y a quién le libera el puesto **antes**
 * de que se pueda confirmar. Por eso el bloque azul de «Te devolvemos» está
 * encima del pie y no detrás de una confirmación: quien llega aquí dudando
 * tiene que poder irse sin tocar nada, sabiendo ya lo que le habría costado.
 *
 * El pie invierte el peso a propósito. Lo destructivo va con borde rojo y
 * texto rojo, nunca relleno — un botón rojo sólido es lo que en el resto de la
 * app significa «sigue adelante», y aquí seguir adelante es perder el puesto.
 * La salida, «Mejor no, lo dejo», es la que se lleva el contorno de tinta: es
 * la que queremos que se pulse sin pensar.
 *
 * Las tres razones no cambian la plata, cambian lo que lee el conductor. La
 * regla del reembolso la decide el motivo (`dominio/reembolsos`), y las tres
 * son de la pasajera, así que caen en la misma. Aun así la previsualización
 * cuelga del motivo elegido: es el motivo quien manda sobre regla e importe, y
 * la pantalla no supone cuál sale.
 */

import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { HORAS_PARA_CANCELAR_ENTERO, type MotivoDeReembolso } from '@/dominio/reembolsos';
import { type Previsualizacion, cancelar, previsualizar } from '@/servicios/cancelaciones';
import { type PuestoMio, misViajes } from '@/servicios/panel';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { CampoRojo } from '@/ui/CampoRojo';
import { Boton } from '@/ui/controles';
import { formatearDinero, tabular } from '@/ui/dinero';
import { diaCorto, hora } from '@/ui/fechas';
import { Atras } from '@/ui/iconos';
import { color, espacio, familia, interlinea, radio, sombra, texto } from '@/ui/tokens';

// Mientras no haya sesión, la pasajera del recorrido del diseño y el puesto
// que tiene comprado en el Albrook → Chitré.
const PASAJERA = '99999999-9999-4999-8999-999999999999';
const RESERVA = '77777777-7777-4777-8777-777777777700';

/**
 * Las tres razones que se le pueden dar al conductor. No son los `MOTIVOS` de
 * `@/servicios/cancelaciones`: aquéllos son las cuatro reglas de reembolso de
 * `7d` — de quién fue el fallo —, y aquí ya sabemos que el fallo es de la
 * pasajera. Lo que se elige es con qué palabras se lo decimos, y eso va al
 * `reason_free_text` de la cancelación.
 */
const RAZONES: { etiqueta: string; motivo: MotivoDeReembolso }[] = [
  { etiqueta: 'No me sirve la hora', motivo: 'yo' },
  { etiqueta: 'Conseguí otro carro', motivo: 'yo' },
  { etiqueta: 'Se cayó mi plan', motivo: 'yo' },
];

export default function Cancelar() {
  const router = useRouter();
  const [puesto, setPuesto] = useState<PuestoMio | null>(null);
  const [previa, setPrevia] = useState<Previsualizacion | null>(null);
  const [elegida, setElegida] = useState(0);
  const [cancelando, setCancelando] = useState(false);

  useEffect(() => {
    misViajes(PASAJERA).then(({ proximos, pasados }) =>
      setPuesto([...proximos, ...pasados].find((p) => p.reservaId === RESERVA) ?? null),
    );
  }, []);

  useEffect(() => {
    previsualizar(RESERVA, RAZONES[elegida].motivo).then(setPrevia);
  }, [elegida]);

  if (!puesto || !previa) return <View style={estilos.pantalla} />;

  const conductor = puesto.conductor.split(' ')[0];
  // Las horas se dicen enteras, como las dice la regla en su propio texto.
  const faltan = `${Math.floor(previa.horasAntes)} h`;
  const entero = previa.horasAntes >= HORAS_PARA_CANCELAR_ENTERO;

  const confirmar = async () => {
    setCancelando(true);
    await cancelar(RESERVA, RAZONES[elegida].motivo, PASAJERA, RAZONES[elegida].etiqueta);
    router.replace('/(pasajero)');
  };

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
            {`Reserva ${puesto.codigo} · ${puesto.conductor}`}
          </Text>
        </View>
        <Text style={estilos.titular}>
          {'¿Cancelas tu '}
          <Text style={texto.titularFuerte}>puesto</Text>
          {'?'}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={estilos.hoja}>
          <View style={estilos.filaRuta}>
            <View style={estilos.punto} />
            <Text style={estilos.ruta} numberOfLines={1}>
              {`${puesto.punto} → ${puesto.destino}`}
            </Text>
            <Text style={estilos.cuando}>
              {`${diaCorto(puesto.cuando)} · ${hora(puesto.cuando)}`}
            </Text>
          </View>

          <View style={estilos.filaRegla}>
            <Text style={estilos.faltan}>
              {'Faltan '}
              <Text style={estilos.horas}>{faltan}</Text>
              {' para la salida'}
            </Text>
            {/* La pastilla resume la regla en dos palabras; el texto entero la
                explica abajo, con el importe al lado. */}
            <View style={estilos.pastillaRegla}>
              <Text style={estilos.pastillaReglaTexto}>
                {entero ? 'Devolución completa' : 'Devolución parcial'}
              </Text>
            </View>
          </View>
        </View>

        <View style={estilos.tarjetaRazones}>
          <Text style={estilos.epigrafeRazones}>¿Por qué?</Text>

          <View style={estilos.razones} accessibilityRole="radiogroup">
            {RAZONES.map((razon, i) => {
              const activa = i === elegida;
              return (
                <Pressable
                  key={razon.etiqueta}
                  accessibilityRole="radio"
                  accessibilityLabel={razon.etiqueta}
                  accessibilityState={{ checked: activa, selected: activa }}
                  onPress={() => setElegida(i)}
                  style={[estilos.razon, activa ? estilos.razonActiva : estilos.razonApagada]}
                >
                  <View
                    style={[
                      estilos.aro,
                      { borderColor: activa ? color.azul500 : color.bordePorDefecto },
                    ]}
                  >
                    <View
                      style={[estilos.punta, activa && { backgroundColor: color.azul500 }]}
                    />
                  </View>
                  <Text style={estilos.razonTexto}>{razon.etiqueta}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={estilos.nota}>
            {`Se lo decimos a ${conductor} con estas palabras. No lo verá nadie más.`}
          </Text>
        </View>

        <View style={estilos.tarjetaDevolucion}>
          <View style={estilos.filaDevolucion}>
            <View style={estilos.columnaDevolucion}>
              <Text style={estilos.epigrafeDevolucion}>Te devolvemos</Text>
              <Text style={estilos.explicacion}>{previa.texto}</Text>
            </View>
            <Text style={estilos.importe}>{formatearDinero(previa.montoCentavos)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={estilos.pie}>
        {/* Destructivo: contorno rojo y texto rojo. Relleno nunca, porque el
            relleno rojo es la acción de seguir adelante en toda la app. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancelar mi puesto"
          accessibilityState={{ disabled: cancelando }}
          disabled={cancelando}
          onPress={confirmar}
          style={({ pressed }) => [
            estilos.destructivo,
            pressed && { backgroundColor: color.rojo50 },
            cancelando && { opacity: 0.5 },
          ]}
        >
          <Text style={estilos.destructivoTexto}>Cancelar mi puesto</Text>
        </Pressable>

        <Boton tono="contorno" tamano="md" alPulsar={() => router.back()}>
          Mejor no, lo dejo
        </Boton>
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

  /* La hoja blanca que monta sobre el borde del campo rojo. */
  hoja: {
    marginTop: 20,
    marginHorizontal: espacio.tarjeta,
    backgroundColor: color.blanco,
    // El traspaso da 28 aquí, dos más que `radio.hoja`.
    borderRadius: 28,
    padding: 18,
    ...sombra.hoja,
  },
  filaRuta: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  punto: {
    width: 9,
    height: 9,
    borderRadius: radio.pastilla,
    backgroundColor: color.rojo500,
  },
  ruta: {
    flex: 1,
    fontSize: 14.5,
    lineHeight: interlinea(14.5),
    fontWeight: '500',
    letterSpacing: -0.2175,
    color: color.ink900,
    fontFamily: familia,
  },
  cuando: {
    fontSize: 13,
    lineHeight: interlinea(13),
    fontWeight: '500',
    letterSpacing: -0.2175,
    color: color.ink500,
    fontFamily: familia,
    ...tabular,
  },

  filaRegla: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  faltan: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: interlinea(13.5),
    color: color.ink600,
    fontFamily: familia,
    ...tabular,
  },
  horas: {
    fontSize: 13.5,
    lineHeight: interlinea(13.5),
    color: color.ink600,
    fontFamily: familia,
    ...tabular,
  },
  pastillaRegla: {
    backgroundColor: color.azul100,
    borderRadius: radio.pastilla,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  pastillaReglaTexto: {
    fontSize: 11.5,
    lineHeight: interlinea(11.5),
    fontWeight: '600',
    color: color.azul700,
    fontFamily: familia,
  },

  tarjetaRazones: {
    marginTop: espacio.entreTarjetas,
    marginHorizontal: espacio.tarjeta,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderRadius: radio.l,
    padding: 18,
  },
  epigrafeRazones: { ...texto.epigrafe, color: color.azul500, marginBottom: 11 },
  razones: { gap: 7 },
  razon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderRadius: radio.control,
    borderWidth: 1,
  },
  razonActiva: { backgroundColor: color.azul100, borderColor: color.azul500 },
  razonApagada: { backgroundColor: color.blanco, borderColor: color.bordeSutil },
  aro: {
    width: 17,
    height: 17,
    borderRadius: radio.pastilla,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  punta: { width: 9, height: 9, borderRadius: radio.pastilla },
  razonTexto: {
    fontSize: 14.5,
    lineHeight: interlinea(14.5),
    fontWeight: '500',
    letterSpacing: -0.2175,
    color: color.ink900,
    fontFamily: familia,
  },
  nota: {
    marginTop: 11,
    fontSize: 12.5,
    lineHeight: interlinea(12.5),
    color: color.ink500,
    fontFamily: familia,
  },

  tarjetaDevolucion: {
    marginTop: espacio.entreTarjetas,
    marginHorizontal: espacio.tarjeta,
    backgroundColor: color.azul100,
    borderRadius: radio.l,
    padding: 18,
  },
  filaDevolucion: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  columnaDevolucion: { flex: 1, minWidth: 0 },
  epigrafeDevolucion: { ...texto.epigrafe, color: color.azul700 },
  explicacion: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: interlinea(13),
    color: color.ink700,
    fontFamily: familia,
  },
  importe: { ...texto.precio, color: color.ink900, ...tabular },

  pie: {
    paddingTop: 14,
    paddingHorizontal: espacio.gutter,
    paddingBottom: espacio.gutter,
    gap: 10,
    backgroundColor: color.blanco,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  destructivo: {
    height: 56,
    borderRadius: radio.pastilla,
    borderWidth: 1,
    borderColor: color.rojo300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destructivoTexto: {
    fontSize: 16,
    lineHeight: interlinea(16),
    fontWeight: '600',
    letterSpacing: -0.24,
    color: color.rojo700,
    fontFamily: familia,
  },
});
