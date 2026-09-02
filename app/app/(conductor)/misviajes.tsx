/**
 * `5b` Mis viajes — la referencia v6, aplicada tal cual (02-09-2026).
 *
 * El dueño mandó la pantalla dibujada y pidió: «Create the page exactly like
 * that». La estructura es la del dibujo, renglón por renglón:
 *
 * · Titular grande y una bajada que dice qué es esto: los viajes que
 *   publicas o en los que participas.
 * · **El selector Próximos / Historial vuelve.** Se quitó el 28-08 («sin
 *   selectores») cuando eran CUATRO casillas en dos filas; el dibujo lo trae
 *   de vuelta como UNA fila de dos, y con el historial creciendo cada semana
 *   la división próximos/pasados vuelve a pagar su sitio.
 * · **«Próximos viajes»** (el dueño pidió el plural: todos, no sólo el
 *   primero): cada viaje que viene es la tarjeta grande del dibujo — bloque
 *   de fecha, chip de rol, las dos horas con su duración, el raíl, y las dos
 *   cifras con el aporte. **La cifra de la izquierda es «puestos
 *   reservados»** — pedido expreso: cuántos van, no cuántos caben.
 * · El chip dice el rol de entrada: «Conduces tú» en rojo pálido con el
 *   volante, «Vas de pasajero» en azul pálido con el asiento. Icono Y
 *   palabra — un color solo no es un dato.
 * · La acción de la tarjeta es la del rol: «Administrar viaje» si conduces
 *   (a `10c`), «Ver mi viaje» si vas sentado. El código de subir conserva su
 *   talón dentro de la tarjeta (pedido del 01-09: «shall be in the card»).
 * · La banda verde «Viaja seguro» recuerda la regla de la casa: el chat
 *   dentro de la app es la prueba de lo acordado (`PRODUCT.md`).
 * · «Historial» enseña un adelanto abajo y la pestaña lo trae entero: filas
 *   compactas con su bloque de fecha, su estado y su hora.
 *
 * Lo único del dibujo que no está es el kebab «⋮» de la tarjeta — no había
 * nada que meterle dentro que la tarjeta no diga ya, y un botón sin destino
 * es un bug esperando nombre. En su esquina va lo que sí corre: la pastilla
 * de solicitudes (conduces) o la de estado (vas sentado). El botón de
 * filtros de arriba abre «Rutas guardadas», que es exactamente eso: tus
 * avisos de ruta.
 *
 * **No hay botón de llamar**, y no es un olvido. `PRODUCT.md` decide que el
 * contacto pasa por el chat, que queda escrito.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import Svg, { Circle, Path } from 'react-native-svg';

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
import { Pestanas } from '@/ui/Pestanas';
import { Epigrafe } from '@/ui/controles';
import { formatearDineroRedondo, tabular } from '@/ui/dinero';
import { diaAbrev, diaSemana, duracionEntre, hora, mesAbrev, numeroDeDia } from '@/ui/fechas';
import { Asiento, Avanza, Billete, Calendario, Escudo, Filtros } from '@/ui/iconos';
import { TRACK_MICRO, color, espacio, familia, pulsado, radio } from '@/ui/tokens';

/** Sin sesión que preguntar —solo en simulado—, la pasajera del traspaso. */
const DEL_RECORRIDO = '99999999-9999-4999-8999-999999999999';

/** Una fila de la vida: un puesto que pediste o un viaje que publicaste. */
type Fila =
  | { clase: 'pasajero'; cuando: string; puesto: PuestoMio }
  | { clase: 'conduzco'; cuando: string; viaje: ViajePublicado };

/** El estado de una reserva, en una palabra y con su color. */
const ESTADO: Record<string, { texto: string; fondo: string; tinta: string }> = {
  confirmed: { texto: 'Confirmado', fondo: color.hechoFondo, tinta: color.hechoTinta },
  pending: { texto: 'Pendiente', fondo: color.esperaFondo, tinta: color.esperaTinta },
  completed: { texto: 'Finalizado', fondo: color.hechoFondo, tinta: color.hechoTinta },
  cancelled: { texto: 'Cancelado', fondo: color.sand200, tinta: color.ink600 },
};

