/**
 * `6a` Tu cuenta — quién eres y qué puedes hacer.
 *
 * **Dos pestañas y no una lista larga.** «Sobre ti» es lo que eres en
 * Partimos —lo que has puesto, lo que has recuperado, tu carro— y «Cuenta» es
 * lo que puedes tocar. Antes las dos cosas iban en la misma columna y las
 * cuatro filas del final parecían pie de página: se leía primero el número de
 * kilómetros y después, muy abajo, la fila que decía que te falta la cédula.
 *
 * Cada fila lleva icono. Una lista de nueve renglones de texto se lee entera
 * o no se lee; con icono se encuentra el que buscas de un vistazo.
 *
 * Los tres números no son un marcador: «aportado» es lo que has puesto tú
 * yendo de pasajero y «recuperado» lo que te han puesto a ti llevando gente.
 * Nadie gana, y por eso los tres pesan igual, sin flechas ni verdes de subida.
 */

import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

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
  Brujula,
  Carro,
  Cedula,
  Documento,
  Escudo,
  Mas,
  Ruta,
  Salir,
} from '@/ui/iconos';
import { TRACK_MICRO, color, espacio, familia, radio, sombra } from '@/ui/tokens';

/** Sin sesión que preguntar —solo en simulado—, el conductor del traspaso. */
const DEL_RECORRIDO = '11111111-1111-4111-8111-111111111111';


