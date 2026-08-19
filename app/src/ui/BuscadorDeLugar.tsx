/**
 * La hoja de buscar un sitio — la que abre «Desde» y «Hacia» en `3a`.
 *
 * **Por qué una hoja y no un desplegable.** Una lista colgando de un campo
 * queda debajo del teclado y no se ve. De paso mata un fallo del sitio: la
 * lista de sugerencias no puede tapar el botón «Buscar», porque no comparten
 * espacio.
 *
 * **Y por qué a pantalla completa en el teléfono.** Como cajón de abajo no
 * funcionaba: el teclado ocupa media pantalla, la barra de autorelleno de
 * Safari otro trozo, y quedaba UN resultado visible con el campo pegado al
 * borde. Medido en un iPhone. Buscar un sitio es una tarea entera, no un
 * apéndice de la pantalla anterior, así que en el teléfono ocupa la pantalla
 * entera —el campo arriba, la lista debajo, todo el alto para los
 * resultados—, que es lo que hace cualquier app de mapas. En una ventana
 * ancha sigue siendo un cajón, porque ahí sí sobra sitio.
 *
 * Las reglas de disparo, que son de producto y no de gusto:
 *
 *   · **3 caracteres** antes de tocar la red. Por debajo, todo casa.
 *   · **300 ms** de espera desde la última tecla. Una consulta por pausa,
 *     jamás una por tecla.
 *   · **Se cancela** la anterior en cada tecla. Una respuesta vieja que
 *     llega después de una nueva pisaría la buena.
 *   · **El catálogo local filtra desde la primera letra**, sin red y sin
 *     tildes: la pantalla nunca está vacía mientras la red contesta.
 *   · **Lo que escribiste siempre se puede elegir**, aunque ninguna base lo
 *     conozca. «Frente a la casa amarilla» es una cita panameña de verdad.
 */

import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import { type Lugar, libre, normalizar } from '@/dominio/lugar';
import { HAY_BUSQUEDA, type Punto, buscarEnTodas, situar } from '@/servicios/geobusqueda';
import {
  MINIMO_PARA_BUSCAR,
  ciudadesConocidas,
  ciudadesQueCasan,
  olvidarSesion,
} from '@/servicios/lugares';

import { Cerrar, Lupa, Pin } from './iconos';
import { TRACK_MICRO, color, espacio, familia, interlinea, radio } from './tokens';

/** Lo que se espera desde la última tecla antes de preguntar. */
const ESPERA_MS = 300;

type Props = {
  abierto: boolean;
  /** «Desde» o «Hacia»: la hoja dice cuál de los dos está cambiando. */
  titulo: string;
  /** Lo que se enseña con el campo en blanco: las rutas que ya existen. */
  sugerencias?: Lugar[];
  /** Desde dónde se busca: desempata dos «Super 99» y ordena por cercanía. */
  cerca?: Punto | null;
  alElegir: (lugar: Lugar) => void;
  alCerrar: () => void;
};

/** Por debajo de esto la búsqueda toma la pantalla entera. */
const ANCHO_DE_ESCRITORIO = 480;

