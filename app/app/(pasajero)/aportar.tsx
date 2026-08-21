/**
 * `7b` Cómo aportas — Yappy, tarjeta o efectivo.
 *
 * **La pantalla no se llama «pagar», ni lo dice en ninguna línea.** Pagar es
 * lo que se hace por un servicio, y Partimos no vende ninguno: el dinero es un
 * aporte al gasto de alguien que iba a hacer el viaje de todas formas. La
 * palabra no es un detalle de estilo — es la diferencia entre compartir gastos
 * y transporte remunerado, que es la línea que `PRODUCT.md` no deja cruzar.
 *
 * Elegir método reescribe la línea de la tarifa, el total, la etiqueta del
 * total, el botón y la nota de retención. El efectivo cambia «Aportas ahora»
 * por «Aportas al subir» y el botón por «Confirmar el puesto».
 *
 * El conductor recibe el aporte completo con los tres. La tarifa es nuestra.
 */

import { useEffect, useMemo, useState } from 'react';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { useVolver } from '@/ui/salidas';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { CanalDePago } from '@/dominio/tarifas';
import { type MetodoDePago, desglosar, elegirMetodo, metodosDePago } from '@/servicios/pagos';
import { type ReservaPreparada, prepararReserva } from '@/servicios/reservas';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { NoEsta } from '@/ui/NoEsta';
import { Brillo, CampoRojo } from '@/ui/CampoRojo';
import { Boton, Epigrafe } from '@/ui/controles';
import { Dinero, tabular } from '@/ui/dinero';
import { hora } from '@/ui/fechas';
import { Atras } from '@/ui/iconos';
import { TRACK_MICRO, familia, color, espacio, radio } from '@/ui/tokens';

const VIAJE_DEL_RECORRIDO = '55555555-5555-4555-8555-555555555555';
/** Sin parámetro de ruta —solo al abrir la pantalla suelta—, la del traspaso. */
const RESERVA_DEL_RECORRIDO = '77777777-7777-4777-8777-777777777700';