export default function MisViajesPantalla() {
  const router = useRouter();
  const yo = useMiIdOEntrar(DEL_RECORRIDO);
  const [datos, setDatos] = useState<MisViajes | null>(null);
  /** Cuántas rutas guardadas están avisando, para el punto del botón. */
  const [avisando, setAvisando] = useState(0);
  const [manejando, setManejando] = useState<{
    proximos: ViajePublicado[];
    pasados: ViajePublicado[];
  } | null>(null);
  /** La casilla del selector del dibujo: lo que viene o lo que ya pasó. */
  const [pestana, setPestana] = useState<'proximos' | 'historial'>('proximos');

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

  /** Lo que viene, de los dos lados, en orden de salida. */
  const proximos: Fila[] = [
    ...datos.proximos.map((p): Fila => ({ clase: 'pasajero', cuando: p.cuando, puesto: p })),
    ...(manejando?.proximos ?? []).map(
      (v): Fila => ({ clase: 'conduzco', cuando: v.cuando, viaje: v }),
    ),
  ].sort((a, b) => a.cuando.localeCompare(b.cuando));

  /** Lo que ya pasó, lo más reciente primero. */
  const pasados: Fila[] = [
    ...(datos.pasados ?? []).map((p): Fila => ({ clase: 'pasajero', cuando: p.cuando, puesto: p })),
    ...(manejando?.pasados ?? []).map(
      (v): Fila => ({ clase: 'conduzco', cuando: v.cuando, viaje: v }),
    ),
  ].sort((a, b) => b.cuando.localeCompare(a.cuando));

  const abrir = (f: Fila) =>
    f.clase === 'pasajero'
      ? router.push({ pathname: '/(pasajero)/viaje', params: { viaje: f.puesto.viajeId } })
      : router.push({ pathname: '/(conductor)/administrar', params: { viaje: f.viaje.id } });

  return (
    <View style={estilos.pantalla}>
      <BarraDeEstado />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={estilos.contenido}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.filaTitular}>
          <Text style={estilos.titular}>Mis viajes</Text>
          {/* El botón de filtros del dibujo, con un destino de verdad: tus
              rutas guardadas — los avisos que filtran lo que te interesa. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              avisando > 0 ? `Rutas guardadas, ${avisando} avisando` : 'Rutas guardadas'
            }
            onPress={() => router.push('/(pasajero)/rutas')}
            style={({ pressed }) => [estilos.botonFiltros, pressed && pulsado.celda]}
          >
            <Filtros tamano={20} tinta={color.ink800} />
            {avisando > 0 ? <View style={estilos.puntoAviso} /> : null}
          </Pressable>
        </View>
        <Text style={estilos.bajada}>
          Gestiona los viajes que publicas o en los que participas.
        </Text>

        {/* El selector del dibujo: una fila, dos casillas, la activa en
            tinta. Vuelve (se fue el 28-08 siendo cuatro casillas) porque con
            historial creciendo cada semana la división vuelve a pagarse. */}
        <View style={estilos.selector}>
          <Casilla
            activo={pestana === 'proximos'}
            etiqueta="Próximos"
            icono={(tinta) => <Calendario tamano={18} tinta={tinta} />}
            alPulsar={() => setPestana('proximos')}
          />
          <Casilla
            activo={pestana === 'historial'}
            etiqueta="Historial"
            icono={(tinta) => <Reloj tinta={tinta} />}
            alPulsar={() => setPestana('historial')}
          />
        </View>

        {pestana === 'proximos' ? (
          <>
            <View style={estilos.rotulo}>
              <Epigrafe>Próximos viajes</Epigrafe>
            </View>

            {proximos.length > 0 ? (
              <View style={{ gap: 14 }}>
                {proximos.map((f) =>
                  f.clase === 'conduzco' ? (
                    <TarjetaConduzco key={f.viaje.id} viaje={f.viaje} router={router} />
                  ) : (
                    <TarjetaPasajero key={f.puesto.reservaId} puesto={f.puesto} router={router} />
                  ),
                )}
              </View>
            ) : (
              <Text style={estilos.nadaTodavia}>
                Todavía no tienes viajes por delante. Busca uno, o publica el que ya ibas a hacer.
              </Text>
            )}

            {/* La banda verde del dibujo: la regla de la casa, dicha donde
                se decide — antes de salir. El chat dentro de la app es la
                prueba escrita de lo acordado. */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Viaja seguro: cómo funciona Partimos"
              onPress={() => router.push('/(ayuda)/como')}
              style={({ pressed }) => [estilos.seguro, pressed && { opacity: 0.92 }]}
            >
              <View style={estilos.seguroCirculo}>
                <Escudo tamano={19} tinta="#fff" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={estilos.seguroTitulo}>Viaja seguro</Text>
                <Text style={estilos.seguroTexto}>
                  Usa siempre los chats dentro de la app para compartir detalles del viaje.
                </Text>
              </View>
              <Text style={estilos.seguroEnlace}>Saber más</Text>
              <Avanza tamano={15} tinta={color.hechoTinta} />
            </Pressable>

            {/* El adelanto del historial, como en el dibujo: las últimas
                filas y la puerta a verlo entero. */}
            {pasados.length > 0 ? (
              <>
                <View style={estilos.rotulo}>
                  <Epigrafe>Historial</Epigrafe>
                </View>
                <View style={{ gap: 8 }}>
                  {pasados.slice(0, 3).map((f) => (
                    <FilaHistorial
                      key={f.clase === 'pasajero' ? f.puesto.reservaId : f.viaje.id}
                      fila={f}
                      alPulsar={() => abrir(f)}
                    />
                  ))}
                </View>
                {pasados.length > 3 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Ver todo el historial"
                    onPress={() => setPestana('historial')}
                    style={({ pressed }) => [estilos.verTodo, pressed && pulsado.celda]}
                  >
                    <Text style={estilos.verTodoTexto}>
                      {`Ver todo el historial · ${pasados.length} viajes`}
                    </Text>
                    <Avanza tamano={15} />
                  </Pressable>
                ) : null}
              </>
            ) : null}
          </>
        ) : (
          <>
            <View style={estilos.rotulo}>
              <Epigrafe>Historial</Epigrafe>
            </View>
            {pasados.length > 0 ? (
              <View style={{ gap: 8 }}>
                {pasados.map((f) => (
                  <FilaHistorial
                    key={f.clase === 'pasajero' ? f.puesto.reservaId : f.viaje.id}
                    fila={f}
                    alPulsar={() => abrir(f)}
                  />
                ))}
              </View>
            ) : (
              <Text style={estilos.nadaTodavia}>
                Aquí saldrán los viajes que ya hiciste, de los dos lados del carro.
              </Text>
            )}
          </>
        )}
      </ScrollView>

      <Pestanas valor="Mis viajes" yo={yo} />
    </View>
  );
}

