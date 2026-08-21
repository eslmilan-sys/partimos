/**
 * Apertura — el onboarding de tres láminas del canevas (11b · 11c · 11d),
 * vestido con el Sistema v6.
 *
 * Lo que pidió el usuario, literal: al abrir la app, **un deslizador de tres
 * láminas con el botón debajo**. Cada lámina es la del archivo: el beneficio,
 * encontrar, la confianza. Debajo, fijos, los puntos y el botón — «Continuar»
 * en las dos primeras, «Crear cuenta» en la última — y las dos salidas
 * calladas: entrar, o mirar los viajes sin cuenta, que es el recorrido que el
 * producto entero defiende (se busca primero, la cuenta llega después).
 *
 * Las láminas 2 y 3 no llevan fotografía sino una **prueba de interfaz**,
 * como en el canevas: dos filas de viaje reales en miniatura, y la tarjeta de
 * confianza con la cédula verificada. La 3 dice «cédula verificada» y no
 * «cédula y licencia» como el canevas: solo la cédula pasa por Didit hoy, y
 * esta pantalla no promete lo que el producto no hace.
 */

import { useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';

import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { CampoRojo } from '@/ui/CampoRojo';
import { Boton } from '@/ui/controles';
import { tabular } from '@/ui/dinero';
import { Marca } from '@/ui/iconos';
import { PuntaDeFlecha } from '@/ui/TarjetaDeViaje';
import { color, espacio, familia, radio, sombra, zonaDeToque } from '@/ui/tokens';

const FOTO_CARRETERA = require('../../assets/david.jpeg');

const LAMINAS = [
  {
    clave: 'beneficio',
    titulo: 'Muévete mejor,\nviajando juntos',
    copia: 'Comparte el carro con gente que va a tu mismo destino y divide la gasolina.',
  },
  {
    clave: 'encontrar',
    titulo: 'Encuentra un viaje\nque encaje contigo',
    copia: 'Busca por ruta y hora, compara aportes y reserva tu puesto en segundos.',
  },
  {
    clave: 'confianza',
    titulo: 'Comparte el camino\ncon confianza',
    copia: 'Cédula verificada, reseñas reales y chat dentro de la app.',
  },
] as const;

/** Las dos filas de viaje de la lámina 2, las del canevas. */
const VIAJES_DE_MUESTRA = [
  { horas: '14:30 → 20:15', destino: 'David', quien: 'Ricardo M. · 2 cupos', precio: '18' },
  { horas: '16:00 → 19:40', destino: 'Santiago', quien: 'Yariela C. · 1 cupo', precio: '16' },
];

export default function Apertura() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  /* Una lámina mide lo que el marco: en escritorio el marco, en el teléfono
     la ventana. Es lo que hace que el desliz pare lámina a lámina. */
  const ancho = Math.min(width, espacio.marco);
  const [enCual, setEnCual] = useState(0);
  const tira = useRef<ScrollView>(null);

  const ultima = enCual === LAMINAS.length - 1;

  const avanzar = () => {
    if (ultima) {
      router.push('/(cuenta)/registro');
      return;
    }
    tira.current?.scrollTo({ x: (enCual + 1) * ancho, animated: true });
  };

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={400} />
      <BarraDeEstado />

      {/* La fila de marca, con la salida de quien ya conoce esto. */}
      <View style={estilos.filaMarca}>
        <View style={estilos.marca}>
          <Marca tamano={21} />
          <Text style={estilos.marcaTexto}>partimos</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Saltar la presentación"
          onPress={() => router.replace('/(pasajero)')}
          style={[zonaDeToque, { paddingHorizontal: 6 }]}
        >
          <Text style={estilos.saltar}>Saltar</Text>
        </Pressable>
      </View>

      {/* El deslizador: tres láminas, una pantalla cada una. */}
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
        style={{ flex: 1 }}
      >
        {/* Lámina 1 · el beneficio: la carretera, de verdad. */}
        <View style={[estilos.lamina, { width: ancho }]}>
          <View style={estilos.visual}>
            <Image source={FOTO_CARRETERA} style={estilos.foto} resizeMode="cover" />
          </View>
          <Text style={estilos.titulo}>{LAMINAS[0].titulo}</Text>
          <Text style={estilos.copia}>{LAMINAS[0].copia}</Text>
        </View>

        {/* Lámina 2 · encontrar: la prueba de interfaz, dos filas de viaje. */}
        <View style={[estilos.lamina, { width: ancho }]}>
          <View style={[estilos.visual, estilos.visualClaro]}>
            {VIAJES_DE_MUESTRA.map((v) => (
              <View key={v.destino} style={estilos.filaMuestra}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={estilos.filaHoras}>
                    <Text style={[estilos.horasMuestra, tabular]}>{v.horas}</Text>
                    <PuntaDeFlecha tamano={7} />
                    <Text style={estilos.destinoMuestra}>{v.destino}</Text>
                  </View>
                  <Text style={estilos.quienMuestra}>{v.quien}</Text>
                </View>
                <View style={estilos.filaPrecioMuestra}>
                  <Text style={estilos.unidadMuestra}>B/</Text>
                  <Text style={[estilos.precioMuestra, tabular]}>{v.precio}</Text>
                </View>
              </View>
            ))}
            <View style={estilos.botonMuestra}>
              <Text style={estilos.botonMuestraTexto}>Reservar puesto</Text>
            </View>
          </View>
          <Text style={estilos.titulo}>{LAMINAS[1].titulo}</Text>
          <Text style={estilos.copia}>{LAMINAS[1].copia}</Text>
        </View>

        {/* Lámina 3 · la confianza: la tarjeta del conductor verificado. */}
        <View style={[estilos.lamina, { width: ancho }]}>
          <View style={[estilos.visual, estilos.visualClaro, { justifyContent: 'center' }]}>
            <View style={estilos.tarjetaConfianza}>
              <View style={estilos.filaConductor}>
                <View style={estilos.retratoMuestra}>
                  <Text style={estilos.retratoMuestraTexto}>RM</Text>
                  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none" style={estilos.marcaVerificado}>
                    <Path
                      d="M8 14.6a6.6 6.6 0 1 0 0-13.2 6.6 6.6 0 0 0 0 13.2Z"
                      fill={color.rojo500}
                      stroke={color.blanco}
                      strokeWidth={2.2}
                    />
                    <Path
                      d="m5.2 8.2 2 2 3.6-4"
                      stroke="#fff"
                      strokeWidth={1.9}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={estilos.nombreMuestra}>Ricardo M.</Text>
                  <Text style={[estilos.quienMuestra, tabular]}>★ 4.9 · 128 viajes</Text>
                </View>
              </View>
              <View style={estilos.chipCedula}>
                <Text style={estilos.chipCedulaTexto}>Cédula verificada</Text>
              </View>
            </View>
          </View>
          <Text style={estilos.titulo}>{LAMINAS[2].titulo}</Text>
          <Text style={estilos.copia}>{LAMINAS[2].copia}</Text>
        </View>
      </ScrollView>

      {/* Debajo, fijos: los puntos, el botón, y las dos salidas calladas. */}
      <View style={estilos.pie}>
        <View style={estilos.puntos}>
          {LAMINAS.map((l, i) => (
            <View key={l.clave} style={[estilos.punto, i === enCual && estilos.puntoActivo]} />
          ))}
        </View>

        <Boton alPulsar={avanzar}>{ultima ? 'Crear cuenta' : 'Continuar'}</Boton>

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
  pantalla: {
    flex: 1,
    backgroundColor: color.sand100,
    maxWidth: espacio.marco,
    width: '100%',
    alignSelf: 'center',
  },

  filaMarca: {
    paddingTop: 8,
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
    color: color.ink900,
    fontFamily: familia,
  },
  saltar: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: color.ink500,
    fontFamily: familia,
  },

  lamina: { paddingHorizontal: espacio.gutter, paddingTop: 16 },
  /** El visual de la lámina: una tarjeta grande al radio 24. */
  visual: {
    height: 340,
    borderRadius: radio.l,
    overflow: 'hidden',
    backgroundColor: color.sand200,
    marginBottom: 20,
    ...sombra.s,
  },
  visualClaro: {
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    padding: 16,
    gap: 12,
  },
  foto: { width: '100%', height: '100%' },

  titulo: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.84,
    color: color.ink900,
    fontFamily: familia,
  },
  copia: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    color: color.ink500,
    maxWidth: 300,
    fontFamily: familia,
  },

  /* La prueba de interfaz de la lámina 2. */
  filaMuestra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radio.control,
    backgroundColor: color.sand100,
    borderWidth: 1,
    borderColor: color.bordeSutil,
  },
  filaHoras: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  horasMuestra: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: color.ink900,
    fontFamily: familia,
  },
  destinoMuestra: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: color.ink700,
    fontFamily: familia,
  },
  quienMuestra: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '400',
    color: color.ink600,
    fontFamily: familia,
  },
  filaPrecioMuestra: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  unidadMuestra: { fontSize: 11, lineHeight: 14, fontWeight: '500', color: color.ink600, fontFamily: familia },
  precioMuestra: {
    fontSize: 19,
    lineHeight: 23,
    fontWeight: '600',
    letterSpacing: -0.57,
    color: color.ink900,
    fontFamily: familia,
  },
  /** El botón de la maqueta: se ve, no se pulsa — la lámina entera avanza. */
  botonMuestra: {
    marginTop: 'auto',
    height: 48,
    borderRadius: radio.control,
    backgroundColor: color.rojo500,
    alignItems: 'center',
    justifyContent: 'center',
    ...sombra.cta,
  },
  botonMuestraTexto: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: color.blanco,
    fontFamily: familia,
  },

  /* La tarjeta de confianza de la lámina 3. */
  tarjetaConfianza: {
    borderRadius: radio.l,
    backgroundColor: color.sand100,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    padding: 16,
    gap: 14,
  },
  filaConductor: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  retratoMuestra: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: color.ink100,
    borderWidth: 1,
    borderColor: 'rgba(10,39,49,.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retratoMuestraTexto: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    letterSpacing: 0.28,
    color: color.ink700,
    fontFamily: familia,
  },
  marcaVerificado: { position: 'absolute', right: -3, bottom: -3 },
  nombreMuestra: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: -0.22,
    color: color.ink900,
    fontFamily: familia,
  },
  chipCedula: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: color.hechoFondo,
  },
  chipCedulaTexto: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: color.hechoTinta,
    fontFamily: familia,
  },

  /* El pie fijo: puntos, botón, salidas. */
  pie: { paddingHorizontal: espacio.gutter, paddingBottom: 16, gap: 14 },
  puntos: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  punto: { width: 6, height: 6, borderRadius: 3, backgroundColor: color.ink300 },
  puntoActivo: { width: 18, backgroundColor: color.rojo500 },
  salidas: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  salida: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: color.rojo700,
    fontFamily: familia,
  },
  salidaSeparador: { fontSize: 13, color: color.ink400, fontFamily: familia },
});
