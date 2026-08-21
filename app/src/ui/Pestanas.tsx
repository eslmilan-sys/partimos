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
import { Boleto, Chat, Lupa, Mas, Persona } from './iconos';
import { color } from './tokens';

/** El nombre de cada pestaña es su valor: no hay una clave aparte que mantener. */
export type Pestana = 'Buscar' | 'Mis viajes' | 'Publicar' | 'Mensajes' | 'Perfil';

/**
 * A dónde va cada una. «Mis viajes» es la del pasajero —los puestos que has
 * pedido—; el panel del conductor se abre desde ahí, no desde la barra.
 */
const A_DONDE: Record<Pestana, string> = {
  Buscar: '/(pasajero)',
  'Mis viajes': '/(conductor)/misviajes',
  Publicar: '/(conductor)/publicar',
  Mensajes: '/(pasajero)/conversaciones',
  Perfil: '/(cuenta)/cuenta',
};

/**
 * La tinta de los iconos sobre la barra oscura. El activo se queda blanco: el
 * rojo hace de indicador arriba, que es lo que se ve de un vistazo, y un
 * dibujo rojo sobre azul profundo da 3,89:1 — justo, y sin margen.
 */
const tinta = (activo: boolean) => (activo ? '#fff' : 'rgba(255,255,255,.62)');

/**
 * LOS CUATRO DESTINOS, CON EL ICONO QUE LES CORRESPONDE.
 *
 * Dos correcciones del turno 14 viven aquí:
 *
 * **El boleto, no el carro.** «Mis viajes» llevaba un icono de carro, y el
 * carro es el vehículo, no la lista de puestos que has reservado. El sistema
 * corrige el mismo error en su propia barra —allí era un formulario— y lo
 * resuelve con un boleto. Detrás de esta pestaña hay reservas: un boleto.
 *
 * **Relleno cuando estás, contorno cuando no.** Antes la pestaña activa se
 * distinguía sólo por ser más blanca, y una diferencia de color es justo lo
 * que no llega a quien no distingue ese color. Ahora cambia la forma.
 */
const LAS_CUATRO = [
  {
    valor: 'Buscar',
    etiqueta: 'Buscar',
    icono: (a: boolean) => <Lupa tinta={tinta(a)} lleno={a} />,
  },
  {
    valor: 'Mis viajes',
    etiqueta: 'Mis viajes',
    icono: (a: boolean) => <Boleto tamano={21} tinta={tinta(a)} lleno={a} />,
  },
  {
    valor: 'Mensajes',
    etiqueta: 'Mensajes',
    icono: (a: boolean) => <Chat tinta={tinta(a)} lleno={a} />,
  },
  {
    valor: 'Perfil',
    etiqueta: 'Perfil',
    icono: (a: boolean) => <Persona tinta={tinta(a)} lleno={a} />,
  },
];

type Props = {
  /** En cuál estás. La pestaña en la que ya estás no navega. */
  valor: Pestana;
};

/**
 * **Publicar está siempre.**
 *
 * Antes era `conPublicar`, y solo lo llevaban las pantallas de búsqueda. Pero
 * ofrecer un viaje es la mitad del producto, no un añadido de una pantalla: si
 * el botón no está en la barra, quien entra a buscar puesto nunca descubre que
 * también puede llevar a alguien. Y la pantalla de publicar ya calcula sin
 * carro y sin cédula, así que no hay ningún caso en que llevar allí sea un
 * callejón.
 */
export function Pestanas({ valor }: Props) {
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
      fab={{
        etiqueta: 'Publicar un viaje',
        icono: <Mas tamano={19} tinta="#fff" />,
        activo: valor === 'Publicar',
        alPulsar: () => {
          if (valor === 'Publicar') return;
          router.push('/(conductor)/publicar');
        },
      }}
    />
    </View>
  );
}

const estilos = StyleSheet.create({
  /* Separada del borde: es una pastilla que flota sobre la página, no una
     barra pegada abajo. 20 debajo deja sitio al indicador del iPhone. */
  marco: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },
});
