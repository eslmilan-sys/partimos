/**
 * `10a` Panel del conductor — sus viajes publicados.
 *
 * Lo único de esta pantalla con reloj corriendo son las solicitudes sin
 * responder, y por eso van **ancladas dentro del viaje de hoy, en rojo y con
 * su caducidad escrita**: no responder en 4 h no es una notificación perdida,
 * es un puesto que se cae.
 *
 * El resto es deliberadamente tranquilo. Un viaje sin nadie todavía no es un
 * problema que resolver: es un viaje al que le queda tiempo, y lo que ofrece
 * es compartirlo, no un aviso.
 */

import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { useDecir } from '@/ui/Nota';
import { DIJO, compartir } from '@/ui/salidas';
import Svg, { Path } from 'react-native-svg';

import {
  type ViajeHecho,
  type ViajePublicado,
  viajesHechos,
  viajesPublicados,
} from '@/servicios/panel';
import { perfilResumido } from '@/servicios/perfiles';
import { useMiIdOEntrar } from '@/servicios/sesion';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Pestanas } from '@/ui/Pestanas';
import { CampoRojo } from '@/ui/CampoRojo';
import { Pastilla } from '@/ui/controles';
import { formatearDineroRedondo, tabular } from '@/ui/dinero';
import { cuando, diaAbrev, hora } from '@/ui/fechas';
import { color, espacio, familia, interlinea, radio, TRACK_MICRO, zonaDeToque } from '@/ui/tokens';

/** Sin sesión que preguntar —solo en simulado—, el conductor del traspaso. */
const DEL_RECORRIDO = '11111111-1111-4111-8111-111111111111';

