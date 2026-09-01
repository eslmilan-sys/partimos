/**
 * LA REGLA DEL APORTE — el «jigger» de BlaBlaCar (pedido del dueño,
 * 30-08-2026: «also put the price jigger as in blablacar»).
 *
 * **Qué sustituye.** Un `Stepper` de −/+ sobre una cifra. Para bajar de 10 a
 * 4 hacían falta seis toques, y ninguno decía dónde estaba el suelo ni dónde
 * el techo: se descubrían al chocar, cuando el botón dejaba de responder sin
 * explicación.
 *
 * **Qué enseña que el stepper no podía.** El recorrido entero de un vistazo:
 * el mínimo, el tope de la ruta, y la marca de lo sugerido en medio. Mover el
 * dedo hacia la izquierda es *pedir menos*, hacia la derecha es *acercarse al
 * tope* — y el tope se ve venir, no se topa uno con él.
 *
 * **La diferencia con BlaBlaCar, y es de fondo.** Allí la regla llega hasta
 * un precio «demasiado alto» pintado de rojo, pero se puede poner igual: el
 * conductor gana dinero y la plataforma cobra su parte. Aquí el extremo
 * derecho es el tope de la ruta y **no se puede pasar** (R1: quien maneja no
 * gana nunca). Por eso esta regla no tiene zona roja: no hay ningún valor
 * elegible que esté mal.
 *
 * **Los −/+ siguen ahí**, a los lados. Un dedo grueso no acierta un dólar
 * exacto en 280 px, y un lector de pantalla no arrastra: la regla es para
 * ver, los botones son para afinar.
 */