type Router = ReturnType<typeof useRouter>;

/* ------------------------------------------------------------- el selector */

function Casilla({
  activo,
  etiqueta,
  icono,
  alPulsar,
}: {
  activo: boolean;
  etiqueta: string;
  icono: (tinta: string) => ReactNode;
  alPulsar: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      accessibilityLabel={etiqueta}
      onPress={alPulsar}
      style={[estilos.casilla, activo && estilos.casillaActiva]}
    >
      {icono(activo ? '#fff' : color.ink700)}
      <Text style={[estilos.casillaTexto, activo && estilos.casillaTextoActiva]}>{etiqueta}</Text>
    </Pressable>
  );
}

/* ------------------------------------------------- la tarjeta de un próximo */

/**
 * EL BLOQUE DE FECHA del dibujo: día de la semana, número grande, mes.
 * El mismo en la tarjeta grande y —más chico— en las filas del historial.
 */
function BloqueFecha({ cuando, chico = false }: { cuando: string; chico?: boolean }) {
  return (
    <View style={[estilos.bloqueFecha, chico && estilos.bloqueFechaChico]}>
      {/* «VIE», no «VIERNES»: a 11 px un miércoles entero desborda el
          bloque, y el dibujo lo abrevia también. */}
      <Text style={estilos.fechaSemana}>{diaAbrev(cuando)}</Text>
      <Text style={[estilos.fechaNumero, chico && estilos.fechaNumeroChico, tabular]}>
        {numeroDeDia(cuando)}
      </Text>
      <Text style={estilos.fechaMes}>{mesAbrev(cuando)}</Text>
    </View>
  );
}

