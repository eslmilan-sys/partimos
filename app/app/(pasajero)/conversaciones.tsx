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

import { type HiloDelViaje, hiloDelViaje } from '@/servicios/mensajes';
import { type PuestoMio, misViajes } from '@/servicios/panel';
import { useMiIdOEntrar } from '@/servicios/sesion';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { CampoRojo } from '@/ui/CampoRojo';
import { Pestanas } from '@/ui/Pestanas';
import { Avatar } from '@/ui/controles';
import { tabular } from '@/ui/dinero';
import { diaAbrev, esHoy, hora } from '@/ui/fechas';
import { Atras, Lupa, Marca, Visto } from '@/ui/iconos';
import { TRACK_MICRO, familia, color, espacio, radio } from '@/ui/tokens';

/** Sin sesión que preguntar —solo en simulado—, la pasajera del traspaso. */
const YO_DEL_RECORRIDO = '99999999-9999-4999-8999-999999999999';

type Fila = { puesto: PuestoMio; hilo: HiloDelViaje };
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
      const hilos = await Promise.all(
        todos.map(async (puesto) => ({ puesto, hilo: await hiloDelViaje(puesto.reservaId, yo) })),
      );
      setFilas(hilos.filter((f) => f.hilo.mensajes.length > 0));
    })();
  }, [yo]);

  const sinLeerDe = (f: Fila) => !f.hilo.mensajes[f.hilo.mensajes.length - 1]?.mio;

  const visibles = useMemo(() => {
    if (!filas) return [];
    const q = busca.trim().toLowerCase();
    return filas
      .filter((f) => (filtro === 'sinLeer' ? sinLeerDe(f) : true))
      .filter(
        (f) =>
          q === '' ||
          f.hilo.otro.nombre.toLowerCase().includes(q) ||
          f.puesto.destino.toLowerCase().includes(q),
      );
  }, [filas, busca, filtro]);

  if (!filas) return <Cargando altura={206} tarjetas={4} />;

  const sinLeer = filas.filter(sinLeerDe).length;

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={214} motivo="hibisco" />
      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <View style={estilos.filaSuperiorCampo}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atrás"
            onPress={() => router.back()}
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
          <Lupa tamano={18} tinta={color.ink500} />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar por nombre o destino"
            placeholderTextColor={color.ink500}
            accessibilityLabel="Buscar una conversación"
            style={estilos.entrada}
          />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={estilos.cuerpo}
        showsVerticalScrollIndicator={false}
      >
        {/* Los dos filtros con su cuenta: cuántos hay antes de tocarlos. */}
        <View style={estilos.filtros}>
          {(
            [
              ['todos', 'Todos', filas.length],
              ['sinLeer', 'Sin leer', sinLeer],
            ] as const
          ).map(([clave, etiqueta, cuantos]) => (
            <Pressable
              key={clave}
              accessibilityRole="tab"
              accessibilityState={{ selected: filtro === clave }}
              onPress={() => setFiltro(clave)}
              style={[estilos.filtro, filtro === clave && estilos.filtroActivo]}
            >
              <Text style={[estilos.filtroTexto, filtro === clave && estilos.filtroTextoActivo]}>
                {etiqueta}
              </Text>
              <View style={[estilos.cuenta, filtro === clave && estilos.cuentaActiva]}>
                <Text
                  style={[estilos.cuentaTexto, filtro === clave && estilos.cuentaTextoActiva]}
                >
                  {String(cuantos)}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* El hilo de Partimos va siempre y va primero: una bandeja vacía el
            primer día no dice nada, y quien acaba de entrar no sabe qué puede
            hacer. No se guarda en `messages` porque no es de nadie. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mensaje de Partimos: bienvenido a bordo"
          onPress={() => router.push('/(pasajero)/partimos')}
          style={({ pressed }) => [estilos.fila, pressed && estilos.pulsada]}
        >
          <View style={estilos.marcaCuadro}>
            <Marca tamano={22} tinta={color.rojo600} />
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
              <View style={estilos.pastillaSinLeer}>
                <Text style={estilos.pastillaSinLeerTexto}>1</Text>
              </View>
            </View>
          </View>
        </Pressable>

        {visibles.map(({ puesto, hilo }) => {
          const ultimo = hilo.mensajes[hilo.mensajes.length - 1];
          const nuevo = !ultimo?.mio;
          return (
            <Pressable
              key={puesto.reservaId}
              accessibilityRole="button"
              accessibilityLabel={`Conversación con ${hilo.otro.nombre}`}
              onPress={() =>
                router.push({ pathname: '/(pasajero)/chat', params: { reserva: puesto.reservaId } })
              }
              style={({ pressed }) => [estilos.fila, pressed && estilos.pulsada]}
            >
              <Avatar nombre={hilo.otro.nombre} tono="rojo" tamano={48} />

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
                  <Text style={estilos.contexto} numberOfLines={1}>
                    {`${puesto.destino} · ${cuandoLargo(puesto.cuando)}`}
                  </Text>
                  {nuevo ? (
                    <View style={estilos.pastillaSinLeer}>
                      <Text style={estilos.pastillaSinLeerTexto}>1</Text>
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
                : 'Los chats se abren cuando el conductor acepta tu puesto. Ahí se acuerda dónde te recoge, y queda por escrito.'}
            </Text>
            {busca.trim() === '' && filtro === 'todos' ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/(pasajero)')}
                style={({ pressed }) => [
                  estilos.botonVacio,
                  pressed && { backgroundColor: color.rojo600 },
                ]}
              >
                <Text style={estilos.botonVacioTexto}>Buscar un viaje</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <Text style={estilos.pieTexto}>
          Los chats se abren cuando el conductor acepta y se cierran 48 h después de la llegada.
          Todo lo del punto de recogida que se acuerde aquí queda por escrito.
        </Text>
      </ScrollView>

      <Pestanas valor="Mensajes" />
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

  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 4 },
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
    fontSize: 12,
    lineHeight: 17.4,
    fontWeight: '600',
    letterSpacing: 12 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.campoTexto,
    fontFamily: familia,
  },
  titular: {
    fontSize: 31,
    lineHeight: 32.86,
    letterSpacing: -1.395,
    fontWeight: '600',
    color: '#fff',
    marginTop: 12,
    fontFamily: familia,
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
    shadowColor: '#5E0717',
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  entrada: {
    flex: 1,
    fontFamily: familia,
    /* 16: por debajo de eso Safari acerca la página al enfocar el campo. */
    fontSize: 16,
    color: color.ink900,
    outlineStyle: 'none',
  } as never,

  cuerpo: { paddingHorizontal: espacio.gutter, paddingTop: 20, paddingBottom: 22, gap: 8 },

  filtros: { flexDirection: 'row', gap: 8, marginBottom: 4 },
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
    gap: 13,
    padding: 14,
    borderRadius: radio.l,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
  },
  pulsada: { backgroundColor: color.sand100, borderColor: color.bordePorDefecto },
  marcaCuadro: {
    width: 48,
    height: 48,
    borderRadius: radio.cuadrado,
    backgroundColor: color.rojo50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filaSuperior: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  nombre: {
    flex: 1,
    fontSize: 15.5,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.23,
    color: color.ink900,
    fontFamily: familia,
  },
  cuando: { fontSize: 12.5, lineHeight: 18, color: color.ink500, fontFamily: familia, ...tabular },

  filaUltimo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  ultimo: { flex: 1, fontSize: 14, lineHeight: 20, color: color.ink600, fontFamily: familia },
  ultimoNuevo: { color: color.ink900, fontWeight: '500' },

  filaContexto: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 5 },
  contexto: { flex: 1, fontSize: 12.5, lineHeight: 18, color: color.ink500, fontFamily: familia },
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
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600',
    letterSpacing: -0.24,
    color: color.ink900,
    fontFamily: familia,
  },
  vacioTexto: { fontSize: 13.5, lineHeight: 20, color: color.ink600, fontFamily: familia },
  botonVacio: {
    height: 46,
    marginTop: 6,
    borderRadius: radio.pastilla,
    backgroundColor: color.rojo500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonVacioTexto: {
    fontSize: 14.5,
    lineHeight: 21,
    fontWeight: '600',
    color: '#fff',
    fontFamily: familia,
  },

  pieTexto: {
    fontSize: 12.5,
    lineHeight: 19,
    color: color.ink500,
    marginTop: 8,
    fontFamily: familia,
  },
});
