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
import { Estrella, Maleta, Mascota, SinHumo } from './iconos';
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
  /** Las dos condiciones del carro: solo se dicen cuando cambian algo. */
  aceptaMascotas: boolean;
  sePuedeFumar: boolean;
  conductor: { nombre: string; calificacion: number | null; carro: string };
  canal: string;
};

export function TarjetaDeViaje({
  viaje,
  marca,
  alPulsar,
}: {
  viaje: ViajeEnTarjeta;
  /** «Más temprano», y solo en una tarjeta: dos marcas no marcan nada. */
  marca?: string;
  alPulsar?: () => void;
}) {
  // Un solo puesto libre se marca en rojo: es lo que queda por decidir rápido.
  const ultimo = viaje.puestosLibres === 1;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Salida ${viaje.salida}, ${formatearDineroRedondo(viaje.aporteCentavos)} por puesto, con ${viaje.conductor.nombre}`}
      onPress={alPulsar}
      /* Se hunde un poco al tocarla: sin respuesta al dedo, una tarjeta
         entera que navega no parece que se pueda tocar. */
      style={({ pressed }) => [estilos.tarjeta, pressed && estilos.pulsada]}
    >
      {marca ? (
        <View style={estilos.marca}>
          <Text style={estilos.marcaTexto}>{marca}</Text>
        </View>
      ) : null}

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

      {/* Las condiciones del carro. La mascota solo se nombra cuando sí van
          —es lo raro y lo que alguien busca—; el humo, cuando sí se fuma, por
          la misma razón: lo normal no hace falta decirlo en una lista. */}
      <View style={estilos.filaEquipaje}>
        <Maleta tamano={13} />
        <Text style={estilos.equipaje}>{viaje.equipaje}</Text>
        {viaje.aceptaMascotas ? (
          <>
            <Mascota tamano={13} />
            <Text style={estilos.equipaje}>Mascotas</Text>
          </>
        ) : null}
        {viaje.sePuedeFumar ? (
          <>
            <SinHumo tamano={13} />
            <Text style={estilos.equipaje}>Se fuma</Text>
          </>
        ) : null}
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
    padding: 14,
  },
  /** En rojo y en versalitas, como un sello: es la única de la lista. */
  marca: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radio.pastilla,
    backgroundColor: color.rojo50,
  },
  marcaTexto: {
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.05,
    textTransform: 'uppercase',
    color: color.rojo700,
    fontFamily: familia,
  },
  pulsada: { backgroundColor: color.sand100, borderColor: color.bordePorDefecto },
  filaSuperior: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 },
  cuando: { fontSize: 13.5, lineHeight: 18.85, color: color.ink600, fontFamily: familia, ...tabular },
  filaPrecio: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  /* 31 y no 26: el aporte es lo que decide, y en una lista de cuatro
     tarjetas era del mismo tamaño que la hora. */
  precio: {
    fontSize: 27,
    fontWeight: '700',
    letterSpacing: -1.08,
    lineHeight: 30,
    color: color.ink900,
    fontFamily: familia,
    ...tabular,
  },
  /* El símbolo comparte la caja de línea de la cifra.
     Con una propia —16 contra 29,5— el navegador lo centraba en su caja y no
     en la base de la cifra: el `$` caía tres píxeles por debajo del número y
     el precio se leía roto. Misma `lineHeight`, mismo apoyo. */
  precioSimbolo: { fontSize: 15.5, lineHeight: 30, fontWeight: '600', color: color.ink600 },

  recorrido: { gap: 6, marginTop: 9 },
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
  llegada: { marginLeft: 'auto', fontSize: 13.5, lineHeight: 18.85, color: color.ink500, fontFamily: familia, ...tabular },

  filaEquipaje: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7, marginTop: 8 },
  equipaje: { fontSize: 12.5, lineHeight: 18.12, color: color.ink600, fontFamily: familia },

  separador: { height: 1, backgroundColor: color.bordeSutil, marginTop: 11, marginBottom: 10 },

  filaConductor: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  nombre: { fontSize: 14, lineHeight: 21.02, fontWeight: '500', letterSpacing: -0.22, color: color.ink900, fontFamily: familia },
  filaCalificacion: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  calificacion: { fontSize: 13.5, lineHeight: 18.85, color: color.ink600, fontFamily: familia, ...tabular },
});
