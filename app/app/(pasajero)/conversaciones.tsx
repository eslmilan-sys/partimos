/**
 * `16a` Conversaciones — todos los hilos, cada uno con su viaje.
 *
 * **Qué cambió y por qué.** Era una lista de filas grises sobre arena, todas
 * del mismo peso, sin forma de encontrar una ni de saber cuáles reclaman. Un
 * chat sin jerarquía obliga a leerlo entero para elegir.
 *
 * Ahora: buscador —porque a los seis hilos ya no te acuerdas de cuál era—,
 * dos filtros que dicen cuántos hay en cada uno, la hora a la derecha como en
 * cualquier bandeja, la cuenta de sin leer en pastilla roja, y el viaje
 * debajo de cada nombre, que es el contexto que un chat suelto no tiene.
 *
 * Y la línea del pie no es relleno: es lo que evita la pregunta de por qué un
 * chat viejo ya no responde. Se cierran 48 h después de la llegada.
 */

import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useRouter } from 'expo-router';

import { type HiloDelViaje, hiloDelViaje, hilosDePregunta } from '@/servicios/mensajes';
import { type PuestoMio, misViajes } from '@/servicios/panel';
import { useMiIdOEntrar } from '@/servicios/sesion';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { Pestanas } from '@/ui/Pestanas';
import { Avatar } from '@/ui/controles';
import { tabular } from '@/ui/dinero';
import { diaAbrev, esHoy, hora } from '@/ui/fechas';
import { Lupa, Marca, Visto } from '@/ui/iconos';
import { familia, color, espacio, radio } from '@/ui/tokens';

/** Sin sesión que preguntar —solo en simulado—, la pasajera del traspaso. */
const YO_DEL_RECORRIDO = '99999999-9999-4999-8999-999999999999';

/**
 * Una fila de la bandeja, venga de una reserva o de una pregunta.
 *
 * Se normaliza aquí porque las dos cosas se leen igual —un nombre, lo último
 * dicho, de qué viaje va— y solo cambian en a dónde llevan. Ramificar en el
 * dibujo habría duplicado la fila entera para cambiar dos parámetros.
 */
type Fila = {
  clave: string;
  hilo: HiloDelViaje;
  /** «Chitré · vie 6:00», el contexto que un chat suelto no tiene. */
  destino: string;
  cuando: string;
  params: Record<string, string>;
  /** Todavía sin puesto pedido: la bandeja lo dice, no lo esconde. */
  soloPregunta: boolean;
};
type Filtro = 'todos' | 'sinLeer';