import { useState } from 'react';
import {
  type GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { color, familia, radio, zonaDeToque } from './tokens';

/** El radio del pulgar. La barra se mete otro tanto por cada lado para que el
    pulgar no se salga del control en los extremos. */
const PULGAR = 15;

type Props = {
  valor: number;
  min: number;
  max: number;
  paso?: number;
  alCambiar: (v: number) => void;
  /** Lo sugerido: una marca en la barra, sin rótulo grande. */
  marca?: number;
  /**
   * LA BANDA RECOMENDADA, pintada sobre el carril (01-09-2026, con BlaBlaCar
   * delante: «precio recomendado 23 € – 25 €»). Un máximo dice dónde está la
   * pared; la banda dice dónde conviene quedarse. Ver `rangoRecomendado`.
   */
  banda?: { desde: number; hasta: number };
  /** Lo que se lee bajo cada extremo. */
  rotuloIzquierda?: string;
  rotuloDerecha?: string;
  etiquetaAccesible: string;
  /** Cómo se dice el valor a un lector de pantalla — «8 dólares». */
  comoSeDice?: (v: number) => string;
};

export function Regula({
  valor,
  min,
  max,
  paso = 1,
  alCambiar,
  marca,
  banda,
  rotuloIzquierda,
  rotuloDerecha,
  etiquetaAccesible,
  comoSeDice,
}: Props) {
  const [ancho, setAncho] = useState(0);

  const recorrido = Math.max(1, max - min);
  const fraccion = Math.min(1, Math.max(0, (valor - min) / recorrido));
  /* El carril útil: de centro de pulgar a centro de pulgar. */
  const carril = Math.max(1, ancho - PULGAR * 2);

  const acotar = (v: number) => Math.min(max, Math.max(min, Math.round(v / paso) * paso));

  const alTocar = (e: GestureResponderEvent) => {
    if (ancho <= 0) return;
    const x = e.nativeEvent.locationX - PULGAR;
    alCambiar(acotar(min + (x / carril) * recorrido));
  };

  const sePuedeBajar = valor > min;
  const sePuedeSubir = valor < max;

  return (
    <View>
      <View style={estilos.fila}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Bajar ${etiquetaAccesible}`}
          disabled={!sePuedeBajar}
          onPress={() => alCambiar(acotar(valor - paso))}
          style={({ pressed }) => [
            estilos.boton,
            pressed && estilos.botonPulsado,
            !sePuedeBajar && estilos.botonApagado,
          ]}
        >
          {/* El mismo glifo que el `Stepper`: menos matemático (U+2212), no
              un guion. Es el signo que la app usa en los otros cuatro ±. */}
          <Text style={[estilos.glifo, !sePuedeBajar && estilos.glifoApagado]}>−</Text>
        </Pressable>

        {/*
          El área que responde al dedo es ESTA, y por eso todo lo que se pinta
          va dentro de una capa sin toques: en la web, `locationX` se mide
          contra el elemento que recibe el evento, y si el pulgar lo recibiera
          el valor saldría medido desde el pulgar y la barra daría saltos.
        */}
        <View
          style={estilos.zona}
          onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={alTocar}
          onResponderMove={alTocar}
          accessibilityRole="adjustable"
          accessibilityLabel={etiquetaAccesible}
          accessibilityValue={{
            min,
            max,
            now: valor,
            text: comoSeDice ? comoSeDice(valor) : String(valor),
          }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) =>
            alCambiar(
              acotar(valor + (e.nativeEvent.actionName === 'decrement' ? -paso : paso)),
            )
          }
        >
          <View style={estilos.pintura} pointerEvents="none">
            <View style={estilos.barra} />

            {/* La banda buena va DEBAJO del recorrido hecho: es el fondo
                sobre el que se mueve el pulgar, no una segunda barra que
                compita con él. */}
            {banda ? (
              <View
                style={[
                  estilos.banda,
                  {
                    left: PULGAR + (carril * Math.max(0, banda.desde - min)) / recorrido,
                    width:
                      (carril * Math.min(recorrido, banda.hasta - Math.max(min, banda.desde))) /
                      recorrido,
                  },
                ]}
              />
            ) : null}

            <View style={[estilos.barraHecha, { width: PULGAR + carril * fraccion }]} />

            {/* La marca de lo sugerido. Va DEBAJO del pulgar a propósito: es
                una referencia, no un destino. */}
            {marca != null && marca > min && marca < max ? (
              <View
                style={[
                  estilos.marca,
                  { left: PULGAR + (carril * (marca - min)) / recorrido - 1 },
                ]}
              />
            ) : null}

            <View style={[estilos.pulgar, { left: carril * fraccion }]} />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Subir ${etiquetaAccesible}`}
          disabled={!sePuedeSubir}
          onPress={() => alCambiar(acotar(valor + paso))}
          style={({ pressed }) => [
            estilos.boton,
            pressed && estilos.botonPulsado,
            !sePuedeSubir && estilos.botonApagado,
          ]}
        >
          <Text style={[estilos.glifo, !sePuedeSubir && estilos.glifoApagado]}>+</Text>
        </Pressable>
      </View>

      {rotuloIzquierda || rotuloDerecha ? (
        <View style={estilos.filaRotulos}>
          <Text style={estilos.rotulo}>{rotuloIzquierda ?? ''}</Text>
          <Text style={[estilos.rotulo, estilos.rotuloDerecha]}>{rotuloDerecha ?? ''}</Text>
        </View>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  boton: {
    ...zonaDeToque,
    width: 44,
    height: 44,
    borderRadius: radio.icono,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.sand100,
  },
  botonPulsado: { backgroundColor: color.lavado },
  botonApagado: { backgroundColor: color.sand200 },
  glifo: {
    fontSize: 19,
    lineHeight: 22,
    fontWeight: '500',
    color: color.ink900,
    fontFamily: familia,
  },
  glifoApagado: { color: color.ink300 },

  /** 44 de alto: la barra mide 6, pero el dedo tiene derecho a los 44. */
  zona: { flex: 1, height: 44, justifyContent: 'center' },
  pintura: { height: PULGAR * 2, justifyContent: 'center' },
  barra: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.sand200,
  },
  barraHecha: {
    position: 'absolute',
    left: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.ink900,
  },
  /** Verde de «hecho»: es la zona en la que el viaje se llena. */
  banda: {
    position: 'absolute',
    height: 6,
    borderRadius: 3,
    backgroundColor: color.hechoFondo,
  },
  marca: {
    position: 'absolute',
    width: 2,
    height: 14,
    borderRadius: 1,
    backgroundColor: color.ink400,
  },
  pulgar: {
    position: 'absolute',
    width: PULGAR * 2,
    height: PULGAR * 2,
    borderRadius: PULGAR,
    backgroundColor: color.blanco,
    borderWidth: 2.5,
    borderColor: color.ink900,
  },

  filaRotulos: { flexDirection: 'row', marginTop: 6, paddingHorizontal: 54 },
  rotulo: { flex: 1, fontSize: 11.5, lineHeight: 16, color: color.ink500, fontFamily: familia },
  rotuloDerecha: { textAlign: 'right' },
});
