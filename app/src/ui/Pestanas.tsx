/**
 * Las cuatro pestañas de abajo, con su destino puesto.
 *
 * **Por qué existe.** Las cinco pantallas que llevan barra repetían la misma
 * lista de cuatro y solo una pasaba `alCambiar`: en las otras cuatro la barra
 * se dibujaba y no hacía nada. Que el destino viva aquí es lo que impide que
 * vuelvan a separarse. `BarraDePestanas` sigue siendo la pieza de dibujo;
 * esto es la de navegación.
 *
 * **Los rótulos son los del v6** — Buscar · Viajes · Publicar · Chats ·
 * Perfil — y el icono de Viajes es el carro del v6, que es el que el diseño
 * pone detrás de ese rótulo. Los `valor` internos no cambian: son la clave
 * que las pantallas ya pasan.
 */

import { View } from 'react-native';

import { useRouter } from 'expo-router';

import { BarraDePestanas } from './BarraDePestanas';
import { Carro, Chat, Lupa, Mas, Persona } from './iconos';
import { color } from './tokens';

/** El nombre de cada pestaña es su valor: no hay una clave aparte que mantener. */
export type Pestana = 'Buscar' | 'Mis viajes' | 'Publicar' | 'Mensajes' | 'Perfil';

/**
 * A dónde va cada una. «Viajes» es la del pasajero —los puestos que has
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
 * LO ACTIVO, COMO LO DIBUJA EL v6: icono rojo con trazo 2.2, rótulo
 * `#C11730` a peso 500. En reposo, el gris de icono `#6C8A93` a 1.75.
 * Color, peso Y trazo cambian a la vez — el color nunca va solo.
 */
const tinta = (activo: boolean) => (activo ? color.rojo500 : color.inkIcono);
const grueso = (activo: boolean) => (activo ? 2.2 : 1.75);

const LAS_CUATRO = [
  {
    valor: 'Buscar',
    etiqueta: 'Buscar',
    icono: (a: boolean) => <Lupa tamano={23} tinta={tinta(a)} grueso={grueso(a)} />,
  },
  {
    valor: 'Mis viajes',
    etiqueta: 'Viajes',
    icono: (a: boolean) => <Carro tamano={23} tinta={tinta(a)} grueso={grueso(a)} />,
  },
  {
    valor: 'Mensajes',
    etiqueta: 'Chats',
    icono: (a: boolean) => <Chat tamano={23} tinta={tinta(a)} grueso={grueso(a)} />,
  },
  {
    valor: 'Perfil',
    etiqueta: 'Perfil',
    icono: (a: boolean) => <Persona tamano={23} tinta={tinta(a)} grueso={grueso(a)} />,
  },
];

type Props = {
  /** En cuál estás. La pestaña en la que ya estás no navega. */
  valor: Pestana;
  /** Cuentas de insignia por pestaña — «Viajes · 2» en el dibujo. */
  insignias?: Partial<Record<Pestana, number>>;
};

/**
 * **Publicar está siempre.** Ofrecer un viaje es la mitad del producto: si el
 * botón no está en la barra, quien entra a buscar puesto nunca descubre que
 * también puede llevar a alguien. La pantalla de publicar ya calcula sin
 * carro y sin cédula, así que llevar allí nunca es un callejón.
 */
export function Pestanas({ valor, insignias }: Props) {
  const router = useRouter();

  return (
    /* En el v6 la barra va de lado a lado, pegada abajo: sin marco propio. */
    <View>
      <BarraDePestanas
        valor={valor}
        pestanas={LAS_CUATRO.map((p) => ({ ...p, insignia: insignias?.[p.valor as Pestana] }))}
        alCambiar={(v) => {
          if (v === valor) return;
          const destino = A_DONDE[v as Pestana];
          if (destino) router.push(destino as never);
        }}
        fab={{
          etiqueta: 'Publicar un viaje',
          icono: <Mas tamano={21} tinta="#fff" grueso={2.2} />,
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
