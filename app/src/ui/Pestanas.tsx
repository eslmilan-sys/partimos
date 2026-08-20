/**
 * Las cuatro pestañas de abajo, con su destino puesto.
 *
 * **Por qué existe.** Las cinco pantallas que llevan barra repetían la misma
 * lista de cuatro y solo una pasaba `alCambiar`: en las otras cuatro la barra
 * se dibujaba y no hacía nada. Pulsar «Mensajes» desde el panel del conductor
 * no llevaba a ninguna parte.
 *
 * Que el destino viva aquí y no en cada pantalla es lo que hace que no puedan
 * volver a separarse. `BarraDePestanas` sigue siendo la pieza de dibujo; esto
 * es la de navegación.
 */

import { StyleSheet, View } from 'react-native';

import { useRouter } from 'expo-router';

import { BarraDePestanas } from './BarraDePestanas';
import { Carro, Chat, Lupa, Mas, Persona } from './iconos';
import { color } from './tokens';

/** El nombre de cada pestaña es su valor: no hay una clave aparte que mantener. */
export type Pestana = 'Buscar' | 'Mis viajes' | 'Mensajes' | 'Perfil';

/**
 * A dónde va cada una. «Mis viajes» es la del pasajero —los puestos que has
 * pedido—; el panel del conductor se abre desde ahí, no desde la barra.
 */
const A_DONDE: Record<Pestana, string> = {
  Buscar: '/(pasajero)',
  'Mis viajes': '/(conductor)/misviajes',
  Mensajes: '/(pasajero)/conversaciones',
  Perfil: '/(cuenta)/cuenta',
};

const tinta = (activo: boolean) => (activo ? color.rojo600 : color.ink700);

const LAS_CUATRO = [
  { valor: 'Buscar', etiqueta: 'Buscar', icono: (a: boolean) => <Lupa tinta={tinta(a)} /> },
  {
    valor: 'Mis viajes',
    etiqueta: 'Mis viajes',
    icono: (a: boolean) => <Carro tamano={21} tinta={tinta(a)} />,
  },
  { valor: 'Mensajes', etiqueta: 'Mensajes', icono: (a: boolean) => <Chat tinta={tinta(a)} /> },
  { valor: 'Perfil', etiqueta: 'Perfil', icono: (a: boolean) => <Persona tinta={tinta(a)} /> },
];

type Props = {
  /** En cuál estás. La pestaña en la que ya estás no navega. */
  valor: Pestana;
  /** El cuadrado rojo de publicar. Solo lo llevan las pantallas de búsqueda. */
  conPublicar?: boolean;
};

export function Pestanas({ valor, conPublicar = false }: Props) {
  const router = useRouter();

  return (
    /**
     * EL MARCO DE LA BARRA VIVE AQUÍ.
     *
     * Cada pantalla envolvía la barra en su propio `pie`, y no todas con los
     * mismos números: unas con 26 de lado y 10 abajo, otras con 14 y 22. Se
     * notaba al pasar de una a otra —la pastilla cambiaba de ancho y saltaba
     * de altura— y era imposible que no volviera a pasar mientras el número
     * estuviera escrito once veces.
     */
    <View style={estilos.marco}>
    <BarraDePestanas
      valor={valor}
      pestanas={LAS_CUATRO}
      alCambiar={(v) => {
        if (v === valor) return;
        const destino = A_DONDE[v as Pestana];
        if (destino) router.push(destino as never);
      }}
      fab={
        conPublicar
          ? {
              etiqueta: 'Publicar un viaje',
              icono: <Mas tamano={20} tinta="#fff" />,
              alPulsar: () => router.push('/(conductor)/publicar'),
            }
          : undefined
      }
    />
    </View>
  );
}

const estilos = StyleSheet.create({
  /* Separada del borde: es una pastilla que flota sobre la página, no una
     barra pegada abajo. 22 debajo deja sitio al indicador del iPhone. */
  marco: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 22 },
});
