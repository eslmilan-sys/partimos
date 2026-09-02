/**
 * `6a` Tu perfil — quién eres y qué puedes tocar.
 *
 * ── La arquitectura del 31-08-2026 ───────────────────────────────────────
 *
 * Segunda vuelta sobre la maqueta, y el diagnóstico del dueño era el bueno:
 * **el problema no era el dibujo, era el inventario.** La lista tenía siete
 * filas donde caben cuatro, y varias llevaban a sitios que la barra de abajo
 * ya abre. Un perfil no es un segundo menú de navegación: es tu centro de
 * control personal.
 *
 * **Lo que se fue, y a dónde:**
 *
 * · «Mis viajes» → **la pestaña Viajes**, que está a un dedo en esta misma
 *   pantalla. Perfil → Mis viajes y barra → Viajes eran dos caminos al mismo
 *   sitio, dibujados a diez centímetros uno del otro.
 * · «Lo que te han aportado» y «Cómo se aporta» → **una sola fila, “Aportes
 *   y pagos”**, con el resumen en el subtítulo: «B/54 recibido · Yappy».
 *   Eran dos filas de dinero seguidas, y quien busca «dónde está mi plata»
 *   no sabe cuál de las dos abrir.
 * · «Ayuda y contacto» → **dentro de Ajustes**, que es donde se busca.
 * · «Cerrar sesión» → **sólo en Ajustes**. Estaba en las dos pantallas.
 *
 * Quedan cuatro: **verificación, carro, dinero y seguridad.** Las cuatro son
 * cosas TUYAS que sólo se administran desde aquí.
 *
 * Y el resto de lo que cambia:
 *
 * · **La foto manda.** Avatar grande con su insignia de verificado encima,
 *   el nombre con la pastilla verde al lado, y debajo dos líneas: desde
 *   cuándo estás y de dónde eres. Es el orden en que te mira quien va a
 *   subirse a tu carro.
 * · **Las tres cifras van en una tarjeta blanca y no se pulsan** (02-09-2026,
 *   auditoría de diseño). Eran una tarjeta de tinta con «Pendiente · Cédula
 *   y licencia» de tercera columna: un ESTADO disfrazado de estadística. La
 *   tinta pasa a la única tarjeta que pide algo —**la verificación**—, que
 *   dice qué falta, qué está hecho y trae el botón que antes no existía. Y
 *   verificado del todo, desaparece: no hay nada que hacer.
 * · **Editar perfil es un botón**, no un texto rojo suelto: la píldora
 *   blanca con borde de las acciones secundarias de la casa.
 * · **«Mi cuenta» rotula la lista.** Antes las filas empezaban sin decir de
 *   qué eran, pegadas a una tarjeta de dinero.
 * · **Ajustes se disolvió** (01-09-2026, pedido del dueño: «delete ajustes,
 *   those should be in menu; delete la rueda»). Se fue el engranaje, y con
 *   él la pantalla: al abrirla se veía que **no tenía ni una fila propia**.
 *   «Mi carro» y «Verificación» son dos de las cuatro de aquí; «Cómo se
 *   aporta» vive dentro de «Aportes y pagos»; «Mis datos» es esta misma
 *   cabecera; «Cómo te cuidamos» es la fila de Seguridad. Sólo quedaba
 *   «Cómo se hacen las cosas», que ahora es la segunda lista, y «Cerrar
 *   sesión», que vuelve abajo del todo. Un menú que sólo lleva a las
 *   puertas que ya están a la vista es una puerta de más.
 * · **La foto se pulsa y abre «Editar perfil»** (`6b`): tocar tu propia
 *   foto para cambiarla es el gesto que todo el mundo tiene aprendido. El
 *   botón de debajo lo dice con la palabra, para quien no lo adivina.
 * · **«Verificado» significa cédula Y licencia.** Con la cédula sola se
 *   viaja de pasajero; para llevar a alguien hace falta la licencia, y decir
 *   «verificado» sin ella promete lo que no se comprobó.
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
 *    usuario en comisionista de una plataforma que no cobra comisiones. En
 *    su sitio, **«Invita a tus amigos»** — y en voz baja, al final y sin
 *    fondo de color: es una acción de crecimiento secundaria, no la
 *    conclusión de tu perfil.
 * 3. **El botón de escanear (arriba, junto al engranaje) no existe.** No hay
 *    nada que escanear en este producto. Un control muerto es el peor
 *    defecto de este repositorio —`REVISION.md` lo pone el primero de la
 *    lista—, así que arriba a la derecha no se dibuja nada.
 *
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
import { NoEsta } from '@/ui/NoEsta';
import { Pestanas } from '@/ui/Pestanas';
import { formatearDineroRedondo, tabular } from '@/ui/dinero';
import {
  Avanza,
  Ayuda,
  Billete,
  Carro,
  Cedula,
  Compartir,
  Escudo,
  Estrella,
  Salir,
  Visto,
} from '@/ui/iconos';
import { TRACK_MICRO, color, espacio, familia, interlinea, radio } from '@/ui/tokens';

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
  const verificadoDeltodo = datos.verificado && datos.licenciaAlDia;

  /* TRES CIFRAS, y las tres son cifras (02-09-2026, auditoría: la tercera
     columna decía «Pendiente · Cédula y licencia» — un ESTADO disfrazado de
     estadística, y el único motivo por el que la tarjeta se pulsaba. La
     verificación tiene ahora su propia tarjeta, con su acción). */
  const loQueVen = [
    { valor: String(datos.viajes), etiqueta: datos.viajes === 1 ? 'Viaje' : 'Viajes' },
    {
      valor: datos.calificacion == null ? '—' : enTexto(datos.calificacion),
      etiqueta: datos.calificacion == null ? 'Sin nota' : 'Calificación',
      estrella: datos.calificacion != null,
    },
    { valor: conMiles(datos.kilometros), etiqueta: 'km juntos' },
  ];

  /**
   * LAS FILAS DE «MI CUENTA», Y TODAS LLEVAN A ALGUNA PARTE.
   *
   * Cada una con su valor a la derecha cuando lo tiene: «Sin carro» invita a
   * entrar, un hueco no.
   */
  /**
   * DOS LISTAS CORTAS, Y CADA UNA CONTESTA UNA PREGUNTA DISTINTA.
   *
   * «Mi cuenta» son las cuatro cosas TUYAS que sólo se administran desde
   * aquí. «Ayuda» es lo único que traía la pantalla de Ajustes y no estaba
   * ya en esta lista. Separarlas con su rótulo cuesta una línea y ahorra
   * leer cinco filas para encontrar la que no va con las otras.
   */
  type Fila = {
    etiqueta: string;
    debajo: string;
    pastilla?: string;
    icono: React.ReactNode;
    alPulsar: () => void;
  };

  const mias: Fila[] = [
    {
      etiqueta: 'Verificación',
      /* Corto, que a 390 px «Cédula lista · falta la lice…» se cortaba con
         puntos suspensivos justo en la palabra que importaba. */
      debajo: verificadoDeltodo
        ? 'Cédula y licencia listas'
        : datos.verificado
          ? 'Falta la licencia'
          : 'Falta la cédula',
      pastilla: verificadoDeltodo ? 'Completada' : 'Pendiente',
      /* La cédula y no un escudo: el escudo es de Seguridad, dos filas más
         abajo, y dos escudos en la misma lista no distinguen nada. */
      icono: <Cedula />,
      alPulsar: () => router.push('/(conductor)/cedula'),
    },
    {
      etiqueta: 'Mi carro',
      debajo: datos.carro ?? 'Añadir mi carro',
      icono: <Carro tamano={20} />,
      alPulsar: () => router.push('/(conductor)/carro'),
    },
    {
      /* UNA SOLA PUERTA AL DINERO, con el resumen en el subtítulo: cuánto te
         ha llegado y por dónde te llega. Eran dos filas seguidas —«Lo que te
         han aportado» y «Cómo se aporta»— y quien busca su plata no sabía
         cuál abrir. */
      etiqueta: 'Aportes y pagos',
      debajo: `${formatearDineroRedondo(datos.recuperadoCentavos)} recibido · ${datos.metodo}`,
      icono: <Billete />,
      alPulsar: () => router.push('/(conductor)/aportes'),
    },
    {
      /* «Contactos de confianza» no existe en este producto y la fila lo
         prometía. Lo que hay detrás es la pantalla de cómo te cuidamos, con
         el botón de llamar al 911 arriba del todo: eso es lo que dice. */
      etiqueta: 'Seguridad',
      debajo: 'Cómo te cuidamos y el 911',
      icono: <Escudo tamano={20} tinta={color.ink500} />,
      alPulsar: () => router.push('/(ayuda)/seguridad'),
    },
  ];

  /* Lo único de la difunta pantalla de Ajustes que no estaba ya arriba. */
  const ayuda: Fila[] = [
    {
      /* A SU PROPIA PANTALLA (01-09-2026, pedido del dueño): llevaba a la
         ayuda de incidencias, y quien toca «cómo funciona» no viene de un
         problema — viene a entender. Ahora abre el paso a paso. */
      etiqueta: 'Cómo funciona Partimos',
      debajo: 'El paso a paso, del puesto al aporte',
      icono: <Ayuda tamano={20} tinta={color.ink500} />,
      alPulsar: () => router.push('/(ayuda)/como'),
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
        {/* **EL ARMAZÓN V6, COMO LAS OTRAS TRES RAÍCES** (02-09-2026,
            rediseño pedido por el dueño). Buscar, Viajes y Chats ya hablan
            en fondo claro; Perfil era la única pestaña con campo rojo. */}
        <View style={estilos.cabecera}>
          <View style={estilos.filaPersona}>
            {/* Tocar la foto abre editar: el gesto que todo el mundo trae
                aprendido. Y abajo un botón que lo dice con la palabra. */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cambiar mi foto"
              onPress={() => router.push('/(cuenta)/editar')}
              style={estilos.avatar}
            >
              <Text style={estilos.avatarTexto}>{datos.iniciales}</Text>
              {datos.verificado ? (
                <View style={estilos.insignia}>
                  <Visto tamano={11} tinta="#fff" />
                </View>
              ) : null}
            </Pressable>

            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={estilos.nombre} numberOfLines={1}>
                {`${datos.nombre} ${datos.apellido}`.trim()}
              </Text>
              {/* Desde cuándo y de dónde: los kilómetros bajan a la tarjeta
                  de cifras, que es donde se comparan. */}
              <Text style={estilos.desde} numberOfLines={1}>
                {[`Miembro desde ${datos.desde}`, datos.ciudad].filter(Boolean).join(' · ')}
              </Text>
              {/* La pastilla dice EXACTAMENTE qué está verificado: «Cédula
                  verificada» no promete la licencia que falta. */}
              {datos.verificado ? (
                <View style={estilos.pastillaVerde}>
                  <Escudo tamano={13} tinta={color.hechoTinta} />
                  <Text style={estilos.pastillaVerdeTexto}>
                    {verificadoDeltodo ? 'Cédula y licencia verificadas' : 'Cédula verificada'}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Un botón de verdad, no un texto rojo suelto: la única acción de
              la cabecera, con la forma de las acciones secundarias de la
              casa (auditoría: afordancia). */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Editar mi perfil"
            onPress={() => router.push('/(cuenta)/editar')}
            style={({ pressed }) => [estilos.editar, pressed && estilos.pulsada]}
          >
            <Text style={estilos.editarTexto}>Editar perfil</Text>
            <Avanza tamano={14} tinta={color.ink700} />
          </Pressable>
        </View>

        <View style={estilos.contenido}>
          {/* LAS CIFRAS, en blanco y sin pulsar: una estadística no es una
              puerta (27-08: «se toca sin querer al desplazar»). Son lo que
              el otro ve antes de subirse. */}
          <View
            accessibilityLabel={`${datos.viajes} viajes, ${
              datos.calificacion == null ? 'sin nota' : `nota ${enTexto(datos.calificacion)}`
            }, ${conMiles(datos.kilometros)} kilómetros juntos`}
            style={estilos.tarjetaCifras}
          >
            {loQueVen.map((v, i) => (
              <View key={v.etiqueta} style={estilos.columnaCifra}>
                {i > 0 ? <View style={estilos.filete} /> : null}
                <View style={estilos.columnaDentro}>
                  <View style={estilos.filaValor}>
                    {v.estrella ? <Estrella tamano={14} /> : null}
                    <Text style={[estilos.valorCifra, tabular]} numberOfLines={1}>
                      {v.valor}
                    </Text>
                  </View>
                  <Text style={estilos.etiquetaCifra} numberOfLines={1}>
                    {v.etiqueta}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* **LA VERIFICACIÓN ES UNA ACCIÓN, NO UN ESTADO** (02-09-2026,
              auditoría — principio 1 y 11): sin licencia no se publica, y la
              pantalla lo decía dos veces («Pendiente», «Pendiente») sin
              ofrecer nunca el botón. Esta tarjeta sólo existe mientras
              falte algo, en tinta —lo único oscuro de la pantalla— porque es
              lo único que hay que hacer. Verificado del todo, desaparece. */}
          {verificadoDeltodo ? null : (
            <View style={estilos.tarjetaVerifica}>
              <Text style={estilos.verificaEpigrafe}>Para llevar a alguien</Text>
              <Text style={estilos.verificaTitulo}>
                {datos.verificado ? 'Falta tu licencia de conducir' : 'Verifica tu cédula'}
              </Text>
              <View style={estilos.pasos}>
                <PasoDeVerificacion hecho={datos.verificado} texto="Cédula" />
                <PasoDeVerificacion hecho={datos.licenciaAlDia} texto="Licencia de conducir" />
              </View>
              <Text style={estilos.verificaTexto}>
                {datos.verificado
                  ? 'Con la cédula viajas de pasajero. Para publicar un viaje hace falta la licencia, verificada por el mismo proveedor.'
                  : 'Toma un minuto y vale para siempre: es lo que ven los demás antes de subirse.'}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={datos.verificado ? 'Verificar la licencia' : 'Verificar la cédula'}
                onPress={() => router.push('/(conductor)/cedula')}
                style={({ pressed }) => [estilos.botonVerifica, pressed && { opacity: 0.9 }]}
              >
                <Text style={estilos.botonVerificaTexto}>
                  {datos.verificado ? 'Verificar la licencia' : 'Verificar la cédula'}
                </Text>
                <Avanza tamano={16} tinta={color.ink900} />
              </Pressable>
            </View>
          )}

          <Text style={estilos.rotuloSeccion}>Mi cuenta</Text>
          <Lista filas={mias} completa={verificadoDeltodo} />

          <Text style={estilos.rotuloSeccion}>Ayuda</Text>
          <Lista filas={ayuda} completa={verificadoDeltodo} />

          {/* **INVITAR, NO «GANAR», Y EN VOZ BAJA.** Ver la nota 2 de la
              cabecera: no hay programa de referidos que pagar, así que no se
              promete uno. Y va sin fondo de color, al final de todo: es una
              acción de crecimiento secundaria, no la conclusión de tu perfil
              (pedido del dueño: «I would not make this card too prominent»). */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Invitar a mis amigos a Partimos"
            onPress={() =>
              compartir(
                `Estoy usando Partimos para compartir viajes en Panamá. Únete y encuentra personas que van en tu misma dirección.${
                  enlace ? ` ${enlace}` : ''
                }`,
              ).then((c) => decir(DIJO[c]))
            }
            style={({ pressed }) => [estilos.comparte, pressed && estilos.pulsada]}
          >
            {/* EL ICONO ES EL DE COMPARTIR, no un regalo (01-09-2026, pedido
                del dueño): aquí no se regala nada — se comparte la app, y el
                botón hace literalmente eso. */}
            <View style={estilos.cuadroRegalo}>
              <Compartir tamano={20} tinta={color.ink500} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={estilos.comparteTitulo}>Invita a tus amigos</Text>
              <Text style={estilos.comparteTexto}>
                Comparte Partimos con quienes viajan por tu misma ruta.
              </Text>
            </View>
            <Avanza />
          </Pressable>

          {/* **CERRAR SESIÓN ES UN BOTÓN** (01-09-2026, pedido del dueño).
              Iba en tinta y sin caja y se leía como una nota al pie: con
              borde y fondo blanco se ve que se puede pulsar. Sigue abajo del
              todo y sin rojo — salirse no es la acción de esta pantalla. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            onPress={() => salir().then(() => router.replace('/(cuenta)/apertura'))}
            style={({ pressed }) => [estilos.cerrar, pressed && estilos.pulsada]}
          >
            <Salir tamano={17} tinta={color.ink700} />
            <Text style={estilos.cerrarTexto}>Cerrar sesión</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Pestanas valor="Perfil" yo={yo} />
    </View>
  );
}

/** Un paso de la verificación: hecho (verde con visto) o por hacer (aro). */
function PasoDeVerificacion({ hecho, texto }: { hecho: boolean; texto: string }) {
  return (
    <View style={estilos.paso} accessibilityLabel={`${texto}: ${hecho ? 'lista' : 'pendiente'}`}>
      <View style={[estilos.pasoAro, hecho && estilos.pasoHecho]}>
        {hecho ? <Visto tamano={10} tinta="#fff" /> : null}
      </View>
      <Text style={[estilos.pasoTexto, hecho && estilos.pasoTextoHecho]}>{texto}</Text>
    </View>
  );
}

/**
 * UNA LISTA DE FILAS, dibujada igual las dos veces.
 *
 * `completa` es el estado de la verificación y sólo lo mira la pastilla:
 * pendiente va en arena y no en rojo, porque no es un error sino algo por
 * hacer.
 */
function Lista({
  filas,
  completa,
}: {
  filas: {
    etiqueta: string;
    debajo: string;
    pastilla?: string;
    icono: React.ReactNode;
    alPulsar: () => void;
  }[];
  completa: boolean;
}) {
  return (
    <View style={estilos.lista}>
      {filas.map((f, i) => (
        <Pressable
          key={f.etiqueta}
          accessibilityRole="button"
          accessibilityLabel={`${f.etiqueta}, ${f.pastilla ?? f.debajo}`}
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
          {f.pastilla ? (
            <View style={[estilos.pastillaFila, !completa && estilos.pastillaTibia]}>
              <Text style={[estilos.pastillaFilaTexto, !completa && estilos.pastillaTibiaTexto]}>
                {f.pastilla}
              </Text>
            </View>
          ) : null}
          <Avanza />
        </Pressable>
      ))}
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

  /* Sin fila de acciones arriba: el engranaje se fue con la pantalla de
     Ajustes, así que la cabecera empieza directamente en la persona. */
  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 18 },

  /* Ya no se pulsa entera: la foto abre editar y el botón de abajo lo dice
     con la palabra. Sin márgenes negativos — la fila alinea con el resto. */
  filaPersona: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    /* `azul100` es casi el mismo tono que la arena de la página: el círculo
       de la foto desaparecía. `ink200` lo separa sin oscurecerlo. */
    backgroundColor: color.ink200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: {
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.6,
    color: color.ink900,
    fontFamily: familia,
  },
  insignia: {
    position: 'absolute',
    right: -1,
    bottom: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: color.verde500,
    borderWidth: 2.5,
    borderColor: color.sand100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  nombre: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.84,
    color: color.ink900,
    fontFamily: familia,
  },
  desde: { fontSize: 13.5, lineHeight: 19, color: color.ink600, fontFamily: familia, marginTop: 3 },
  /* Verde de «hecho», el del sistema (`hechoFondo`/`hechoTinta`): la app ya
     lo usa para un estado cumplido, y un segundo verde para lo mismo son dos
     verdes que acaban divergiendo. */
  pastillaVerde: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
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
  /* La forma de las acciones secundarias de la casa (el «Cerrar sesión» de
     abajo, los «Editar» de resultados): píldora blanca con borde, 40 de
     alto. Un texto rojo suelto no decía que se pulsaba. */
  editar: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 16,
    height: 40,
    paddingLeft: 16,
    paddingRight: 12,
    borderRadius: radio.control,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
  },
  editarTexto: {
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '600',
    letterSpacing: 13.5 * TRACK_MICRO,
    color: color.ink800,
    fontFamily: familia,
  },

  contenido: { paddingHorizontal: espacio.gutter, paddingTop: 20, paddingBottom: 110 },

  /** Las tres cifras en blanco: una estadística no es una puerta, y la
      tinta queda para lo único que hay que HACER (la verificación). */
  tarjetaCifras: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.blanco,
    borderRadius: radio.hoja,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    paddingVertical: 16,
    paddingHorizontal: 6,
  },
  columnaCifra: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
  /** Un pelo de tinta, no una caja: separa sin dibujar tres recuadros. */
  filete: { width: 1, height: 34, backgroundColor: color.bordePorDefecto },
  columnaDentro: { flex: 1, minWidth: 0, alignItems: 'center', paddingHorizontal: 4 },
  filaValor: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  valorCifra: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '700',
    letterSpacing: -0.6,
    color: color.ink900,
    fontFamily: familia,
  },
  etiquetaCifra: {
    fontSize: 12.5,
    lineHeight: 17,
    color: color.ink600,
    fontFamily: familia,
    marginTop: 2,
  },

  /** La única tarjeta oscura: lo único que hay que hacer. Desaparece hecha. */
  tarjetaVerifica: {
    marginTop: 14,
    padding: 18,
    borderRadius: radio.hoja,
    backgroundColor: color.ink900,
  },
  verificaEpigrafe: {
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,.66)',
    fontFamily: familia,
  },
  verificaTitulo: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: '#fff',
    fontFamily: familia,
    marginTop: 5,
  },
  pasos: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 14 },
  paso: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  pasoAro: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pasoHecho: { backgroundColor: color.verde500, borderColor: color.verde500 },
  pasoTexto: {
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '500',
    color: 'rgba(255,255,255,.72)',
    fontFamily: familia,
  },
  pasoTextoHecho: { color: '#fff', fontWeight: '600' },
  verificaTexto: {
    fontSize: 13.5,
    lineHeight: 19,
    color: 'rgba(255,255,255,.82)',
    fontFamily: familia,
    marginTop: 12,
  },
  botonVerifica: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    height: 48,
    borderRadius: radio.control,
    backgroundColor: color.blanco,
  },
  botonVerificaTexto: {
    fontSize: 15,
    lineHeight: interlinea(15),
    fontWeight: '600',
    letterSpacing: 15 * TRACK_MICRO,
    color: color.ink900,
    fontFamily: familia,
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

  /* Blanco y no rojo: es secundaria. Con el fondo rosado pesaba más que las
     cuatro filas de arriba, que son lo que se viene a hacer aquí. */
  comparte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginTop: 14,
    padding: 15,
    borderRadius: radio.hoja,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
  },
  cuadroRegalo: {
    width: 40,
    height: 40,
    borderRadius: radio.icono,
    backgroundColor: color.sand100,
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
  comparteTexto: { fontSize: 12.5, lineHeight: 18, color: color.ink600, fontFamily: familia },

  /* Un botón de verdad: caja blanca con borde, como las listas de arriba.
     Neutro a propósito — ni rojo ni tinta llena: salirse no es «sigue». */
  cerrar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 22,
    height: 48,
    borderRadius: radio.control,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
  },
  cerrarTexto: {
    fontSize: 14.5,
    lineHeight: interlinea(14.5),
    fontWeight: '600',
    letterSpacing: 14 * TRACK_MICRO,
    color: color.ink800,
    fontFamily: familia,
  },
});