/** El raíl, con LA gramática de la app (02-09-2026, critique): aro hueco =
    sales, ROJO lleno = llegas — la misma del pin de la búsqueda. */
function Rail({ origen, destino }: { origen: string; destino: string }) {
  return (
    <View style={estilos.rail}>
      <View style={estilos.filaRail}>
        <View style={estilos.aroOrigen} />
        <Text style={estilos.lugar} numberOfLines={1}>
          {origen}
        </Text>
      </View>
      <View style={estilos.hilo} />
      <View style={estilos.filaRail}>
        <View style={estilos.puntoDestino} />
        <Text style={estilos.lugar} numberOfLines={1}>
          {destino}
        </Text>
      </View>
    </View>
  );
}

/** Las dos cifras bajo el filete: puestos reservados y aporte por puesto. */
function Cifras({
  puestos,
  de,
  aporteCentavos,
}: {
  puestos: number;
  /** De cuántos ofrecidos. Sin él, un «0» suelto no cuenta nada: «0 de 3»
      dice el estado del carro; «0» a secas parece un error. */
  de?: number;
  aporteCentavos: number;
}) {
  return (
    <View style={estilos.filaCifras}>
      <View style={estilos.cifra}>
        <Asiento tamano={22} tinta={color.ink700} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[estilos.cifraNumero, tabular]}>
            {de != null ? `${puestos} de ${de}` : puestos}
          </Text>
          <Text style={estilos.cifraPie}>
            {puestos === 1 && de == null ? 'puesto reservado' : 'puestos reservados'}
          </Text>
        </View>
      </View>
      <View style={estilos.cifraRaya} />
      <View style={estilos.cifra}>
        <Billete tamano={22} tinta={color.ink700} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[estilos.cifraNumero, tabular]}>
            {formatearDineroRedondo(aporteCentavos)}
          </Text>
          <Text style={estilos.cifraPie}>por puesto</Text>
        </View>
      </View>
    </View>
  );
}

/** El día del calendario en Panamá, para saber si la llegada cruza la noche. */
const diaEnPanama = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'America/Panama',
});

/**
 * Las horas del dibujo: «23:00 → 05:30» en grande, y DEBAJO lo que dura.
 *
 * La duración iba pegada al lado del número grande y se leía como un
 * pegote — «05:30 6 h 30» (visto por el dueño el 02-09-2026: «the total
 * duration is next to big number, it's weird»). Los datos secundarios van
 * en su renglón, no colgados del primario. Y una salida a las 23:00 que
 * llega a las 05:30 llega OTRO DÍA: el invariante de la casa manda decirlo
 * siempre, así que el renglón chico también dice «llegas el sábado».
 */
