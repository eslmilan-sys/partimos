/**
 * `6a` Tu perfil — quién eres y qué puedes tocar.
 *
 * ── La maqueta del 31-08-2026 ────────────────────────────────────────────
 *
 * El dueño mandó una maqueta y dijo «apply this exact same page». Lo que
 * cambia respecto de lo que había, y por qué cada cosa está donde está:
 *
 * · **La foto manda.** Avatar grande con su insignia de verificado encima,
 *   el nombre con la pastilla verde al lado, y debajo dos líneas: desde
 *   cuándo estás y de dónde eres. Es el orden en que te mira quien va a
 *   subirse a tu carro.
 * · **Las tres cifras van en una tarjeta de tinta**, no sueltas sobre la
 *   arena. Sobre oscuro pesan lo que son —lo único de esta pantalla que el
 *   otro ve— y los dos filetes verticales las separan sin cajas.
 * · **«Mi cuenta» rotula la lista.** Antes las filas empezaban sin decir de
 *   qué eran, pegadas a una tarjeta de dinero.
 * · **Ajustes sube al engranaje** de arriba a la derecha. Era la primera
 *   fila de la lista por pedido del 26-08 —«Ajustes should be on top»— y
 *   arriba del todo es más arriba todavía; además deja la lista para lo que
 *   de verdad es tuyo: tu verificación, tus viajes, tu carro, tu dinero.
 *
 * **Tres cosas de la maqueta NO se copiaron, y son decisiones, no olvidos:**
 *
 * 1. **El bloque «Resumen de tu aporte» (35 kg de CO₂) se fue** — lo pidió
 *    el dueño en el mismo mensaje. No teníamos ese dato ni cómo calcularlo
 *    honestamente, y una cifra ambiental inventada es exactamente el tipo de
 *    promesa que este producto no hace.
 * 2. **«Invita y gana · Gana B/.2.00 por cada amigo que viaje» no se puede
 *    escribir.** R5 prohíbe «gana dinero» en la interfaz, y aquí no era una
 *    forma de hablar: era un pago por referido, que convertiría a cada
 *    usuario en comisionista de una plataforma que no cobra comisiones. El
 *    bloque se queda en el mismo sitio y con el mismo peso, diciendo lo que
 *    sí es verdad: **comparte la app y su enlace**.
 * 3. **El botón de escanear (arriba, junto al engranaje) no existe.** No hay
 *    nada que escanear en este producto. Un control muerto es el peor
 *    defecto de este repositorio —`REVISION.md` lo pone el primero de la
 *    lista—, así que se dibuja sólo el engranaje.
 *
 * Y una fila que la maqueta no trae pero que se queda: **«Ayuda y
 * contacto»**. Sin ella no hay ninguna puerta a la ayuda desde el perfil, y
 * el dueño la pidió expresamente el 29-08 con su correo al final.
 */

import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { useDecir } from '@/ui/Nota';
import { DIJO, compartir, direccionDeLaApp } from '@/ui/salidas';

import { type Cuenta, cuenta } from '@/servicios/ajustes';
import { enTexto } from '@/dominio/notas';
import { salir } from '@/servicios/cuenta';
import { useMiIdOEntrar } from '@/servicios/sesion';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { Cargando } from '@/ui/Cargando';
import { CampoRojo } from '@/ui/CampoRojo';
import { NoEsta } from '@/ui/NoEsta';
import { Pestanas } from '@/ui/Pestanas';
import { formatearDineroRedondo, tabular } from '@/ui/dinero';
import {
  Avanza,
  Ayuda,
  Billete,
  Carro,
  Cartera,
  Cedula,
  Engranaje,
  Escudo,
  Estrella,
  Pin,
  Regalo,
  Ruta,
  Salir,
  Visto,
} from '@/ui/iconos';
import { TRACK_MICRO, color, espacio, familia, interlinea, radio, sombra } from '@/ui/tokens';

/** Sin sesión que preguntar —solo en simulado—, el conductor del traspaso. */
const DEL_RECORRIDO = '11111111-1111-4111-8111-111111111111';

