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

/** El verde de «verificado» es `--green-100/700` del traspaso; no está en tokens. */
const VERDE_FONDO = '#DFF1E8';
const VERDE_TINTA = '#0E5A3F';

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
      etiqueta: 'Cómo se paga',
      valor: datos.metodo,
      icono: <Billete />,
      alPulsar: () => router.push('/(pasajero)/metodos'),
    },
    {
      etiqueta: 'Mis viajes',
      icono: <Ruta />,
      alPulsar: () => router.push('/(conductor)/misviajes'),
    },
    {
      etiqueta: 'Publicar un viaje',
      icono: <Mas tamano={20} tinta={color.ink600} />,
      alPulsar: () => router.push('/(conductor)/publicar'),
    },
    {
      etiqueta: 'Cómo funciona',
      icono: <Brujula />,
      alPulsar: () => router.push('/(ayuda)'),
    },
    {
      etiqueta: 'Seguridad',
      icono: <Escudo tamano={20} tinta={color.ink600} />,
      alPulsar: () => router.push('/(ayuda)/reportar'),
    },
    {
      etiqueta: 'Ayuda y contacto',
      icono: <Ayuda tamano={20} />,
      alPulsar: () => router.push('/(ayuda)'),
    },
    {
      etiqueta: 'Ajustes',
      icono: <Documento />,
      alPulsar: () => router.push('/(cuenta)/ajustes'),
    },
  ];

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={230} motivo="mapa" />

      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <View style={estilos.filaPersona}>
          <View style={estilos.avatar}>
            <Text style={estilos.avatarTexto}>{datos.iniciales}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={estilos.nombre} numberOfLines={1}>
              {`${datos.nombre} ${datos.apellido}`.trim()}
            </Text>
            <Text style={estilos.desde}>{`En Partimos desde ${datos.desde}`}</Text>
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
          <Cedula tamano={15} tinta={datos.verificado ? VERDE_TINTA : color.campoTexto} />
          <Text
            style={[
              estilos.chipEstadoTexto,
              { color: datos.verificado ? VERDE_TINTA : color.campoTexto },
            ]}
          >
            {datos.verificado ? 'Verificado' : 'Sin verificar'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={estilos.contenido}
        showsVerticalScrollIndicator={false}
      >
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
            <View style={estilos.tarjeta}>
              <View style={estilos.cifras}>
                <View style={estilos.cifra}>
                  <Text style={estilos.cifraEtiqueta}>Aportado</Text>
                  <Text style={estilos.cifraValor}>
                    {formatearDineroRedondo(datos.aportadoCentavos)}
                  </Text>
                </View>
                <View style={estilos.cifra}>
                  <Text style={estilos.cifraEtiqueta}>Recuperado</Text>
                  <Text style={estilos.cifraValor}>
                    {formatearDineroRedondo(datos.recuperadoCentavos)}
                  </Text>
                </View>
                <View style={estilos.cifra}>
                  <Text style={estilos.cifraEtiqueta}>Km juntos</Text>
                  <Text style={estilos.cifraValor}>{conMiles(datos.kilometros)}</Text>
                </View>
              </View>
              <Text style={estilos.nadieGana}>
                Nadie gana dinero con esto: unos ponen y otros recuperan.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({ pathname: '/(pasajero)/perfil', params: { perfil: yo } })
              }
              style={({ pressed }) => [estilos.fila, estilos.filaSuelta, pressed && estilos.pulsada]}
            >
              <View style={estilos.cuadroIcono}>
                <Escudo tamano={20} tinta={color.ink600} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={estilos.filaEtiqueta}>Mi perfil público</Text>
                <Text style={estilos.filaValor}>Lo que ve el otro antes de subirse</Text>
              </View>
              <Avanza />
            </Pressable>

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
      </ScrollView>

        <Pestanas valor="Perfil" />
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
    backgroundColor: 'rgba(255,255,255,.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: {
    fontSize: 25,
    lineHeight: 34,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: '#fff',
    fontFamily: familia,
  },
  nombre: {
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -1.04,
    fontWeight: '600',
    color: '#fff',
    fontFamily: familia,
  },
  desde: { fontSize: 13.5, lineHeight: 19.5, color: color.campoTexto, marginTop: 3, fontFamily: familia },

  chipEstado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    marginTop: 14,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radio.pastilla,
  },
  chipVerde: { backgroundColor: VERDE_FONDO },
  chipClaro: { backgroundColor: 'rgba(255,255,255,.18)' },
  chipEstadoTexto: {
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '600',
    letterSpacing: 12.5 * TRACK_MICRO,
    textTransform: 'uppercase',
    fontFamily: familia,
  },

  contenido: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 26 },

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
    fontSize: 15,
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
  cifras: { flexDirection: 'row' },
  cifra: { flex: 1 },
  cifraEtiqueta: { fontSize: 12, lineHeight: 17.4, color: color.ink500, fontFamily: familia },
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
    color: color.ink500,
    marginTop: 14,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
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
  filaValor: { fontSize: 13, lineHeight: 19, color: color.ink500, fontFamily: familia },

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
