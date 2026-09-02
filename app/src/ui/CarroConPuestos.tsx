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

import { cifraRedonda, formatearDineroRedondo, tabular } from './dinero';
import { color, familia, interlinea } from './tokens';

/* ---------------------------------------------------------------- El plano */

/**
 * Las medidas del dibujo, en unidades del `viewBox`. Los asientos se pintan
 * DOS veces —el SVG dibuja, y encima van los botones de verdad con su rótulo
 * y su área táctil—, así que la geometría vive aquí una sola vez y las dos
 * capas la leen. Si se separaran, el toque caería al lado del asiento.
 */
const ANCHO = 176;
/** El alto con UN banco. Con dos, el carro se alarga lo que mide el segundo. */
const ALTO_DE_UN_BANCO = 262;

type Sitio = { x: number; y: number; ancho: number; alto: number };

/* Las medidas del 01-09-2026, después de verlo en el teléfono: «design of the
   car is too big and really not good looking». Era 220 × 326 a 260 px de
   ancho — media pantalla para un dibujo que acompaña, y con la cifra escrita
   CUATRO VECES dentro de los asientos, la misma cada vez. Ahora el carro es
   un tercio más pequeño, tiene proporción de carro (largo = 1,5 × ancho) y la
   cifra se dice una sola vez debajo, con su multiplicación. */
const VOLANTE: Sitio = { x: 24, y: 80, ancho: 54, alto: 56 };
const COPILOTO: Sitio = { x: 98, y: 80, ancho: 54, alto: 56 };

/** Un sitio del banco, y el aire entre dos. */
const BANCO_ANCHO = 38;
const BANCO_ALTO = 50;
const BANCO_AIRE = 6;
/** Dónde empieza el primer banco, y cuánto baja el segundo. */
const BANCO_Y = 154;
const SALTO_DE_BANCO = BANCO_ALTO + 10;

/**
 * EL PLANO DEL CARRO, calculado a partir de cuántos asientos tiene detrás.
 *
 * Era una constante de tres sitios. Con las vans de siete plazas (01-09-2026)
 * hacen falta dos bancos, y el lienzo tiene que crecer con ellos: si el alto
 * se quedara fijo, la segunda fila caería sobre la luneta.
 *
 * Cada banco se centra solo, así que uno de dos asientos no queda pegado a la
 * izquierda.
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
  /* La versión que cabe dentro de un asiento de 38: sin el «B/», que la
     línea de abajo ya dice de quién es la moneda. */
  const cifraChica = cifraRedonda(aporteCentavos);

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
          {[62, ALTO - 82].map((y) => (
            <G key={y}>
              <Rect x={0} y={y} width={11} height={30} rx={5} fill={color.ink200} />
              <Rect x={ANCHO - 11} y={y} width={11} height={30} rx={5} fill={color.ink200} />
            </G>
          ))}

          {/* Los retrovisores. Un detalle, pero el que hace que la silueta se
              lea como un carro y no como una bandeja de asientos. */}
          <Rect x={5} y={86} width={9} height={16} rx={4} fill={color.ink200} />
          <Rect x={ANCHO - 14} y={86} width={9} height={16} rx={4} fill={color.ink200} />

          {/* La carrocería. */}
          <Rect
            x={11}
            y={5}
            width={ANCHO - 22}
            height={ALTO - 10}
            rx={38}
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
          <Path d="M 26 72 C 40 38 136 38 150 72 Z" fill={color.ink200} />
          <Path
            d={`M 27 ${ALTO - 44} C 41 ${ALTO - 14} 135 ${ALTO - 14} 149 ${ALTO - 44} Z`}
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
          <Volante cx={VOLANTE.x + VOLANTE.ancho / 2} cy={VOLANTE.y + 22} />
        </Svg>

        {/* La capa de los toques. Va encima y no dentro del SVG para que cada
            asiento sea un botón de verdad —con su rótulo para el lector de
            pantalla— y para que las cifras se pinten con la tipografía del
            sistema y sus cifras tabulares, que en un `<text>` de SVG no
            saldrían igual. */}
        <View
          style={[
            estilos.tuSitio,
            { top: `${((VOLANTE.y + 37) / ALTO) * 100}%` },
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
            <EtiquetaDelAsiento ofrecido={reparto.adelante > 0} cifra={cifraChica} />
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
              <EtiquetaDelAsiento ofrecido={ofrecido} cifra={cifraChica} />
            </Pressable>
          );
        })}
      </View>

      {/* LO QUE EL DIBUJO NO PUEDE DECIR SOLO: el total. Un asiento dice
          cuánto aporta quien se sienta ahí; esta línea dice cuánto vuelve al
          bolsillo del que maneja, que es la otra pregunta. */}
      {/* LA CUENTA, DICHA UNA VEZ Y CON SU MULTIPLICACIÓN. Antes la cifra
          por puesto estaba escrita dentro de cada asiento y el total aquí;
          ahora la línea hace la operación entera —«3 × B/9,82 = B/29,46»—,
          que es la pregunta que el conductor está haciendo al tocar. */}
      {ofrecidos === 0 ? (
        <Text style={estilos.cuenta}>
          Toca un asiento para ofrecerlo. Sin puestos no hay viaje que publicar.
        </Text>
      ) : (
        /* Con la cifra ya escrita en cada asiento, la línea de abajo dice
           sólo lo que el dibujo no puede: el total que vuelve. */
        <Text style={[estilos.cuenta, tabular]}>
          {`${ofrecidos} ${ofrecidos === 1 ? 'puesto' : 'puestos'} a ${cifra} · `}
          <Text style={estilos.cuentaFuerte}>
            {`recuperas ${formatearDineroRedondo(aporteCentavos * ofrecidos)}`}
          </Text>
        </Text>
      )}
      {/* Lo que el reparto promete, debajo y en voz más baja: es consecuencia
          de dónde tocó, no otra decisión que tomar. */}
      {nota ? <Text style={estilos.nota}>{nota}</Text> : null}
    </View>
  );
}

