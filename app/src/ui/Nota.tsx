/**
 * La nota — lo que la app dice cuando algo salió bien y no hay pantalla nueva
 * que enseñar.
 *
 * **Por qué hace falta.** Compartir, copiar, guardar un ajuste, marcar todo
 * como leído: acciones que cambian algo de verdad y no cambian nada en la
 * pantalla. Sin respuesta, quien la pulsa la vuelve a pulsar, y la segunda vez
 * ya no sabe si funcionó ninguna de las dos.
 *
 * **Vive en la raíz, no en cada pantalla.** Se pinta encima de todo, incluida
 * la barra de abajo, y cualquier trozo de la app puede pedirla con `useDecir`
 * sin pasarse la función de padre a hijo. Compartir se pulsa desde dentro de
 * una tarjeta que está tres niveles por debajo de la pantalla; con `props` eso
 * son tres funciones que mantener.
 *
 * **Se va sola.** Dos segundos y medio: lo que se tarda en leer seis palabras
 * con margen. No lleva botón de cerrar porque no bloquea nada, y no lleva
 * icono de color porque no es un error — los errores viven en `Aviso`, con su
 * icono y su rótulo, como manda el sistema.
 */

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { espacio, familia, radio } from './tokens';

/** Cuánto se queda. */
const DURA = 2500;

const Contexto = createContext<(texto: string | null) => void>(() => {});

/**
 * Pide que se diga algo. Un `null` no dice nada, para poder escribir
 * `decir(DIJO[resultado])` sin comprobar antes.
 */
export function useDecir() {
  return useContext(Contexto);
}

export function NotaProvider({ children }: { children: ReactNode }) {
  const [nota, setNota] = useState<string | null>(null);
  const reloj = useRef<ReturnType<typeof setTimeout> | null>(null);

  const decir = useCallback((texto: string | null) => {
    if (!texto) return;
    if (reloj.current) clearTimeout(reloj.current);
    setNota(texto);
    reloj.current = setTimeout(() => setNota(null), DURA);
  }, []);

  useEffect(() => () => { if (reloj.current) clearTimeout(reloj.current); }, []);

  return (
    <Contexto.Provider value={decir}>
      {children}
      <Nota>{nota}</Nota>
    </Contexto.Provider>
  );
}

function Nota({ children }: { children: string | null }) {
  const entra = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entra, {
      toValue: children ? 1 : 0,
      duration: children ? 220 : 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [children, entra]);

  if (!children) return null;

  return (
    <View style={estilos.capa} pointerEvents="none">
      <Animated.View
        accessibilityRole="alert"
        style={[
          estilos.nota,
          {
            opacity: entra,
            transform: [
              { translateY: entra.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
            ],
          },
        ]}
      >
        <Text style={estilos.texto}>{children}</Text>
      </Animated.View>
    </View>
  );
}

const estilos = StyleSheet.create({
  capa: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 108,
  },
  nota: {
    maxWidth: espacio.marco - espacio.gutter * 2,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: radio.l,
    backgroundColor: 'rgba(0,39,65,.96)',
    shadowColor: '#001A2B',
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  texto: {
    fontSize: 14,
    lineHeight: 20.3,
    fontWeight: '500',
    color: '#fff',
    textAlign: 'center',
    fontFamily: familia,
  },
});