export function BuscadorDeLugar({
  abierto,
  titulo,
  sugerencias = [],
  cerca,
  alElegir,
  alCerrar,
}: Props) {
  const { width } = useWindowDimensions();
  const enElTelefono = width < ANCHO_DE_ESCRITORIO;
  const [texto, setTexto] = useState('');
  const [lista, setLista] = useState<Lugar[]>([]);
  const [buscando, setBuscando] = useState(false);
  const corte = useRef<AbortController | null>(null);

  /* Al cerrar se olvida todo, y también la sesión de Mapbox: es lo que hace
     que escribir diez letras y elegir una vez cueste una sesión y no diez. */
  useEffect(() => {
    if (abierto) return;
    setTexto('');
    setLista([]);
    setBuscando(false);
    corte.current?.abort();
    olvidarSesion();
  }, [abierto]);

  useEffect(() => {
    corte.current?.abort();
    const q = texto.trim();
    if (q.length < MINIMO_PARA_BUSCAR) {
      setLista([]);
      setBuscando(false);
      return;
    }
    const mio = new AbortController();
    corte.current = mio;
    setBuscando(true);
    const espera = setTimeout(() => {
      buscarEnTodas(q, cerca ?? undefined, mio.signal).then(
        (r) => {
          if (mio.signal.aborted) return;
          setLista(r);
          setBuscando(false);
        },
        () => {
          if (!mio.signal.aborted) setBuscando(false);
        },
      );
    }, ESPERA_MS);
    return () => {
      clearTimeout(espera);
      mio.abort();
    };
  }, [texto, cerca]);

  const q = texto.trim();
  const enBlanco = q.length === 0;

  /**
   * LO NUESTRO SIEMPRE, LA RED ENCIMA.
   *
   * Las 32 ciudades responden desde la primera letra, sin red y sin jeton, así
   * que la pantalla nunca está vacía esperando —y sobre todo, escribir una
   * ciudad SIEMPRE la encuentra, haya proveedores configurados o no. Debajo se
   * añade lo que las cuatro fuentes traigan y nosotros no tengamos.
   *
   * Antes esto filtraba solo las sugerencias que la pantalla pasaba, que en
   * «Desde» era una sola ciudad: escribir cualquier otra no devolvía nada.
   */
  const loQueSeEnseña = (() => {
    if (enBlanco) return sugerencias;
    const nuestras = ciudadesQueCasan(q);
    const yaEstan = new Set(nuestras.map((c) => normalizar(c.nombre)));
    return [...nuestras, ...lista.filter((l) => !yaEstan.has(normalizar(l.nombre)))].slice(0, 8);
  })();

  const elegir = async (lugar: Lugar) => {
    /* Una sugerencia de Mapbox llega sin punto: se concreta al elegir, que es
       la única llamada que se paga de la sesión. */
    alElegir(await situar(lugar));
  };

  return (
    <Modal visible={abierto} animationType="slide" transparent onRequestClose={alCerrar}>
      {/* El velo solo existe donde hay algo detrás que ver. */}
      {enElTelefono ? null : (
        <Pressable accessibilityLabel="Cerrar" onPress={alCerrar} style={estilos.velo} />
      )}

      <View
        style={[
          estilos.hoja,
          enElTelefono ? estilos.aPantallaCompleta : estilos.comoCajon,
        ]}
      >
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
          {buscando ? <ActivityIndicator size="small" color={color.ink400} /> : null}
        </View>

        <ScrollView
          style={estilos.lista}
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {loQueSeEnseña.map((d, i) => (
            <Pressable
              key={`${d.nombre}-${d.fuente}-${i}`}
              accessibilityRole="button"
              accessibilityLabel={`${d.nombre}${d.contexto ? `, ${d.contexto}` : ''}`}
              onPress={() => elegir(d)}
              style={({ pressed }) => [estilos.fila, pressed && { backgroundColor: color.sand200 }]}
            >
              <View style={estilos.icono}>
                <Pin tamano={15} tinta={d.citySlug ? color.azul500 : color.ink400} />
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
              {d.tipo === 'ciudad' ? <Text style={estilos.vamos}>vamos ahí</Text> : null}
            </Pressable>
          ))}

          {/* LO QUE ESCRIBISTE, SIEMPRE ELEGIBLE. Va al final: primero lo que
              alguna base conoce, y debajo tu propia palabra, que es un punto
              de encuentro tan válido como cualquier otro. */}
          {!enBlanco && !loQueSeEnseña.some((d) => normalizar(d.nombre) === normalizar(q)) ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Usar «${q}» tal cual`}
              onPress={() => alElegir(libre(ciudadesConocidas(), q, null))}
              style={({ pressed }) => [estilos.fila, pressed && { backgroundColor: color.sand200 }]}
            >
              <View style={estilos.icono}>
                <Pin tamano={15} tinta={color.ink400} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={estilos.nombre} numberOfLines={1}>
                  {q}
                </Text>
                <Text style={estilos.contexto}>Usarlo tal cual</Text>
              </View>
            </Pressable>
          ) : null}

          {!enBlanco && !buscando && loQueSeEnseña.length === 0 && !HAY_BUSQUEDA ? (
            <Text style={estilos.nada}>
              Por ahora solo buscamos entre las ciudades que servimos. Puedes escribir tu punto y
              usarlo tal cual.
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
    width: '100%',
    maxWidth: espacio.marco,
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
    /* 16 y no 15: por debajo de 16 px, Safari en el iPhone acerca la página
       al enfocar el campo, y al salir no la devuelve. Es el «zoom» que se
       veía al tocar para escribir un lugar. */
    fontSize: 16,
    color: color.ink900,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as never } : null),
  },

  /* A pantalla completa: sin esquinas redondeadas arriba —no hay nada detrás
     de lo que despegarse— y todo el alto para los resultados. */
  aPantallaCompleta: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingTop: 14,
  },

  /* El tope solo en la ventana ancha, donde es un cajón sobre la página.
     Ponerlo en la base y anularlo con `undefined` no lo anulaba: el estilo
     seguía valiendo 560, y por debajo del cajón se veía la pantalla anterior. */
  comoCajon: { maxHeight: 560 },

  lista: { flex: 1, marginTop: 10 },
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
