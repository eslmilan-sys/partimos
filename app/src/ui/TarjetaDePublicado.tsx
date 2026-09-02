/**
 * LA TARJETA DE UN VIAJE PUBLICADO — la misma en el panel y en «Administrar».
 *
 * Nació dentro de `10a` (panel del conductor) y se sacó aquí el 02-09-2026,
 * cuando apareció la pantalla de administrar UN viaje. El motivo de fondo lo
 * dio el dueño ese día: «quand j'appuie sur administrar c'est une autre
 * interface, c'est confus». Y era verdad: un viaje que conduces se dibujaba
 * de una manera en el panel y de otra en cada sitio que lo enseñaba, así que
 * cada puerta parecía abrir una app distinta. **Un viaje que conduces se
 * dibuja SIEMPRE así**, esté donde esté — eso es lo que esta pieza garantiza.
 *
 * Cinco renglones, siempre en el mismo orden y en el mismo sitio: **cuándo ·
 * dónde · quién va · cuánto · qué hago ahora**. `tono` cambia el peso, no la
 * estructura: `siguiente` es la hoja con sombra, `proximo` la tarjeta con
 * borde, `pasado` la apagada sobre la arena.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import Svg, { Path } from 'react-native-svg';

import type { ViajePublicado } from '@/servicios/panel';

import { useDecir } from './Nota';
import { DIJO, compartir } from './salidas';
import { formatearDineroRedondo, tabular } from './dinero';
import { diaAbrev, diaSemana, duracionEntre, esHoy, hora, mesAbrev, numeroDeDia } from './fechas';
import { Asiento } from './iconos';
import { TRACK_MICRO, color, familia, interlinea, radio, zonaDeToque } from './tokens';

export type Tono = 'siguiente' | 'proximo' | 'pasado';

/**
 * LO QUE QUEDA DE LA VENTANA, no lo que dura la ventana.
 *
 * Una solicitud sin responder caduca a las 4 h. La banda decía «expiran en
 * 4 h» siempre, así que a los tres minutos de que caiga la primera seguía
 * diciendo cuatro horas: una cuenta atrás escrita como una constante. Vive
 * aquí porque la banda de solicitudes se dibuja en las dos pantallas que
 * usan esta tarjeta.
 */
export function loQueQueda(expira?: string): string {
  if (!expira) return 'expiran a las 4 h de pedirlo';
  const minutos = Math.round((new Date(expira).getTime() - Date.now()) / 60_000);
  if (minutos <= 0) return 'la primera está a punto de caerse';
  if (minutos < 60) return `la primera se cae en ${minutos} min`;
  return `la primera se cae en ${Math.floor(minutos / 60)} h`;
}

