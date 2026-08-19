/**
 * El catálogo de carros de `14b`. **Sin texto libre**: marca, modelo y año se
 * eligen de aquí, y los puestos salen del modelo.
 *
 * Que no haya texto libre no es una comodidad de formulario: es lo que hace
 * que un carro se pueda reconocer al subir y que dos anuncios del mismo modelo
 * se lean igual.
 *
 * Los valores son los del traspaso, tal cual. En producción esto es una tabla
 * o el endpoint de un proveedor; la firma del servicio no cambia.
 */

export const MARCAS = ['Toyota', 'Hyundai', 'Kia', 'Nissan', 'Mitsubishi'] as const;
export type Marca = (typeof MARCAS)[number];

export const MODELOS: Record<Marca, string[]> = {
  Toyota: ['Corolla', 'Yaris', 'Hilux', 'Rush'],
  Hyundai: ['Elantra', 'Accent', 'Tucson', 'Creta'],
  Kia: ['Rio', 'Picanto', 'Sportage'],
  Nissan: ['Sentra', 'Versa', 'Frontier'],
  Mitsubishi: ['Lancer', 'Mirage', 'Outlander'],
};

export const ANIOS = ['2024', '2022', '2020', '2019', '2017', '2015', '2012'] as const;

/**
 * Puestos que ofrece el modelo, ya descontado el del conductor. Lo que no está
 * aquí son cinco plazas, cuatro para pasajeros.
 */
export const PUESTOS_POR_MODELO: Record<string, number> = {
  Hilux: 4,
  Frontier: 4,
  Rush: 6,
  Outlander: 6,
  Tucson: 4,
  Sportage: 4,
  Creta: 4,
  Picanto: 3,
};

export const PUESTOS_POR_DEFECTO = 4;

/** Los colores que se enseñan como muestras, no como lista escrita. */
export const COLORES: { nombre: string; muestra: string }[] = [
  { nombre: 'Blanco', muestra: '#F5F3F0' },
  { nombre: 'Gris', muestra: '#9B9AA0' },
  { nombre: 'Negro', muestra: '#2B2A2E' },
  { nombre: 'Plata', muestra: '#C9C8CC' },
  { nombre: 'Rojo', muestra: '#C0392B' },
  { nombre: 'Azul', muestra: '#2C5F8A' },
];

/**
 * La categoría con la que se calcula el aporte. La saca el modelo, no la
 * escribe el conductor: si eligiera él, elegiría la que más le paga.
 */
export function categoriaDe(modelo: string): 'economy' | 'standard' | 'suv' {
  if (['Hilux', 'Frontier', 'Rush', 'Outlander', 'Tucson', 'Sportage', 'Creta'].includes(modelo)) {
    return 'suv';
  }
  if (['Yaris', 'Picanto', 'Rio', 'Mirage'].includes(modelo)) return 'economy';
  return 'standard';
}
