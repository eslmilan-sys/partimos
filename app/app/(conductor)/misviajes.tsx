/**
 * `5b` Mis viajes — LO QUE VIENE, de los dos lados del carro.
 *
 * **La estructura que pidió el cliente**, traída a nuestro lenguaje: una ficha
 * grande para el viaje que viene y filas compactas para los demás.
 *
 * **Sin selectores** (28-08-2026, pedido del dueño). Había dos, uno encima
 * del otro: «Voy de pasajero / Conduzco» y «Próximos / Historial». Cuatro
 * casillas, dos toques para llegar a cualquiera — y con tres o cuatro viajes
 * en la cuenta, casi todas se veían vacías. Un selector que parte en cuatro lo
 * que cabe entero en una pantalla no ahorra nada: cuesta un toque y esconde
 * tres cuartas partes de lo que hay.
 *
 * Ahora una sola lista en orden, y **cada fila dice de qué lado vas** — que es
 * el mismo dato que daba el selector, dicho en el viaje en vez de exigido
 * antes de ver nada. El historial no está: vive en el perfil, y una pantalla
 * llamada «Mis viajes» que abre en lo que ya pasó no sirve para lo que uno
 * viene a hacer.
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
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { useDecir } from '@/ui/Nota';
import { enTexto } from '@/dominio/notas';
import { DIJO, compartir } from '@/ui/salidas';

import {
  type MisViajes,
  type PuestoMio,
  type ViajePublicado,
  misViajes,
  misViajesConduciendo,
} from '@/servicios/panel';
import { cerrarLasVencidas } from '@/servicios/abordaje';
import { cuantasAvisando } from '@/servicios/rutas';
import { useMiIdOEntrar } from '@/servicios/sesion';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { CampoRojo } from '@/ui/CampoRojo';
import { Pestanas } from '@/ui/Pestanas';
import { Avatar, Epigrafe } from '@/ui/controles';
import { formatearDineroRedondo, tabular } from '@/ui/dinero';
import { diaAbrev, diaSemana, hora, mesAbrev, numeroDeDia } from '@/ui/fechas';
import { Avanza, Carro, Chat, Compartir, Estrella, Visto } from '@/ui/iconos';
import {
  TRACK_MICRO,
  color,
  espacio,
  familia,
  interlinea,
  pulsado,
  radio,
  zonaDeToque,
} from '@/ui/tokens';

/** Sin sesión que preguntar —solo en simulado—, la pasajera del traspaso. */
const DEL_RECORRIDO = '99999999-9999-4999-8999-999999999999';

/**
 * **UNA SOLA LISTA, Y ES LA DE LO QUE VIENE** (28-08-2026, pedido del dueño).
 *
 * Esta pantalla tenía dos selectores encima, uno debajo del otro: «Voy de
 * pasajero / Conduzco» y «Próximos / Historial». Cuatro combinaciones, dos
 * toques para llegar a cualquiera de ellas — y con tres o cuatro viajes en la
 * cuenta, cada casilla se veía casi siempre vacía. El selector partía en
 * cuatro lo que cabe entero en una pantalla.
 *
 * Ahora: **lo que viene, en orden, todo junto**, y cada fila dice de qué lado
 * del carro vas. Es el mismo dato que daba el selector, dicho donde importa
 * —en el viaje— en vez de obligar a elegir antes de ver nada.
 *
 * El historial no está: se lleva desde el perfil, que es donde ya vive
 * («Lo que has recuperado → Ver histórico»). Una pantalla que se llama «Mis
 * viajes» y abre en lo que ya pasó no sirve para lo que uno viene a hacer.
 */
type Fila =
  | { clase: 'pasajero'; cuando: string; puesto: PuestoMio }
  | { clase: 'conduzco'; cuando: string; viaje: ViajePublicado };

/** El estado de la reserva, en una palabra y con su color.
 *
 *  El ámbar no está en la paleta de marca por una razón: rojo es la marca y
 *  verde es «hecho», así que «esperando» no puede ser ninguno de los dos. El
 *  oro de los tokens es el único tercer color que el sistema admite. */
