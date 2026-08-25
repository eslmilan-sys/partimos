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
 * FIJA, una hoja blanca (radio 24, como toda hoja) con el título en dos
 * tintas, la copia, los puntos de progreso, el CTA rojo y las dos salidas
 * calladas. Solo la foto se mueve; el texto cambia con ella sin arrastrarse
 * a medias por la pantalla.
 *
 * Las tres fotografías las eligió el dueño (25-08): la bahía de Panamá al
 * atardecer, la ciudad desde el agua, y la gente dándose la mano en el
 * carro. La tercera es imagen de banco — a licenciar antes de cualquier
 * lanzamiento, como la de «¿Vas a manejar?».
 *
 * `useWindowDimensions` responde CERO durante el prerender del export
 * estático (se vio en un iPhone el 24-08): el ancho se MIDE con `onLayout`
 * y hasta conocerlo no se dibuja el deslizador.
 */

import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Boton } from '@/ui/controles';
import { Marca } from '@/ui/iconos';
import { color, espacio, familia, radio, sombra, zonaDeToque } from '@/ui/tokens';

const LAMINAS = [
  {
    clave: 'beneficio',
    foto: require('../../assets/apertura-bahia.jpg'),
    titulo: 'Muévete mejor,',
    tituloFuerte: 'viajando juntos',
    copia: 'Comparte el carro con gente que va a tu mismo destino y divide la gasolina.',
  },
  {
    clave: 'encontrar',
    foto: require('../../assets/apertura-skyline.jpg'),
    titulo: 'Encuentra un viaje',
    tituloFuerte: 'que encaje contigo',
    copia: 'Busca por ruta y hora, compara aportes y reserva tu puesto en segundos.',
  },
  {
    clave: 'confianza',
    foto: require('../../assets/apertura-carro.png'),
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
      {/* La fotografía, a pantalla completa, deslizante. */}
      {ancho > 0 ? (
        <ScrollView
          ref={tira}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={ancho}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={(e) => {
            const cual = Math.round(e.nativeEvent.contentOffset.x / ancho);
            if (cual !== enCual && cual >= 0 && cual < LAMINAS.length) setEnCual(cual);
          }}
          style={StyleSheet.absoluteFill}
        >
          {LAMINAS.map((l) => (
            <Image
              key={l.clave}
              source={l.foto}
              style={{ width: ancho, height: '100%' }}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
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
        colors={['rgba(10,39,49,0)', 'rgba(10,39,49,.35)']}
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
          style={[zonaDeToque, estilos.saltarZona]}
        >
          <Text style={estilos.saltar}>Saltar</Text>
        </Pressable>
      </View>

      {/* La hoja fija de abajo: el texto de la lámina en curso, los puntos,
          el CTA y las salidas. Solo la foto desliza. */}
      <View style={estilos.hoja}>
        <View style={estilos.puntos}>
          {LAMINAS.map((l, i) => (
            <View key={l.clave} style={[estilos.punto, i === enCual && estilos.puntoActivo]} />
          ))}
        </View>

        <Text style={estilos.titulo}>
          {lamina.titulo}
          {'\n'}
          <Text style={estilos.tituloFuerte}>{lamina.tituloFuerte}</Text>
        </Text>
        <Text style={estilos.copia}>{lamina.copia}</Text>

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
  veloAbajo: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 220 },

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
  saltarZona: { paddingHorizontal: 6 },
  saltar: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,.92)',
    fontFamily: familia,
  },

  /** La hoja de abajo: blanca, radio 24, con la sombra alta del sistema. */
  hoja: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: color.blanco,
    borderRadius: radio.hoja,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    ...sombra.l,
  },

  puntos: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  punto: { width: 6, height: 6, borderRadius: 3, backgroundColor: color.ink200 },
  puntoActivo: { width: 20, backgroundColor: color.rojo500 },

  /** El título en dos tintas, como el Inicio: la primera línea apagada. */
  titulo: {
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.75,
    color: color.ink400,
    fontFamily: familia,
  },
  tituloFuerte: { color: color.ink900 },
  copia: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: color.ink500,
    fontFamily: familia,
  },

  salidas: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  salida: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: color.rojo700,
    fontFamily: familia,
  },
  salidaSeparador: { color: color.ink300, fontSize: 13 },
});