function Horas({ sale, llega }: { sale: string; llega: string }) {
  const dura = duracionEntre(sale, llega);
  const otroDia = diaEnPanama.format(new Date(sale)) !== diaEnPanama.format(new Date(llega));
  const pie = [dura ? `${dura} de viaje` : '', otroDia ? `llegas el ${diaSemana(llega).toLowerCase()}` : '']
    .filter(Boolean)
    .join(' · ');
  return (
    <View>
      <Text style={[estilos.horas, tabular]} numberOfLines={1}>
        {`${hora(sale)} → ${hora(llega)}`}
      </Text>
      {pie ? (
        <Text style={estilos.duracion} numberOfLines={1}>
          {pie}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * UN VIAJE QUE CONDUCES, como lo dibuja la referencia. **La cifra es la de
 * puestos RESERVADOS** (pedido del dueño: cuántos van, no cuántos caben) y
 * la esquina lleva lo que corre: la pastilla roja si alguien pide puesto.
 */
function TarjetaConduzco({ viaje, router }: { viaje: ViajePublicado; router: Router }) {
  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.filaAlta}>
        <BloqueFecha cuando={viaje.cuando} />
        <View style={{ flex: 1, minWidth: 0, gap: 7 }}>
          <View style={estilos.filaChip}>
            <View style={[estilos.chip, { backgroundColor: color.rojo100 }]}>
              <Volante tinta={color.rojo700} />
              <Text style={[estilos.chipTexto, { color: color.rojo700 }]}>Conduces tú</Text>
            </View>
            {viaje.solicitudes > 0 ? (
              <View style={estilos.pastillaPiden}>
                <Text style={estilos.pastillaPidenTexto}>
                  {viaje.solicitudes === 1 ? '1 pide puesto' : `${viaje.solicitudes} piden puesto`}
                </Text>
              </View>
            ) : null}
          </View>
          <Horas sale={viaje.horaSalida} llega={viaje.horaLlegada} />
        </View>
      </View>

      <Rail origen={viaje.origen.split(' · ')[0]} destino={viaje.destino.split(' · ')[0]} />

      <View style={estilos.filete} />
      <Cifras
        puestos={viaje.puestosVendidos}
        de={viaje.puestosOfrecidos}
        aporteCentavos={viaje.aporteCentavos}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Administrar viaje"
        onPress={() =>
          router.push({ pathname: '/(conductor)/administrar', params: { viaje: viaje.id } })
        }
        style={({ pressed }) => [
          estilos.cta,
          { backgroundColor: pressed ? color.rojo600 : color.rojo500 },
        ]}
      >
        <Text style={estilos.ctaTexto}>Administrar viaje</Text>
        <Avanza tamano={17} tinta="#fff" />
      </Pressable>
    </View>
  );
}

/**
 * UN PUESTO QUE PEDISTE: la misma anatomía, con el chip azul, tus puestos
 * reservados como cifra, y el talón del código dentro de la tarjeta —donde
 * el dueño lo puso el 01-09 y donde se queda.
 */
function TarjetaPasajero({ puesto, router }: { puesto: PuestoMio; router: Router }) {
  const estado = ESTADO[puesto.estado] ?? ESTADO.confirmed;

  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.filaAlta}>
        <BloqueFecha cuando={puesto.cuando} />
        <View style={{ flex: 1, minWidth: 0, gap: 7 }}>
          <View style={estilos.filaChip}>
            <View style={[estilos.chip, { backgroundColor: color.azul50 }]}>
              <Asiento tamano={14} tinta={color.azul700} />
              <Text style={[estilos.chipTexto, { color: color.azul700 }]}>Vas de pasajero</Text>
            </View>
            <View style={[estilos.pastillaEstado, { backgroundColor: estado.fondo }]}>
              <Text style={[estilos.pastillaEstadoTexto, { color: estado.tinta }]}>
                {estado.texto}
              </Text>
            </View>
          </View>
          <Horas sale={puesto.cuando} llega={puesto.llegada} />
        </View>
      </View>

      <Rail origen={puesto.origen} destino={puesto.destino} />

      <View style={estilos.filete} />
      <Cifras puestos={puesto.puestos} aporteCentavos={puesto.aporteCentavos / puesto.puestos} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ver mi viaje"
        onPress={() =>
          router.push({ pathname: '/(pasajero)/viaje', params: { viaje: puesto.viajeId } })
        }
        style={({ pressed }) => [
          estilos.cta,
          { backgroundColor: pressed ? color.rojo600 : color.rojo500 },
        ]}
      >
        <Text style={estilos.ctaTexto}>Ver mi viaje</Text>
        <Avanza tamano={17} tinta="#fff" />
      </Pressable>

      {/* El talón del código, que vive EN la tarjeta (01-09-2026): es lo que
          hay que tener en la mano en la acera, con el carro llegando. */}
      {puesto.estado === 'confirmed' && puesto.codigo ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Mi código para subir: ${puesto.codigo.split('').join(' ')}. Verlo en grande`}
          onPress={() =>
            router.push({ pathname: '/(pasajero)/codigo', params: { reserva: puesto.reservaId } })
          }
          style={({ pressed }) => [estilos.talon, pressed && { opacity: 0.85 }]}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={estilos.talonEpigrafe}>Código para subir</Text>
            <Text style={[estilos.talonCodigo, tabular]}>{puesto.codigo}</Text>
          </View>
          <Text style={estilos.talonEnlace}>Verlo en grande</Text>
          <Avanza tamano={14} tinta={color.azul700} />
        </Pressable>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------- las filas del historial */

function FilaHistorial({ fila, alPulsar }: { fila: Fila; alPulsar: () => void }) {
  const esPuesto = fila.clase === 'pasajero';
  const cuandoDe = esPuesto ? fila.puesto.cuando : fila.viaje.cuando;
  const origen = esPuesto ? fila.puesto.origen : fila.viaje.origen.split(' · ')[0];
  const destino = esPuesto ? fila.puesto.destino : fila.viaje.destino.split(' · ')[0];
  const estado = esPuesto
    ? (ESTADO[fila.puesto.estado] ?? ESTADO.completed)
    : ESTADO.completed;
  const meta = esPuesto
    ? `Pasajero · ${formatearDineroRedondo(fila.puesto.aporteCentavos)}`
    : `Conduces · ${fila.viaje.puestosVendidos}/${fila.viaje.puestosOfrecidos} puestos`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${origen} a ${destino}, ${estado.texto.toLowerCase()}`}
      onPress={alPulsar}
      style={({ pressed }) => [estilos.filaPasada, pressed && { backgroundColor: color.sand100 }]}
    >
      <BloqueFecha cuando={cuandoDe} chico />

      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={estilos.filaRailMini}>
          <View style={estilos.aroOrigenMini} />
          <Text style={estilos.lugarMini} numberOfLines={1}>
            {origen}
          </Text>
        </View>
        <View style={estilos.filaRailMini}>
          <View style={estilos.puntoDestinoMini} />
          <Text style={estilos.lugarMini} numberOfLines={1}>
            {destino}
          </Text>
        </View>
        <Text style={estilos.metaMini} numberOfLines={1}>
          {meta}
        </Text>
      </View>

      <View style={estilos.ladoFila}>
        <View style={[estilos.pastillaEstado, { backgroundColor: estado.fondo }]}>
          <Text style={[estilos.pastillaEstadoTexto, { color: estado.tinta }]}>
            {estado.texto}
          </Text>
        </View>
        <Text style={[estilos.horaFila, tabular]}>{hora(cuandoDe)}</Text>
      </View>

      <Avanza />
    </Pressable>
  );
}

