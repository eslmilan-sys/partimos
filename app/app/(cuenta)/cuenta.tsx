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

type Solapa = 'ti' | 'cuenta';

export default function TuCuenta() {
  const router = useRouter();
  const yo = useMiIdOEntrar(DEL_RECORRIDO);
  const [datos, setDatos] = useState<Cuenta | null>(null);
  const [noEsta, setNoEsta] = useState(false);
  const [solapa, setSolapa] = useState<Solapa>('ti');

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
      etiqueta: datos.calificacion == null ? 'todavía sin nota' : 'de nota',
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
    {
      etiqueta: 'Verificación',
      valor: datos.cedula,
      icono: <Cedula />,
      alPulsar: () => router.push('/(conductor)/cedula'),
    },
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
    {
      etiqueta: 'Lo que recuperas',
      icono: <Billete />,
      alPulsar: () => router.push('/(conductor)/aportes'),
    },
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

        {/* El estado de la cédula, arriba y no enterrado en la lista: es lo
            único que decide si puedes publicar. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={datos.verificado ? 'Cédula verificada' : 'Verificar la cédula'}
          onPress={() => router.push('/(conductor)/cedula')}
          style={[estilos.chipEstado, datos.verificado ? estilos.chipVerde : estilos.chipClaro]}
        >
          <Cedula tamano={15} tinta={datos.verificado ? color.hechoTinta : color.campoTexto} />
          <Text
            style={[
              estilos.chipEstadoTexto,
              { color: datos.verificado ? color.hechoTinta : color.campoTexto },
            ]}
          >
            {datos.verificado ? 'Verificado' : 'Sin verificar'}
          </Text>
        </Pressable>
      </View>

      <View style={estilos.contenido}>
        {/* Las dos solapas montan sobre el borde del campo, que es donde el
            arquetipo pone la hoja blanca. */}
        <View style={estilos.solapas}>
          {(
            [
              ['ti', 'Sobre ti'],
              ['cuenta', 'Cuenta'],
            ] as const
          ).map(([clave, etiqueta]) => (
            <Pressable
              key={clave}
              accessibilityRole="button"
              accessibilityState={{ selected: solapa === clave }}
              onPress={() => setSolapa(clave)}
              style={[estilos.solapa, solapa === clave && estilos.solapaActiva]}
            >
              <Text style={[estilos.solapaTexto, solapa === clave && estilos.solapaTextoActivo]}>
                {etiqueta}
              </Text>
            </Pressable>
          ))}
        </View>

        {solapa === 'ti' ? (
          <>
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
              <Text style={estilos.cifraEtiqueta}>Lo que has recuperado</Text>
              <Text style={estilos.cifraValor}>
                {formatearDineroRedondo(datos.recuperadoCentavos)}
              </Text>
              <Text style={estilos.nadieGana}>
                Nadie gana dinero con esto: unos ponen y otros recuperan.
              </Text>

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

            {/* **MI PERFIL PÚBLICO, DENTRO DE LA PÁGINA** (27-08-2026, pedido
                del dueño). Era una fila con galón que abría tu propio perfil
                en modo visitante — un viaje de ida y vuelta para ver cuatro
                datos que caben aquí. Se enseña lo que el otro ve ANTES de
                subirse, que es de lo que trata: tu nota, tus viajes y lo que
                llevas verificado. */}
            <View style={estilos.tarjeta}>
              <View style={estilos.filaPerfil}>
                <View style={estilos.cuadroIcono}>
                  <Escudo tamano={20} tinta={color.ink500} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={estilos.tituloPerfil}>Mi perfil público</Text>
                  <Text style={estilos.filaValor}>Lo que ve el otro antes de subirse</Text>
                </View>
              </View>

              <View style={estilos.loQueVen}>
                {loQueVen.map((v) => (
                  <View key={v.etiqueta} style={estilos.loQueVenColumna}>
                    <Text style={estilos.loQueVenValor}>{v.valor}</Text>
                    <Text style={estilos.loQueVenEtiqueta}>{v.etiqueta}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={estilos.aviso}>
              <Escudo tamano={19} tinta={color.azul500} />
              <Text style={estilos.avisoTexto}>{datos.queTeFalta}</Text>
            </View>
          </>
        ) : (
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
        )}

        {/* Su propio bloque, separado y en contorno: un botón destructivo va en
            contorno y nunca en relleno rojo, que es el color de seguir. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
          onPress={async () => {
            await salir();
            router.replace('/(cuenta)/apertura');
          }}
          style={({ pressed }) => [estilos.cerrar, pressed && { backgroundColor: color.rojo50 }]}
        >
          <Salir tamano={19} />
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

  contenido: { paddingHorizontal: espacio.gutter, paddingTop: 20, paddingBottom: 26 },

  solapas: {
    flexDirection: 'row',
    padding: 5,
    borderRadius: radio.pastilla,
    backgroundColor: color.blanco,
    ...sombra.hoja,
  },
  solapa: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radio.pastilla },
  solapaActiva: { backgroundColor: color.azul500 },
  solapaTexto: {
    fontSize: 15.5,
    lineHeight: 21.75,
    fontWeight: '600',
    letterSpacing: -0.15,
    color: color.ink700,
    fontFamily: familia,
  },
  solapaTextoActivo: { color: '#fff' },

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
  nadieGana: {
    fontSize: 12.5,
    lineHeight: 18.5,
    color: color.ink600,
    marginTop: 14,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
    fontFamily: familia,
  },

  /** Pequeño y de contorno: abre una segunda pantalla, no ES la tarjeta. */
  verHistorico: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 14,
    height: 34,
    paddingLeft: 13,
    paddingRight: 9,
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
  loQueVen: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  loQueVenColumna: { flex: 1, minWidth: 0 },
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

  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginTop: 10,
    padding: 15,
    borderRadius: radio.l,
    backgroundColor: color.azul50,
  },
  avisoTexto: { flex: 1, fontSize: 13.5, lineHeight: 20, color: color.azul700, fontFamily: familia },

  cerrar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 16,
    height: 56,
    borderRadius: radio.l,
    borderWidth: 1.5,
    borderColor: color.rojo200,
    backgroundColor: color.blanco,
  },
  cerrarTexto: {
    fontSize: 15.5,
    lineHeight: 22.5,
    fontWeight: '600',
    letterSpacing: -0.16,
    color: color.rojo600,
    fontFamily: familia,
  },

  pie: { paddingHorizontal: espacio.gutter, paddingBottom: 10, paddingTop: 6 },
});
