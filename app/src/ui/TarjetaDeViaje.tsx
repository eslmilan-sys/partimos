/**
 * La tarjeta de un viaje en los resultados (`1b`, `3b`, `3c`).
 *
 * Enseña todo antes de pedir cuenta: hora, duración, aporte, puestos, dónde
 * arranca y dónde termina, el equipaje en una de sus dos cadenas, y quién
 * maneja. La verificación de cédula no se enseña como distintivo: todos los
 * conductores la tienen.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar, Insignia, Pastilla } from './controles';
import { formatearDineroRedondo, tabular } from './dinero';
import { Estrella, Maleta } from './iconos';
import { familia, color, radio } from './tokens';

export type ViajeEnTarjeta = {
  id: string;
  salida: string;
  duracion: string;
  aporteCentavos: number;
  puestosLibres: number;
  origen: string;
  destino: string;
  llegada: string;
  equipaje: 'Acepta maletas' | 'Solo mochila';
  conductor: { nombre: string; calificacion: number | null; carro: string };
  canal: string;
};

export function TarjetaDeViaje({
  viaje,
  alPulsar,
}: {
  viaje: ViajeEnTarjeta;
  alPulsar?: () => void;
}) {
  // Un solo puesto libre se marca en rojo: es lo que queda por decidir rápido.
  const ultimo = viaje.puestosLibres === 1;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Salida ${viaje.salida}, ${formatearDineroRedondo(viaje.aporteCentavos)} por puesto, con ${viaje.conductor.nombre}`}
      onPress={alPulsar}
      style={estilos.tarjeta}
    >
      <View style={estilos.filaSuperior}>
        <Text style={estilos.cuando}>{`${viaje.salida} · ${viaje.duracion}`}</Text>
        <View style={estilos.filaPrecio}>
          <Text style={estilos.precio}>
            {String(Math.round(viaje.aporteCentavos / 100))}
            <Text style={estilos.precioSimbolo}> $</Text>
          </Text>
          <Pastilla
            fondo={ultimo ? color.rojo100 : color.azul100}
            tinta={ultimo ? color.rojo700 : color.azul700}
            estilo={{ marginTop: 2 }}
          >
            {viaje.puestosLibres === 1 ? '1 puesto' : `${viaje.puestosLibres} puestos`}
          </Pastilla>
        </View>
      </View>

      <View style={estilos.recorrido}>
        <View style={estilos.parada}>
          <View style={estilos.puntoLleno} />
          <Text style={estilos.paradaTexto}>{viaje.origen}</Text>
        </View>
        <View style={estilos.parada}>
          <View style={estilos.puntoVacio} />
          <Text style={estilos.paradaTexto}>{viaje.destino}</Text>
          <Text style={estilos.llegada}>{viaje.llegada}</Text>
        </View>
      </View>

      <View style={estilos.filaEquipaje}>
        <Maleta tamano={13} />
        <Text style={estilos.equipaje}>{viaje.equipaje}</Text>
      </View>

      <View style={estilos.separador} />

      <View style={estilos.filaConductor}>
        <Avatar nombre={viaje.conductor.nombre} tamano={36} tono="rojo" />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={estilos.nombre}>{viaje.conductor.nombre}</Text>
          <View style={estilos.filaCalificacion}>
            <Estrella />
            <Text style={estilos.calificacion}>
              {`${viaje.conductor.calificacion?.toFixed(1) ?? 'Nuevo'} · ${viaje.conductor.carro}`}
            </Text>
          </View>
        </View>
        <Insignia fondo={color.rojo50} tinta={color.rojo700}>
          {viaje.canal}
        </Insignia>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    backgroundColor: color.blanco,
    borderWidth: 1,
    borderColor: color.bordeSutil,
    borderRadius: radio.l,
    padding: 15,
  },
  filaSuperior: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 },
  cuando: { fontSize: 13, lineHeight: 18.85, color: color.ink600, fontFamily: familia, ...tabular },
  filaPrecio: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  precio: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -1.04,
    lineHeight: 24.7,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  // El símbolo tiene su propia caja de línea, más apretada que la de la cifra:
  // así se apoya en la misma base en vez de estirar la fila.
  precioSimbolo: { fontSize: 15, lineHeight: 14.25, fontWeight: '500' },

  recorrido: { gap: 8, marginTop: 11 },
  parada: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  puntoLleno: { width: 9, height: 9, borderRadius: radio.pastilla, backgroundColor: color.azul700 },
  puntoVacio: {
    width: 9,
    height: 9,
    borderRadius: radio.pastilla,
    backgroundColor: color.blanco,
    borderWidth: 1.5,
    borderColor: color.bordePorDefecto,
  },
  paradaTexto: { fontSize: 15.5, lineHeight: 22.47, fontWeight: '500', letterSpacing: -0.28, color: color.ink900, fontFamily: familia },
  llegada: { marginLeft: 'auto', fontSize: 13, lineHeight: 18.85, color: color.ink400, fontFamily: familia, ...tabular },

  filaEquipaje: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 9 },
  equipaje: { fontSize: 12.5, lineHeight: 18.12, color: color.ink600, fontFamily: familia },

  separador: { height: 1, backgroundColor: color.bordeSutil, marginTop: 13, marginBottom: 12 },

  filaConductor: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  nombre: { fontSize: 14.5, lineHeight: 21.02, fontWeight: '500', letterSpacing: -0.22, color: color.ink900, fontFamily: familia },
  filaCalificacion: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  calificacion: { fontSize: 13, lineHeight: 18.85, color: color.ink600, fontFamily: familia, ...tabular },
});
