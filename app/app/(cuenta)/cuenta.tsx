/**
 * `6a` Tu cuenta — quién eres y qué te falta.
 *
 * Los tres números de la hoja blanca no son un marcador: «aportado» es lo que
 * has puesto tú yendo de pasajero y «recuperado» lo que te han puesto a ti
 * llevando gente. Nadie gana, y por eso los tres pesan igual, sin flechas ni
 * verdes de subida.
 *
 * Debajo, la lista dice de un vistazo qué falta —el carro, cómo se paga, la
 * cédula— y el aviso azul cierra con lo único que decide si puedes conducir.
 * Azul y no rojo: informa, no es algo que tocar.
 */

import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useRouter } from 'expo-router';

import { type Cuenta, cuenta } from '@/servicios/ajustes';
import { BarraDeEstado } from '@/ui/BarraDeEstado';
import { BarraDePestanas } from '@/ui/BarraDePestanas';
import { CampoRojo } from '@/ui/CampoRojo';
import { formatearDineroRedondo, tabular } from '@/ui/dinero';
import { Carro, Chat, Escudo, Lupa, Persona } from '@/ui/iconos';
import { TRACK_MICRO, color, familia, radio, sombra } from '@/ui/tokens';

/** Mientras no haya sesión, el conductor del recorrido del diseño. */
const PERFIL = '11111111-1111-4111-8111-111111111111';

/** El verde de «verificado» es `--green-100/700` del traspaso; no está en tokens. */
const VERDE_FONDO = '#DFF1E8';
const VERDE_TINTA = '#0E5A3F';

export default function TuCuenta() {
  const router = useRouter();
  const [datos, setDatos] = useState<Cuenta | null>(null);

  useEffect(() => {
    cuenta(PERFIL).then(setDatos);
  }, []);

  if (!datos) return <View style={estilos.pantalla} />;

  // «Mi perfil» es la única de las cuatro que ya tiene pantalla en la app.
  const filas: { etiqueta: string; valor?: string | null; alPulsar?: () => void }[] = [
    { etiqueta: 'Mi perfil', alPulsar: () => router.push('/(pasajero)/perfil') },
    { etiqueta: 'Mi carro', valor: datos.carro },
    { etiqueta: 'Cómo se paga', valor: datos.metodo },
    { etiqueta: 'Verificación', valor: datos.cedula },
  ];

  return (
    <View style={estilos.pantalla}>
      <CampoRojo altura={214} />

      <BarraDeEstado />

      <View style={estilos.cabecera}>
        <Text style={estilos.epigrafeCampo}>Tu cuenta</Text>
        <Text style={estilos.titular}>
          {`${datos.nombre} `}
          <Text style={estilos.titularFuerte}>{datos.apellido}</Text>
        </Text>
      </View>

      <View style={estilos.contenido}>
        <View style={estilos.hoja}>
          <View style={estilos.filaPersona}>
            <View style={estilos.avatar}>
              <Text style={estilos.avatarTexto}>{datos.iniciales}</Text>
            </View>

            <View style={estilos.centro}>
              <Text style={estilos.resumen}>
                {datos.calificacion === null
                  ? `${datos.viajes} viajes`
                  : `${datos.viajes} viajes · ${datos.calificacion.toFixed(1)}`}
              </Text>
              <Text style={estilos.desde}>{`Miembro desde ${datos.desde}`}</Text>
            </View>

            {/* El punto se sienta en el hueco que la etiqueta reserva a su
                izquierda, que es lo que hace que la pastilla mida lo mismo. */}
            {datos.verificado ? (
              <View style={estilos.insignia}>
                <View style={estilos.punto} />
                <Text style={estilos.insigniaTexto}>Verificado</Text>
              </View>
            ) : null}
          </View>

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
        </View>

        <View style={estilos.lista}>
          {filas.map((f, i) => (
            <Pressable
              key={f.etiqueta}
              accessibilityRole="button"
              accessibilityLabel={f.valor ? `${f.etiqueta}, ${f.valor}` : f.etiqueta}
              onPress={f.alPulsar}
              style={[estilos.fila, i < filas.length - 1 && estilos.filaConLinea]}
            >
              <Text style={estilos.filaEtiqueta}>{f.etiqueta}</Text>
              {f.valor ? <Text style={estilos.filaValor}>{f.valor}</Text> : null}
              <Avanza />
            </Pressable>
          ))}
        </View>

        <View style={estilos.aviso}>
          <Escudo tamano={19} tinta={color.azul500} />
          <Text style={estilos.avisoTexto}>{datos.queTeFalta}</Text>
        </View>

        <Text style={estilos.enlacesDelPie}>Ayuda · Términos · Cerrar sesión</Text>
      </View>

      <View style={estilos.pie}>
        <BarraDePestanas
          valor="Perfil"
          alCambiar={(v) => {
            if (v === 'Buscar') router.push('/(pasajero)');
            if (v === 'Mensajes') router.push('/(pasajero)/chat');
          }}
          pestanas={[
            { valor: 'Buscar', etiqueta: 'Buscar', icono: (a) => <Lupa tinta={tinta(a)} /> },
            {
              valor: 'Mis viajes',
              etiqueta: 'Mis viajes',
              icono: (a) => <Carro tamano={21} tinta={tinta(a)} />,
            },
            { valor: 'Mensajes', etiqueta: 'Mensajes', icono: (a) => <Chat tinta={tinta(a)} /> },
            { valor: 'Perfil', etiqueta: 'Perfil', icono: (a) => <Persona tinta={tinta(a)} /> },
          ]}
        />
      </View>
    </View>
  );
}

