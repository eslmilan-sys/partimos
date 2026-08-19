/**
 * El único interruptor entre datos simulados y producción.
 *
 * Ninguna pantalla importa de aquí: solo lo hacen los servicios, y ellos leen
 * `fuente` sin saber cuál de las dos les tocó.
 *
 * La comprobación que importa es la anotación de tipo de `produccion`. Si el
 * adaptador de Supabase deja de exportar algo que el simulado exporta —o lo
 * exporta con otra forma— esto no compila. La superficie de las dos no puede
 * separarse en silencio.
 */

import * as simulado from './simulado';
import * as supabase from './supabase';

export type Modo = 'simulado' | 'supabase';

export const MODO: Modo = (process.env.EXPO_PUBLIC_FUENTE as Modo) ?? 'simulado';

const produccion: typeof simulado = supabase;

export const fuente: typeof simulado = MODO === 'supabase' ? produccion : simulado;

/**
 * Deja el almacén listo. En simulado no hay nada que esperar: las filas ya
 * están en memoria. En producción hay que traerlas antes del primer render,
 * porque los servicios las leen como arreglos y un arreglo vacío es una app
 * vacía.
 */
export const cargar = (): Promise<void> =>
  MODO === 'supabase' ? supabase.cargar() : Promise.resolve();
