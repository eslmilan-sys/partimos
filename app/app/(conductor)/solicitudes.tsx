/**
 * `11a` Solicitudes de puesto — donde se cobra.
 *
 * Aceptar convierte la tarjeta en un recibo, descuenta el puesto y recuenta la
 * cabecera. Rechazar no pide motivo: la tarjeta desaparece. Una solicitud a
 * menos de una hora de caducar lleva la pastilla en rojo sólido; el resto, en
 * rojo pálido.
 */

import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { DIJO, compartir, useVolver } from '@/ui/salidas';
import { useDecir } from '@/ui/Nota';

import {
  type ResumenDeSolicitudes,
  aceptarSolicitud,
  listarSolicitudes,
  rechazarSolicitud,
} from '@/servicios/solicitudes';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { CampoRojo } from '@/ui/CampoRojo';
import { Avatar, Boton, Epigrafe, Insignia } from '@/ui/controles';
import { formatearDineroRedondo, tabular } from '@/ui/dinero';
import { Atras, Avanza, Chat, Maleta, Pin, Visto } from '@/ui/iconos';
import { cuando } from '@/ui/fechas';
import { familia, color, espacio, pulsado, radio, texto } from '@/ui/tokens';

/** Sin parámetro de ruta —solo al abrir la pantalla suelta—, el del traspaso. */
const DEL_RECORRIDO = '55555555-5555-4555-8555-555555555555';

/** Lo que la pantalla recuerda de lo que acabas de aceptar, para el recibo. */
type Recibo = { nombre: string; aporteCentavos: number };

