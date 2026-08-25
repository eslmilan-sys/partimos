/**
 * Apertura — el onboarding de tres láminas, a FOTOGRAFÍA COMPLETA.
 *
 * Rediseñada el 25-08-2026, con carta blanca del dueño. La versión
 * anterior enseñaba una «prueba de interfaz» — dos filas de viaje de
 * mentira y un botón «Reservar puesto» que parecía de verdad — y el dueño
 * la señaló: una maqueta que parece real es una trampa para quien prueba.
 *
 * La estructura nueva es la del patrón que él mismo trajo de ejemplo,
 * traducida al v6: la fotografía ocupa TODA la pantalla y desliza; abajo,
 * FIJO, el texto de la lámina EN BLANCO SOBRE LA FOTO, asentado por un velo
 * de tinta profundo — la hoja blanca de la primera versión se fue el mismo
 * 25-08 («make the white background transparent»), y con ella el radio que
 * cortaba raro contra el borde. Solo la foto se mueve; el texto cambia con
 * ella sin arrastrarse a medias por la pantalla.
 *
 * Las tres fotografías las trajo el dueño en alta resolución (25-08): la
 * calzada sobre el mar turquesa desde el aire — el agua hace juego con la
 * tinta sarcelle de la marca —, la autopista entre el verde, y dos amigos
 * en el carro. Son imágenes de banco — a licenciar antes de cualquier
 * lanzamiento, como la de «¿Vas a manejar?».
 *
 * `useWindowDimensions` responde CERO durante el prerender del export
 * estático (se vio en un iPhone el 24-08): el ancho se MIDE con `onLayout`
 * y hasta conocerlo no se dibuja el deslizador.
 */

import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Boton } from '@/ui/controles';
import { Marca } from '@/ui/iconos';
import { color, espacio, familia, zonaDeToque } from '@/ui/tokens';

const LAMINAS = [
  {
    clave: 'beneficio',
    foto: require('../../assets/apertura-costa.jpg'),
    ceja: 'Compartir gastos',
    titulo: 'Muévete mejor,',
    tituloFuerte: 'viajando juntos',
    copia: 'Comparte el carro con gente que va a tu mismo destino y divide la gasolina.',
  },
  {
    clave: 'encontrar',
    foto: require('../../assets/apertura-carretera.jpg'),
    ceja: 'Buscar y reservar',
    titulo: 'Encuentra un viaje',
    tituloFuerte: 'que encaje contigo',
    copia: 'Busca por ruta y hora, compara aportes y reserva tu puesto en segundos.',
  },
  {
    clave: 'confianza',
    foto: require('../../assets/apertura-carro.jpg'),
    ceja: 'Cédula verificada',
    titulo: 'Comparte el camino',
    tituloFuerte: 'con confianza',
    copia: 'Cédula verificada, reseñas reales y chat dentro de la app.',
  },
] as const;

