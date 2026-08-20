/**
 * `5b` Mis viajes — el lado del pasajero.
 *
 * **La estructura que pidió el cliente**, traída a nuestro lenguaje: una ficha
 * grande para el viaje que viene y filas compactas para los demás.
 *
 * Lo que la ficha tiene que decir, en este orden, porque es el orden en que se
 * pregunta: de dónde a dónde, qué día y a qué hora, quién maneja y en qué
 * carro, y qué puedo hacer ahora. La pastilla de estado va arriba a la derecha
 * porque es lo primero que se busca cuando uno abre esta pantalla: *¿me
 * aceptaron?*
 *
 * **Lo pendiente también sale.** Antes `misViajes` filtraba `pending`, así que
 * quien acababa de pedir un puesto abría esto y no veía nada: parecía que la
 * petición se hubiera perdido. Ahora aparece con su pastilla ámbar.
 *
 * **No hay botón de llamar**, y no es un olvido. `PRODUCT.md` decide que el
 * contacto pasa por el chat, que queda escrito: un teléfono suelto no deja
 * rastro de lo que se acordó, y el punto de recogida se acuerda ahí. El tercer
 * botón es compartir a dónde vas, que es lo que de verdad se hace antes de
 * subirse al carro de alguien.
 */

import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { type MisViajes, type PuestoMio, misViajes } from '@/servicios/panel';
import { bandeja } from '@/servicios/avisos';
import { perfilResumido } from '@/servicios/perfiles';
import { useMiIdOEntrar } from '@/servicios/sesion';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { CampoRojo } from '@/ui/CampoRojo';
import { Pestanas } from '@/ui/Pestanas';
import { Avatar, Epigrafe } from '@/ui/controles';
import { formatearDineroRedondo, tabular } from '@/ui/dinero';
import { diaAbrev, diaSemana, hora, mesAbrev, numeroDeDia } from '@/ui/fechas';
import { Avanza, Campana, Carro, Chat, Compartir, Estrella, Visto } from '@/ui/iconos';
import {
  TRACK_MICRO,
  color,
  espacio,
  familia,
  interlinea,
  radio,
  zonaDeToque,
} from '@/ui/tokens';

/** Sin sesión que preguntar —solo en simulado—, la pasajera del traspaso. */
const DEL_RECORRIDO = '99999999-9999-4999-8999-999999999999';

type Pestana = 'proximos' | 'historial';

/** El estado de la reserva, en una palabra y con su color.
 *
 *  El ámbar no está en la paleta de marca por una razón: rojo es la marca y
 *  verde es «hecho», así que «esperando» no puede ser ninguno de los dos. El
 *  oro de los tokens es el único tercer color que el sistema admite. */
const ESTADO: Record<string, { texto: string; fondo: string; tinta: string }> = {
  confirmed: { texto: 'Confirmado', fondo: '#E6F2EC', tinta: color.verde500 },
  pending: { texto: 'Pendiente', fondo: '#FBF0D8', tinta: '#8A6413' },
  completed: { texto: 'Terminado', fondo: color.sand200, tinta: color.ink600 },
};

