/**
 * `8a` Ajustes — avisos, viaje, dinero y cuenta. En ese orden.
 *
 * El orden no es alfabético ni de importancia declarada: es el de cuánto sale
 * de la app. Los avisos son lo único que te alcanza con el teléfono en el
 * bolsillo, así que van primero y en la única hoja que monta sobre el campo
 * rojo —por eso lleva radio de hoja y sombra teñida, y no borde—. Debajo va lo
 * que cambia lo que ves al buscar, y al final lo que se toca una vez al año,
 * ya en arena, en tarjetas de borde y sin sombra.
 *
 * Un interruptor dice sí o no y se queda donde está; una fila con galón lleva
 * a otra pantalla. Son dos gestos distintos y por eso no se mezclan dentro de
 * una misma tarjeta. La cédula no lleva galón: es un estado, no un destino, y
 * se enseña en pastilla verde.
 *
 * «Cerrar sesión» es lo único destructivo de la pantalla: borde rojo y texto
 * rojo, nunca relleno, y fuera de las tarjetas para que no se toque por
 * inercia al terminar de bajar la lista.
 */

import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { type Href, useRouter } from 'expo-router';

import { useVolver } from '@/ui/salidas';

import { type Cuenta, type GrupoDeAjustes, ajustes, cuenta } from '@/servicios/ajustes';
import { salir } from '@/servicios/cuenta';
import { type EstadoDeCedula, estadoDeCedula } from '@/servicios/seguridad';
import { useMiIdOEntrar } from '@/servicios/sesion';
import { type MiCiudad, guardarMiCiudad, miCiudad } from '@/servicios/miCiudad';
import { ElegirCiudad } from '@/ui/ElegirCiudad';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { CampoRojo } from '@/ui/CampoRojo';
import { tabular } from '@/ui/dinero';
import { Atras } from '@/ui/iconos';
import { color, espacio, familia, radio, sombra, texto } from '@/ui/tokens';

/** Sin sesión que preguntar —solo en simulado—, el mismo perfil que abre `6a`. */
const DEL_RECORRIDO = '11111111-1111-4111-8111-111111111111';

/** `--radius-sheet` son 28 px; `radio.hoja` se quedó en 26. Manda el traspaso. */
const RADIO_HOJA = 28;

/* Los interruptores se fueron el 27-08-2026 y con ellos `FilaDePalanca`: no
   queda ninguno en la pantalla. `servicios/preferencias` sigue vivo — la
   búsqueda lee `soloMujeres` donde se busca —, sólo que no se cambia aquí. */
/** El relleno que el traspaso da a cada fila de «Dinero y cuenta». */
const RELLENO_DINERO = [10, 11, 11];

/** Qué color le toca a cada estado de la cédula. Ver `estilos.insignia`. */
function tonoDeEstado(valor: string | null | undefined): { fondo: string; tinta: string } {
  const v = (valor ?? '').toLowerCase();
  if (v.includes('verificad')) return { fondo: color.hechoFondo, tinta: color.hechoTinta };
  if (v.includes('revisión') || v.includes('revision'))
    return { fondo: color.esperaFondo, tinta: color.esperaTinta };
  return { fondo: color.sand300, tinta: color.ink600 };
}

