/**
 * LA PUERTA DE LA APP.
 *
 * Antes esto era el índice de las 48 pantallas, que es una herramienta de
 * trabajo y no un producto: quien abría el enlace caía en una lista de fichas
 * técnicas en vez de en Partimos. El índice sigue existiendo, en `/pantallas`.
 *
 * Con sesión se entra directo a buscar —volver a pedir la cuenta a quien ya
 * la tiene es la manera más rápida de perderlo—; sin ella, la apertura `4a`,
 * que es donde el traspaso pone registrarse y entrar.
 *
 * Se espera a saber antes de mandar a ninguna parte: redirigir mientras
 * Supabase todavía lee su almacén expulsaría a quien sí tiene sesión.
 */

import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Redirect } from 'expo-router';

import { MODO } from '@/servicios/_fuente';
import { useSesion } from '@/servicios/sesion';
import { color } from '@/ui/tokens';

/** En simulado no hay autenticación: se entra como la persona del traspaso. */
const DEL_RECORRIDO = '99999999-9999-4999-8999-999999999999';

/**
 * La demo también empieza por la apertura — quien prueba tiene que ver el
 * recorrido entero, láminas incluidas. Pero solo la PRIMERA vez: ni volver a
 * `/` ni RECARGAR la página debe reiniciarle el paseo, así que la marca vive
 * en sessionStorage y no en una variable que muere con cada carga. Cerrar la
 * pestaña y volver, eso sí, vuelve a empezar — es una visita nueva.
 */
const VISTA = 'partimos.apertura.vista';
const yaLaVio = () => {
  try {
    return globalThis.sessionStorage?.getItem(VISTA) === '1';
  } catch {
    return false;
  }
};
const recordarla = () => {
  try {
    globalThis.sessionStorage?.setItem(VISTA, '1');
  } catch {
    /* sin almacén no hay memoria: se verá dos veces, que no rompe nada */
  }
};

export default function Puerta() {
  const { id, preguntando } = useSesion(DEL_RECORRIDO);

  if (preguntando) {
    return (
      <View style={estilos.espera}>
        <ActivityIndicator color={color.ink900} />
      </View>
    );
  }

  if (MODO === 'simulado' && !yaLaVio()) {
    recordarla();
    return <Redirect href="/(cuenta)/apertura" />;
  }

  return <Redirect href={id ? '/(pasajero)' : '/(cuenta)/apertura'} />;
}

const estilos = StyleSheet.create({
  espera: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.sand100,
  },
});