export default function TuCuenta() {
  const router = useRouter();
  const decir = useDecir();
  const yo = useMiIdOEntrar(DEL_RECORRIDO);
  const [datos, setDatos] = useState<Cuenta | null>(null);
  const [noEsta, setNoEsta] = useState(false);

  useEffect(() => {
    if (!yo) return;
    cuenta(yo)
      .then(setDatos)
      .catch(() => setNoEsta(true));
  }, [yo]);

  if (noEsta)
    return (
      <NoEsta
        titulo="No encontramos ese perfil"
        explicacion="La cuenta pudo cerrarse, o el enlace es de otra persona."
      />
    );
  if (!datos) return <Cargando />;

  /**
   * LO QUE EL OTRO VE ANTES DE SUBIRSE — las tres cifras, en la tarjeta de
   * tinta. La nota se calla mientras no haya ninguna: «sin nota» no es un
   * defecto de quien acaba de entrar, y escribir un 0 sería mentir.
   */
  const loQueVen = [
    { valor: String(datos.viajes), etiqueta: datos.viajes === 1 ? 'Viaje' : 'Viajes' },
    {
      valor: datos.calificacion == null ? '—' : enTexto(datos.calificacion),
      etiqueta: datos.calificacion == null ? 'Sin nota' : 'Calificación',
      estrella: datos.calificacion != null,
    },
    {
      valor: datos.verificado ? 'Verificada' : 'Pendiente',
      etiqueta: 'Cédula',
    },
  ];

  /**
   * LAS FILAS DE «MI CUENTA», Y TODAS LLEVAN A ALGUNA PARTE.
   *
   * Cada una con su valor a la derecha cuando lo tiene: «Sin carro» invita a
   * entrar, un hueco no.
   */
  const filas: {
    etiqueta: string;
    debajo: string;
    valor?: string | null;
    pastilla?: boolean;
    icono: React.ReactNode;
    alPulsar: () => void;
  }[] = [
    {
      etiqueta: 'Verificación',
      debajo: datos.verificado ? 'Tu cédula está al día' : 'Sin esto no publicas',
      valor: datos.verificado ? 'Completada' : 'Pendiente',
      pastilla: true,
      icono: <Cedula />,
      alPulsar: () => router.push('/(conductor)/cedula'),
    },
    {
      etiqueta: 'Mis viajes',
      debajo: 'Los que vienen y los pasados',
      icono: <Ruta />,
      alPulsar: () => router.push('/(conductor)/misviajes'),
    },
    {
      etiqueta: 'Mi carro',
      debajo: datos.carro ?? 'Todavía no registraste ninguno',
      icono: <Carro tamano={20} />,
      alPulsar: () => router.push('/(conductor)/carro'),
    },
    /* **AQUÍ VIVE EL DINERO AHORA.** Era una tarjeta suelta encima de la
       lista —«Lo que has recuperado · B/0» con su botón— y en la maqueta ese
       sitio lo ocupaba el bloque del CO₂, que se va. Como fila con su cifra a
       la derecha dice lo mismo en un renglón y abre el mismo detalle. */
    {
      etiqueta: 'Lo que te han aportado',
      debajo: 'Viaje por viaje',
      valor: formatearDineroRedondo(datos.recuperadoCentavos),
      icono: <Cartera />,
      alPulsar: () => router.push('/(conductor)/aportes'),
    },
    {
      etiqueta: 'Cómo se aporta',
      debajo: 'Tu método de siempre',
      valor: datos.metodo,
      icono: <Billete />,
      alPulsar: () => router.push('/(pasajero)/metodos'),
    },
    {
      etiqueta: 'Cómo te cuidamos',
      debajo: 'Notas, verificación y emergencias',
      icono: <Escudo tamano={20} tinta={color.ink500} />,
      alPulsar: () => router.push('/(ayuda)/seguridad'),
    },
    {
      etiqueta: 'Ayuda y contacto',
      debajo: 'Cómo se hacen las cosas',
      icono: <Ayuda tamano={20} />,
      alPulsar: () => router.push('/(ayuda)'),
    },
  ];

  const enlace = direccionDeLaApp();

  return (
    <View style={estilos.pantalla}>
      <BarraDeEstado />

      {/* TODA LA PANTALLA DESLIZA, no solo el cuerpo: en el teléfono se siente
          como una app y no como una cabecera clavada. Solo la barra de estado
          —y la de pestañas— quedan fijas. */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <CampoRojo altura={250} motivo="mapa" />

        <View style={estilos.cabecera}>
          {/* El engranaje, solo. Ver la nota 3 de la cabecera del archivo:
              el botón de escanear de la maqueta no tiene nada que escanear. */}
          <View style={estilos.filaAcciones}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ajustes"
              onPress={() => router.push('/(cuenta)/ajustes')}
              style={({ pressed }) => [estilos.botonRedondo, pressed && estilos.pulsada]}
            >
              <Engranaje />
            </Pressable>
          </View>

          <View style={estilos.filaPersona}>
            <View style={estilos.avatar}>
              <Text style={estilos.avatarTexto}>{datos.iniciales}</Text>
              {/* La insignia sobre la foto, como la lleva cualquier perfil
                  que se ha verificado: se ve antes de leer el nombre. */}
              {datos.verificado ? (
                <View style={estilos.insignia}>
                  <Visto tamano={11} tinta="#fff" />
                </View>
              ) : null}
            </View>

            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={estilos.filaNombre}>
                <Text style={estilos.nombre} numberOfLines={1}>
                  {`${datos.nombre} ${datos.apellido}`.trim()}
                </Text>
                {datos.verificado ? (
                  <View style={estilos.pastillaVerde}>
                    <Escudo tamano={13} tinta={color.hechoTinta} />
                    <Text style={estilos.pastillaVerdeTexto}>Verificado</Text>
                  </View>
                ) : null}
              </View>

              {/* Los kilómetros van junto al nombre y no en una columna: son
                  lo que has recorrido acompañado, la única cifra de esta
                  pantalla que se puede presumir. Con cero se callan. */}
              <Text style={estilos.desde}>
                {`Miembro desde ${datos.desde}`}
                {datos.kilometros > 0 ? ` · ${conMiles(datos.kilometros)} km juntos` : ''}
              </Text>

              {datos.ciudad ? (
                <View style={estilos.filaCiudad}>
                  <Pin tamano={13} tinta={color.ink500} />
                  <Text style={estilos.ciudad} numberOfLines={1}>
                    {datos.ciudad}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={estilos.contenido}>
          {/* LA TARJETA DE TINTA. Se pulsa entera y abre la verificación, que
              es la columna donde está el chevrón. El 27-08 se decidió que la
              tarjeta del dinero NO se pulsara —«se toca sin querer al
              desplazar»—; aquella abría una cosa distinta de la que enseñaba,
              y ésta abre justo lo que dice su tercera columna. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${datos.viajes} viajes, ${
              datos.calificacion == null ? 'sin nota' : `nota ${enTexto(datos.calificacion)}`
            }, cédula ${datos.verificado ? 'verificada' : 'pendiente'}. Ver la verificación`}
            onPress={() => router.push('/(conductor)/cedula')}
            style={({ pressed }) => [estilos.tarjetaTinta, pressed && { opacity: 0.92 }]}
          >
            {loQueVen.map((v, i) => (
              <View key={v.etiqueta} style={estilos.columnaTinta}>
                {i > 0 ? <View style={estilos.filete} /> : null}
                <View style={estilos.columnaDentro}>
                  <View style={estilos.filaValorTinta}>
                    {v.estrella ? <Estrella tamano={13} tinta="#fff" /> : null}
                    <Text style={[estilos.valorTinta, tabular]} numberOfLines={1}>
                      {v.valor}
                    </Text>
                  </View>
                  <Text style={estilos.etiquetaTinta} numberOfLines={1}>
                    {v.etiqueta}
                  </Text>
                </View>
              </View>
            ))}
            <Avanza tamano={17} tinta="rgba(255,255,255,.55)" />
          </Pressable>

          <Text style={estilos.rotuloSeccion}>Mi cuenta</Text>

          <View style={estilos.lista}>
            {filas.map((f, i) => (
              <Pressable
                key={f.etiqueta}
                accessibilityRole="button"
                accessibilityLabel={f.valor ? `${f.etiqueta}, ${f.valor}` : f.etiqueta}
                onPress={f.alPulsar}
                style={({ pressed }) => [
                  estilos.fila,
                  i < filas.length - 1 && estilos.filaConLinea,
                  pressed && estilos.pulsada,
                ]}
              >
                <View style={estilos.cuadroIcono}>{f.icono}</View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={estilos.filaEtiqueta} numberOfLines={1}>
                    {f.etiqueta}
                  </Text>
                  <Text style={estilos.filaDebajo} numberOfLines={1}>
                    {f.debajo}
                  </Text>
                </View>
                {f.valor && f.pastilla ? (
                  <View style={[estilos.pastillaFila, !datos.verificado && estilos.pastillaTibia]}>
                    <Text
                      style={[
                        estilos.pastillaFilaTexto,
                        !datos.verificado && estilos.pastillaTibiaTexto,
                      ]}
                    >
                      {f.valor}
                    </Text>
                  </View>
                ) : f.valor ? (
                  <Text style={[estilos.filaValor, tabular]} numberOfLines={1}>
                    {f.valor}
                  </Text>
                ) : null}
                <Avanza />
              </Pressable>
            ))}
          </View>

          {/* **COMPARTIR, NO «GANAR».** Ver la nota 2 de la cabecera. El sitio
              y el peso son los de la maqueta; lo que promete, no. Y lo que
              ofrece es cierto: en una app de viajes compartidos, un amigo más
              publicando es un viaje más para todos — que es exactamente el
              problema que tiene hoy este producto. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Compartir Partimos con un amigo"
            onPress={() =>
              compartir(
                `Te comparto Partimos: para bajar al interior compartiendo el carro y los gastos, sin terminal.${
                  enlace ? ` ${enlace}` : ''
                }`,
              ).then((c) => decir(DIJO[c]))
            }
            style={({ pressed }) => [estilos.comparte, pressed && { opacity: 0.9 }]}
          >
            <View style={estilos.cuadroRegalo}>
              <Regalo tamano={21} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={estilos.comparteTitulo}>Comparte Partimos</Text>
              <Text style={estilos.comparteTexto}>
                Un amigo más publicando es un viaje más para todos.
              </Text>
            </View>
            <Text style={estilos.comparteAccion}>Compartir</Text>
            <Avanza tinta={color.rojo600} />
          </Pressable>

          {/* **CERRAR SESIÓN NO ES LO QUE SE VIENE A HACER AQUÍ**, y era el
              control más fuerte de la pantalla: 56 px de alto, a todo el
              ancho, con borde rojo. El rojo tiene cuatro sentidos en este
              sistema y salir no es ninguno. Se queda al final, en voz baja. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            onPress={async () => {
              await salir();
              router.replace('/(cuenta)/apertura');
            }}
            style={({ pressed }) => [estilos.cerrar, pressed && { backgroundColor: color.rojo50 }]}
          >
            <Salir tamano={17} tinta={color.ink600} />
            <Text style={estilos.cerrarTexto}>Cerrar sesión</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Pestanas valor="Perfil" yo={yo} />
    </View>
  );
}

/** Miles con espacio duro: en español los kilómetros se separan así, sin punto. */
const conMiles = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: color.sand100,
    maxWidth: espacio.marco,
    width: '100%',
    alignSelf: 'center',
  },

  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 4 },
  filaAcciones: { flexDirection: 'row', justifyContent: 'flex-end' },
  botonRedondo: {
    width: 44,
    height: 44,
    borderRadius: radio.pastilla,
    backgroundColor: color.blanco,
    alignItems: 'center',
    justifyContent: 'center',
    ...sombra.s,
  },

  filaPersona: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 10 },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    /* `azul100` es casi el mismo tono que la arena de la página: el círculo
       de la foto desaparecía. `ink200` lo separa sin oscurecerlo. */
    backgroundColor: color.ink200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: {
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.6,
    color: color.ink900,
    fontFamily: familia,
  },
  insignia: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: color.verde500,
    borderWidth: 2.5,
    borderColor: color.sand100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filaNombre: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nombre: {
    flexShrink: 1,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.84,
    color: color.ink900,
    fontFamily: familia,
  },
  /* Verde de «hecho», el del sistema (`hechoFondo`/`hechoTinta`): la app ya
     lo usa para un estado cumplido, y un segundo verde para lo mismo son dos
     verdes que acaban divergiendo. */
  pastillaVerde: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radio.pastilla,
    backgroundColor: color.hechoFondo,
  },
  pastillaVerdeTexto: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: color.hechoTinta,
    fontFamily: familia,
  },
  desde: { fontSize: 13.5, lineHeight: 19, color: color.ink600, fontFamily: familia, marginTop: 4 },
  filaCiudad: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  ciudad: { fontSize: 13.5, lineHeight: 19, color: color.ink600, fontFamily: familia },

  contenido: { paddingHorizontal: espacio.gutter, paddingTop: 20, paddingBottom: 110 },

  /** Las tres cifras sobre tinta: lo único de esta pantalla que ve el otro. */
  tarjetaTinta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.ink900,
    borderRadius: radio.hoja,
    paddingVertical: 18,
    paddingLeft: 6,
    paddingRight: 14,
  },
  columnaTinta: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
  /** Un pelo de blanco, no una caja: separa sin dibujar tres recuadros. */
  filete: { width: 1, height: 38, backgroundColor: 'rgba(255,255,255,.16)' },
  columnaDentro: { flex: 1, minWidth: 0, alignItems: 'center', paddingHorizontal: 4 },
  filaValorTinta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  valorTinta: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    letterSpacing: -0.6,
    color: '#fff',
    fontFamily: familia,
  },
  etiquetaTinta: {
    fontSize: 12.5,
    lineHeight: 17,
    color: 'rgba(255,255,255,.72)',
    fontFamily: familia,
    marginTop: 2,
  },

  rotuloSeccion: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: color.ink900,
    fontFamily: familia,
    marginTop: 24,
    marginBottom: 10,
  },

  lista: {
    backgroundColor: color.blanco,
    borderRadius: radio.hoja,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    overflow: 'hidden',
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 13,
    paddingHorizontal: 15,
  },
  filaConLinea: { borderBottomWidth: 1, borderBottomColor: color.bordeSutil },
  pulsada: { backgroundColor: color.lavado },
  cuadroIcono: {
    width: 40,
    height: 40,
    borderRadius: radio.icono,
    backgroundColor: color.sand100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filaEtiqueta: {
    fontSize: 15.5,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.24,
    color: color.ink900,
    fontFamily: familia,
  },
  filaDebajo: { fontSize: 12.5, lineHeight: 18, color: color.ink600, fontFamily: familia },
  filaValor: { fontSize: 13.5, lineHeight: 19, color: color.ink600, fontFamily: familia },

  pastillaFila: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radio.pastilla,
    backgroundColor: color.hechoFondo,
  },
  pastillaFilaTexto: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: color.hechoTinta,
    fontFamily: familia,
  },
  /** Sin verificar no es un error: es algo por hacer. Ámbar, no rojo. */
  pastillaTibia: { backgroundColor: color.sand200 },
  pastillaTibiaTexto: { color: color.ink700 },

  comparte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginTop: 18,
    padding: 15,
    borderRadius: radio.hoja,
    backgroundColor: color.rojo50,
  },
  cuadroRegalo: {
    width: 40,
    height: 40,
    borderRadius: radio.icono,
    backgroundColor: color.rojo100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comparteTitulo: {
    fontSize: 15.5,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.24,
    color: color.ink900,
    fontFamily: familia,
  },
  comparteTexto: { fontSize: 12.5, lineHeight: 18, color: color.ink700, fontFamily: familia },
  comparteAccion: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '600',
    color: color.rojo700,
    fontFamily: familia,
  },

  cerrar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 22,
    height: 44,
    borderRadius: radio.control,
  },
  cerrarTexto: {
    fontSize: 14,
    lineHeight: interlinea(14),
    fontWeight: '500',
    letterSpacing: 14 * TRACK_MICRO,
    color: color.ink600,
    fontFamily: familia,
  },
});
