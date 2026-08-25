/**
 * `6d` Verificación de la cédula — la pantalla que dice en voz alta lo que no
 * guardamos.
 *
 * La cédula se verifica **fuera**: la foto del documento y el número van al
 * proveedor certificado y nunca llegan a nuestros servidores. De vuelta sólo
 * recibimos dos cosas, si pasó o no y una referencia. Por eso esto no es un
 * formulario sino una línea de tiempo: aquí no hay nada que subir, sólo algo
 * que esperar, y el tercer paso enseña por escrito el límite de lo que entra.
 *
 * Verificarse es obligatorio para conducir, así que el pie no ofrece ningún
 * atajo para publicar. Los dos beneficios de abajo son la razón de esperar, y
 * nunca un distintivo que separe a unos conductores de otros.
 *
 * **EL BOTÓN NO LLAMABA A NADIE (arreglado el 25-08-2026).** La pantalla
 * escribía sola una fila `pending` al montarse —«mandaste tu cédula»— y el
 * único botón volvía a leer ese estado inventado. `abrirVerificacion()`, que
 * es quien llama de verdad a `didit-start`, no la usaba ninguna pantalla:
 * código muerto. Resultado medido en el teléfono del dueño: «En revisión»
 * para siempre, sin que Didit hubiera visto jamás una cédula.
 *
 * Ahora el pie cambia con el estado: sin dossier abierto **se abre uno** y el
 * teléfono sale al recorrido de Didit; con uno en curso se vuelve a mirar.
 * En simulado no hay a quién llamar, así que la demo conserva el paseo de
 * antes — es lo que enseña la línea de tiempo sin base detrás.
 */

