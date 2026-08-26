/**
 * «O continuar con» — la fila de proveedores, en UN solo sitio.
 *
 * **Por qué existe este archivo.** La misma fila estaba escrita tres veces
 * —en `entrar`, en `puerta`, y en ningún sitio en `registro`— y las tres
 * habían divergido: `entrar` tenía Google, Facebook y Apple; `puerta` solo
 * Google y Apple; `registro` no tenía nada y pedía el correo en tres pasos
 * como si no hubiera otra forma de abrir una cuenta. El dueño lo vio de
 * inmediato al usarla: «j'ai l'impression que j'ai deux pages différentes,
 * c'est chelou» (26-08-2026).
 *
 * Copiar una fila de botones es barato; mantenerla sincronizada en tres
 * pantallas, no. Con una sola pieza, añadir un proveedor es un renglón y
 * aparece en los tres sitios a la vez — que es exactamente lo que no pasó
 * cuando Facebook entró.
 *
 * **Entrar y registrarse son el mismo gesto por aquí.** OAuth no distingue:
 * si la cuenta no existe, se crea; si existe, se entra. Por eso la misma
 * fila vale para las dos pantallas sin cambiar una palabra.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { SIN_PROVEEDOR, entrarCon } from '@/servicios/cuenta';

import { color, espacio, familia, pulsado } from './tokens';

/** La G de Google, en sus cuatro colores oficiales. */
function LogoGoogle() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Path
        d="M19.6 10.23c0-.68-.06-1.36-.18-2.03H10v3.85h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.89-1.74 2.98-4.3 2.98-7.34Z"
        fill="#4285F4"
      />
      <Path
        d="M10 20c2.7 0 4.96-.89 6.62-2.42l-3.24-2.51c-.9.61-2.05.96-3.38.96-2.6 0-4.8-1.75-5.59-4.1H1.07v2.59A10 10 0 0 0 10 20Z"
        fill="#34A853"
      />
      <Path d="M4.41 11.93a5.99 5.99 0 0 1 0-3.83V5.5H1.07a10 10 0 0 0 0 9l3.34-2.57Z" fill="#FBBC05" />
      <Path
        d="M10 3.98c1.47 0 2.79.5 3.82 1.5l2.87-2.87A10 10 0 0 0 1.07 5.5l3.34 2.6C5.2 5.73 7.4 3.98 10 3.98Z"
        fill="#EA4335"
      />
    </Svg>
  );
}

/** La f de Facebook en su círculo azul oficial (#1877F2). */
function LogoFacebook() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M20 10a10 10 0 1 0-11.56 9.88v-6.99H5.9V10h2.54V7.8c0-2.5 1.49-3.89 3.77-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V10h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 20 10Z"
        fill="#1877F2"
      />
    </Svg>
  );
}

/**
 * La manzana, negra, para el botón blanco. La versión clara del botón de
 * Apple es oficial de sus guías — y así la única losa oscura de la pantalla
 * deja de competir con el CTA: en el v6 la superficie de tinta es de
 * Filtros y de Publicar, no de un proveedor.
 */
function LogoApple() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M13.9 10.6c0-2 1.6-3 1.7-3-1-1.4-2.4-1.6-2.9-1.6-1.2-.1-2.4.7-3 .7-.6 0-1.6-.7-2.6-.7-1.3 0-2.6.8-3.3 2-1.4 2.4-.4 6 1 8 .7 1 1.5 2.1 2.5 2 1 0 1.4-.6 2.6-.6 1.2 0 1.5.6 2.6.6 1.1 0 1.8-1 2.4-2 .8-1.1 1.1-2.2 1.1-2.3 0 0-2.1-.8-2.1-3.1ZM11.9 4.4c.5-.7.9-1.6.8-2.6-.8 0-1.7.6-2.3 1.2-.5.6-.9 1.6-.8 2.5.9.1 1.8-.4 2.3-1.1Z"
        fill="#000"
      />
    </Svg>
  );
}

const PROVEEDORES = [
  { quien: 'google', nombre: 'Google', Logo: LogoGoogle },
  { quien: 'facebook', nombre: 'Facebook', Logo: LogoFacebook },
  { quien: 'apple', nombre: 'Apple', Logo: LogoApple },
] as const;

export function EntrarCon({
  /** Qué decir si el proveedor todavía no está activado en Supabase. */
  alFallar,
  /** El rótulo del separador. «Continuar» sirve para entrar y para abrir. */
  titulo = 'O continuar con',
  /**
   * El aire lateral. Por defecto el de una pantalla; la hoja modal de
   * `puerta` ya trae el suyo y pasa 0 para no acolcharlo dos veces.
   */
  margen = espacio.gutter,
}: {
  alFallar: (mensaje: string) => void;
  titulo?: string;
  margen?: number;
}) {
  return (
    <>
      <View style={[estilos.separador, { paddingHorizontal: margen }]}>
        <View style={estilos.raya} />
        <Text style={estilos.oTexto}>{titulo}</Text>
        <View style={estilos.raya} />
      </View>

      {/* Con tres proveedores los nombres escritos ya no caben en la fila sin
          apretarse: van los logos solos — el separador de arriba ya dice qué
          son, y el nombre completo vive en el rótulo de accesibilidad. */}
      <View style={[estilos.sociales, { paddingHorizontal: margen }]}>
        {PROVEEDORES.map(({ quien, nombre, Logo }) => (
          <Pressable
            key={quien}
            accessibilityRole="button"
            accessibilityLabel={`Continuar con ${nombre}`}
            onPress={async () => {
              if (!(await entrarCon(quien))) alFallar(SIN_PROVEEDOR(nombre));
            }}
            style={({ pressed }) => [estilos.social, pressed && pulsado.boton]}
          >
            <Logo />
          </Pressable>
        ))}
      </View>
    </>
  );
}

const estilos = StyleSheet.create({
  separador: {
    paddingTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  raya: { flex: 1, height: 1, backgroundColor: color.ink200 },
  oTexto: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '500',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: color.ink600,
    fontFamily: familia,
  },
  sociales: { paddingTop: 16, flexDirection: 'row', gap: 10 },
  social: {
    flex: 1,
    height: 52,
    borderRadius: 18,
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordePorDefecto,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
});
