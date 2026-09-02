/**
 * `10c` Administrar UN viaje — la puerta que decía «Administrar mi viaje»
 * por fin lleva a administrar MI VIAJE.
 *
 * Pedido del dueño el 02-09-2026: «quand j'appuie sur administrar c'est une
 * autre interface, c'est confus. Je ne comprends pas trop ce qui se passe».
 * Y lo que pasaba era esto: el botón «Administrar mi viaje» de la ficha
 * pública NO administraba ese viaje — abría el panel entero, con TODOS los
 * viajes publicados, por arriba. Quien venía de mirar su viaje del sábado
 * aterrizaba en una lista donde tenía que volver a encontrarlo, bajo otro
 * titular, con otra cabecera: la sensación exacta de «otra interfaz».
 *
 * La regla nueva es una sola: **tocar un viaje que conduces —donde sea:
 * en «Mis viajes», en la ficha pública, en un aviso— abre ESTA pantalla,
 * con ESE viaje.** Aquí está todo lo suyo: la tarjeta de siempre (la misma
 * del panel, pieza compartida: `ui/TarjetaDePublicado`), la banda de
 * solicitudes si las hay, el anuncio como lo ven los pasajeros, y una
 * puerta al panel para quien quiera ver todos juntos. El panel deja de ser
 * un destino sorpresa y pasa a ser lo que es: la vista de conjunto, a la
 * que se va queriendo ir.
 */

import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { useVolver } from '@/ui/salidas';

import { type ViajePublicado, viajePublicado } from '@/servicios/panel';
import { useMiIdOEntrar } from '@/servicios/sesion';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { CampoRojo } from '@/ui/CampoRojo';
import { Pestanas } from '@/ui/Pestanas';
import { Galon, TarjetaDePublicado, loQueQueda } from '@/ui/TarjetaDePublicado';
import { tabular } from '@/ui/dinero';
import { cuando } from '@/ui/fechas';
import { Atras, Avanza } from '@/ui/iconos';
import { color, espacio, familia, pulsado, radio, texto } from '@/ui/tokens';

/** Sin parámetro de ruta —solo al abrir la pantalla suelta—, el del traspaso. */
const DEL_RECORRIDO = '55555555-5555-4555-8555-555555555555';
/** Y el conductor del traspaso, para que la barra de abajo sepa quién es. */
const CONDUCTOR_DEL_RECORRIDO = '11111111-1111-4111-8111-111111111111';