export default function Aportar() {
  const router = useRouter();
  const volver = useVolver();
  const { viaje, reserva } = useLocalSearchParams<{ viaje?: string; reserva?: string }>();
  const viajeId = viaje ?? VIAJE_DEL_RECORRIDO;
  const reservaId = reserva ?? RESERVA_DEL_RECORRIDO;
  const [datos, setDatos] = useState<ReservaPreparada | null>(null);
  /* «Todavía no lo sé» y «no está» no son lo mismo: lo segundo dura para
     siempre, y en blanco no hay ni por dónde salir. */
  const [noEsta, setNoEsta] = useState(false);
  const [metodos, setMetodos] = useState<MetodoDePago[]>([]);
  const [canal, setCanal] = useState<CanalDePago>('yappy_app');
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    prepararReserva(viajeId).then(setDatos).catch(() => setNoEsta(true));
    metodosDePago(viajeId).then(setMetodos);
  }, [viajeId]);

  const desglose = useMemo(
    () => (datos ? desglosar(datos.aporteCentavos, canal, datos.conductor) : null),
    [datos, canal],
  );

  if (noEsta) return <NoEsta />;
  if (!datos || !desglose) return <Cargando />;

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={214} />

      <BarraDeEstado />

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
          <Text style={estilos.epigrafeCampo}>
            {`${datos.destino} · ${hora(datos.salida)} · 1 puesto`}
          </Text>
        </View>
        <Text style={estilos.titular}>
          {'Cómo le '}
          <Text style={estilos.titularFuerte}>aportas</Text>
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 18 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.hoja}>
          <View style={{ marginBottom: 14 }}>
            <Epigrafe>Método</Epigrafe>
          </View>

          <View style={{ gap: 9 }}>
            {metodos.map((m) => {
              const elegido = m.canal === canal;
              return (
                <Pressable
                  key={m.canal}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: elegido }}
                  accessibilityLabel={`${m.nombre}. ${m.detalle}`}
                  onPress={() => setCanal(m.canal)}
                  style={[
                    estilos.metodo,
                    {
                      borderColor: elegido ? color.azul500 : color.bordeSutil,
                      backgroundColor: elegido ? color.azul100 : color.blanco,
                    },
                  ]}
                >
                  <View
                    style={[
                      estilos.anillo,
                      { borderColor: elegido ? color.azul500 : color.bordePorDefecto },
                    ]}
                  >
                    {elegido ? <View style={estilos.puntoElegido} /> : null}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={estilos.metodoNombre}>{m.nombre}</Text>
                    <Text style={estilos.metodoDetalle}>{m.detalle}</Text>
                  </View>
                  {m.distintivo ? (
                    <Text style={estilos.distintivo}>{m.distintivo}</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={estilos.tarjetaCuenta}>
          <Brillo alto={210} />
          <View style={estilos.filaCuenta}>
            <Text style={estilos.cuentaEtiqueta}>{`Aporte a ${datos.conductor}`}</Text>
            <Dinero centavos={desglose.aporteCentavos} style={estilos.cuentaMonto} />
          </View>

          <View style={[estilos.filaCuenta, { marginTop: 10 }]}>
            <Text style={estilos.cuentaEtiqueta}>{desglose.etiquetaTarifa}</Text>
            <Dinero centavos={desglose.tarifaCentavos} style={estilos.cuentaMonto} />
          </View>

          <View style={estilos.separador} />

          <View style={estilos.filaTotal}>
            <Text style={estilos.totalEtiqueta}>{desglose.etiquetaTotal}</Text>
            <Dinero centavos={desglose.totalCentavos} style={estilos.total} />
          </View>

          <Text style={estilos.explicacion}>{desglose.explicacion}</Text>
        </View>
      </ScrollView>

      <View style={estilos.pie}>
        <Boton
          tono="azul"
          desactivado={confirmando}
          alPulsar={async () => {
            setConfirmando(true);
            try {
              // Elegir el método no cobra nada: deja la reserva con el canal
              // escrito. El cargo ocurre cuando el conductor acepta, que es lo
              // que dice el reloj de `16b`.
              await elegirMetodo(reservaId, canal);
              router.replace({
                pathname: '/(pasajero)/comprobante',
                params: { reserva: reservaId },
              });
            } finally {
              setConfirmando(false);
            }
          }}
        >
          {desglose.textoBoton}
        </Boton>
        <Text style={estilos.notaPie}>{desglose.nota}</Text>
      </View>
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
    fontSize: 11.5, lineHeight: 15.95,
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.campoTexto,
    flex: 1,
    fontFamily: familia,
  },
  titular: { fontSize: 22, lineHeight: 26, letterSpacing: -0.77, fontWeight: '600', color: color.ink900, fontFamily: familia, marginTop: 16, },
  titularFuerte: { fontWeight: '600' },

  hoja: {
    marginHorizontal: espacio.gutter,
    marginTop: 22,
    backgroundColor: color.blanco,
    borderRadius: radio.hoja,
    padding: 22,
    shadowColor: 'rgb(120,10,30)',
    shadowOpacity: 0.28,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
    elevation: 6,
  },

  metodo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  anillo: {
    width: 20,
    height: 20,
    borderRadius: radio.pastilla,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  puntoElegido: { width: 10, height: 10, borderRadius: radio.pastilla, backgroundColor: color.azul500 },
  metodoNombre: {
    fontSize: 15.5, lineHeight: 22.47,
    fontWeight: '500',
    letterSpacing: -0.28,
    color: color.ink900,
    fontFamily: familia,
  },
  /* ink800: la fila del método elegido va sobre un fondo más oscuro que el
     blanco, y con ink600 esta línea se quedaba en 4,43:1. */
  metodoDetalle: { fontSize: 12.5, lineHeight: 18.12, color: color.ink800, marginTop: 2, fontFamily: familia, ...tabular },
  distintivo: {
    fontSize: 10.5, lineHeight: 15.22,
    fontWeight: '600',
    letterSpacing: 10.5 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.azul700,
    fontFamily: familia,
  },

  tarjetaCuenta: {
    marginHorizontal: espacio.gutter,
    marginTop: 10,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    padding: 20,
    overflow: 'hidden',
    backgroundColor: color.blanco,
  },
  filaCuenta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  cuentaEtiqueta: { fontSize: 14, lineHeight: 21.02, color: color.ink800, fontFamily: familia },
  cuentaMonto: { fontSize: 14, lineHeight: 21.02, fontWeight: '500', color: color.ink800, fontFamily: familia },
  separador: { height: 1, backgroundColor: color.bordeSutil, marginVertical: 15 },
  filaTotal: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  totalEtiqueta: {
    fontSize: 11.5, lineHeight: 15.95,
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.ink500,
    paddingBottom: 5,
    fontFamily: familia,
  },
  total: {
    fontSize: 33,
    fontWeight: '700',
    letterSpacing: -1.53,
    lineHeight: 30.6,
    color: color.ink900,
    fontFamily: familia,
  },
  explicacion: { fontSize: 12.5, lineHeight: 18.125, color: color.ink600, marginTop: 14, fontFamily: familia },

  pie: {
    paddingHorizontal: espacio.gutter,
    paddingTop: 14,
    paddingBottom: 26,
    backgroundColor: color.blanco,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  notaPie: {
    textAlign: 'center',
    fontSize: 12.5,
    lineHeight: 18.125,
    color: color.ink500,
    marginTop: 10,
    fontFamily: familia,
  },
});
