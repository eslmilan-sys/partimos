/**
 * `15c` Estado del reembolso — el plazo que `7d` prometió, ya corriendo.
 *
 * Un reembolso que no se ve avanzar acaba siendo un mensaje a soporte. Por eso
 * esto no es un recibo sino una línea de tiempo: cuatro pasos con fecha, los
 * cumplidos en verde, el que toca en azul y el que falta en gris hueco, para
 * que la espera tenga forma y se sepa cuánto queda sin preguntar.
 *
 * Y nada de jerga bancaria: ni «procesando», ni «liquidación», ni «referencia
 * de transacción». La cifra manda arriba porque es lo único que se vino a
 * comprobar; debajo, dónde cae el dinero y qué hacer si el lunes no está.
 */

import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type TextStyle } from 'react-native';

import { useRouter } from 'expo-router';

import {
  estadoDelReembolso,
  type EstadoDelReembolso,
  type PasoDelReembolso,
} from '@/servicios/cancelaciones';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Brillo, CampoRojo } from '@/ui/CampoRojo';
import { Epigrafe } from '@/ui/controles';
import { formatearDinero, tabular } from '@/ui/dinero';
import { ZONA, hora } from '@/ui/fechas';
import { Atras, Visto } from '@/ui/iconos';
import { familia, color, espacio, radio, sombra } from '@/ui/tokens';

/** El reembolso de la cancelación de Andrés. Mientras no haya sesión. */
const REEMBOLSO = 'ff000000-0000-4000-8000-000000000001';

/**
 * React Native Web deja `white-space: pre-wrap` en todo `Text`, y eso conserva
 * el espacio que queda al final de la línea partida: el párrafo mide 4 px más
 * de lo que ocupa. El traspaso corta como corta el navegador.
 */
const CORTE_DEL_NAVEGADOR =
  Platform.OS === 'web' ? ({ whiteSpace: 'normal' } as unknown as TextStyle) : null;

/** El punto de cada paso: verde lo hecho, azul lo que corre, hueco lo que falta. */
const PUNTO = {
  hecho: { backgroundColor: color.verde500 },
  ahora: { backgroundColor: color.azul500 },
  falta: { backgroundColor: color.blanco, borderWidth: 2, borderColor: color.bordePorDefecto },
} as const;

