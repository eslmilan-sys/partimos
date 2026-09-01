/**
 * EL CARRO VISTO DESDE ARRIBA, con los puestos que ofreces y lo que aporta
 * cada uno.
 *
 * Pedido del dueño el 30-08-2026: «can you create a design that would
 * represent how many puestos in the car are available? With skills in svg,
 * design a car like in 2d with seats and how many they would pay accordingly
 * always on how many puestos he puts available».
 *
 * **Por qué sustituye a los dos steppers.** El paso decía «Adelante −/+» y
 * «Atrás −/+», dos contadores sobre un carro que no se veía. Pero un carro
 * no es un número: es un asiento delante, al lado del volante, y un banco
 * detrás donde el del medio va apretado. Con dos contadores el conductor
 * tiene que imaginarse el carro para saber qué está ofreciendo; con el carro
 * dibujado, toca el asiento y ya está. Y el que va apretado se VE apretado.
 *
 * **Y el dinero, en el asiento.** Lo que aporta cada puesto salía dos pasos
 * después, en «¿Cuánto aporta cada quien?». Escrito dentro del asiento, la
 * pregunta «¿cuánto recupero si pongo tres?» se contesta mirando: tres
 * asientos con B/8 dentro. R1 se sigue cumpliendo —lo que se recupera nunca
 * pasa del gasto—, y por eso la cifra es la del reparto, no un precio.
 *
 * **El asiento del conductor no se ofrece nunca** y por eso se dibuja
 * distinto: con su volante y su «Tú». Era la única forma de que «ofreces 3»
 * en un carro de cuatro plazas dejara de parecerse a un error.
 *
 * Sin estado propio: recibe el reparto y devuelve el reparto siguiente. Toda
 * la regla —cuántos caben delante, cuántos detrás— vive en `dominio/puestos`.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { ASIENTOS_POR_BANCO, MAXIMO_ATRAS, MAXIMO_BANCOS, type Reparto } from '@/dominio/puestos';

import { formatearDineroRedondo, tabular } from './dinero';
import { color, familia, interlinea } from './tokens';

/* ---------------------------------------------------------------- El plano */

/**
 * Las medidas del dibujo, en unidades del `viewBox`. Los asientos se pintan
 * DOS veces —el SVG dibuja, y encima van los botones de verdad con su rótulo
 * y su área táctil—, así que la geometría vive aquí una sola vez y las dos
 * capas la leen. Si se separaran, el toque caería al lado del asiento.
 */
const ANCHO = 220;
/** El alto con UN banco. Con dos, el carro se alarga lo que mide el segundo. */
const ALTO_DE_UN_BANCO = 326;

type Sitio = { x: number; y: number; ancho: number; alto: number };

const VOLANTE: Sitio = { x: 26, y: 96, ancho: 76, alto: 76 };
const COPILOTO: Sitio = { x: 118, y: 96, ancho: 76, alto: 76 };

/** Un sitio del banco: 54 de ancho, 68 de alto, y 5 de aire entre dos. */
const BANCO_ANCHO = 54;
const BANCO_ALTO = 68;
const BANCO_AIRE = 5;
/** Dónde empieza el primer banco, y cuánto baja el segundo. */
const BANCO_Y = 190;
const SALTO_DE_BANCO = BANCO_ALTO + 12;

/**
 * EL PLANO DEL CARRO, calculado a partir de cuántos asientos tiene detrás.
 *
 * Era una constante de tres sitios. Con las vans de siete plazas (01-09-2026)
 * hacen falta dos bancos, y el lienzo tiene que crecer con ellos: si el alto
 * se quedara fijo, la segunda fila caería sobre la luneta.
 *
 * Cada banco se centra solo, así que uno de dos asientos no queda pegado a la
 * izquierda. Con tres, la cuenta devuelve exactamente las posiciones de
 * siempre — `x = 24 + i × 59`.
 */
