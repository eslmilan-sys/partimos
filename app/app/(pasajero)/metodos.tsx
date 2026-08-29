/**
 * `9a` Métodos de pago — con la tarifa pegada al nombre.
 *
 * Lo único que separa a un método de otro es lo que cuesta cobrar por él, así
 * que la tarifa va en la misma fila que el nombre y no en letra pequeña al
 * final: si el pasajero va a elegir, que elija viendo el número. El conductor
 * recibe el aporte entero con los tres, y eso lo dice la tarjeta de abajo para
 * que nadie lea la tarifa como una comisión al conductor.
 *
 * Tocar una fila la deja predeterminada. El efectivo cierra la pantalla con su
 * consecuencia: sin retención no hay nada que devolver si el viaje se cae.
 *
 * La tarifa no existe en el aire —es un porcentaje de un aporte concreto—, así
 * que las cifras salen del viaje de referencia, no de la cuenta.
 */

import { useEffect, useMemo, useState } from 'react';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { useVolver } from '@/ui/salidas';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { type CanalDePago, seCobraEnLaApp } from '@/dominio/tarifas';
import { cuenta } from '@/servicios/ajustes';
import { APORTE_DE_EJEMPLO, type MetodoDePago, desglosar, metodosDePago } from '@/servicios/pagos';
import { type ReservaPreparada, prepararReserva } from '@/servicios/reservas';
import { useMiIdOEntrar } from '@/servicios/sesion';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { Brillo, CampoRojo } from '@/ui/CampoRojo';
import { Epigrafe, Pastilla } from '@/ui/controles';
import { Dinero, formatearDineroRedondo, tabular } from '@/ui/dinero';
import { Atras, Mas } from '@/ui/iconos';
import { familia, color, espacio, radio, sombra } from '@/ui/tokens';

/** Daniela, la pasajera del recorrido. Mientras no haya sesión, va aquí. */
const YO_DEL_RECORRIDO = '99999999-9999-4999-8999-999999999999';
/** Albrook → Chitré: el aporte de 6 $ sobre el que se calculan las tarifas. */


