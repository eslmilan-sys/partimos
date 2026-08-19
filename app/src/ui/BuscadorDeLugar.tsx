/**
 * La hoja de buscar un sitio — la que abre «Desde» y «Hacia» en `3a`.
 *
 * **Por qué una hoja y no un desplegable.** El teclado del teléfono se come
 * media pantalla; una lista colgando de un campo queda debajo del teclado y no
 * se ve. La hoja sube desde abajo, pone el campo arriba y la lista debajo, que
 * es donde queda sitio.
 *
 * **Lo nuestro arriba, Mapbox debajo.** `buscarDestino` ya devuelve la lista en
 * ese orden; aquí se marcan visualmente las ciudades que servimos, porque son
 * las únicas donde «Buscar viajes» va a encontrar algo. Un sitio de Mapbox se
 * puede elegir igualmente: sirve para decir dónde te recogen.
 *
 * Sin jeton de Mapbox la lista sale solo con nuestras ciudades, y la nota lo
 * dice en vez de dejar creer que no hay nada.
 */

import { useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { type Destino, buscarDestino, hayBusquedaDeLugares, olvidarSesion } from '@/servicios/lugares';

import { Cerrar, Lupa, Pin } from './iconos';
import { TRACK_MICRO, color, espacio, familia, interlinea, radio } from './tokens';

/** Lo que se espera desde la última tecla antes de preguntar. */
const ESPERA_MS = 220;

type Props = {
  abierto: boolean;
  /** «Desde» o «Hacia»: la hoja dice cuál de los dos está cambiando. */
  titulo: string;
  /** Lo que se enseña con el campo en blanco: las rutas que ya existen. */
  sugerencias?: Destino[];
  alElegir: (destino: Destino) => void;
  alCerrar: () => void;
};

export function BuscadorDeLugar({ abierto, titulo, sugerencias = [], alElegir, alCerrar }: Props) {
  const [texto, setTexto] = useState('');
  const [lista, setLista] = useState<Destino[]>([]);
  const [buscando, setBuscando] = useState(false);
  const corte = useRef<AbortController | null>(null);

  // Al cerrar se olvida todo: la próxima búsqueda empieza en blanco, y la
  // sesión de Mapbox también —es lo que hace que se facture una y no diez.
  useEffect(() => {
    if (abierto) return;
    setTexto('');
    setLista([]);
    olvidarSesion();
  }, [abierto]);

  useEffect(() => {
    corte.current?.abort();
    if (texto.trim().length === 0) {
      setLista([]);
      setBuscando(false);
      return;
    }
    const mio = new AbortController();
    corte.current = mio;
    setBuscando(true);
    const espera = setTimeout(() => {
      buscarDestino(texto, mio.signal).then((r) => {
        if (mio.signal.aborted) return;
        setLista(r);
        setBuscando(false);
      });
    }, ESPERA_MS);
    return () => {
      clearTimeout(espera);
      mio.abort();
    };
  }, [texto]);

  const enBlanco = texto.trim().length === 0;
  const loQueSeEnseña = enBlanco ? sugerencias : lista;

  return (
    <Modal visible={abierto} animationType="slide" transparent onRequestClose={alCerrar}>
      <Pressable accessibilityLabel="Cerrar" onPress={alCerrar} style={estilos.velo} />

      <View style={estilos.hoja}>
        <View style={estilos.cabecera}>
          <Text style={estilos.epigrafe}>{titulo}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            onPress={alCerrar}
            style={estilos.cerrar}
          >
            <Cerrar tamano={12} tinta={color.ink600} />
          </Pressable>
        </View>

        <View style={estilos.campo}>
          <Lupa tamano={18} tinta={color.ink500} />
          <TextInput
            accessibilityLabel={titulo}
            value={texto}
            onChangeText={setTexto}
            placeholder="Escribe una ciudad o un sitio"
            placeholderTextColor={color.ink400}
            autoFocus
            style={estilos.entrada}
          />
        </View>

        <ScrollView style={estilos.lista} keyboardShouldPersistTaps="handled">
          {loQueSeEnseña.map((d, i) => (
            <Pressable
              key={`${d.nombre}-${i}`}
              accessibilityRole="button"
              accessibilityLabel={`${d.nombre}${d.contexto ? `, ${d.contexto}` : ''}`}
              onPress={() => alElegir(d)}
              style={({ pressed }) => [estilos.fila, pressed && { backgroundColor: color.sand200 }]}
            >
              <View style={estilos.icono}>
                <Pin tamano={15} tinta={d.ciudad ? color.azul500 : color.ink400} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={estilos.nombre} numberOfLines={1}>
                  {d.nombre}
                </Text>
                {d.contexto ? (
                  <Text style={estilos.contexto} numberOfLines={1}>
                    {d.contexto}
                  </Text>
                ) : null}
              </View>
              {d.ciudad ? <Text style={estilos.vamos}>vamos ahí</Text> : null}
            </Pressable>
          ))}

          {!enBlanco && !buscando && loQueSeEnseña.length === 0 ? (
            <Text style={estilos.nada}>
              {hayBusquedaDeLugares
                ? 'No encontramos ese sitio. Prueba con el nombre de la ciudad.'
                : 'Por ahora solo buscamos entre las ciudades que servimos.'}
            </Text>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  velo: { flex: 1, backgroundColor: 'rgba(26,20,32,.34)' },
  hoja: {
    backgroundColor: color.sand100,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: espacio.gutter,
    paddingTop: 16,
    paddingBottom: 22,
    maxHeight: 560,
    width: '100%',
    maxWidth: 390,
    alignSelf: 'center',
  },

  cabecera: { flexDirection: 'row', alignItems: 'center' },
  epigrafe: {
    flex: 1,
    fontFamily: familia,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.ink500,
  },
  cerrar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.sand200,
  },

  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 52,
    marginTop: 12,
    paddingHorizontal: 14,
    borderRadius: radio.control,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
  },
  entrada: {
    flex: 1,
    fontFamily: familia,
    fontSize: 15,
    color: color.ink900,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as never } : null),
  },

  lista: { marginTop: 10 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 12 },
  icono: { width: 22, alignItems: 'center' },
  nombre: { fontFamily: familia, fontSize: 15, color: color.ink900 },
  contexto: {
    fontFamily: familia,
    fontSize: 12,
    lineHeight: interlinea(12),
    color: color.ink500,
    marginTop: 1,
  },
  vamos: {
    fontFamily: familia,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.azul700,
  },
  nada: {
    fontFamily: familia,
    fontSize: 13,
    lineHeight: interlinea(13),
    color: color.ink500,
    paddingVertical: 16,
  },
});