export default function Solicitudes() {
  const router = useRouter();
  const decir = useDecir();
  const volver = useVolver('/(conductor)/panel');
  const { viaje } = useLocalSearchParams<{ viaje?: string }>();
  const viajeId = viaje ?? DEL_RECORRIDO;
  const [datos, setDatos] = useState<ResumenDeSolicitudes | null>(null);
  const [recibos, setRecibos] = useState<Record<string, Recibo>>({});
  const [ocupado, setOcupado] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setDatos(await listarSolicitudes(viajeId));
  }, [viajeId]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  if (!datos) return <Cargando />;

  const aceptar = async (id: string, nombre: string, aporteCentavos: number) => {
    setOcupado(id);
    try {
      await aceptarSolicitud(id);
      setRecibos((r) => ({ ...r, [id]: { nombre, aporteCentavos } }));
      await recargar();
    } finally {
      setOcupado(null);
    }
  };

  const rechazar = async (id: string) => {
    setOcupado(id);
    try {
      await rechazarSolicitud(id);
      await recargar();
    } finally {
      setOcupado(null);
    }
  };

  const aceptadas = Object.entries(recibos);
  const quedan = Math.max(0, datos.puestosOfrecidos - datos.puestosVendidos);
  const sinSolicitudes = datos.solicitudes.length === 0 && aceptadas.length === 0;
  // quien acaba de aceptarse ya se ve arriba como recibo: no se repite abajo
  const yaVanContigo = datos.confirmados.filter((c) => !recibos[c.reservaId]);

  return (
    <View style={estilos.pantalla}>
      <BarraDeEstado />

      {/* TODA LA PANTALLA DESLIZA, no solo el cuerpo: en el teléfono se siente
          como una app y no como una cabecera clavada. Solo la barra de estado
          —y la de pestañas, donde la hay— quedan fijas. */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 26 }}
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
          <Text style={estilos.epigrafeCampo}>
            {`${cuando(datos.viaje.salida)} · ${datos.viaje.origen} → ${datos.viaje.destino}`}
          </Text>
        </View>
        <Text style={estilos.titular}>
          {'Piden '}
          <Text style={texto.titularFuerte}>puesto</Text>
        </Text>
        <Text style={estilos.subtitulo}>{datos.texto}</Text>
      </View>

        {datos.solicitudes.map((s) => (
          <View key={s.id} style={estilos.tarjeta}>
            <View style={estilos.filaPersona}>
              <Avatar nombre={s.pasajero.nombre} tono={s.urgente ? 'rojo' : 'azul'} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={estilos.nombre}>{s.pasajero.nombre}</Text>
                <Text style={estilos.reputacion}>{s.pasajero.reputacion}</Text>
              </View>
              <View
                style={[
                  estilos.pastillaExpira,
                  { backgroundColor: s.urgente ? color.rojo500 : color.rojo100 },
                ]}
              >
                <Text
                  style={[
                    estilos.pastillaExpiraTexto,
                    { color: s.urgente ? color.blanco : color.rojo700 },
                  ]}
                >
                  {s.expiraEn}
                </Text>
              </View>
            </View>

            <View style={estilos.filaPunto}>
              <Pin />
              <Text style={estilos.punto} numberOfLines={1}>
                {s.punto}
              </Text>
              {s.minutosDeDesvio != null ? (
                <Text style={estilos.desvio}>{`+${s.minutosDeDesvio} min`}</Text>
              ) : null}
            </View>

            {/* EL EQUIPAJE, DICHO ANTES DE DECIDIR. El pasajero declara lo
                que lleva y el conductor responde a eso — no a un booleano
                que puso meses antes (25-08-2026). La maleta se destaca
                porque es lo único que puede no caber; un bolso no. */}
            <View style={[estilos.filaEquipaje, s.vaAlMaletero && estilos.filaMaletero]}>
              <Maleta tinta={s.vaAlMaletero ? color.esperaTinta : color.ink600} />
              <Text style={[estilos.equipaje, s.vaAlMaletero && estilos.equipajeMaletero]}>
                {s.equipaje}
              </Text>
              <Text style={estilos.aporte}>{formatearDineroRedondo(s.aporteCentavos)}</Text>
            </View>

            {/* Ver a quién le estás abriendo el carro antes de decidir: la
                pantalla existía y no se llegaba a ella desde ningún sitio. */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Ver el perfil de ${s.pasajero.nombre}`}
              onPress={() =>
                router.push({
                  pathname: '/(conductor)/solicitante',
                  params: { viaje: viajeId, solicitud: s.id },
                })
              }
              style={({ pressed }) => [estilos.verQuien, pressed && { backgroundColor: color.sand200 }]}
            >
              <Text style={estilos.verQuienTexto}>{`Ver quién es ${s.pasajero.nombre.split(' ')[0]}`}</Text>
              <Avanza tamano={15} />
            </Pressable>

            <View style={estilos.acciones}>
              <Boton
                tamano="md"
                ancho
                desactivado={ocupado === s.id}
                alPulsar={() => aceptar(s.id, s.pasajero.nombre, s.aporteCentavos)}
              >
                {`Aceptar · ${formatearDineroRedondo(s.aporteCentavos)}`}
              </Boton>
              <Boton
                tono="contorno"
                tamano="md"
                desactivado={ocupado === s.id}
                alPulsar={() => rechazar(s.id)}
              >
                No puedo
              </Boton>
            </View>
          </View>
        ))}

        {aceptadas.map(([id, r]) => (
          <View key={id} style={estilos.tarjeta}>
            <View style={estilos.filaPersona}>
              <Avatar nombre={r.nombre} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={estilos.nombre}>{r.nombre}</Text>
                <Text style={estilos.reputacion}>Confirmado</Text>
              </View>
            </View>
            <View style={estilos.recibo}>
              <View style={estilos.circuloVerde}>
                <Visto />
              </View>
              <Text style={estilos.reciboTexto}>
                {`Aceptado · le cobramos ${formatearDineroRedondo(r.aporteCentavos)}`}
              </Text>
              {/* **AHORA ABRE EL CHAT** (28-08-2026, visto por el dueño).
                  Era un `Text` pintado de azul: parecía un enlace, tenía el
                  color de un enlace, y no hacía absolutamente nada. Justo
                  después de aceptar es cuando hay algo que decirse —dónde y a
                  qué hora—, así que era el peor sitio donde poner un botón
                  muerto. `id` es el de la reserva, que es la clave del hilo. */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Escribirle a ${r.nombre}`}
                onPress={() =>
                  router.push({ pathname: '/(pasajero)/chat', params: { reserva: id } })
                }
                style={({ pressed }) => [estilos.botonEscribir, pressed && pulsado.celda]}
              >
                <Text style={estilos.escribir}>Escribir</Text>
              </Pressable>
            </View>
          </View>
        ))}

        {/* ESPERAR NO ES LA ÚNICA OPCIÓN. El vacío decía «te avisamos» y ahí
            terminaba: la pantalla pedía paciencia sin dar nada que hacer. Lo
            que de verdad llena un carro es que la gente sepa que sale, así
            que el vacío ofrece exactamente eso — compartirlo. */}
        {sinSolicitudes ? (
          <View style={estilos.vacio}>
            <Text style={estilos.vacioTitulo}>Sin solicitudes por ahora.</Text>
            <Text style={estilos.vacioTexto}>
              {`Te avisamos en cuanto alguien pida puesto. Mientras tanto, ${
                quedan === 1 ? 'queda 1 puesto' : `quedan ${quedan} puestos`
              }: pásalo por el grupo y se llena antes.`}
            </Text>
            <View style={{ marginTop: 14 }}>
              <Boton
                tono="blanco"
                tamano="md"
                ancho
                alPulsar={() =>
                  compartir(
                    `${datos.viaje.origen} → ${datos.viaje.destino} · ${cuando(datos.viaje.salida)} · ${
                      quedan === 1 ? 'queda 1 puesto' : `quedan ${quedan} puestos`
                    } · lo publiqué en Partimos`,
                  ).then((c) => decir(DIJO[c]))
                }
              >
                Compartir el viaje
              </Boton>
            </View>
          </View>
        ) : null}

        {yaVanContigo.length > 0 ? (
          <View style={estilos.seccionConfirmados}>
            <View style={{ marginBottom: 10 }}>
              <Epigrafe>Ya van contigo</Epigrafe>
            </View>
            {yaVanContigo.map((c) => (
              <View key={c.reservaId} style={estilos.filaConfirmado}>
                <Avatar nombre={c.nombre} tamano={36} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={estilos.nombreConfirmado}>{c.nombre}</Text>
                  <Text style={estilos.detalleConfirmado} numberOfLines={1}>
                    {`${c.punto} · ${c.equipaje}`}
                  </Text>
                </View>
                <Insignia
                  punto
                  fondo={c.pagado ? color.hechoFondo : color.sand200}
                  tinta={c.pagado ? color.hechoTinta : color.ink700}
                >
                  {c.pagado ? 'Aporte listo' : 'Aporta al subir'}
                </Insignia>
                {/* Y a quien ya iba contigo, también: la fila enseñaba su
                    punto y su equipaje y no daba forma de preguntarle nada. */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Escribirle a ${c.nombre}`}
                  onPress={() =>
                    router.push({ pathname: '/(pasajero)/chat', params: { reserva: c.reservaId } })
                  }
                  style={({ pressed }) => [estilos.celdaChat, pressed && pulsado.celda]}
                >
                  <Chat tamano={18} tinta={color.ink600} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
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
  subtitulo: {
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: -0.12,
    color: color.campoTexto,
    marginTop: 8,
    fontFamily: familia,
    ...tabular,
  },

  tarjeta: {
    marginHorizontal: espacio.gutter,
    marginTop: 14,
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    padding: 18,
    shadowColor: '#14141A',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  filaPersona: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nombre: { fontSize: 15.5, lineHeight: 23.2, fontWeight: '500', letterSpacing: -0.32, color: color.ink900, fontFamily: familia },
  reputacion: { fontSize: 12.5, lineHeight: 18.12, color: color.ink600, marginTop: 1, fontFamily: familia, ...tabular },
  pastillaExpira: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: radio.pastilla },
  pastillaExpiraTexto: { fontSize: 11.5, lineHeight: 15.95, fontWeight: '600', fontFamily: familia },

  filaPunto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 14,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  punto: { flex: 1, fontSize: 13.5, lineHeight: 19.57, fontWeight: '500', letterSpacing: -0.2, color: color.ink900, fontFamily: familia },
  desvio: { fontSize: 13.5, lineHeight: 19.57, color: color.ink500, fontFamily: familia, ...tabular },

  /* Cuando algo va al maletero, la fila se enciende en ámbar: es una
     espera de respuesta, no una alarma — el rojo tiene sus cuatro sentidos. */
  filaMaletero: {
    backgroundColor: color.arena100,
    borderRadius: radio.anidado,
    paddingHorizontal: 10,
    marginHorizontal: -10,
    paddingVertical: 8,
  },
  equipajeMaletero: { color: color.esperaTinta, fontWeight: '600' },
  filaEquipaje: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 10 },
  equipaje: { flex: 1, fontSize: 13.5, lineHeight: 19.57, color: color.ink700, fontFamily: familia },
  aporte: { fontSize: 19, lineHeight: 27.55, fontWeight: '700', letterSpacing: -0.67, color: color.ink900, fontFamily: familia, ...tabular },

  verQuien: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: espacio.tap,
    gap: 8,
    alignSelf: 'flex-start',
    marginTop: 12,
    marginBottom: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radio.pastilla,
    backgroundColor: color.sand100,
  },
  verQuienTexto: {
    fontSize: 13.5,
    lineHeight: 19.5,
    fontWeight: '600',
    color: color.ink700,
    fontFamily: familia,
  },
  acciones: { flexDirection: 'row', gap: 9, marginTop: 15 },

  recibo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: color.sand100,
  },
  circuloVerde: {
    width: 22,
    height: 22,
    borderRadius: radio.pastilla,
    backgroundColor: color.verde500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reciboTexto: { flex: 1, fontSize: 13.5, lineHeight: 19.57, fontWeight: '500', letterSpacing: -0.2, color: color.ink900, fontFamily: familia },
  escribir: { fontSize: 12.5, lineHeight: 18.12, fontWeight: '600', color: color.azul700, fontFamily: familia },
  /** Zona de toque de verdad: el texto solo mide 18 px de alto. */
  botonEscribir: { paddingVertical: 6, paddingHorizontal: 8, marginVertical: -6, marginRight: -8, borderRadius: radio.s },
  celdaChat: {
    width: 36,
    height: 36,
    borderRadius: radio.icono,
    alignItems: 'center',
    justifyContent: 'center',
  },

  vacio: {
    marginHorizontal: espacio.gutter,
    marginTop: 14,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.bordePorDefecto,
    borderRadius: radio.l,
    padding: 20,
  },
  vacioTitulo: {
    fontSize: 15.5,
    lineHeight: 21.75,
    fontWeight: '500',
    color: color.ink900,
    fontFamily: familia,
    marginBottom: 4,
  },
  vacioTexto: { fontSize: 13.5, lineHeight: 20, color: color.ink600, fontFamily: familia },

  seccionConfirmados: { marginHorizontal: espacio.gutter, marginTop: 16 },
  filaConfirmado: {
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderRadius: radio.l,
    paddingVertical: 15,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nombreConfirmado: { fontSize: 14, lineHeight: 21.02, fontWeight: '500', letterSpacing: -0.22, color: color.ink900, fontFamily: familia },
  detalleConfirmado: { fontSize: 12.5, lineHeight: 18.12, color: color.ink500, marginTop: 1, fontFamily: familia },
});