const tinta = (activo: boolean) => (activo ? color.rojo600 : color.ink700);

/** Miles con espacio duro: en español los kilómetros se separan así, sin punto. */
const conMiles = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** La punta que dice que la fila lleva a otro sitio. No está en `@/ui/iconos`. */
function Avanza() {
  return (
    <Svg viewBox="0 0 24 24" width={17} height={17} fill="none">
      <Path
        d="M9 6l6 6-6 6"
        stroke={color.ink300}
        strokeWidth={1.7}
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
    maxWidth: 390,
    width: '100%',
    alignSelf: 'center',
    ...(Platform.OS === 'web' ? { height: 844, maxHeight: 844 } : null),
  },

  cabecera: { paddingHorizontal: 26 },
  epigrafeCampo: {
    fontSize: 11,
    lineHeight: 15.95,
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.campoTexto,
    fontFamily: familia,
  },
  titular: {
    fontSize: 30,
    lineHeight: 31.8,
    letterSpacing: -1.35,
    fontWeight: '400',
    color: '#fff',
    marginTop: 12,
    fontFamily: familia,
  },
  titularFuerte: { fontWeight: '600' },

  contenido: { flex: 1, minHeight: 0, paddingHorizontal: 22, paddingTop: 24 },

  hoja: {
    backgroundColor: color.blanco,
    borderRadius: 28,
    padding: 20,
    ...sombra.hoja,
  },
  filaPersona: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radio.cuadrado,
    backgroundColor: color.rojo100,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarTexto: {
    fontSize: 22.4,
    lineHeight: 32.48,
    fontWeight: '600',
    letterSpacing: -0.448,
    color: color.rojo700,
    fontFamily: familia,
  },
  centro: { flex: 1, minWidth: 0 },
  resumen: {
    fontSize: 19,
    lineHeight: 27.55,
    fontWeight: '600',
    letterSpacing: -0.665,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  desde: {
    fontSize: 13,
    lineHeight: 18.85,
    color: color.ink600,
    marginTop: 3,
    fontFamily: familia,
  },
  insignia: {
    height: 22,
    borderRadius: radio.pastilla,
    justifyContent: 'center',
    backgroundColor: VERDE_FONDO,
  },
  punto: {
    position: 'absolute',
    left: 8,
    top: 8,
    width: 6,
    height: 6,
    borderRadius: radio.pastilla,
    backgroundColor: VERDE_TINTA,
    opacity: 0.85,
  },
  insigniaTexto: {
    paddingLeft: 20,
    paddingRight: 8,
    fontSize: 11,
    lineHeight: 15.95,
    fontWeight: '500',
    letterSpacing: -0.055,
    color: VERDE_TINTA,
    fontFamily: familia,
  },

  cifras: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: color.bordeSutil,
  },
  cifra: { flex: 1 },
  cifraEtiqueta: {
    fontSize: 11,
    lineHeight: 15.95,
    fontWeight: '600',
    letterSpacing: 11 * TRACK_MICRO,
    textTransform: 'uppercase',
    color: color.ink400,
    fontFamily: familia,
  },
  cifraValor: {
    fontSize: 20,
    lineHeight: 29,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: color.ink900,
    marginTop: 5,
    fontFamily: familia,
    ...tabular,
  },

  lista: {
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderRadius: radio.l,
    paddingHorizontal: 18,
    paddingVertical: 2,
    marginTop: 12,
  },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 15 },
  filaConLinea: { borderBottomWidth: 1, borderBottomColor: color.bordeSutil },
  filaEtiqueta: {
    flex: 1,
    fontSize: 16,
    lineHeight: 23.2,
    fontWeight: '500',
    letterSpacing: -0.24,
    color: color.ink900,
    fontFamily: familia,
  },
  filaValor: {
    fontSize: 13.5,
    lineHeight: 19.575,
    color: color.ink500,
    fontFamily: familia,
  },

  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: color.azul50,
    borderWidth: 1,
    borderColor: color.azul100,
    borderRadius: radio.l,
    paddingVertical: 15,
    paddingHorizontal: 17,
    marginTop: 12,
  },
  avisoTexto: {
    flex: 1,
    fontSize: 13.5,
    // 1.4, no la interlínea del cuerpo: el aviso va más apretado que el resto.
    lineHeight: 18.9,
    color: color.ink700,
    fontFamily: familia,
  },

  enlacesDelPie: {
    marginTop: 'auto',
    paddingTop: 14,
    paddingHorizontal: 4,
    paddingBottom: 22,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18.85,
    color: color.ink500,
    fontFamily: familia,
  },

  pie: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 22 },
});
