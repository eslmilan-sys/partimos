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

import { nuevoId } from './_id';
import { fuente } from './_fuente';
import { supabase } from './_fuente/supabase/cliente';

const SIMULADO = (process.env.EXPO_PUBLIC_FUENTE ?? 'simulado') !== 'supabase';

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
  /**
   * LO QUE TIENE EL CARRO (0045, pedido del dueño con capturas de BlaBlaCar).
   *
   * Va con el CARRO y no con cada viaje: el aire no se instala el viernes y
   * se quita el domingo. Preguntarlo en cada publicación sería hacer teclear
   * cada semana lo mismo.
   */
  aire: boolean;
  usb: boolean;
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

/** La carrocería del modelo — la usa la silueta del resumen. */
export function categoriaDe(modelo: string): 'economy' | 'standard' | 'suv' {
  return fuente.categoriaDe(modelo);
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
    /* VACÍA. Estuvo precargada con «AB-1234» y en el teléfono parecía que la
       app ya conocía la placa — se vio el 25-08. Un dato que identifica al
       carro lo escribe su dueño, no el formulario. */
    placa: '',
    puestos: puestosDe(modelo),
    aire: true,
    usb: false,
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

/**
 * «•••777» — sólo los tres últimos, que es lo único que la base guarda.
 *
 * Antes partía por el guion y enseñaba el prefijo: con «JS66777», escrita
 * sin guion, el prefijo ERA la placa entera y el resumen la publicaba
 * completa bajo un texto que prometía lo contrario. Visto en el teléfono
 * del dueño el 25-08. Ahora no hay nada que partir: se cuenta desde el
 * final, que es de donde salen los `plate_last3`.
 */
export function placaTapada(placa: string): string {
  const limpia = placa.replace(/[^A-Za-z0-9]/g, '');
  if (!limpia) return '';
  return `••• ${limpia.slice(-3).toUpperCase()}`;
}

export type Resumen = { linea: string; detalle: string };

export function resumen(b: BorradorDeCarro): Resumen {
  return {
    linea: `${b.marca} ${b.modelo} ${b.color.toLowerCase()}`,
    detalle: `${placaTapada(b.placa)} · ${b.anio} · ${b.puestos} puestos`,
  };
}

/**
 * LO QUE EL CARRO OFRECE, dicho en una lista con icono — como lo enseña
 * BlaBlaCar en la ficha del viaje, y como el dueño pidió el 27-08-2026.
 *
 * Sólo se dice lo que HAY. «Sin aire acondicionado» no es una comodidad que
 * anunciar; callarlo es más honesto que darle la vuelta a la frase, y quien
 * lo necesita ya sabe preguntar por el chat.
 */
export type ComodidadDelCarro = { clave: 'aire' | 'usb'; texto: string };

export function comodidadesDe(v: {
  has_ac?: boolean | null;
  has_usb?: boolean | null;
}): ComodidadDelCarro[] {
  const salida: ComodidadDelCarro[] = [];
  if (v.has_ac) salida.push({ clave: 'aire', texto: 'Aire acondicionado' });
  if (v.has_usb) salida.push({ clave: 'usb', texto: 'Enchufe USB' });
  return salida;
}

/**
 * LA FOTO, DE VERDAD. La pantalla entrega lo que salió de la cámara o de la
 * galería, ya reducido; esto decide dónde vive:
 *
 * - En simulado no hay dónde subirla y no hace falta: el `data:` URI que
 *   llega de vista sirve tal cual como foto en memoria.
 * - Contra la base real sube al bucket `carros` (migración 0038), en la
 *   carpeta del dueño — la política de storage exige que el primer tramo del
 *   camino sea el `auth.uid()` de quien sube. Se guarda la URL pública, que
 *   es lo que cualquier pantalla puede pintar sin pedir permiso.
 */
export async function subirFotoDelCarro(
  duenoId: string,
  datos: Blob,
  vista: string,
): Promise<string> {
  if (SIMULADO) return vista;

  const camino = `${duenoId}/${nuevoId()}.jpg`;
  const { error } = await supabase.storage
    .from('carros')
    .upload(camino, datos, { contentType: 'image/jpeg' });
  if (error) throw new Error('No se pudo subir la foto. Revisa la conexión y prueba otra vez.');

  return supabase.storage.from('carros').getPublicUrl(camino).data.publicUrl;
}

export function sePuedeGuardar(b: BorradorDeCarro): boolean {
  return Boolean(b.marca && b.modelo && b.anio && b.color && b.placa && b.foto);
}

export async function guardarCarro(duenoId: string, b: BorradorDeCarro): Promise<Vehicle> {
  if (!b.foto) throw new Error('Falta la foto del carro por detrás');

  const carro: Vehicle = {
    id: nuevoId(),
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
    has_ac: b.aire,
    has_usb: b.usb,
  };

  const guardado = await fuente.guardarVehiculo(carro);
  /* La placa entera NO tiene columna —`vehicles` solo guarda `plate_last3`—,
     asi que vive en memoria a proposito: enseñar la placa completa de alguien
     a quien todavia no has conocido es lo que el diseño evita. */
  fuente.placasCompletas[guardado.id] = b.placa;
  return demora(guardado);
}

export async function carrosDe(duenoId: string): Promise<Vehicle[]> {
  return demora(fuente.vehiculos.filter((v) => v.owner_id === duenoId && v.is_active));
}

/**
 * CUÁNDO SE VENCE TU LICENCIA (0047).
 *
 * Va en `profiles`, no en `vehicles`: la licencia es de la persona, y quien
 * tiene dos carros no tiene dos licencias. Se guarda desde la pantalla del
 * carro porque es donde vive el papeleo de quien maneja, pero lo que se
 * escribe es el perfil.
 *
 * **Sólo la fecha.** Ni foto ni número, igual que la cédula (R6).
 */
export async function guardarVencimientoDeLicencia(
  perfilId: string,
  vence: string | null,
): Promise<void> {
  await fuente.actualizarPerfil(perfilId, { license_expires_on: vence });
}

/** Lo que la pantalla necesita para rellenar el campo al abrirlo. */
export async function vencimientoDeLicencia(perfilId: string): Promise<string | null> {
  return fuente.perfiles.find((p) => p.id === perfilId)?.license_expires_on ?? null;
}