export default function Apertura() {
  const router = useRouter();
  const [ancho, setAncho] = useState(0);
  const [enCual, setEnCual] = useState(0);
  const tira = useRef<ScrollView>(null);

  /**
   * TRES MOVIMIENTOS, todos con la Animated de siempre (nada nuevo que
   * cargar): la fotografía va a MEDIO paso del dedo — parallaxe — para que
   * el deslizamiento tenga profundidad; respira un zoom lentísimo de nueve
   * segundos — una foto quieta parece un póster, una que respira parece un
   * lugar —; y el texto de la hoja entra con un suspiro (260 ms, 8 px)
   * cuando cambia la lámina, en vez de dar un golpe seco.
   */
  const scrollX = useRef(new Animated.Value(0)).current;
  const respiracion = useRef(new Animated.Value(0)).current;
  const suspiro = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(respiracion, { toValue: 1, duration: 9000, useNativeDriver: false }),
        Animated.timing(respiracion, { toValue: 0, duration: 9000, useNativeDriver: false }),
      ]),
    ).start();
  }, [respiracion]);

  useEffect(() => {
    suspiro.setValue(0);
    Animated.timing(suspiro, { toValue: 1, duration: 260, useNativeDriver: false }).start();
  }, [enCual, suspiro]);

  /* «Ya la vi» se escribe cuando la apertura de verdad se montó — la llave
     que lee `app/index.tsx` para no repetir el paseo en la misma sesión. */
  useEffect(() => {
    try {
      globalThis.sessionStorage?.setItem('partimos.apertura.vista', '1');
    } catch {
      /* sin almacén, se verá dos veces: no rompe nada */
    }
  }, []);

  const ultima = enCual === LAMINAS.length - 1;

  const avanzar = () => {
    if (ultima) {
      router.push('/(cuenta)/registro');
      return;
    }
    tira.current?.scrollTo({ x: (enCual + 1) * ancho, animated: true });
  };

  const lamina = LAMINAS[enCual];

  return (
    <View
      style={estilos.pantalla}
      onLayout={(e) => setAncho(Math.min(e.nativeEvent.layout.width, espacio.marco))}
    >
      {/* La fotografía, a pantalla completa, deslizante — con parallaxe. */}
      {ancho > 0 ? (
        <Animated.ScrollView
          ref={tira}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={ancho}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: false,
            listener: (e: { nativeEvent: { contentOffset: { x: number } } }) => {
              const cual = Math.round(e.nativeEvent.contentOffset.x / ancho);
              if (cual !== enCual && cual >= 0 && cual < LAMINAS.length) setEnCual(cual);
            },
          })}
          style={StyleSheet.absoluteFill}
        >
          {LAMINAS.map((l, i) => (
            <View key={l.clave} style={{ width: ancho, height: '100%', overflow: 'hidden' }}>
              <Animated.Image
                source={l.foto}
                resizeMode="cover"
                style={{
                  /* Un cuarto más ancha que su marco: es el margen que la
                     parallaxe gasta sin enseñar nunca un borde. */
                  width: ancho * 1.3,
                  height: '100%',
                  marginLeft: -ancho * 0.15,
                  transform: [
                    {
                      translateX: scrollX.interpolate({
                        inputRange: [(i - 1) * ancho, i * ancho, (i + 1) * ancho],
                        outputRange: [ancho * 0.14, 0, -ancho * 0.14],
                        extrapolate: 'clamp',
                      }),
                    },
                    {
                      scale: respiracion.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.06],
                      }),
                    },
                  ],
                }}
              />
            </View>
          ))}
        </Animated.ScrollView>
      ) : null}

      {/* Los dos velos de tinta: uno arriba para que la marca se lea sobre
          cualquier cielo, otro abajo para asentar la hoja. La tinta es la
          del sistema, no un negro cualquiera. */}
      <LinearGradient
        colors={['rgba(10,39,49,.45)', 'rgba(10,39,49,0)']}
        style={estilos.veloArriba}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(10,39,49,0)', 'rgba(10,39,49,.28)', 'rgba(10,39,49,.72)', 'rgba(10,39,49,.97)']}
        locations={[0, 0.3, 0.62, 1]}
        style={estilos.veloAbajo}
        pointerEvents="none"
      />

      <BarraDeEstado tono="claro" />

      {/* La marca y la salida de quien ya conoce esto, en blanco sobre el velo. */}
      <View style={estilos.filaMarca}>
        <View style={estilos.marca}>
          <Marca tamano={21} tinta="#fff" />
          <Text style={estilos.marcaTexto}>partimos</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Saltar la presentación"
          onPress={() => router.replace('/(pasajero)')}
          style={estilos.saltarZona}
        >
          <Text style={estilos.saltar}>Saltar</Text>
        </Pressable>
      </View>

      {/* El pie fijo: los puntos, el texto de la lámina en curso, el CTA y
          las salidas — en blanco, directamente sobre el velo. */}
      <View style={estilos.pie}>
        <View style={estilos.puntos}>
          {LAMINAS.map((l, i) => (
            <View key={l.clave} style={[estilos.punto, i === enCual && estilos.puntoActivo]} />
          ))}
        </View>

        <Animated.View
          style={{
            opacity: suspiro,
            transform: [
              { translateY: suspiro.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
            ],
          }}
        >
          <Text style={estilos.ceja}>{lamina.ceja}</Text>
          <Text style={estilos.titulo}>
            {lamina.titulo}
            {'\n'}
            <Text style={estilos.tituloFuerte}>{lamina.tituloFuerte}</Text>
          </Text>
          <Text style={estilos.copia}>{lamina.copia}</Text>
        </Animated.View>

        <View style={{ marginTop: 18 }}>
          <Boton alPulsar={avanzar}>{ultima ? 'Crear cuenta' : 'Continuar'}</Boton>
        </View>

        <View style={estilos.salidas}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(cuenta)/entrar')}
            style={zonaDeToque}
          >
            <Text style={estilos.salida}>Ya tengo cuenta</Text>
          </Pressable>
          <Text style={estilos.salidaSeparador}>·</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/(pasajero)')}
            style={zonaDeToque}
          >
            <Text style={estilos.salida}>Mirar los viajes</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  /** Tinta detrás de todo: si una foto tarda, el hueco es del sistema. */
  pantalla: {
    flex: 1,
    backgroundColor: color.ink900,
    maxWidth: espacio.marco,
    width: '100%',
    alignSelf: 'center',
    overflow: 'hidden',
  },

  veloArriba: { position: 'absolute', top: 0, left: 0, right: 0, height: 130 },
  veloAbajo: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 430 },

  filaMarca: {
    paddingTop: 10,
    paddingLeft: espacio.gutter,
    paddingRight: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  marca: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  marcaTexto: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: -0.67,
    color: color.blanco,
    fontFamily: familia,
  },
  /** Una pastilla de tinta helada: sobre foto, un texto suelto se pierde. */
  saltarZona: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(10,39,49,.34)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saltar: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,.95)',
    fontFamily: familia,
  },

  /** El pie: sin carta, sin radio — el velo de tinta ES el fondo. */
  pie: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: espacio.gutter,
    paddingBottom: 20,
  },

  puntos: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  punto: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,.38)' },
  /** El punto activo es blanco: el rojo se guarda para el único CTA. */
  puntoActivo: { width: 20, backgroundColor: color.blanco },

  /** La ceja editorial: pequeña, en versales, con su tracking de rótulo. */
  ceja: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,.72)',
    marginBottom: 7,
    fontFamily: familia,
    textShadowColor: 'rgba(10,39,49,.4)',
    textShadowRadius: 8,
  },
  /** El título en dos tintas sobre foto: la primera línea velada, la
      segunda en blanco pleno. Más grande que sobre carta: aquí respira. */
  titulo: {
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.87,
    color: 'rgba(255,255,255,.72)',
    fontFamily: familia,
    textShadowColor: 'rgba(10,39,49,.4)',
    textShadowRadius: 12,
  },
  tituloFuerte: { color: color.blanco },
  copia: {
    marginTop: 9,
    fontSize: 14.5,
    lineHeight: 21,
    color: 'rgba(255,255,255,.85)',
    maxWidth: 320,
    fontFamily: familia,
    textShadowColor: 'rgba(10,39,49,.4)',
    textShadowRadius: 8,
  },

  salidas: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  salida: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,.92)',
    fontFamily: familia,
  },
  salidaSeparador: { color: 'rgba(255,255,255,.45)', fontSize: 13 },
});