export default function Panel() {
  const router = useRouter();
  const yo = useMiIdOEntrar(DEL_RECORRIDO);
  const [viajes, setViajes] = useState<ViajePublicado[]>([]);
  const [hechos, setHechos] = useState<ViajeHecho[]>([]);
  const [nombre, setNombre] = useState<string | null>(null);

  useEffect(() => {
    if (!yo) return;
    viajesPublicados(yo).then(setViajes);
    viajesHechos(yo).then(setHechos);
    perfilResumido(yo).then((p) => setNombre(p ? `${p.first_name} ${p.last_initial ?? ''}`.trim() : null));
  }, [yo]);

  /**
   * **UN VIAJE QUE YA SALIÓ NO ES «EL PRÓXIMO»** (27-08-2026, visto por el
   * dueño). `viajesPublicados` devuelve todo lo publicado ordenado por hora,
   * y el primero se dibujaba en la hoja blanca con el punto rojo en vivo —
   * también cuando era el de las 6 de esta mañana, ya hecho. Con «Editar» al
   * lado, que sobre un viaje pasado no es editar: es reescribir la historia.
   */
  const proximos = viajes.filter((v) => !v.yaSalio);
  const salidos = viajes.filter((v) => v.yaSalio);
  const [hoy, ...resto] = proximos;

  return (
    <View style={estilos.pantalla}>
      <BarraDeEstado />

      {/* TODA LA PANTALLA DESLIZA, no solo el cuerpo: en el teléfono se siente
          como una app y no como una cabecera clavada. Solo la barra de estado
          —y la de pestañas, donde la hay— quedan fijas. */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >

      <CampoRojo altura={214} />

      <View style={estilos.cabecera}>
        <Text style={estilos.epigrafeCampo}>{nombre ? `Conductor · ${nombre}` : 'Conductor'}</Text>
        <Text style={estilos.titular}>
          {'Tus viajes '}
          <Text style={estilos.titularFuerte}>publicados</Text>
        </Text>
      </View>

      <View style={estilos.cuerpo}>
        {hoy ? <Hoy viaje={hoy} router={router} /> : null}

        {resto.map((v) => (
          <Proximo key={v.id} viaje={v} router={router} />
        ))}

        {!hoy && salidos.length === 0 ? (
          <Text style={estilos.pieTexto}>
            No tienes viajes por delante. Publica el que ya ibas a hacer.
          </Text>
        ) : null}

        {/* LOS QUE YA SALIERON, aparte y sin «Editar». Estaban mezclados
            arriba, así que el viaje de las 6 de esta mañana se dibujaba como
            el próximo, con el punto rojo en vivo. Se siguen enseñando —desde
            aquí se teclean los códigos de quien todavía no ha subido— pero ya
            no se pueden tocar. */}
        {salidos.length > 0 ? (
          <>
            <Text style={estilos.epigrafeSeccion}>Ya salieron</Text>
            {salidos.map((v) => (
              <Proximo key={v.id} viaje={v} router={router} />
            ))}
          </>
        ) : null}

        {/* PARA REPETIR. El interurbano de verdad es semanal — a Chitré el
            viernes, de vuelta el domingo — y los viajes hechos no salían en
            ninguna pantalla: repetir uno era rellenar el formulario entero
            de memoria. Una ruta hecha, una fila; tocarla abre publicar ya
            rellenado y solo queda ponerle fecha. */}
        {hechos.length > 0 ? (
          <View style={estilos.repetir}>
            <Text style={estilos.repetirTitulo}>Para repetir</Text>
            {hechos.map((h, i) => (
              <Pressable
                key={h.id}
                accessibilityRole="button"
                accessibilityLabel={`Publicar de nuevo ${h.origen} a ${h.destino}`}
                onPress={() =>
                  router.push({ pathname: '/(conductor)/publicar', params: { deViaje: h.id } })
                }
                style={({ pressed }) => [
                  estilos.filaRepetir,
                  i > 0 && estilos.filaRepetirSigue,
                  pressed && { backgroundColor: color.lavadoChip },
                ]}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={estilos.repetirRuta} numberOfLines={1}>
                    {`${h.origen} → ${h.destino}`}
                  </Text>
                  <Text style={estilos.repetirMeta}>
                    {`${diaAbrev(h.cuando)} ${hora(h.cuando)} · ${
                      h.puestosVendidos === 1 ? '1 puesto vendido' : `${h.puestosVendidos} puestos vendidos`
                    }`}
                  </Text>
                </View>
                <Text style={estilos.repetirAccion}>Publicar de nuevo</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <Text style={estilos.pieTexto}>
          Puedes editar un viaje mientras nadie haya asegurado su puesto y no haya salido.
        </Text>
      </View>
      </ScrollView>

      {/* Sin FAB propio: la barra de abajo YA tiene la casilla Publicar
          levantada en el centro. Dos «+» flotando a sesenta píxeles el uno
          del otro eran la misma acción dibujada dos veces. */}
      <Pestanas valor="Mis viajes" />
    </View>
  );
}

const tinta = (activo: boolean) => (activo ? color.rojo600 : color.ink700);

type Router = ReturnType<typeof useRouter>;

/** El viaje de hoy va en hoja blanca sobre el campo: es el que manda. */
function Hoy({ viaje, router }: { viaje: ViajePublicado; router: Router }) {
  return (
    <View style={estilos.hoja}>
      <View style={estilos.filaEpigrafe}>
        <Text style={estilos.epigrafeVivo}>{cuando(viaje.cuando)}</Text>
        <View style={estilos.puntoVivo} />
        {viaje.sePuedeEditar ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Editar este viaje"
            onPress={() =>
              router.push({ pathname: '/(conductor)/editar', params: { viaje: viaje.id } })
            }
            style={[{ marginLeft: 'auto', paddingHorizontal: 6 }, zonaDeToque]}
          >
            <Text style={estilos.enlace}>Editar</Text>
          </Pressable>
        ) : null}
      </View>

      <Recorrido viaje={viaje} />

      <View style={estilos.filaVendidos}>
        <Text style={estilos.vendidos}>
          {`${viaje.puestosVendidos} de ${viaje.puestosOfrecidos} puestos vendidos`}
        </Text>
      </View>

      {viaje.solicitudes > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${viaje.solicitudes} solicitudes nuevas`}
          onPress={() =>
            router.push({ pathname: '/(conductor)/solicitudes', params: { viaje: viaje.id } })
          }
          style={estilos.solicitudes}
        >
          <View style={estilos.contador}>
            <Text style={estilos.contadorTexto}>{viaje.solicitudes}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={estilos.solicitudesTitulo}>Solicitudes nuevas</Text>
            <Text style={estilos.solicitudesPie}>Se les cobra al aceptar · expiran en 4 h</Text>
          </View>
          <Galon />
        </Pressable>
      ) : null}

      {/* Subir a la gente: la pantalla de los dos códigos. Existía y no se
          llegaba a ella desde ningún sitio de la app. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Abordar: teclear los códigos"
        onPress={() =>
          router.push({ pathname: '/(conductor)/abordaje', params: { viaje: viaje.id } })
        }
        style={estilos.abordar}
      >
        <Text style={estilos.abordarTexto}>Abordar · teclear los códigos</Text>
        <Galon />
      </Pressable>
    </View>
  );
}

/** Los demás van en tarjeta normal, sobre la arena. */
function Proximo({ viaje, router }: { viaje: ViajePublicado; router: Router }) {
  const decir = useDecir();
  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.filaEpigrafe}>
        <Text style={estilos.epigrafeAzul}>
          {`${diaAbrev(viaje.cuando)} ${diaNumero(viaje.cuando)} · ${hora(viaje.cuando)}`}
        </Text>
        {viaje.sePuedeEditar ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Editar este viaje"
            onPress={() =>
              router.push({ pathname: '/(conductor)/editar', params: { viaje: viaje.id } })
            }
            style={[{ marginLeft: 'auto', paddingHorizontal: 6 }, zonaDeToque]}
          >
            <Text style={estilos.enlace}>Editar</Text>
          </Pressable>
        ) : null}
      </View>

      {/* La dirección se escribe con el raíl, no con una flecha entre dos
          nombres en una línea (invariante 1) — que además, con un nombre
          largo, envolvía y se metía debajo del aporte. Cada lugar en su
          fila; el aporte vive junto al origen. */}
      <View style={estilos.recorrido}>
        <View style={estilos.filaRuta}>
          <View style={estilos.puntoAzul} />
          <Text style={estilos.parada} numberOfLines={1}>{viaje.origen}</Text>
          <Text style={estilos.horaParada}>{formatearDineroRedondo(viaje.aporteCentavos)}</Text>
        </View>
        <View style={estilos.filaRuta}>
          <View style={estilos.puntoVacio} />
          <Text style={estilos.parada} numberOfLines={1}>{viaje.destino}</Text>
        </View>
      </View>

      <View style={estilos.filaVendidos}>
        <Text style={estilos.nadie}>
          {viaje.puestosVendidos === 0
            ? 'Nadie todavía'
            : `${viaje.puestosVendidos} de ${viaje.puestosOfrecidos} puestos vendidos`}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Compartir el viaje"
          onPress={() =>
            compartir(`${viaje.origen} → ${viaje.destino} · ${diaAbrev(viaje.cuando)} ${hora(viaje.cuando)} · ${formatearDineroRedondo(viaje.aporteCentavos)} por puesto · quedan ${viaje.puestosOfrecidos - viaje.puestosVendidos}`).then((c) => decir(DIJO[c]))
          }
          style={[{ marginLeft: 'auto', paddingHorizontal: 6 }, zonaDeToque]}
        >
          <Text style={estilos.enlace}>Compartir el viaje</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Recorrido({ viaje }: { viaje: ViajePublicado }) {
  return (
    <View style={estilos.recorrido}>
      <View style={estilos.filaRuta}>
        <View style={estilos.puntoLleno} />
        <Text style={estilos.parada}>{viaje.origen}</Text>
        <Text style={estilos.horaParada}>{hora(viaje.horaSalida)}</Text>
      </View>
      <View style={estilos.filaRuta}>
        <View style={estilos.puntoVacio} />
        <Text style={estilos.parada}>{viaje.destino}</Text>
        <Text style={estilos.horaParada}>{hora(viaje.horaLlegada)}</Text>
      </View>
    </View>
  );
}

/** El galón que dice «esto lleva a algún sitio». */
function Galon() {
  return (
    <Svg viewBox="0 0 24 24" width={18} height={18} fill="none">
      <Path
        d="M9 6l6 6-6 6"
        stroke={color.rojo700}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const diaNumero = (cuandoISO: string) =>
  new Intl.DateTimeFormat('es-PA', { day: 'numeric', timeZone: 'America/Panama' }).format(
    new Date(cuandoISO),
  );

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: color.sand100,
    maxWidth: espacio.marco,
    width: '100%',
    alignSelf: 'center',
  },

  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 6 },
  epigrafeCampo: {
    fontSize: 11.5,
    lineHeight: interlinea(11),
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.campoTexto,
    fontFamily: familia,
  },
  titular: { fontSize: 22, lineHeight: 26, letterSpacing: -0.77, fontWeight: '600', color: color.ink900, fontFamily: familia, marginTop: 12, },
  titularFuerte: { fontWeight: '600' },

  cuerpo: { paddingHorizontal: espacio.gutter, paddingTop: 22, paddingBottom: 8, gap: 10 },

  hoja: {
    backgroundColor: color.blanco,
    borderRadius: 28,
    padding: 20,
    shadowColor: 'rgb(120,10,30)',
    shadowOpacity: 0.28,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
    elevation: 6,
  },
  tarjeta: {
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    padding: 20,
    marginTop: 13,
  },

  filaEpigrafe: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  epigrafeVivo: {
    fontSize: 11.5,
    lineHeight: interlinea(11),
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.rojo600,
    fontFamily: familia,
  },
  epigrafeAzul: {
    fontSize: 11.5,
    lineHeight: interlinea(11),
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.azul500,
    fontFamily: familia,
  },
  puntoVivo: { width: 7, height: 7, borderRadius: 999, backgroundColor: color.rojo500 },
  enlace: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    color: color.rojo700,
    fontFamily: familia,
  },

  recorrido: { gap: 9, marginTop: 13 },
  filaRuta: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  puntoLleno: { width: 9, height: 9, borderRadius: 999, backgroundColor: color.rojo500 },
  puntoAzul: { width: 9, height: 9, borderRadius: 999, backgroundColor: color.azul700 },
  puntoVacio: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: color.blanco,
    borderWidth: 2,
    borderColor: color.ink200,
  },
  parada: {
    flex: 1,
    fontSize: 15.5,
    lineHeight: 23.2,
    fontWeight: '500',
    letterSpacing: -0.32,
    color: color.ink900,
    fontFamily: familia,
  },
  horaParada: {
    fontSize: 13.5,
    lineHeight: 18.85,
    color: color.ink500,
    fontFamily: familia,
    ...tabular,
  },

  filaVendidos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  vendidos: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: interlinea(13.5),
    color: color.ink700,
    fontFamily: familia,
    ...tabular,
  },
  nadie: {
    fontSize: 13.5,
    lineHeight: interlinea(13.5),
    color: color.ink500,
    fontFamily: familia,
  },

  // La única caja roja de la pantalla, y por eso es la que se mira primero.
  abordar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 54,
    paddingHorizontal: 15,
    marginTop: 12,
    borderRadius: radio.l,
    borderWidth: 1.5,
    borderColor: color.azul200,
    backgroundColor: color.azul50,
  },
  abordarTexto: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: color.azul700,
    fontFamily: familia,
  },
  solicitudes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    backgroundColor: color.rojo100,
    borderRadius: 16,
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
    lineHeight: interlinea(15),
    fontWeight: '700',
    color: '#fff',
    fontFamily: familia,
    ...tabular,
  },
  solicitudesTitulo: {
    fontSize: 14,
    lineHeight: 21.025,
    fontWeight: '600',
    letterSpacing: -0.2175,
    color: color.rojo700,
    fontFamily: familia,
  },
  solicitudesPie: {
    fontSize: 12.5,
    lineHeight: 18.125,
    color: color.ink600,
    fontFamily: familia,
  },

  repetir: {
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
    paddingVertical: 6,
    marginTop: 14,
  },
  repetirTitulo: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    letterSpacing: TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.ink500,
    fontFamily: familia,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  filaRepetir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  filaRepetirSigue: {
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  repetirRuta: {
    fontSize: 14.5,
    lineHeight: 20,
    fontWeight: '500',
    color: color.ink900,
    fontFamily: familia,
  },
  repetirMeta: {
    fontSize: 12.5,
    lineHeight: 18,
    color: color.ink600,
    fontFamily: familia,
    ...tabular,
  },
  repetirAccion: {
    fontSize: 13,
    lineHeight: 18.85,
    fontWeight: '600',
    color: color.azul700,
    fontFamily: familia,
  },
  epigrafeSeccion: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 11.5 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.ink500,
    marginTop: 18,
    marginBottom: 2,
    fontFamily: familia,
  },
  pieTexto: {
    fontSize: 12.5,
    lineHeight: 18.75,
    color: color.ink500,
    marginTop: 14,
    fontFamily: familia,
  },


  pie: { paddingTop: 10, paddingHorizontal: 14, paddingBottom: 22 },
});