export default function Estado() {
  const router = useRouter();
  const [datos, setDatos] = useState<EstadoDelReembolso | null>(null);

  useEffect(() => {
    estadoDelReembolso(REEMBOLSO).then(setDatos);
  }, []);

  if (!datos) return <View style={estilos.pantalla} />;

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={206} />
      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <View style={estilos.filaEpigrafe}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atrás"
            onPress={() => router.back()}
            style={estilos.circulo}
          >
            <Atras />
          </Pressable>
          <Epigrafe tinta={color.campoTexto}>
            {`Solicitud ${datos.solicitud} · ${datos.destino}`}
          </Epigrafe>
        </View>
        <Text style={estilos.titular}>
          {'Tu '}
          <Text style={estilos.titularFuerte}>reembolso</Text>
        </Text>
      </View>

      {/* Cabe entero en la pantalla: no rueda, y por eso el cierre puede ser la
          última línea suelta en vez de un pie fijo. */}
      <View style={estilos.cuerpo}>
        <View style={estilos.tarjetaImporte}>
          <Brillo ancho={346} alto={124} />
          <View style={estilos.filaImporte}>
            <Text style={estilos.importe}>{formatearDinero(datos.montoCentavos)}</Text>
            <View style={estilos.pastilla}>
              <Text style={estilos.pastillaTexto}>{datos.titulo}</Text>
            </View>
          </View>
          {/* El párrafo va en su propia caja dentro de la línea, como en el
              traspaso: ocupa lo que mide, no toda la columna. */}
          <Text style={estilos.explicacion}>
            <Text style={CORTE_DEL_NAVEGADOR}>{datos.texto}</Text>
          </Text>
        </View>

        <View style={estilos.tarjetaPasos}>
          <View style={{ marginBottom: 14 }}>
            <Epigrafe>Por dónde va</Epigrafe>
          </View>

          <View>
            {datos.pasos.map((paso, i) => (
              <View key={paso.titulo} style={estilos.paso}>
                <View style={[estilos.punto, PUNTO[paso.estado]]}>
                  {paso.estado === 'hecho' ? <Visto tamano={11} /> : null}
                </View>
                <View style={estilos.columnaDelPaso}>
                  <Text
                    style={[
                      estilos.pasoTitulo,
                      paso.estado === 'falta' ? estilos.pasoTituloPorVenir : null,
                    ]}
                  >
                    {paso.titulo}
                  </Text>
                  <Text style={estilos.pasoCuando}>{cuandoDelPaso(paso, datos.pasos[i - 1])}</Text>
                </View>
              </View>
            ))}
            {/* La línea que cose los cuatro puntos va la última: en el traspaso
                está posicionada, así que se pinta por encima y los cruza. */}
            <View style={estilos.linea} />
          </View>
        </View>

        <View style={estilos.tarjetaDestino}>
          <View style={estilos.cuadro}>
            <Text style={estilos.inicial}>{datos.donde.trim().charAt(0)}</Text>
          </View>
          <View style={estilos.columnaDelDestino}>
            <Text style={estilos.donde}>{datos.donde}</Text>
            <Text style={estilos.pieDelDestino}>Donde lo vas a recibir</Text>
          </View>
        </View>

        <Text style={estilos.cierre}>{datos.cierre}</Text>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */

const diaYNumero = new Intl.DateTimeFormat('es-PA', {
  weekday: 'short',
  day: 'numeric',
  timeZone: ZONA,
});

/**
 * «Sáb 14». `@/ui/fechas` sólo da el día largo, y en una línea de tiempo de
 * cuatro filas el día entero no cabe junto a la hora.
 */
function diaBreve(d: string): string {
  const s = diaYNumero.format(new Date(d)).replace(/[.,]/g, '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Lo cumplido lleva la hora exacta; lo que corre, el día estimado; y el último
 * no tiene fecha sino ventana: cae el día en que sale o el siguiente.
 */
function cuandoDelPaso(paso: PasoDelReembolso, anterior?: PasoDelReembolso): string {
  if (paso.estado === 'hecho') return `${diaBreve(paso.cuando)} · ${hora(paso.cuando)}`;
  if (paso.estado === 'ahora') return `${diaBreve(paso.cuando)} · estimado`;
  if (!anterior) return diaBreve(paso.cuando);
  return `${diaBreve(anterior.cuando)} o ${diaBreve(paso.cuando).toLowerCase()}`;
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: color.sand100,
    maxWidth: 390,
    width: '100%',
    alignSelf: 'center',
    ...(Platform.OS === 'web' ? { height: 844, maxHeight: 844 } : null),
  },

  cabecera: { paddingTop: 4, paddingHorizontal: espacio.gutter },
  filaEpigrafe: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  circulo: {
    width: espacio.controlS,
    height: espacio.controlS,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titular: {
    fontSize: 31,
    // 1.05 del titular grande, no la interlínea del cuerpo.
    lineHeight: 32.55,
    letterSpacing: -1.24,
    fontWeight: '400',
    color: color.blanco,
    marginTop: 12,
    fontFamily: familia,
  },
  titularFuerte: { fontWeight: '600' },

  cuerpo: { flex: 1, minHeight: 0, overflow: 'hidden' },

  tarjetaImporte: {
    marginTop: 20,
    marginHorizontal: 22,
    backgroundColor: color.blanco,
    // `--radius-sheet` del traspaso son 28; `radio.hoja` se quedó en 26.
    borderRadius: 28,
    padding: 20,
    // El brillo sube desde debajo del borde: la tarjeta tiene que recortar.
    overflow: 'hidden',
    ...sombra.hoja,
  },
  filaImporte: { flexDirection: 'row', alignItems: 'flex-end', gap: 9 },
  importe: {
    fontSize: 40,
    // La cifra grande va apretada contra su línea: 0.88.
    lineHeight: 35.2,
    fontWeight: '700',
    letterSpacing: -2,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  pastilla: {
    backgroundColor: color.azul100,
    borderRadius: radio.pastilla,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginBottom: 7,
  },
  pastillaTexto: {
    fontSize: 10.5,
    lineHeight: 15.225,
    fontWeight: '600',
    color: color.azul700,
    fontFamily: familia,
  },
  explicacion: {
    fontSize: 13.5,
    lineHeight: 19.575,
    fontWeight: '400',
    color: color.ink700,
    marginTop: 10,
    fontFamily: familia,
  },

  tarjetaPasos: {
    marginTop: espacio.entreTarjetas,
    marginHorizontal: 22,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderRadius: radio.l,
    padding: 20,
  },
  linea: {
    position: 'absolute',
    left: 8.5,
    top: 10,
    bottom: 10,
    width: 1.5,
    backgroundColor: color.bordePorDefecto,
  },
  paso: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingBottom: 16 },
  punto: {
    width: 18,
    height: 18,
    borderRadius: radio.pastilla,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Los dos textos miden lo que dicen, no la columna: el traspaso los deja
  // sueltos dentro de la línea.
  columnaDelPaso: { flex: 1, minWidth: 0, alignItems: 'flex-start' },
  pasoTitulo: {
    fontSize: 14.5,
    lineHeight: 21.025,
    fontWeight: '600',
    letterSpacing: -0.2175,
    color: color.ink900,
    fontFamily: familia,
  },
  pasoTituloPorVenir: { fontWeight: '400', color: color.ink500 },
  pasoCuando: {
    fontSize: 12.5,
    lineHeight: 18.125,
    fontWeight: '400',
    color: color.ink500,
    marginTop: 2,
    fontFamily: familia,
    ...tabular,
  },

  tarjetaDestino: {
    marginTop: espacio.entreTarjetas,
    marginHorizontal: 22,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderRadius: radio.l,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cuadro: {
    width: 34,
    height: 34,
    borderRadius: radio.cuadrado,
    backgroundColor: color.azul100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inicial: {
    fontSize: 14.5,
    lineHeight: 21.025,
    fontWeight: '600',
    color: color.azul700,
    fontFamily: familia,
  },
  columnaDelDestino: { flex: 1, minWidth: 0 },
  donde: {
    fontSize: 14.5,
    lineHeight: 21.025,
    fontWeight: '500',
    letterSpacing: -0.2175,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  pieDelDestino: {
    fontSize: 12.5,
    lineHeight: 18.125,
    fontWeight: '400',
    color: color.ink500,
    marginTop: 1,
    fontFamily: familia,
  },

  cierre: {
    marginTop: espacio.entreTarjetas,
    marginHorizontal: 22,
    fontSize: 12.5,
    // El cierre respira más que el cuerpo: 1.5.
    lineHeight: 18.75,
    fontWeight: '400',
    color: color.ink500,
    fontFamily: familia,
  },
});