import { useCallback, useEffect, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { useDecir } from '@/ui/Nota';

import { useVolver } from '@/ui/salidas';
import Svg, { Path } from 'react-native-svg';

import {
  type EstadoDeCedula,
  LO_QUE_DA_LA_CEDULA,
  PASOS_DE_LA_CEDULA,
  estadoDeCedula,
  pedirVerificacion,
} from '@/servicios/seguridad';
import { abrirVerificacion } from '@/servicios/identidad';
import { useMiIdOEntrar } from '@/servicios/sesion';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { CampoRojo } from '@/ui/CampoRojo';
import { Boton, Epigrafe } from '@/ui/controles';
import { tabular } from '@/ui/dinero';
import { Atras } from '@/ui/iconos';
import { familia, color, espacio, radio, sombra } from '@/ui/tokens';

/**
 * Quien se está haciendo conductor. Andrés la tiene verificada desde hace
 * meses; esta pantalla es la de quien acaba de mandarla. Sin sesión que
 * preguntar —solo en simulado—, ésta es la convención.
 */
const DEL_RECORRIDO = '22222222-2222-4222-8222-222222222222';

/** `--arena-700` del traspaso: el ámbar de lo que está en curso. `@/ui/tokens`
 *  trae la arena clara pero no su tinta, y no se tocan los tokens desde aquí. */
const ARENA_700 = '#8A5A24';

/** Sin base real no hay función Edge a la que llamar: la demo se pasea sola. */
const SIMULADO = (process.env.EXPO_PUBLIC_FUENTE ?? 'simulado') !== 'supabase';

/** Hasta dónde llegó la verificación, en pasos de `PASOS_DE_LA_CEDULA`. Que la
 *  respuesta sea «no» también es haberla recibido: ahí la línea está completa. */
const HASTA_DONDE: Record<EstadoDeCedula['estado'], number> = {
  pendiente: 0,
  'en revisión': 1,
  verificada: PASOS_DE_LA_CEDULA.length,
  rechazada: PASOS_DE_LA_CEDULA.length,
};

const TINTA_DEL_ESTADO: Record<EstadoDeCedula['estado'], { fondo: string; tinta: string }> = {
  pendiente: { fondo: color.arena100, tinta: ARENA_700 },
  'en revisión': { fondo: color.arena100, tinta: ARENA_700 },
  verificada: { fondo: color.azul100, tinta: color.azul700 },
  rechazada: { fondo: color.rojo100, tinta: color.rojo700 },
};

export default function Cedula() {
  const router = useRouter();
  const volver = useVolver('/(conductor)/panel');
  const yo = useMiIdOEntrar(DEL_RECORRIDO);
  const [datos, setDatos] = useState<EstadoDeCedula | null>(null);
  const [abriendo, setAbriendo] = useState(false);

  const decir = useDecir();


  const mirar = useCallback(() => {
    if (yo) estadoDeCedula(yo).then(setDatos);
  }, [yo]);

  /**
   * Volver a mirar casi siempre devuelve lo mismo —la revisión tarda minutos—
   * y la pantalla no cambiaba ni un píxel: el botón parecía muerto. Ahora
   * dice qué encontró, aunque sea lo de antes.
   */
  const mirarYDecir = useCallback(() => {
    if (!yo) return;
    estadoDeCedula(yo).then((e) => {
      setDatos(e);
      decir(
        e.estado === 'verificada'
          ? 'Ya está verificada. Puedes publicar.'
          : e.estado === 'en revisión'
            ? 'Sigue en revisión. Te avisamos en cuanto pase.'
            : e.estado === 'rechazada'
              ? 'No pasó la verificación. Escríbenos desde Ayuda.'
              : 'Todavía no hemos recibido el resultado.',
      );
    });
  }, [yo, decir]);

  /**
   * EMPEZAR DE VERDAD. `abrirVerificacion` pide a `didit-start` una sesión
   * ligada a esta cuenta y devuelve la dirección del recorrido alojado. Tres
   * finales, y los tres se dicen:
   *
   * - ligada: se sale al recorrido y el veredicto vuelve solo, por el webhook;
   * - suelta: los secretos de Didit no están puestos todavía, así que la
   *   sesión no sabe de quién es — se avisa en vez de fingir que cuenta;
   * - ya verificada: no se manda a nadie a verificarse dos veces.
   */
  const empezar = useCallback(async () => {
    if (!yo || abriendo) return;
    setAbriendo(true);
    try {
      if (SIMULADO) {
        await pedirVerificacion(yo);
        mirar();
        decir('En la demo la verificación se simula. En la app real sales al proveedor.');
        return;
      }
      const r = await abrirVerificacion('cedula');
      if ('error' in r) {
        decir(
          r.error === 'ya-verificado'
            ? 'Tu cédula ya está verificada. Puedes publicar.'
            : 'No se pudo abrir la verificación. Prueba otra vez.',
        );
        mirar();
        return;
      }
      if (!r.ligada) {
        decir('La verificación todavía no está conectada a las cuentas. Escríbenos desde Ayuda.');
        return;
      }
      if (Platform.OS === 'web') window.location.assign(r.url);
      else await Linking.openURL(r.url);
    } catch {
      decir('No se pudo abrir la verificación. Revisa la conexión.');
    } finally {
      setAbriendo(false);
    }
  }, [yo, abriendo, mirar, decir]);

  useEffect(() => {
    // SOLO LEE. Antes escribía una fila `pending` al montarse: bastaba con
    // abrir la pantalla para «haber mandado la cédula», que es mentira.
    mirar();
  }, [mirar]);

  if (!datos) return <Cargando />;

  const hasta = HASTA_DONDE[datos.estado];
  const insignia = TINTA_DEL_ESTADO[datos.estado];

  return (
    <View style={estilos.pantalla}>
      <BarraDeEstado />

      {/* TODA LA PANTALLA DESLIZA. Antes el cuerpo era un `flex: 1` con
          `overflow: 'hidden'` y un hueco de 152 al pie: en un teléfono el
          segundo beneficio quedaba CORTADO por el borde y no había forma de
          llegar a él. Visto en el teléfono del dueño el 25-08. */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <CampoRojo altura={214} />

      <View style={estilos.cabecera}>
        <View style={estilos.filaCabecera}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atrás"
            onPress={() => volver()}
            style={estilos.circulo}
          >
            <Atras />
          </Pressable>
          <Epigrafe tinta={color.campoTexto}>Verificación</Epigrafe>
        </View>

        <Text style={estilos.titular}>
          {'Tu cédula se'}
          {'\n'}
          <Text style={estilos.titularFuerte}>verifica fuera de aquí</Text>
        </Text>
      </View>

      <View style={estilos.cuerpo}>
        <View style={estilos.tarjeta}>
          <View style={estilos.filaEstado}>
            <Text style={estilos.estado}>Estado</Text>
            <View style={[estilos.insignia, { backgroundColor: insignia.fondo }]}>
              <View style={[estilos.insigniaPunto, { backgroundColor: insignia.tinta }]} />
              <Text style={[estilos.insigniaTexto, { color: insignia.tinta }]}>
                {datos.etiqueta}
              </Text>
            </View>
          </View>

          {/* LA FRISE. Cada paso dibuja su riel; el punto, su halo y la línea
              salen del MISMO centro (`CENTRO`), así que no hay forma de que
              se desalineen. Antes el halo iba en `top: 0` absoluto y el
              primer paso llevaba `paddingTop: 16` — y la posición absoluta
              no cuenta el relleno del padre, así que el halo aparecía
              flotando 16 px por ENCIMA de su punto. La línea, además, tenía
              dos alturas escritas a mano (36 y 20) que no seguían a nada. */}
          <View style={estilos.pasos}>
            {PASOS_DE_LA_CEDULA.map((paso, i) => {
              const hecho = i < hasta;
              const enCurso = i === hasta;
              const ultimo = i === PASOS_DE_LA_CEDULA.length - 1;

              return (
                <View key={paso.titulo} style={estilos.paso}>
                  <View style={estilos.riel}>
                    {ultimo ? null : (
                      <View style={[estilos.rielLinea, hecho && estilos.rielLineaHecha]} />
                    )}
                    {enCurso ? <View style={estilos.halo} /> : null}
                    <View
                      style={[estilos.punto, (hecho || enCurso) && estilos.puntoVivo]}
                    />
                  </View>
                  <View style={[estilos.pasoTexto, ultimo && { paddingBottom: 0 }]}>
                    <Text
                      style={[
                        estilos.pasoTitulo,
                        !hecho && !enCurso && estilos.pasoTituloPorVenir,
                      ]}
                    >
                      {paso.titulo}
                    </Text>
                    <Text style={estilos.pasoDetalle}>{paso.detalle}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={estilos.nota}>
          <View style={estilos.notaIcono}>
            <Candado />
          </View>
          <Text style={estilos.notaTexto}>
            La foto del documento y el número nunca llegan a nuestros servidores.
          </Text>
        </View>

        <View style={estilos.beneficios}>
          <Epigrafe>Con la cédula verificada</Epigrafe>
          {LO_QUE_DA_LA_CEDULA.map((linea, i) => (
            <View
              key={linea}
              style={[estilos.beneficio, i < LO_QUE_DA_LA_CEDULA.length - 1 && estilos.beneficioPartido]}
            >
              <Text style={estilos.numero}>{i + 1}</Text>
              <Text style={estilos.beneficioTexto}>{linea}</Text>
            </View>
          ))}
        </View>
      </View>
      </ScrollView>

      <View style={estilos.pie}>
        {datos.estado === 'pendiente' ? (
          <>
            <Boton desactivado={abriendo} alPulsar={empezar}>
              {abriendo ? 'Abriendo…' : 'Verificar mi cédula'}
            </Boton>
            <Text style={estilos.notaPie}>Se hace una sola vez, y toma unos minutos.</Text>
          </>
        ) : datos.estado === 'rechazada' ? (
          <>
            <Boton desactivado={abriendo} alPulsar={empezar}>
              {abriendo ? 'Abriendo…' : 'Intentar otra vez'}
            </Boton>
            <Text style={estilos.notaPie}>Con buena luz y el documento completo en el marco.</Text>
          </>
        ) : (
          <>
            <Boton alPulsar={mirarYDecir}>Ver el estado otra vez</Boton>
            <Text style={estilos.notaPie}>
              {datos.estado === 'verificada'
                ? 'Ya puedes publicar viajes.'
                : 'Te avisamos en cuanto llegue el resultado.'}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

/** El candado del traspaso. No está en `@/ui/iconos` y no se tocan desde aquí. */
function Candado({ tamano = 19, tinta = color.azul500 }: { tamano?: number; tinta?: string }) {
  return (
    <Svg viewBox="0 0 24 24" width={tamano} height={tamano} fill="none">
      <Path
        d="M6 11h12v9H6z"
        stroke={tinta}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 11V8a3 3 0 0 1 6 0v3"
        stroke={tinta}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: color.sand100,
    maxWidth: espacio.marco,
    width: '100%',
    alignSelf: 'center',
  },

  cabecera: { paddingHorizontal: espacio.gutter },
  filaCabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* Números limpios. Los de antes —27/30,24 con −1,176 de tracking— venían
     de calcar una maqueta píxel a píxel: un cuerpo de 27 con interlínea 30
     aprieta las dos líneas hasta tocarse, y ese tracking cierra las letras.
     La escala del sistema es 26/31. */
  titular: {
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: -0.9,
    fontWeight: '700',
    color: color.ink400,
    marginTop: 14,
    fontFamily: familia,
  },
  titularFuerte: { color: color.ink900 },

  /* Sin `flex: 1` ni `overflow: 'hidden'`: quien desplaza es el ScrollView.
     El hueco de abajo deja sitio al pie fijo. */
  cuerpo: { paddingTop: 22, paddingHorizontal: espacio.gutter, paddingBottom: 130 },

  tarjeta: {
    backgroundColor: color.blanco,
    borderRadius: radio.hoja,
    paddingHorizontal: 18,
    paddingVertical: 16,
    ...sombra.hoja,
  },

  filaEstado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: color.bordeSutil,
  },
  estado: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: -0.3,
    fontWeight: '600',
    color: color.ink900,
    fontFamily: familia,
  },
  /* El punto iba en absoluto con un `paddingLeft: 12` en el texto para
     dejarle sitio: dos números que tenían que cuadrar a mano. Una fila con
     su hueco hace lo mismo y no se descuadra. */
  insignia: {
    height: 28,
    borderRadius: radio.pastilla,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  insigniaPunto: { width: 6, height: 6, borderRadius: 3 },
  insigniaTexto: {
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '600',
    fontFamily: familia,
  },

  /* EL RIEL. Todo sale de un centro: el punto mide 10 y su centro cae a 11
     del borde de arriba —la mitad de la primera línea de texto, 15/21—, el
     halo se centra ahí mismo, y la línea arranca justo debajo del punto y
     baja 3 px más allá del renglón para tocar el punto siguiente. */
  pasos: { paddingTop: 14 },
  paso: { flexDirection: 'row', gap: 12 },
  riel: { width: 22, alignItems: 'center' },
  rielLinea: {
    position: 'absolute',
    top: 19,
    bottom: -3,
    width: 1.5,
    borderRadius: 1,
    backgroundColor: color.ink200,
  },
  rielLineaHecha: { backgroundColor: color.rojo300 },
  halo: {
    position: 'absolute',
    top: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: color.rojo100,
  },
  punto: {
    marginTop: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: color.blanco,
    borderWidth: 2,
    borderColor: color.ink200,
  },
  puntoVivo: { backgroundColor: color.rojo500, borderColor: color.rojo500 },
  pasoTexto: { flex: 1, paddingBottom: 16 },
  pasoTitulo: {
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: -0.25,
    fontWeight: '600',
    color: color.ink900,
    fontFamily: familia,
  },
  pasoTituloPorVenir: { fontWeight: '500', color: color.ink500 },
  pasoDetalle: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: color.ink500,
    fontFamily: familia,
  },

  nota: {
    marginTop: espacio.entreTarjetas,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    backgroundColor: color.azul50,
    borderWidth: 1,
    borderColor: color.azul100,
    borderRadius: radio.l,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  notaIcono: { width: 19, height: 19, marginTop: 1 },
  notaTexto: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: color.ink700,
    fontFamily: familia,
  },

  /* Los beneficios en su propia hoja blanca, como todo lo demás: sueltos
     sobre el lienzo parecían texto olvidado al final de la pantalla. */
  beneficios: {
    marginTop: espacio.entreTarjetas,
    backgroundColor: color.blanco,
    borderRadius: radio.hoja,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 4,
    ...sombra.s,
  },
  beneficio: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12 },
  beneficioPartido: { borderBottomWidth: 1, borderBottomColor: color.bordeSutil },
  numero: {
    width: 18,
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '700',
    color: color.rojo600,
    fontFamily: familia,
    ...tabular,
  },
  beneficioTexto: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    color: color.ink900,
    fontFamily: familia,
  },

  pie: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: 9,
    backgroundColor: color.blanco,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
    paddingTop: 16,
    paddingHorizontal: espacio.gutter,
    paddingBottom: 26,
    /* La tinta del sistema, no un gris azulado suelto. */
    shadowColor: '#0A2731',
    shadowOpacity: 0.1,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: -10 },
    elevation: 10,
  },
  notaPie: {
    textAlign: 'center',
    fontSize: 12.5,
    lineHeight: 17,
    color: color.ink500,
    fontFamily: familia,
  },
});