export function TarjetaDePublicado({ viaje, tono }: { viaje: ViajePublicado; tono: Tono }) {
  const router = useRouter();
  const decir = useDecir();
  const pasado = tono === 'pasado';
  const libres = viaje.puestosOfrecidos - viaje.puestosVendidos;
  const recupera = viaje.aporteCentavos * viaje.puestosVendidos;
  const siSeLlena = viaje.aporteCentavos * viaje.puestosOfrecidos;

  return (
    <View style={[estilos.tarjeta, tono === 'siguiente' && estilos.tarjetaAlta, pasado && estilos.tarjetaApagada]}>
      {/* 1 · CUÁNDO. El bloque de fecha a la izquierda, como en la ficha de
          un viaje: el día en grande se encuentra sin leer. */}
      <View style={estilos.filaAlta}>
        <View style={[estilos.fecha, pasado && estilos.fechaApagada]}>
          <Text style={[estilos.fechaDia, pasado && estilos.apagadoFuerte]}>
            {numeroDeDia(viaje.cuando)}
          </Text>
          <Text style={[estilos.fechaMes, pasado && estilos.apagado]}>
            {mesAbrev(viaje.cuando)}
          </Text>
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={estilos.filaEpigrafe}>
            <Text
              style={[
                estilos.epigrafe,
                tono === 'siguiente' && esHoy(viaje.cuando) && { color: color.rojo600 },
                pasado && estilos.apagado,
              ]}
              numberOfLines={1}
            >
              {/* El día de la semana, no el número: el número ya está en el
                  bloque de fecha de al lado, y decirlo dos veces en la misma
                  fila deja «MAR 1» junto a «1 SEPT». */}
              {pasado ? 'Ya salió' : esHoy(viaje.cuando) ? 'Hoy' : diaSemana(viaje.cuando)}
            </Text>
            {tono === 'siguiente' && esHoy(viaje.cuando) ? (
              <View style={estilos.puntoVivo} />
            ) : null}
          </View>
          {/* **DE CUÁNDO A CUÁNDO, EN UNA SOLA LÍNEA.** La hora de salida
              estaba aquí Y otra vez a la derecha del origen, en el raíl: el
              mismo dato dos veces a treinta píxeles. Aquí van las dos horas y
              lo que dura; el raíl se queda con los lugares, que es lo suyo. */}
          <Text style={[estilos.horaSalida, tabular, pasado && estilos.apagadoFuerte]}>
            {`${hora(viaje.horaSalida)} → ${hora(viaje.horaLlegada)}`}
            <Text style={estilos.duracion}>
              {duracionEntre(viaje.horaSalida, viaje.horaLlegada)
                ? ` · ${duracionEntre(viaje.horaSalida, viaje.horaLlegada)}`
                : ''}
            </Text>
          </Text>
        </View>

        {viaje.sePuedeEditar ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Editar este viaje"
            onPress={() =>
              router.push({ pathname: '/(conductor)/editar', params: { viaje: viaje.id } })
            }
            style={[{ paddingHorizontal: 6 }, zonaDeToque]}
          >
            <Text style={estilos.enlace}>Editar</Text>
          </Pressable>
        ) : null}
      </View>

      {/* 2 · DÓNDE. El raíl escribe la dirección dos veces —el orden de las
          filas y el punto lleno arriba— como manda el invariante 1. Sin horas:
          las dos están arriba, en la línea que las dice juntas. */}
      <View style={estilos.recorrido}>
        <View style={estilos.filaRuta}>
          <View style={[estilos.puntoLleno, pasado && { backgroundColor: color.ink400 }]} />
          <Text style={[estilos.parada, pasado && estilos.apagadoFuerte]} numberOfLines={1}>
            {viaje.origen}
          </Text>
        </View>
        <View style={estilos.hilo} />
        <View style={estilos.filaRuta}>
          <View style={estilos.puntoVacio} />
          <Text style={[estilos.parada, pasado && estilos.apagadoFuerte]} numberOfLines={1}>
            {viaje.destino}
          </Text>
        </View>
      </View>

      {/* 3 y 4 · QUIÉN VA Y CUÁNTO. Juntos y bajo el filete, porque es una
          sola cuenta: cada asiento ocupado es un aporte.

          **Los asientos se dibujan** (01-09-2026). Era «2 de 3 puestos
          ocupados» en 13 px, la línea más pequeña de la tarjeta y el dato
          que más se mira. Tinta el ocupado, hueco el libre. */}
      <View style={estilos.filete} />

      <View style={estilos.filaCuenta}>
        <View style={estilos.asientos}>
          {Array.from({ length: viaje.puestosOfrecidos }, (_, i) => (
            <Asiento
              key={i}
              tamano={20}
              tinta={
                i < viaje.puestosVendidos
                  ? pasado
                    ? color.ink500
                    : color.ink900
                  : color.ink300
              }
            />
          ))}
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[estilos.cuentaFuerte, pasado && estilos.apagadoFuerte]} numberOfLines={1}>
            {viaje.puestosVendidos === 0
              ? libres === 1
                ? 'Nadie todavía · 1 puesto libre'
                : `Nadie todavía · ${libres} puestos libres`
              : `${viaje.puestosVendidos} de ${viaje.puestosOfrecidos} puestos ocupados`}
          </Text>
          {/* **EL DINERO, TAMBIÉN EN LA TARJETA DE HOY.** No estaba en
              ninguna parte de la grande, y en las otras iba pegado al origen,
              donde se confunde con la hora de salida. */}
          <Text style={[estilos.cuentaFina, tabular]} numberOfLines={1}>
            {viaje.puestosVendidos === 0
              ? `${formatearDineroRedondo(viaje.aporteCentavos)} por puesto · hasta ${formatearDineroRedondo(siSeLlena)}`
              : `${formatearDineroRedondo(viaje.aporteCentavos)} por puesto · ${formatearDineroRedondo(recupera)} en total`}
          </Text>
        </View>
      </View>

      {/* 5 · QUÉ HAGO AHORA. Una sola acción por tarjeta, y la que toca:
          teclear códigos si hay gente a bordo, compartir si quedan puestos y
          el viaje no ha salido. Nada si ya está todo hecho. */}
      <Codigos viaje={viaje} />

      {!pasado && libres > 0 && viaje.porSubir === 0 && viaje.porBajar === 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Compartir el viaje"
          onPress={() =>
            compartir(
              `${viaje.origen} → ${viaje.destino} · ${diaAbrev(viaje.cuando)} ${hora(viaje.cuando)} · ${formatearDineroRedondo(viaje.aporteCentavos)} por puesto · quedan ${libres}`,
            ).then((c) => decir(DIJO[c]))
          }
          style={({ pressed }) => [estilos.compartir, pressed && { backgroundColor: color.lavado }]}
        >
          <Text style={estilos.compartirTexto}>Compartir el viaje</Text>
          <Galon tinta={color.rojo700} />
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * LOS CÓDIGOS, DICHOS DESDE EL LADO DE QUIEN MANEJA.
 *
 * Decía **«Abordar · teclear los códigos»** (visto por el dueño el
 * 30-08-2026: «they are going to board and you are the chauffeur»). Dos
 * cosas mal en cuatro palabras:
 *
 * 1. *Abordar* es lo que hace el pasajero. Quien lee esta pantalla no aborda
 *    nada: recoge gente y teclea lo que ellos le enseñan. El rótulo estaba
 *    escrito desde el asiento equivocado.
 * 2. *Los códigos*, en plural y sin dueño, no dice de quién ni para qué. Son
 *    cuatro dígitos que la persona enseña en su teléfono al subirse, y otros
 *    cuatro al bajarse.
 *
 * Y salía **siempre**, también en un viaje donde no había reservado nadie:
 * llevaba a una pantalla que contestaba «El viaje está cerrado. Cada aporte
 * ya salió hacia ti» sobre un viaje al que no se subió nunca nadie. Ahora la
 * fila sólo existe cuando hay alguien a bordo, y dice el momento en el que
 * está: recoger, o cerrar al bajar.
 */
function Codigos({ viaje }: { viaje: ViajePublicado }) {
  const router = useRouter();
  // Sin nadie con el puesto asegurado no hay ningún código que teclear.
  if (viaje.aBordo === 0) return null;
  // Todos subieron y todos bajaron: el viaje cerró, no queda nada que hacer.
  if (viaje.porSubir === 0 && viaje.porBajar === 0) return null;

  const subiendo = viaje.porSubir > 0;
  const cuantos = subiendo ? viaje.porSubir : viaje.porBajar;
  /* «Falta 1», no «faltan 1». El plural de una cuenta se acuerda con la
     cuenta, y este renglón sale con un 1 en la última persona que sube. */
  const faltan = cuantos === 1 ? 'Falta' : 'Faltan';
  const quedan = cuantos === 1 ? 'Queda' : 'Quedan';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        subiendo
          ? `Recogiste a alguien: teclear su código. ${faltan} ${cuantos} de ${viaje.aBordo}`
          : `Alguien se bajó: teclear su código de llegada. ${quedan} ${cuantos}`
      }
      onPress={() =>
        router.push({ pathname: '/(conductor)/abordaje', params: { viaje: viaje.id } })
      }
      style={({ pressed }) => [estilos.codigos, pressed && { opacity: 0.9 }]}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={estilos.codigosTitulo}>
          {subiendo ? '¿Recogiste a alguien?' : '¿Alguien se bajó?'}
        </Text>
        <Text style={estilos.codigosPie}>
          {subiendo
            ? `Teclea el código que te enseña · ${faltan.toLowerCase()} ${cuantos} de ${viaje.aBordo}`
            : `Su aporte sale hacia ti al teclear el código de llegada · ${quedan.toLowerCase()} ${cuantos}`}
        </Text>
      </View>
      <Galon tinta={color.azul700} />
    </Pressable>
  );
}