export default function Administrar() {
  const router = useRouter();
  const volver = useVolver('/(conductor)/misviajes');
  const yo = useMiIdOEntrar(CONDUCTOR_DEL_RECORRIDO);
  const { viaje: parametro } = useLocalSearchParams<{ viaje?: string }>();
  const viajeId = parametro ?? DEL_RECORRIDO;
  const [viaje, setViaje] = useState<ViajePublicado | null>(null);
  const [buscado, setBuscado] = useState(false);

  /* Se recarga al VOLVER, no sólo al montar: de aquí se sale a aceptar
     solicitudes o a teclear códigos, y al regresar los asientos y la banda
     tienen que decir lo que acaba de pasar, no lo de antes de salir. */
  useFocusEffect(
    useCallback(() => {
      let vivo = true;
      viajePublicado(viajeId).then((v) => {
        if (!vivo) return;
        setViaje(v);
        setBuscado(true);
      });
      return () => {
        vivo = false;
      };
    }, [viajeId]),
  );

  if (!buscado) return <Cargando />;

  return (
    <View style={estilos.pantalla}>
      <BarraDeEstado />

      {/* TODA LA PANTALLA DESLIZA, no solo el cuerpo: en el teléfono se siente
          como una app y no como una cabecera clavada. Solo la barra de estado
          —y la de pestañas— quedan fijas. */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
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
            {viaje ? (
              <Text style={estilos.epigrafeCampo} numberOfLines={1}>
                {`${cuando(viaje.cuando)} · ${viaje.origen.split(' · ')[0]} → ${viaje.destino.split(' · ')[0]}`}
              </Text>
            ) : null}
          </View>
          <Text style={estilos.titular}>
            {'Administrar '}
            <Text style={texto.titularFuerte}>tu viaje</Text>
          </Text>
          {/* La bajada dice qué se decide aquí, como en los pasos de
              Publicar: es la pantalla de UN viaje, no la de la idea de
              conducir. */}
          <Text style={estilos.bajada}>
            Solicitudes, códigos y cambios de este viaje, en un solo sitio.
          </Text>
        </View>

        <View style={estilos.cuerpo}>
          {viaje ? (
            <>
              {/* LO ÚNICO CON RELOJ CORRIENDO, ARRIBA: la misma banda roja
                  del panel, pero contando SOLO este viaje. */}
              {viaje.solicitudes > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${viaje.solicitudes} solicitudes de puesto sin responder`}
                  onPress={() =>
                    router.push({
                      pathname: '/(conductor)/solicitudes',
                      params: { viaje: viaje.id },
                    })
                  }
                  style={({ pressed }) => [estilos.aviso, pressed && { opacity: 0.9 }]}
                >
                  <View style={estilos.contador}>
                    <Text style={estilos.contadorTexto}>{viaje.solicitudes}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={estilos.avisoTitulo}>
                      {viaje.solicitudes === 1 ? 'Te piden un puesto' : 'Te piden puesto'}
                    </Text>
                    <Text style={estilos.avisoPie}>
                      {`En este viaje · ${loQueQueda(viaje.expiraLaPrimera ?? undefined)}`}
                    </Text>
                  </View>
                  <Galon tinta={color.rojo700} />
                </Pressable>
              ) : null}

              {/* LA MISMA TARJETA DEL PANEL, para el mismo viaje: editar,
                  compartir y teclear códigos viven dentro de ella, en el
                  mismo sitio de siempre. Que aquí y en el panel se vea
                  IGUAL es el arreglo de fondo: ya no hay «otra interfaz». */}
              <TarjetaDePublicado viaje={viaje} tono={viaje.yaSalio ? 'pasado' : 'siguiente'} />

              <View style={estilos.puertas}>
                {/* El anuncio es la otra cara de este mismo viaje: lo que ve
                    quien busca puesto. Antes era al revés — el anuncio era la
                    puerta y esto no existía. */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Ver el anuncio como lo ven los pasajeros"
                  onPress={() =>
                    router.push({ pathname: '/(pasajero)/viaje', params: { viaje: viaje.id } })
                  }
                  style={({ pressed }) => [estilos.puerta, pressed && pulsado.celda]}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={estilos.puertaTexto}>Ver el anuncio</Text>
                    <Text style={estilos.puertaPie}>Como lo ven los pasajeros</Text>
                  </View>
                  <Avanza tamano={15} />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Ver todos tus viajes publicados"
                  onPress={() => router.push('/(conductor)/panel')}
                  style={({ pressed }) => [
                    estilos.puerta,
                    estilos.puertaSigue,
                    pressed && pulsado.celda,
                  ]}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={estilos.puertaTexto}>Todos tus viajes publicados</Text>
                    <Text style={estilos.puertaPie}>El panel, con cada viaje que conduces</Text>
                  </View>
                  <Avanza tamano={15} />
                </Pressable>
              </View>
            </>
          ) : (
            /* El viaje no está — un enlace viejo, o uno cancelado. Se dice y
               se ofrece la vuelta; una pantalla en blanco diría menos. */
            <Text style={estilos.noEsta}>
              Este viaje ya no está. Tus viajes publicados siguen en el panel.
            </Text>
          )}
        </View>
      </ScrollView>

      <Pestanas valor="Mis viajes" yo={yo} />
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
  epigrafeCampo: { ...texto.epigrafe, color: color.campoTexto, flex: 1 },
  titular: { ...texto.titulo, color: color.ink900, marginTop: 12 },
  bajada: {
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: -0.12,
    color: color.campoTexto,
    marginTop: 8,
    fontFamily: familia,
  },

  /* El hueco de abajo es el ALTO DE LA BARRA DE PESTAÑAS más aire, como en
     el panel: la tarjeta acaba en su fila de acciones, que hay que poder
     tocar. */
  cuerpo: { paddingHorizontal: espacio.gutter, paddingTop: 20, paddingBottom: 96 },

  /* La banda de solicitudes: idéntica a la del panel, contando uno solo. */
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    backgroundColor: color.rojo100,
    borderRadius: radio.l,
    paddingVertical: 13,
    paddingHorizontal: 15,
  },
  contador: {
    width: 34,
    height: 34,
    borderRadius: radio.cuadrado,
    backgroundColor: color.rojo500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contadorTexto: {
    fontSize: 15.5,
    lineHeight: 20,
    fontWeight: '700',
    color: '#fff',
    fontFamily: familia,
    ...tabular,
  },
  avisoTitulo: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    letterSpacing: -0.2175,
    color: color.rojo700,
    fontFamily: familia,
  },
  avisoPie: {
    fontSize: 12.5,
    lineHeight: 18.125,
    color: color.ink600,
    fontFamily: familia,
  },

  /* Las dos puertas, en un solo grupo blanco: salidas, no acciones. */
  puertas: {
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    marginTop: 8,
  },
  puerta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  puertaSigue: {
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  puertaTexto: {
    fontSize: 14.5,
    lineHeight: 20,
    fontWeight: '500',
    color: color.ink900,
    fontFamily: familia,
  },
  puertaPie: {
    fontSize: 12.5,
    lineHeight: 18,
    color: color.ink500,
    fontFamily: familia,
    marginTop: 1,
  },

  noEsta: {
    fontSize: 13.5,
    lineHeight: 20,
    color: color.ink600,
    fontFamily: familia,
  },
});
