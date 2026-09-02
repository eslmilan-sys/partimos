/**
 * La superficie del almacén simulado — y, por lo tanto, el contrato.
 *
 * Es una lista escrita a mano y no un `export *` a propósito: esto es lo que
 * un almacén tiene que saber hacer, y `../index.ts` comprueba que el adaptador
 * de Supabase lo cumpla entero. Lo que no está aquí —los identificadores fijos
 * del recorrido del diseño, el reloj del simulado— es andamiaje de este
 * almacén y no sale de esta carpeta.
 */

export {
  viajes, paradas, reservas, mensajes, pagos,
  guardarViaje, guardarParada, guardarReserva, guardarPago, guardarMensaje, marcarMensajesLeidos, suscribirseAMensajes, actualizarViaje, actualizarReserva, actualizarPago,
} from './almacen';

export { ciudades, corredores, paradasDeLaRuta, ciudadesPedidas, pedirCiudad } from './geografia';

export {
  categorias, perfiles, vehiculos, reputacion, resenas, placasCompletas,
  actualizarPerfil, guardarVehiculo, actualizarVehiculo, guardarResena,
} from './personas';

export {
  politicas, cancelaciones, reembolsos, creditos, lotes, pagosAlConductor, libro,
  yappyDelConductor, guardarCancelacion, guardarReembolso,
} from './dinero';

export { avisos, marcarAvisoLeido, marcarTodosLeidos } from './avisos';

export {
  verificaciones, incidencias, reportesDeNoShow, rutinas,
  guardarIncidencia, cambiarAvisoDeRutina, guardarRuta,
} from './seguridad';

/** El catálogo de carros no es un dato: es una lista cerrada del producto. */
export * from './catalogo';

/**
 * LA CIUDAD QUE SE DIJO AL REGISTRARSE, desde los metadatos de la cuenta.
 *
 * En el recorrido no hay registro que recordar, así que no hay nada que
 * devolver. Existe para que el contrato con la fuente real esté cerrado.
 */
export async function ciudadDelRegistro(): Promise<string | null> {
  return null;
}