/* ------------------------------------------------------- iconitos propios */

/** El volante del chip «Conduces tú»: aro, cubo y tres radios. */
function Volante({ tinta }: { tinta: string }) {
  return (
    <Svg viewBox="0 0 24 24" width={14} height={14} fill="none">
      <Circle cx={12} cy={12} r={9} stroke={tinta} strokeWidth={1.8} />
      <Circle cx={12} cy={12} r={2.4} fill={tinta} />
      <Path
        d="M3.4 10.5h17.2M12 14.4V21M9.9 13.4l-4.5 4.9M14.1 13.4l4.5 4.9"
        stroke={tinta}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** El reloj de la casilla «Historial». */
function Reloj({ tinta }: { tinta: string }) {
  return (
    <Svg viewBox="0 0 24 24" width={18} height={18} fill="none">
      <Circle cx={12} cy={12} r={8.5} stroke={tinta} strokeWidth={1.8} />
      <Path d="M12 7.5V12l3 2" stroke={tinta} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

/* ----------------------------------------------------------------- estilos */

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: color.sand100,
    maxWidth: espacio.marco,
    width: '100%',
    alignSelf: 'center',
  },
  contenido: { paddingHorizontal: espacio.gutter, paddingTop: 14, paddingBottom: 110 },

  /* ── la cabecera del dibujo: titular grande, botón de filtros, bajada ── */
  filaTitular: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  titular: {
    flex: 1,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -1.05,
    color: color.ink900,
    fontFamily: familia,
  },
  botonFiltros: {
    width: 44,
    height: 44,
    borderRadius: radio.pastilla,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    alignItems: 'center',
    justifyContent: 'center',
  },
  puntoAviso: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: color.rojo500,
    borderWidth: 1.5,
    borderColor: color.blanco,
  },
  bajada: {
    fontSize: 14,
    lineHeight: 20,
    color: color.ink600,
    fontFamily: familia,
    marginTop: 6,
  },

  /* ── el selector Próximos / Historial ── */
  selector: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 16,
    padding: 4,
    backgroundColor: color.blanco,
    borderRadius: radio.pastilla,
    borderWidth: 1,
    borderColor: color.bordeSutil,
  },
  casilla: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: radio.pastilla,
  },
  casillaActiva: { backgroundColor: color.ink900 },
  casillaTexto: {
    fontSize: 14.5,
    lineHeight: 20,
    fontWeight: '600',
    color: color.ink700,
    fontFamily: familia,
  },
  casillaTextoActiva: { color: '#fff' },

  rotulo: { marginTop: 20, marginBottom: 10 },

  /* ── la tarjeta grande ── */
  tarjeta: {
    backgroundColor: color.blanco,
    borderRadius: 24,
    padding: 18,
    shadowColor: '#8F1024',
    shadowOpacity: 0.09,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  filaAlta: { flexDirection: 'row', gap: 14 },
  bloqueFecha: {
    width: 62,
    paddingVertical: 9,
    borderRadius: radio.icono,
    backgroundColor: color.sand100,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  bloqueFechaChico: { width: 50, paddingVertical: 6, backgroundColor: 'transparent' },
  fechaSemana: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.ink600,
    fontFamily: familia,
  },
  fechaNumero: {
    fontSize: 25,
    lineHeight: 29,
    fontWeight: '700',
    letterSpacing: -0.9,
    color: color.ink900,
    fontFamily: familia,
  },
  fechaNumeroChico: { fontSize: 21, lineHeight: 25 },
  fechaMes: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.ink500,
    fontFamily: familia,
  },

  filaChip: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radio.pastilla,
  },
  chipTexto: {
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '600',
    fontFamily: familia,
  },
  /** Rojo sólido sólo cuando reclama respuesta: solicitudes esperando. */
  pastillaPiden: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radio.pastilla,
    backgroundColor: color.rojo500,
  },
  pastillaPidenTexto: {
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: '700',
    letterSpacing: 10.5 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: '#fff',
    fontFamily: familia,
  },
  pastillaEstado: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radio.pastilla,
  },
  pastillaEstadoTexto: {
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: '700',
    letterSpacing: 10.5 * TRACK_MICRO,
    textTransform: 'uppercase',
    fontFamily: familia,
  },

  horas: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.66,
    color: color.ink900,
    fontFamily: familia,
  },
  /** Su propio renglón, bajo las horas: contexto, no la hora. */
  duracion: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: color.ink500,
    fontFamily: familia,
    marginTop: 2,
  },

  /* ── el raíl ── */
  rail: { marginTop: 15 },
  filaRail: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  /** Aro hueco = sales; rojo lleno = llegas. La única gramática del raíl. */
  aroOrigen: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: color.ink300,
    backgroundColor: color.blanco,
  },
  puntoDestino: { width: 10, height: 10, borderRadius: 5, backgroundColor: color.rojo500 },
  /** El hilo entre los dos puntos. Sólido, como el de la tarjeta del panel:
      el borde discontinuo de 0 px de ancho se dibujaba como un tiro suelto
      bajo el punto rojo (visto en el teléfono el 02-09-2026). */
  hilo: {
    width: 2,
    height: 16,
    marginLeft: 4,
    marginVertical: 2,
    borderRadius: 1,
    backgroundColor: color.ink200,
  },
  lugar: {
    flex: 1,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600',
    letterSpacing: -0.32,
    color: color.ink900,
    fontFamily: familia,
  },

  filete: { height: 1, backgroundColor: color.bordeSutil, marginTop: 16 },

  /* ── las dos cifras ── */
  filaCifras: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  cifra: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  cifraRaya: { width: 1, height: 34, backgroundColor: color.bordeSutil, marginHorizontal: 12 },
  cifraNumero: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: -0.34,
    color: color.ink900,
    fontFamily: familia,
  },
  cifraPie: { fontSize: 12.5, lineHeight: 17, color: color.ink600, fontFamily: familia },

  /* ── la acción de la tarjeta ── */
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 52,
    borderRadius: radio.control,
    marginTop: 16,
  },
  ctaTexto: {
    fontSize: 15.5,
    lineHeight: 21,
    fontWeight: '700',
    letterSpacing: -0.155,
    color: '#fff',
    fontFamily: familia,
  },

  /** El talón del código: raya discontinua, como un pase de abordar. */
  talon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: color.bordePorDefecto,
    borderStyle: 'dashed',
  },
  talonEpigrafe: {
    fontSize: 10,
    lineHeight: 14.5,
    fontWeight: '600',
    letterSpacing: 10 * 0.07,
    textTransform: 'uppercase',
    color: color.ink600,
    fontFamily: familia,
  },
  talonCodigo: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '700',
    letterSpacing: 3,
    color: color.ink900,
    fontFamily: familia,
  },
  talonEnlace: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600',
    color: color.azul700,
    fontFamily: familia,
  },

  /* ── la banda verde ── */
  seguro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: radio.l,
    backgroundColor: color.hechoFondo,
  },
  seguroCirculo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: color.verde500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seguroTitulo: {
    fontSize: 14.5,
    lineHeight: 20,
    fontWeight: '700',
    letterSpacing: -0.22,
    color: color.ink900,
    fontFamily: familia,
  },
  seguroTexto: {
    fontSize: 12.5,
    lineHeight: 18,
    color: color.ink700,
    fontFamily: familia,
    marginTop: 1,
  },
  seguroEnlace: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '700',
    color: color.hechoTinta,
    fontFamily: familia,
  },

  /* ── el historial ── */
  filaPasada: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 13,
    borderRadius: radio.l,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
  },
  filaRailMini: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 21 },
  aroOrigenMini: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: color.ink400,
    backgroundColor: color.blanco,
  },
  puntoDestinoMini: { width: 8, height: 8, borderRadius: 4, backgroundColor: color.rojo500 },
  lugarMini: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    letterSpacing: -0.21,
    color: color.ink900,
    fontFamily: familia,
  },
  metaMini: {
    fontSize: 12.5,
    lineHeight: 17.4,
    color: color.ink600,
    marginTop: 3,
    marginLeft: 17,
    fontFamily: familia,
  },
  ladoFila: { alignItems: 'flex-end', gap: 5 },
  horaFila: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '700',
    letterSpacing: -0.27,
    color: color.ink900,
    fontFamily: familia,
  },

  verTodo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: espacio.tap,
    paddingHorizontal: 6,
    marginTop: 4,
  },
  verTodoTexto: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '500',
    color: color.ink600,
    fontFamily: familia,
  },

  nadaTodavia: {
    fontSize: 14,
    lineHeight: 20,
    color: color.ink600,
    marginTop: 4,
    fontFamily: familia,
  },
});