export default function Ajustes() {
  const router = useRouter();
  const volver = useVolver('/(cuenta)/cuenta');
  const yo = useMiIdOEntrar(DEL_RECORRIDO);
  const [grupos, setGrupos] = useState<GrupoDeAjustes[] | null>(null);
  const [quien, setQuien] = useState<Cuenta | null>(null);
  const [cedula, setCedula] = useState<EstadoDeCedula | null>(null);

  const [ciudad, setCiudad] = useState<MiCiudad | null>(null);
  const [eligiendoCiudad, setEligiendoCiudad] = useState(false);
  useEffect(() => {
    miCiudad(yo).then(setCiudad);
  }, [yo]);

  useEffect(() => {
    if (!yo) return;
    Promise.all([ajustes(yo), cuenta(yo), estadoDeCedula(yo)]).then(([g, c, v]) => {
      setGrupos(g);
      setQuien(c);
      setCedula(v);
    });
  }, [yo]);

  if (!grupos || !quien || !cedula) return <Cargando />;

  // El servicio promete los tres grupos en este orden, y ese orden es la
  // pantalla: cambiarlo allí cambia esto, que es lo que queremos.
  const [viaje, dinero, salida] = grupos;

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={196} />
      <BarraDeEstado />

      {/* TODA LA PANTALLA DESLIZA — y hasta hoy NO DESLIZABA NADA. Esta era
          la única pantalla larga de la app sin `ScrollView`: la tarjeta de
          «Dinero y cuenta» y el «Cerrar sesión» quedaban cortados contra el
          borde de abajo, sin forma de llegar a ellos. En un teléfono corto,
          cerrar sesión era imposible. Visto por el dueño el 26-08-2026. */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >

      <View style={estilos.cabecera}>
        <View style={estilos.filaVolver}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={() => volver()}
            style={estilos.volver}
          >
            <Atras tamano={20} />
          </Pressable>
          <Text style={estilos.epigrafeCampo}>
            {`${quien.nombre} ${quien.apellido} · Cuenta`}
          </Text>
        </View>
        <Text style={estilos.titular}>Ajustes</Text>
      </View>

      <View style={estilos.cuerpo}>
        {/* **LA HOJA DE AVISOS SE FUE** (27-08-2026, pedido del dueño): «Tus
            avisos» no es un ajuste, es la bandeja, y ya está a un toque en la
            campana del inicio. «Rutas guardadas» se mudó a Mis viajes, que es
            de lo que son. Lo primero de la pantalla es ahora lo primero que
            de verdad se cambia aquí: de dónde sales. */}
        <View style={estilos.hoja}>
          <Text style={estilos.epigrafe}>{viaje.titulo}</Text>
          <Text style={estilos.resumen}>Lo que cambia lo que ves al buscar</Text>

          {/* De dónde sales normalmente (0043). Se pregunta en el inicio, pero
              tiene que poder cambiarse desde algún sitio fijo: allí el enlace
              «Cambiar» sólo aparece cuando hay salidas desde tu ciudad, así
              que quien elige un pueblo sin viajes se quedaba encerrado. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              ciudad ? `Salgo de ${ciudad.nombre}. Cambiar` : 'Decir de qué ciudad salgo'
            }
            onPress={() => setEligiendoCiudad(true)}
            style={[estilos.filaDato, { paddingTop: 11, paddingBottom: 11 }]}
          >
            <Text style={estilos.filaDatoEtiqueta}>Salgo de</Text>
            <Text style={estilos.filaDatoValor}>{ciudad?.nombre ?? 'Sin decir'}</Text>
            <Adelante />
          </Pressable>

          {/* **«Solo mujeres» y «Compartir mi llegada» se fueron** el
              27-08-2026, y las dos por la misma razón: prometían algo que la
              app no hace. «Solo mujeres» filtraba una búsqueda que ya se
              filtra donde se busca —y sólo se ofrece a conductoras (0045)—;
              «Compartir mi llegada» no comparte con nadie porque no hay a
              quién mandarlo. Un interruptor que no enciende nada es peor que
              no tenerlo. */}
          {viaje.filas.map((fila, i) => (
            <Pressable
              key={fila.etiqueta}
              accessibilityRole="button"
              accessibilityLabel={fila.valor ? `${fila.etiqueta}, ${fila.valor}` : fila.etiqueta}
              onPress={fila.ruta ? () => router.push(fila.ruta as Href) : undefined}
              style={[
                estilos.filaDato,
                { paddingTop: 11, paddingBottom: i === viaje.filas.length - 1 ? 0 : 11 },
              ]}
            >
              <Text style={estilos.filaDatoEtiqueta}>{fila.etiqueta}</Text>
              {fila.valor ? <Text style={estilos.filaDatoValor}>{fila.valor}</Text> : null}
              <Adelante />
            </Pressable>
          ))}
        </View>

        <View style={estilos.tarjeta}>
          <Text style={[estilos.epigrafe, { marginBottom: 10 }]}>{dinero.titulo}</Text>

          {dinero.filas.map((fila, i) => {
            // La cédula es la única que enseña un estado en vez de un dato: la
            // reconocemos porque su valor es el que da el servicio de seguridad.
            const esEstado = fila.valor != null && fila.valor === cedula.etiqueta;
            const ultima = i === dinero.filas.length - 1;
            const relleno = RELLENO_DINERO[i] ?? 11;

            return (
              <Pressable
                key={fila.etiqueta}
                accessibilityRole={esEstado ? 'text' : 'button'}
                accessibilityLabel={fila.valor ? `${fila.etiqueta}, ${fila.valor}` : fila.etiqueta}
                disabled={esEstado}
                onPress={fila.ruta ? () => router.push(fila.ruta as Href) : undefined}
                style={[
                  estilos.filaDato,
                  { paddingTop: relleno, paddingBottom: ultima ? 0 : relleno },
                ]}
              >
                <Text style={estilos.filaDatoEtiqueta}>{fila.etiqueta}</Text>

                {esEstado ? (
                  // El punto se sienta en el hueco que la etiqueta reserva a su
                  // izquierda: así la pastilla mide lo que mide en el traspaso.
                  <View style={[estilos.insignia, { backgroundColor: tonoDeEstado(fila.valor).fondo }]}>
                    <View
                      style={[estilos.punto, { backgroundColor: tonoDeEstado(fila.valor).tinta }]}
                    />
                    <Text
                      style={[estilos.insigniaTexto, { color: tonoDeEstado(fila.valor).tinta }]}
                    >
                      {fila.valor}
                    </Text>
                  </View>
                ) : (
                  <>
                    {fila.valor ? <Text style={estilos.filaDatoValor}>{fila.valor}</Text> : null}
                    <Adelante />
                  </>
                )}
              </Pressable>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={salida.filas[0].etiqueta}
          // Cerrar sesión deja la app como recién instalada, no en la puerta
          // de mitad de recorrido: sin sesión no hay viaje detrás que mirar.
          // Primero se cierra de verdad; navegar sin cerrarla dejaba la sesión
          // abierta y volver atrás te devolvía dentro.
          onPress={async () => {
            await salir();
            router.replace('/(cuenta)/apertura');
          }}
          style={({ pressed }) => [estilos.cerrar, pressed && { backgroundColor: color.rojo50 }]}
        >
          <Text style={estilos.cerrarTexto}>{salida.filas[0].etiqueta}</Text>
        </Pressable>
      </View>
      </ScrollView>

      <ElegirCiudad
        abierto={eligiendoCiudad}
        yo={yo}
        actual={ciudad}
        alElegir={(c) => {
          setEligiendoCiudad(false);
          setCiudad(c);
          if (yo) guardarMiCiudad(yo, c.id).catch(() => {});
        }}
        alCerrar={() => setEligiendoCiudad(false)}
      />
    </View>
  );
}

/** El galón de «lleva a otra pantalla». No está en `@/ui/iconos`. */
function Adelante() {
  return (
    <Svg viewBox="0 0 24 24" width={17} height={17} fill="none">
      <Path
        d="M9 5l7 7-7 7"
        stroke={color.ink400}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
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

  cabecera: { paddingTop: 6, paddingHorizontal: espacio.gutter },
  filaVolver: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  volver: {
    width: espacio.controlS,
    height: espacio.controlS,
    borderRadius: radio.pastilla,
    backgroundColor: color.campoControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  epigrafeCampo: { ...texto.epigrafe, color: color.campoTexto },
  // Ceñido al texto, como el titular del traspaso: si se estira, se descentra.
  /**
   * **ERA BLANCO SOBRE EL LIENZO CLARO: 1,08:1.** El título de la pantalla,
   * a 33 px, invisible. Resto del campo rojo héroe que el sistema v6 retiró
   * —allí el titular iba en blanco sobre la banda roja—; al quitar la banda,
   * la pantalla se quedó con un encabezado que no se ve (29-08-2026).
   */
  titular: {
    fontSize: 33,
    lineHeight: 34.65,
    letterSpacing: -1.32,
    fontWeight: '600',
    color: color.ink900,
    marginTop: 14,
    alignSelf: 'flex-start',
    fontFamily: familia,
  },

  cuerpo: { flex: 1, overflow: 'hidden', paddingTop: 20, paddingHorizontal: espacio.gutter, gap: 11 },

  hoja: {
    backgroundColor: color.blanco,
    borderRadius: RADIO_HOJA,
    padding: 18,
    ...sombra.hoja,
  },
  tarjeta: {
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    padding: 18,
  },
  epigrafe: { ...texto.epigrafe, color: color.azul500 },
  resumen: {
    fontSize: 12.5,
    lineHeight: 18.125,
    color: color.ink600,
    marginTop: 3,
    marginBottom: 4,
    alignSelf: 'flex-start',
    fontFamily: familia,
  },

  filaDato: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: espacio.tap,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  filaDatoEtiqueta: {
    flex: 1,
    fontSize: 15.5,
    lineHeight: 21.75,
    fontWeight: '500',
    letterSpacing: -0.225,
    color: color.ink900,
    fontFamily: familia,
  },
  filaDatoValor: {
    fontSize: 13.5,
    lineHeight: 19.575,
    color: color.ink500,
    fontFamily: familia,
    ...tabular,
  },

  /**
   * EL COLOR SIGUE AL ESTADO, no al revés. La pastilla estaba clavada en
   * verde —la tinta de «hecho»— y enseñaba «Pendiente» en verde: el color
   * decía una cosa y la palabra la contraria, y el color se lee primero.
   * Ahora los tres estados que puede dar `seguridad` tienen el suyo:
   * verificada en verde, en revisión en el oro de esperar, y rechazada o
   * pendiente en gris, que es no saber nada todavía.
   */
  insignia: {
    height: 22,
    borderRadius: radio.pastilla,
    justifyContent: 'center',
  },
  punto: {
    position: 'absolute',
    left: 8,
    top: 8,
    width: 6,
    height: 6,
    borderRadius: radio.pastilla,
    backgroundColor: color.hechoTinta,
    opacity: 0.85,
  },
  insigniaTexto: {
    paddingLeft: 20,
    paddingRight: 8,
    fontSize: 11.5,
    lineHeight: 15.95,
    fontWeight: '500',
    letterSpacing: -0.055,
    color: color.hechoTinta,
    fontFamily: familia,
  },

  cerrar: {
    height: 52,
    borderRadius: radio.pastilla,
    borderWidth: 1.5,
    borderColor: color.rojo300,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cerrarTexto: {
    fontSize: 15.5,
    lineHeight: 22.475,
    fontWeight: '600',
    letterSpacing: -0.2325,
    color: color.rojo700,
    fontFamily: familia,
  },
});