export default function Metodos() {
  const router = useRouter();
  const volver = useVolver();
  const { viaje: viajeParam } = useLocalSearchParams<{ viaje?: string }>();
  const yo = useMiIdOEntrar(YO_DEL_RECORRIDO);
  const [metodos, setMetodos] = useState<MetodoDePago[]>([]);
  /** El aporte sobre el que se enseña la tarifa, y de quién es el viaje. */
  const [sobre, setSobre] = useState<{ aporteCentavos: number; conductor: string } | null>(null);
  const [canal, setCanal] = useState<CanalDePago | null>(null);

  /**
   * SE ABRÍA EN BLANCO — para siempre. Esta pantalla enseña la tarifa sobre
   * un aporte CONCRETO, así que pedía la reserva de un viaje. Y cuando se
   * abre desde la cuenta o desde ajustes NO HAY VIAJE: caía en el
   * identificador del recorrido de diseño, que no existe en la base real,
   * `prepararReserva` lanzaba, nadie recogía el fallo y la pantalla se
   * quedaba en el esqueleto. Sin salida, sin mensaje. Visto por el dueño el
   * 26-08-2026 — y era también la captura de las tarjetas grises de la
   * víspera, que no supe situar entonces.
   *
   * Dos cosas cambian. Sin viaje NO SE PIDE NINGUNO: la tarifa se enseña
   * sobre un aporte de ejemplo, dicho como ejemplo. Y con viaje, si algo
   * falla, se cae al mismo ejemplo en vez de colgarse: una pantalla de
   * ajustes no puede quedarse en blanco porque un viaje no cargue.
   */
  useEffect(() => {
    if (!yo) return;
    let vivo = true;
    (async () => {
      const [lista, quien] = await Promise.all([metodosDePago(viajeParam ?? null), cuenta(yo)]);
      if (!vivo) return;
      setMetodos(lista);
      // El predeterminado es el que la cuenta ya tiene guardado, no el primero
      // que devuelva la lista.
      setCanal(lista.find((m) => m.nombre === quien.metodo)?.canal ?? lista[0]?.canal ?? null);

      const deEjemplo = { aporteCentavos: APORTE_DE_EJEMPLO, conductor: '' };
      if (!viajeParam) return setSobre(deEjemplo);
      try {
        const preparado = await prepararReserva(viajeParam);
        if (vivo) setSobre({ aporteCentavos: preparado.aporteCentavos, conductor: preparado.conductor });
      } catch {
        if (vivo) setSobre(deEjemplo);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [yo, viajeParam]);

  const desglose = useMemo(
    () => (sobre && canal ? desglosar(sobre.aporteCentavos, canal, sobre.conductor) : null),
    [sobre, canal],
  );

  if (!sobre || !canal || !desglose) return <Cargando />;

  const elegido = metodos.find((m) => m.canal === canal);

  return (
    <View style={estilos.pantalla}>
      <BarraDeEstado />

      {/* TODA LA PANTALLA DESLIZA, no solo el cuerpo: en el teléfono se siente
          como una app y no como una cabecera clavada. Solo la barra de estado
          —y la de pestañas, donde la hay— quedan fijas. */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 22 }}
        showsVerticalScrollIndicator={false}
      >

      <CampoRojo altura={214} />


      <View style={estilos.cabecera}>
        <View style={estilos.filaEpigrafe}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atrás"
            onPress={() => volver()}
            style={estilos.circulo}
          >
            <Atras />
          </Pressable>
          <Epigrafe tinta={color.campoTexto}>Cuenta · dinero</Epigrafe>
        </View>
        <Text style={estilos.titular}>
          {'Métodos de '}
          <Text style={estilos.titularFuerte}>pago</Text>
        </Text>
      </View>

        <View style={estilos.hoja}>
          <Epigrafe>Guardados</Epigrafe>
          <Text style={estilos.dondeSeCobra}>
            {seCobraEnLaApp(canal)
              ? `Se cobra en ${elegido?.nombre ?? ''}`
              : 'No se cobra nada aquí: aportas al subir'}
          </Text>

          {metodos.map((m) => {
            const predeterminado = m.canal === canal;
            const fondo = predeterminado ? color.azul100 : color.sand200;
            const tinta = predeterminado ? color.azul700 : color.ink700;
            return (
              <Pressable
                key={m.canal}
                accessibilityRole="radio"
                accessibilityState={{ checked: predeterminado }}
                accessibilityLabel={`${m.nombre}. ${m.detalle}`}
                onPress={() => setCanal(m.canal)}
                style={estilos.fila}
              >
                <View style={[estilos.marca, { backgroundColor: fondo }]}>
                  <Text style={[estilos.marcaGlifo, { color: tinta }]}>{glifo(m)}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={estilos.metodo}>{m.nombre}</Text>
                  <Text style={estilos.tarifa}>{m.detalle}</Text>
                </View>
                <Pastilla fondo={fondo} tinta={tinta}>
                  {predeterminado ? 'Predeterminado' : 'Usar'}
                </Pastilla>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Añadir método de pago"
          onPress={() =>
            router.push(
              viajeParam
                ? { pathname: '/(pasajero)/metodo-nuevo', params: { viaje: viajeParam } }
                : '/(pasajero)/metodo-nuevo',
            )
          }
          style={estilos.anadir}
        >
          <Mas tamano={18} tinta={color.ink900} />
          <Text style={estilos.anadirTexto}>Añadir método</Text>
        </Pressable>

        <View style={estilos.tarjeta}>
          <Brillo ancho={346} alto={151} />
          <Epigrafe>Sobre la tarifa</Epigrafe>
          <Text style={estilos.parrafo}>
            La tarifa cubre el cobro. El conductor recibe el aporte completo con cualquier método.
          </Text>
          <View style={estilos.filaEjemplo}>
            <Text style={estilos.ejemplo}>
              {`${viajeParam ? 'Un viaje' : 'Un viaje de ejemplo'} de ${formatearDineroRedondo(sobre.aporteCentavos)} con `}
              <Text style={estilos.ejemplo}>{elegido?.nombre ?? ''}</Text>
            </Text>
            <Dinero centavos={desglose.totalCentavos} style={estilos.ejemploTotal} />
          </View>
        </View>

        <Text style={estilos.cierre}>
          En efectivo no hay retención: si el viaje se cancela, no hay nada que devolver.
        </Text>
      </ScrollView>
    </View>
  );
}

/** El efectivo no tiene marca que abreviar: su glifo es el símbolo. */
const glifo = (m: MetodoDePago) => (m.canal === 'external' ? '$' : m.nombre.charAt(0));

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: color.sand100,
    maxWidth: espacio.marco,
    width: '100%',
    alignSelf: 'center',
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
  titular: {
    fontSize: 33,
    lineHeight: 34.65,
    letterSpacing: -1.32,
    fontWeight: '400',
    color: color.blanco,
    marginTop: 12,
    fontFamily: familia,
  },
  titularFuerte: { fontWeight: '600' },

  // `--radius-sheet` son 28 px; `radio.hoja` se quedó en 26.
  hoja: {
    marginHorizontal: espacio.gutter,
    marginTop: 22,
    backgroundColor: color.blanco,
    borderRadius: 28,
    padding: 20,
    ...sombra.hoja,
  },
  // Las tres cajas de texto de la lista se encogen al texto: en el diseño son
  // spans en línea, y una caja que ocupa toda la fila descoloca su centro.
  dondeSeCobra: {
    alignSelf: 'flex-start',
    fontSize: 12.5,
    lineHeight: 18.125,
    color: color.ink600,
    marginTop: 3,
    marginBottom: 4,
    fontFamily: familia,
  },

  // La raya va arriba de cada fila, también de la primera: separa la lista del
  // epígrafe sin añadir un elemento más.
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  marca: {
    width: 38,
    height: 38,
    borderRadius: radio.cuadrado,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marcaGlifo: { fontSize: 14, lineHeight: 21.025, fontWeight: '600', fontFamily: familia },
  metodo: {
    alignSelf: 'flex-start',
    fontSize: 15.5,
    lineHeight: 21.75,
    fontWeight: '500',
    letterSpacing: -0.225,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  /* ink800: esta línea cae sobre la fila elegida, que es más oscura que el
     blanco, y con ink500 se quedaba en 4,43:1. */
  tarifa: {
    alignSelf: 'flex-start',
    fontSize: 12.5,
    lineHeight: 18.125,
    color: color.ink800,
    marginTop: 1,
    fontFamily: familia,
    ...tabular,
  },

  anadir: {
    marginHorizontal: espacio.gutter,
    marginTop: 11,
    height: 52,
    borderRadius: radio.pastilla,
    borderWidth: 1.5,
    borderColor: color.bordePorDefecto,
    backgroundColor: color.blanco,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  anadirTexto: {
    fontSize: 15.5,
    lineHeight: 22.475,
    fontWeight: '600',
    letterSpacing: -0.2325,
    color: color.ink900,
    fontFamily: familia,
  },

  tarjeta: {
    marginHorizontal: espacio.gutter,
    marginTop: 11,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    padding: 18,
    overflow: 'hidden',
    backgroundColor: color.blanco,
  },
  parrafo: {
    fontSize: 13.5,
    lineHeight: 20.25,
    color: color.ink700,
    marginTop: 9,
    fontFamily: familia,
  },
  filaEjemplo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 14,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  ejemplo: { fontSize: 13.5, lineHeight: 19.575, color: color.ink700, fontFamily: familia },
  ejemploTotal: {
    fontSize: 13.5,
    lineHeight: 19.575,
    fontWeight: '600',
    color: color.ink700,
    fontFamily: familia,
  },

  cierre: {
    marginHorizontal: espacio.gutter,
    marginTop: 11,
    fontSize: 12.5,
    lineHeight: 18.75,
    color: color.ink600,
    fontFamily: familia,
  },
});
