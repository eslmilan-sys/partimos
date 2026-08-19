/**
 * Registrar el carro — pantalla `14b`.
 *
 * **Sin texto libre**: marca, modelo y año se eligen del catálogo, y los
 * puestos salen del modelo. No es comodidad de formulario — es lo que hace
 * que el pasajero reconozca el carro al subir y que dos anuncios del mismo
 * modelo se lean igual.
 *
 * La foto por detrás con la placa legible es **obligatoria** por lo mismo:
 * sin ella, «un Elantra gris» no identifica nada en una terminal.
 */

import type { Vehicle } from '@/tipos';

import { fuente } from './_fuente';

const demora = <T,>(valor: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(valor), ms));

export type Catalogo = {
  marcas: string[];
  /** Modelos de la marca elegida. Cambiar de marca reinicia el modelo. */
  modelos: string[];
  anios: string[];
  colores: { nombre: string; muestra: string }[];
};

export type BorradorDeCarro = {
  marca: string;
  modelo: string;
  anio: string;
  color: string;
  placa: string;
  /** Lo pone el modelo, no el conductor. */
  puestos: number;
  foto: string | null;
};

export function catalogo(marca?: string): Catalogo {
  const elegida = (marca ?? fuente.MARCAS[0]) as keyof typeof fuente.MODELOS;
  return {
    marcas: [...fuente.MARCAS],
    modelos: fuente.MODELOS[elegida] ?? [],
    anios: [...fuente.ANIOS],
    colores: fuente.COLORES,
  };
}

/** Los puestos que ofrece el modelo, ya sin el del conductor. */
export function puestosDe(modelo: string): number {
  return fuente.PUESTOS_POR_MODELO[modelo] ?? fuente.PUESTOS_POR_DEFECTO;
}

export function borradorInicial(): BorradorDeCarro {
  const marca = fuente.MARCAS[1]; // Hyundai, el del recorrido del diseño
  const modelo = fuente.MODELOS[marca][0];
  return {
    marca,
    modelo,
    anio: '2019',
    color: 'Gris',
    placa: 'AB-1234',
    puestos: puestosDe(modelo),
    foto: null,
  };
}

/** Cambiar de marca reinicia el modelo, y el modelo fija los puestos. */
export function cambiarMarca(borrador: BorradorDeCarro, marca: string): BorradorDeCarro {
  const modelo = fuente.MODELOS[marca as keyof typeof fuente.MODELOS]?.[0] ?? '';
  return { ...borrador, marca, modelo, puestos: puestosDe(modelo) };
}

export function cambiarModelo(borrador: BorradorDeCarro, modelo: string): BorradorDeCarro {
  return { ...borrador, modelo, puestos: puestosDe(modelo) };
}

/** «AB-••••» — la placa entera sólo la ve quien va a subirse. */
export function placaTapada(placa: string): string {
  const [prefijo] = placa.split('-');
  return `${prefijo}-••••`;
}

export type Resumen = { linea: string; detalle: string };

export function resumen(b: BorradorDeCarro): Resumen {
  return {
    linea: `${b.marca} ${b.modelo} ${b.color.toLowerCase()}`,
    detalle: `${placaTapada(b.placa)} · ${b.anio} · ${b.puestos} puestos`,
  };
}

export function sePuedeGuardar(b: BorradorDeCarro): boolean {
  return Boolean(b.marca && b.modelo && b.anio && b.color && b.placa && b.foto);
}

export async function guardarCarro(duenoId: string, b: BorradorDeCarro): Promise<Vehicle> {
  if (!b.foto) throw new Error('Falta la foto del carro por detrás');

  const sufijo = String(fuente.vehiculos.length + 2).padStart(12, '0');
  const carro: Vehicle = {
    id: `44444444-4444-4444-8444-${sufijo}`,
    owner_id: duenoId,
    category_code: fuente.categoriaDe(b.modelo),
    make: b.marca,
    model: b.modelo,
    color: b.color.toLowerCase(),
    year: Number(b.anio),
    // La tabla guarda las plazas del carro; los puestos que se ofrecen son
    // una menos, la del conductor.
    seats_total: b.puestos + 1,
    plate_last3: b.placa.replace('-', '').slice(-3),
    is_active: true,
    created_at: new Date().toISOString(),
    consumption_l_100km: null,
    rate_per_km_cents: null,
    photo_path: b.foto,
  };

  fuente.vehiculos.push(carro);
  fuente.placasCompletas[carro.id] = b.placa;
  return demora(carro);
}

export async function carrosDe(duenoId: string): Promise<Vehicle[]> {
  return demora(fuente.vehiculos.filter((v) => v.owner_id === duenoId && v.is_active));
}