/** El galón que dice «esto lleva a algún sitio». */
export function Galon({ tinta = color.rojo700 }: { tinta?: string }) {
  return (
    <Svg viewBox="0 0 24 24" width={18} height={18} fill="none">
      <Path
        d="M9 6l6 6-6 6"
        stroke={tinta}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    padding: 18,
    marginBottom: 10,
  },
  /** El siguiente pesa más: sombra del acento y sin borde, como una hoja. */
  tarjetaAlta: {
    borderWidth: 0,
    borderRadius: 24,
    shadowColor: 'rgb(120,10,30)',
    shadowOpacity: 0.2,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 14 },
    elevation: 5,
  },
  /** Y el que ya salió pesa menos: arena, no blanco. */
  tarjetaApagada: { backgroundColor: 'transparent', borderColor: color.bordePorDefecto },
  apagado: { color: color.ink400 },
  apagadoFuerte: { color: color.ink600 },

  filaAlta: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  /** El bloque de fecha: el número en grande, el mes debajo. */
  fecha: {
    width: 46,
    paddingVertical: 7,
    borderRadius: radio.icono,
    backgroundColor: color.sand100,
    alignItems: 'center',
  },
  fechaApagada: { backgroundColor: color.sand200 },
  fechaDia: {
    fontSize: 19,
    lineHeight: 23,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  fechaMes: {
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 10.5 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.ink500,
    fontFamily: familia,
  },

  filaEpigrafe: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  epigrafe: {
    fontSize: 11.5,
    lineHeight: interlinea(11),
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.azul500,
    fontFamily: familia,
  },
  puntoVivo: { width: 7, height: 7, borderRadius: 999, backgroundColor: color.rojo500 },
  horaSalida: {
    fontSize: 15.5,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: color.ink900,
    fontFamily: familia,
    marginTop: 2,
  },
  /** Lo que dura, al lado y en voz baja: es contexto, no la hora. */
  duracion: { fontSize: 13, fontWeight: '500', color: color.ink500 },

  /**
   * **UN SOLO ROJO POR TARJETA.** «Editar» y «Compartir el viaje» iban los
   * dos en rojo, uno en cada esquina de la misma tarjeta, tirando por igual.
   * En este sistema el rojo tiene cuatro sentidos contados y «acción
   * primaria» es uno: si dos enlaces de la misma tarjeta son primarios,
   * ninguno lo es. El rojo se queda donde de verdad hace falta —compartir el
   * viaje es lo que llena el carro— y «Editar» baja a tinta, que es lo que
   * es: una salida secundaria (29-08-2026).
   */
  enlace: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '500',
    color: color.ink600,
    fontFamily: familia,
  },

  recorrido: { marginTop: 15 },
  filaRuta: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  /** El hilo que une los dos extremos: la dirección se ve, no se deduce. */
  hilo: {
    width: 2,
    height: 14,
    marginLeft: 3.5,
    marginTop: -3,
    marginBottom: -3,
    borderRadius: 1,
    backgroundColor: color.ink200,
  },
  puntoLleno: { width: 9, height: 9, borderRadius: 999, backgroundColor: color.rojo500 },
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
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: -0.3,
    color: color.ink900,
    fontFamily: familia,
  },

  filete: {
    height: 1,
    backgroundColor: color.bordeSutil,
    marginTop: 15,
  },

  filaCuenta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 13 },
  asientos: { flexDirection: 'row', gap: 2 },
  cuentaFuerte: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '600',
    color: color.ink900,
    fontFamily: familia,
  },
  cuentaFina: {
    fontSize: 12.5,
    lineHeight: 18,
    color: color.ink600,
    fontFamily: familia,
  },

  // La caja azul: teclear un código es una tarea, no una alarma.
  codigos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 14,
    borderRadius: radio.l,
    borderWidth: 1.5,
    borderColor: color.azul200,
    backgroundColor: color.azul50,
  },
  codigosTitulo: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    letterSpacing: -0.2175,
    color: color.azul700,
    fontFamily: familia,
  },
  codigosPie: {
    fontSize: 12.5,
    lineHeight: 18.125,
    color: color.ink600,
    fontFamily: familia,
  },

  /** Compartir es lo que llena el carro: es la acción primaria de la tarjeta. */
  compartir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    marginTop: 12,
    marginHorizontal: -4,
    borderRadius: radio.control,
  },
  compartirTexto: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '600',
    color: color.rojo700,
    fontFamily: familia,
  },
});