export default function TuCuenta() {
  const router = useRouter();
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
   * LO QUE EL OTRO VE ANTES DE SUBIRSE — las tres cifras del perfil público,
   * dentro de esta página (27-08-2026). Salen de `datos`, que ya las trae: no
   * hace falta pedir el perfil otra vez para enseñar lo que ya está aquí.
   *
   * La nota se calla mientras no haya ninguna. «Sin nota» no es un defecto de
   * quien acaba de entrar, y escribir un 0 sería mentir.
   */
  const loQueVen = [
    {
      etiqueta: datos.viajes === 1 ? 'viaje' : 'viajes',
      valor: String(datos.viajes),
    },
    {
      /* «sin nota» y no «todavía sin nota»: en una fila de tres columnas el
         rótulo más largo estira su columna y las otras dos se apiñan. Lo de
         «todavía» lo dice el guion que hay encima. */
      etiqueta: datos.calificacion == null ? 'sin nota' : 'de nota',
      valor: datos.calificacion == null ? '—' : enTexto(datos.calificacion),
    },
    {
      etiqueta: 'cédula',
      valor: datos.verificado ? 'Verificada' : 'Sin verificar',
    },
  ];

  /**
   * LAS NUEVE FILAS, Y TODAS LLEVAN A ALGUNA PARTE.
   *
   * Tres de ellas eran texto con una punta de flecha al lado y nada detrás.
   * Cuando la fila está vacía, el valor lo dice y no se queda en blanco: «Sin
   * carro» invita a entrar, un hueco no.
   */
  const filas: {
    etiqueta: string;
    valor?: string | null;
    icono: React.ReactNode;
    alPulsar: () => void;
  }[] = [
    /**
     * EL ORDEN Y LA PODA — pedido del dueño el 26-08-2026: «keep it
     * pertinent and optimize it. Ajustes should be on top».
     *
     * Ajustes estaba EL ÚLTIMO de diez filas, debajo del pliegue, y era lo
     * que más se busca de esta lista. Ahora abre.
     *
     * Y se fueron tres filas que no aportaban un camino nuevo:
     *   · «Mis viajes» y «Publicar un viaje» son LA BARRA DE ABAJO, visible
     *     en esta misma pantalla — la pestaña Viajes va a `misviajes` y el
     *     «+» a `publicar`, exactamente lo que hacían estas dos filas.
     *   · «Cómo funciona» y «Ayuda y contacto» abrían LA MISMA pantalla,
     *     `/(ayuda)`. Dos rótulos, un destino.
     *
     * Y una que iba al sitio equivocado: «Seguridad» abría `reportar` — la
     * denuncia de un incidente—, no lo que su nombre promete. Ahora se
     * llama por lo que es y lleva a «Cómo te cuidamos», que empieza por el
     * botón de llamar a emergencias.
     */
    {
      etiqueta: 'Ajustes',
      icono: <Documento />,
      alPulsar: () => router.push('/(cuenta)/ajustes'),
    },
    /* **LA VERIFICACIÓN, UNA PUERTA A LA VEZ.** Sin verificar, arriba está
       ya la fila «Verificar mi cédula · Sin esto no puedes publicar viajes»,
       que va al mismo sitio y encima dice por qué. Dos filas al mismo destino
       en la misma pantalla, una de ellas sin la razón, es la de menos.
       Verificada, esta se queda: es donde se mira cuándo vence. */
    ...(datos.verificado
      ? [
          {
            etiqueta: 'Verificación',
            valor: datos.cedula,
            icono: <Cedula />,
            alPulsar: () => router.push('/(conductor)/cedula'),
          },
        ]
      : []),
    {
      etiqueta: 'Mi carro',
      valor: datos.carro ?? 'Sin carro',
      icono: <Carro tamano={20} />,
      alPulsar: () => router.push('/(conductor)/carro'),
    },
    {
      etiqueta: 'Cómo se aporta',
      valor: datos.metodo,
      icono: <Billete />,
      alPulsar: () => router.push('/(pasajero)/metodos'),
    },
    /* **«LO QUE RECUPERAS» SE FUE**: abría `aportes`, que es exactamente lo
       que abre «Ver histórico» en la tarjeta de arriba — y esa tarjeta ya
       enseña la cifra. Dos filas de la misma pantalla al mismo sitio, una de
       ellas sin el dato (29-08-2026). */
    {
      etiqueta: 'Cómo te cuidamos',
      icono: <Escudo tamano={20} tinta={color.ink500} />,
      alPulsar: () => router.push('/(ayuda)/seguridad'),
    },
    {
      etiqueta: 'Ayuda y contacto',
      icono: <Ayuda tamano={20} />,
      alPulsar: () => router.push('/(ayuda)'),
    },
  ];

  return (
    <View style={estilos.pantalla}>
      <BarraDeEstado />

      {/* TODA LA PANTALLA DESLIZA, no solo el cuerpo: en el teléfono se siente
          como una app y no como una cabecera clavada. Solo la barra de estado
          —y la de pestañas, donde la hay— quedan fijas. */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >

      <CampoRojo altura={230} motivo="mapa" />


      <View style={estilos.cabecera}>
        <View style={estilos.filaPersona}>
          <View style={estilos.avatar}>
            <Text style={estilos.avatarTexto}>{datos.iniciales}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={estilos.nombre} numberOfLines={1}>
              {`${datos.nombre} ${datos.apellido}`.trim()}
            </Text>
            {/* LOS KILÓMETROS, JUNTO AL NOMBRE. Estaban en la fila de tres
                cifras, con el mismo peso que el dinero — y no son dinero:
                son lo que has recorrido acompañado, que es la única cifra
                de esta pantalla que se puede presumir. Aquí valen; en una
                columna al lado de un balboa, competían. Con cero se calla:
                «0 km juntos» no le dice nada a quien acaba de entrar. */}
            <Text style={estilos.desde}>
              {`En Partimos desde ${datos.desde}`}
              {datos.kilometros > 0 ? ` · ${conMiles(datos.kilometros)} km juntos` : ''}
            </Text>
          </View>
        </View>

        {/* **ESTA CABECERA ES TU PERFIL PÚBLICO, Y NO HACE FALTA DECIRLO
            DOS VECES** (29-08-2026, pedido del dueño).
            Había una pastilla «VERIFICADO» aquí, y más abajo una tarjeta
            entera titulada «Mi perfil público · Lo que ve el otro antes de
            subirse» con las mismas tres cifras. Pero entrar en Perfil YA es
            mirarse: nadie necesita que le anuncien, dentro de su perfil, que
            está viendo su perfil. Las tres cifras suben aquí, pegadas al
            nombre y a la foto, que es como las ve el otro; y la pastilla se
            va, porque la cédula ya está en la tercera columna. */}
        <View style={estilos.loQueVen}>
          {loQueVen.map((v, i) => (
            <View
              key={v.etiqueta}
              style={[
                estilos.loQueVenColumna,
                i === loQueVen.length - 1 && estilos.loQueVenUltima,
              ]}
            >
              <Text style={estilos.loQueVenValor}>{v.valor}</Text>
              <Text style={estilos.loQueVenEtiqueta}>{v.etiqueta}</Text>
            </View>
          ))}
        </View>
        <Text style={estilos.esloQueVen}>Esto es lo que ve el otro antes de subirse.</Text>
      </View>

      <View style={estilos.contenido}>
        {/* **SIN SOLAPAS** (29-08-2026, pedido del dueño). Había dos, «Sobre
            ti» y «Cuenta», y partían en dos lo que cabe entero: arriba lo que
            eres, abajo lo que puedes cambiar. Nadie entra a su perfil sin
            querer las dos mitades, y con la de «Cuenta» escondida detrás de
            un toque, Ajustes y Ayuda no existían para quien no la descubriera.
            Ahora una sola página, en el orden en que se mira: quién eres, qué
            has recuperado, y qué puedes tocar. */}
            {/* UNA CIFRA, NO TRES. «Aportado» se va por pedido del dueño
                (26-08-2026) y la razón se sostiene sola: puestas juntas, lo
                que pusiste y lo que recuperaste se leen como un balance —
                como si hubiera un saldo a favor o en contra. Y no lo hay:
                aquí nadie gana. Lo que queda es lo único que el conductor
                necesita saber, y ahora ABRE su detalle en vez de quedarse
                como un adorno. */}
            {/* **LA TARJETA NO SE PULSA** (27-08-2026, pedido del dueño). La
                cifra es para leerla, no para entrar en ninguna parte: una
                tarjeta entera pulsable de 100 px de alto se toca sin querer
                al desplazar, y lo que abría —el detalle viaje por viaje— es
                una segunda cosa, no la misma. Ahora es un botón pequeño
                debajo, que es lo que es. */}
            <View style={estilos.tarjeta}>
              {/* LA CIFRA Y SU PUERTA, EN EL MISMO RENGLÓN (30-08-2026,
                  pedido del dueño). El botón colgaba debajo, a 18 px, en una
                  tarjeta que sólo tiene esas dos cosas: dos líneas y un vacío
                  para decir «B/0» y «ver el detalle». Al lado, la tarjeta
                  mide lo que dice. */}
              <View style={estilos.filaRecuperado}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={estilos.cifraEtiqueta}>Lo que has recuperado</Text>
                  <Text style={estilos.cifraValor}>
                    {formatearDineroRedondo(datos.recuperadoCentavos)}
                  </Text>
                </View>
              {/* Aquí iba «Nadie gana dinero con esto: unos ponen y otros
                  recuperan.», con su filete encima. Fuera el 29-08-2026 a
                  pedido del dueño. La regla se sigue diciendo donde decide
                  algo —en la ayuda y en el repaso antes de publicar—; en tu
                  propio perfil, debajo de tu cifra, no decidía nada y le
                  quitaba sitio a lo único que sí hay que tocar aquí. */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ver el histórico, viaje por viaje"
                onPress={() => router.push('/(conductor)/aportes')}
                style={({ pressed }) => [estilos.verHistorico, pressed && estilos.pulsada]}
              >
                <Text style={estilos.verHistoricoTexto}>Ver histórico</Text>
                <Avanza tamano={15} />
              </Pressable>
              </View>
            </View>

            {/* **LO QUE FALTA SE PUEDE HACER DESDE AQUÍ.**
                Era una frase suelta con un escudo al lado — «Verifica tu
                cédula para poder publicar viajes.» —, con pinta de botón y sin
                serlo: la única cosa accionable de la pantalla no llevaba a
                ninguna parte. Y era la TERCERA vez que la misma pantalla decía
                lo mismo (la pastilla de arriba, la columna «Sin verificar ·
                cédula», y esto). Verificada, la frase no aporta nada nuevo y
                se va; sin verificar, se convierte en la fila que lleva a
                hacerlo, con la razón debajo — invariante 7 (29-08-2026). */}
            {!datos.verificado ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Verificar mi cédula"
                onPress={() => router.push('/(conductor)/cedula')}
                style={({ pressed }) => [estilos.aviso, pressed && estilos.pulsada]}
              >
                <Escudo tamano={19} tinta={color.azul500} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={estilos.avisoTitulo}>Verificar mi cédula</Text>
                  <Text style={estilos.avisoTexto}>Sin esto no puedes publicar viajes.</Text>
                </View>
                <Avanza />
              </Pressable>
            ) : null}
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
                <Text style={estilos.filaEtiqueta}>{f.etiqueta}</Text>
                {f.valor ? (
                  <Text style={estilos.filaValor} numberOfLines={1}>
                    {f.valor}
                  </Text>
                ) : null}
                <Avanza />
              </Pressable>
            ))}
          </View>

        {/* **CERRAR SESIÓN NO ES LO QUE SE VIENE A HACER AQUÍ**, y era el
            control más fuerte de la pantalla: 56 px de alto, a todo el ancho,
            con borde rojo y la palabra en rojo. El rojo tiene cuatro sentidos
            en este sistema —destino, acción primaria, poca disponibilidad, en
            vivo— y salir no es ninguno. Se queda donde estaba, al final, pero
            dicho en voz baja: sin caja, en tinta secundaria, del tamaño de un
            enlace. Sigue siendo fácil de encontrar y ya no compite con nada. */}
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

  cabecera: { paddingHorizontal: espacio.gutter, paddingTop: 6 },
  filaPersona: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radio.cuadrado,
    backgroundColor: color.ink100,
    borderWidth: 1,
    borderColor: 'rgba(10,39,49,.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: {
    fontSize: 25,
    lineHeight: 34,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: color.ink700,
    fontFamily: familia,
  },
  nombre: {
    fontSize: 27,
    lineHeight: 30,
    letterSpacing: -1.04,
    fontWeight: '600',
    color: color.ink900,
    fontFamily: familia,
  },
  desde: { fontSize: 13.5, lineHeight: 19.5, color: color.campoTexto, marginTop: 3, fontFamily: familia },

  chipEstado: {
    minHeight: espacio.tap,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    marginTop: 14,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radio.pastilla,
  },
  chipVerde: { backgroundColor: color.hechoFondo },
  chipClaro: { backgroundColor: color.lavado },
  chipEstadoTexto: {
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '600',
    letterSpacing: 12.5 * TRACK_MICRO,
    textTransform: 'uppercase',
    fontFamily: familia,
  },

  /* El hueco de abajo es el ALTO DE LA BARRA DE PESTAÑAS más aire: con 26 px
     la última fila —«Ayuda y contacto»— quedaba debajo de la barra. */
  contenido: { paddingHorizontal: espacio.gutter, paddingTop: 20, paddingBottom: 96 },


  tarjeta: {
    marginTop: 14,
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    padding: 20,
  },
  /* Una sola cifra: la fila es ella y el chevrón que la abre. */
  filaRecuperado: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cifraEtiqueta: { fontSize: 12.5, lineHeight: 17.4, color: color.ink600, fontFamily: familia },
  cifraValor: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.66,
    color: color.ink900,
    marginTop: 4,
    fontFamily: familia,
    ...tabular,
  },

  /** Pequeño y de contorno: abre una segunda pantalla, no ES la tarjeta. */
  verHistorico: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    // 44, el mínimo de un dedo. Iba a 34.
    height: 44,
    paddingLeft: 15,
    paddingRight: 11,
    borderRadius: radio.s,
    borderWidth: 1,
    borderColor: color.bordeSutil,
  },
  verHistoricoTexto: {
    fontSize: 13.5,
    fontWeight: '500',
    color: color.ink700,
    fontFamily: familia,
  },

  filaPerfil: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  tituloPerfil: {
    fontSize: 15.5,
    lineHeight: 22.5,
    fontWeight: '500',
    letterSpacing: -0.23,
    color: color.ink900,
    fontFamily: familia,
  },
  /** Las tres cifras que el otro mira antes de subirse, en columnas iguales. */
  /* Ahora vive en la cabecera, sobre el lienzo y no dentro de una tarjeta:
     el filete de arriba lo separa del nombre. */
  /* **DISTRIBUIDAS, NO EN TERCIOS IGUALES** (30-08-2026, «0 viajes is not
     align»). Cada columna era `flex: 1`: con «0», «—» y «Verificada» dentro,
     los tres bloques empiezan en su tercio pero acaban donde les da la gana,
     y la fila se lee torcida. Repartidas por su propio ancho, la primera cae
     a plomo con el nombre y la última con el canto derecho — que es contra lo
     que el ojo mide si algo está alineado. */
  loQueVen: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 18,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  esloQueVen: {
    marginTop: 12,
    fontSize: 12.5,
    lineHeight: 18,
    color: color.ink500,
    fontFamily: familia,
  },
  loQueVenColumna: { flexShrink: 1 },
  /** La última se alinea por su canto derecho, como el borde de la tarjeta. */
  loQueVenUltima: { alignItems: 'flex-end' },
  loQueVenValor: {
    fontSize: 16.5,
    lineHeight: 22,
    fontWeight: '600',
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  loQueVenEtiqueta: {
    fontSize: 12,
    lineHeight: 17,
    color: color.ink600,
    marginTop: 2,
    fontFamily: familia,
  },

  lista: {
    marginTop: 14,
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    overflow: 'hidden',
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: 15,
    height: 62,
  },
  filaSuelta: {
    marginTop: 10,
    backgroundColor: color.blanco,
    borderRadius: radio.l,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    height: 74,
  },
  filaConLinea: { borderBottomWidth: 1, borderBottomColor: color.bordeSutil },
  pulsada: { backgroundColor: color.sand100 },
  cuadroIcono: {
    width: 38,
    height: 38,
    borderRadius: radio.control,
    backgroundColor: color.sand200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filaEtiqueta: {
    flex: 1,
    fontSize: 15.5,
    lineHeight: 22.5,
    fontWeight: '500',
    letterSpacing: -0.23,
    color: color.ink900,
    fontFamily: familia,
  },
  filaValor: { fontSize: 13.5, lineHeight: 19, color: color.ink600, fontFamily: familia },

  /**
   * BLANCA COMO LAS DEMÁS TARJETAS. Iba en `azul50`, que en este sistema
   * resuelve a `#F4F7F8` — el mismo color del lienzo—: la fila flotaba sin
   * caja entre dos tarjetas blancas, y la única acción pendiente de la
   * pantalla era lo único sin superficie donde apoyarse.
   */
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radio.l,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
  },
  avisoTitulo: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: color.ink900,
    fontFamily: familia,
  },
  avisoTexto: { fontSize: 13, lineHeight: 18, color: color.ink600, fontFamily: familia },

  cerrar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    height: 48,
  },
  cerrarTexto: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: -0.16,
    color: color.ink600,
    fontFamily: familia,
  },

  pie: { paddingHorizontal: espacio.gutter, paddingBottom: 10, paddingTop: 6 },
});