const ESTADO: Record<string, { texto: string; fondo: string; tinta: string }> = {
  confirmed: { texto: 'Confirmado', fondo: color.hechoFondo, tinta: color.hechoTinta },
  pending: { texto: 'Pendiente', fondo: color.esperaFondo, tinta: color.esperaTinta },
  /* `ink600` y no `ink500`: a 10,5 px sobre `sand200` el gris claro daba
     4,39:1, justo por debajo del 4,5 que pide la WCAG al texto pequeño. */
  completed: { texto: 'Terminado', fondo: color.sand200, tinta: color.ink600 },
};

export default function MisViajesPantalla() {
  const router = useRouter();
  const yo = useMiIdOEntrar(DEL_RECORRIDO);
  const [datos, setDatos] = useState<MisViajes | null>(null);
  /** Cuántas rutas guardadas están avisando, para la puerta de abajo. */
  const [avisando, setAvisando] = useState(0);
  const [manejando, setManejando] = useState<{
    proximos: ViajePublicado[];
    pasados: ViajePublicado[];
  } | null>(null);

  useEffect(() => {
    if (!yo) return;
    /* Las que ya se dan por buenas solas (24 h desde la llegada) se cierran
       aquí, al entrar. No hay cron todavía, y una reserva abierta es plata que
       no le llega a quien manejó. La regla vive en `dominio/cierre`. */
    cerrarLasVencidas(yo)
      .then(() => misViajes(yo).then(setDatos))
      .catch(() => misViajes(yo).then(setDatos));
    misViajesConduciendo(yo).then(setManejando);
    cuantasAvisando(yo).then(setAvisando);
  }, [yo]);

  if (!datos) return <Cargando altura={186} tarjetas={3} />;

  /* La ficha grande sigue siendo la del próximo PUESTO: lleva el código de
     subir y el chat, que son cosas de pasajero. Quien maneja no tiene código
     que enseñar — tiene gente a la que responder, y eso está más abajo. */
  const proximo = datos.hoy ?? datos.proximos[0] ?? null;

  /** Lo que viene, de los dos lados, en orden. */
  const loQueViene: Fila[] = [
    ...datos.proximos
      .filter((p) => p.reservaId !== proximo?.reservaId)
      .map((p): Fila => ({ clase: 'pasajero', cuando: p.cuando, puesto: p })),
    ...(manejando?.proximos ?? []).map(
      (v): Fila => ({ clase: 'conduzco', cuando: v.cuando, viaje: v }),
    ),
  ].sort((a, b) => a.cuando.localeCompare(b.cuando));

  const vacio = !proximo && loQueViene.length === 0;

  /**
   * **LO QUE YA PASÓ, TAMBIÉN AQUÍ** (01-09-2026, visto por el dueño con el
   * teléfono en la mano: *«when I click mis viajes from menu bottom it doesn't
   * show anything»*).
   *
   * Y era verdad: tenía dos viajes publicados, los veía buscando y los veía
   * desde «Administrar viaje», pero esta pantalla —la que abre la barra de
   * abajo, la que se llama «Mis viajes»— le contestaba «todavía no tienes
   * viajes por delante» y nada más. La cabecera de este archivo lo defendía
   * así: «el historial vive en el perfil». Con la cuenta vacía por delante,
   * eso deja una pestaña raíz que no enseña NADA de lo que tienes, y manda a
   * buscarlo a dos sitios distintos.
   *
   * Ahora salen debajo, apagados y en filas compactas: no compiten con lo que
   * viene —que sigue siendo lo primero— pero la pantalla deja de mentir.
   */
  const loQuePaso: Fila[] = [
    ...(datos.pasados ?? []).map((p): Fila => ({ clase: 'pasajero', cuando: p.cuando, puesto: p })),
    ...(manejando?.pasados ?? []).map(
      (v): Fila => ({ clase: 'conduzco', cuando: v.cuando, viaje: v }),
    ),
  ].sort((a, b) => b.cuando.localeCompare(a.cuando));

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

      <CampoRojo altura={214} motivo="tornillo" />

      <View style={estilos.cabecera}>
        <View style={estilos.filaSuperior}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={estilos.titular}>Mis viajes</Text>
            <Text style={estilos.bajada}>Consulta y administra tus próximos viajes.</Text>
          </View>

          {/* **LA CAMPANA NO VA AQUÍ.** Estaba en Inicio Y en esta pantalla:
              dos campanas en dos pestañas raíz para una sola bandeja, y con
              dos cuentas que hay que mantener iguales. La decisión ya estaba
              tomada el 28-08 —«los mensajes abajo a la derecha; los avisos en
              la home, arriba a la derecha»—: esta era la que sobraba
              (29-08-2026, pedido del dueño). */}
          {/* AQUÍ NO VA EL AVATAR. La cuenta ya tiene su pestaña abajo, en la
              barra, en todas las pantallas: repetirla arriba a la derecha era
              un segundo camino al mismo sitio, y de los dos el de arriba es el
              que no se ve. Quitado el 29-08-2026. La campana sí se queda: los
              avisos no tienen otra puerta. */}
        </View>

      </View>

      <View style={estilos.cuerpo}>
        {proximo ? (
          <>
            <Epigrafe>Tu próximo puesto</Epigrafe>
            <FichaGrande
              puesto={proximo}
              alChat={() =>
                router.push({ pathname: '/(pasajero)/chat', params: { reserva: proximo.reservaId } })
              }
              alDetalle={() =>
                router.push({ pathname: '/(pasajero)/viaje', params: { viaje: proximo.viajeId } })
              }
              alCodigo={() =>
                router.push({
                  pathname: '/(pasajero)/codigo',
                  params: { reserva: proximo.reservaId },
                })
              }
            />
          </>
        ) : null}

        {loQueViene.length > 0 ? (
          <>
            <View style={estilos.filaSeccion}>
              <Epigrafe>{proximo ? 'Después de ése' : 'Lo que viene'}</Epigrafe>
              <Text style={estilos.cuantos}>
                {loQueViene.length === 1 ? '1 viaje' : `${loQueViene.length} viajes`}
              </Text>
            </View>

            <View style={{ gap: 8 }}>
              {loQueViene.map((f) =>
                f.clase === 'pasajero' ? (
                  <FilaCompacta
                    key={f.puesto.reservaId}
                    puesto={f.puesto}
                    alPulsar={() =>
                      router.push({
                        pathname: '/(pasajero)/viaje',
                        params: { viaje: f.puesto.viajeId },
                      })
                    }
                  />
                ) : (
                  /* Un viaje que TÚ llevas abre su administración, no su
                     anuncio: el conductor que toca su viaje viene a responder
                     solicitudes y teclear códigos, no a leer cómo se vende su
                     puesto (02-09-2026, pedido del dueño). El anuncio sigue a
                     una puerta de distancia, dentro de administrar. */
                  <FilaConduzco
                    key={f.viaje.id}
                    viaje={f.viaje}
                    alPulsar={() =>
                      router.push({
                        pathname: '/(conductor)/administrar',
                        params: { viaje: f.viaje.id },
                      })
                    }
                  />
                ),
              )}
            </View>
          </>
        ) : null}

        {/* **SIN TARJETA NI BOTÓN** (28-08-2026, pedido del dueño). El vacío
            era una tarjeta de trazo discontinuo con su icono, su párrafo y un
            botón «Buscar un viaje» — media pantalla para decir «no hay nada»,
            y con un botón que la barra de abajo ya tiene a un dedo. Una línea
            basta: dice lo que pasa sin ocupar el sitio de lo que vendrá. */}
        {vacio ? (
          <Text style={estilos.nadaTodavia}>
            {loQuePaso.length > 0
              ? 'No tienes viajes por delante. Abajo están los que ya hiciste.'
              : 'Todavía no tienes viajes. Busca uno, o publica el que ya ibas a hacer.'}
          </Text>
        ) : null}

        {/* YA PASARON. En filas compactas y bajo su rótulo: están para
            consultarlos, no para hacer nada con ellos. */}
        {loQuePaso.length > 0 ? (
          <View style={estilos.pasados}>
            <View style={estilos.filaSeccion}>
              <Epigrafe>Ya pasaron</Epigrafe>
              <Text style={estilos.cuantos}>
                {loQuePaso.length === 1 ? '1 viaje' : `${loQuePaso.length} viajes`}
              </Text>
            </View>

            <View style={{ gap: 8, opacity: 0.72 }}>
              {loQuePaso.slice(0, 6).map((f) =>
                f.clase === 'pasajero' ? (
                  <FilaCompacta
                    key={f.puesto.reservaId}
                    puesto={f.puesto}
                    alPulsar={() =>
                      router.push({
                        pathname: '/(pasajero)/viaje',
                        params: { viaje: f.puesto.viajeId },
                      })
                    }
                  />
                ) : (
                  /* Un viaje que manejaste abre SU administración, la misma
                     puerta que los de arriba: desde ahí se teclean los
                     códigos que falten. Antes abría el panel entero y había
                     que volver a encontrar el viaje en la lista
                     (02-09-2026). */
                  <FilaConduzco
                    key={f.viaje.id}
                    viaje={f.viaje}
                    alPulsar={() =>
                      router.push({
                        pathname: '/(conductor)/administrar',
                        params: { viaje: f.viaje.id },
                      })
                    }
                  />
                ),
              )}
            </View>
          </View>
        ) : null}

        <View style={estilos.puertas}>
          {/* **«MI CÓDIGO PARA SUBIR» SE MUDÓ AL BOLETO** (01-09-2026,
              pedido del dueño): vive dentro de la ficha grande, como banda
              de talón con el código escrito. Aquí era un botón suelto que
              obligaba a mirar dos sitios para una sola cosa. */}

          {/* **«QUIÉN PIDE PUESTO» SE FUE** (29-08-2026, pedido del dueño).
              Era una fila fija que llevaba al panel del conductor, y estaba
              aquí tuvieras o no un viaje publicado: en una pantalla que se
              llama «Mis viajes» y que promete «tus próximos viajes», una
              puerta a la administración de algo que quizá no existe no es un
              viaje próximo.
              A las solicitudes se llega por el viaje que las tiene: cada
              viaje que conduces está en la lista de arriba, y su ficha lleva
              a «Administrar mi viaje». Se administra UN viaje, no la idea de
              conducir. */}

          {/* **RUTAS GUARDADAS, AQUÍ** (27-08-2026, pedido del dueño). Vivía
              en Ajustes, dentro de un grupo «Avisos», y era el único camino
              para llegar: una ruta guardada es un viaje que todavía no
              existe, no una preferencia de la cuenta.

              **Y VA EN PEQUEÑO** (29-08-2026): tenía el mismo peso que «Mi
              código para subir», y no son lo mismo. El código se necesita
              hoy, en la acera, con el carro esperando; una ruta guardada es
              un aviso para dentro de dos semanas. Mismo sitio, media voz. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              avisando > 0 ? `Rutas guardadas, ${avisando} avisando` : 'Rutas guardadas'
            }
            onPress={() => router.push('/(pasajero)/rutas')}
            style={({ pressed }) => [estilos.puertaChica, pressed && pulsado.celda]}
          >
            <Text style={estilos.puertaChicaTexto}>Rutas guardadas</Text>
            {avisando > 0 ? <Text style={estilos.cuantos}>{`${avisando} avisando`}</Text> : null}
            <Avanza tamano={15} />
          </Pressable>
        </View>
      </View>
      </ScrollView>

      <Pestanas valor="Mis viajes" yo={yo} />
    </View>
  );
}

/* ------------------------------------------------------- La ficha grande */

function FichaGrande({
  puesto,
  alChat,
  alDetalle,
  alCodigo,
}: {
  puesto: PuestoMio;
  alChat: () => void;
  alDetalle: () => void;
  alCodigo: () => void;
}) {
  const decir = useDecir();
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
        <Avatar nombre={puesto.conductor || '·'} tamano={40} />
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
                <Text style={estilos.nota}>{enTexto(puesto.calificacion)}</Text>
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
              <Carro tamano={19} tinta={color.ink500} />
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

      {/* **EL CÓDIGO VIVE EN EL BOLETO** (01-09-2026, pedido del dueño:
          «shall be in the card, not a button below»). Es la banda de talón
          de un pase de abordar: raya discontinua, el código escrito — que es
          lo que hay que tener en la mano en la acera — y la puerta a verlo
          en grande. Fuera de la tarjeta era un ajuste más de la pantalla;
          dentro, es parte del viaje. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Mi código para subir: ${puesto.codigo.split('').join(' ')}. Verlo en grande`}
        onPress={alCodigo}
        style={({ pressed }) => [estilos.talon, pressed && { backgroundColor: color.sand100 }]}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={estilos.epigrafeMini}>Código para subir</Text>
          <Text style={[estilos.codigoDelTalon, tabular]}>{puesto.codigo}</Text>
        </View>
        <Text style={estilos.verloGrande}>Verlo en grande</Text>
        <Avanza tamano={15} />
      </Pressable>

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
            compartir(`Voy a ${puesto.destino} con ${puesto.conductor}. Salgo de ${puesto.origenSitio || puesto.origen} a las ${hora(puesto.cuando)}.`).then((c) => decir(DIJO[c]))
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
        {/* De qué lado vas, EN LA FILA. Es exactamente lo que decía el
            selector de arriba, dicho donde importa — en el viaje — en vez de
            obligar a elegir antes de ver nada (28-08-2026). */}
        <Text style={estilos.sitioMini} numberOfLines={1}>
          {/* «Pasajero», no «Voy de pasajero»: con el nombre del conductor y
              el aporte detrás, la línea se cortaba en el ancho de la fila y
              lo que se perdía era el dinero, que es lo que se venía a ver. */}
          {['Pasajero', puesto.conductor, formatearDineroRedondo(puesto.aporteCentavos)]
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

/**
 * Un viaje que TÚ llevas. Ya no recibe `pasado`: esta pantalla enseña sólo lo
 * que viene, y lo que ya pasó se lleva desde el perfil (28-08-2026).
 */
function FilaConduzco({ viaje, alPulsar }: { viaje: ViajePublicado; alPulsar: () => void }) {
  const pendientes = viaje.solicitudes;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${viaje.origen} a ${viaje.destino}, ${diaAbrev(viaje.cuando)} ${hora(viaje.cuando)}, ${viaje.puestosVendidos} de ${viaje.puestosOfrecidos} puestos`}
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
            {viaje.origen}
          </Text>
        </View>
        <View style={estilos.hitoMini}>
          <View style={estilos.carrilMini}>
            <View style={estilos.puntoHuecoMini} />
          </View>
          <Text style={estilos.lugarMini} numberOfLines={1}>
            {viaje.destino}
          </Text>
        </View>
        <Text style={estilos.sitioMini} numberOfLines={1}>
          {`Conduzco · ${viaje.puestosVendidos} de ${viaje.puestosOfrecidos} puestos · ${formatearDineroRedondo(viaje.aporteCentavos)}`}
        </Text>
      </View>

      <View style={estilos.ladoFila}>
        {/* Rojo sólo cuando reclama respuesta: es uno de sus cuatro sentidos.
            Un viaje pasado no reclama nada, aunque quedaran solicitudes. */}
        {pendientes > 0 ? (
          <View style={[estilos.pastilla, { backgroundColor: color.rojo500 }]}>
            <Text style={[estilos.pastillaTexto, { color: '#fff' }]}>
              {pendientes === 1 ? '1 pide puesto' : `${pendientes} piden puesto`}
            </Text>
          </View>
        ) : (
          <View style={[estilos.pastilla, { backgroundColor: color.hechoFondo }]}>
            <Text style={[estilos.pastillaTexto, { color: color.hechoTinta }]}>Publicado</Text>
          </View>
        )}
        <Text style={estilos.cuandoFila}>
          {`${diaAbrev(viaje.cuando)}, ${numeroDeDia(viaje.cuando)} ${mesAbrev(viaje.cuando)}`}
        </Text>
        <Text style={estilos.horaFila}>{hora(viaje.cuando)}</Text>
      </View>

      <Avanza />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  /** El vacío, en una línea. Sin tarjeta, sin icono y sin botón. */
  pasados: { marginTop: 22 },
  nadaTodavia: {
    fontSize: 14,
    lineHeight: 20,
    color: color.ink600,
    marginTop: 4,
    marginBottom: 4,
    fontFamily: familia,
  },

  pantalla: {
    flex: 1,
    backgroundColor: color.sand100,
    maxWidth: espacio.marco,
    width: '100%',
    alignSelf: 'center',
  },

  /* El relleno de abajo empuja el cuerpo por debajo del campo: sin él, el
     epígrafe «Tu próximo viaje» quedaba escrito en azul sobre el rojo. */
  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 16, paddingBottom: 4 },
  filaSuperior: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  titular: { fontSize: 22, lineHeight: 26, letterSpacing: -0.77, fontWeight: '600', color: color.ink900, fontFamily: familia, },
  bajada: {
    fontSize: 13.5,
    lineHeight: 18.85,
    color: color.campoTexto,
    marginTop: 4,
    fontFamily: familia,
  },


  cuerpo: { paddingHorizontal: espacio.gutter, paddingTop: 16, paddingBottom: 20, gap: 10 },

  filaSeccion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 12,
  },
  cuantos: { fontSize: 12.5, lineHeight: 18.125, color: color.ink600, fontFamily: familia },

  /* ── la ficha grande ── */
  ficha: {
    backgroundColor: color.blanco,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    shadowColor: '#8F1024',
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
  aporteSufijo: { fontSize: 12.5, lineHeight: 18.125, fontWeight: '400', color: color.ink600 },
  sitio: {
    fontSize: 12.5,
    lineHeight: 18.125,
    color: color.ink600,
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
    fontSize: 11.5,
    lineHeight: 15.95,
    fontWeight: '600',
    color: color.ink600,
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
    color: color.ink500,
    fontFamily: familia,
  },
  bloqueHora: { alignItems: 'flex-end' },
  epigrafeMini: {
    fontSize: 10,
    lineHeight: 14.5,
    fontWeight: '600',
    letterSpacing: 10 * 0.07,
    textTransform: 'uppercase',
    color: color.ink600,
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
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    letterSpacing: -0.22,
    color: color.ink900,
    fontFamily: familia,
  },
  filaNota: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  nota: { fontSize: 12.5, lineHeight: 17.4, fontWeight: '600', color: color.ink700, fontFamily: familia, ...tabular },
  /* `ink400` daba 2,59:1 sobre la banda: un punto es texto aunque separe. */
  separa: { fontSize: 12.5, lineHeight: 17.4, color: color.ink600, fontFamily: familia },
  cuantosViajes: { fontSize: 12.5, lineHeight: 17.4, color: color.ink600, fontFamily: familia, ...tabular },

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
  carroDetalle: { fontSize: 11.5, lineHeight: 16.675, color: color.ink600, fontFamily: familia },

  /** La banda de talón: como un pase de abordar, con su raya discontinua. */
  talon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: color.bordePorDefecto,
    borderStyle: 'dashed',
  },
  codigoDelTalon: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    letterSpacing: 3,
    color: color.ink900,
    fontFamily: familia,
    marginTop: 1,
  },
  verloGrande: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600',
    color: color.azul700,
    fontFamily: familia,
  },
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
  sitioMini: { fontSize: 12.5, lineHeight: 17.4, color: color.ink600, marginTop: 3, marginLeft: 17, fontFamily: familia },

  ladoFila: { alignItems: 'flex-end', gap: 4 },
  cuandoFila: { fontSize: 12.5, lineHeight: 17.4, color: color.ink500, fontFamily: familia, ...tabular },
  horaFila: {
    fontSize: 14,
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
  /** La fila menor: sin caja, un renglón discreto bajo las puertas. */
  puertaChica: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: espacio.tap,
    paddingHorizontal: 6,
    marginTop: 2,
  },
  puertaChicaTexto: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '500',
    color: color.ink600,
    fontFamily: familia,
  },
  puertaTexto: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    letterSpacing: -0.22,
    color: color.ink900,
    fontFamily: familia,
  },

  /* ── el vacío ── */
});
