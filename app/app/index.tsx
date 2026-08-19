/**
 * Índice de trabajo: las 58 pantallas del traspaso, agrupadas por tablero.
 *
 * Se borra cuando la navegación de verdad esté puesta y `3a` sea la entrada.
 * Mientras tanto es la manera de abrir cualquiera de ellas en el teléfono.
 */

import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { color, espacio, familia, interlinea, radio, texto } from '@/ui/tokens';

type Pantalla = { id: string; titulo: string; ruta: Parameters<typeof Link>[0]['href'] };

const TABLEROS: { nombre: string; pantallas: Pantalla[] }[] = [
  {
    nombre: 'A · Pasajero: buscar y entrar',
    pantallas: [
      { id: '4a', titulo: 'Apertura', ruta: '/(cuenta)/apertura' },
      { id: '1a', titulo: 'Bienvenida', ruta: '/(cuenta)/bienvenida' },
      { id: '3a', titulo: 'Inicio', ruta: '/(pasajero)' },
      { id: '1b 3b', titulo: 'Resultados', ruta: '/(pasajero)/resultados' },
      { id: '3c', titulo: 'Resultados con el destino de fondo', ruta: '/(pasajero)/destino' },
      { id: '5a', titulo: 'Detalle del viaje', ruta: '/(pasajero)/viaje' },
      { id: '6b', titulo: 'Perfil público', ruta: '/(pasajero)/perfil' },
      { id: '1c', titulo: 'La puerta', ruta: '/(cuenta)/puerta' },
      { id: '4b–4d', titulo: 'Registro', ruta: '/(cuenta)/registro' },
      { id: '4e', titulo: 'Entrar', ruta: '/(cuenta)/entrar' },
      { id: '14e', titulo: 'Entrar · versión larga', ruta: '/(cuenta)/acceso' },
    ],
  },
  {
    nombre: 'B · Pasajero: pagar y viajar',
    pantallas: [
      { id: '7a', titulo: 'Reserva', ruta: '/(pasajero)/reservar' },
      { id: '7b', titulo: 'Pago del aporte', ruta: '/(pasajero)/pagar' },
      { id: '9a', titulo: 'Métodos de pago', ruta: '/(pasajero)/metodos' },
      { id: '14c', titulo: 'Añadir método', ruta: '/(pasajero)/metodo-nuevo' },
      { id: '12a', titulo: 'Pantalla bloqueada', ruta: '/(avisos)/bloqueada' },
      { id: '11b', titulo: 'Bandeja de avisos', ruta: '/(avisos)/avisos' },
      { id: '6c', titulo: 'Chat del viaje', ruta: '/(pasajero)/chat' },
      { id: '16a', titulo: 'Conversaciones', ruta: '/(pasajero)/conversaciones' },
      { id: '1d', titulo: 'Ya · lista', ruta: '/(pasajero)/ya' },
      { id: '1e', titulo: 'Ya · mapa', ruta: '/(pasajero)/ya-mapa' },
      { id: '1f', titulo: 'Código de abordaje', ruta: '/(pasajero)/codigo' },
      { id: '1h', titulo: 'En ruta', ruta: '/(pasajero)/ruta' },
      { id: '1i', titulo: 'Llegada y liberación', ruta: '/(pasajero)/llegada' },
      { id: '1j', titulo: 'Calificar', ruta: '/(pasajero)/calificar' },
    ],
  },
  {
    nombre: 'C · Conductor: de la cédula al pago',
    pantallas: [
      { id: '6d', titulo: 'Verificación de cédula', ruta: '/(conductor)/cedula' },
      { id: '6a', titulo: 'Tu cuenta', ruta: '/(cuenta)/cuenta' },
      { id: '14b', titulo: 'Registrar el carro', ruta: '/(conductor)/carro' },
      { id: '5c', titulo: 'Publicar', ruta: '/(conductor)/publicar' },
      { id: '5d', titulo: 'El tope', ruta: '/(conductor)/tope' },
      { id: '7c', titulo: 'Puestos y maletas', ruta: '/(conductor)/puestos' },
      { id: '10a', titulo: 'Panel del conductor', ruta: '/(conductor)/panel' },
      { id: '5b', titulo: 'Mis viajes', ruta: '/(conductor)/misviajes' },
      { id: '14d', titulo: 'Editar el viaje', ruta: '/(conductor)/editar' },
      { id: '11a', titulo: 'Solicitudes de puesto', ruta: '/(conductor)/solicitudes' },
      { id: '15e', titulo: 'Quién pide puesto', ruta: '/(conductor)/solicitante' },
      { id: '1g', titulo: 'Código de abordaje · conductor', ruta: '/(conductor)/abordaje' },
      { id: '10b', titulo: 'Lo que te han aportado', ruta: '/(conductor)/aportes' },
    ],
  },
  {
    nombre: 'D · Deshacer, reclamar, preguntar',
    pantallas: [
      { id: '14a', titulo: 'Cancelar el puesto', ruta: '/(ayuda)/cancelar' },
      { id: '7d', titulo: 'Reembolso', ruta: '/(ayuda)/reembolso' },
      { id: '15c', titulo: 'Estado del reembolso', ruta: '/(ayuda)/estado' },
      { id: '15b', titulo: 'Ayuda', ruta: '/(ayuda)' },
      { id: '15d', titulo: 'Reportar', ruta: '/(ayuda)/reportar' },
      { id: '15a', titulo: 'Rutas guardadas', ruta: '/(pasajero)/rutas' },
      { id: '8a', titulo: 'Ajustes', ruta: '/(cuenta)/ajustes' },
      { id: '16b', titulo: 'Cómo se paga', ruta: '/(ayuda)/pagos' },
      { id: '16c', titulo: 'Comprobante', ruta: '/(pasajero)/comprobante' },
      { id: '16d', titulo: 'Permiso de avisos', ruta: '/(avisos)/permiso' },
    ],
  },
];

export default function Indice() {
  const cuantas = TABLEROS.reduce((n, t) => n + t.pantallas.length, 0);

  return (
    <ScrollView contentContainerStyle={estilos.pagina}>
      <Text style={estilos.titulo}>Partimos</Text>
      <Text style={estilos.sub}>{`Las ${cuantas} pantallas del traspaso, por tablero.`}</Text>

      {TABLEROS.map((t) => (
        <View key={t.nombre} style={estilos.tablero}>
          <Text style={estilos.nombreTablero}>{t.nombre}</Text>

          {t.pantallas.map((p) => (
            <Link key={p.id} href={p.ruta} style={estilos.enlace}>
              <Text style={estilos.enlaceId}>{p.id}</Text>
              <Text style={estilos.enlaceTitulo}>{`   ${p.titulo}`}</Text>
            </Link>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  pagina: {
    padding: espacio.gutter,
    paddingBottom: 60,
    backgroundColor: color.sand100,
    maxWidth: 390,
    width: '100%',
    alignSelf: 'center',
  },
  titulo: { ...texto.titular, color: color.ink900, marginTop: 40 },
  sub: { ...texto.cuerpo, color: color.ink600, marginTop: 6 },

  tablero: { marginTop: espacio.seccion },
  nombreTablero: { ...texto.epigrafe, color: color.rojo600, marginBottom: 10 },

  enlace: {
    backgroundColor: color.blanco,
    borderRadius: radio.m,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  enlaceId: {
    fontSize: 12,
    lineHeight: interlinea(12),
    fontWeight: '600',
    color: color.rojo600,
    fontFamily: familia,
  },
  enlaceTitulo: {
    fontSize: 15,
    lineHeight: interlinea(15),
    color: color.ink900,
    fontFamily: familia,
  },
});