/* ------------------------------------------------------------------ Piezas */

/** El aro, el cubo y los tres radios de un volante visto desde arriba. */
function Volante({ cx, cy }: { cx: number; cy: number }) {
  const R = 13;
  return (
    <G>
      <Circle cx={cx} cy={cy} r={R} fill="none" stroke={color.ink500} strokeWidth={2.4} />
      <Path
        d={`M ${cx - R} ${cy} H ${cx + R} M ${cx} ${cy} V ${cy + R}`}
        stroke={color.ink500}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <Circle cx={cx} cy={cy} r={3.6} fill={color.ink500} />
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
        rx={13}
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
        x={sitio.x + 7}
        y={sitio.y + 6}
        width={sitio.ancho - 14}
        height={8}
        rx={4}
        fill={estado === 'ofrecido' ? 'rgba(255,255,255,.22)' : color.ink200}
        opacity={estado === 'volante' ? 0 : 1}
      />
    </G>
  );
}

/**
 * LO QUE VA DENTRO DEL ASIENTO: la cifra en el ofrecido, el «+» en el libre.
 *
 * La cifra se quitó el 01-09 porque el carro era enorme y la repetía en
 * 19 px; el 02-09 el dueño la pidió de vuelta — «I liked the price on the
 * seats» — y ahora cabe: el carro ya mide 190 y la cifra va en 10,5,
 * blanca sobre la tinta del asiento ofrecido. Tocar un asiento y ver
 * aparecer su aporte DENTRO es la respuesta más corta a «¿qué estoy
 * ofreciendo?». El total sigue debajo, dicho una vez.
 *
 * El «+» del libre se queda: sin él, un hueco punteado no se lee como un
 * control.
 */
function EtiquetaDelAsiento({ ofrecido, cifra }: { ofrecido: boolean; cifra: string }) {
  if (ofrecido) {
    return (
      <Text style={[estilos.cifraAsiento, tabular]} numberOfLines={1}>
        {cifra}
      </Text>
    );
  }
  return <Text style={estilos.masTexto}>+</Text>;
}

const estilos = StyleSheet.create({
  marco: { alignItems: 'center' },
  /* El `aspectRatio` lo pone quien dibuja: depende de cuántos bancos hay. */
  /* 190 y no 260: el dibujo acompaña la decisión, no es la decisión. Ver la
     nota de las medidas arriba. */
  lienzo: { width: '100%', maxWidth: 190 },

  sitio: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  /* `ink500` y no `ink400`: el «+» es texto, y `ink400` da 2,3:1 sobre el
     blanco del asiento libre — por debajo del 3:1 que la WCAG pide incluso
     al texto grande. */
  masTexto: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '400',
    color: color.ink500,
    fontFamily: familia,
  },
  /** La cifra dentro del asiento ofrecido: blanca sobre la tinta. */
  cifraAsiento: {
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '700',
    color: '#fff',
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
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: color.ink600,
    fontFamily: familia,
  },

  cuentaFuerte: { fontWeight: '700', color: color.ink900 },
  cuenta: {
    marginTop: 10,
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