export default function MisViajesPantalla() {
  const router = useRouter();
  const yo = useMiIdOEntrar(DEL_RECORRIDO);
  const [datos, setDatos] = useState<MisViajes | null>(null);
  const [avisos, setAvisos] = useState(0);
  const [nombre, setNombre] = useState<string | null>(null);
  const [pestana, setPestana] = useState<Pestana>('proximos');

  useEffect(() => {
    if (!yo) return;
    misViajes(yo).then(setDatos);
    bandeja(yo).then((b) => setAvisos(b.sinLeer));
    perfilResumido(yo).then((p) => setNombre(p?.first_name ?? null));
  }, [yo]);

  if (!datos) return <Cargando altura={186} tarjetas={3} />;

  const proximo = datos.hoy ?? datos.proximos[0] ?? null;
  const otros = datos.proximos.filter((p) => p.reservaId !== proximo?.reservaId);
  const lista = pestana === 'proximos' ? otros : datos.pasados;

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={214} motivo="tornillo" />
      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <View style={estilos.filaSuperior}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={estilos.titular}>Mis viajes</Text>
            <Text style={estilos.bajada}>Consulta y administra tus próximos viajes.</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={avisos > 0 ? `Avisos, ${avisos} sin leer` : 'Avisos'}
            onPress={() => router.push('/(avisos)/avisos')}
            style={estilos.circulo}
          >
            <Campana tamano={18} tinta="#fff" />
            {avisos > 0 ? (
              <View style={estilos.chincheta}>
                <Text style={estilos.chinchetaTexto}>{avisos > 9 ? '9+' : avisos}</Text>
              </View>
            ) : null}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mi perfil"
            onPress={() => router.push('/(cuenta)/cuenta')}
            style={estilos.zonaAvatar}
          >
            <Avatar nombre={nombre ?? 'Tú'} tamano={38} tono="azul" />
          </Pressable>
        </View>

        <View style={estilos.selector}>
          {(
            [
              ['proximos', 'Próximos'],
              ['historial', 'Historial'],
            ] as const
          ).map(([clave, etiqueta]) => (
            <Pressable
              key={clave}
              accessibilityRole="tab"
              accessibilityState={{ selected: pestana === clave }}
              onPress={() => setPestana(clave)}
              style={[estilos.opcion, pestana === clave && estilos.opcionActiva]}
            >
              <Text style={[estilos.opcionTexto, pestana === clave && estilos.opcionTextoActivo]}>
                {etiqueta}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={estilos.cuerpo}
        showsVerticalScrollIndicator={false}
      >
        {pestana === 'proximos' && proximo ? (
          <>
            <Epigrafe>Tu próximo viaje</Epigrafe>
            <FichaGrande
              puesto={proximo}
              alChat={() =>
                router.push({ pathname: '/(pasajero)/chat', params: { reserva: proximo.reservaId } })
              }
              alDetalle={() =>
                router.push({ pathname: '/(pasajero)/viaje', params: { viaje: proximo.viajeId } })
              }
            />
          </>
        ) : null}

        <View style={estilos.filaSeccion}>
          <Epigrafe>{pestana === 'proximos' ? 'Otros próximos viajes' : 'Ya viajados'}</Epigrafe>
          {lista.length > 0 ? (
            <Text style={estilos.cuantos}>
              {lista.length === 1 ? '1 viaje' : `${lista.length} viajes`}
            </Text>
          ) : null}
        </View>

        {lista.length === 0 ? (
          <Vacio
            pestana={pestana}
            conProximo={!!proximo}
            alBuscar={() => router.push('/(pasajero)')}
          />
        ) : (
          <View style={{ gap: 8 }}>
            {lista.map((p) => (
              <FilaCompacta
                key={p.reservaId}
                puesto={p}
                alPulsar={() =>
                  router.push({ pathname: '/(pasajero)/viaje', params: { viaje: p.viajeId } })
                }
              />
            ))}
          </View>
        )}

        {/* Las dos puertas que no dibuja la referencia y que hay que conservar:
            sin ellas, el código de llegada y el panel del conductor solo se
            alcanzaban desde el catálogo de pantallas. */}
        <View style={estilos.puertas}>
          {proximo ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ver mi código de llegada"
              onPress={() =>
                router.push({
                  pathname: '/(pasajero)/llegada',
                  params: { reserva: proximo.reservaId },
                })
              }
              style={({ pressed }) => [estilos.puerta, pressed && { backgroundColor: color.sand100 }]}
            >
              <Text style={estilos.puertaTexto}>Código de llegada</Text>
              <Avanza />
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Los viajes que yo llevo"
            onPress={() => router.push('/(conductor)/panel')}
            style={({ pressed }) => [estilos.puerta, pressed && { backgroundColor: color.sand100 }]}
          >
            <Carro tamano={19} tinta={color.ink600} />
            <Text style={estilos.puertaTexto}>Los viajes que yo llevo</Text>
            <Avanza />
          </Pressable>
        </View>
      </ScrollView>

      <Pestanas valor="Mis viajes" conPublicar />
    </View>
  );
}

/* ------------------------------------------------------- La ficha grande */

function FichaGrande({
  puesto,
  alChat,
  alDetalle,
}: {
  puesto: PuestoMio;
  alChat: () => void;
  alDetalle: () => void;
}) {
  const estado = ESTADO[puesto.estado] ?? ESTADO.confirmed;

  return (
    <View style={estilos.ficha}>
      <View style={estilos.fichaCuerpo}>
        {/* La ruta como línea de tiempo: dos puntos y el hilo entre ellos. El
            de arriba es macizo —de ahí sales— y el de abajo es un aro, que es
            como el traspaso dibuja el final del recorrido. */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={estilos.hito}>
            <View style={estilos.carril}>
              <View style={estilos.puntoLleno} />
              <View style={estilos.hilo} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={estilos.lugar} numberOfLines={1}>
                {puesto.origen}
              </Text>
              {puesto.origenSitio ? (
                <Text style={estilos.sitio} numberOfLines={1}>
                  {puesto.origenSitio}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={estilos.hito}>
            <View style={estilos.carril}>
              <View style={estilos.puntoHueco} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={estilos.lugar} numberOfLines={1}>
                {puesto.destino}
              </Text>
              {puesto.destinoSitio ? (
                <Text style={estilos.sitio} numberOfLines={1}>
                  {puesto.destinoSitio}
                </Text>
              ) : null}
            </View>
          </View>

          {/* El aporte no está en la referencia y aquí sí hace falta: es lo
              único que el pasajero tiene que llevar en la mano al subirse. */}
          <Text style={estilos.aporte}>
            {formatearDineroRedondo(puesto.aporteCentavos)}
            <Text style={estilos.aporteSufijo}>{' por tu puesto'}</Text>
          </Text>
        </View>

        <View style={estilos.columnaFecha}>
          <View style={[estilos.pastilla, { backgroundColor: estado.fondo }]}>
            <View style={[estilos.pastillaPunto, { backgroundColor: estado.tinta }]} />
            <Text style={[estilos.pastillaTexto, { color: estado.tinta }]}>{estado.texto}</Text>
          </View>

          <View style={estilos.bloqueFecha}>
            <Text style={estilos.diaSemana}>{diaSemana(puesto.cuando)}</Text>
            <Text style={estilos.diaNumero}>{numeroDeDia(puesto.cuando)}</Text>
            <Text style={estilos.mes}>{mesAbrev(puesto.cuando)}</Text>
          </View>

          <View style={estilos.bloqueHora}>
            <Text style={estilos.epigrafeMini}>Salida</Text>
            <Text style={estilos.horaGrande}>{hora(puesto.cuando)}</Text>
          </View>
        </View>
      </View>

      {/* Quién maneja y en qué. Va en su propia banda, separada por una raya:
          es información de persona, no de itinerario. */}
      <View style={estilos.banda}>
        <Avatar nombre={puesto.conductor || '·'} tamano={40} tono="rojo" />
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={estilos.filaNombre}>
            <Text style={estilos.nombre} numberOfLines={1}>
              {puesto.conductor}
            </Text>
            {puesto.verificado ? <Visto tamano={14} tinta={color.azul500} /> : null}
          </View>
          <View style={estilos.filaNota}>
            {puesto.calificacion != null ? (
              <>
                <Estrella tamano={11} />
                <Text style={estilos.nota}>{puesto.calificacion.toFixed(1)}</Text>
                <Text style={estilos.separa}>·</Text>
              </>
            ) : null}
            <Text style={estilos.cuantosViajes}>
              {puesto.viajesDelConductor === 1
                ? '1 viaje'
                : `${puesto.viajesDelConductor} viajes`}
            </Text>
          </View>
        </View>

        {puesto.carro ? (
          <View style={estilos.carro}>
            <View style={estilos.cuadroCarro}>
              <Carro tamano={19} tinta={color.ink600} />
            </View>
            <View style={{ minWidth: 0 }}>
              <Text style={estilos.carroModelo} numberOfLines={1}>
                {puesto.carro.modelo}
              </Text>
              <Text style={estilos.carroDetalle} numberOfLines={1}>
                {[puesto.carro.color, puesto.carro.placa].filter(Boolean).join(' · ')}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      <View style={estilos.acciones}>
        {/* Los dos secundarios son cuadrados y sin rótulo: con «Chat» y
            «Compartir» escritos, los tres botones no caben en 302 px y «Ver
            detalles» se partía en dos líneas. La etiqueta accesible sí lleva
            la palabra, que es lo que importa para quien no ve el dibujo. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Escribirle a ${puesto.conductor}`}
          onPress={alChat}
          style={({ pressed }) => [estilos.cuadrado, pressed && { backgroundColor: color.sand100 }]}
        >
          <Chat tamano={17} tinta={color.azul500} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Compartir a dónde voy"
          onPress={() =>
            Share.share({
              title: 'Partimos',
              message: `Voy a ${puesto.destino} con ${puesto.conductor}. Salgo de ${puesto.origenSitio || puesto.origen} a las ${hora(puesto.cuando)}.`,
            })
          }
          style={({ pressed }) => [estilos.cuadrado, pressed && { backgroundColor: color.sand100 }]}
        >
          <Compartir tamano={17} tinta={color.azul500} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ver los detalles del viaje"
          onPress={alDetalle}
          style={({ pressed }) => [estilos.lleno, pressed && { backgroundColor: color.azul600 }]}
        >
          <Text style={estilos.llenoTexto} numberOfLines={1}>
            Ver detalles
          </Text>
          <Avanza tamano={14} tinta="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

/* ---------------------------------------------------- Las filas compactas */

function FilaCompacta({ puesto, alPulsar }: { puesto: PuestoMio; alPulsar: () => void }) {
  const estado = ESTADO[puesto.estado] ?? ESTADO.confirmed;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${puesto.origen} a ${puesto.destino}, ${diaAbrev(puesto.cuando)} ${hora(puesto.cuando)}, ${estado.texto.toLowerCase()}`}
      onPress={alPulsar}
      style={({ pressed }) => [estilos.fila, pressed && { backgroundColor: color.sand100 }]}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={estilos.hitoMini}>
          <View style={estilos.carrilMini}>
            <View style={estilos.puntoLlenoMini} />
            <View style={estilos.hiloMini} />
          </View>
          <Text style={estilos.lugarMini} numberOfLines={1}>
            {puesto.origen}
          </Text>
        </View>
        <View style={estilos.hitoMini}>
          <View style={estilos.carrilMini}>
            <View style={estilos.puntoHuecoMini} />
          </View>
          <Text style={estilos.lugarMini} numberOfLines={1}>
            {puesto.destino}
          </Text>
        </View>
        <Text style={estilos.sitioMini} numberOfLines={1}>
          {[puesto.conductor, formatearDineroRedondo(puesto.aporteCentavos)]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>

      <View style={estilos.ladoFila}>
        <View style={[estilos.pastilla, { backgroundColor: estado.fondo }]}>
          <Text style={[estilos.pastillaTexto, { color: estado.tinta }]}>{estado.texto}</Text>
        </View>
        <Text style={estilos.cuandoFila}>
          {`${diaAbrev(puesto.cuando)}, ${numeroDeDia(puesto.cuando)} ${mesAbrev(puesto.cuando)}`}
        </Text>
        <Text style={estilos.horaFila}>{hora(puesto.cuando)}</Text>
      </View>

      <Avanza />
    </Pressable>
  );
}

/* ------------------------------------------------------------- El vacío */

function Vacio({
  pestana,
  conProximo,
  alBuscar,
}: {
  pestana: Pestana;
  conProximo: boolean;
  alBuscar: () => void;
}) {
  const [titulo, texto] =
    pestana === 'historial'
      ? ['Todavía no has viajado', 'Cuando termines un viaje, queda aquí con lo que aportaste.']
      : conProximo
        ? ['No tienes más viajes por delante', 'Este es el único que tienes reservado ahora mismo.']
        : ['No tienes viajes reservados', 'Busca a dónde vas y pide tu puesto; aparecerá aquí.'];

  return (
    <View style={estilos.vacio}>
      <View style={estilos.cuadroVacio}>
        <Carro tamano={22} tinta={color.ink400} />
      </View>
      <Text style={estilos.vacioTitulo}>{titulo}</Text>
      <Text style={estilos.vacioTexto}>{texto}</Text>
      {pestana === 'proximos' && !conProximo ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buscar un viaje"
          onPress={alBuscar}
          style={({ pressed }) => [estilos.botonVacio, pressed && { backgroundColor: color.azul600 }]}
        >
          <Text style={estilos.llenoTexto}>Buscar un viaje</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: color.sand100,
    maxWidth: espacio.marco,
    width: '100%',
    alignSelf: 'center',
  },

  /* El relleno de abajo empuja el cuerpo por debajo del campo: sin él, el
     epígrafe «Tu próximo viaje» quedaba escrito en azul sobre el rojo. */
  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 16, paddingBottom: 66 },
  filaSuperior: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  titular: {
    fontSize: 29,
    lineHeight: 30.74,
    letterSpacing: -1.16,
    fontWeight: '600',
    color: '#fff',
    fontFamily: familia,
  },
  bajada: {
    fontSize: 13,
    lineHeight: 18.85,
    color: color.campoTexto,
    marginTop: 4,
    fontFamily: familia,
  },
  circulo: {
    width: espacio.tap,
    height: espacio.tap,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chincheta: {
    position: 'absolute',
    top: 5,
    right: 5,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: radio.pastilla,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chinchetaTexto: {
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: '700',
    color: color.rojo600,
    fontFamily: familia,
    ...tabular,
  },
  zonaAvatar: {
    width: espacio.tap,
    height: espacio.tap,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* El selector se sienta SOBRE el campo rojo, no debajo: en la referencia va
     pegado al título, y es lo que separa la cabecera de la lista. */
  selector: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 18,
    backgroundColor: 'rgba(255,255,255,.16)',
    borderRadius: radio.pastilla,
    padding: 4,
  },
  opcion: {
    flex: 1,
    height: espacio.tap,
    borderRadius: radio.pastilla,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opcionActiva: {
    backgroundColor: color.blanco,
    shadowColor: '#5E0717',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  opcionTexto: {
    fontSize: 13.5,
    lineHeight: 19.575,
    fontWeight: '600',
    color: color.campoTexto,
    fontFamily: familia,
  },
  opcionTextoActivo: { color: color.ink900 },

  cuerpo: { paddingHorizontal: espacio.gutter, paddingTop: 16, paddingBottom: 20, gap: 10 },

  filaSeccion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 12,
  },
  cuantos: { fontSize: 12.5, lineHeight: 18.125, color: color.ink500, fontFamily: familia },

  /* ── la ficha grande ── */
  ficha: {
    backgroundColor: color.blanco,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    shadowColor: '#5E0717',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
    overflow: 'hidden',
  },
  fichaCuerpo: { flexDirection: 'row', gap: 16, padding: 18 },

  hito: { flexDirection: 'row', gap: 12 },
  carril: { width: 12, alignItems: 'center', paddingTop: 5 },
  puntoLleno: { width: 10, height: 10, borderRadius: 5, backgroundColor: color.azul500 },
  hilo: { flex: 1, width: 2, marginVertical: 3, backgroundColor: color.ink200, borderRadius: 1 },
  puntoHueco: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: color.rojo500,
    backgroundColor: color.blanco,
  },
  lugar: {
    fontSize: 15.5,
    lineHeight: 21,
    fontWeight: '600',
    letterSpacing: -0.28,
    color: color.ink900,
    fontFamily: familia,
  },
  aporte: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '700',
    letterSpacing: -0.34,
    color: color.ink900,
    marginTop: 2,
    fontFamily: familia,
    ...tabular,
  },
  aporteSufijo: { fontSize: 12.5, lineHeight: 18.125, fontWeight: '400', color: color.ink500 },
  sitio: {
    fontSize: 12.5,
    lineHeight: 18.125,
    color: color.ink500,
    marginTop: 1,
    marginBottom: 12,
    fontFamily: familia,
  },

  columnaFecha: { alignItems: 'flex-end', gap: 10 },
  pastilla: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radio.pastilla,
  },
  pastillaPunto: { width: 5, height: 5, borderRadius: 2.5 },
  pastillaTexto: {
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: '700',
    letterSpacing: 10.5 * TRACK_MICRO,
    textTransform: 'uppercase',
    fontFamily: familia,
  },
  bloqueFecha: { alignItems: 'center' },
  diaSemana: {
    fontSize: 11,
    lineHeight: 15.95,
    fontWeight: '600',
    color: color.ink500,
    fontFamily: familia,
  },
  diaNumero: {
    fontSize: 27,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -1.08,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  mes: {
    fontSize: 11.5,
    lineHeight: 16.675,
    fontWeight: '600',
    color: color.ink600,
    fontFamily: familia,
  },
  bloqueHora: { alignItems: 'flex-end' },
  epigrafeMini: {
    fontSize: 10,
    lineHeight: 14.5,
    fontWeight: '600',
    letterSpacing: 10 * 0.07,
    textTransform: 'uppercase',
    color: color.ink500,
    fontFamily: familia,
  },
  horaGrande: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '700',
    letterSpacing: -0.34,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },

  banda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
    backgroundColor: color.sand50,
  },
  filaNombre: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  nombre: {
    fontSize: 14.5,
    lineHeight: 21,
    fontWeight: '600',
    letterSpacing: -0.22,
    color: color.ink900,
    fontFamily: familia,
  },
  filaNota: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  nota: { fontSize: 12, lineHeight: 17.4, fontWeight: '600', color: color.ink700, fontFamily: familia, ...tabular },
  /* `ink400` daba 2,59:1 sobre la banda: un punto es texto aunque separe. */
  separa: { fontSize: 12, lineHeight: 17.4, color: color.ink500, fontFamily: familia },
  cuantosViajes: { fontSize: 12, lineHeight: 17.4, color: color.ink500, fontFamily: familia, ...tabular },

  carro: { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: 148 },
  cuadroCarro: {
    width: 34,
    height: 34,
    borderRadius: radio.ficha,
    backgroundColor: color.sand200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carroModelo: {
    fontSize: 12.5,
    lineHeight: 18.125,
    fontWeight: '600',
    color: color.ink900,
    fontFamily: familia,
  },
  carroDetalle: { fontSize: 11.5, lineHeight: 16.675, color: color.ink500, fontFamily: familia },

  acciones: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
    paddingBottom: 18,
    paddingTop: 14,
  },
  cuadrado: {
    width: espacio.tap,
    height: espacio.tap,
    borderRadius: radio.pastilla,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lleno: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: espacio.tap,
    borderRadius: radio.pastilla,
    backgroundColor: color.azul500,
  },
  llenoTexto: {
    fontSize: 13.5,
    lineHeight: 19.575,
    fontWeight: '600',
    letterSpacing: -0.135,
    color: '#fff',
    fontFamily: familia,
  },

  /* ── las filas compactas ── */
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: radio.l,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
  },
  hitoMini: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  carrilMini: { width: 8, alignItems: 'center' },
  puntoLlenoMini: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: color.azul500 },
  hiloMini: { position: 'absolute', top: 10, width: 1.5, height: 12, backgroundColor: color.ink200 },
  puntoHuecoMini: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 1.5,
    borderColor: color.rojo500,
    backgroundColor: color.blanco,
  },
  lugarMini: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: -0.21,
    color: color.ink900,
    fontFamily: familia,
  },
  sitioMini: { fontSize: 12, lineHeight: 17.4, color: color.ink500, marginTop: 3, marginLeft: 17, fontFamily: familia },

  ladoFila: { alignItems: 'flex-end', gap: 4 },
  cuandoFila: { fontSize: 12, lineHeight: 17.4, color: color.ink600, fontFamily: familia, ...tabular },
  horaFila: {
    fontSize: 14.5,
    lineHeight: 20,
    fontWeight: '700',
    letterSpacing: -0.29,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },

  /* ── las puertas de abajo ── */
  puertas: { gap: 8, marginTop: 18 },
  puerta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 15,
    borderRadius: radio.l,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
  },
  puertaTexto: {
    flex: 1,
    fontSize: 14.5,
    lineHeight: 21,
    fontWeight: '500',
    letterSpacing: -0.22,
    color: color.ink900,
    fontFamily: familia,
  },

  /* ── el vacío ── */
  vacio: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 30,
    paddingHorizontal: 24,
    borderRadius: radio.l,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.bordePorDefecto,
  },
  cuadroVacio: {
    width: 52,
    height: 52,
    borderRadius: radio.pastilla,
    backgroundColor: color.sand200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  vacioTitulo: {
    fontSize: 15.5,
    lineHeight: 22.475,
    fontWeight: '600',
    letterSpacing: -0.28,
    color: color.ink900,
    textAlign: 'center',
    fontFamily: familia,
  },
  vacioTexto: {
    fontSize: 13.5,
    lineHeight: interlinea(13.5),
    color: color.ink600,
    textAlign: 'center',
    fontFamily: familia,
  },
  botonVacio: {
    marginTop: 12,
    height: espacio.tap,
    paddingHorizontal: 20,
    borderRadius: radio.pastilla,
    backgroundColor: color.azul500,
    alignItems: 'center',
    ...zonaDeToque,
  },
});