function planoDelCarro(traseros: number) {
  const filas: number[] = [];
  let quedan = Math.max(0, traseros);
  while (quedan > 0 && filas.length < MAXIMO_BANCOS) {
    const enEsta = Math.min(ASIENTOS_POR_BANCO, quedan);
    filas.push(enEsta);
    quedan -= enEsta;
  }

  const banco: Sitio[] = [];
  filas.forEach((cuantos, fila) => {
    const anchoTotal = cuantos * BANCO_ANCHO + (cuantos - 1) * BANCO_AIRE;
    const x0 = (ANCHO - anchoTotal) / 2;
    for (let i = 0; i < cuantos; i++) {
      banco.push({
        x: x0 + i * (BANCO_ANCHO + BANCO_AIRE),
        y: BANCO_Y + fila * SALTO_DE_BANCO,
        ancho: BANCO_ANCHO,
        alto: BANCO_ALTO,
      });
    }
  });

  return {
    banco,
    alto: ALTO_DE_UN_BANCO + Math.max(0, filas.length - 1) * SALTO_DE_BANCO,
  };
}

/** De unidades del lienzo a porcentajes, que es lo que entiende la capa de arriba. */
const enCiento = (s: Sitio, alto: number) => ({
  left: `${(s.x / ANCHO) * 100}%` as const,
  top: `${(s.y / alto) * 100}%` as const,
  width: `${(s.ancho / ANCHO) * 100}%` as const,
  height: `${(s.alto / alto) * 100}%` as const,
});

/* ------------------------------------------------------------ El componente */

type Props = {
  /** Los puestos que este carro puede ofrecer: los suyos menos el del volante. */
  maximos: number;
  reparto: Reparto;
  alCambiar: (r: Reparto) => void;
  /** Lo que aporta cada puesto, en centavos. Va escrito dentro del asiento. */
  aporteCentavos: number;
  /** Lo que el reparto permite prometer — «Máx. 2 personas atrás». */
  nota?: string | null;
};