export default function Conversaciones() {
  const router = useRouter();
  const yo = useMiIdOEntrar(YO_DEL_RECORRIDO);
  const [filas, setFilas] = useState<Fila[] | null>(null);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');

  useEffect(() => {
    if (!yo) return;
    (async () => {
      const mios = await misViajes(yo);
      const todos = [...mios.proximos, ...mios.pasados];
      const dePuestos: Fila[] = (
        await Promise.all(
          todos.map(async (puesto: PuestoMio) => ({
            clave: puesto.reservaId,
            hilo: await hiloDelViaje(puesto.reservaId, yo),
            destino: puesto.destino,
            cuando: puesto.cuando,
            params: { reserva: puesto.reservaId },
            soloPregunta: false,
          })),
        )
      ).filter((f) => f.hilo.mensajes.length > 0);

      /* Las preguntas van en la MISMA bandeja. Un hilo que se abre desde la
         ficha de un viaje y no aparece aquí es un hilo perdido: quien pregunta
         no sabe volver a él, y quien maneja no sabe que le preguntaron. */
      const preguntas: Fila[] = (await hilosDePregunta(yo)).map((hilo: HiloDelViaje) => ({
        clave: `${hilo.viajeId}·${hilo.otro.id}`,
        hilo,
        destino: hilo.ruta,
        cuando: hilo.cuando,
        params: { viaje: hilo.viajeId ?? '', con: hilo.conId ?? '' },
        soloPregunta: true,
      }));

      setFilas([...preguntas, ...dePuestos]);
    })();
  }, [yo]);

  /* De `read_at`, no de «el último no es mío»: con aquello, abrir un hilo no
     lo apagaba nunca. Es un hecho de la base, no una deducción. */
  const sinLeerDe = (f: Fila) => f.hilo.sinLeer > 0;

  const visibles = useMemo(() => {
    if (!filas) return [];
    const q = busca.trim().toLowerCase();
    return filas
      .filter((f) => (filtro === 'sinLeer' ? sinLeerDe(f) : true))
      .filter(
        (f) =>
          q === '' ||
          f.hilo.otro.nombre.toLowerCase().includes(q) ||
          f.destino.toLowerCase().includes(q),
      );
  }, [filas, busca, filtro]);

  if (!filas) return <Cargando altura={206} tarjetas={4} />;

  const sinLeer = filas.filter(sinLeerDe).length;
  /* Buscar entre cinco hilos es buscar; entre dos es leerlos. */
  const hayBuscador = filas.length >= 5;
  const hayFiltros = sinLeer > 0;
  /* La fila de Partimos no es de nadie y nunca está sin leer: filtrando por
     «sin leer» no tiene nada que hacer ahí, y buscando «Julien» tampoco. */
  const seVeLoNuestro = filtro === 'todos' && busca.trim() === '';

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

      {/* **EL MISMO ARMAZÓN QUE MIS VIAJES** (02-09-2026, pedido del dueño:
          la bandeja necesitaba «un cambio total», y el cambio de verdad era
          de familia — campo rojo y chips de otra época al lado de la 5b
          recién puesta al v6. Ahora las tres raíces hablan igual: fondo
          claro, titular grande, y el selector de dos casillas. */}
      <View style={estilos.cabecera}>
        {/* **SIN BOTÓN ATRÁS Y SIN EPÍGRAFE** (30-08-2026, visto por el
            dueño: «its weird why a back button?»). Dos errores en una fila
            de 40 px:

            1. Mensajes es una PESTAÑA RAÍZ — está en la barra de abajo, al
               lado de Buscar y Perfil. Una raíz no tiene «atrás»: no hay
               nada detrás de ella, y `router.back()` devuelve a la última
               pantalla que se mirara, que puede ser cualquiera. Sus dos
               hermanas, Inicio y Panel, nunca lo tuvieron.
            2. El epígrafe decía «TODO LEÍDO» — un ESTADO donde el sistema
               pone un SITIO («CONDUCTOR · ANDRÉS M.»), y encima el mismo
               dato que la pastilla «Sin leer 0» de dos dedos más abajo. Un
               hecho dicho dos veces en la misma pantalla. */}
        <Text style={estilos.titular}>Mensajes</Text>
        <Text style={estilos.bajada}>Tus conversaciones de viaje, por escrito.</Text>

        {/* EL BUSCADOR APARECE CUANDO HAY QUE BUSCAR. Su propio comentario lo
            decía —«a los SEIS hilos ya no te acuerdas de cuál era»— y salía
            igual con uno: un campo de 52 px de alto para elegir entre dos
            filas que caben enteras en pantalla. */}
        {hayBuscador ? (
          <View style={estilos.buscador}>
            <Lupa tamano={18} tinta={color.ink600} />
            <TextInput
              value={busca}
              onChangeText={setBusca}
              placeholder="Buscar por nombre o destino"
              placeholderTextColor={color.ink600}
              accessibilityLabel="Buscar una conversación"
              style={estilos.entrada}
            />
          </View>
        ) : null}

        {/* **LOS FILTROS SÓLO EXISTEN SI FILTRAN ALGO.** Se enseñaban siempre,
            y con la bandeja al día quedaba un «Sin leer 0» pulsable que sólo
            podía llevar a una lista vacía — un callejón sin salida dibujado
            como un control. Con todo leído no hay nada que separar; con algo
            sin leer, los dos chips valen.

            Van en la cabecera y no en el cuerpo: dentro del `ScrollView`, que
            empieza donde acaba la cabecera, la mitad de arriba de cada chip
            caía sobre el rojo y la de abajo sobre la arena. */}
        {/* El selector de dos casillas, el mismo de Mis viajes: sólo existe
            cuando separa algo. La cuenta incluye la fila de Partimos — un
            número que no cuadra con lo que se ve al lado le quita el
            crédito al que sí es cierto (29-08). */}
        {hayFiltros ? (
          <View style={estilos.selector}>
            <Casilla
              activo={filtro === 'todos'}
              etiqueta="Todos"
              cuenta={filas.length + 1}
              alPulsar={() => setFiltro('todos')}
            />
            <Casilla
              activo={filtro === 'sinLeer'}
              etiqueta="Sin leer"
              cuenta={sinLeer}
              alPulsar={() => setFiltro('sinLeer')}
            />
          </View>
        ) : null}
      </View>

      <View style={estilos.cuerpo}>
        {/* El hilo de Partimos va siempre y va primero: una bandeja vacía el
            primer día no dice nada, y quien acaba de entrar no sabe qué puede
            hacer. No se guarda en `messages` porque no es de nadie.

            **Y POR ESO NO LLEVA CHINCHETA DE SIN LEER.** Llevaba un «1» rojo
            escrito a mano, y era mentira por partida triple: no se apagaba al
            abrirlo, no lo contaban los chips —«Todos 2» y «Sin leer 2» con
            TRES filas en pantalla y tres chinchetas—, y el filtro «Sin leer»
            lo dejaba puesto igual porque vive fuera de la lista. Un número
            que no cuadra con lo que se ve al lado le quita el crédito a los
            otros dos, que sí son ciertos (29-08-2026).
            Se queda fijo arriba, sin chincheta y diciendo lo que es. */}
        {seVeLoNuestro ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mensaje de Partimos: bienvenido a bordo"
          onPress={() => router.push('/(pasajero)/partimos')}
          style={({ pressed }) => [estilos.fila, estilos.filaNuestra, pressed && estilos.pulsada]}
        >
          <View style={estilos.marcaCuadro}>
            <Marca tamano={20} tinta={color.rojo600} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            {/* SIN HORA. Decía «ahora», y no era ahora: es un texto fijo que
                lleva ahí desde que se abrió la cuenta. Una hora falsa en una
                bandeja es de las mentiras más baratas de cometer. */}
            <Text style={estilos.nombre} numberOfLines={1}>
              Partimos
            </Text>
            <Text style={[estilos.ultimo, estilos.ultimoNuestro]} numberOfLines={1}>
              Bienvenido a bordo. Las tres cosas que puedes hacer desde ya.
            </Text>
            <View style={estilos.filaContexto}>
              <Text style={estilos.contexto} numberOfLines={1}>
                Un mensaje nuestro · aquí no contestamos
              </Text>
            </View>
          </View>
        </Pressable>
        ) : null}

        {visibles.map(({ clave, hilo, destino, cuando, params, soloPregunta }) => {
          const ultimo = hilo.mensajes[hilo.mensajes.length - 1];
          const nuevo = hilo.sinLeer > 0;
          return (
            <Pressable
              key={clave}
              accessibilityRole="button"
              accessibilityLabel={`Conversación con ${hilo.otro.nombre}`}
              onPress={() => router.push({ pathname: '/(pasajero)/chat', params })}
              style={({ pressed }) => [estilos.fila, pressed && estilos.pulsada]}
            >
              <Avatar nombre={hilo.otro.nombre} tamano={44} />

              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={estilos.filaSuperior}>
                  <Text style={estilos.nombre} numberOfLines={1}>
                    {hilo.otro.nombre}
                  </Text>
                  <Text style={estilos.cuando}>{ultimo ? cuandoCorto(hilo.cuando) : ''}</Text>
                </View>

                <View style={estilos.filaUltimo}>
                  {/* La marca de leído en tus propios mensajes, como en
                      cualquier chat: dice si el otro ya lo tiene. */}
                  {ultimo?.mio ? <Visto tamano={13} tinta={color.ink400} /> : null}
                  <Text
                    style={[estilos.ultimo, nuevo && estilos.ultimoNuevo]}
                    numberOfLines={1}
                  >
                    {ultimo?.texto ?? ''}
                  </Text>
                </View>

                <View style={estilos.filaContexto}>
                  {/* «Preguntando» y no un puesto: el estado de un hilo sin
                      reserva es exactamente ese, y esconderlo haría creer que
                      hay puesto pedido donde no lo hay. */}
                  {soloPregunta ? (
                    <View style={estilos.pastillaPregunta}>
                      <Text style={estilos.pastillaPreguntaTexto}>Preguntando</Text>
                    </View>
                  ) : null}
                  <Text style={estilos.contexto} numberOfLines={1}>
                    {`${destino} · ${cuandoLargo(cuando)}`}
                  </Text>
                  {nuevo ? (
                    <View style={estilos.pastillaSinLeer}>
                      <Text style={estilos.pastillaSinLeerTexto}>{hilo.sinLeer}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </Pressable>
          );
        })}

        {visibles.length === 0 ? (
          <View style={estilos.vacio}>
            <Text style={estilos.vacioTitulo}>
              {busca.trim() !== ''
                ? 'Nada con ese nombre.'
                : filtro === 'sinLeer'
                  ? 'No tienes nada sin leer.'
                  : 'Todavía no hablas con nadie.'}
            </Text>
            <Text style={estilos.vacioTexto}>
              {busca.trim() !== ''
                ? 'Prueba con el nombre de quien maneja o con el destino.'
                : 'Escríbele a quien maneja desde la ficha del viaje, sin pedir puesto todavía. Y al aceptarte, aquí se acuerda dónde te recoge.'}
            </Text>
            {/* Sin botón: la barra de abajo ya tiene «Buscar» a un dedo de
                distancia, y un botón rojo dentro de un vacío gris pesa más que
                lo que ofrece (pedido del dueño, 27-08-2026). */}
          </View>
        ) : null}

        {/* Una línea, no tres, y sólo cuando hay hilos: la explicación de por
            qué un chat viejo deja de responder sólo le importa a quien tiene
            chats. Lo de «preguntar no ocupa nada» ya se dice donde se
            pregunta, en la ficha del viaje. */}
        {visibles.length > 0 ? (
          <Text style={estilos.pieTexto}>
            Los chats se cierran 48 h después de la llegada. Lo que se acuerde aquí queda por
            escrito.
          </Text>
        ) : null}
      </View>
      </ScrollView>

      <Pestanas valor="Mensajes" yo={yo} />
    </View>
  );
}

