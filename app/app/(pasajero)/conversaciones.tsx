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

import { useVolver } from '@/ui/salidas';

import { type HiloDelViaje, hiloDelViaje, hilosDePregunta } from '@/servicios/mensajes';
import { type PuestoMio, misViajes } from '@/servicios/panel';
import { useMiIdOEntrar } from '@/servicios/sesion';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { CampoRojo } from '@/ui/CampoRojo';
import { Pestanas } from '@/ui/Pestanas';
import { Avatar } from '@/ui/controles';
import { Chip } from '@/ui/piezas';
import { tabular } from '@/ui/dinero';
import { diaAbrev, esHoy, hora } from '@/ui/fechas';
import { Atras, Lupa, Marca, Visto } from '@/ui/iconos';
import { TRACK_MICRO, familia, color, espacio, radio } from '@/ui/tokens';

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
  const volver = useVolver();
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

      <CampoRojo altura={214} motivo="hibisco" />

      <View style={estilos.cabecera}>
        <View style={estilos.filaSuperiorCampo}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atrás"
            onPress={() => volver()}
            style={estilos.circulo}
          >
            <Atras />
          </Pressable>
          <Text style={estilos.epigrafeCampo}>
            {sinLeer === 0 ? 'Todo leído' : sinLeer === 1 ? '1 sin leer' : `${sinLeer} sin leer`}
          </Text>
        </View>
        <Text style={estilos.titular}>Mensajes</Text>

        {/* El buscador, sobre el campo: a los seis hilos ya no te acuerdas de
            cuál era, y desplazar una lista para encontrar un nombre no es
            buscar. */}
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

        {/* **Los filtros van aquí, no en el cuerpo.** Estaban dentro del
            `ScrollView`, que empieza donde acaba la cabecera: la mitad de
            arriba de cada chip caía sobre el rojo y la de abajo sobre la
            arena, partidos por el borde del campo. Puestos en la cabecera se
            apoyan enteros sobre el rojo, que es lo que hace la fila de
            filtros de cualquier bandeja. */}
        <View style={estilos.filtros}>
          <Chip
            activo={filtro === 'todos'}
            cuenta={filas.length}
            alPulsar={() => setFiltro('todos')}
          >
            Todos
          </Chip>
          <Chip
            activo={filtro === 'sinLeer'}
            cuenta={sinLeer}
            alPulsar={() => setFiltro('sinLeer')}
          >
            Sin leer
          </Chip>
        </View>
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mensaje de Partimos: bienvenido a bordo"
          onPress={() => router.push('/(pasajero)/partimos')}
          style={({ pressed }) => [estilos.fila, pressed && estilos.pulsada]}
        >
          <View style={estilos.marcaCuadro}>
            <Marca tamano={20} tinta={color.rojo600} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={estilos.filaSuperior}>
              <Text style={estilos.nombre} numberOfLines={1}>
                Partimos
              </Text>
              <Text style={estilos.cuando}>ahora</Text>
            </View>
            <Text style={estilos.ultimo} numberOfLines={1}>
              Bienvenido a bordo. Las tres cosas que puedes hacer desde ya.
            </Text>
            <View style={estilos.filaContexto}>
              <Text style={estilos.contexto} numberOfLines={1}>
                Un mensaje nuestro · aquí no contestamos
              </Text>
            </View>
          </View>
        </Pressable>

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

        <Text style={estilos.pieTexto}>
          Puedes preguntar antes de pedir puesto: preguntar no ocupa nada. Los chats se cierran
          48 h después de la llegada, y todo lo que se acuerde aquí queda por escrito.
        </Text>
      </View>
      </ScrollView>

      <Pestanas valor="Mensajes" yo={yo} />
    </View>
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

  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 4, paddingBottom: 18 },
  filaSuperiorCampo: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  epigrafeCampo: {
    fontSize: 12.5,
    lineHeight: 17.4,
    fontWeight: '600',
    letterSpacing: 12 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.campoTexto,
    fontFamily: familia,
  },
  titular: { fontSize: 22, lineHeight: 26, letterSpacing: -0.77, fontWeight: '600', color: color.ink900, fontFamily: familia, marginTop: 12, },

  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    marginTop: 16,
    paddingHorizontal: 15,
    borderRadius: radio.pastilla,
    backgroundColor: color.blanco,
    shadowColor: '#8F1024',
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
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

  filtros: { flexDirection: 'row', gap: 8, marginTop: 14 },
  filtro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
    paddingHorizontal: 15,
    borderRadius: radio.pastilla,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
  },
  filtroActivo: { backgroundColor: color.azul500, borderColor: 'transparent' },
  filtroTexto: {
    fontSize: 13.5,
    lineHeight: 19.5,
    fontWeight: '600',
    color: color.ink700,
    fontFamily: familia,
  },
  filtroTextoActivo: { color: '#fff' },
  cuenta: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: radio.pastilla,
    backgroundColor: color.sand200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cuentaActiva: { backgroundColor: 'rgba(255,255,255,.24)' },
  cuentaTexto: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '700',
    color: color.ink700,
    fontFamily: familia,
    ...tabular,
  },
  cuentaTextoActiva: { color: '#fff' },

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
    color: color.ink500,
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
  botonVacio: {
    height: 46,
    marginTop: 6,
    borderRadius: radio.pastilla,
    backgroundColor: color.rojo500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonVacioTexto: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: '#fff',
    fontFamily: familia,
  },

  pieTexto: {
    fontSize: 12.5,
    lineHeight: 19,
    color: color.ink600,
    marginTop: 8,
    fontFamily: familia,
  },
});