export function CarroConPuestos({ maximos, reparto, alCambiar, aporteCentavos, nota }: Props) {
  /* Cuántos asientos TIENE el carro detrás, que no es cuántos ofreces: un
     carro de cuatro plazas tiene dos atrás, y ofrecer tres sería dibujar un
     asiento que no existe. */
  const hayCopiloto = maximos >= 1;
  const bancosQueHay = Math.max(0, Math.min(MAXIMO_ATRAS, maximos - (hayCopiloto ? 1 : 0)));
  const { banco: BANCO, alto: ALTO } = planoDelCarro(bancosQueHay);

  const ofrecidos = reparto.adelante + reparto.atras;
  const cifra = formatearDineroRedondo(aporteCentavos);

  /**
   * El banco se llena de izquierda a derecha, y tocar un asiento dice
   * «ofrezco HASTA éste». Tocar el que ya es el último lo quita. Así el
   * control cuenta —que es lo que el reparto guarda— sin fingir que cada
   * asiento se elige por separado: la base guarda cuántos van detrás, no
   * cuáles, y dibujar lo contrario sería prometer algo que no se guarda.
   */
  const tocarElBanco = (i: number) =>
    alCambiar({ ...reparto, atras: reparto.atras === i + 1 ? i : i + 1 });

  return (
    <View style={estilos.marco}>
      <View style={[estilos.lienzo, { aspectRatio: ANCHO / ALTO }]}>
        <Svg
          style={StyleSheet.absoluteFill}
          viewBox={`0 0 ${ANCHO} ${ALTO}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Las ruedas, fuera de la carrocería: son lo que dice de un vistazo
              que esto se mira desde arriba y no de frente. La trasera va
              medida desde ABAJO, para que siga bajo el eje cuando el carro se
              alarga con un segundo banco. */}
          {[74, ALTO - 94].map((y) => (
            <G key={y}>
              <Rect x={0} y={y} width={15} height={38} rx={6} fill={color.ink300} />
              <Rect
                x={ANCHO - 15}
                y={y}
                width={15}
                height={38}
                rx={6}
                fill={color.ink300}
              />
            </G>
          ))}

          {/* Los retrovisores. Un detalle, pero el que hace que la silueta se
              lea como un carro y no como una bandeja de asientos. */}
          <Rect x={8} y={104} width={12} height={20} rx={5} fill={color.ink200} />
          <Rect x={ANCHO - 20} y={104} width={12} height={20} rx={5} fill={color.ink200} />

          {/* La carrocería. */}
          <Rect
            x={14}
            y={6}
            width={ANCHO - 28}
            height={ALTO - 12}
            rx={44}
            /* La carrocería va en arena y no en blanco: la tarjeta que la
               contiene ES blanca, y un borde de un píxel era todo lo que
               separaba el carro del papel. */
            fill={color.sand100}
            stroke={color.ink200}
            strokeWidth={2}
          />

          {/* El parabrisas arriba y la luneta abajo: el habitáculo queda entre
              los dos, que es exactamente donde van los asientos. La luneta va
              POR DEBAJO del banco —de ahí que el banco suba a 190—: dibujada
              encima de los asientos no se veía. */}
          <Path d="M 32 88 C 48 46 172 46 188 88 Z" fill={color.ink200} />
          <Path
            d={`M 34 ${ALTO - 54} C 50 ${ALTO - 20} 170 ${ALTO - 20} 186 ${ALTO - 54} Z`}
            fill={color.ink200}
          />

          {/* Los asientos. El respaldo es el rectángulo entero; la banda de
              arriba, más oscura, es lo que lo hace leer como asiento y no
              como casilla. */}
          <Asiento sitio={VOLANTE} estado="volante" />
          {hayCopiloto ? (
            <Asiento sitio={COPILOTO} estado={reparto.adelante > 0 ? 'ofrecido' : 'libre'} />
          ) : null}
          {BANCO.map((s, i) => (
            <Asiento key={`${s.x}-${s.y}`} sitio={s} estado={i < reparto.atras ? 'ofrecido' : 'libre'} />
          ))}

          {/* EL VOLANTE, encima de su asiento. Aro, cubo y tres radios: con
              sólo el aro y la barra horizontal —como estaba— el dibujo se leía
              como una señal de prohibido el paso, justo encima del asiento
              que no se puede ofrecer. El radio de abajo lo deshace. */}
          <Volante cx={VOLANTE.x + VOLANTE.ancho / 2} cy={VOLANTE.y + 30} />
        </Svg>

        {/* La capa de los toques. Va encima y no dentro del SVG para que cada
            asiento sea un botón de verdad —con su rótulo para el lector de
            pantalla— y para que las cifras se pinten con la tipografía del
            sistema y sus cifras tabulares, que en un `<text>` de SVG no
            saldrían igual. */}
        <View
          style={[
            estilos.tuSitio,
            { top: `${((VOLANTE.y + 50) / ALTO) * 100}%` },
          ]}
          pointerEvents="none"
        >
          <Text style={estilos.tuTexto}>Tú</Text>
        </View>

        {hayCopiloto ? (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: reparto.adelante > 0 }}
            accessibilityLabel={
              reparto.adelante > 0
                ? `Puesto de adelante ofrecido, aporta ${cifra}. Toca para quitarlo`
                : 'Puesto de adelante libre. Toca para ofrecerlo'
            }
            onPress={() => alCambiar({ ...reparto, adelante: reparto.adelante > 0 ? 0 : 1 })}
            style={[estilos.sitio, enCiento(COPILOTO, ALTO)]}
          >
            <EtiquetaDelAsiento ofrecido={reparto.adelante > 0} cifra={cifra} />
          </Pressable>
        ) : null}

        {BANCO.map((s, i) => {
          const ofrecido = i < reparto.atras;
          return (
            <Pressable
              key={`${s.x}-${s.y}`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: ofrecido }}
              accessibilityLabel={
                ofrecido
                  ? `Puesto ${i + 1} de atrás ofrecido, aporta ${cifra}. Toca para dejar de ofrecerlo`
                  : `Puesto ${i + 1} de atrás libre. Toca para ofrecerlo`
              }
              onPress={() => tocarElBanco(i)}
              style={[estilos.sitio, enCiento(s, ALTO)]}
            >
              <EtiquetaDelAsiento ofrecido={ofrecido} cifra={cifra} pequeno />
            </Pressable>
          );
        })}
      </View>

      {/* LO QUE EL DIBUJO NO PUEDE DECIR SOLO: el total. Un asiento dice
          cuánto aporta quien se sienta ahí; esta línea dice cuánto vuelve al
          bolsillo del que maneja, que es la otra pregunta. */}
      <Text style={estilos.cuenta}>
        {ofrecidos === 0
          ? 'Toca un asiento para ofrecerlo. Sin puestos no hay viaje que publicar.'
          : `${ofrecidos === 1 ? '1 puesto' : `${ofrecidos} puestos`} · recuperas ${formatearDineroRedondo(aporteCentavos * ofrecidos)} entre todos.`}
      </Text>
      {/* Lo que el reparto promete, debajo y en voz más baja: es consecuencia
          de dónde tocó, no otra decisión que tomar. */}
      {nota ? <Text style={estilos.nota}>{nota}</Text> : null}
    </View>
  );
}

/* ------------------------------------------------------------------ Piezas */

/** El aro, el cubo y los tres radios de un volante visto desde arriba. */
function Volante({ cx, cy }: { cx: number; cy: number }) {
  const R = 16;
  return (
    <G>
      <Circle cx={cx} cy={cy} r={R} fill="none" stroke={color.ink500} strokeWidth={3} />
      <Path
        d={`M ${cx - R} ${cy} H ${cx + R} M ${cx} ${cy} V ${cy + R}`}
        stroke={color.ink500}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Circle cx={cx} cy={cy} r={4.5} fill={color.ink500} />
    </G>
  );
}

type Estado = 'volante' | 'ofrecido' | 'libre';

/** Un asiento dibujado: respaldo, banda de arriba, y el borde de lo que está libre. */
function Asiento({ sitio, estado }: { sitio: Sitio; estado: Estado }) {
  const relleno = estado === 'ofrecido' ? color.ink900 : color.blanco;
  return (
    <G>
      <Rect
        x={sitio.x}
        y={sitio.y}
        width={sitio.ancho}
        height={sitio.alto}
        rx={16}
        fill={relleno}
        stroke={estado === 'libre' ? color.ink200 : 'none'}
        strokeWidth={2}
        /* Los libres van punteados: dice que ese sitio está por decidir, no
           que esté vetado. */
        strokeDasharray={estado === 'libre' ? '5 5' : undefined}
      />
      {/* La banda del respaldo. En el ofrecido va clara sobre oscuro; en el
          libre, apenas un tono sobre el blanco. */}
      <Rect
        x={sitio.x + 8}
        y={sitio.y + 7}
        width={sitio.ancho - 16}
        height={10}
        rx={5}
        fill={estado === 'ofrecido' ? 'rgba(255,255,255,.22)' : color.ink200}
        opacity={estado === 'volante' ? 0 : 1}
      />
    </G>
  );
}

/** Lo que va escrito dentro del asiento: la cifra, o el signo de añadirlo. */
function EtiquetaDelAsiento({
  ofrecido,
  cifra,
  pequeno = false,
}: {
  ofrecido: boolean;
  cifra: string;
  pequeno?: boolean;
}) {
  if (!ofrecido) return <Text style={estilos.masTexto}>+</Text>;
  return (
    <Text style={[pequeno ? estilos.cifraChica : estilos.cifraAsiento, tabular]} numberOfLines={1}>
      {cifra}
    </Text>
  );
}

const estilos = StyleSheet.create({
  marco: { alignItems: 'center' },
  /* El `aspectRatio` lo pone quien dibuja: depende de cuántos bancos hay. */
  lienzo: { width: '100%', maxWidth: 260 },

  sitio: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  cifraAsiento: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: '#fff',
    fontFamily: familia,
  },
  cifraChica: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: '#fff',
    fontFamily: familia,
  },
  /* `ink500` y no `ink400`: el «+» es texto, y `ink400` da 2,3:1 sobre el
     blanco del asiento libre — por debajo del 3:1 que la WCAG pide incluso
     al texto grande. */
  masTexto: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '400',
    color: color.ink500,
    fontFamily: familia,
  },

  /** «Tú», debajo del volante. No es un botón: el conductor no se ofrece. */
  tuSitio: {
    position: 'absolute',
    left: `${(VOLANTE.x / ANCHO) * 100}%`,
    width: `${(VOLANTE.ancho / ANCHO) * 100}%`,
    alignItems: 'center',
  },
  tuTexto: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '600',
    color: color.ink600,
    fontFamily: familia,
  },

  cuenta: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: interlinea(13),
    color: color.ink600,
    fontFamily: familia,
  },
  nota: {
    marginTop: 3,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 17,
    color: color.ink500,
    fontFamily: familia,
  },
});