/** Una casilla del selector — la misma pieza de dos estados de Mis viajes. */
function Casilla({
  activo,
  etiqueta,
  cuenta,
  alPulsar,
}: {
  activo: boolean;
  etiqueta: string;
  cuenta: number;
  alPulsar: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      accessibilityLabel={`${etiqueta}, ${cuenta}`}
      onPress={alPulsar}
      style={[estilos.casilla, activo && estilos.casillaActiva]}
    >
      <Text style={[estilos.casillaTexto, activo && estilos.casillaTextoActiva]}>{etiqueta}</Text>
      <Text style={[estilos.casillaCuenta, activo && estilos.casillaCuentaActiva, tabular]}>
        {String(cuenta)}
      </Text>
    </Pressable>
  );
}

/** La hora si es de hoy, el día si no: en una lista nadie quiere la fecha entera. */
function cuandoCorto(cuandoISO: string): string {
  return esHoy(cuandoISO) ? hora(cuandoISO) : diaAbrev(cuandoISO);
}

function cuandoLargo(cuandoISO: string): string {
  return esHoy(cuandoISO)
    ? `hoy ${hora(cuandoISO)}`
    : `${diaAbrev(cuandoISO).toLowerCase()} ${hora(cuandoISO)}`;
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: color.sand100,
    maxWidth: espacio.marco,
    width: '100%',
    alignSelf: 'center',
  },

  /* La cabecera del armazón v6: titular grande y bajada, como Mis viajes. */
  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 14, paddingBottom: 16 },
  titular: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -1.05,
    color: color.ink900,
    fontFamily: familia,
  },
  bajada: {
    fontSize: 14,
    lineHeight: 20,
    color: color.ink600,
    fontFamily: familia,
    marginTop: 6,
  },

  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    marginTop: 16,
    paddingHorizontal: 15,
    borderRadius: radio.pastilla,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
  },
  entrada: {
    flex: 1,
    fontFamily: familia,
    /* 16: por debajo de eso Safari acerca la página al enfocar el campo. */
    fontSize: 15.5,
    color: color.ink900,
    outlineStyle: 'none',
  } as never,

  cuerpo: { paddingHorizontal: espacio.gutter, paddingTop: 20, paddingBottom: 22, gap: 8 },

  /* El selector de dos casillas, la pieza de Mis viajes: fila blanca con
     borde, la activa en tinta. */
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
    gap: 7,
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
  casillaCuenta: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600',
    color: color.ink500,
    fontFamily: familia,
  },
  casillaCuentaActiva: { color: 'rgba(255,255,255,.72)' },

  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radio.l,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
  },
  /* En arena y no en blanco: es un aviso nuestro, no una conversación.
     Con el mismo blanco que las demás se leía como una persona más — con
     avatar, hora y previsualización — hasta la línea que dice que ahí no
     contestamos. */
  filaNuestra: { backgroundColor: color.sand200, borderColor: 'transparent' },
  /* `ink500` daba 4,39:1 sobre el arena de esta fila —pasaba sobre blanco y
     no aquí—, por debajo del 4,5 que pide la WCAG a 13,5 px. Medido con
     `herramientas/auditar.mjs`. */
  ultimoNuestro: { color: color.ink600 },
  pulsada: { backgroundColor: color.sand100, borderColor: color.bordePorDefecto },
  marcaCuadro: {
    width: 44,
    height: 44,
    borderRadius: radio.cuadrado,
    backgroundColor: color.rojo50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filaSuperior: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  nombre: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    letterSpacing: -0.23,
    color: color.ink900,
    fontFamily: familia,
  },
  cuando: { fontSize: 11.5, lineHeight: 17, color: color.ink600, fontFamily: familia, ...tabular },

  filaUltimo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  ultimo: { flex: 1, fontSize: 13.5, lineHeight: 19, color: color.ink500, fontFamily: familia },
  ultimoNuevo: { color: color.ink900, fontWeight: '500' },

  filaContexto: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  /** Llana y de tinta: informa de un estado, no reclama nada. */
  pastillaPregunta: {
    height: 19,
    paddingHorizontal: 7,
    borderRadius: radio.ficha,
    backgroundColor: color.lavado,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastillaPreguntaTexto: {
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: '600',
    /* `ink500` sobre el lavado de la pastilla ronda el 4,5:1 justo — el
       mínimo que pide la WCAG a 10,5 px, sin margen. `ink700` lo deja en
       ~7:1 y sigue siendo una etiqueta llana, no una alarma. */
    color: color.ink700,
    fontFamily: familia,
  },
  contexto: { flex: 1, fontSize: 11.5, lineHeight: 17, color: color.ink600, fontFamily: familia },
  pastillaSinLeer: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: radio.pastilla,
    backgroundColor: color.rojo500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastillaSinLeerTexto: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '700',
    color: '#fff',
    fontFamily: familia,
    ...tabular,
  },

  vacio: {
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.bordePorDefecto,
    borderRadius: radio.l,
    padding: 20,
    gap: 8,
  },
  vacioTitulo: {
    fontSize: 15.5,
    lineHeight: 23,
    fontWeight: '600',
    letterSpacing: -0.24,
    color: color.ink900,
    fontFamily: familia,
  },
  vacioTexto: { fontSize: 13.5, lineHeight: 20, color: color.ink500, fontFamily: familia },

  pieTexto: {
    fontSize: 12.5,
    lineHeight: 19,
    color: color.ink600,
    marginTop: 8,
    fontFamily: familia,
  },
});
