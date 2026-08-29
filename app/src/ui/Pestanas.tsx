/**
 * Las cuatro pestañas de abajo, con su destino puesto.
 *
 * **Por qué existe.** Las cinco pantallas que llevan barra repetían la misma
 * lista de cuatro y solo una pasaba `alCambiar`: en las otras cuatro la barra
 * se dibujaba y no hacía nada. Que el destino viva aquí es lo que impide que
 * vuelvan a separarse. `BarraDePestanas` sigue siendo la pieza de dibujo;
 * esto es la de navegación.
 *
 * **Los rótulos son los del v6** — Buscar · Viajes · Publicar · Bandeja ·
 * Perfil — y el icono de Viajes es el carro del v6, que es el que el diseño
 * pone detrás de ese rótulo. Los `valor` internos no cambian: son la clave
 * que las pantallas ya pasan.
 *
 * **«Chats» se llama BANDEJA desde el 28-08-2026** (pedido del dueño). El
 * rótulo prometía conversaciones y la pastilla contaba conversaciones, pero
 * lo que a uno le llega no son sólo mensajes: es que le aceptaron el puesto,
 * que le pidieron uno, que sale mañana. Dos sitios donde mirar —la campana
 * de arriba y la pestaña de abajo— con dos cuentas distintas era pedirle a
 * la gente que llevara la contabilidad. Ahora hay UNA bandeja, un número, y
 * la campana del inicio va al mismo sitio.
 *
 * **Y el número se cuenta aquí, una vez.** Ojo con lo que parece obvio y no
 * lo es: la cuenta NO es «mensajes sin leer + avisos sin leer». Un mensaje
 * sin leer YA ES un aviso desde el 27-08 (`kind: 'mensaje_nuevo'`), así que
 * sumarlos contaría cada mensaje dos veces. `bandeja().sinLeer` es la cuenta
 * entera, y por eso es la única que se pide.
 */

import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { useFocusEffect, useRouter } from 'expo-router';

import { bandeja } from '@/servicios/avisos';
import { useMiId } from '@/servicios/sesion';

import { BarraDePestanas } from './BarraDePestanas';
import { Campana, Carro, Lupa, Mas, Persona } from './iconos';
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
  Mensajes: '/(avisos)/avisos',
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
    etiqueta: 'Bandeja',
    /* La campana y no la burbuja: aquí ya no hay sólo conversaciones. */
    icono: (a: boolean) => <Campana tamano={23} tinta={tinta(a)} grueso={grueso(a)} />,
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
  /**
   * QUIÉN ERES. Opcional: si la pantalla ya lo tiene en la mano se pasa, y si
   * no, la barra lo pregunta ella misma. Contra la base es lo mismo —
   * `useMiId` devuelve la sesión de verdad y no mira el argumento—; en
   * simulado ahorra tener que darle a cuatro pantallas de búsqueda un dato
   * que no usan para nada más.
   */
  yo?: string | null;
  /** Cuentas de insignia por pestaña — «Viajes · 2» en el dibujo. */
  insignias?: Partial<Record<Pestana, number>>;
};

/**
 * **Publicar está siempre.** Ofrecer un viaje es la mitad del producto: si el
 * botón no está en la barra, quien entra a buscar puesto nunca descubre que
 * también puede llevar a alguien. La pantalla de publicar ya calcula sin
 * carro y sin cédula, así que llevar allí nunca es un callejón.
 */
/** La persona del traspaso — sólo cuenta en simulado (ver `useMiId`). */
const DEL_RECORRIDO = '99999999-9999-4999-8999-999999999999';

export function Pestanas({ valor, yo, insignias }: Props) {
  const router = useRouter();
  const deLaSesion = useMiId(DEL_RECORRIDO);
  const quien = yo === undefined ? deLaSesion : yo;
  const [sinLeer, setSinLeer] = useState(0);

  /**
   * Se recuenta al VOLVER, no sólo al montar: se sale de la barra para abrir
   * un hilo, y al regresar la pastilla tiene que haber bajado. Con un
   * `useEffect` normal la pantalla de atrás sigue viva y la cuenta se queda
   * congelada en lo que era antes de leer.
   */
  useFocusEffect(
    useCallback(() => {
      if (!quien) {
        setSinLeer(0);
        return;
      }
      let vivo = true;
      bandeja(quien)
        .then((b) => {
          if (vivo) setSinLeer(b.sinLeer);
        })
        .catch(() => {});
      return () => {
        vivo = false;
      };
    }, [quien]),
  );

  /* La de la bandeja se cuenta sola; el resto puede venir de fuera. Estar EN
     la bandeja no enciende la pastilla: lo que se ve ya se está leyendo. */
  const cuentas: Partial<Record<Pestana, number>> = {
    ...insignias,
    Mensajes: valor === 'Mensajes' || sinLeer === 0 ? undefined : sinLeer,
  };

  return (
    /* En el v6 la barra va de lado a lado, pegada abajo: sin marco propio. */
    <View>
      <BarraDePestanas
        valor={valor}
        pestanas={LAS_CUATRO.map((p) => ({ ...p, insignia: cuentas[p.valor as Pestana] }))}
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
